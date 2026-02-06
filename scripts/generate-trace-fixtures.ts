import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

interface FixtureFile {
  schema_version: string;
  generated_at: string;
  traces: TraceRecord[];
}

function nonEmpty(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function toHash(seed: number): string {
  const ch = (seed % 10).toString();
  return ch.repeat(64);
}

function makeInvalidTemplates(base: TraceRecord[]): TraceRecord[] {
  const sample = base[0] || {
    trace_id: "sample-trace",
    created_at: new Date().toISOString(),
    computation_method: "deterministic_graph_diff",
    claim_type: "causal_intervention",
    model_key: "hot_rosenthal_v1",
    model_version: "v1.0.0",
    input_hash: toHash(1),
  };

  return [
    { ...sample, trace_id: "" },
    { ...sample, trace_id: "bad-method", computation_method: "mcts", claim_type: "causal_intervention", seed: 11 },
    { ...sample, trace_id: "bad-seed", computation_method: "mcts", claim_type: "hypothesis_generation", seed: undefined },
    { ...sample, trace_id: "bad-claim", claim_type: "unknown_claim" },
    { ...sample, trace_id: "bad-date", created_at: "invalid-date" },
    { ...sample, trace_id: "bad-hash", input_hash: "not-a-sha" },
    { ...sample, trace_id: "bad-model-key", model_key: "" },
    { ...sample, trace_id: "bad-version", model_version: "" },
    { ...sample, trace_id: "bad-trace-id", trace_id: "" },
    { ...sample, trace_id: "missing-input-hash", input_hash: "" },
  ].map((t, i) => ({ ...t, metadata: { fixture: true, expected: i < 3 ? "invalid_critical" : "invalid_noncritical" } }));
}

async function loadSupabase(limit: number): Promise<TraceRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client
    .from("counterfactual_traces")
    .select("trace_id,created_at,computation_method,claim_type,model_key,model_version,input_hash,seed,metadata")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as any[]).map((row, idx) => ({
    trace_id: nonEmpty(row.trace_id, `generated-${idx}`),
    created_at: nonEmpty(row.created_at, new Date().toISOString()),
    computation_method: nonEmpty(row.computation_method, "deterministic_graph_diff"),
    claim_type: nonEmpty(row.claim_type, "causal_intervention"),
    model_key: nonEmpty(row.model_key, "hot_rosenthal_v1"),
    model_version: nonEmpty(row.model_version, "v1.0.0"),
    input_hash: nonEmpty(row.input_hash, toHash(idx + 1)),
    seed: row.seed,
    metadata: { ...(row.metadata || {}), fixture: true, expected: "valid" },
  }));
}

async function main() {
  const outPath = process.argv.includes("--output")
    ? process.argv[process.argv.indexOf("--output") + 1]
    : "docs/governance/trace-fixtures.v1.json";

  const base = await loadSupabase(10);
  const fallbackBase: TraceRecord[] = base.length > 0 ? base : Array.from({ length: 10 }).map((_, i) => ({
    trace_id: `trc-generated-${String(i + 1).padStart(3, "0")}`,
    created_at: new Date(Date.now() - i * 60_000).toISOString(),
    computation_method: i % 3 === 0 ? "deterministic_graph_diff" : i % 3 === 1 ? "exact_solver" : "mcts",
    claim_type: i % 3 === 2 ? "hypothesis_generation" : "causal_intervention",
    model_key: "hot_rosenthal_v1",
    model_version: "v1.0.0",
    input_hash: toHash(i + 1),
    seed: i % 3 === 2 ? i + 100 : undefined,
    metadata: { fixture: true, expected: "valid" },
  }));

  const valid = fallbackBase.slice(0, 10);
  const invalid = makeInvalidTemplates(valid);

  const payload: FixtureFile = {
    schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    traces: [...valid, ...invalid],
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Trace fixtures written: ${outPath} (valid=${valid.length}, invalid=${invalid.length})`);
}

main().catch((err) => {
  console.error(`[generate-trace-fixtures] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
