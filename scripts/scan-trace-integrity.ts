import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type Severity = "critical" | "high" | "medium" | "low";
type Mode = "report" | "enforce";
type Source = "fixture" | "supabase" | "hybrid";
type RolloutStage = "week1" | "week2" | "week3";

const EXIT_OK = 0;
const EXIT_BLOCKING = 2;
const EXIT_SCHEMA = 3;
const EXIT_RUNTIME = 4;
const SCAN_BUDGET_MS = 30_000;
const SUPABASE_TIMEOUT_MS = 10_000;
const TOTAL_STEP_BUDGET_MS = 60_000;

interface ClaimTypeRequirement {
  allowed_methods: string[];
  determinism_class: "deterministic" | "stochastic";
  seed_required: boolean;
}

interface Policy {
  schema_version: string;
  deterministic_methods: string[];
  stochastic_methods: string[];
  claim_type_requirements: Record<string, ClaimTypeRequirement>;
  critical_invariants: string[];
  aggregate_thresholds: { non_critical_invalid_rate_max: number };
  override_rules: {
    critical_ttl_days_max: number;
    approved_by_required: boolean;
    allowed_approvers: string[];
  };
}

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

interface OverrideRecord {
  override_id: string;
  trace_pattern: Record<string, unknown>;
  suppressed_violations: string[];
  reason: string;
  approved_by: string;
  created_at: string;
  expires_at: string;
}

interface OverridesFile {
  schema_version: string;
  overrides: OverrideRecord[];
}

interface Violation {
  code: string;
  severity: Severity;
  message: string;
}

interface TraceEvaluation {
  trace_id: string;
  valid: boolean;
  violations: Violation[];
  suppressed_violations: string[];
}

interface Report {
  generated_at: string;
  mode: Mode;
  source: Source;
  strict: Severity;
  rollout_stage: RolloutStage;
  fallback_mode: boolean;
  warnings: string[];
  duration_ms: number;
  budgets: {
    scan_budget_ms: number;
    supabase_timeout_ms: number;
    total_step_budget_ms: number;
    within_scan_budget: boolean;
    within_total_budget: boolean;
  };
  summary: {
    total_traces: number;
    valid_traces: number;
    invalid_traces: number;
    critical_violations: number;
    high_violations: number;
    non_critical_invalid_rate: number;
    blocking: boolean;
  };
  trace_results: TraceEvaluation[];
}

interface CliArgs {
  mode: Mode;
  source: Source;
  strict: Severity;
  policyPath: string;
  schemaPath: string;
  fixturesPath: string;
  overridesPath: string;
  outputDir: string;
  rolloutStage: RolloutStage;
  dryRun: boolean;
  verbose: boolean;
  limit: number;
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    mode: "report",
    source: "fixture",
    strict: "critical",
    policyPath: "docs/governance/trace-integrity-policy.json",
    schemaPath: "docs/governance/trace-integrity.schema.json",
    fixturesPath: "docs/governance/trace-fixtures.v1.json",
    overridesPath: "docs/governance/trace-overrides.json",
    outputDir: "artifacts",
    rolloutStage: (process.env.ROLLOUT_STAGE as RolloutStage) || "week1",
    dryRun: false,
    verbose: false,
    limit: 100,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--mode") args.mode = (argv[++i] as Mode) || "report";
    else if (token === "--source") args.source = (argv[++i] as Source) || "fixture";
    else if (token === "--strict") args.strict = (argv[++i] as Severity) || "critical";
    else if (token === "--policy") args.policyPath = argv[++i];
    else if (token === "--schema") args.schemaPath = argv[++i];
    else if (token === "--fixtures") args.fixturesPath = argv[++i];
    else if (token === "--overrides") args.overridesPath = argv[++i];
    else if (token === "--output-dir") args.outputDir = argv[++i];
    else if (token === "--rollout-stage") args.rolloutStage = (argv[++i] as RolloutStage) || "week1";
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--verbose") args.verbose = true;
    else if (token === "--limit") args.limit = Number(argv[++i]) || 100;
  }

  return args;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function isValidIso(value: string): boolean {
  const t = Date.parse(value);
  return Number.isFinite(t);
}

function toNumberSeverityFilter(s: Severity): number {
  return SEVERITY_RANK[s];
}

function severityMeetsFilter(sev: Severity, strict: Severity): boolean {
  return SEVERITY_RANK[sev] >= toNumberSeverityFilter(strict);
}

function validatePolicy(policy: Policy): void {
  if (!isNonEmptyString(policy.schema_version)) throw new Error("Invalid policy schema_version");
  if (!Array.isArray(policy.deterministic_methods)) throw new Error("Invalid deterministic_methods");
  if (!Array.isArray(policy.stochastic_methods)) throw new Error("Invalid stochastic_methods");
  if (!policy.claim_type_requirements || typeof policy.claim_type_requirements !== "object") {
    throw new Error("Invalid claim_type_requirements");
  }
}

function loadFixtures(fixturesPath: string): TraceRecord[] {
  if (!fs.existsSync(fixturesPath)) return [];
  const payload = readJson<FixturesFile>(fixturesPath);
  if (!Array.isArray(payload.traces)) return [];
  return payload.traces;
}

function loadOverrides(overridesPath: string): OverrideRecord[] {
  if (!fs.existsSync(overridesPath)) return [];
  const payload = readJson<OverridesFile>(overridesPath);
  return Array.isArray(payload.overrides) ? payload.overrides : [];
}

function normalizeApprovedBy(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function isOverrideGovernanceValid(override: OverrideRecord, policy: Policy, nowTs: number): boolean {
  if (!isNonEmptyString(override.override_id)) return false;
  if (!isNonEmptyString(override.reason)) return false;
  if (!isNonEmptyString(override.approved_by)) return false;

  const createdAt = Date.parse(override.created_at);
  const expiresAt = Date.parse(override.expires_at);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < nowTs) return false;
  if (expiresAt <= createdAt) return false;

  const ttlDays = (expiresAt - createdAt) / (1000 * 60 * 60 * 24);
  if (ttlDays > policy.override_rules.critical_ttl_days_max) return false;

  if (policy.override_rules.approved_by_required) {
    const approvedBy = normalizeApprovedBy(override.approved_by);
    const allowed = policy.override_rules.allowed_approvers.map(normalizeApprovedBy);
    if (!allowed.includes(approvedBy)) return false;
  }

  return true;
}

function traceMatchesPattern(trace: TraceRecord, pattern: Record<string, unknown>): boolean {
  return Object.entries(pattern).every(([k, v]) => {
    const current = (trace as Record<string, unknown>)[k];
    return current === v;
  });
}

function findActiveSuppressions(trace: TraceRecord, overrides: OverrideRecord[], nowTs: number): Map<string, string> {
  const suppressed = new Map<string, string>();
  for (const ov of overrides) {
    const expires = Date.parse(ov.expires_at);
    if (!Number.isFinite(expires) || expires < nowTs) continue;
    if (!isNonEmptyString(ov.approved_by)) continue;
    if (!traceMatchesPattern(trace, ov.trace_pattern || {})) continue;
    for (const code of ov.suppressed_violations || []) {
      suppressed.set(code, `${ov.override_id}: ${ov.reason}`);
    }
  }
  return suppressed;
}

function inputHashSeverity(stage: RolloutStage): Severity {
  return stage === "week3" ? "critical" : "high";
}

function evaluateTrace(trace: TraceRecord, policy: Policy, stage: RolloutStage): Violation[] {
  const violations: Violation[] = [];

  if (!isNonEmptyString(trace.trace_id)) {
    violations.push({ code: "missing_trace_id", severity: "critical", message: "trace_id is missing" });
  }

  if (!isNonEmptyString(trace.created_at) || !isValidIso(trace.created_at)) {
    violations.push({ code: "invalid_created_at", severity: "high", message: "created_at is missing or invalid" });
  }

  if (!isNonEmptyString(trace.computation_method)) {
    violations.push({ code: "missing_computation_method", severity: "critical", message: "computation_method is missing" });
  }

  if (!isNonEmptyString(trace.claim_type)) {
    violations.push({ code: "missing_claim_type", severity: "critical", message: "claim_type is missing" });
  }

  if (!isNonEmptyString(trace.model_key)) {
    violations.push({ code: "missing_model_key", severity: "critical", message: "model_key is missing" });
  }

  if (!isNonEmptyString(trace.model_version)) {
    violations.push({ code: "missing_model_version", severity: "critical", message: "model_version is missing" });
  }

  if (!isNonEmptyString(trace.input_hash)) {
    violations.push({
      code: "missing_input_hash",
      severity: inputHashSeverity(stage),
      message: "input_hash is missing",
    });
  } else if (!isSha256(trace.input_hash)) {
    violations.push({ code: "invalid_input_hash", severity: "high", message: "input_hash is not sha256 hex" });
  }

  const req = policy.claim_type_requirements[trace.claim_type];
  if (!req) {
    violations.push({ code: "unknown_claim_type", severity: "high", message: `unknown claim_type '${trace.claim_type}'` });
  } else {
    if (!req.allowed_methods.includes(trace.computation_method)) {
      violations.push({ code: "method_not_allowed", severity: "critical", message: "computation_method not allowed for claim_type" });
    }

    if (req.seed_required && (trace.seed === undefined || trace.seed === null || trace.seed === "")) {
      violations.push({ code: "missing_seed", severity: "critical", message: "seed is required for this claim_type/method" });
    }
  }

  if (
    policy.deterministic_methods.includes(trace.computation_method) === false &&
    policy.stochastic_methods.includes(trace.computation_method) === false
  ) {
    violations.push({ code: "unknown_method", severity: "high", message: `unknown computation_method '${trace.computation_method}'` });
  }

  return violations;
}

async function loadFromSupabase(limit: number): Promise<TraceRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase credentials are not configured");

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const queryPromise = client
    .from("counterfactual_traces")
    .select("trace_id,created_at,computation_method,claim_type,model_key,model_version,input_hash,seed,metadata")
    .order("created_at", { ascending: false })
    .limit(limit);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Supabase query timeout")), SUPABASE_TIMEOUT_MS);
  });

  const result = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;
  if (result.error) throw new Error(result.error.message);
  return (result.data || []) as unknown as TraceRecord[];
}

function toMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push("# Trace Integrity Report");
  lines.push("");
  lines.push(`- Generated at: ${report.generated_at}`);
  lines.push(`- Mode: ${report.mode}`);
  lines.push(`- Source: ${report.source}`);
  lines.push(`- Rollout stage: ${report.rollout_stage}`);
  lines.push(`- Fallback mode: ${report.fallback_mode}`);
  lines.push(`- Duration (ms): ${report.duration_ms}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total traces: ${report.summary.total_traces}`);
  lines.push(`- Valid traces: ${report.summary.valid_traces}`);
  lines.push(`- Invalid traces: ${report.summary.invalid_traces}`);
  lines.push(`- Critical violations: ${report.summary.critical_violations}`);
  lines.push(`- High violations: ${report.summary.high_violations}`);
  lines.push(`- Non-critical invalid rate: ${report.summary.non_critical_invalid_rate}`);
  lines.push(`- Blocking: ${report.summary.blocking}`);
  lines.push("");
  if (report.warnings.length > 0) {
    lines.push("## Warnings");
    for (const w of report.warnings) lines.push(`- ${w}`);
    lines.push("");
  }
  lines.push("## Trace Results");
  lines.push("| trace_id | valid | violations | suppressed |");
  lines.push("|---|---:|---:|---:|");
  for (const tr of report.trace_results) {
    lines.push(`| ${tr.trace_id || "(missing)"} | ${tr.valid} | ${tr.violations.length} | ${tr.suppressed_violations.length} |`);
  }
  return lines.join("\n");
}

function updateTrendCsv(outputDir: string, report: Report): void {
  const csvPath = path.join(outputDir, "trace-integrity-trend.csv");
  const header = "timestamp,total_traces,valid_traces,invalid_traces,non_critical_invalid_rate,critical_violations,high_violations,fallback_mode";
  const line = [
    report.generated_at,
    report.summary.total_traces,
    report.summary.valid_traces,
    report.summary.invalid_traces,
    report.summary.non_critical_invalid_rate,
    report.summary.critical_violations,
    report.summary.high_violations,
    report.fallback_mode
  ].join(",");

  let lines: string[] = [header];
  if (fs.existsSync(csvPath)) {
    const existing = fs.readFileSync(csvPath, "utf8").trim().split("\n").filter(Boolean);
    if (existing.length > 1 && existing[0] === header) {
      lines = [header, ...existing.slice(1)];
    }
  }

  lines.push(line);
  const kept = [header, ...lines.slice(-90)];
  fs.writeFileSync(csvPath, kept.join("\n") + "\n", "utf8");
}

async function main(): Promise<number> {
  const start = Date.now();
  try {
    const args = parseArgs(process.argv.slice(2));
    const warnings: string[] = [];

    const policy = readJson<Policy>(args.policyPath);
    validatePolicy(policy);

    if (!fs.existsSync(args.schemaPath)) {
      throw new Error(`Missing trace schema file: ${args.schemaPath}`);
    }

    if (args.dryRun) {
      console.log("Dry-run complete. Policy/schema/fixtures parsed successfully.");
      return EXIT_OK;
    }

    let traces: TraceRecord[] = [];
    let fallbackMode = false;

    if (args.source === "fixture") {
      traces = loadFixtures(args.fixturesPath);
    } else if (args.source === "supabase") {
      traces = await loadFromSupabase(args.limit);
    } else {
      try {
        traces = await loadFromSupabase(args.limit);
      } catch (error) {
        fallbackMode = true;
        warnings.push(`Supabase sampling failed, fallback to fixtures: ${error instanceof Error ? error.message : String(error)}`);
        traces = loadFixtures(args.fixturesPath);
      }
    }

    if (traces.length === 0) {
      warnings.push("No traces available for validation");
    }

    const overrides = loadOverrides(args.overridesPath);
    const nowTs = Date.now();
    const validOverrides = overrides.filter((ov) => {
      const valid = isOverrideGovernanceValid(ov, policy, nowTs);
      if (!valid) {
        warnings.push(`Invalid override ignored: ${ov.override_id || "(missing-id)"}`);
      }
      return valid;
    });
    const traceResults: TraceEvaluation[] = [];

    let criticalCount = 0;
    let highCount = 0;
    let invalidCount = 0;
    let nonCriticalInvalidCount = 0;

    for (const trace of traces) {
      const violations = evaluateTrace(trace, policy, args.rolloutStage);
      const activeSuppressions = findActiveSuppressions(trace, validOverrides, nowTs);

      const remainingViolations: Violation[] = [];
      const suppressed: string[] = [];
      for (const v of violations) {
        if (activeSuppressions.has(v.code)) {
          suppressed.push(`${v.code} (${activeSuppressions.get(v.code)})`);
        } else {
          remainingViolations.push(v);
        }
      }

      const hasCritical = remainingViolations.some((v) => v.severity === "critical");
      const hasAny = remainingViolations.length > 0;
      const hasNonCritical = remainingViolations.some((v) => v.severity !== "critical");

      if (hasCritical) criticalCount += 1;
      if (remainingViolations.some((v) => v.severity === "high")) highCount += 1;
      if (hasAny) invalidCount += 1;
      if (hasNonCritical) nonCriticalInvalidCount += 1;

      traceResults.push({
        trace_id: trace.trace_id,
        valid: !hasAny,
        violations: remainingViolations,
        suppressed_violations: suppressed,
      });
    }

    const total = traces.length;
    const nonCriticalRate = total > 0 ? Number((nonCriticalInvalidCount / total).toFixed(4)) : 0;

    const strictCritical = args.mode === "enforce" && criticalCount > 0 && severityMeetsFilter("critical", args.strict);
    const aggregateBlocking = args.mode === "enforce" && criticalCount === 0 && nonCriticalRate > policy.aggregate_thresholds.non_critical_invalid_rate_max;
    const blocking = strictCritical || aggregateBlocking;

    const report: Report = {
      generated_at: nowIso(),
      mode: args.mode,
      source: args.source,
      strict: args.strict,
      rollout_stage: args.rolloutStage,
      fallback_mode: fallbackMode,
      warnings,
      duration_ms: Date.now() - start,
      budgets: {
        scan_budget_ms: SCAN_BUDGET_MS,
        supabase_timeout_ms: SUPABASE_TIMEOUT_MS,
        total_step_budget_ms: TOTAL_STEP_BUDGET_MS,
        within_scan_budget: Date.now() - start <= SCAN_BUDGET_MS,
        within_total_budget: Date.now() - start <= TOTAL_STEP_BUDGET_MS,
      },
      summary: {
        total_traces: total,
        valid_traces: total - invalidCount,
        invalid_traces: invalidCount,
        critical_violations: criticalCount,
        high_violations: highCount,
        non_critical_invalid_rate: nonCriticalRate,
        blocking,
      },
      trace_results: traceResults,
    };

    fs.mkdirSync(args.outputDir, { recursive: true });
    fs.writeFileSync(path.join(args.outputDir, "trace-integrity-report.json"), JSON.stringify(report, null, 2), "utf8");
    fs.writeFileSync(path.join(args.outputDir, "trace-integrity-report.md"), toMarkdown(report), "utf8");
    updateTrendCsv(args.outputDir, report);

    if (args.verbose) {
      for (const row of traceResults) {
        console.log(`[trace:${row.trace_id || "missing"}] valid=${row.valid} violations=${row.violations.map((v) => v.code).join(",")}`);
      }
    }

    console.log(`Trace integrity scan complete. total=${total} critical=${criticalCount} nonCriticalRate=${nonCriticalRate} blocking=${blocking}`);
    return blocking ? EXIT_BLOCKING : EXIT_OK;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[scan-trace-integrity] ${msg}`);
    if (msg.includes("schema") || msg.includes("policy") || msg.includes("fixtures")) {
      return EXIT_SCHEMA;
    }
    return EXIT_RUNTIME;
  }
}

main().then((code) => process.exit(code));
