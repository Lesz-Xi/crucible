import { getClaudeModel } from "./anthropic";
import { NovelIdea } from "../../types";
import { safeParseJson } from "./ai-utils";

const EXPERIMENT_PROMPT = `
You are a Principal Investigator and Lead Data Scientist.
Your goal is to sustain the "Sovereign Mastermind" workflow by converting a theoretical hypothesis into concrete, reproducible artifacts.

**Theoretical Basis:**
Thesis: {THESIS}
Mechanism: {MECHANISM}
Proposed Experiment: {EXPERIMENT}

**Task:**
Generate two distinct artifacts:
1. **Protocol Code (\`protocolCode\` )**: A Python script (using numpy, scipy, or pymc) that accurately simulates the mechanism. It must include:
   - Defining the variables.
   - Running a Monte Carlo simulation or Differential Equation solver.
   - Asserting the "Crucial Test" conditions.
   - Printing the p-value or Bayes Factor.
2. **Lab Manual (\`labManual\` )**: A Markdown document for a physical or rigorous data experiment. It must include:
   - "Equipment Required" (or Data Sources).
   - "Step-by-Step Procedure" (Algorithm).
   - "Pre-registration Manifesto" (What results invalidate the theory?).

**Output Format (JSON):**
{
  "protocolCode": "string (python code, escaped properly)",
  "labManual": "string (markdown content)"
}
`;

export class ExperimentGenerator {
  async generate(idea: NovelIdea): Promise<{ protocolCode: string; labManual: string }> {
    const model = getClaudeModel();

    const prompt = EXPERIMENT_PROMPT
      .replace("{THESIS}", idea.thesis)
      .replace("{MECHANISM}", idea.mechanism || "Not specified")
      .replace("{EXPERIMENT}", idea.crucialExperiment || "Not specified");

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const json = safeParseJson(text, {
        protocolCode: "# Error generating code",
        labManual: "# Error generating manual"
      });

      return {
        protocolCode: json.protocolCode || "# Error generating code",
        labManual: json.labManual || "# Error generating manual"
      };
    } catch (error) {
      console.error("Experiment Generation Failed:", error);
      return {
        protocolCode: "# Generation Failed\n# " + String(error),
        labManual: "# Generation Failed\n" + String(error)
      };
    }
  }
}
