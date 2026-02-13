# M6.2 Spec v2: Deterministic Trace Integrity Sentinel

## 1) Executive Summary
Status: **Implementation-ready**

This spec defines M6.2 as the runtime governance layer that verifies trace integrity for causal/scientific outputs. It extends M6.1 (static claim drift) into execution integrity by validating trace schema completeness, method policy compliance, and reproducibility metadata quality.

This v2 resolves all critical gaps identified in:
- `/Users/lesz/Documents/Synthetic-Mind/Codex-Audit/Claude_Audit_M6.2_v2.md`

## 2) Goals
1. Detect and block runtime integrity violations in enforce mode.
2. Preserve development velocity via phased rollout and explicit fallback behavior.
3. Keep sentinel operation deterministic, reproducible, and auditable.
4. Maintain workflow independence from M6 health and claim-drift sentinels.

## 3) Scope
### In scope
- Trace integrity policy and schema contracts.
- Fixture generation and fixture lifecycle ownership.
- Trace integrity scanner CLI with report/enforce/dry-run/verbose modes.
- CI workflow with staged rollout and hybrid source model.
- Override schema with pattern-based suppression and TTL enforcement.
- Trend artifact output and retention model.

### Out of scope
- Bitwise replay reproducibility (reserved for M6.3).
- Runtime mutation/backfill of production traces.
- Replacing existing M6 health or claim drift governance gates.

## 4) Determinism Definition (Locked)
M6.2 uses **Weak+ determinism**.

- Deterministic claim classes must use deterministic methods.
- Stochastic methods are allowed only for configured claim classes and require reproducibility metadata.
- Bitwise-identical replay is not required in M6.2.

### Deterministic vs stochastic classification
- Deterministic methods: methods with no random sampling at inference time.
- Stochastic methods: methods with randomized search/sampling (for example MCTS, Monte Carlo, temperature sampling).

## 5) Failure Semantics (Corrected)
### 5.1 Critical invariants
In `--mode enforce`, fail if **any** critical invariant violation exists.

Critical invariants include:
- missing `trace_id`
- missing mandatory core fields
- method disallowed for claim type
- stochastic method missing required `seed` (where seed is required)

### 5.2 Aggregate quality threshold
Aggregate threshold applies to **non-critical** violations only.

- Compute: `non_critical_invalid_rate = non_critical_invalid_count / total_evaluated_traces`
- Fail if `non_critical_invalid_rate > 0.05`
- Aggregate threshold is evaluated after critical checks complete.

### 5.3 Report mode
In `--mode report`, never fail; emit all violations and rates in artifacts.

## 6) Trace Source Strategy (Locked)
### PR and push (`pull_request`, `push`)
- Source: `fixture`
- No external dependency required.

### Nightly (`schedule`)
- Source: `hybrid`
- Attempt Supabase sampling first.
- Fallback to fixtures when Supabase is unavailable or query fails.

### Workflow dispatch
- Default: `fixture`
- Optional override: `--source hybrid`.

## 7) Supabase Query Specification (Resolved)
### Table
- `counterfactual_traces`

### Query
```sql
SELECT
  trace_id,
  created_at,
  computation_method,
  claim_type,
  model_key,
  model_version,
  input_hash,
  seed,
  metadata
FROM counterfactual_traces
ORDER BY created_at DESC
LIMIT 100;
```

### Access
- Env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Access mode: read-only query usage in sentinel logic.

### Timeouts and fallback
- Query timeout target: 10s.
- On timeout/auth/query failure: log warning + fallback to fixture source.
- Fallback mode is included in report metadata.

## 8) Schema Contract
## 8.1 File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-integrity.schema.json`

## 8.2 Mandatory fields
Required on each trace record:
- `trace_id`
- `created_at`
- `computation_method`
- `claim_type`
- `model_key`
- `model_version`
- `input_hash` (transition policy below)

Conditional required:
- `seed` when `computation_method` is stochastic and claim policy requires seeded stochastic runs.

## 8.3 `input_hash` definition (Resolved)
- Purpose: stable fingerprint of causal input payload used to generate trace.
- Computation: `SHA256(JSON.stringify(sortKeys(input_payload)))`
- Encoding: lowercase hex string.

### Transition policy
- Week 1-2: missing `input_hash` => `high` (non-blocking by aggregate policy)
- Week 3+: missing `input_hash` => `critical` (blocking)

## 9) Policy Contract
## 9.1 File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-integrity-policy.json`

## 9.2 Required keys
- `schema_version`
- `deterministic_methods`
- `stochastic_methods`
- `claim_type_requirements`
- `critical_invariants`
- `aggregate_thresholds`
- `override_rules`

## 9.3 Canonical example
```json
{
  "schema_version": "1.0.0",
  "deterministic_methods": ["exact_solver", "dag_walk", "deterministic_graph_diff"],
  "stochastic_methods": ["mcts", "monte_carlo", "llm_generation"],
  "claim_type_requirements": {
    "causal_intervention": {
      "allowed_methods": ["exact_solver", "dag_walk", "deterministic_graph_diff"],
      "determinism_class": "deterministic",
      "seed_required": false
    },
    "hypothesis_generation": {
      "allowed_methods": ["mcts", "llm_generation"],
      "determinism_class": "stochastic",
      "seed_required": true
    }
  },
  "critical_invariants": [
    "trace_id_present",
    "core_fields_present",
    "method_allowed_for_claim_type",
    "seed_present_when_required"
  ],
  "aggregate_thresholds": {
    "non_critical_invalid_rate_max": 0.05
  },
  "override_rules": {
    "critical_ttl_days_max": 14,
    "approved_by_required": true,
    "allowed_approvers": ["@Lesz-Xi"]
  }
}
```

## 10) Fixture Generation Strategy (Resolved)
## 10.1 Files
- Seed fixture file:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-fixtures.v1.json`
- Generation script:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/generate-trace-fixtures.ts`

## 10.2 Initial seed plan
- Export 20 recent traces from Supabase where available.
- Build fixture set:
  - 10 valid traces
  - 10 intentionally broken traces covering each critical invariant and non-critical categories

## 10.3 Ownership and maintenance
- Owner: `@Lesz-Xi`
- Maintenance cadence: monthly or on schema/policy change
- Versioning rule: bump `trace-fixtures.vN.json` on breaking schema updates

## 11) Override Contract (Resolved)
## 11.1 File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-overrides.json`

## 11.2 Schema
```json
{
  "schema_version": "1.0.0",
  "overrides": [
    {
      "override_id": "TRC-OVR-001",
      "trace_pattern": {
        "claim_type": "hypothesis_generation"
      },
      "suppressed_violations": ["missing_seed"],
      "reason": "Legacy traces before seeded stochastic policy",
      "approved_by": "@Lesz-Xi",
      "created_at": "2026-02-06T00:00:00Z",
      "expires_at": "2026-02-20T00:00:00Z"
    }
  ]
}
```

## 11.3 Matching logic
Override applies when:
1. current time <= `expires_at`
2. trace matches all key/value pairs in `trace_pattern`
3. violation code is listed in `suppressed_violations`

Expired overrides are ignored.

## 12) CLI Contract
## 12.1 Scanner script
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/scan-trace-integrity.ts`

## 12.2 Command
```bash
npm run governance:trace-integrity -- --mode report|enforce --source fixture|supabase|hybrid --strict critical --dry-run --verbose
```

## 12.3 Flags
- `--mode`: `report | enforce`
- `--source`: `fixture | supabase | hybrid`
- `--strict`: severity threshold (`critical` for v1)
- `--dry-run`: validate policy/schema/fixtures only; do not evaluate trace records
- `--verbose`: emit per-trace diagnostics

## 12.4 Outputs
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-report.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-report.md`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-trend.csv`

## 12.5 Exit codes
- `0`: no blocking violations
- `2`: blocking violations
- `3`: invalid policy/schema/config
- `4`: runtime execution error

## 13) CI Workflow
## 13.1 File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/trace-integrity-sentinel.yml`

## 13.2 Trigger set
- `pull_request`
- `push` on `main`
- `schedule`
- `workflow_dispatch`

## 13.3 Rollout control
- env var: `ROLLOUT_STAGE=week1|week2|week3`
- stage behavior:
  - week1: report-only all triggers
  - week2: enforce on PR only, report elsewhere
  - week3: enforce on PR + main + nightly

## 13.4 Workflow independence
No job dependency on:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`

## 14) Trend Artifact Design
## 14.1 File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-trend.csv`

## 14.2 CSV schema
- `timestamp,total_traces,valid_traces,invalid_traces,non_critical_invalid_rate,critical_violations,high_violations,fallback_mode`

## 14.3 Retention
- Maintain last 90 daily entries.
- On PR runs, trend artifact is generated for run-local reporting only.

## 15) Performance Budget (Clarified)
- Scanner evaluation time: `<30s` for 200 traces (excluding Supabase query)
- Supabase query timeout: `<10s`
- End-to-end CI step budget: `<60s`

## 16) Zero-Trace Handling (Resolved)
Scenario: no fixture traces loaded and Supabase returns no rows.

Behavior:
- Exit code `0`
- Report warning: `No traces available for validation`
- Mark run as `fallback_mode=true` and `total_traces=0`
- Do not treat absence of traces as governance violation.

## 17) Implementation Plan
1. Add `trace-integrity.schema.json`.
2. Add `trace-integrity-policy.json` with canonical defaults.
3. Add `trace-overrides.json` schema-compatible seed.
4. Implement `generate-trace-fixtures.ts` and seed `trace-fixtures.v1.json`.
5. Implement `scan-trace-integrity.ts` with report/enforce/dry-run/verbose modes.
6. Add trend CSV writer and retention logic.
7. Add npm scripts:
   - `governance:trace-integrity`
   - `governance:trace-fixtures:generate`
   - `governance:trace-migrate`
8. Add CI workflow `trace-integrity-sentinel.yml` with stage gate.
9. Add tests for critical/non-critical/override/zero-trace/timeout behavior.
10. Run governance exercise PR: inject critical runtime trace violation and verify block/recovery.

## 18) Test Matrix
1. Valid deterministic trace -> pass.
2. Deterministic-required claim with stochastic method -> critical fail.
3. Stochastic allowed claim missing `seed` -> critical fail.
4. Missing `trace_id` -> critical fail.
5. Missing `input_hash` in week1-2 -> high severity only.
6. Missing `input_hash` in week3 -> critical fail.
7. Non-critical invalid rate >5% -> fail.
8. Valid override suppresses targeted violation until expiry.
9. Expired override no longer suppresses.
10. Supabase timeout -> fallback to fixtures, run continues.
11. Zero traces -> exit 0 with warning.

## 19) Acceptance Criteria
1. All six critical gaps from Claude audit are resolved in implementation.
2. CLI supports report/enforce/dry-run/verbose and emits required artifacts.
3. Policy and schema files include concrete executable examples.
4. Fixture generation process exists and is runnable.
5. Supabase sampling query is implemented exactly as specified with timeout fallback.
6. Rollout behavior matches week1/week2/week3 rules.
7. Trend artifact is produced with defined schema.
8. M6 health and claim-drift workflows remain independent.

## 20) Critical Gaps / User Actions Required
1. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available for nightly hybrid mode.
2. Confirm CODEOWNERS approvers for trace override governance.
3. Confirm branch protection should include `Trace Integrity Scan` once week2+ enforcement is enabled.

## 21) Assumptions and Defaults
1. Weak+ determinism is acceptable for M6.2.
2. Weekly rollout starts at week1 unless explicitly advanced.
3. `@Lesz-Xi` is the initial owner and approver for trace overrides.
4. Timeline anchor: February 6, 2026.
