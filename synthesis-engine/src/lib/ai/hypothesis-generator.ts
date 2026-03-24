import { getClaudeModel } from "./anthropic";
import { NovelIdea, StructuredHypothesis } from "../../types";

const HYPOTHESIS_GENERATION_PROMPT = `
You are a Principal Investigator leading a rigorous scientific inquiry.
Your goal is to formulate a structured hypothesis based on a "Novel Idea" (Observation).
You must follow the "Method of Multiple Working Hypotheses" to avoid confirmation bias.

## Input
Observation/Idea: "{{IDEA_SUMMARY}}"
Mechanism Proposed: "{{MECHANISM}}"

## Instructions
1.  **Deconstruct**: Treat the input idea as a preliminary observation.
2.  **Competing Hypotheses**: Generate 3 distinct mechanistic explanations for why this idea might work (or alternative underlying causes).
    *   H1: The proposed mechanism (refined).
    *   H2: An alternative mechanism (e.g., is it just a correlation?).
    *   H3: A skepticism-based hypothesis (e.g., is it a measurement artifact?).
3.  **Predict**: For the strongest hypothesis, generate specific, falsifiable predictions.
4.  **Experimental Design**: Propose a "Crucial Experiment" to distinguish between H1 and H2.

## Output Format (JSON)
{
  "competingHypotheses": [
    {
      "id": "H1",
      "title": "...",
      "mechanism": "...",
      "evidenceSupport": ["..."],
      "weaknesses": ["..."],
      "confidenceScore": 0.0-1.0
    }
  ],
  "selectedHypothesisId": "H1",
  "predictions": [
    {
      "description": "...",
      "expectedOutcome": "...",
      "falsificationCriteria": "..."
    }
  ],
  "experimentalDesign": {
    "methodology": "...",
    "variables": {
      "independent": "...",
      "dependent": "...",
      "controlled": ["..."]
    },
    "sampleSize": "...",
    "duration": "..."
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

      // Basic JSON cleaning (Claude sometimes adds markdown blocks)
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        observation: novelIdea.thesis,
        ...parsed
      };
    } catch (error) {
      console.error("Hypothesis Generation Failed:", error);
      // Fallback/Empty structure to prevent pipeline crash
      return {
        observation: novelIdea.thesis,
        competingHypotheses: [],
        selectedHypothesisId: "ERROR",
        predictions: [],
        experimentalDesign: {
          methodology: "Generation Failed",
          variables: { independent: "", dependent: "", controlled: [] }
        }
      };
    }
  }
}
