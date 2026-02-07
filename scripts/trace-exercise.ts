import fs from "node:fs";
import path from "node:path";

interface TraceRecord {
  trace_id: string;
  created_at: string;
  computation_method: string;
  claim_type: string;
  model_key: string;
  model_version: string;
  input_hash: string;
  seed?: string | number;
  metadata?: Record<string, unknown>;
}

interface FixturesFile {
  schema_version: string;
  generated_at: string;
  traces: TraceRecord[];
}

type ExerciseMode = "break" | "restore" | "status";
type ValidMetadata = "valid" | "invalid_critical" | "invalid_noncritical";
type ExtendedExerciseMode = ExerciseMode | "init";

const DEFAULT_FIXTURES = "docs/governance/trace-fixtures.exercise.v1.json";
const DEFAULT_SOURCE_FIXTURES = "docs/governance/trace-fixtures.v1.json";
const DEFAULT_BACKUP = "artifacts/trace-fixtures.exercise.v1.backup.json";
const EXERCISE_TRACE_ID = "trc-exercise-critical-001";

function parseArg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

function getMode(): ExtendedExerciseMode {
  const mode = parseArg("--mode", "status");
  if (mode !== "init" && mode !== "break" && mode !== "restore" && mode !== "status") {
    throw new Error(`Invalid --mode '${mode}'. Expected init|break|restore|status.`);
  }
  return mode;
}

function readFixtures(filePath: string): FixturesFile {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as FixturesFile;
  if (!Array.isArray(parsed.traces)) {
    throw new Error("Invalid fixtures file: traces[] missing.");
  }
  return parsed;
}

function writeFixtures(filePath: string, payload: FixturesFile): void {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function isExerciseTrace(trace: TraceRecord): boolean {
  return trace.trace_id === EXERCISE_TRACE_ID;
}

function expectedState(trace: TraceRecord): ValidMetadata | undefined {
  const raw = trace.metadata?.expected;
  if (raw === "valid" || raw === "invalid_critical" || raw === "invalid_noncritical") {
    return raw;
  }
  return undefined;
}

function hasExerciseViolation(fixtures: FixturesFile): boolean {
  return fixtures.traces.some(isExerciseTrace);
}

function backupIfMissing(fixturesPath: string, backupPath: string): void {
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(fixturesPath, backupPath);
  }
}

function initMode(fixturesPath: string, sourceFixturesPath: string, force: boolean): void {
  if (fs.existsSync(fixturesPath) && !force) {
    console.log(`Exercise fixtures already exist: ${fixturesPath}`);
    console.log("Use --force to regenerate from source fixtures.");
    return;
  }

  if (!fs.existsSync(sourceFixturesPath)) {
    throw new Error(`Source fixtures file not found: ${sourceFixturesPath}`);
  }

  const source = readFixtures(sourceFixturesPath);
  const valid = source.traces.filter((trace) => expectedState(trace) === "valid");
  if (valid.length === 0) {
    throw new Error("No valid traces found in source fixture set.");
  }

  const payload: FixturesFile = {
    schema_version: source.schema_version,
    generated_at: new Date().toISOString(),
    traces: valid,
  };

  fs.mkdirSync(path.dirname(fixturesPath), { recursive: true });
  writeFixtures(fixturesPath, payload);
  console.log(`Initialized exercise fixtures: ${fixturesPath} (valid_traces=${valid.length})`);
}

function injectViolation(fixtures: FixturesFile): FixturesFile {
  if (hasExerciseViolation(fixtures)) {
    return fixtures;
  }

  const exerciseTrace: TraceRecord = {
    trace_id: EXERCISE_TRACE_ID,
    created_at: new Date().toISOString(),
    computation_method: "deterministic_graph_diff",
    claim_type: "causal_intervention",
    model_key: "",
    model_version: "v1.0.0",
    input_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    metadata: {
      exercise: "governance-proof",
      expected: "invalid_critical",
      reason: "intentional_missing_model_key",
    },
  };

  return {
    ...fixtures,
    generated_at: new Date().toISOString(),
    traces: [...fixtures.traces, exerciseTrace],
  };
}

function removeViolation(fixtures: FixturesFile): FixturesFile {
  if (!hasExerciseViolation(fixtures)) return fixtures;

  return {
    ...fixtures,
    generated_at: new Date().toISOString(),
    traces: fixtures.traces.filter((trace) => !isExerciseTrace(trace)),
  };
}

function breakMode(fixturesPath: string, backupPath: string): void {
  backupIfMissing(fixturesPath, backupPath);
  const fixtures = readFixtures(fixturesPath);
  const updated = injectViolation(fixtures);
  writeFixtures(fixturesPath, updated);
  console.log(`Injected exercise violation in ${fixturesPath}`);
  console.log(`Backup file: ${backupPath}`);
}

function restoreMode(fixturesPath: string, backupPath: string): void {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, fixturesPath);
    fs.unlinkSync(backupPath);
    console.log(`Restored fixtures from backup: ${backupPath}`);
    return;
  }

  const fixtures = readFixtures(fixturesPath);
  const updated = removeViolation(fixtures);
  writeFixtures(fixturesPath, updated);
  console.log("No backup found. Removed exercise trace marker if present.");
}

function statusMode(fixturesPath: string, backupPath: string): void {
  const fixtures = readFixtures(fixturesPath);
  const injected = hasExerciseViolation(fixtures);
  const backupExists = fs.existsSync(backupPath);
  const validCount = fixtures.traces.filter((trace) => expectedState(trace) === "valid").length;
  const exerciseCount = fixtures.traces.filter(isExerciseTrace).length;

  console.log(`exercise_violation_present=${injected}`);
  console.log(`exercise_violation_count=${exerciseCount}`);
  console.log(`valid_trace_count=${validCount}`);
  console.log(`total_trace_count=${fixtures.traces.length}`);
  console.log(`backup_exists=${backupExists}`);
  console.log(`fixtures_path=${fixturesPath}`);
  console.log(`backup_path=${backupPath}`);
}

function main(): number {
  try {
    const mode = getMode();
    const fixturesPath = parseArg("--fixtures", DEFAULT_FIXTURES);
    const sourceFixturesPath = parseArg("--source-fixtures", DEFAULT_SOURCE_FIXTURES);
    const backupPath = parseArg("--backup", DEFAULT_BACKUP);
    const force = process.argv.includes("--force");

    if (mode === "init") {
      initMode(fixturesPath, sourceFixturesPath, force);
      return 0;
    }

    if (!fs.existsSync(fixturesPath)) {
      throw new Error(`Fixtures file not found: ${fixturesPath}. Run with --mode init first.`);
    }

    if (mode === "break") breakMode(fixturesPath, backupPath);
    else if (mode === "restore") restoreMode(fixturesPath, backupPath);
    else statusMode(fixturesPath, backupPath);

    return 0;
  } catch (error) {
    console.error(`[trace-governance-exercise] ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exit(main());
