/**
 * Legal Reasoning API Route
 * 
 * Performs autonomous legal causation analysis on provided documents.
 * Implements the Intent → Action → Harm causal chain with but-for analysis.
 * 
 * Endpoint: POST /api/legal-reasoning
 * 
 * Phase 28.Legal: Pearl's Causal Blueprint for Legal Reasoning
 * 
 * SECURITY v2: Added request limits and input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { LegalDocumentExtractor } from '@/lib/extractors/legal-extractor';
import { ButForAnalyzer } from '@/lib/services/but-for-analyzer';
import { PrecedentMatcher } from '@/lib/services/precedent-matcher';
import { LegalSCMTemplate } from '@/lib/ai/legal-scm-template';
import { evaluateInterventionGate } from '@/lib/services/identifiability-gate';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  buildCounterfactualTrace,
  buildCounterfactualTraceRef,
  persistCounterfactualTrace,
} from '@/lib/services/counterfactual-trace';
import {
  LegalCase,
  LegalCausalChain,
  LegalReasoningResponse,
  LegalVerdict,
  LegalStreamEvent,
  HarmSeverity,
} from '@/types/legal';

// Severity ranking for deduplication (higher = more severe)
const SEVERITY_RANK: Record<HarmSeverity, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
  catastrophic: 4,
};

interface LegalGateSummary {
  allowed: boolean;
  allowedOutputClass: 'association_only' | 'intervention_inferred' | 'intervention_supported';
  allowedChains: LegalCausalChain[];
  blockedChains: number;
  missingConfounders: string[];
  rationale: string;
}

function harmSeverityToScore(severity: HarmSeverity): number {
  switch (severity) {
    case 'catastrophic':
      return 1;
    case 'severe':
      return 0.8;
    case 'moderate':
      return 0.6;
    default:
      return 0.4;
  }
}

function buildLegalAdjustmentSet(chain: LegalCausalChain): string[] {
  return [
    ...(chain.action.intent ? ['Intent'] : []),
    ...(chain.interveningCauses && chain.interveningCauses.length > 0 ? ['InterveningCause'] : []),
  ];
}

async function getAuthenticatedUserId(): Promise<string | undefined> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

async function attachCounterfactualTracesToLegalChains(
  chains: LegalCausalChain[],
  legalSCM: LegalSCMTemplate,
  userId?: string
): Promise<{ chains: LegalCausalChain[]; traceIds: string[] }> {
  const traceIds: string[] = [];
  const tracedChains: LegalCausalChain[] = [];

  for (const chain of chains) {
    const adjustmentSet = buildLegalAdjustmentSet(chain);
    const trace = buildCounterfactualTrace(legalSCM, {
      modelRef: {
        modelKey: 'legal_intent_action_harm',
        version: 'legal-template-v1',
      },
      intervention: {
        variable: 'Action',
        value: 0,
      },
      outcome: 'Harm',
      observedWorld: {
        Intent: chain.intent?.confidence ?? 0.5,
        Action: 1,
        Harm: harmSeverityToScore(chain.harm.severity),
        InterveningCause: chain.interveningCauses && chain.interveningCauses.length > 0 ? 1 : 0,
        Foreseeability: chain.foreseeability ?? 0.5,
      },
      assumptions: [
        chain.butForAnalysis.reasoning || 'But-for analysis rationale unavailable.',
        'Counterfactual trace uses deterministic legal SCM graph propagation.',
      ],
      adjustmentSet,
      method: 'deterministic_graph_diff',
      uncertainty: 'low',
    });

    const persisted = await persistCounterfactualTrace({
      trace,
      sourceFeature: 'legal',
      userId,
    });
    traceIds.push(trace.traceId);
    tracedChains.push({
      ...chain,
      butForAnalysis: {
        ...chain.butForAnalysis,
        counterfactualTrace: buildCounterfactualTraceRef(trace, persisted.persisted),
      },
    });
  }

  return { chains: tracedChains, traceIds };
}

/**
 * Deduplicate causal chains by grouping on Action ID
 * 
 * Problem: The A×H cartesian product creates many chains with same Intent+Action
 * but different Harms. This creates redundant chains like:
 *   Chain 1: Action A → Harm H1
 *   Chain 2: Action A → Harm H2
 *   Chain 3: Action A → Harm H3
 * 
 * Solution: Group by Action, keep highest-severity harm chain, track related harms
 * 
 * @param chains - Raw chains from A×H cartesian product
 * @returns Deduplicated chains (one per unique action)
 */
function deduplicateCausalChains(chains: LegalCausalChain[]): LegalCausalChain[] {
  // Group chains by action ID
  const actionGroups = new Map<string, LegalCausalChain[]>();
  
  for (const chain of chains) {
    const actionId = chain.action.id;
    if (!actionGroups.has(actionId)) {
      actionGroups.set(actionId, []);
    }
    actionGroups.get(actionId)!.push(chain);
  }
  
  // For each action group, select the best representative chain
  const deduplicatedChains: LegalCausalChain[] = [];
  
  for (const [actionId, group] of actionGroups) {
    if (group.length === 0) continue;
    
    // Sort by: 1) Harm severity (descending), 2) Causal strength (descending)
    group.sort((a, b) => {
      const severityDiff = SEVERITY_RANK[b.harm.severity] - SEVERITY_RANK[a.harm.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.causalStrength - a.causalStrength;
    });
    
    // Take the highest-severity chain as representative
    const representative = group[0];
    
    // If there are multiple harms for this action, note them
    // Store related harms in evidence quality field for UI awareness
    if (group.length > 1) {
      representative.evidenceQuality = representative.evidenceQuality || 'moderate';
      // Note: The UI can show "and X other related harms" based on group size
      console.log(`[Dedup] Action ${actionId}: kept 1 chain, merged ${group.length - 1} related harms`);
    }
    
    deduplicatedChains.push(representative);
  }
  
  console.log(`[Dedup] Reduced ${chains.length} chains to ${deduplicatedChains.length} unique action chains`);
  
  return deduplicatedChains;
}

function evaluateLegalCausalGate(
  chains: LegalCausalChain[],
  legalSCM: LegalSCMTemplate
): LegalGateSummary {
  if (chains.length === 0) {
    return {
      allowed: false,
      allowedOutputClass: 'association_only',
      allowedChains: [],
      blockedChains: 0,
      missingConfounders: [],
      rationale: 'No legal causal chains passed baseline but-for/proximate checks.',
    };
  }

  const allowedChains: LegalCausalChain[] = [];
  const blockedGates: Array<{
    allowedOutputClass: 'association_only' | 'intervention_inferred' | 'intervention_supported';
    missingConfounders: string[];
  }> = [];

  for (const chain of chains) {
    const adjustmentSet = [
      ...(chain.action.intent ? ['Intent'] : []),
      ...(chain.interveningCauses && chain.interveningCauses.length > 0 ? ['InterveningCause'] : []),
    ];
    const knownConfounders = ['Intent', ...(chain.interveningCauses && chain.interveningCauses.length > 0 ? ['InterveningCause'] : [])];

    const gate = evaluateInterventionGate(legalSCM, {
      treatment: 'Action',
      outcome: 'Harm',
      adjustmentSet,
      knownConfounders,
    });

    if (gate.allowed) {
      allowedChains.push(chain);
    } else {
      blockedGates.push({
        allowedOutputClass: gate.allowedOutputClass,
        missingConfounders: gate.identifiability.missingConfounders,
      });
    }
  }

  const missingConfounders = Array.from(
    new Set(blockedGates.flatMap((gate) => gate.missingConfounders))
  );
  const allowedOutputClass =
    allowedChains.length > 0
      ? 'intervention_supported'
      : blockedGates.some((gate) => gate.allowedOutputClass === 'intervention_inferred')
        ? 'intervention_inferred'
        : 'association_only';

  const blockedChains = blockedGates.length;
  const rationale =
    blockedChains === 0
      ? 'Legal causal chains satisfy identifiability assumptions for intervention-level claims.'
      : `Downgraded ${blockedChains} chain(s) due to missing confounder controls (${missingConfounders.join(', ') || 'unspecified'}).`;

  return {
    allowed: allowedChains.length > 0,
    allowedOutputClass,
    allowedChains,
    blockedChains,
    missingConfounders,
    rationale,
  };
}

// Max execution time for complex legal analysis
export const maxDuration = 120;

// SECURITY: Request limits to prevent DoS
const REQUEST_LIMITS = {
  MAX_DOCUMENTS: 10,          // Maximum documents per request
  MAX_DOCUMENT_SIZE: 150000,  // 150KB per document
  MAX_TOTAL_SIZE: 500000,     // 500KB total
  MAX_CASE_TITLE_LENGTH: 200, // Max title length
};

/**
 * Validate and sanitize request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  // Check documents array
  if (!body.documents || !Array.isArray(body.documents)) {
    return { valid: false, error: 'Invalid request: documents must be an array' };
  }

  if (body.documents.length === 0) {
    return { valid: false, error: 'No documents provided' };
  }

  if (body.documents.length > REQUEST_LIMITS.MAX_DOCUMENTS) {
    return { 
      valid: false, 
      error: `Too many documents: maximum ${REQUEST_LIMITS.MAX_DOCUMENTS} allowed, got ${body.documents.length}` 
    };
  }

  // Check individual document sizes
  let totalSize = 0;
  for (let i = 0; i < body.documents.length; i++) {
    const doc = body.documents[i];
    if (typeof doc !== 'string') {
      return { valid: false, error: `Document ${i + 1} is not a string` };
    }
    
    const docSize = new Blob([doc]).size;
    if (docSize > REQUEST_LIMITS.MAX_DOCUMENT_SIZE) {
      return { 
        valid: false, 
        error: `Document ${i + 1} too large: ${Math.round(docSize / 1024)}KB exceeds ${Math.round(REQUEST_LIMITS.MAX_DOCUMENT_SIZE / 1024)}KB limit` 
      };
    }
    totalSize += docSize;
  }

  if (totalSize > REQUEST_LIMITS.MAX_TOTAL_SIZE) {
    return { 
      valid: false, 
      error: `Total request too large: ${Math.round(totalSize / 1024)}KB exceeds ${Math.round(REQUEST_LIMITS.MAX_TOTAL_SIZE / 1024)}KB limit` 
    };
  }

  // Sanitize optional fields
  if (body.caseTitle && body.caseTitle.length > REQUEST_LIMITS.MAX_CASE_TITLE_LENGTH) {
    body.caseTitle = body.caseTitle.slice(0, REQUEST_LIMITS.MAX_CASE_TITLE_LENGTH);
  }

  // Validate case type
  const validCaseTypes = ['tort', 'criminal', 'contract', 'administrative'];
  if (body.caseType && !validCaseTypes.includes(body.caseType)) {
    body.caseType = 'tort'; // Default to tort
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  // Check for streaming request
  const acceptHeader = req.headers.get('accept') || '';
  const isStreaming = acceptHeader.includes('text/event-stream');

  if (isStreaming) {
    return handleStreamingRequest(req, encoder);
  } else {
    return handleStandardRequest(req);
  }
}

/**
 * Handle standard (non-streaming) request
 */
async function handleStandardRequest(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    // SECURITY: Validate request body
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error } as LegalReasoningResponse,
        { status: 400 }
      );
    }
    
    const { documents, caseTitle, jurisdiction, caseType } = body;

    const startTime = performance.now();

    // Initialize services
    const extractor = new LegalDocumentExtractor();
    const butForAnalyzer = new ButForAnalyzer();
    const precedentMatcher = new PrecedentMatcher();
    const legalSCM = new LegalSCMTemplate();

    // Step 1: Extract legal entities, actions, and harms from all documents
    console.log('[LegalReasoning] Extracting from', documents.length, 'documents');
    const extraction = await extractor.extractMultiple(documents);

    if (extraction.entities.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No entities could be extracted from documents. Please provide clearer legal documents.' 
        } as LegalReasoningResponse,
        { status: 400 }
      );
    }

    // Step 2: Build causal chains (Intent → Action → Harm)
    console.log('[LegalReasoning] Building causal chains');
    const rawChains = await buildCausalChains(
      extraction.timeline,
      extraction.harms,
      butForAnalyzer,
      legalSCM
    );

    // Step 2b: Deduplicate chains (eliminate A×H redundancy)
    const deduplicatedChains = deduplicateCausalChains(rawChains);
    const legalGate = evaluateLegalCausalGate(deduplicatedChains, legalSCM);
    const userId = await getAuthenticatedUserId();
    const traced = await attachCounterfactualTracesToLegalChains(legalGate.allowedChains, legalSCM, userId);
    const causalChains = traced.chains;

    // Step 3: Construct legal case
    const legalCase: LegalCase = {
      id: `case-${Date.now()}`,
      title: caseTitle || 'Legal Analysis',
      parties: extraction.entities,
      timeline: extraction.timeline,
      harms: extraction.harms,
      causalChains,
      precedents: [],
      jurisdiction: jurisdiction,
      caseType: caseType || 'tort',
    };

    // Step 4: Find relevant precedents
    console.log('[LegalReasoning] Finding precedents');
    const precedents = await precedentMatcher.findPrecedents(legalCase);
    legalCase.precedents = precedents;

    // Step 5: Generate verdict
    console.log('[LegalReasoning] Generating verdict');
    const verdict = generateVerdict(causalChains, extraction);
    if (legalGate.blockedChains > 0) {
      verdict.caveats = [
        ...(verdict.caveats || []),
        legalGate.rationale,
      ];
    }
    legalCase.verdict = verdict;

    // Step 6: Persist to database (if authenticated)
    await persistCase(legalCase);

    const processingTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      case: legalCase,
      allowedOutputClass: legalGate.allowedOutputClass,
      counterfactualTraceIds: traced.traceIds,
      interventionGate: {
        allowed: legalGate.allowed,
        allowedChains: legalGate.allowedChains.length,
        blockedChains: legalGate.blockedChains,
        missingConfounders: legalGate.missingConfounders,
        rationale: legalGate.rationale,
      },
      processingTimeMs: Math.round(processingTime),
    } as LegalReasoningResponse);

  } catch (error: any) {
    console.error('[LegalReasoning API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Legal reasoning failed' 
      } as LegalReasoningResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle streaming request with SSE
 */
function handleStreamingRequest(req: NextRequest, encoder: TextEncoder): Response {
  const stream = new ReadableStream({
    async start(controller) {
      // Track if stream is still open to prevent "Controller is already closed" errors
      let isStreamOpen = true;
      
      const sendEvent = (event: LegalStreamEvent) => {
        if (!isStreamOpen) {
          // Stream closed by client, silently skip
          return;
        }
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch (err: unknown) {
          // If controller is closed, mark stream as closed
          if (err instanceof Error && err.message.includes('closed')) {
            isStreamOpen = false;
            console.log('[LegalReasoning] Client disconnected, continuing processing silently');
          } else {
            console.error('[LegalReasoning] Failed to send event:', err);
          }
        }
      };
      
      // Helper to safely close the stream
      const safeClose = () => {
        if (isStreamOpen) {
          isStreamOpen = false;
          try {
            controller.close();
          } catch {
            // Already closed, ignore
          }
        }
      };

      try {
        const body = await req.json();
        
        // SECURITY: Validate request body
        const validation = validateRequest(body);
        if (!validation.valid) {
          sendEvent({ event: 'legal_error', message: validation.error || 'Invalid request' });
          safeClose();
          return;
        }
        
        const { documents, caseTitle, jurisdiction, caseType } = body;

        // Initialize services
        const extractor = new LegalDocumentExtractor();
        const butForAnalyzer = new ButForAnalyzer();
        const precedentMatcher = new PrecedentMatcher();
        const legalSCM = new LegalSCMTemplate();

        // Step 1: Extract
        sendEvent({ event: 'legal_extraction_start', documentCount: documents.length });
        const extraction = await extractor.extractMultiple(documents);

        // Emit found entities
        for (const entity of extraction.entities) {
          sendEvent({ event: 'legal_entity_found', entity });
        }

        // Emit found actions
        for (const action of extraction.timeline) {
          sendEvent({ event: 'legal_action_found', action });
        }

        // Emit found harms
        for (const harm of extraction.harms) {
          sendEvent({ event: 'legal_harm_identified', harm });
        }

        // Step 2: Build causal chains with OPTIMIZED batched analysis
        sendEvent({ 
          event: 'but_for_analysis_start', 
          actionId: 'batch', 
          harmId: 'batch' 
        });
        
        // OPTIMIZED: Use batched analysis (single LLM call for all pairs)
        const butForResults = await butForAnalyzer.analyzeMultiple(
          extraction.timeline, 
          extraction.harms
        );
        
        const causalChains: LegalCausalChain[] = [];
        
        // Process results and build chains
        for (const action of extraction.timeline) {
          for (const harm of extraction.harms) {
            const key = `${action.id}->${harm.id}`;
            const butForAnalysis = butForResults.get(key);
            
            if (!butForAnalysis) continue;

            sendEvent({
              event: 'but_for_result',
              actionId: action.id,
              harmId: harm.id,
              result: butForAnalysis.result,
            });

            if (butForAnalysis.result === 'necessary' || butForAnalysis.result === 'both') {
              // Use heuristic validation (no LLM call needed)
              const scmValidation = await legalSCM.validateLegalCausation(
                action.intent?.description || 'unknown intent',
                action.description,
                harm.description
              );

              if (scmValidation.valid || scmValidation.violations.filter(v => v.severity === 'fatal').length === 0) {
                const chain: LegalCausalChain = {
                  intent: action.intent || {
                    type: 'negligent',
                    description: 'Unknown',
                    evidenceSnippets: [],
                    confidence: 0.3,
                  },
                  action,
                  harm,
                  causalStrength: butForAnalysis.confidence,
                  butForAnalysis,
                  interveningCauses: [],
                  proximateCauseEstablished: scmValidation.proximateCausePassed,
                  foreseeability: scmValidation.proximateCausePassed ? 0.8 : 0.3,
                };

                causalChains.push(chain);
                sendEvent({ event: 'causal_chain_established', chain });
              }
            }
          }
        }

        // DEDUPLICATION: Group chains by action to eliminate A×H cartesian product redundancy
        // This reduces chains like [A1→H1, A1→H2, A1→H3] to just [A1→H_highest_severity]
        const deduplicatedChains = deduplicateCausalChains(causalChains);
        const legalGate = evaluateLegalCausalGate(deduplicatedChains, legalSCM);
        const userId = await getAuthenticatedUserId();
        const traced = await attachCounterfactualTracesToLegalChains(legalGate.allowedChains, legalSCM, userId);
        sendEvent({
          event: 'intervention_gate',
          allowed: legalGate.allowed,
          allowedOutputClass: legalGate.allowedOutputClass,
          allowedChains: traced.chains.length,
          blockedChains: legalGate.blockedChains,
          missingConfounders: legalGate.missingConfounders,
          rationale: legalGate.rationale,
          counterfactualTraceIds: traced.traceIds,
        });

        // Construct legal case with deduplicated chains
        const legalCase: LegalCase = {
          id: `case-${Date.now()}`,
          title: caseTitle || 'Legal Analysis',
          parties: extraction.entities,
          timeline: extraction.timeline,
          harms: extraction.harms,
          causalChains: traced.chains,
          precedents: [],
          jurisdiction,
          caseType: caseType || 'tort',
        };

        // Step 3: Find precedents
        sendEvent({ event: 'legal_masa_audit_start', agentCount: 3 });
        const precedents = await precedentMatcher.findPrecedents(legalCase);
        legalCase.precedents = precedents;

        for (const precedent of precedents) {
          sendEvent({ event: 'precedent_found', precedent });
        }

        // Step 4: Generate verdict (use gate-allowed chains only)
        const verdict = generateVerdict(traced.chains, extraction);
        if (legalGate.blockedChains > 0) {
          verdict.caveats = [
            ...(verdict.caveats || []),
            legalGate.rationale,
          ];
        }
        legalCase.verdict = verdict;
        sendEvent({ event: 'legal_verdict_ready', verdict });

        // Persist
        await persistCase(legalCase);

        // Final event
        sendEvent({ event: 'legal_analysis_complete', case: legalCase });
        safeClose();

      } catch (error: any) {
        console.error('[LegalReasoning Streaming] Error:', error);
        sendEvent({ event: 'legal_error', message: error.message || 'Analysis failed' });
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Build causal chains from actions and harms
 */
async function buildCausalChains(
  actions: LegalCase['timeline'],
  harms: LegalCase['harms'],
  butForAnalyzer: ButForAnalyzer,
  legalSCM: LegalSCMTemplate
): Promise<LegalCausalChain[]> {
  const chains: LegalCausalChain[] = [];

  for (const action of actions) {
    for (const harm of harms) {
      // Perform but-for test
      const butForAnalysis = await butForAnalyzer.analyze(action, harm);

      // Only create chain if but-for test passes (necessary or both)
      if (butForAnalysis.result === 'necessary' || butForAnalysis.result === 'both') {
        // Validate with Legal SCM
        const validation = await legalSCM.validateLegalCausation(
          action.intent?.description || 'unknown intent',
          action.description,
          harm.description
        );

        // Accept if no fatal violations (warnings are okay)
        const fatalViolations = validation.violations.filter(v => v.severity === 'fatal');
        
        if (fatalViolations.length === 0) {
          chains.push({
            intent: action.intent || {
              type: 'negligent',
              description: 'Unknown',
              evidenceSnippets: [],
              confidence: 0.3,
            },
            action,
            harm,
            causalStrength: butForAnalysis.confidence,
            butForAnalysis,
            interveningCauses: [],
            proximateCauseEstablished: validation.proximateCausePassed,
            foreseeability: validation.proximateCausePassed ? 0.8 : 0.4,
          });
        }
      }
    }
  }

  return chains;
}

/**
 * Generate verdict from causal chains
 */
function generateVerdict(
  chains: LegalCausalChain[],
  extraction: { entities: any[]; warnings?: string[] }
): LegalVerdict {
  const hasEstablishedCausation = chains.length > 0;
  const butForSatisfied = chains.some(c => 
    c.butForAnalysis.result === 'necessary' || c.butForAnalysis.result === 'both'
  );
  const proximateCauseSatisfied = chains.some(c => c.proximateCauseEstablished);

  // Calculate average confidence
  const avgConfidence = chains.length > 0
    ? chains.reduce((sum, c) => sum + c.causalStrength, 0) / chains.length
    : 0;

  // Build reasoning
  const reasoningParts: string[] = [];

  if (hasEstablishedCausation) {
    reasoningParts.push(
      `Established ${chains.length} causal chain(s) linking defendant action(s) to identified harm(s).`
    );
  } else {
    reasoningParts.push(
      'No causal chains could be established. The but-for test was not satisfied for any action-harm pair.'
    );
  }

  if (butForSatisfied) {
    reasoningParts.push(
      'The but-for test is satisfied: harm would not have occurred but for defendant\'s action.'
    );
  }

  if (proximateCauseSatisfied) {
    reasoningParts.push(
      'Proximate causation is established: harm was a foreseeable consequence of defendant\'s action.'
    );
  } else if (hasEstablishedCausation) {
    reasoningParts.push(
      'Warning: Proximate causation may be disputed based on foreseeability analysis.'
    );
  }

  // Include extraction warnings as caveats
  const caveats: string[] = extraction.warnings || [];
  if (!hasEstablishedCausation) {
    caveats.push('The valley receives all streams, but only some streams carved the valley - mere correlation was detected but causation could not be established.');
  }

  return {
    liable: hasEstablishedCausation && butForSatisfied && proximateCauseSatisfied,
    causationEstablished: hasEstablishedCausation,
    reasoning: reasoningParts.join(' '),
    butForSatisfied,
    proximateCauseSatisfied,
    confidence: avgConfidence,
    caveats: caveats.length > 0 ? caveats : undefined,
  };
}

/**
 * Persist case to database if user is authenticated
 */
async function persistCase(legalCase: LegalCase): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      const { error } = await supabase.from('legal_cases').insert({
        user_id: userData.user.id,
        title: legalCase.title,
        case_data: legalCase,
        created_at: new Date().toISOString(),
      });

      if (error) {
        // Table might not exist yet - log but don't fail
        console.warn('[LegalReasoning] Failed to persist case:', error.message);
      } else {
        console.log('[LegalReasoning] Case persisted:', legalCase.id);
      }
    }
  } catch (error) {
    // Persistence is optional - don't fail the request
    console.warn('[LegalReasoning] Persistence skipped:', error);
  }
}
