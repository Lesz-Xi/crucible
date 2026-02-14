import { NextRequest, NextResponse } from "next/server";
import { getClaudeModel } from "@/lib/ai/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DomainClassifier } from "@/lib/services/domain-classifier";
import { SCMRetriever } from "@/lib/services/scm-retrieval";
import { ConstraintInjector } from "@/lib/services/constraint-injector";
import { StreamingCausalAnalyzer } from "@/lib/services/streaming-causal-analyzer";
import { createOracleModeService } from "@/lib/services/oracle-mode-service";
import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import { evaluateInterventionGate } from "@/lib/services/identifiability-gate";

import { CausalSolver, type Intervention } from '@/lib/services/causal-solver';
import { CounterfactualGenerator } from '@/lib/services/counterfactual-generator';
import { selectLatestAlignmentAuditReport } from "@/lib/services/alignment-audit";
import type { AlignmentAuditReportRow } from "@/lib/services/alignment-audit";
import { buildConversationContext, normalizeChatTurns, type ChatTurn } from "@/lib/services/conversation-context";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateFactTrigger } from "@/lib/services/chat-fact-trigger";
import { assessFactualConfidence, searchChatGrounding } from "@/lib/services/chat-web-grounding";
import type { FactualConfidenceResult, GroundingSource } from "@/types/chat-grounding";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { evaluateCausalPruning, type PrunableChatMessage } from "@/lib/services/causal-pruning-policy";
import { CompactionOrchestrator } from "@/lib/services/compaction-orchestrator";
import { CausalLatticeService } from "@/lib/services/causal-lattice";
import type { CacheTtlState, CompactionReceipt, LatticeBroadcastGateResult, RetrievalFusionResult } from "@/types/persistent-memory";
import { SessionService } from "@/lib/services/session-service";
import { ClaimLedgerService } from "@/lib/services/claim-ledger-service";
import { processChatAttachments, type ChatAttachment } from "@/lib/science/chat-scientific-bridge";
import type { ScientificAnalysisResponse } from "@/lib/science/scientific-analysis-service";

// Using Node.js runtime for full access to filesystem (schema loading)
// export const runtime = "edge"; // Removed: Edge doesn't support 'path' module
let causalDensityColumnAvailable: boolean | null = null;

function buildDomainClassificationInput(messages: ChatTurn[], userQuestion: string): string {
  const recentUserContext = messages
    .filter((message) => message.role === "user")
    .slice(-4)
    .map((message) => message.content);
  const current = typeof userQuestion === "string" ? userQuestion.trim() : "";
  const contextJoined = recentUserContext.join(" ");
  const lastUserTurn = recentUserContext[recentUserContext.length - 1] || "";
  const alreadyIncludedCurrent = lastUserTurn.toLowerCase() === current.toLowerCase();

  if (current.length === 0 || alreadyIncludedCurrent) {
    return contextJoined;
  }
  return `${contextJoined} ${current}`.trim();
}

async function verifyCausalDensityColumn(supabase: SupabaseClient | null): Promise<boolean> {
  if (!supabase) return false;
  if (causalDensityColumnAvailable !== null) return causalDensityColumnAvailable;

  const { error } = await supabase
    .from("causal_chat_messages")
    .select("causal_density")
    .limit(1);

  if (error) {
    const isMissingColumn = /causal_density|column/i.test(error.message || "");
    if (isMissingColumn) {
      console.warn(
        "[CausalChat] causal_density column missing. Apply migration 20260129_add_axiom_compression_trigger.sql. Falling back without causal_density persistence."
      );
      causalDensityColumnAvailable = false;
      return false;
    }

    console.warn("[CausalChat] Unable to verify causal_density column; disabling density persistence fallback:", error);
    causalDensityColumnAvailable = false;
    return false;
  }

  causalDensityColumnAvailable = true;
  return true;
}

function inferOutcomeVariableFromScm(scm: StructuralCausalModel): string {
  const nodes = scm.getFullStructure().nodes.map((node) => node.name);
  const priorityTokens = ["outcome", "performance", "failure", "risk", "harm"];

  for (const node of nodes) {
    const normalized = node.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (priorityTokens.some((token) => normalized.includes(token))) {
      return node;
    }
  }

  return nodes[nodes.length - 1] || "Outcome";
}

function sanitizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

function mapMessageToPrunable(message: ChatTurn, index: number): PrunableChatMessage {
  return {
    id: `turn-${index}`,
    role: message.role,
    content: message.content,
    hasToolEvidence: /\[(tool|source|evidence|citation)\]/i.test(message.content),
    isInterventionTrace: /do\(|counterfactual|intervention/i.test(message.content),
    causalDensity: null,
  };
}

function inferExpectedRungHint(
  prompt: string,
  mode: unknown,
  interventionPayload: unknown,
): 1 | 2 | 3 {
  const question = typeof prompt === "string" ? prompt.toLowerCase() : "";
  const normalizedMode = typeof mode === "string" ? mode.toLowerCase() : "";

  if (interventionPayload && typeof interventionPayload === "object") {
    return 2;
  }

  if (/counterfactual|but[- ]for|necessity|sufficiency|pn\b|ps\b|what if/i.test(question)) {
    return 3;
  }

  if (/do\(|intervention|confounder|mediator|treatment|identifiability/i.test(question)) {
    return 2;
  }

  if (normalizedMode === "intervene") return 2;
  if (normalizedMode === "audit") return 2;

  return 1;
}

export async function POST(req: NextRequest) {
  let supabase: SupabaseClient | null = null;
  let user: { id: string } | null = null;
  let sessionService: SessionService | null = null;

  try {
    supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user?.id ? { id: data.user.id } : null;
    sessionService = new SessionService();
  } catch (error) {
    console.warn("[CausalChat] Supabase initialization failed (Persistence disabled):", error);
  }

  // Authentication is optional for MVP

  // Check for API Keys early
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[CausalChat] ANTHROPIC_API_KEY is missing");
    return NextResponse.json({
      error: "Configuration Error: API Key missing. Please check your .env file."
    }, { status: 500 });
  }

  const requestBody = await req.json();
  const {
    question,
    messages,
    sessionId,
    intervention,
    modelKey,
    traceId,
    latticeTargetSessionId,
    operatorMode,
    attachments,
  } = requestBody;

  // Support both single question and message history
  const fallbackQuestion = Array.isArray(messages) ? messages[messages.length - 1]?.content : "";
  const userQuestion =
    typeof question === "string" && question.trim().length > 0
      ? question
      : typeof fallbackQuestion === "string"
        ? fallbackQuestion
        : "";

  if (!userQuestion) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const normalizedAttachments: ChatAttachment[] = Array.isArray(attachments)
    ? attachments.filter((item): item is ChatAttachment => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ChatAttachment>;
      return (
        typeof candidate.name === "string" &&
        typeof candidate.data === "string" &&
        typeof candidate.mimeType === "string"
      );
    })
    : [];

  const normalizedIncomingMessages = normalizeChatTurns(messages);
  const cacheTtlState: CacheTtlState = (() => {
    const header = req.headers.get("x-cache-ttl-state")?.toLowerCase();
    if (header === "cache_ttl_fresh") return "cache_ttl_fresh";
    if (header === "cache_ttl_expired") return "cache_ttl_expired";
    return "unknown";
  })();

  const pruningEnabled = FEATURE_FLAGS.MASA_CAUSAL_PRUNING_V1;
  const pruningResult = pruningEnabled
    ? evaluateCausalPruning(
      normalizedIncomingMessages.map((message, idx) => mapMessageToPrunable(message, idx)),
      {
        maxMessages: 10,
        cacheTtlState,
      },
    )
    : null;

  const messagesForContext = pruningResult
    ? pruningResult.retainedMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }))
    : normalizedIncomingMessages;

  const contextResult = buildConversationContext(messagesForContext, userQuestion, {
    maxContextChars: 60000,
  });
  const domainClassificationInput = buildDomainClassificationInput(messagesForContext, userQuestion);
  console.log(
    `[CausalChat] Context telemetry: included=${contextResult.includedTurns}, truncated=${contextResult.truncatedTurns}, chars=${contextResult.promptContext.length}, prior=${contextResult.hasPriorContext}, ambiguous=${contextResult.ambiguousReference}`
  );

  const encoder = new TextEncoder();
  const domainClassifier = new DomainClassifier();
  const scmRetriever = new SCMRetriever();
  const constraintInjector = new ConstraintInjector();

  const stream = new ReadableStream({
    async start(controller) {
      let isControllerClosed = false;

      const sendEvent = (event: string, data: unknown) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (err) {
            console.error(`[SendEvent] Failed to enqueue ${event}:`, err);
            isControllerClosed = true;
          }
        }
      };

      // Initialize streaming analyzer for real-time density updates
      const analyzer = new StreamingCausalAnalyzer();
      analyzer.setContextHint({
        expectedRung: inferExpectedRungHint(userQuestion, operatorMode, intervention),
        operatorMode: typeof operatorMode === "string" ? operatorMode : undefined,
      });

      // Initialize Bayesian Oracle Mode Service
      const oracleService = createOracleModeService(sessionId || null);
      const densityDistribution: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
      let lastDensityScore: 1 | 2 | 3 | null = null;
      let oracleActivations = 0;
      let groundingSources: GroundingSource[] = [];
      let factualConfidence: FactualConfidenceResult = {
        level: "insufficient",
        score: 0,
        rationale: "Grounding not evaluated.",
      };
      let compactionReceipt: CompactionReceipt | null = null;
      let scientificAnalysis: ScientificAnalysisResponse[] = [];

      const scientificPromise = normalizedAttachments.length > 0
        ? (async () => {
          if (!user?.id) {
            const warning = "Scientific extraction skipped: authenticated user required for PDF ingestion.";
            sendEvent("scientific_extraction_failed", {
              fileName: "all_attachments",
              error: warning,
            });
            return {
              analyses: [] as ScientificAnalysisResponse[],
              summaryForContext: "",
              warnings: [warning],
            };
          }

          return processChatAttachments(normalizedAttachments, user.id, {
            sessionId: sessionId || undefined,
            onEvent: (event) => {
              if (event.type === "started") {
                sendEvent("scientific_extraction_started", { fileName: event.fileName });
              }
              if (event.type === "complete") {
                sendEvent("scientific_extraction_complete", {
                  fileName: event.fileName,
                  status: event.analysis.status,
                  summary: event.analysis.summary,
                  warnings: event.analysis.warnings,
                  provenance: event.analysis.provenance,
                });
              }
              if (event.type === "failed") {
                sendEvent("scientific_extraction_failed", {
                  fileName: event.fileName,
                  error: event.error,
                });
              }
            },
          });
        })()
        : null;
      let retrievalFusionDebug: RetrievalFusionResult | null = null;
      let latticeBroadcastSummary: LatticeBroadcastGateResult | null = null;
      let interventionGateSummary: { allowed: boolean; allowedOutputClass: string; rationale: string } | null = null;

      try {
        const resolveDomainOverride = (key?: string | null): string | null => {
          if (!key || typeof key !== "string") return null;
          const normalized = key.trim();
          if (!normalized) return null;

          const byModelKey: Record<string, string> = {
            alignment_bias_scm: "alignment",
            hot_rosenthal_v1: "consciousness",
            neural_topology_v1: "neuroscience",
            neural_dynamics_v1: "theoretical_neuroscience",
            iml_epistemology_v1: "iml",
          };

          if (byModelKey[normalized]) {
            return byModelKey[normalized];
          }

          const explicitDomains = new Set([
            "alignment",
            "consciousness",
            "neuroscience",
            "theoretical_neuroscience",
            "neural_dynamics",
            "iml",
            "education",
            "legal",
            "ecology",
            "evolutionary_biology",
            "cognitive_psychology",
            "scaling_laws",
            "physics",
            "abstract",
          ]);

          return explicitDomains.has(normalized) ? normalized : null;
        };

        if (pruningResult) {
          sendEvent("causal_pruning_started", {
            cacheTtlState,
            incomingMessages: normalizedIncomingMessages.length,
            targetRetained: 10,
          });

          sendEvent("causal_pruning_completed", {
            retainedCount: pruningResult.retainedMessages.length,
            prunedCount: pruningResult.prunedMessages.length,
            decisions: pruningResult.decisions,
          });

          if (sessionId && user && supabase && sessionService) {
            void sessionService
              .persistPruningDecisions(sessionId, pruningResult.decisions)
              .catch((error) => console.warn("[CausalChat] Failed to persist pruning decisions:", error));
          }
        }

        // FAST-PATH: Detect simple conversational queries (greetings, identity, pleasantries)
        // Matches common greetings and "who/what are you" questions
        const lowerQ = userQuestion.trim().toLowerCase();
        const isConversational =
          /^(hi|hello|hey|greetings|thanks|thank you|goodbye|bye)/i.test(lowerQ) ||
          /(who|what|how).+(are|is).+(you|this)/i.test(lowerQ) &&
          userQuestion.length < 150; // Ensure long prompts (like analysis requests) are never treated as fast-path conversation

        console.log(`[CausalChat] Fast-path check: ${isConversational ? 'ACTIVE' : 'FULL PIPELINE'} for query: "${userQuestion}"`);

        if (isConversational) {
          sendEvent("thinking", { message: "Processing conversational query..." });

          const model = getClaudeModel();
          const simplePrompt = `You are the Sage of the Uncarved Block (Ψ_Tao), an AI assistant grounded in the Grand Unified Field Equation of the Tao.
          
Respond with the humility of the Valley and the clarity of the Uncarved Block to this greeting/question: "${userQuestion}"

Keep your response brief (1-2 sentences) and mention that you adhere to the natural laws of Physics, Biology, and the Tao.`;

          const response = await model.generateContent(simplePrompt);
          const fullText = response.response.text();

          // Stream response
          const chunks = fullText.split(' ');
          for (const chunk of chunks) {
            sendEvent("answer_chunk", { text: chunk + ' ' });
            await new Promise(r => setTimeout(r, 15));
          }

          sendEvent("complete", { finished: true });
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }
          return;
        }

        // FULL CAUSAL PATH: For scientific questions
        const factTrigger = evaluateFactTrigger(userQuestion);
        const groundingEnabled = process.env.CHAT_WEB_GROUNDING_V1 !== "false";

        sendEvent("fact_trigger_evaluated", {
          ...factTrigger,
          enabled: groundingEnabled,
        });

        if (factTrigger.shouldSearch) {
          if (!groundingEnabled) {
            sendEvent("web_grounding_failed", {
              reason: "feature_disabled",
              message: "Web grounding feature is disabled via CHAT_WEB_GROUNDING_V1=false.",
            });
          } else if (!process.env.SERPER_API_KEY) {
            sendEvent("web_grounding_failed", {
              reason: "missing_serper_api_key",
              message: "SERPER_API_KEY is not configured. Running strict uncertain mode.",
            });
          } else {
            sendEvent("web_grounding_started", {
              entities: factTrigger.normalizedEntities,
              confidence: factTrigger.confidence,
            });
            try {
              groundingSources = await searchChatGrounding(userQuestion, factTrigger.normalizedEntities, {
                topK: 5,
                timeoutMs: 5000,
              });
              sendEvent("web_grounding_completed", {
                sourceCount: groundingSources.length,
                topDomains: Array.from(new Set(groundingSources.map((source) => source.domain))).slice(0, 5),
                sources: groundingSources,
              });
            } catch (groundingError) {
              console.error("[CausalChat] Web grounding failed:", groundingError);
              sendEvent("web_grounding_failed", {
                reason: "search_error",
                message: groundingError instanceof Error ? groundingError.message : "Grounding search failed.",
              });
            }
          }

          factualConfidence = assessFactualConfidence(userQuestion, groundingSources);
          sendEvent("factual_confidence_assessed", factualConfidence);
        }

        // 1. Domain Classification
        sendEvent("thinking", { message: "Identifying causal domain..." });
        const domainOverride = resolveDomainOverride(modelKey);
        const classification = domainOverride
          ? { primary: domainOverride, confidence: 1, secondary: [], overriddenByModelKey: modelKey }
          : await domainClassifier.classify(domainClassificationInput || userQuestion);
        sendEvent("domain_classified", classification);

        // 2. SCM Retrieval
        sendEvent("thinking", { message: `Loading Truth Cartridge for ${classification.primary}...` });
        const scmContext = await scmRetriever.retrieve(
          classification.primary,
          supabase || undefined,
          { modelKey: typeof modelKey === "string" ? modelKey : undefined }
        );
        sendEvent("scm_loaded", {
          tier1: scmContext.primaryScm.getConstraints(),
          tier2: scmContext.tier2?.getConstraints(),
          model: scmContext.model,
        });

        if (FEATURE_FLAGS.MASA_MEMORY_FUSION_V1) {
          retrievalFusionDebug = scmRetriever.fuseConstraintRetrieval(userQuestion, scmContext, 6);
          sendEvent("retrieval_fusion_debug", retrievalFusionDebug);
        }

        // 3. Constraint Injection
        sendEvent("thinking", { message: "Grounding LLM in causal laws..." });

        let doPrompt = "";
        let affectedNodes: string[] = [];
        let interventionApplied = false;

        const solver = new CausalSolver();
        const cfGenerator = new CounterfactualGenerator();
        await cfGenerator.initialize();

        // Check for Do-Calculus Intervention
        if (intervention && intervention.node_id) {
          const subjectScm = scmContext.tier2 || scmContext.primaryScm;
          const outcomeVar =
            typeof intervention.outcome_var === "string" && intervention.outcome_var.trim().length > 0
              ? intervention.outcome_var.trim()
              : inferOutcomeVariableFromScm(subjectScm);
          const adjustmentSet = sanitizeStringArray(intervention.adjustment_set);
          const knownConfounders = sanitizeStringArray(intervention.known_confounders);

          const gate = evaluateInterventionGate(subjectScm, {
            treatment: intervention.node_id,
            outcome: outcomeVar,
            adjustmentSet,
            knownConfounders,
          });

          sendEvent("intervention_gate", {
            treatment: intervention.node_id,
            outcome: outcomeVar,
            allowed: gate.allowed,
            allowedOutputClass: gate.allowedOutputClass,
            rationale: gate.rationale,
            identifiability: gate.identifiability,
          });
          interventionGateSummary = {
            allowed: gate.allowed,
            allowedOutputClass: gate.allowedOutputClass,
            rationale: gate.rationale,
          };

          if (!gate.allowed) {
            sendEvent("intervention_blocked", {
              message:
                "Intervention request downgraded: required confounders are missing. Returning association-level answer.",
              missingConfounders: gate.identifiability.missingConfounders,
              allowedOutputClass: gate.allowedOutputClass,
            });
          } else {
            sendEvent("thinking", { message: `Performing Do-Calculus: do(${intervention.node_id}=${intervention.value})...` });
            const interventions: Intervention[] = [{
              nodeName: intervention.node_id,
              value: intervention.value
            }];

            // Measure Latency (L3 Calibration)
            const startTime = performance.now();

            // Identify downstream effects (Tier 1 Physics)
            affectedNodes = solver.getAffectedNodes(subjectScm, intervention.node_id);

            doPrompt = solver.generateDoPrompt(interventions);
            interventionApplied = true;

            const latency = performance.now() - startTime;
            console.log(`[CausalSolver] Latency: ${latency.toFixed(2)}ms for do(${intervention.node_id})`);

            sendEvent("intervention_effect", {
              do: interventions,
              affected: affectedNodes,
              latency_ms: latency
            });
          }
        }

        const { systemPrompt } = constraintInjector.inject(userQuestion, scmContext, doPrompt, {
          conversationContext: contextResult.promptContext,
          explicitCarryover: true,
          ambiguityPolicy: "ask_one_clarifier",
          ambiguousReference: contextResult.ambiguousReference,
        });

        let scientificSummaryForContext = "";
        let scientificWarnings: string[] = [];
        if (scientificPromise) {
          const bridgeResult = await scientificPromise;
          scientificAnalysis = bridgeResult.analyses;
          scientificSummaryForContext = bridgeResult.summaryForContext;
          scientificWarnings = bridgeResult.warnings;
        }

        let finalPrompt = systemPrompt;
        if (scientificSummaryForContext) {
          finalPrompt = `${finalPrompt}

SCIENTIFIC ATTACHMENT SUMMARY (deterministic extraction):
${scientificSummaryForContext}

POLICY:
- Treat attachment-derived summaries as high-priority grounding for numeric claims.
- If extraction warnings exist, mention uncertainty and avoid overclaiming causality.`;
        }

        if (factTrigger.shouldSearch) {
          const sourceList =
            groundingSources.length > 0
              ? groundingSources
                .map(
                  (source) =>
                    `[${source.rank}] ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet || "N/A"}`
                )
                .join("\n\n")
              : "No reliable sources retrieved.";

          finalPrompt = `${systemPrompt}

FACTUAL GROUNDING POLICY (MANDATORY):
- This answer must be strictly evidence-grounded for named factual claims.
- For any factual claim, either cite a source inline as [n] or explicitly state uncertainty.
- Never fabricate creators, ownership, launch dates, or affiliations.
- If evidence is weak/conflicting, say so and provide one deterministic verification step.
- Keep tone direct and avoid narrative padding.
- Do NOT claim you cannot browse/search the web; use the provided grounding results and state tooling/source limitations plainly if retrieval is weak.

GROUNDING SIGNAL:
- Trigger confidence: ${factTrigger.confidence.toFixed(2)}
- Factual confidence level: ${factualConfidence.level}
- Factual confidence rationale: ${factualConfidence.rationale}

SOURCES:
${sourceList}`;
        }

        // 4. LLM Generation (True Streaming)
        const model = getClaudeModel();


        console.log("[Streaming] Starting LLM generation (simulated streaming)...");
        let fullText = "";
        let chunkCount = 0;

        // TODO: Implement true streaming when Claude SDK supports it
        const result = await model.generateContent(finalPrompt);
        fullText = result.response.text();
        chunkCount = 1;

        if (factTrigger.shouldSearch && groundingSources.length > 0) {
          const citationMatches = fullText.match(/\[(\d+)\]/g) || [];
          const citedIds = new Set<number>(
            citationMatches
              .map((token) => Number(token.replace(/[^0-9]/g, "")))
              .filter((value) => Number.isFinite(value) && value > 0)
          );

          if (citedIds.size === 0) {
            const sourcesFooter = groundingSources
              .map((source) => `[${source.rank}] ${source.title} — ${source.link}`)
              .join("\n");
            fullText = `${fullText}\n\nSources:\n${sourcesFooter}`;
          } else {
            const citedList = groundingSources.filter((source) => citedIds.has(source.rank));
            const additionalList = groundingSources.filter((source) => !citedIds.has(source.rank));

            const usedLine = citedList.length > 0
              ? `Sources used: ${citedList.map((source) => `[${source.rank}]`).join(" ")}`
              : "";
            const additionalLine = additionalList.length > 0
              ? `Additional retrieved (not directly cited): ${additionalList.map((source) => `[${source.rank}]`).join(" ")}`
              : "";

            const reconciliation = [usedLine, additionalLine].filter(Boolean).join("\n");
            if (reconciliation) {
              fullText = `${fullText}\n\n${reconciliation}`;
            }
          }
        }

        if (
          factTrigger.shouldSearch &&
          factualConfidence.level === "insufficient" &&
          !/(cannot verify|unable to verify|insufficient evidence|could not verify)/i.test(fullText)
        ) {
          fullText = `I cannot verify this claim with high confidence from available sources right now.\n\n${fullText}`;
        }

        // Send the full response as a single chunk
        sendEvent("answer_chunk", { text: fullText });
        console.log("[Streaming] Response sent as single chunk.");

        // Analyze chunk for causal density
        const densityUpdate = analyzer.onChunk(fullText);
        if (densityUpdate && densityUpdate.isSignificant) {
          densityDistribution[densityUpdate.score as 1 | 2 | 3] += 1;
          if (lastDensityScore !== densityUpdate.score) {
            console.log(
              `[Density] Level transition ${lastDensityScore ?? "none"} -> ${densityUpdate.score}`,
              {
                confidence: densityUpdate.confidence,
                evidence: densityUpdate.evidence,
              }
            );
            lastDensityScore = densityUpdate.score as 1 | 2 | 3;
          }

          sendEvent("causal_density_update", {
            score: densityUpdate.score,
            label: densityUpdate.label,
            confidence: densityUpdate.confidence,
            detectedMechanisms: densityUpdate.detectedMechanisms,
            evidence: densityUpdate.evidence,
            progress: densityUpdate.progress,
          });

          // Update Bayesian Oracle Mode state
          const transition = oracleService.processResult(
            {
              score: densityUpdate.score,
              confidence: densityUpdate.confidence,
              label: densityUpdate.label,
              detectedMechanisms: densityUpdate.detectedMechanisms || []
            },
            new Date()
          );

          // Emit Bayesian probability event
          sendEvent("bayesian_oracle_update", {
            probability: transition.state.bayesianProbability,
            isActive: transition.state.isActive
          });

          // Maintain backward compatibility
          if (transition.enteredOracleMode) {
            oracleActivations += 1;
            sendEvent("oracle_mode_change", { active: true });
          } else if (transition.exitedOracleMode) {
            sendEvent("oracle_mode_change", { active: false });
          }
        }

        console.log(`[Streaming] Complete! Sent ${chunkCount} chunks, total text length: ${fullText.length} chars`);

        // Send final density update
        const finalAnalysis = analyzer.getCurrentAnalysis();
        sendEvent("causal_density_final", {
          score: finalAnalysis.score,
          label: finalAnalysis.label,
          confidence: finalAnalysis.confidence,
          detectedMechanisms: finalAnalysis.detectedMechanisms,
          evidence: finalAnalysis.evidence,
        });
        console.log("[Density] Final summary", {
          score: finalAnalysis.score,
          confidence: finalAnalysis.confidence,
          evidence: finalAnalysis.evidence,
          distribution: densityDistribution,
          oracleActivations,
        });

        // Generate and stream counterfactuals (Layer 3) if an intervention was performed
        if (interventionApplied) {
          sendEvent("thinking", { message: "Generating Counterfactual Scenarios (Layer 3)..." });
          const scenarios = await cfGenerator.generateScenarios(fullText);
          sendEvent("counterfactuals", scenarios);
        }


        // 5. Causal Graph Visualization (Metadata)
        const graphPayload = scmContext.tier2
          ? scmContext.tier2.getFullStructure()
          : scmContext.primaryScm.getFullStructure();

        sendEvent("causal_graph", graphPayload);

        const validationJson = scmContext.model?.validationJson as Record<string, unknown> | undefined;
        const biasSensitivePaths = Array.isArray(validationJson?.bias_sensitive_paths)
          ? validationJson?.bias_sensitive_paths
          : [];
        if (biasSensitivePaths.length > 0) {
          sendEvent("bias_sensitive_paths", { paths: biasSensitivePaths });
        }

        const isAlignmentModel =
          scmContext.domain === "alignment" || scmContext.model?.modelKey === "alignment_bias_scm";
        if (isAlignmentModel && supabase) {
          const { data: reportRows, error: reportError } = await supabase
            .from("alignment_audit_reports")
            .select("id, model_key, model_version, scope, source, created_at, report_json")
            .eq("model_key", scmContext.model?.modelKey || "alignment_bias_scm")
            .eq("scope", "global")
            .order("created_at", { ascending: false });

          const latest = reportError ? null : selectLatestAlignmentAuditReport(reportRows as AlignmentAuditReportRow[]);
          if (latest) {
            sendEvent("alignment_audit_report", {
              id: latest.id,
              modelKey: latest.modelKey,
              modelVersion: latest.modelVersion,
              scope: latest.scope,
              source: latest.source,
              createdAt: latest.createdAt,
              report: latest.report,
            });
          }
        }

        sendEvent("provenance", {
          scm_used: [scmContext.domain],
          model_key: scmContext.model?.modelKey,
          model_version: scmContext.model?.version,
          confidence: classification.confidence
        });

        // 6. Persistence (only if user is authenticated)
        // 6. Persistence (only if user is authenticated)
        if (sessionId && user && supabase) {
          const canPersistDensity = await verifyCausalDensityColumn(supabase);

          // Ensure session exists
          const { error: sessionError } = await supabase
            .from("causal_chat_sessions")
            .upsert({
              id: sessionId,
              user_id: user.id,
              title: userQuestion.slice(0, 50) + (userQuestion.length > 50 ? "..." : ""),
              updated_at: new Date().toISOString()
            }, { onConflict: "id" });

          if (sessionError) {
            console.error("[Persistence] Failed to upsert session:", sessionError);
          } else {
            // Save User Message
            await supabase.from("causal_chat_messages").insert({
              session_id: sessionId,
              role: "user",
              content: userQuestion
            });

            // Save Assistant Message with causal density
            const finalDensity = analyzer.getCurrentAnalysis();
            const persistedGraphPayload =
              graphPayload && typeof graphPayload === "object"
                ? {
                  ...(graphPayload as Record<string, unknown>),
                  persistent_memory_meta: {
                    compactionReceipt,
                    retrievalFusionDebug,
                    latticeBroadcastSummary,
                  },
                }
                : graphPayload;
            const assistantPayload: Record<string, unknown> = {
              session_id: sessionId,
              role: "assistant",
              content: fullText,
              domain_classified: classification.primary,
              model_key: scmContext.model?.modelKey,
              model_version: scmContext.model?.version,
              scm_tier1_used: scmContext.primaryScm.getConstraints(),
              scm_tier2_used: scmContext.tier2?.getConstraints(),
              confidence_score: classification.confidence,
              causal_graph: persistedGraphPayload,
            };
            if (canPersistDensity) {
              assistantPayload.causal_density = finalDensity;
            }

            let { error: assistantError } = await supabase
              .from("causal_chat_messages")
              .insert(assistantPayload);
            if (assistantError && /causal_density|column/i.test(assistantError.message || "") && assistantPayload.causal_density) {
              console.warn(
                "[CausalChat] Failed writing causal_density. Retrying without density payload. Apply migration 20260129_add_axiom_compression_trigger.sql."
              );
              causalDensityColumnAvailable = false;
              delete assistantPayload.causal_density;
              const retry = await supabase
                .from("causal_chat_messages")
                .insert(assistantPayload);
              assistantError = retry.error;
            }

            if (assistantError && /model_key|model_version|column/i.test(assistantError.message || "")) {
              console.warn(
                "[CausalChat] Failed writing model provenance columns. Retrying without model_key/model_version. Apply new model provenance migration."
              );
              delete assistantPayload.model_key;
              delete assistantPayload.model_version;
              const retry = await supabase
                .from("causal_chat_messages")
                .insert(assistantPayload);
              assistantError = retry.error;
            }
            if (assistantError) {
              console.error("[Persistence] Failed to save assistant message:", assistantError);
            }

            console.log(`[Persistence] Saved session ${sessionId} and messages.`);
          }
        }

        if (sessionId && user && supabase && sessionService && FEATURE_FLAGS.MASA_COMPACTION_AXIOM_V1) {
          try {
            const compactionWindow = await sessionService.loadRecentMessagesForCompaction(sessionId, 14);
            if (compactionWindow.length >= 6) {
              sendEvent("compaction_window_opened", {
                sessionId,
                messageCount: compactionWindow.length,
                traceId: traceId || null,
              });
              const orchestrator = new CompactionOrchestrator();
              const compactionResult = await orchestrator.compactSessionWindow(supabase, sessionId, compactionWindow);
              compactionReceipt = compactionResult.receipt;

              sendEvent("axiom_extraction_completed", {
                entriesExtracted: compactionResult.entries.length,
                summaryFallbackUsed: compactionResult.receipt.summaryFallbackUsed,
              });
              sendEvent("compaction_receipt_written", compactionResult.receipt);
              if (compactionResult.receipt.summaryFallbackUsed) {
                sendEvent("compaction_summary_fallback", {
                  reason: "axiom_threshold_not_met",
                });
              }
            }
          } catch (error) {
            console.warn("[CausalChat] Compaction orchestration failed:", error);
            sendEvent("compaction_summary_fallback", {
              reason: "compaction_runtime_error",
            });
          }
        }

        if (
          sessionId &&
          user &&
          supabase &&
          FEATURE_FLAGS.MASA_CAUSAL_LATTICE_V1 &&
          typeof latticeTargetSessionId === "string" &&
          latticeTargetSessionId.trim().length > 0
        ) {
          try {
            const lattice = new CausalLatticeService();
            sendEvent("lattice_broadcast_started", {
              originSessionId: sessionId,
              targetSessionId: latticeTargetSessionId,
            });
            latticeBroadcastSummary = await lattice.broadcastValidatedAxioms(supabase, {
              originSessionId: sessionId,
              targetSessionId: latticeTargetSessionId,
              userId: user.id,
              domain: classification.primary,
              confidenceThreshold: 0.75,
            });

            sendEvent(
              latticeBroadcastSummary.accepted ? "lattice_broadcast_applied" : "lattice_broadcast_rejected",
              latticeBroadcastSummary,
            );
          } catch (error) {
            console.warn("[CausalChat] Lattice broadcast failed:", error);
            latticeBroadcastSummary = {
              accepted: false,
              reason: "broadcast_runtime_error",
              event: {
                originSessionId: sessionId,
                targetSessionId: latticeTargetSessionId,
                axiomIds: [],
                policy: "runtime_error",
                timestamp: new Date().toISOString(),
              },
            };
            sendEvent("lattice_broadcast_rejected", latticeBroadcastSummary);
          }
        }

        if (user && supabase) {
          try {
            const claimLedger = new ClaimLedgerService(supabase);
            const claimId = await claimLedger.recordClaim({
              userId: user.id,
              sessionId: sessionId || undefined,
              traceId: typeof traceId === "string" ? traceId : undefined,
              sourceFeature: "chat",
              claimText: fullText,
              claimKind: interventionApplied ? "hypothesis" : "assertion",
              confidenceScore: factualConfidence.score,
              uncertaintyLabel:
                factualConfidence.level === "high"
                  ? "low"
                  : factualConfidence.level === "medium"
                    ? "medium"
                    : "high",
              modelKey: scmContext.model?.modelKey,
              modelVersion: scmContext.model?.version,
              evidenceLinks: [
                ...groundingSources.map((source) => ({
                  evidenceType: "citation" as const,
                  evidenceRef: source.link,
                  snippet: source.snippet || source.title,
                  metadata: {
                    rank: source.rank,
                    domain: source.domain,
                    title: source.title,
                  },
                })),
                ...scientificAnalysis
                  .filter((entry) => entry.provenance?.ingestionId)
                  .map((entry) => ({
                    evidenceType: "scientific_provenance" as const,
                    evidenceRef: entry.provenance!.ingestionId,
                    snippet: `Scientific extraction ${entry.status}`,
                    metadata: {
                      summary: entry.summary,
                      warnings: entry.warnings,
                      provenance: entry.provenance,
                    },
                  })),
              ],
              gateDecisions: [
                {
                  gateName: "factual_confidence",
                  decision:
                    factualConfidence.level === "high"
                      ? "pass"
                      : factualConfidence.level === "medium"
                        ? "warn"
                        : "fail",
                  rationale: factualConfidence.rationale,
                  score: factualConfidence.score,
                  metadata: {
                    triggerConfidence: factTrigger.confidence,
                    shouldSearch: factTrigger.shouldSearch,
                  },
                },
                ...(interventionGateSummary
                  ? [
                    {
                      gateName: "intervention_gate",
                      decision: interventionGateSummary.allowed ? ("pass" as const) : ("fail" as const),
                      rationale: interventionGateSummary.rationale,
                      metadata: {
                        allowedOutputClass: interventionGateSummary.allowedOutputClass,
                      },
                    },
                  ]
                  : []),
              ],
              receipts: [
                {
                  receiptType: "emission",
                  actor: "causal-chat-api",
                  receiptJson: {
                    sessionId: sessionId || null,
                    traceId: typeof traceId === "string" ? traceId : null,
                    classification: classification.primary,
                  },
                },
              ],
            });

            sendEvent("claim_recorded", { claimId });
          } catch (claimError) {
            console.warn("[CausalChat] Failed to record claim ledger entry:", claimError);
            sendEvent("claim_record_failed", {
              reason: claimError instanceof Error ? claimError.message : "unknown_error",
            });
          }
        }

        sendEvent("complete", {
          finished: true,
          compactionReceipt,
          retrievalFusionDebug,
          latticeBroadcastSummary,
          scientificAnalysis,
          scientificWarnings,
        });
        if (!isControllerClosed) {
          isControllerClosed = true;
          controller.close();
        }
      } catch (error: unknown) {
        const stack = error instanceof Error ? error.stack : undefined;
        console.error("[CausalChat API] Error:", error, stack);
        if (!isControllerClosed) {
          const message = error instanceof Error ? error.message : "Unknown error";
          sendEvent("error", { message });
          isControllerClosed = true;
          controller.close();
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
