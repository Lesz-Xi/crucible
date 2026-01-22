import { getClaudeModel } from "./anthropic";
import { NovelIdea, StructuredHypothesis } from "../../types";
import { safeParseJson } from "./ai-utils";

const HYPOTHESIS_GENERATION_PROMPT = `
You are a "Sovereign Scientist" using the Method of Multiple Working Hypotheses.
Your goal is to formulate a structured, "Hard-to-Vary" explanatory framework based on a "Novel Idea" (Observation).

## Input
Observation/Idea: "{{IDEA_SUMMARY}}"
Mechanism Proposed: "{{MECHANISM}}"

## The Sovereignty Rules
1. **Dialectical Divergence**: Generate 3 distinct, competing mechanistic explanations (H1, H2, H3). They must not just be variations of each other; they must propose different causal structures.
    *   H1: The Sovereign Mechanism (Hard-to-Vary, specific, deep).
    *   H2: The Instrumentalist/Reductionist Alternative (Is this just a known lower-level process?).
    *   H3: The Adversarial/Falsification Hypothesis (Is this an artifact of measurement or a self-fulfilling prophecy?).
2. **Deutschian Depth**: For the selected hypothesis (H1), define the causal chain where every step is necessary. If one step were different, the explanation would fail.
3. **Falsifiability**: Define exactly what data would kill the theory. Avoid "Good-by-Definition" theories.

## Output Format (JSON)
{
  "competingHypotheses": [
    {
      "id": "H1",
      "title": "Short title",
      "mechanism": "Deep causal mechanism",
      "evidenceSupport": ["Snippet/Logic"],
      "weaknesses": ["Why it might fail"],
      "confidenceScore": 0.0-1.0
    }
  ],
  "selectedHypothesisId": "H1",
  "predictions": [
    {
      "description": "Specific prediction",
      "expectedOutcome": "What happens",
      "falsificationCriteria": "What outcome PROVES this wrong"
    }
  ],
  "experimentalDesign": {
    "methodology": "Step-by-step experiment",
    "variables": {
      "independent": "X",
      "dependent": "Y",
      "controlled": ["Z"]
    },
    "sampleSize": "N",
    "duration": "Time"
  }
}
`;

export class HypothesisGenerator {
  async generate(novelIdea: NovelIdea): Promise<StructuredHypothesis> {
    const model = getClaudeModel();
    
    // Construct the prompt
    let prompt = HYPOTHESIS_GENERATION_PROMPT
      .replace("{{IDEA_SUMMARY}}", novelIdea.thesis + ": " + novelIdea.description)
      .replace("{{MECHANISM}}", novelIdea.mechanism || "Not specified");

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const parsed = safeParseJson(responseText, {
        competingHypotheses: [],
        selectedHypothesisId: "ERROR",
        predictions: [],
        experimentalDesign: {
          methodology: "Parsing Failed",
          variables: { independent: "", dependent: "", controlled: [] },
          crucialExperiment: "N/A"
        }
      });

      return {
        observation: novelIdea.thesis,
        ...parsed
      };
    } catch (error) {
      console.error("Hypothesis Generation Failed:", error);
      return {
        observation: novelIdea.thesis,
        competingHypotheses: [],
        selectedHypothesisId: "ERROR",
        predictions: [],
        experimentalDesign: {
          methodology: "Generation Failed",
          variables: { independent: "", dependent: "", controlled: [] },
          crucialExperiment: "N/A"
        }
      };
    }
  }
}
