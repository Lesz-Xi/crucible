import { getClaudeModel } from "./anthropic";
import { NovelIdea, LabJob } from "../../types";
import { safeParseJson } from "./ai-utils";

const EXPERIMENT_PROMPT = `
You are a Principal Investigator and Lead Data Scientist.
Your goal is to sustain the "Sovereign Mastermind" workflow by converting a theoretical hypothesis into concrete, reproducible artifacts.

**Theoretical Basis:**
Thesis: {THESIS}
Mechanism: {MECHANISM}
Proposed Experiment: {EXPERIMENT}

**Task:**
Generate three distinct artifacts:
1. **Protocol Code (\`protocolCode\` )**: A Python script (using numpy, scipy, or pymc) that accurately simulates the mechanism.
2. **Lab Manual (\`labManual\` )**: A Markdown document for a physical or rigorous data experiment.
3. **Lab Job (\`labJob\` )**: A strictly formatted JSON object for the Robotic Interface Layer (RIL).

**RIL JSON Schema (Strict Compliance Required):**
\`\`\`json
{
  "job_id": "UUID",
  "experiment_name": "String",
  "safety_level": "BSL-1" | "BSL-2",
  "resources": {
    "reagents": [{ "id": "string", "name": "string", "volume_ml": number }],
    "labware": [{ "id": "string", "type": "96-well-plate" | "trough-12row" | "tube-rack" }]
  },
  "steps": [
    {
      "step_id": number,
      "action": "aspirate" | "dispense" | "mix" | "incubate" | "thermocycle" | "measure_absorbance",
      "parameters": { ... } // Context specific fields like source_labware, volume_ul, etc.
    }
  ]
}
\`\`\`

**Output Format (JSON):**
{
  "protocolCode": "string (python code, escaped properly)",
  "labManual": "string (markdown content)",
  "labJob": { ... } // The LabJob JSON object
}
`;

export class ExperimentGenerator {
  async generate(idea: NovelIdea): Promise<{ protocolCode: string; labManual: string; labJob?: LabJob }> {
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
        labManual: "# Error generating manual",
        labJob: null
      });

      return {
        protocolCode: json.protocolCode || "# Error generating code",
        labManual: json.labManual || "# Error generating manual",
        labJob: json.labJob || undefined
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

