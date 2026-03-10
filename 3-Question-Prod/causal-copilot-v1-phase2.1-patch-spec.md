# Causal Copilot v1 — Phase 2.1 Patch Spec (Demis/MASA Contract Alignment)

**Date:** 2026-03-01  
**Status:** Required before implementation  
**Purpose:** Resolve Gemini Phase 2 blocking gaps while preserving Pearl Q1–Q3 product intent.

---

## 0) Origin + Intent
This feature set is explicitly inspired by Judea Pearl’s 3-question framing:
1. Intervention effectiveness
2. Attribution/mechanism
3. Counterfactual burden

This patch upgrades the prior v1 spec from conceptual correctness to **system-contract correctness** for Demis Workflow v2 and MASA trust-first architecture.

---

## 1) Patch Scope (Blocking Gaps to Close)
1. UI integration contract (React/Next.js boundary)
2. Non-identifiable degradation contract (strict JSON)
3. SSE/event contract for long-running compute
4. DAG registry DB migration + RLS policies
5. Provenance-complete EvidenceCard schema
6. Deterministic compute boundary (LLM parsing vs algorithmic causal math)

---

## 2) Updated System Architecture (v1.1-internal)

### 2.1 Deterministic Boundary Contract
- **LLM-allowed zone (stochastic):**
  - Natural language question parsing
  - Candidate mapping to ontology fields
- **Deterministic-only zone (non-stochastic):**
  - Query validation/coercion
  - DAG resolution/version pinning
  - d-separation / identifiability logic
  - adjustment set derivation
  - estimation math + diagnostics
  - confidence label assignment

**Hard Rule:** No LLM output can directly produce final causal estimates without deterministic validation.

---

## 3) UI Integration Contract

### 3.1 Rendering Target
- EvidenceCard renders as a contextual result block in the existing analysis output flow:
  - **Container:** `OutputPanel` (primary)
  - **Model-specific adapter:** `ScientistModel` causal result renderer

### 3.2 Display Modes
- `identifiable` → full evidence card with numeric estimate
- `partially_identifiable` → constrained numeric output + high-visibility caveat ribbon
- `not_identifiable` → no numeric causal effect; display fallback pathways and missing assumptions/data

### 3.3 UX Safety Rules
- Always show `identifiabilityStatus` badge at top
- Always show assumptions + provenance footer
- Never collapse caveats by default

---

## 4) API Contract Changes (SSE-first)

## 4.1 Endpoint Refactor
### Keep (fast deterministic):
- `POST /causal/identify` (synchronous; lightweight)

### Refactor to async stream:
- `POST /causal/estimate` → `POST /causal/estimate/jobs`
- `POST /causal/simulate` → `POST /causal/simulate/jobs`
- Add: `GET /causal/jobs/:jobId/stream` (SSE)

### Orchestrator:
- `POST /causal/query` may:
  - return immediate identify result for simple cases, or
  - enqueue compute + return `jobId` and `streamUrl`

## 4.2 SSE Event Frames
Standard event payload:
```json
{
  "jobId": "uuid",
  "stage": "checking_overlap",
  "progress": 42,
  "timestamp": "2026-03-01T00:00:00Z",
  "meta": {"bootstrapSamples": 1000}
}
```

Allowed `stage` values:
- `queued`
- `resolving_graph`
- `validating_query`
- `identification`
- `checking_overlap`
- `estimating_effect`
- `bootstrapping`
- `running_sensitivity`
- `assembling_evidence_card`
- `done`
- `failed`

Final `done` event includes full EvidenceCard payload.

---

## 5) Degradation Contract (Strict JSON)

When status = `not_identifiable`, API must return:
```json
{
  "identifiabilityStatus": "not_identifiable",
  "canEstimateNumericEffect": false,
  "blockers": [
    {
      "code": "UNMEASURED_CONFOUNDING_POSSIBLE",
      "message": "Backdoor path cannot be closed with available variables."
    }
  ],
  "minimumAdditionalRequirements": [
    "Measure confounder: baseline_health_risk",
    "Provide valid instrument candidate with assumptions"
  ],
  "safeFallback": {
    "type": "associational_summary",
    "allowed": true,
    "warning": "Associational results are not causal estimates."
  }
}
```

**Rule:** UI must not display causal numeric headline when `canEstimateNumericEffect=false`.

---

## 6) EvidenceCard Schema Patch (Provenance Complete)

Required fields:
```json
{
  "headlineAnswer": "string",
  "identifiabilityStatus": "identifiable|partially_identifiable|not_identifiable",
  "effectEstimate": {"value": 0.0, "unit": "optional"},
  "uncertaintyInterval": {"low": 0.0, "high": 0.0, "confidence": 0.95},
  "assumptions": ["string"],
  "diagnostics": {
    "overlap": "pass|warn|fail",
    "balance": "pass|warn|fail",
    "sensitivity": "pass|warn|fail"
  },
  "confidenceLabel": "heuristic|identified_estimate|validated",
  "failureModes": ["string"],
  "recommendedNextData": ["string"],

  "provenance": {
    "ingestionId": "string",
    "sourceTableIds": ["string"],
    "dataPointIds": ["string"],
    "computeRunId": "string",
    "methodVersion": "string",
    "graphId": "string",
    "graphVersion": "string",
    "datasetHash": "string"
  }
}
```

---

## 7) Database Migration Contract (DAG Registry + Jobs)

## 7.1 Tables
1. `causal_graphs`
- `id uuid pk`
- `graph_key text` (stable id)
- `version int`
- `name text`
- `description text`
- `assumptions jsonb`
- `nodes jsonb`
- `edges jsonb`
- `provenance_hash text`
- `created_by uuid`
- `created_at timestamptz`
- unique(`graph_key`,`version`)

2. `causal_jobs`
- `id uuid pk`
- `job_type text` (`estimate|simulate`)
- `status text` (`queued|running|done|failed`)
- `request_payload jsonb`
- `result_payload jsonb`
- `error_payload jsonb`
- `compute_run_id text`
- `created_by uuid`
- `created_at timestamptz`
- `updated_at timestamptz`

3. `causal_job_events`
- `id bigserial pk`
- `job_id uuid fk -> causal_jobs.id`
- `stage text`
- `progress int`
- `payload jsonb`
- `created_at timestamptz`

## 7.2 RLS Policies (minimum)
- `SELECT` jobs/graphs only if tenant/user authorized
- `INSERT`/`UPDATE` for graphs restricted to privileged role (`causal_editor`)
- `UPDATE` on jobs/events restricted to service role/compute worker
- No anonymous writes

---

## 8) Execution Model + Timeout Safety
- All heavy compute offloaded to worker queue
- API request returns quickly with `jobId`
- SSE stream emits incremental progress
- Retry policy for transient failures
- Idempotency key support for repeated job submissions

---

## 9) Revised Acceptance Gates
Must pass before Phase 3 implementation starts:
1. Schema + migration approved
2. RLS policies reviewed
3. SSE contracts tested with mocked long-running job
4. UI rendering spec reviewed in component-level doc
5. `not_identifiable` degradation payload integrated end-to-end
6. Provenance-complete EvidenceCard validated in contract tests
7. Deterministic boundary enforced in code ownership/module boundaries

---

## 10) Immediate Ticketization (next step)
Create implementation tickets in this order:
1. DB migrations + RLS
2. Job queue + SSE stream plumbing
3. Identify endpoint hardening
4. Estimate/simulate job workers
5. EvidenceCard schema + renderer integration
6. Degradation UX and safety tests
7. Contract + adversarial CI suite

---

## 11) Re-audit Request Text (for Gemini)
Use this when resubmitting:

> “Patched v1 with Demis/MASA contracts: SSE job streaming for heavy compute, provenance-complete EvidenceCard, explicit `not_identifiable` degradation JSON, DAG registry SQL/RLS contract, and deterministic boundary separating LLM parse from algorithmic causal math. Please re-audit for Phase 3 readiness and remaining blockers.”
