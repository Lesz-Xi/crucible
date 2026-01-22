import { getClaudeModel } from "./anthropic";
import { NovelIdea, MasaAudit, PriorArt, GradeQuality } from "../../types";
import { safeParseJson } from "./ai-utils";

// ==========================================
// 1. THE EPISTEMOLOGIST (Explanatory Depth)
// ==========================================
// Focus: Deutschian Epistemology, "Hard to Vary", Explanatory Power

const EPISTEMOLOGIST_PROMPT = `
You are "The Epistemologist", an auditor deeply inspired by David Deutsch's "The Fabric of Reality".
Your goal is to distinguish between an "Instrumentalist" Prediction and a "Deep Explanation".

**Hypothesis to Audit:**
Thesis: {THESIS}
Mechanism: {MECHANISM}

**Deutschian Criteria:**
1. **Explanatory Depth**: Does this theory explain *why* the world is the way it is, or just *what* will happen?
2. **Hard to Vary**: If you changed one detail of the mechanism, would the entire theory collapse? (Good explanations are hard to vary).
3. **Crucial Experiment**: What is the ONE specific experimental result that would definitively prove this theory WRONG while leaving its competitors standing?
4. **Reductionism vs Emergence**: Does the explanation respect the levels of reality?

**Output Format (JSON):**
{
  "explanationDepth": number, // 0-100
  "isHardToVary": boolean,
  "crucialExperiment": "Specific test description",
  "grade": "High" | "Moderate" | "Low" | "Very Low",
  "critique": "Concise review of explanatory power."
}
`;

// ==========================================
// 2. THE SKEPTIC (Adversarial)
// ==========================================
const SKEPTIC_PROMPT = `
You are "The Skeptic", an adversarial reviewer. 
Your job is to find the "Bad Explanation" in this hypothesis.

**Hypothesis to Audit:**
Thesis: {THESIS}
Mechanism: {MECHANISM}

**Taxonomy of Biases & Fallacies:**
- Confirmation Bias, Texas Sharpshooter, Instrumentalism (just predicting data without mechanism).

**Your Task:**
1. Identify if this is a "Self-Fulfilling" theory or a genuine discovery.
2. Search for the "Easy to Vary" trap: Could this theory be adjusted to fit *any* outcome?

**Output Format (JSON):**
{
  "score": number,
  "biasesDetected": ["Bias Name 1", ...],
  "fallaciesDetected": ["Fallacy 1", ...],
  "devilAdvocacy": "Strongest counter-argument",
  "critique": "Concise skeptical review."
}
`;

// ==========================================
// 3. THE SOVEREIGN ARCHITECT (Synthesis)
// ==========================================
const ARCHITECT_PROMPT = `
You are "The Sovereign Architect", the final arbiter of scientific truth in the Sovereign Synthesis Engine.
Your role is to analyze the conflict between "The Epistemologist" (who values deep explanation) and "The Skeptic" (who finds flaws).

**Perspective A (Epistemologist):** {EPI_REVIEW}
**Perspective B (Skeptic):** {SKEPTIC_REVIEW}

**The Goal:** Perform a Hegelian synthesis. Do not just average their scores. Identify if the skepticism reveals a fundamental flaw that makes the explanation "Easy to Vary", or if the Epistemologist has found a "Hard to Vary" core that survives the Skeptic's fire.

**Output Format (JSON):**
{
  "synthesisScore": number, // 0-100
  "isApproved": boolean,
  "fundamentalBreakthrough": "What is the core novel mechanism that survives audit?",
  "requiredHardening": ["Specific action to fix remaining weaknesses"],
  "remediationConstraints": ["CONSTRAINT: Must use specific math", "CONSTRAINT: Forbidden from using vague metaphors"],
  "architectVerdict": "Final authoritative summary."
}
`;

export class MasaAuditor {
  async audit(idea: NovelIdea, priorArt: PriorArt[]): Promise<MasaAudit> {
    const model = getClaudeModel();
    
    const priorArtText = priorArt.length > 0 
      ? priorArt.map(p => `- ${p.title}: ${p.differentiator}`).join("\n")
      : "No significant prior art found.";

    const epistemologistPrompt = EPISTEMOLOGIST_PROMPT
      .replace("{THESIS}", idea.thesis)
      .replace("{MECHANISM}", idea.mechanism || "Not specified")
      .replace("{PRIOR_ART}", priorArtText);

    const skepticPrompt = SKEPTIC_PROMPT
      .replace("{THESIS}", idea.thesis)
      .replace("{MECHANISM}", idea.mechanism || "Not specified");

    // SERIALIZED EXECUTION to prevent "concurrent connection" rate limits
    const epiResult = await model.generateContent(epistemologistPrompt);
    
    const epiJson = safeParseJson(epiResult.response.text(), {
      explanationDepth: 40, // Default to moderate if parsing fails but content exist
      isHardToVary: false,
      crucialExperiment: "N/A",
      grade: "Very Low",
      critique: "Error parsing deep explanation response."
    });

    try {
      // Brief delay between concurrent connections
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {}

    const skepticResult = await model.generateContent(skepticPrompt);

    const skepticJson = safeParseJson(skepticResult.response.text(), {
      score: 40,
      biasesDetected: ["Parsing Error"],
      fallaciesDetected: ["Parsing Error"],
      devilAdvocacy: "N/A",
      critique: "Error parsing skeptical audit response."
    });

    // Step 2: SOVEREIGN SYNTHESIS (The Architect)
    const architectPrompt = ARCHITECT_PROMPT
      .replace("{EPI_REVIEW}", JSON.stringify(epiJson))
      .replace("{SKEPTIC_REVIEW}", JSON.stringify(skepticJson));

    const archResult = await model.generateContent(architectPrompt);
    const archJson = safeParseJson(archResult.response.text(), {
      synthesisScore: 50,
      isApproved: false,
      fundamentalBreakthrough: "Parsing Failure - Manual Review Required",
      requiredHardening: ["Fix system parsing issues"],
      remediationConstraints: [],
      architectVerdict: "Synthesis failed due to output formatting errors."
    });

    // Inject the Crucial Experiment into the idea structure
    if (idea.experimentalDesign) {
      idea.experimentalDesign.crucialExperiment = epiJson.crucialExperiment;
    }

    return {
      methodologist: { 
        score: epiJson.explanationDepth,
        critique: epiJson.critique,
        grade: epiJson.grade as GradeQuality,
        constructValidityIssues: epiJson.isHardToVary ? [] : ["Theory lacks structural integrity."],
        causalityIssues: []
      },
      skeptic: {
        score: skepticJson.score,
        critique: skepticJson.critique,
        biasesDetected: skepticJson.biasesDetected || [],
        fallaciesDetected: skepticJson.fallaciesDetected || [],
        devilAdvocacy: skepticJson.devilAdvocacy || "N/A"
      },
      finalSynthesis: {
        validityScore: Math.round(archJson.synthesisScore || 0),
        isApproved: archJson.isApproved || false,
        remediationPlan: (archJson.requiredHardening || []).concat(this.generateRemediation(epiJson, skepticJson)),
        remediationConstraints: archJson.remediationConstraints || []
      },
      timestamp: new Date()
    };
  }

  private generateRemediation(epiData: any, skepticData: any): string[] {
    const plan: string[] = [];
    if (!epiData.isHardToVary) {
      plan.push("The explanation is too 'loose'. Tighten the mechanism so that slight changes would falsify it.");
    }
    if (epiData.explanationDepth < 50) {
      plan.push("Move from 'Prediction' to 'Explanation'. Why exactly does this happen at the fundamental level?");
    }
    if (plan.length === 0) plan.push("Theory demonstrates significant explanatory depth. Proceed to crucial testing.");
    return plan;
  }
}
