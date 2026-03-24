import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TbeValidationSuite } from "@/lib/testing/harness/tbe-validation-suite";
import type { SCMHypothesisGeneratorInput } from "@/lib/ai/scm-hypothesis-generator";

function loadLocalEnv(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..");

  dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });
}

async function run() {
  loadLocalEnv();

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    console.error("ANTHROPIC_API_KEY is missing. Add it to .env.local and rerun.");
    process.exit(1);
  }

  console.log("Starting Thermodynamic Basis Expansion Validation...");
  const suite = new TbeValidationSuite();

  const config: SCMHypothesisGeneratorInput = {
    sources: [
      {
        name: "Source A",
        concepts: {
          mainThesis: "Resources drive growth",
          keyArguments: ["Resource availability increases carrying capacity"],
          entities: [
            {
              name: "ResourceAvailability",
              type: "concept",
              description: "Available resources in the environment",
              sourceId: "source-a",
            },
            {
              name: "PopulationGrowth",
              type: "concept",
              description: "Population growth rate",
              sourceId: "source-a",
            },
          ],
        },
      },
      {
        name: "Source B",
        concepts: {
          mainThesis: "Predation impacts scarcity",
          keyArguments: ["Predation pressure changes resource dynamics"],
          entities: [
            {
              name: "PredationRate",
              type: "concept",
              description: "Rate of predation",
              sourceId: "source-b",
            },
            {
              name: "ResourceScarcity",
              type: "concept",
              description: "Resource scarcity level",
              sourceId: "source-b",
            },
          ],
        },
      },
    ],
    contradictions: [],
    researchFocus: "Ecosystem Stability",
  };

  try {
    const results = await suite.runValidation(config, 8);

    console.log("\n=================================");
    console.log("   TBE VALIDATION RESULTS");
    console.log("=================================");
    console.log(`Total Generations Run:  ${results.totalGenerations}`);
    console.log(`TBE Trigger Count:      ${results.triggerCount}`);
    console.log(`Success Rate:           ${(results.successRate * 100).toFixed(1)}%`);

    console.log("\n-- Trajectory --");
    results.rawMetrics.forEach((m) => {
      console.log(
        `[Gen ${m.generation}] Gap: ${m.spectralGap.toFixed(3)} | Temp: ${m.appliedTemperature.toFixed(2)} | Triggered: ${m.tbeTriggered} | Ideas: ${m.ideasGenerated}`
      );
      if (m.error) {
        console.error(`          ⚠️ Error: ${m.error}`);
      }
    });
  } catch (error) {
    console.error("Validation failed:", error);
    process.exit(1);
  }
}

void run();
