import fs from "node:fs";
import path from "node:path";
import { evaluateCausalPruning, type PrunableChatMessage } from "../src/lib/services/causal-pruning-policy";
import { fuseMemoryRetrieval } from "../src/lib/services/memory-retrieval-fusion";
import type { CacheTtlState } from "../src/types/persistent-memory";

const EXIT_OK = 0;
const EXIT_HARD_GATE = 2;
const EXIT_INVALID_INPUT = 3;
const EXIT_RUNTIME = 4;

interface Scenario {
  scenarioId: string;
  description: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    causalDensity?: { score?: number; confidence?: number };
    hasToolEvidence?: boolean;
    isInterventionTrace?: boolean;
  }>;
  maxMessages: number;
  cacheTtlState: CacheTtlState;
  query: string;
  expected: {
    minRetainedL3: number;
    maxPruned: number;
    topResultMinFinalScore: number;
  };
}

interface ScenarioPack {
  schemaVersion: string;
  generatedAt: string;
  scenarios: Scenario[];
}

interface EvalResult {
  scenarioId: string;
  timestamp: string;
  mode: "report" | "enforce";
  retainedCount: number;
  prunedCount: number;
  retainedL3Count: number;
  topResultScore: number;
  hardGateFailures: string[];
}

interface CliArgs {
  scenarioPack: string;
  mode: "report" | "enforce";
  formats: Set<"json" | "md" | "csv">;
  outputDir: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {
    mode: "report",
    formats: new Set(["json"]),
    outputDir: "artifacts/governance/persistent-memory",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--scenarioPack") {
      args.scenarioPack = next;
      i += 1;
      continue;
    }

    if (arg === "--mode") {
      args.mode = next === "enforce" ? "enforce" : "report";
      i += 1;
      continue;
    }

    if (arg === "--format") {
      args.formats = new Set(
        next
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item === "json" || item === "md" || item === "csv") as Array<"json" | "md" | "csv">,
      );
      i += 1;
      continue;
    }

    if (arg === "--outputDir") {
      args.outputDir = next;
      i += 1;
    }
  }

  if (!args.scenarioPack) {
    console.error("Error: --scenarioPack is required");
    process.exit(EXIT_INVALID_INPUT);
  }

  return args as CliArgs;
}

function writeArtifacts(results: EvalResult[], outputDir: string, formats: Set<"json" | "md" | "csv">): void {
  fs.mkdirSync(outputDir, { recursive: true });

  if (formats.has("json")) {
    const jsonPath = path.join(outputDir, "report.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
  }

  if (formats.has("md")) {
    const mdPath = path.join(outputDir, "report.md");
    const lines = [
      "# Persistent Memory Integrity Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "| Scenario | Retained | Pruned | Retained L3 | Top Score | Hard-Gate Failures |",
      "|---|---:|---:|---:|---:|---:|",
    ];

    for (const row of results) {
      lines.push(
        `| ${row.scenarioId} | ${row.retainedCount} | ${row.prunedCount} | ${row.retainedL3Count} | ${row.topResultScore.toFixed(3)} | ${row.hardGateFailures.length} |`,
      );
    }

    fs.writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf-8");
  }

  if (formats.has("csv")) {
    const csvPath = path.join(outputDir, "trend.csv");
    const header = "timestamp,scenarioId,mode,retainedCount,prunedCount,retainedL3Count,topResultScore,hardGateFailures";
    const rows = results.map((row) =>
      [
        row.timestamp,
        row.scenarioId,
        row.mode,
        row.retainedCount,
        row.prunedCount,
        row.retainedL3Count,
        row.topResultScore,
        row.hardGateFailures.length,
      ].join(","),
    );
    fs.writeFileSync(csvPath, [header, ...rows].join("\n") + "\n", "utf-8");
  }
}

function toPrunableMessages(messages: Scenario["messages"]): PrunableChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    causalDensity: message.causalDensity,
    hasToolEvidence: message.hasToolEvidence,
    isInterventionTrace: message.isInterventionTrace,
  }));
}

function evaluateScenario(scenario: Scenario, mode: "report" | "enforce"): EvalResult {
  const pruning = evaluateCausalPruning(toPrunableMessages(scenario.messages), {
    maxMessages: scenario.maxMessages,
    cacheTtlState: scenario.cacheTtlState,
  });

  const fusion = fuseMemoryRetrieval(
    scenario.query,
    pruning.retainedMessages.map((message) => ({
      id: message.id,
      content: message.content,
      causalLevel:
        message.causalDensity?.score === 3
          ? "L3"
          : message.causalDensity?.score === 2
            ? "L2"
            : "L1",
      vectorScore: message.causalDensity?.confidence || 0.4,
    })),
    { topK: 5 },
  );

  const retainedL3Count = pruning.retainedMessages.filter((message) => message.causalDensity?.score === 3).length;
  const topResultScore = fusion.topK[0]?.finalScore ?? 0;

  const hardGateFailures: string[] = [];
  if (retainedL3Count < scenario.expected.minRetainedL3) {
    hardGateFailures.push("l3_retention_failed");
  }
  if (pruning.prunedMessages.length > scenario.expected.maxPruned) {
    hardGateFailures.push("pruned_count_exceeded");
  }
  if (topResultScore < scenario.expected.topResultMinFinalScore) {
    hardGateFailures.push("retrieval_fusion_score_below_threshold");
  }

  return {
    scenarioId: scenario.scenarioId,
    timestamp: new Date().toISOString(),
    mode,
    retainedCount: pruning.retainedMessages.length,
    prunedCount: pruning.prunedMessages.length,
    retainedL3Count,
    topResultScore,
    hardGateFailures,
  };
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv);
    const scenarioPackPath = path.resolve(args.scenarioPack);

    if (!fs.existsSync(scenarioPackPath)) {
      console.error(`Error: scenario pack not found: ${scenarioPackPath}`);
      process.exit(EXIT_INVALID_INPUT);
    }

    const scenarioPack = JSON.parse(fs.readFileSync(scenarioPackPath, "utf-8")) as ScenarioPack;
    const results = scenarioPack.scenarios.map((scenario) => evaluateScenario(scenario, args.mode));

    writeArtifacts(results, path.resolve(args.outputDir), args.formats);

    const hardGateFailures = results.reduce((sum, row) => sum + row.hardGateFailures.length, 0);
    console.log(`Scenarios: ${results.length}`);
    console.log(`Hard-gate failures: ${hardGateFailures}`);

    if (args.mode === "enforce" && hardGateFailures > 0) {
      process.exit(EXIT_HARD_GATE);
    }

    process.exit(EXIT_OK);
  } catch (error) {
    console.error("Runtime error", error);
    process.exit(EXIT_RUNTIME);
  }
}

void main();
