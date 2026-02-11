import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type {
  CounterfactualComputationMethod,
  CounterfactualTrace,
  CounterfactualTraceRef,
  CounterfactualUncertainty,
} from "@/types/scm";

export type CounterfactualTraceSource =
  | "hybrid"
  | "legal"
  | "education"
  | "chat"
  | "scm";

export interface BuildCounterfactualTraceInput {
  modelRef: {
    modelKey: string;
    version: string;
  };
  intervention: {
    variable: string;
    value: number;
  };
  outcome: string;
  observedWorld?: Record<string, number>;
  assumptions?: string[];
  adjustmentSet?: string[];
  method?: CounterfactualComputationMethod;
  uncertainty?: CounterfactualUncertainty;
  traceId?: string;
}

export interface PersistCounterfactualTraceInput {
  trace: CounterfactualTrace;
  sourceFeature: CounterfactualTraceSource;
  userId?: string | null;
}

export interface PersistCounterfactualTraceResult {
  persisted: boolean;
  error?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeObservedWorld(value: Record<string, number> | undefined): Record<string, number> {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, numeric]) => key.trim().length > 0 && Number.isFinite(numeric))
      .map(([key, numeric]) => [key, Number(numeric)])
  );
}

function sanitizeStrings(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

function normalizePathToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildAffectedPaths(intervention: string, affectedNodes: string[]): string[] {
  const from = intervention.trim() || "Intervention";
  const paths = affectedNodes
    .filter((node) => normalizePathToken(node) !== normalizePathToken(from))
    .map((node) => `${from} -> ${node}`);
  return Array.from(new Set(paths));
}

export function buildCounterfactualTrace(
  scm: StructuralCausalModel,
  input: BuildCounterfactualTraceInput
): CounterfactualTrace {
  const interventionVariable = input.intervention.variable.trim();
  const outcome = input.outcome.trim();
  const observedWorld = sanitizeObservedWorld(input.observedWorld);
  const assumptions = sanitizeStrings(input.assumptions);
  const adjustmentSet = sanitizeStrings(input.adjustmentSet);
  const traceId = input.traceId || crypto.randomUUID();
  const method = input.method ?? "deterministic_graph_diff";
  const uncertainty = input.uncertainty ?? "medium";

  const counterfactual = scm.queryCounterfactual({
    interventionVariable,
    interventionValue: input.intervention.value,
    outcome,
    observed: observedWorld,
  });

  const intervention = scm.queryIntervention({
    interventionVariable,
    interventionValue: input.intervention.value,
    outcome,
    baseline: observedWorld,
  });

  return {
    traceId,
    modelRef: {
      modelKey: input.modelRef.modelKey,
      version: input.modelRef.version,
    },
    query: {
      intervention: {
        variable: interventionVariable,
        value: input.intervention.value,
      },
      outcome,
      observedWorld,
    },
    assumptions,
    adjustmentSet,
    computation: {
      method,
      affectedPaths: buildAffectedPaths(interventionVariable, intervention.affectedNodes),
      uncertainty,
    },
    result: {
      actualOutcome: counterfactual.actualOutcome,
      counterfactualOutcome: counterfactual.counterfactualOutcome,
      delta: counterfactual.difference,
    },
  };
}

export function buildCounterfactualTracePath(traceId: string): string {
  return `/api/scm/counterfactual-traces/${traceId}`;
}

export function buildCounterfactualTraceRef(
  trace: CounterfactualTrace,
  persisted: boolean
): CounterfactualTraceRef {
  return {
    traceId: trace.traceId,
    method: trace.computation.method,
    uncertainty: trace.computation.uncertainty,
    retrievalPath: buildCounterfactualTracePath(trace.traceId),
    persisted,
  };
}

export async function persistCounterfactualTrace(
  input: PersistCounterfactualTraceInput
): Promise<PersistCounterfactualTraceResult> {
  try {
    const supabase = createServerSupabaseAdminClient();
    const userId =
      typeof input.userId === "string" && UUID_PATTERN.test(input.userId)
        ? input.userId
        : null;

    const { error } = await supabase.from("counterfactual_traces").insert({
      id: input.trace.traceId,
      user_id: userId,
      source_feature: input.sourceFeature,
      model_key: input.trace.modelRef.modelKey,
      model_version: input.trace.modelRef.version,
      intervention_variable: input.trace.query.intervention.variable,
      intervention_value: input.trace.query.intervention.value,
      outcome_variable: input.trace.query.outcome,
      observed_world: input.trace.query.observedWorld,
      assumptions_json: input.trace.assumptions,
      adjustment_set: input.trace.adjustmentSet,
      computation_method: input.trace.computation.method,
      affected_paths: input.trace.computation.affectedPaths,
      uncertainty: input.trace.computation.uncertainty,
      actual_outcome: input.trace.result.actualOutcome,
      counterfactual_outcome: input.trace.result.counterfactualOutcome,
      delta: input.trace.result.delta,
      trace_json: input.trace,
    });

    if (error) {
      return { persisted: false, error: error.message };
    }

    return { persisted: true };
  } catch (error) {
    return {
      persisted: false,
      error: error instanceof Error ? error.message : "Unknown persistence error",
    };
  }
}
