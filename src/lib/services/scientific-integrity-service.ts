import { SupabaseClient } from "@supabase/supabase-js";
import {
  ScientificIntegrityStatus,
  ScientificIntegritySignoffRequest,
} from "@/types/scm";

export interface BenchmarkRunSnapshot {
  created_at: string;
  suite_name: string;
  status: string;
  results?: {
    passed?: boolean;
    complianceGate?: {
      passed?: boolean;
    };
  } | null;
}

export interface HypothesisAuditEventSnapshot {
  hypothesis_id: string | null;
  state: string | null;
  rationale: string | null;
  event_timestamp?: string | null;
}

export interface CounterfactualTraceSnapshot {
  computation_method: string | null;
  created_at?: string | null;
}

export interface ScientificIntegrityEvaluationInput {
  benchmarkRuns: BenchmarkRunSnapshot[];
  hypothesisEvents: HypothesisAuditEventSnapshot[];
  counterfactualTraces: CounterfactualTraceSnapshot[];
  requiredFullSuitePasses: number;
  minimumDeterministicTraces: number;
  minimumDeterministicCoverage: number;
}

export interface ScientificIntegrityStatusOptions {
  windowDays?: number;
  requiredFullSuitePasses?: number;
  minimumDeterministicTraces?: number;
  minimumDeterministicCoverage?: number;
}

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_REQUIRED_FULL_SUITE_PASSES = 3;
const DEFAULT_MIN_DETERMINISTIC_TRACES = 3;
const DEFAULT_MIN_DETERMINISTIC_COVERAGE = 0.95;
const MIN_SIGNOFF_RATIONALE_LENGTH = 16;

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFloatThreshold(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(value || "");
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function normalizeString(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

function toIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function evaluateScientificIntegrity(input: ScientificIntegrityEvaluationInput): ScientificIntegrityStatus {
  const requiredRuns = Math.max(1, input.requiredFullSuitePasses);
  const benchmarkRuns = [...input.benchmarkRuns]
    .filter((run) => run.suite_name === "full_suite" && run.status === "completed")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, requiredRuns);

  const benchmarkPassedRuns = benchmarkRuns.filter(
    (run) => run.results?.complianceGate?.passed === true
  ).length;
  const benchmarkPass = benchmarkRuns.length >= requiredRuns && benchmarkPassedRuns === requiredRuns;

  const lifecycleCounts = {
    proposed: 0,
    tested: 0,
    falsified: 0,
    retracted: 0,
    malformedEvents: 0,
  };

  for (const event of input.hypothesisEvents) {
    const state = normalizeString(event.state);
    const hypothesisId = normalizeString(event.hypothesis_id);
    const rationale = normalizeString(event.rationale);

    if (!hypothesisId || !rationale || !state) {
      lifecycleCounts.malformedEvents += 1;
      continue;
    }

    if (state === "proposed") lifecycleCounts.proposed += 1;
    else if (state === "tested") lifecycleCounts.tested += 1;
    else if (state === "falsified") lifecycleCounts.falsified += 1;
    else if (state === "retracted") lifecycleCounts.retracted += 1;
  }

  const lifecyclePass =
    lifecycleCounts.malformedEvents === 0 &&
    lifecycleCounts.proposed > 0 &&
    lifecycleCounts.tested > 0 &&
    lifecycleCounts.falsified + lifecycleCounts.retracted > 0;

  const minimumDeterministicTraces = Math.max(1, input.minimumDeterministicTraces);
  const totalRecentTraces = input.counterfactualTraces.length;
  const deterministicTraces = input.counterfactualTraces.filter(
    (trace) => normalizeString(trace.computation_method) === "deterministic_graph_diff"
  ).length;
  const deterministicCoverage =
    totalRecentTraces > 0 ? deterministicTraces / totalRecentTraces : 0;
  const requiredCoverage = input.minimumDeterministicCoverage;

  const tracePass =
    deterministicTraces >= minimumDeterministicTraces &&
    deterministicCoverage >= requiredCoverage;

  const checklist = [
    {
      id: "benchmark_sustained" as const,
      title: "Sustained benchmark compliance",
      required: true,
      pass: benchmarkPass,
      reason: benchmarkPass
        ? `Latest ${requiredRuns} full-suite benchmark runs passed compliance gate.`
        : `Need ${requiredRuns} consecutive full-suite compliance passes (observed ${benchmarkPassedRuns}/${requiredRuns}).`,
    },
    {
      id: "hypothesis_lifecycle_auditable" as const,
      title: "Auditable hypothesis lifecycle loop",
      required: true,
      pass: lifecyclePass,
      reason: lifecyclePass
        ? "Observed propose -> test -> falsify/retract lifecycle evidence without malformed events."
        : "Lifecycle evidence is incomplete or malformed; require proposed, tested, and falsified/retracted events.",
    },
    {
      id: "deterministic_trace_provenance" as const,
      title: "Deterministic counterfactual trace provenance",
      required: true,
      pass: tracePass,
      reason: tracePass
        ? `Deterministic trace coverage ${Math.round(deterministicCoverage * 100)}% with ${deterministicTraces} recent traces.`
        : `Require >=${Math.round(requiredCoverage * 100)}% deterministic trace coverage and >=${minimumDeterministicTraces} recent deterministic traces.`,
    },
  ];

  const overallPass = checklist.every((item) => item.pass);

  return {
    generatedAt: new Date().toISOString(),
    overallPass,
    freezePromotion: !overallPass,
    checks: {
      benchmarkSustained: {
        pass: benchmarkPass,
        requiredRuns,
        observedRuns: benchmarkRuns.length,
        passedRuns: benchmarkPassedRuns,
      },
      hypothesisLifecycleAuditable: {
        pass: lifecyclePass,
        ...lifecycleCounts,
      },
      deterministicTraceProvenance: {
        pass: tracePass,
        totalRecentTraces,
        deterministicTraces,
        deterministicCoverage: round4(deterministicCoverage),
        requiredCoverage: round4(requiredCoverage),
        minimumDeterministicTraces,
      },
    },
    checklist,
  };
}

export class ScientificIntegrityService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getStatus(options: ScientificIntegrityStatusOptions = {}): Promise<ScientificIntegrityStatus> {
    const windowDays = parseInteger(
      process.env.SCIENTIFIC_INTEGRITY_WINDOW_DAYS,
      options.windowDays ?? DEFAULT_WINDOW_DAYS
    );
    const requiredFullSuitePasses = parseInteger(
      process.env.SCIENTIFIC_INTEGRITY_REQUIRED_FULL_SUITE_RUNS,
      options.requiredFullSuitePasses ?? DEFAULT_REQUIRED_FULL_SUITE_PASSES
    );
    const minimumDeterministicTraces = parseInteger(
      process.env.SCIENTIFIC_INTEGRITY_MIN_DETERMINISTIC_TRACES,
      options.minimumDeterministicTraces ?? DEFAULT_MIN_DETERMINISTIC_TRACES
    );
    const minimumDeterministicCoverage = parseFloatThreshold(
      process.env.SCIENTIFIC_INTEGRITY_MIN_DETERMINISTIC_COVERAGE,
      options.minimumDeterministicCoverage ?? DEFAULT_MIN_DETERMINISTIC_COVERAGE
    );

    const sinceIso = toIsoDaysAgo(windowDays);

    const [benchmarkResult, lifecycleResult, traceResult] = await Promise.all([
      this.supabase
        .from("benchmark_runs")
        .select("created_at,suite_name,status,results")
        .eq("suite_name", "full_suite")
        .eq("status", "completed")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(Math.max(requiredFullSuitePasses * 4, 12)),
      this.supabase
        .from("hypothesis_audit_events")
        .select("hypothesis_id,state,rationale,event_timestamp")
        .gte("event_timestamp", sinceIso)
        .order("event_timestamp", { ascending: false })
        .limit(1000),
      this.supabase
        .from("counterfactual_traces")
        .select("computation_method,created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (benchmarkResult.error) {
      throw new Error(`Failed to load benchmark integrity data: ${benchmarkResult.error.message}`);
    }
    if (lifecycleResult.error) {
      throw new Error(`Failed to load hypothesis lifecycle integrity data: ${lifecycleResult.error.message}`);
    }
    if (traceResult.error) {
      throw new Error(`Failed to load counterfactual trace integrity data: ${traceResult.error.message}`);
    }

    return evaluateScientificIntegrity({
      benchmarkRuns: (benchmarkResult.data ?? []) as BenchmarkRunSnapshot[],
      hypothesisEvents: (lifecycleResult.data ?? []) as HypothesisAuditEventSnapshot[],
      counterfactualTraces: (traceResult.data ?? []) as CounterfactualTraceSnapshot[],
      requiredFullSuitePasses,
      minimumDeterministicTraces,
      minimumDeterministicCoverage,
    });
  }

  async createSignoff(
    userId: string,
    request: ScientificIntegritySignoffRequest,
    statusSnapshot: ScientificIntegrityStatus
  ): Promise<string> {
    const decision = request.decision;
    const rationale = normalizeString(request.rationale);
    const override = request.override === true;

    if (decision !== "approved" && decision !== "rejected") {
      throw new Error("Invalid signoff decision. Use 'approved' or 'rejected'.");
    }
    if (rationale.length < MIN_SIGNOFF_RATIONALE_LENGTH) {
      throw new Error(`Signoff rationale must be at least ${MIN_SIGNOFF_RATIONALE_LENGTH} characters.`);
    }

    const { data, error } = await this.supabase
      .from("scm_integrity_signoffs")
      .insert({
        user_id: userId,
        decision,
        rationale,
        override_used: override,
        status_snapshot: statusSnapshot,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to persist scientific integrity signoff.");
    }

    return data.id;
  }
}
