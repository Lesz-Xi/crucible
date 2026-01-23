// Synthesis Engine - Core Module
// Implements Hong-inspired architecture for generating novel ideas from multiple sources
// Tier 1: Added self-correction loop and calibrated confidence
// Stage 2: Claude-centric Sovereign Mastermind Integration

import { getClaudeModel } from "@/lib/ai/anthropic";
import { HypothesisGenerator } from "@/lib/ai/hypothesis-generator";
import { MasaAuditor } from "./masa-auditor";
import { ExperimentGenerator } from "./experiment-generator";
import { MockCloudLab } from "@/lib/services/mock-cloud-lab";
import { cleanJson, safeParseJson } from "./ai-utils";
import {
PDFExtractionResult } from "@/lib/extractors/pdf-extractor";
import {
  NovelIdea,
  StructuredApproach,
  ExtractedConcepts,
  Contradiction,
  Entity,
  ConfidenceFactors,
  PriorArt,
  CriticalAnalysis,
  SynthesisResult,
  HypothesisNode
} from "@/types";
import { evaluateCriticalThinking } from "./novelty-evaluator";
import { StreamingEventEmitter, AgentPersona } from "@/lib/streaming-event-emitter";
import { checkEquivalenceClasses, PatternEquivalenceClass } from "@/lib/services/embedding-service";
import { runHongRecombination } from "./hong-recombination";
import { Semaphore } from "./concurrency-semaphore";
import { ThermodynamicBasisExpansion } from "./thermodynamic-basis";




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

  const parsed = safeParseJson<any>(responseText, {});

  // Add sourceId to each entity
  const entities: Entity[] = (parsed.entities || []).map((e: any) => ({
    ...e,
    sourceId,
  }));

  return {
    mainThesis: parsed.mainThesis || "No explicit thesis identified",
    keyArguments: parsed.keyArguments || [],
    entities,
    methodology: parsed.methodology || "Unspecified",
    evidenceQuality: parsed.evidenceQuality || "moderate",
    researchGaps: parsed.researchGaps || [],
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

  const parsed = safeParseJson<any>(responseText, { contradictions: [] });
  return parsed.contradictions || [];
}

// ===== NOVEL IDEA GENERATION (Hong-Inspired) =====

const HYPOTHESIS_GENERATION_PROMPT = `You are the Sovereign Synthesis Engine. Generate 3-5 distinct, competing scientific hypotheses (inventions) that resolve the identified contradictions.

**Evidence (Observations):**
{SOURCES}

**Identified Tensions (Contradictions):**
{CONTRADICTIONS}

**Scientific Constraints:**
1. **Explanatory Power**: Prioritize deep mechanistic explanations over predictions.
2. **Hard to Vary**: Theories must be specific and interconnected. 
3. **Be Concise**: Each description must be UNDER 200 words. Each mechanism must be UNDER 150 words.
4. **Evidence Mapping**: Cite specific "Evidence Snippets" (e.g., "From Source A: [text]"). Keep snippets brief.

**LANGUAGE STYLE (IMPORTANT):**
- **thesis** and **description**: Write in clear, accessible prose suitable for a general educated audience. Avoid jargon and mathematical notation unless absolutely essential. If you reference a technical concept, briefly explain it.
- **mechanism**: You may use more precise scientific terminology here, but ensure any formulas or notation are accompanied by a plain-English explanation.
- **prediction** and **crucialExperiment**: Write clearly so anyone can understand what would prove or disprove the idea.

**IMPORTANT: Your response must be EXCLUSIVELY a JSON object. No preamble.**

Format as JSON:
{
  "novelIdeas": [
    {
      "thesis": "One-sentence hypothesis statement (clear, non-technical)",
      "description": "Concise, accessible explanation of the invention/idea",
      "mechanism": "Step-by-step causal mechanism (can be technical, but explain notation)",
      "explanationDepth": number, // 0-100 score
      "evidenceSnippets": ["string from source A", ...],
      "prediction": "Specific, falsifiable prediction (plain language)",
      "crucialExperiment": "The ONE experiment to disprove this (accessible)",
      "bridgedConcepts": ["concept from Source A", ...],
      "confidence": number, // 0-100
      "noveltyAssessment": "Why is this new?"
    }
  ]
}`;

export async function generateNovelIdeas(
  sources: { name: string; concepts: ExtractedConcepts }[],
  contradictions: Contradiction[],
  researchFocus?: string
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

  // Inject user research focus if provided
  const focusContext = researchFocus 
    ? `\n\n**USER RESEARCH FOCUS:** ${researchFocus}\nPrioritize generating ideas that align with this research direction. Weight contradictions and synthesis opportunities toward this focus.\n`
    : "";

  const prompt = HYPOTHESIS_GENERATION_PROMPT
    .replace("{SOURCES}", sourcesText)
    .replace("{CONTRADICTIONS}", contradictionsText + focusContext);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
  
    const parsed = safeParseJson<{ novelIdeas: any[] }>(responseText, { novelIdeas: [] });
    const uniqueIdeas = Array.isArray(parsed.novelIdeas) ? parsed.novelIdeas : [];
      
    return uniqueIdeas.map((idea: any, index: number) => ({
      ...idea,
      id: `idea-${Date.now()}-${index}`,
      mechanism: idea.mechanism || "Mechanism inferred from description",
      prediction: idea.prediction || "No specific prediction generated",
      explanationDepth: idea.explanationDepth || 50,
      evidenceSnippets: Array.isArray(idea.evidenceSnippets) ? idea.evidenceSnippets : [],
      crucialExperiment: idea.crucialExperiment || "Verify through disconfirming research",
      bridgedConcepts: Array.isArray(idea.bridgedConcepts) ? idea.bridgedConcepts : [],
    }));
}

// ===== TIER 1: CALIBRATED CONFIDENCE =====
// Hong Nekrasov-Okounkov: Log-concave confidence calibration
// Ensures quality distributions have unimodal concentration

/**
 * Check if a sorted array of values exhibits log-concavity.
 * Log-concave: a[i]² ≥ a[i-1] × a[i+1] for all middle elements
 */
function checkLogConcavity(values: number[]): { isLogConcave: boolean; peakIndex: number } {
  if (values.length < 3) return { isLogConcave: true, peakIndex: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  let violations = 0;
  let peakIndex = 0;
  let maxValue = 0;
  
  for (let i = 1; i < sorted.length - 1; i++) {
    const prev = sorted[i - 1] || 0.001;
    const curr = sorted[i] || 0.001;
    const next = sorted[i + 1] || 0.001;
    
    // Check log-concavity: curr² ≥ prev × next
    if (curr * curr < prev * next) {
      violations++;
    }
    
    if (curr > maxValue) {
      maxValue = curr;
      peakIndex = i;
    }
  }
  
  return { isLogConcave: violations === 0, peakIndex };
}

/**
 * Calculate geometric mean of weighted factors.
 * Geometric mean respects log-concavity better than arithmetic mean.
 */
function geometricMean(factors: number[], weights: number[]): number {
  let logSum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < factors.length; i++) {
    const f = Math.max(0.01, factors[i]); // Avoid log(0)
    const w = weights[i];
    logSum += w * Math.log(f);
    weightSum += w;
  }
  
  return Math.exp(logSum / weightSum);
}

export function calculateCalibratedConfidence(
  factors: ConfidenceFactors
): { score: number; explanation: string; isLogConcave?: boolean } {
  const weights = {
    sourceAgreement: 0.20,
    priorArtDistance: 0.30,
    contradictionResolved: 0.15,
    evidenceDepth: 0.15,
    conceptBridgeStrength: 0.20,
  };

  const factorValues = [
    factors.sourceAgreement,
    factors.priorArtDistance,
    factors.contradictionResolved,
    factors.evidenceDepth,
    factors.conceptBridgeStrength
  ];
  const weightValues = Object.values(weights);
  
  // Hong Nekrasov-Okounkov: Use geometric mean for log-concave alignment
  const geoMean = geometricMean(factorValues, weightValues);
  
  // Check log-concavity of factor distribution
  const { isLogConcave, peakIndex } = checkLogConcavity(factorValues);
  
  // Apply log-concavity adjustment:
  // - Unimodal (log-concave) distributions get a small boost
  // - Scattered (non-log-concave) distributions get a penalty
  const logConcaveMultiplier = isLogConcave ? 1.05 : 0.90;
  
  // Calculate final score using geometric mean (respects log-concavity)
  const rawScore = geoMean * logConcaveMultiplier * 100;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

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
    explanationParts.push("\u26A0\uFE0F Weak conceptual connection\u2014may be forced synthesis");
  }
  
  // Add log-concavity status to explanation
  if (isLogConcave) {
    explanationParts.push("✓ Quality factors show unimodal concentration (Hong-aligned)");
  } else {
    explanationParts.push("⚠️ Quality factors are scattered (non-unimodal)");
  }

  const explanation = explanationParts.length > 0 
    ? explanationParts.join(". ") + "."
    : "Moderate confidence based on available evidence.";

  return { score, explanation, isLogConcave };
}

export function estimateConfidenceFactors(
  sources: { name: string; concepts: ExtractedConcepts }[],
  contradictions: Contradiction[],
  idea: NovelIdea,
  priorArt: PriorArt[]
): ConfidenceFactors {
  // Helper to clamp values to [0, 1] range
  const clamp = (val: number) => Math.max(0, Math.min(1, val));

  const bridgedSources = idea.bridgedConcepts.length;
  const totalSources = Math.max(sources.length, 1); // Prevent division by zero
  const sourceAgreement = clamp(bridgedSources / totalSources);

  // Clamp similarity to [0, 1] before calculating distance
  const maxSimilarity = priorArt.length > 0 
    ? clamp(Math.max(...priorArt.map(p => p.similarity || 0))) 
    : 0;
  const priorArtDistance = clamp(1 - maxSimilarity);

  const hasContradictions = contradictions.length > 0;
  const contradictionResolved = hasContradictions ? 0.5 : 0.8;

  const evidenceDepth = clamp((idea.description?.length || 0) / 1000);
  const conceptBridgeStrength = clamp(idea.bridgedConcepts.length / 4);

  return {
    sourceAgreement,
    priorArtDistance,
    contradictionResolved,
    evidenceDepth,
    conceptBridgeStrength,
  };
}

// ===== TIER 1: IDEA REFINEMENT =====

const REFINEMENT_PROMPT = `You are refining a scientific hypothesis to increase its "Explanatory Depth" and ensure it is "Hard to Vary".

**Original Idea:**
{ORIGINAL_IDEA}

**Prior Art/Critique to Address:**
{PRIOR_ART}

**Your task:** Generate a refined version of this idea that:
1. **Strengthens the Mechanism**: Move from surface-level description to a deep, causal mechanism.
2. **Hardens the Theory**: Eliminate "Easy to Vary" elements. Make the theory specific and interconnected with the evidence.
3. **Improves Evidence Integration**: Explicitly map the hypothesis to "Evidence Snippets".
4. **Defines a Crucial Test**: Provide a specific, falsifiable experiment that could disprove this theory.

Format as JSON:
{
  "thesis": "refined thesis (one sentence)",
  "description": "refined description (2-3 paragraphs)",
  "mechanism": "deep causal mechanism",
  "explanationDepth": number, // 0-100 score
  "evidenceSnippets": ["snippet 1", "snippet 2"],
  "crucialExperiment": "Specific disconfirming test",
  "bridgedConcepts": ["concept1", "concept2", ...],
  "differentiator": "What makes this version more 'Hard to Vary'?"
}`;

export async function refineNovelIdea(
  originalIdea: NovelIdea,
  priorArtToAvoid: PriorArt[],
  iteration: number,
  critique?: CriticalAnalysis
): Promise<NovelIdea> {
  const model = getClaudeModel();

  const originalText = `Thesis: ${originalIdea.thesis}\n\nDescription: ${originalIdea.description}\n\nBridged Concepts: ${originalIdea.bridgedConcepts.join(", ")}`;
  
  const priorArtText = priorArtToAvoid
    .map(p => `- ${p.title} (${Math.round(p.similarity * 100)}% similar): ${p.differentiator}`)
    .join("\n");

  let prompt = REFINEMENT_PROMPT
    .replace("{ORIGINAL_IDEA}", originalText)
    .replace("{PRIOR_ART}", priorArtText);

  if (critique) {
    const critiqueText = `CRITIQUE TO ADDRESS:\n- Validity Score: ${critique.validityScore}/100\n- Flaws: ${critique.critique}\n- Biases: ${critique.biasDetected.join(", ")}`;
    prompt += `\n\n${critiqueText}`;
    
    if (critique.remediationConstraints && critique.remediationConstraints.length > 0) {
      const constraints = critique.remediationConstraints.map(c => `CONSTRAINT: ${c}`).join("\n");
      prompt += `\n\n${constraints}\n\nWARNING: You MUST adhere to the above constraints in your refinement. Failure to do so will result in rejection.`;
    }

    prompt += `\n\nIMPORTANT: Address the critique points in your refinement.`;
  }

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  /*
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to refine idea: Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  */
  // Use safeParseJson with fallback to handle malformed/truncated responses
  const fallback = {
    thesis: originalIdea.thesis,
    description: originalIdea.description,
    mechanism: originalIdea.mechanism,
    differentiator: "Fallback due to parsing error",
    evidenceSnippets: originalIdea.evidenceSnippets,
    crucialExperiment: originalIdea.crucialExperiment,
    bridgedConcepts: originalIdea.bridgedConcepts,
    explanationDepth: originalIdea.explanationDepth || 70
  };
  const parsed = safeParseJson<any>(responseText, fallback);

  return {
    id: `idea-${Date.now()}-refined-${iteration}`,
    thesis: parsed.thesis,
    description: parsed.description,
    mechanism: parsed.mechanism || originalIdea.mechanism,
    explanationDepth: parsed.explanationDepth || 70,
    evidenceSnippets: parsed.evidenceSnippets || originalIdea.evidenceSnippets,
    crucialExperiment: parsed.crucialExperiment || originalIdea.crucialExperiment,
    bridgedConcepts: parsed.bridgedConcepts,
    confidence: originalIdea.confidence,
    noveltyAssessment: `Refined (iteration ${iteration}): ${parsed.differentiator}`,
    refinementIteration: iteration,
    refinedFrom: originalIdea.id,
    explanatoryMechanism: parsed.mechanism || "",
    isExplainedByPriorArt: false
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

**LANGUAGE STYLE (CRITICAL):**
- Write in clear, accessible prose suitable for a business or general educated audience.
- Avoid jargon, mathematical notation, and overly technical language.
- Focus on practical, actionable guidance that anyone can understand.
- Each step description should be concrete and specific.

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

  const ideaText = `**Thesis:** ${idea.thesis}\n\n**Description:** ${idea.description}\n\n**Bridged Concepts:** ${idea.bridgedConcepts.join(", ")}`;

  const prompt = STRUCTURED_APPROACH_PROMPT.replace("{IDEA}", ideaText);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  /*
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to generate structured approach: Invalid response format");
  }

  return JSON.parse(jsonMatch[0]);
  */
  
  const fallback: StructuredApproach = {
    title: "Implementation Plan",
    problemStatement: "Problem statement could not be parsed.",
    proposedSolution: "Solution could not be parsed.",
    keySteps: [],
    risks: [],
    successMetrics: []
  };

  return safeParseJson<StructuredApproach>(responseText, fallback);
}

// ===== SCIENTIFIC PROSE GENERATION =====

const SCIENTIFIC_PROSE_PROMPT = `You are a professional scientific editor. Your task is to synthesize the following raw hypothesis data into a high-fidelity, peer-review quality scientific narrative.

**Raw Hypothesis Data:**
{HYPOTHESIS_DATA}

**Writing Standards:**
1. **Precision**: Use specific scientific terminology correctly.
2. **Clarity**: Avoid jargon for the sake of jargon. Explain complex mechanisms clearly.
3. **Flow**: Ensure a logical progression from Observation -> Contradiction -> Hypothesis -> Mechanism -> Prediction.
4. **Active Voice**: Use active voice where appropriate.
5. **Deutschian Depth**: Highlight the "explanatory power" and "crucial tests".

Format as a structured markdown report.`;

export async function synthesizeScientificProse(
  idea: NovelIdea,
  contradictions: Contradiction[]
): Promise<string> {
  const model = getClaudeModel();
  
  const dataText = `
    Thesis: ${idea.thesis}
    Description: ${idea.description}
    Mechanism: ${idea.mechanism}
    Evidence Snippets: ${idea.evidenceSnippets?.join("; ") || "Directly inferred from source synthesis"}
    Prediction: ${idea.prediction}
    Crucial Experiment: ${idea.crucialExperiment}
    Contradictions Resolved: ${contradictions.map(c => c.concept).join(", ")}
  `;

  const prompt = SCIENTIFIC_PROSE_PROMPT.replace("{HYPOTHESIS_DATA}", dataText);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ===== FULL SYNTHESIS PIPELINES =====

export interface EnhancedSynthesisConfig {
  maxRefinementIterations?: number;
  noveltyThreshold?: number;
  maxNovelIdeas?: number; // Limit output ideas (2 for company analysis)
  priorArtSearchFn?: (thesis: string, description: string) => Promise<PriorArt[]>;
  priorRejectionCheckFn?: (thesis: string, mechanism: string) => Promise<boolean>;
  // Hong Pattern Avoidance: Enable equivalence class checking
  enableEquivalenceClassCheck?: boolean;
  equivalenceClasses?: PatternEquivalenceClass[]; // Pre-computed clusters (optional)
  // Hong MCMC Exploration: Enable hypothesis space exploration
  enableMCMCExploration?: boolean;
  mcmcConfig?: { numSamples?: number; burnIn?: number; temperature?: number };
  validateProtocolFn?: (protocolCode: string) => Promise<{ success: boolean; metrics?: { pValue?: number; bayesFactor?: number }; error?: string }>;
  eventEmitter?: StreamingEventEmitter;
  // User-guided synthesis direction (optional)
  researchFocus?: string;
  // Concurrency control for refinement
  enableParallelRefinement?: boolean;
  parallelConcurrency?: number;
}

export async function runEnhancedSynthesisPipeline(
  pdfResults: PDFExtractionResult[],
  config: EnhancedSynthesisConfig = {}
): Promise<SynthesisResult> {
  const {
    maxRefinementIterations = 2,
    noveltyThreshold = 0.30,
    maxNovelIdeas, // Limit output ideas (undefined = no limit)
    eventEmitter
  } = config;
  
  // Helper for rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Step 1: Extract concepts (SERIALIZED to prevent rate limits)
  const sourcesWithConcepts: SynthesisResult['sources'] = [];
  for (const pdf of pdfResults) {
    console.log(`[Synthesis] Extracting concepts from: ${pdf.fileName}`);
    const concepts = await extractConcepts(pdf.fullText.slice(0, 50000), pdf.fileName);
    sourcesWithConcepts.push({
      name: pdf.fileName,
      type: pdf.sourceType ?? 'pdf',
      mainThesis: concepts.mainThesis,
      keyArguments: concepts.keyArguments,
      concepts
    });
    // Brief delay between extractions
    await delay(1000);
  }

  // Step 2: Detect contradictions
  const contradictions = await detectContradictions(
    sourcesWithConcepts.map((s) => ({
      name: s.name,
      thesis: s.concepts.mainThesis,
      arguments: s.concepts.keyArguments,
    }))
  );
  
  if (eventEmitter) {
    if (contradictions.length > 0) {
      eventEmitter.emit({ event: 'thinking_step', content: `Detected ${contradictions.length} dialectical tensions between sources.` });
    }
  }

  // Step 3: Generate initial novel ideas
  if (eventEmitter) eventEmitter.emit({ event: 'agent_switch', agent: 'creator' });
  
  let novelIdeas: NovelIdea[];
  
  // Hong MCMC Exploration: Use Markov Chain Monte Carlo for hypothesis space exploration
  if (config.enableMCMCExploration) {
    console.log('[Synthesis] 🔬 Hong MCMC Exploration enabled - using Markov Chain sampling');
    if (eventEmitter) eventEmitter.emit({ event: 'thinking_step', content: 'Initiating Hong MCMC hypothesis space exploration...' });
    
    novelIdeas = await runHongRecombination(
      sourcesWithConcepts,
      contradictions,
      config.mcmcConfig || { numSamples: 8, burnIn: 2, temperature: 0.5 }
    );
    
    console.log(`[Synthesis] MCMC exploration complete: ${novelIdeas.length} unique hypotheses sampled`);
  } else {
    // Standard single-shot generation
    novelIdeas = await generateNovelIdeas(sourcesWithConcepts, contradictions, config.researchFocus);
  }
  
  // VECTOR MEMORY CHECK: Filter out previously rejected ideas
  if (config.priorRejectionCheckFn) {
    const filteredIdeas: NovelIdea[] = [];
    for (const idea of novelIdeas) {
        if (eventEmitter) {
           eventEmitter.emit({ 
              event: 'hypothesis_generated', 
              hypothesis: {
                 id: idea.id,
                 label: idea.thesis,
                 status: 'generated'
              }
           });
        }
        
        const isRejected = await config.priorRejectionCheckFn(idea.thesis, idea.mechanism || "Unspecified");
        
        // Hong Pattern Avoidance: Also check equivalence classes if enabled
        let isInForbiddenClass = false;
        if (config.enableEquivalenceClassCheck) {
          const classMatch = await checkEquivalenceClasses(idea.thesis, idea.mechanism || "", config.equivalenceClasses);
          if (classMatch?.isWithinClass) {
            isInForbiddenClass = true;
            console.log(`[Synthesis] Hong Pattern Match: idea in class ${classMatch.classId} (${classMatch.memberCount} prior rejections)`);
          }
        }
        
        if (!isRejected && !isInForbiddenClass) {
            filteredIdeas.push(idea);
        } else {
            const reason = isInForbiddenClass ? "Hong Equivalence Class match (forbidden pattern)" : "Recurrent failure in vector memory";
            console.warn(`[Synthesis] Dropped idea: ${idea.thesis.slice(0, 50)}... Reason: ${reason}`);
            if (eventEmitter) {
               eventEmitter.emit({ event: 'hypothesis_refuted', id: idea.id, reason });
            }
        }
    }
    novelIdeas = filteredIdeas;
  }

  // THERMODYNAMIC BASIS: Detect local optima and trigger expansion if needed
  const thermoModule = new ThermodynamicBasisExpansion();
  
  if (novelIdeas.length >= 2) {
    const spectralGap = thermoModule.computeSpectralGap(novelIdeas);
    const lipschitzConstant = thermoModule.estimateLipschitzConstant(novelIdeas);
    const threshold = 1.0 / Math.sqrt(lipschitzConstant);
    
    // Emit spectral gap analysis event
    if (eventEmitter) {
      eventEmitter.emit({ 
        event: 'spectral_gap_analysis',
        spectralGap: {
          lambda_min: spectralGap.lambda_min,
          lambda_max: spectralGap.lambda_max,
          spectralGap: spectralGap.spectralGap,
          conditionNumber: spectralGap.conditionNumber,
          threshold: threshold
        },
        lipschitzConstant: lipschitzConstant
      });
      
      eventEmitter.emit({ 
        event: 'thinking_step', 
        content: `Spectral Gap Analysis: λ_min=${spectralGap.lambda_min.toFixed(3)}, L=${lipschitzConstant.toFixed(3)}, threshold=${threshold.toFixed(3)}` 
      });
    }
    
    if (thermoModule.shouldTriggerExpansion(spectralGap, lipschitzConstant)) {
      console.log('[Synthesis] 🔥 Thermodynamic expansion triggered - increasing exploration temperature');
      
      // Emit expansion event
      if (eventEmitter) {
        eventEmitter.emit({
          event: 'thermodynamic_expansion',
          triggered: true,
          temperature: 1.5
        });
        
        eventEmitter.emit({ 
          event: 'thinking_step', 
          content: '⚡ Thermodynamic expansion phase activated - melting local barriers...' 
        });
      }
      
      // Trigger high-temperature MCMC exploration
      const expansionIdeas = await runHongRecombination(
        sourcesWithConcepts,
        contradictions,
        { numSamples: 5, burnIn: 1, temperature: 1.5 }
      );
      
      console.log(`[Synthesis] Generated ${expansionIdeas.length} high-temperature ideas`);
      
      // Merge with existing ideas (keep diversity)
      novelIdeas = [...novelIdeas, ...expansionIdeas];
    }
  }

  // IDEA LIMITING: Apply maxNovelIdeas constraint if specified
  if (maxNovelIdeas !== undefined && novelIdeas.length > maxNovelIdeas) {
    console.log(`[Synthesis] Limiting ideas from ${novelIdeas.length} to ${maxNovelIdeas}`);
    // Sort by confidence to keep the best ideas
    novelIdeas.sort((a, b) => b.confidence - a.confidence);
    novelIdeas = novelIdeas.slice(0, maxNovelIdeas);
  }

  let totalRefinements = 0;
  // Hong Pop-Stack-Sorting Metrics: Track t-Pop-sortability
  let convergenceCount = 0; // Ideas that converged before maxIterations
  let totalConvergenceSteps = 0; // Sum of steps to reach convergence

  // Step 4: Multi-Agent Mastermind Refining Loop
  const hypothesisGenerator = new HypothesisGenerator();
  const masaAuditor = new MasaAuditor();
  const experimentGenerator = new ExperimentGenerator();

  const refinedIdeas: NovelIdea[] = [];

  // Parallel Refinement with Semaphore
  const concurrencyLevel = config.enableParallelRefinement 
      ? (config.parallelConcurrency || 3) 
      : 1;
  const semaphore = new Semaphore(concurrencyLevel);
  console.log(`[Synthesis] Refinement Concurrency Level: ${concurrencyLevel}`);

  const refinementPromises = novelIdeas.map((originalIdea) => semaphore.run(async () => {
      let currentIdea = originalIdea;
      let iteration = 0;
      let finalAudit: any;
      let didConverge = false;
      let convergenceStep = -1;

      while (iteration < maxRefinementIterations) {
        // [PHASE TRANSITION] Prior Art Falsification
        if (eventEmitter) eventEmitter.emit({ event: 'phase_transition', phase: 'prior_art', stepIndex: 2 });

        // Find prior art for calibration
        const priorArt = config.priorArtSearchFn 
          ? await config.priorArtSearchFn(currentIdea.thesis, currentIdea.description) 
          : [];
        
        // Calibrate confidence
        const factors = estimateConfidenceFactors(sourcesWithConcepts, contradictions, currentIdea, priorArt);
        const { score, explanation, isLogConcave } = calculateCalibratedConfidence(factors);
        currentIdea = { ...currentIdea, confidence: score, confidenceFactors: factors, confidenceExplanation: explanation, isLogConcave };
        
        // Attach prior art to the idea for the frontend
        currentIdea = { ...currentIdea, priorArt };

        if (eventEmitter) {
          eventEmitter.emit({ event: 'confidence_update', factor: 'Overall Confidence', score });
          eventEmitter.emit({ event: 'confidence_update', factor: 'Prior Art Distance', score: factors.priorArtDistance * 100 });
          eventEmitter.emit({ event: 'confidence_update', factor: 'Mechanism Depth', score: factors.evidenceDepth * 100 });
        }

        // 1. Generate deep hypothesis
        const deepHypothesis = await hypothesisGenerator.generate(currentIdea);
        currentIdea.structuredHypothesis = deepHypothesis;
        await delay(1000); // Backoff

        // 2. Dialectical Audit (Epistemologist vs. Skeptic via Architect)
        if (eventEmitter) eventEmitter.emit({ event: 'agent_switch', agent: 'skeptic' });
        
        finalAudit = await masaAuditor.audit(currentIdea, priorArt);
        
        if (eventEmitter) eventEmitter.emit({ event: 'agent_switch', agent: 'architect' });
        
        if (finalAudit.finalSynthesis.isApproved) {
           if (eventEmitter) {
             eventEmitter.emit({ 
                event: 'step_update', 
                step: `Hypothesis approved by MASA Architect (Score: ${finalAudit.finalSynthesis.validityScore})` 
             });
           }
           // Hong Pop-Stack-Sorting: Record convergence
           didConverge = true;
           convergenceStep = iteration;
           break;
        }

        // 3. Refine based on Audit findings
        currentIdea = await refineNovelIdea(currentIdea, priorArt, iteration + 1, {
            validityScore: finalAudit.finalSynthesis.validityScore,
            critique: finalAudit.methodologist.critique + " | Remediation: " + finalAudit.finalSynthesis.remediationPlan.join(". "),
            biasDetected: finalAudit.skeptic.biasesDetected,
            logicalFallacies: finalAudit.skeptic.fallaciesDetected,
            remediationConstraints: finalAudit.finalSynthesis.remediationConstraints
        });
        
        totalRefinements++;
        iteration++;
        await delay(2000); // Backoff for refinement
      }

      currentIdea.criticalAnalysis = {
        validityScore: finalAudit.finalSynthesis.validityScore,
        critique: finalAudit.methodologist.critique,
        biasDetected: finalAudit.skeptic.biasesDetected,
        logicalFallacies: finalAudit.skeptic.fallaciesDetected
      };
      
      // Attach full audit for persistence and UI
      currentIdea.masaAudit = finalAudit;
      // Ensure priorArt is attached to the final object as well if loop broke early or finished
      if (!currentIdea.priorArt) {
          const priorArt = config.priorArtSearchFn 
          ? await config.priorArtSearchFn(currentIdea.thesis, currentIdea.description) 
          : [];
          currentIdea.priorArt = priorArt;
      }

      // FINAL HYPOGENIC STAGE: Generate Prose & Artifacts sequentially
      // [PHASE TRANSITION] Sovereign Synthesis
      if (eventEmitter) eventEmitter.emit({ event: 'phase_transition', phase: 'synthesis', stepIndex: 3 });

      // Serialized to save token bandwidth
      const prose = await synthesizeScientificProse(currentIdea, contradictions);
      await delay(1000);
      const artifacts = await experimentGenerator.generate(currentIdea);
      
      currentIdea.scientificProse = prose;
      currentIdea.scientificArtifacts = artifacts;

      // ROBOTIC INTERFACE LAYER (RIL) - Mock Execution (Phase 3)
      if (artifacts.labJob) {
        if (eventEmitter) {
          eventEmitter.emit({ event: 'thinking_step', content: `[RIL] Submitting LabJob ${artifacts.labJob.job_id} to Mock Cloud Lab...` });
        }
        const mockLab = new MockCloudLab();
        const labResult = await mockLab.submitJob(artifacts.labJob);
        
        // RIL result takes precedence over In Silico simulation
        currentIdea.validationResult = labResult;
        
        if (eventEmitter) {
            eventEmitter.emit({ 
              event: 'protocol_validated', 
              ideaId: currentIdea.id,
              success: labResult.success,
              pValue: labResult.metrics?.pValue
            });
            eventEmitter.emit({
              event: 'thinking_step',
              content: `[RIL] Execution Complete. Success: ${labResult.success}. p-value: ${labResult.metrics?.pValue}`
            });
        }
      } 
      
      // PHYSICAL GROUND TRUTH: Validate protocol in sandbox (Fallback/Complementary)
      else if (config.validateProtocolFn && artifacts.protocolCode) {
        try {
          if (eventEmitter) {
            eventEmitter.emit({ event: 'thinking_step', content: `Validating simulation protocol...` });
          }
          const validation = await config.validateProtocolFn(artifacts.protocolCode);
          currentIdea.validationResult = validation;
          if (eventEmitter) {
            eventEmitter.emit({ 
              event: 'protocol_validated', 
              ideaId: currentIdea.id,
              success: validation.success,
              pValue: validation.metrics?.pValue
            });
          }
        } catch (valError) {
          console.warn('[Synthesis] Protocol validation failed:', valError);
          currentIdea.validationResult = { success: false, error: String(valError) };
        }
      }
      
      // Track Pop-Stack convergence metrics
      if (didConverge) {
        convergenceCount++;
        totalConvergenceSteps += convergenceStep;
      }
      // await delay(1000); // Cooldown between ideas - REMOVED since Semaphore handles rate limiting via concurrency + we assume downstream APIs can handle 3 concurrent
      
      return currentIdea;
  }));
  
  novelIdeas = await Promise.all(refinementPromises);

  // Step 6: Generate structured approach for top idea
  let structuredApproach: StructuredApproach | undefined;
  if (novelIdeas.length > 0) {
    const topIdea = novelIdeas.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );
    console.log(`[Synthesis] Generating Structured Approach for best idea: ${topIdea.thesis}`);
    try {
        structuredApproach = await generateStructuredApproach(topIdea);
        console.log(`[Synthesis] Structured Approach generated successfully.`);
    } catch (e) {
        console.error(`[Synthesis] Failed to generate structured approach:`, e);
    }
  }

  return {
    sources: sourcesWithConcepts,
    contradictions,
    novelIdeas,
    selectedIdea: novelIdeas[0],
    structuredApproach,
    metadata: {
      refinementIterations: totalRefinements,
      calibrationApplied: true,
      // Hong Pop-Stack-Sorting Metrics
      tPopSortable: convergenceCount > 0 && convergenceCount === refinedIdeas.length,
      convergenceStep: convergenceCount > 0 ? Math.round(totalConvergenceSteps / convergenceCount) : undefined,
      pdfCount: sourcesWithConcepts.filter(s => s.type === 'pdf').length,
      companyCount: sourcesWithConcepts.filter(s => s.type === 'company').length,
      totalSources: sourcesWithConcepts.length,
    },
  };
}

// delay() helper defined at line 489


