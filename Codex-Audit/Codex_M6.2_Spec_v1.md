<proposed_plan>
# M6.2 Spec v1: Deterministic Trace Integrity Sentinel

## Summary
Implement a runtime provenance governance layer that validates whether causal/runtime traces are trustworthy and policy-compliant.  
M6.2 extends M6.1 static integrity into execution integrity by checking trace completeness, method-policy alignment, and deterministic/stochastic metadata requirements.

## Problem Statement
M6.1 proves code and claims align at source level.  
M6.2 must prove runtime outputs do not violate scientific integrity contracts (missing trace IDs, unsupported methods, missing reproducibility metadata).

## Scope

### In Scope
1. Trace integrity policy contract.
2. Trace validator CLI and report artifacts.
3. CI workflow for synthetic fixture validation.
4. Nightly optional real-trace sampling gate (read-only).
5. Ownership, escalation, and override policy integration.

### Out of Scope
1. Bitwise replay reproducibility (deferred to M6.3).
2. Online mutation of production traces.
3. Full benchmark orchestration redesign.

---

## Decisions (Locked)

## 1) Determinism Definition
Use **Weak+ determinism** for M6.2:
- Deterministic claim paths must use deterministic computation methods.
- Stochastic methods are allowed only where policy permits and must include reproducibility metadata (`seed`, `model_version`, `input_hash`, `trace_id`).
- No bitwise replay requirement in this phase.

## 2) Trace Source Strategy
Use **Hybrid source model**:
- PR/push CI: synthetic fixture traces only (stable, deterministic, no external dependency).
- Nightly schedule: synthetic fixtures + optional Supabase sampling (read-only), enabled only if credentials exist.

## 3) Failure Semantics
- **Critical invariants**: fail immediately on any violation.
- **Aggregate quality**: fail if invalid-rate > 5% of evaluated traces.
- Report-only mode supported for rollout and diagnostics.

## 4) Mandatory Schema Fields
Required on every trace:
- `trace_id`
- `created_at`
- `computation_method`
- `claim_type`
- `model_key`
- `model_version`
- `input_hash`

Conditionally required:
- `seed` when `computation_method` is stochastic.

---

## Policy Contract

## File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-integrity-policy.json`

## Core Sections
1. `schema_version`
2. `deterministic_methods` allowlist
3. `stochastic_methods` allowlist
4. `claim_type_requirements` map:
- claim type -> allowed methods + required determinism class
5. `critical_invariants`
6. `aggregate_thresholds`
7. `override_rules` (TTL, approver requirements)

---

## Data and Interfaces

## 1) Trace Integrity Schema
### File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-integrity.schema.json`

### Record shape
- `trace_id: string`
- `created_at: string (date-time)`
- `computation_method: string`
- `claim_type: string`
- `model_key: string`
- `model_version: string`
- `input_hash: string`
- `seed?: string | number`
- `metadata?: object`

## 2) Fixture Dataset
### File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-fixtures.json`
Includes:
- valid deterministic trace examples
- valid stochastic trace examples
- intentionally invalid traces for regression tests

---

## CLI Design

## File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/scan-trace-integrity.ts`

## Command
- `npm run governance:trace-integrity -- --mode report|enforce --source fixture|supabase|hybrid --strict critical`

## Outputs
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-report.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-report.md`

## Exit Codes
- `0`: no blocking violation
- `2`: blocking violation(s)
- `3`: policy/schema/config invalid
- `4`: runtime execution error (query/parsing)

## Performance Budget
- `<30s` for 200 traces on CI baseline.

---

## Violation Model

## Violation Levels
1. `critical`
- missing `trace_id`
- missing mandatory schema fields
- method not allowed for claim type
- stochastic method missing `seed`
2. `high`
- stale or malformed metadata fields
- unknown claim_type
3. `medium/low`
- non-blocking quality signals

## Drift States per Trace
- `valid`
- `invalid_critical`
- `invalid_noncritical`

---

## CI Workflow Design

## File
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/trace-integrity-sentinel.yml`

## Triggers
- `pull_request`
- `push` on `main`
- nightly `schedule`
- `workflow_dispatch`

## Modes by trigger
- PR/push: `source=fixture`
- nightly: `source=hybrid` (fallback to fixture when Supabase unavailable)

## Interaction with existing workflows
- Independent from:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`
- Failure matrix:
1. trace fails, others pass -> runtime provenance block
2. trace passes, claim drift fails -> static governance block
3. both fail -> independent blocks
4. all pass -> healthy

---

## Rollout Plan

### Week 1
- Report-only for PR/main/nightly.
- Tune policy and fixture coverage.

### Week 2
- Enforce critical on PR only.

### Week 3+
- Enforce critical on PR + main.
- Nightly enforce with optional Supabase sampling.

---

## Ownership and Overrides

## Files
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-ownership-matrix.md`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-overrides.json`

## Rules
- Critical overrides require CODEOWNERS approval.
- Max TTL 14 days.
- Expired overrides ignored.

---

## Implementation Work Breakdown

1. Add policy + schema + fixtures.
2. Implement trace scanner CLI.
3. Add markdown/json report generation.
4. Add npm script:
- `governance:trace-integrity`
5. Add trace sentinel CI workflow with staged rollout.
6. Add ownership and override docs.
7. Add regression tests for invalid/valid fixtures.
8. Validate independence from M6 health and claim-drift workflows.

---

## Important Public Interfaces / Types
1. New governance schema contracts:
- `trace-integrity.schema.json`
- `trace-integrity-policy.json`
2. New CLI contract:
- `scan-trace-integrity.ts` command and exit semantics
3. No runtime API endpoint contract changes in v1.

---

## Test Cases and Scenarios

1. Valid deterministic trace passes.
2. Stochastic trace with required metadata passes when claim type allows.
3. Missing `trace_id` fails critical.
4. Claim type requiring deterministic method fails when stochastic used.
5. Aggregate invalid-rate 6% fails threshold.
6. Valid override suppresses one critical violation until expiry.
7. Expired override does not suppress.
8. Nightly run with missing Supabase credentials falls back to fixtures and reports fallback mode.

---

## Acceptance Criteria

1. CLI validates fixture set deterministically with reproducible results.
2. Critical violations block in enforce mode.
3. Aggregate threshold gate works (>5% invalid fails).
4. CI workflow publishes artifacts on every run.
5. Rollout stages are configurable and honored.
6. Performance budget met (<30s for 200 traces).
7. Workflow remains independent from M6 health and claim-drift checks.

---

## Assumptions and Defaults

1. M6.2 determinism model is Weak+ (not bitwise replay).
2. Supabase sampling is optional and read-only in nightly mode.
3. Critical enforcement target remains “block on critical”.
4. Timeline anchor for this spec: February 6, 2026.
</proposed_plan>