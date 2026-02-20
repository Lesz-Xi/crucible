// Synthesis Engine - Core Module
// Implements Hong-inspired architecture for generating novel ideas from multiple sources
// Tier 1: Added self-correction loop and calibrated confidence

import { getClaudeModel } from "@/lib/ai/anthropic";
import { HypothesisGenerator } from "@/lib/ai/hypothesis-generator";
import { PDFExtractionResult } from "@/lib/extractors/pdf-extractor";
import {
  NovelIdea,
  StructuredApproach,
  ExtractedConcepts,
  Contradiction,
  Entity,
  ConfidenceFactors,
  PriorArt,
  CriticalAnalysis,
} from "@/types";
import type {
  ContradictionEvidence,
  NoveltyGateResult,
  NoveltyProof,
  RecoveryPlan,
} from "@/types/hybrid-novelty";
import type { HybridTimelineReceipt, HybridTimelineStageKey, HybridTimelineStageTelemetry } from "@/types/hybrid-timeline";
import { evaluateCriticalThinking } from "./novelty-evaluator";
import { StatisticalValidator } from "./statistical-validator";
import { linkSnippetsToPDF } from "./citation-linker";
import {
  buildContradictionMatrix,
  hasHighConfidenceContradictions,
} from "@/lib/services/contradiction-matrix";
import {
  computeNoveltyGate,
  computeNoveltyProofs,
} from "@/lib/services/novelty-proof-engine";
import { buildNoveltyRecoveryPlan } from "@/lib/services/novelty-recovery-planner";
import { ThermodynamicEvaluator } from "@/lib/ai/thermodynamic-evaluator";

// ===== CONCEPT EXTRACTION =====

const CONCEPT_EXTRACTION_PROMPT = `You are an advanced concept extraction system. Analyze the following document excerpt and extract:

1. **Main Thesis**: The central argument or claim of this source
2. **Key Arguments**: 3-5 supporting arguments or key points
3. **Entities**: Important people, concepts, organizations, technologies, or methods mentioned
4. **Methodology**: How was the research conducted? (e.g., experimental, theoretical, case study)
5. **Evidence Quality**: Assess if the evidence is "strong" (data-backed), "moderate" (logical but sparse data), "weak" (speculative), or "anecdotal".
6. **Research Gaps**: What future work or missing pieces does the author identify?

Format your response as JSON:
{
  "mainThesis": "string",
  "keyArguments": ["string", "string", ...],
  "entities": [
    {"name": "string", "type": "person|concept|organization|technology|method", "description": "string"}
  ],
  "methodology": "string",
  "evidenceQuality": "strong|moderate|weak|anecdotal",
  "researchGaps": ["string", "string", ...]
}

Document to analyze:
---
{DOCUMENT}
---`;

export async function extractConcepts(
  text: string,
  sourceId: string
): Promise<ExtractedConcepts> {
  const model = getClaudeModel();
  const prompt = CONCEPT_EXTRACTION_PROMPT.replace("{DOCUMENT}", text);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract concepts: Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Add sourceId to each entity
  const entities: Entity[] = parsed.entities.map((e: Omit<Entity, 'sourceId'>) => ({
    ...e,
    sourceId,
  }));

  return {
    mainThesis: parsed.mainThesis,
    keyArguments: parsed.keyArguments,
    entities,
    methodology: parsed.methodology,
    evidenceQuality: parsed.evidenceQuality,
    researchGaps: parsed.researchGaps,
  };
}

// ===== CONTRADICTION DETECTION =====

const CONTRADICTION_DETECTION_PROMPT = `You are a critical analysis system. Compare the following sources and identify any contradictions or tensions between their claims.

Sources:
{SOURCES}

For each contradiction found, explain:
1. The concept being contradicted
2. What Source A claims
3. What Source B claims
4. A potential resolution or synthesis of these views

Format as JSON:
{
  "contradictions": [
    {
      "concept": "string",
      "sourceA": "source name",
      "claimA": "string",
      "sourceB": "source name",
      "claimB": "string",
      "resolution": "string or null if no obvious resolution"
    }
  ]
}

If no contradictions are found, return {"contradictions": []}`;

export async function detectContradictions(
  sources: { name: string; thesis: string; arguments: string[] }[]
): Promise<Contradiction[]> {
  const model = getClaudeModel();

  const sourcesText = sources
    .map(
      (s) =>
        `**${s.name}**:\n- Thesis: ${s.thesis}\n- Arguments: ${s.arguments.join("; ")}`
    )
    .join("\n\n");

  const prompt = CONTRADICTION_DETECTION_PROMPT.replace("{SOURCES}", sourcesText);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return [];
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.contradictions || [];
}

// ===== NOVEL IDEA GENERATION (Hong-Inspired) =====

// ===== NOVEL IDEA GENERATION (Hong-Inspired) =====

const HYPOTHESIS_GENERATION_PROMPT = `You are the Sovereign Synthesis Engine, using the Scientific Method to generate novel inventions.

Your task: Formulate 3-5 distinct scientific hypotheses (inventions) based on the provided evidence.

**Evidence (Observations):**
{SOURCES}

**Identified Tensions (Contradictions):**
{CONTRADICTIONS}

**Methodology:**
1. **Observation**: Synthesize the key facts and "Research Gaps" from the sources.
2. **Hypothesis**: Propose a NOVEL entity or mechanism that bridges these gaps.
3. **Mechanism**: Explain the causal chain—HOW does this bridge the gap?
4. **Prediction**: Deduce a testable prediction—what would we observe if this were true?

Format as JSON:
{
  "novelIdeas": [
    {
      "thesis": "One-sentence hypothesis statement",
      "description": "Detailed explanation of the invention/idea",
      "mechanism": "Step-by-step verified mechanism (How it works)",
      "prediction": "Specific, falsifiable prediction (If X, then Y)",
      "bridgedConcepts": ["concept from Source A", "concept from Source B", ...],
      "confidence": number, // 0-100 based on evidence strength
      "noveltyAssessment": "Why is this new? Does it exist in prior art?"
    }
  ]
}`;

export async function generateNovelIdeas(
  sources: { name: string; concepts: ExtractedConcepts }[],
  contradictions: Contradiction[],
  temperature?: number
): Promise<NovelIdea[]> {
  const model = getClaudeModel();

  const sourcesText = sources
    .map(
      (s) =>
        `**${s.name}**:\n- Thesis: ${s.concepts.mainThesis}\n- Arguments: ${s.concepts.keyArguments.join("; ")}\n- Entities: ${s.concepts.entities.map((e) => e.name).join(", ")}\n- Methodology: ${s.concepts.methodology || "N/A"}\n- Gaps: ${s.concepts.researchGaps?.join("; ") || "None identified"}`
    )
    .join("\n\n");

  const contradictionsText =
    contradictions.length > 0
      ? contradictions
        .map((c) => `- ${c.concept}: "${c.claimA}" vs "${c.claimB}"`)
        .join("\n")
      : "No significant contradictions detected.";

  const prompt = HYPOTHESIS_GENERATION_PROMPT
    .replace("{SOURCES}", sourcesText)
    .replace("{CONTRADICTIONS}", contradictionsText);

  const result = await model.generateContent(prompt, { temperature });
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to generate novel ideas: Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Add unique IDs to each idea
  return parsed.novelIdeas.map((idea: Omit<NovelIdea, 'id'>, index: number) => ({
    ...idea,
    id: `idea-${Date.now()}-${index}`,
    // Ensure new fields are present (defaulting if LLM misses them)
    mechanism: (idea as any).mechanism || "Mechanism inferred from description",
    prediction: (idea as any).prediction || "No specific prediction generated",
  }));
}

// ===== TIER 1: CALIBRATED CONFIDENCE =====

/**
 * Calculate confidence based on measurable factors, not LLM intuition
 */
export function calculateCalibratedConfidence(
  factors: ConfidenceFactors
): { score: number; explanation: string } {
  // Weighted average of factors
  const weights = {
    sourceAgreement: 0.20,
    priorArtDistance: 0.30, // Higher weight on novelty
    contradictionResolved: 0.15,
    evidenceDepth: 0.15,
    conceptBridgeStrength: 0.20,
  };

  const score = Math.round(
    (factors.sourceAgreement * weights.sourceAgreement +
      factors.priorArtDistance * weights.priorArtDistance +
      factors.contradictionResolved * weights.contradictionResolved +
      factors.evidenceDepth * weights.evidenceDepth +
      factors.conceptBridgeStrength * weights.conceptBridgeStrength) *
    100
  );

  // Generate explanation based on factors
  const explanationParts: string[] = [];

  if (factors.priorArtDistance < 0.3) {
    explanationParts.push("Similar prior art detected (high similarity)");
  } else if (factors.priorArtDistance > 0.7) {
    explanationParts.push("Novel approach with limited prior art");
  }

  if (factors.sourceAgreement > 0.7) {
    explanationParts.push("Strong agreement across sources");
  } else if (factors.sourceAgreement < 0.4) {
    explanationParts.push("Limited source support");
  }

  if (factors.contradictionResolved > 0.7) {
    explanationParts.push("Successfully bridges conflicting concepts");
  }

  if (factors.conceptBridgeStrength < 0.4) {
    explanationParts.push("⚠️ Weak conceptual connection—may be forced synthesis");
  }

  const explanation = explanationParts.length > 0
    ? explanationParts.join(". ") + "."
    : "Moderate confidence based on available evidence.";

  return { score, explanation };
}

/**
 * Estimate confidence factors from synthesis context
 */
export function estimateConfidenceFactors(
  sources: { name: string; concepts: ExtractedConcepts }[],
  contradictions: Contradiction[],
  idea: NovelIdea,
  priorArt: PriorArt[]
): ConfidenceFactors {
  const bridgedConcepts = Array.isArray(idea.bridgedConcepts) ? idea.bridgedConcepts : [];
  // Source agreement: How many sources contribute concepts to this idea?
  const bridgedSources = bridgedConcepts.length;
  const totalSources = sources.length;
  const sourceAgreement = Math.min(bridgedSources / totalSources, 1);

  // Prior art distance: 1 - max similarity (higher = more novel)
  const maxSimilarity = priorArt.length > 0
    ? Math.max(...priorArt.map((p) => {
      const base = Number.isFinite(p.similarity) ? p.similarity : 0;
      const normalized = base > 1 ? base / 100 : base;
      return Math.max(0, Math.min(1, normalized * (p.temporalWeight ?? 1)));
    }))
    : 0;
  const priorArtDistance = 1 - maxSimilarity;

  // Contradiction resolution: Were contradictions addressed?
  const hasContradictions = contradictions.length > 0;
  const contradictionResolved = hasContradictions ? 0.5 : 0.8; // Conservative if contradictions existed

  // Evidence depth: Inferred from thesis complexity (proxy metric)
  const evidenceDepth = Math.min(idea.description.length / 1000, 1);

  // Concept bridge strength: Number of concepts bridged divided by ideal (3-5)
  const conceptBridgeStrength = Math.min(bridgedConcepts.length / 4, 1);
  const temporalDecayApplied = priorArt.some((p) => (p.temporalWeight ?? 1) < 1);

  return {
    sourceAgreement,
    priorArtDistance,
    contradictionResolved,
    evidenceDepth,
    conceptBridgeStrength,
    temporalDecayApplied,
  };
}

// ===== TIER 1: IDEA REFINEMENT =====

const REFINEMENT_PROMPT = `You are refining a novel idea that has too much similarity to existing work.

**Original Idea:**
{ORIGINAL_IDEA}

**Prior Art to AVOID (these existing works are too similar):**
{PRIOR_ART}

**Your task:** Generate a refined version of this idea that:
1. Maintains the core insight and bridged concepts
2. Takes a DIFFERENT angle that avoids overlap with the prior art
3. Finds a unique value proposition not covered by existing work

Format as JSON:
{
  "thesis": "refined thesis (one sentence)",
  "description": "refined description (2-3 paragraphs)",
  "bridgedConcepts": ["concept1", "concept2", ...],
  "differentiator": "What makes this version unique?"
}`;

export async function refineNovelIdea(
  originalIdea: NovelIdea,
  priorArtToAvoid: PriorArt[],
  iteration: number,
  critique?: CriticalAnalysis,
  temperature?: number
): Promise<NovelIdea> {
  const model = getClaudeModel();
  const bridgedConcepts = Array.isArray(originalIdea.bridgedConcepts) ? originalIdea.bridgedConcepts : [];

  const originalText = `Thesis: ${originalIdea.thesis}\n\nDescription: ${originalIdea.description}\n\nBridged Concepts: ${bridgedConcepts.join(", ")}`;

  const priorArtText = priorArtToAvoid
    .map(p => `- ${p.title} (${Math.round(p.similarity * 100)}% similar): ${p.differentiator}`)
    .join("\n");

  let prompt = REFINEMENT_PROMPT
    .replace("{ORIGINAL_IDEA}", originalText)
    .replace("{PRIOR_ART}", priorArtText);

  if (critique) {
    const critiqueText = `CRITIQUE TO ADDRESS:\n- Validity Score: ${critique.validityScore}/100\n- Flaws: ${critique.critique}\n- Biases: ${critique.biasDetected.join(", ")}`;
    prompt += `\n\n${critiqueText}\n\nIMPORTANT: Address the critique points in your refinement.`;
  }

  const result = await model.generateContent(prompt, { temperature });
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to refine idea: Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    id: `idea-${Date.now()}-refined-${iteration}`,
    thesis: parsed.thesis,
    description: parsed.description,
    bridgedConcepts: parsed.bridgedConcepts,
    confidence: originalIdea.confidence, // Will be recalculated with calibration
    noveltyAssessment: `Refined (iteration ${iteration}): ${parsed.differentiator}`,
    refinementIteration: iteration,
    refinedFrom: originalIdea.id,
  };
}

// ===== STRUCTURED APPROACH GENERATION =====

const STRUCTURED_APPROACH_PROMPT = `Based on the following novel idea, generate a detailed, actionable implementation plan.

**Novel Idea:**
{IDEA}

Create a structured approach with:
1. Title: A compelling name for this approach
2. Problem Statement: What problem does this solve?
3. Proposed Solution: High-level solution description
4. Key Steps: 5-10 actionable steps to implement this
5. Risks: What could go wrong? How to mitigate?
6. Success Metrics: How do we know this worked?

Format as JSON:
{
  "title": "string",
  "problemStatement": "string",
  "proposedSolution": "string",
  "keySteps": [
    {"order": 1, "title": "string", "description": "string", "dependencies": ["step title" or empty array]}
  ],
  "risks": [
    {"description": "string", "severity": "low|medium|high", "mitigation": "string"}
  ],
  "successMetrics": ["string", ...]
}`;

export async function generateStructuredApproach(
  idea: NovelIdea
): Promise<StructuredApproach> {
  const model = getClaudeModel();
  const bridgedConcepts = Array.isArray(idea.bridgedConcepts) ? idea.bridgedConcepts : [];

  const ideaText = `**Thesis:** ${idea.thesis}\n\n**Description:** ${idea.description}\n\n**Bridged Concepts:** ${bridgedConcepts.join(", ")}`;

  const prompt = STRUCTURED_APPROACH_PROMPT.replace("{IDEA}", ideaText);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to generate structured approach: Invalid response format");
  }

  return JSON.parse(jsonMatch[0]);
}

// ===== FULL SYNTHESIS PIPELINE =====

export interface SynthesisResult {
  sources: { name: string; concepts: ExtractedConcepts }[];
  contradictions: Contradiction[];
  contradictionMatrix?: ContradictionEvidence[];
  novelIdeas: NovelIdea[];
  selectedIdea?: NovelIdea;
  structuredApproach?: StructuredApproach;
  noveltyProof?: NoveltyProof[];
  noveltyGate?: NoveltyGateResult;
  recoveryPlan?: RecoveryPlan;
  timelineReceipt?: HybridTimelineReceipt;
  // Tier 1: Pipeline metadata
  metadata?: {
    refinementIterations: number;
    calibrationApplied: boolean;
    noveltyProofApplied?: boolean;
  };
}

/**
 * Enhanced synthesis pipeline with Tier 1 improvements:
 * - Self-correction loop (evaluate-and-refine)
 * - Calibrated confidence
 */
export async function runSynthesisPipeline(
  pdfResults: PDFExtractionResult[]
): Promise<SynthesisResult> {
  // Step 1: Extract concepts from each source
  const sourcesWithConcepts = await Promise.all(
    pdfResults.map(async (pdf) => ({
      name: pdf.fileName,
      concepts: await extractConcepts(pdf.fullText.slice(0, 50000), pdf.fileName), // Limit for API
    }))
  );

  // Step 2: Detect contradictions
  const contradictions = await detectContradictions(
    sourcesWithConcepts.map((s) => ({
      name: s.name,
      thesis: s.concepts.mainThesis,
      arguments: s.concepts.keyArguments,
    }))
  );

  // Step 3: Generate novel ideas
  const novelIdeas = await generateNovelIdeas(sourcesWithConcepts, contradictions);

  // Step 4: Generate structured approach for top idea (if any)
  let structuredApproach: StructuredApproach | undefined;
  if (novelIdeas.length > 0) {
    // Select the idea with highest confidence
    const topIdea = novelIdeas.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );
    structuredApproach = await generateStructuredApproach(topIdea);
  }

  return {
    sources: sourcesWithConcepts,
    contradictions,
    novelIdeas,
    selectedIdea: novelIdeas[0],
    structuredApproach,
    metadata: {
      refinementIterations: 0,
      calibrationApplied: false,
    },
  };
}

/**
 * Enhanced pipeline with full Tier 1 capabilities
 * Includes evaluate-and-refine loop with prior art checking
 */
export interface EnhancedSynthesisConfig {
  maxRefinementIterations?: number;
  maxNovelIdeas?: number;
  noveltyThreshold?: number; // 0-1, below this triggers refinement
  priorArtSearchFn?: (thesis: string, description: string) => Promise<PriorArt[]>;
  priorRejectionCheckFn?: (thesis: string, mechanism: string, domain?: string) => Promise<boolean>;
  validateProtocolFn?: (protocolCode: string, timeoutMs?: number) => Promise<unknown>;
  researchFocus?: string;
  enableParallelRefinement?: boolean;
  parallelConcurrency?: number;
  userId?: string;
  eventEmitter?: { emit: (data: unknown) => void };
  noveltyProofEnabled?: boolean;
  abortSignal?: AbortSignal;
}

function ensureNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Synthesis run aborted by client");
  }
}

export async function runEnhancedSynthesisPipeline(
  pdfResults: PDFExtractionResult[],
  config: EnhancedSynthesisConfig = {}
): Promise<SynthesisResult> {
  const {
    maxRefinementIterations = 3,
    maxNovelIdeas,
    noveltyThreshold = 0.30,
    eventEmitter,
    noveltyProofEnabled = process.env.HYBRID_NOVELTY_PROOF_V1 === "true",
    abortSignal,
  } = config;
  const emitTimeline = (
    event: "timeline_stage_started" | "timeline_stage_progress" | "timeline_stage_completed" | "timeline_stage_skipped",
    stage: HybridTimelineStageKey,
    state: "pending" | "active" | "done" | "blocked" | "skipped",
    meta?: HybridTimelineStageTelemetry,
  ) => {
    eventEmitter?.emit({
      event,
      stage,
      state,
      timestamp: new Date().toISOString(),
      meta,
    });
  };

  ensureNotAborted(abortSignal);

  // Step 1: Extract concepts from each source
  const sourcesWithConcepts = await Promise.all(
    pdfResults.map(async (pdf) => {
      ensureNotAborted(abortSignal);
      return {
        name: pdf.fileName,
        concepts: await extractConcepts(pdf.fullText.slice(0, 50000), pdf.fileName),
      };
    })
  );
  ensureNotAborted(abortSignal);

  // Step 2: Detect contradictions
  emitTimeline("timeline_stage_started", "contradiction_scan", "active");
  const contradictions = await detectContradictions(
    sourcesWithConcepts.map((s) => ({
      name: s.name,
      thesis: s.concepts.mainThesis,
      arguments: s.concepts.keyArguments,
    }))
  );
  ensureNotAborted(abortSignal);
  const contradictionMatrix = buildContradictionMatrix(contradictions, sourcesWithConcepts);
  emitTimeline("timeline_stage_completed", "contradiction_scan", "done", {
    rows: contradictionMatrix.length,
    highConfidenceRows: contradictionMatrix.filter((row) => row.highConfidence).length,
  });
  eventEmitter?.emit({
    event: "contradiction_matrix_built",
    rows: contradictionMatrix.length,
    highConfidenceRows: contradictionMatrix.filter((row) => row.highConfidence).length,
  });

  // Step 3: Generate novel ideas
  emitTimeline("timeline_stage_started", "hypothesis_generation", "active", {
    totalFiles: sourcesWithConcepts.length,
  });

  // Initialize Thermodynamic Evaluator for Visual TBE Integration
  const thermodynamicEvaluator = new ThermodynamicEvaluator();
  let currentTemperature = 0.7; // Base temp

  let novelIdeas = await generateNovelIdeas(sourcesWithConcepts, contradictions, currentTemperature);
  ensureNotAborted(abortSignal);
  if (typeof maxNovelIdeas === "number" && maxNovelIdeas > 0) {
    novelIdeas = novelIdeas.slice(0, maxNovelIdeas);
  }
  emitTimeline("timeline_stage_progress", "hypothesis_generation", "active", {
    passCount: novelIdeas.length,
  });
  let totalRefinements = 0;
  let noveltyProof: NoveltyProof[] = [];
  let noveltyGate: NoveltyGateResult | undefined;
  let recoveryPlan: RecoveryPlan | undefined;

  const statValidator = process.env.ENABLE_STATISTICAL_VALIDATION === "true"
    ? new StatisticalValidator()
    : null;

  // Step 4: TIER 1 - Evaluate and refine loop (requires priorArtSearchFn to be passed)
  if (config.priorArtSearchFn) {
    for (let i = 0; i < novelIdeas.length; i++) {
      ensureNotAborted(abortSignal);
      let idea = novelIdeas[i];
      let iteration = 0;

      while (iteration < maxRefinementIterations) {
        ensureNotAborted(abortSignal);
        // Search prior art for this idea
        const priorArt = await config.priorArtSearchFn(idea.thesis, idea.description);
        ensureNotAborted(abortSignal);

        // Estimate confidence factors with prior art data
        const factors = estimateConfidenceFactors(
          sourcesWithConcepts,
          contradictions,
          idea,
          priorArt
        );

        // Calculate calibrated confidence
        const { score, explanation } = calculateCalibratedConfidence(factors);

        // Update idea with calibrated confidence
        const enrichedIdea = {
          ...idea,
          confidence: score,
          confidenceFactors: factors,
          confidenceExplanation: explanation,
        };
        if (factors.temporalDecayApplied) {
          enrichedIdea.confidenceExplanation =
            `${enrichedIdea.confidenceExplanation} 📅 Age-weighted prior art considered.`;
        }
        if (statValidator) {
          const statisticalMetrics = statValidator.validateHypothesis(
            enrichedIdea,
            sourcesWithConcepts.map((s) => s.concepts)
          );
          enrichedIdea.statisticalMetrics = statisticalMetrics;
          eventEmitter?.emit({
            event: "statistical_validation",
            pValue: statisticalMetrics.pValue,
            bayesFactor: statisticalMetrics.bayesFactor,
            interpretation: statisticalMetrics.interpretation,
          });
        }
        idea = enrichedIdea;

        // --- Visual TBE Integration ---
        // Proxy Spectral Gap calculation using Prior Art Variance
        let proxySpectralGap = 0.1; // Default safe gap
        if (priorArt.length > 1) {
          const meanSim = priorArt.reduce((a, b) => a + b.similarity, 0) / priorArt.length;
          const variance = priorArt.reduce((a, b) => a + Math.pow(b.similarity - meanSim, 2), 0) / (priorArt.length - 1);
          // High variance = low spectral gap (exploration), low variance = high spectral gap (trap)
          // Wait, if variance is low, all prior art is equally similar - typical coherence trap. So low variance -> low spectral gap.
          proxySpectralGap = variance;
        } else if (priorArt.length === 1 && priorArt[0].similarity > 0.8) {
          proxySpectralGap = 0.05; // Force trap condition if stuck on one highly similar prior art
        }

        const tbeResult = thermodynamicEvaluator.evaluate(proxySpectralGap, 0.7, iteration + 1);
        currentTemperature = tbeResult.recommendedTemperature;

        eventEmitter?.emit({
          event: 'tbe_telemetry',
          spectralGap: proxySpectralGap,
          temperature: currentTemperature,
          isTriggered: tbeResult.isTriggered
        });
        // ------------------------------

        // Check if refinement needed (prior art too similar)
        const maxSimilarity = priorArt.length > 0
          ? Math.max(...priorArt.map(p => p.similarity))
          : 0;

        if (maxSimilarity > (1 - noveltyThreshold)) {
          // Too similar to prior art - refine
          const similarArt = priorArt.filter(p => p.similarity > 0.5);

          try {
            idea = await refineNovelIdea(idea, similarArt, iteration + 1, undefined, currentTemperature);
            totalRefinements++;
            iteration++;
            ensureNotAborted(abortSignal);
          } catch {
            // Refinement failed, keep current idea
            break;
          }
        } else {
          // Novel enough, exit loop
          break;
        }
      }

      novelIdeas[i] = idea;
      emitTimeline("timeline_stage_progress", "hypothesis_generation", "active", {
        processedFiles: i + 1,
        totalFiles: novelIdeas.length,
      });
    }
  } else {
    // No prior art search provided - just apply calibration with empty prior art
    novelIdeas = novelIdeas.map((idea) => {
      const factors = estimateConfidenceFactors(
        sourcesWithConcepts,
        contradictions,
        idea,
        [] // No prior art data
      );
      const { score, explanation } = calculateCalibratedConfidence(factors);

      const enrichedIdea = {
        ...idea,
        confidence: score,
        confidenceFactors: factors,
        confidenceExplanation: explanation,
      };
      if (factors.temporalDecayApplied) {
        enrichedIdea.confidenceExplanation =
          `${enrichedIdea.confidenceExplanation} 📅 Age-weighted prior art considered.`;
      }
      if (statValidator) {
        const statisticalMetrics = statValidator.validateHypothesis(
          enrichedIdea,
          sourcesWithConcepts.map((s) => s.concepts)
        );
        enrichedIdea.statisticalMetrics = statisticalMetrics;
        eventEmitter?.emit({
          event: "statistical_validation",
          pValue: statisticalMetrics.pValue,
          bayesFactor: statisticalMetrics.bayesFactor,
          interpretation: statisticalMetrics.interpretation,
        });
      }

      return enrichedIdea;
    });
  }


  // Step 5: TIER 2 - Rigorous Hypothesis Generation (Scientific Method)
  const hypothesisGenerator = new HypothesisGenerator();

  // Enhance all ideas with formal hypotheses
  novelIdeas = await Promise.all(
    novelIdeas.map(async (idea) => {
      ensureNotAborted(abortSignal);
      // Logic: Only apply deep hypothesis generation to high-potential ideas to save latency
      // For now, we apply to all for maximum rigor as per "K-Dense" principles
      let deepHypothesis = await hypothesisGenerator.generate(idea);
      ensureNotAborted(abortSignal);
      let refinedIdea = { ...idea, structuredHypothesis: deepHypothesis };

      // ADVERSARIAL CRITIQUE LOOP (Target 90+ Score)
      let critique = await evaluateCriticalThinking(refinedIdea);
      let attempts = 0;

      while (critique.validityScore < 90 && attempts < 2) {
        // Self-Correction: Refine based on critique
        // Apply currentTemperature determined by TBE Evaluator
        const tempRefinedIdea = await refineNovelIdea(refinedIdea, [], attempts + 1, critique, currentTemperature);
        ensureNotAborted(abortSignal);
        // Re-generate hypothesis for the refined idea
        deepHypothesis = await hypothesisGenerator.generate(tempRefinedIdea);
        ensureNotAborted(abortSignal);
        refinedIdea = { ...tempRefinedIdea, structuredHypothesis: deepHypothesis };
        // Re-evaluate
        critique = await evaluateCriticalThinking(refinedIdea);
        attempts++;
      }

      const sourceSnippetCandidates = sourcesWithConcepts
        .flatMap((s) => s.concepts.keyArguments || [])
        .filter(Boolean)
        .slice(0, 6);
      const currentBridgedConcepts = Array.isArray(refinedIdea.bridgedConcepts) ? refinedIdea.bridgedConcepts : [];
      const fallbackSnippets = sourceSnippetCandidates.length > 0
        ? sourceSnippetCandidates
        : currentBridgedConcepts.slice(0, 4);
      const snippetLinks = linkSnippetsToPDF(
        fallbackSnippets,
        pdfResults[0]?.pagedText,
        pdfResults[0]?.fileName
      );

      // Attach final critique
      refinedIdea.criticalAnalysis = critique;
      refinedIdea.evidenceSnippets = snippetLinks;

      return refinedIdea;
    })
  );
  emitTimeline("timeline_stage_completed", "hypothesis_generation", "done", {
    passCount: novelIdeas.length,
    blockedCount: 0,
  });

  let gatedIdeas = novelIdeas;
  if (noveltyProofEnabled) {
    emitTimeline("timeline_stage_started", "novelty_proof", "active");
    ensureNotAborted(abortSignal);
    // Step 6: Novelty Proof Engine + hard gate policy
    noveltyProof = await computeNoveltyProofs(novelIdeas, contradictionMatrix, {
      noveltyThreshold,
      falsifiabilityThreshold: 0.55,
      contradictionThreshold: 0.45,
      priorArtSearchFn: config.priorArtSearchFn,
    });
    ensureNotAborted(abortSignal);
    eventEmitter?.emit({
      event: "novelty_proof_computed",
      proofCount: noveltyProof.length,
    });
    const avgPriorArtDistance = noveltyProof.length > 0
      ? noveltyProof.reduce((sum, row) => sum + row.priorArtDistance, 0) / noveltyProof.length
      : 0;
    emitTimeline("timeline_stage_completed", "novelty_proof", "done", {
      proofCount: noveltyProof.length,
      avgPriorArtDistance: Number(avgPriorArtDistance.toFixed(3)),
    });

    noveltyGate = computeNoveltyGate(noveltyProof, { noveltyThreshold });

    if (!hasHighConfidenceContradictions(contradictionMatrix)) {
      noveltyGate = {
        ...noveltyGate,
        decision: "recover",
        reasons: [...new Set([...(noveltyGate.reasons || []), "no_high_confidence_contradictions"])],
      };
    }

    eventEmitter?.emit({
      event: "novelty_gate_decision",
      decision: noveltyGate.decision,
      passingIdeas: noveltyGate.passingIdeas,
      blockedIdeas: noveltyGate.blockedIdeas,
      reasons: noveltyGate.reasons,
    });
    emitTimeline("timeline_stage_completed", "novelty_gate", noveltyGate.decision === "fail" ? "blocked" : "done", {
      decision: noveltyGate.decision,
      passCount: noveltyGate.passingIdeas,
      blockedCount: noveltyGate.blockedIdeas,
    });

    if (noveltyGate.decision !== "pass") {
      emitTimeline("timeline_stage_started", "recovery_plan", "active");
      recoveryPlan = buildNoveltyRecoveryPlan({
        gate: noveltyGate,
        proofs: noveltyProof,
        contradictionMatrix,
      });
      ensureNotAborted(abortSignal);
      eventEmitter?.emit({
        event: "recovery_plan_generated",
        diagnosisCount: recoveryPlan.diagnosis.length,
      });
      emitTimeline("timeline_stage_completed", "recovery_plan", "done", {
        signal: recoveryPlan.message,
      });
    } else {
      emitTimeline("timeline_stage_skipped", "recovery_plan", "skipped", {
        reason: "gate_passed",
      });
    }

    const passingIdeaIds = new Set(
      noveltyProof.filter((proof) => proof.proofStatus === "pass").map((proof) => proof.ideaId),
    );
    gatedIdeas = noveltyGate.decision === "pass"
      ? novelIdeas.filter((idea) => passingIdeaIds.has(idea.id))
      : [];
  } else {
    emitTimeline("timeline_stage_skipped", "novelty_proof", "skipped", { reason: "feature_flag_disabled" });
    emitTimeline("timeline_stage_skipped", "novelty_gate", "skipped", { reason: "feature_flag_disabled" });
    emitTimeline("timeline_stage_skipped", "recovery_plan", "skipped", { reason: "feature_flag_disabled" });
  }

  // Step 7: Generate structured approach for top idea
  let structuredApproach: StructuredApproach | undefined;
  if (gatedIdeas.length > 0) {
    ensureNotAborted(abortSignal);
    const topIdea = gatedIdeas.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );
    structuredApproach = await generateStructuredApproach(topIdea);
    ensureNotAborted(abortSignal);
  }

  return {
    sources: sourcesWithConcepts,
    contradictions,
    contradictionMatrix,
    novelIdeas: gatedIdeas,
    selectedIdea: gatedIdeas[0],
    structuredApproach,
    noveltyProof,
    noveltyGate,
    recoveryPlan,
    metadata: {
      refinementIterations: totalRefinements,
      calibrationApplied: true,
      noveltyProofApplied: noveltyProofEnabled,
    },
  };
}
