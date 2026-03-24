import fs from 'node:fs';
import path from 'node:path';
import { computeNoveltyGate, computeNoveltyProofs } from '../src/lib/services/novelty-proof-engine';
import { buildNoveltyRecoveryPlan } from '../src/lib/services/novelty-recovery-planner';
import type { NovelIdea } from '../src/types';
import type { ContradictionEvidence } from '../src/types/hybrid-novelty';

const EXIT_OK = 0;
const EXIT_HARD_GATE = 2;
const EXIT_INVALID_INPUT = 3;
const EXIT_RUNTIME = 4;

interface Scenario {
  scenarioId: string;
  description: string;
  idea: NovelIdea;
  contradictionMatrix: ContradictionEvidence[];
  priorArt: Array<{ source: string; title: string; similarity: number; differentiator: string }>;
  expectedDecision: 'pass' | 'recover' | 'fail';
}

interface ScenarioPack {
  schemaVersion: string;
  generatedAt: string;
  scenarios: Scenario[];
}

interface CliArgs {
  scenarioPack: string;
  mode: 'report' | 'enforce';
  formats: Set<'json' | 'md' | 'csv'>;
  outputDir: string;
  seed: number;
}

interface EvalResult {
  scenarioId: string;
  timestamp: string;
  seed: number;
  mode: 'report' | 'enforce';
  decision: 'pass' | 'recover' | 'fail';
  expectedDecision: 'pass' | 'recover' | 'fail';
  matchedExpectation: boolean;
  passingIdeas: number;
  blockedIdeas: number;
  hardGateFailures: string[];
  warnings: string[];
  recoveryPlanGenerated: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {
    mode: 'report',
    formats: new Set(['json']),
    outputDir: 'artifacts/governance/hybrid-novelty',
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--scenarioPack':
        args.scenarioPack = next;
        i++;
        break;
      case '--mode':
        if (next === 'report' || next === 'enforce') args.mode = next;
        i++;
        break;
      case '--format':
        args.formats = new Set(
          next
            .split(',')
            .filter((item) => ['json', 'md', 'csv'].includes(item)) as Array<'json' | 'md' | 'csv'>,
        );
        i++;
        break;
      case '--outputDir':
        args.outputDir = next;
        i++;
        break;
      case '--seed':
        args.seed = Number(next);
        i++;
        break;
      default:
        break;
    }
  }

  if (!args.scenarioPack) {
    console.error('Error: --scenarioPack is required');
    process.exit(EXIT_INVALID_INPUT);
  }

  if (!Number.isFinite(args.seed)) {
    args.seed = 20260212;
  }

  return args as CliArgs;
}

function writeJsonArtifact(results: EvalResult[], outputDir: string): void {
  const filePath = path.join(outputDir, 'hybrid-novelty-report.json');
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`  ✓ JSON: ${filePath}`);
}

function writeMdArtifact(results: EvalResult[], outputDir: string): void {
  const filePath = path.join(outputDir, 'hybrid-novelty-report.md');
  const lines: string[] = [
    '# Hybrid Novelty Proof Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Scenario | Decision | Expected | Match | Hard Gate Failures | Recovery Plan |',
    '|---|---|---|---|---|---|',
  ];

  for (const row of results) {
    lines.push(
      `| ${row.scenarioId} | ${row.decision} | ${row.expectedDecision} | ${row.matchedExpectation ? '✅' : '❌'} | ${row.hardGateFailures.length} | ${row.recoveryPlanGenerated ? 'yes' : 'no'} |`,
    );
  }

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  console.log(`  ✓ Markdown: ${filePath}`);
}

function writeCsvArtifact(results: EvalResult[], outputDir: string): void {
  const filePath = path.join(outputDir, 'hybrid-novelty-trend.csv');
  const header = 'timestamp,scenarioId,seed,mode,decision,expectedDecision,matchedExpectation,passingIdeas,blockedIdeas,hardGateFailures,recoveryPlanGenerated';
  const rows = results.map((row) =>
    [
      row.timestamp,
      row.scenarioId,
      row.seed,
      row.mode,
      row.decision,
      row.expectedDecision,
      row.matchedExpectation,
      row.passingIdeas,
      row.blockedIdeas,
      row.hardGateFailures.length,
      row.recoveryPlanGenerated,
    ].join(','),
  );
  fs.writeFileSync(filePath, [header, ...rows].join('\n') + '\n', 'utf-8');
  console.log(`  ✓ CSV: ${filePath}`);
}

async function evaluateScenario(scenario: Scenario, args: CliArgs): Promise<EvalResult> {
  const proofs = await computeNoveltyProofs([scenario.idea], scenario.contradictionMatrix, {
    noveltyThreshold: 0.3,
    falsifiabilityThreshold: 0.55,
    contradictionThreshold: 0.45,
    priorArtSearchFn: async () => scenario.priorArt,
  });

  const gate = computeNoveltyGate(proofs, { noveltyThreshold: 0.3 });

  const hardGateFailures: string[] = [];
  if (!proofs.length) {
    hardGateFailures.push('no_proof_emitted');
  }
  if (scenario.expectedDecision === 'pass' && gate.decision !== 'pass') {
    hardGateFailures.push('expected_pass_but_blocked');
  }
  if (scenario.expectedDecision !== 'pass' && gate.decision === 'pass') {
    hardGateFailures.push('expected_block_but_passed');
  }

  let recoveryPlanGenerated = false;
  if (gate.decision !== 'pass') {
    buildNoveltyRecoveryPlan({
      gate,
      proofs,
      contradictionMatrix: scenario.contradictionMatrix,
    });
    recoveryPlanGenerated = true;
  }

  return {
    scenarioId: scenario.scenarioId,
    timestamp: new Date().toISOString(),
    seed: args.seed,
    mode: args.mode,
    decision: gate.decision,
    expectedDecision: scenario.expectedDecision,
    matchedExpectation: hardGateFailures.length === 0,
    passingIdeas: gate.passingIdeas,
    blockedIdeas: gate.blockedIdeas,
    hardGateFailures,
    warnings: gate.reasons,
    recoveryPlanGenerated,
  };
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv);

    const packPath = path.resolve(args.scenarioPack);
    if (!fs.existsSync(packPath)) {
      console.error(`Error: scenario pack not found: ${packPath}`);
      process.exit(EXIT_INVALID_INPUT);
    }

    let pack: ScenarioPack;
    try {
      pack = JSON.parse(fs.readFileSync(packPath, 'utf-8')) as ScenarioPack;
    } catch {
      console.error('Error: invalid scenario pack JSON');
      process.exit(EXIT_INVALID_INPUT);
    }

    fs.mkdirSync(path.resolve(args.outputDir), { recursive: true });

    const results: EvalResult[] = [];
    for (const scenario of pack.scenarios || []) {
      // deterministic ordering and deterministic scenario execution
      results.push(await evaluateScenario(scenario, args));
    }

    if (args.formats.has('json')) writeJsonArtifact(results, args.outputDir);
    if (args.formats.has('md')) writeMdArtifact(results, args.outputDir);
    if (args.formats.has('csv')) writeCsvArtifact(results, args.outputDir);

    const hardGateFailures = results.reduce((sum, item) => sum + item.hardGateFailures.length, 0);

    console.log(`Scenarios: ${results.length}`);
    console.log(`Hard-gate failures: ${hardGateFailures}`);

    if (args.mode === 'enforce' && hardGateFailures > 0) {
      process.exit(EXIT_HARD_GATE);
    }

    process.exit(EXIT_OK);
  } catch (error) {
    console.error('Runtime error:', error);
    process.exit(EXIT_RUNTIME);
  }
}

void main();
