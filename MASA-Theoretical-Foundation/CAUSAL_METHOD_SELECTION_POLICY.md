# Causal Method Selection Policy v1.0
**Title:** Deterministic Method Selection Policy for Causal Discovery and Interventional Inference  
**Date:** 2026-02-11  
**Status:** Implementation-ready specification  
**Workflow Basis:** `/Users/lesz/Documents/Synthetic-Mind/.agent/workflows/Demis-Workflow.md`  
**Related Inputs:**
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/Theoretical Foundations for Autonomous Closed-Loop Scientific Discovery.docx`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/THEORY_TO_CODE_MATRIX.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/POLICY_EVALUATION_SPEC.md`

---

## 1) Executive Summary

This policy defines **how the Automated Scientist chooses causal methods** (`PC`, `FCI`, `GIES`, `ICP`, `do-calculus`) based on observed data regime, intervention availability, confounding risk, and target query.

Primary principle: **method choice must be policy-driven and auditable, never ad hoc.**

The policy introduces:
1. deterministic eligibility gates,
2. method disqualifiers,
3. confidence and identifiability checks,
4. CI-visible benchmark evidence,
5. promotion constraints for method-policy changes.

---

## 2) Goals

1. Prevent incorrect causal claims due to method mismatch.
2. Select the minimally risky method compatible with current assumptions.
3. Make assumption violations explicit in outputs and governance artifacts.
4. Tie method selection quality to measurable benchmark outcomes.

---

## 3) Non-Goals

1. This policy does not implement the algorithms themselves.
2. This policy does not replace SCM promotion governance; it feeds it.
3. This policy does not guarantee identifiability when assumptions are false.

---

## 4) Current-State Baseline (Code Reality)

Current repository foundation includes causal inference and governance primitives:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-disagreement-engine.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-registry.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-promotion-governance.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts`

Gap to close:
- No explicit policy contract currently governs method selection under differing assumptions.

---

## 5) Method Catalog and Role Definitions

## 5.1 Methods in Scope

1. `pc`
- Constraint-based structure learning under causal sufficiency + faithfulness assumptions.

2. `fci`
- Constraint-based discovery allowing latent confounders/selection effects; outputs PAG-level structure.

3. `gies`
- Score-based interventional structure learning using known intervention targets.

4. `icp`
- Invariant causal prediction across environments/interventions.

5. `do_calculus_query`
- Query-level interventional identification and estimation from accepted SCM assumptions.

## 5.2 Policy-level Method Classes

- `structure_discovery`: `pc`, `fci`, `gies`
- `stable_predictor_discovery`: `icp`
- `query_identification`: `do_calculus_query`

---

## 6) Data Regime Contract

File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/causal-method-policy.ts`

```ts
export type DataRegime = {
  observationalRows: number;
  interventionalRows: number;
  interventionTargetsKnown: boolean;
  numEnvironments: number;
  latentConfoundingRisk: "low" | "medium" | "high";
  selectionBiasRisk: "low" | "medium" | "high";
  variableCount: number;
  sparsityEstimate: number;
  faithfulnessRisk: "low" | "medium" | "high";
  missingnessRate: number;
};

export type QueryIntent =
  | "discover_structure"
  | "estimate_intervention_effect"
  | "find_invariant_predictors"
  | "adjudicate_model_disagreement";
```

Minimum required diagnostics before method selection:
- sample size profile (obs vs interventional)
- intervention target metadata completeness
- confounding risk score
- environment count
- missingness profile

---

## 7) Deterministic Method Selection Rules

## 7.1 Top-Level Routing

1. If `QueryIntent = estimate_intervention_effect` and a validated SCM exists -> route to `do_calculus_query` first.
2. Else if `interventionalRows > 0` and `interventionTargetsKnown=true` -> route candidate set includes `gies`.
3. Else if `latentConfoundingRisk=high` or `selectionBiasRisk=high` -> route candidate set includes `fci` and excludes `pc` from primary position.
4. Else if `numEnvironments >= 2` and target is stable predictor inference -> include `icp`.
5. Else default discovery route -> `pc` primary + `fci` shadow check.

## 7.2 Priority Ordering (default)

- `estimate_intervention_effect`: `do_calculus_query` > `gies` > `fci`
- `discover_structure` with interventions: `gies` > `fci` > `pc`
- `discover_structure` observational-only: `fci` (if confounding risk medium/high) else `pc`
- `find_invariant_predictors`: `icp` > `fci`

---

## 8) Method Eligibility and Disqualifiers

## 8.1 `pc`
Eligible when:
- `interventionalRows` can be zero,
- latent confounding risk not high,
- faithfulness risk not high.

Disqualify when:
- latent confounding risk high,
- strong selection bias unresolved,
- CI tests unstable across bootstrap runs.

## 8.2 `fci`
Eligible when:
- latent confounding or selection bias is plausible,
- observational data available with sufficient CI test power.

Disqualify when:
- sample size too low for stable conditional independence testing.

## 8.3 `gies`
Eligible when:
- interventional data exists,
- intervention targets are known and encoded.

Disqualify when:
- intervention target metadata incomplete,
- target logs inconsistent across runs.

## 8.4 `icp`
Eligible when:
- at least 2 meaningful environments/intervention regimes,
- predictor invariance objective is explicit.

Disqualify when:
- environments are pseudo-duplicates,
- shifts are too weak to identify invariant sets.

## 8.5 `do_calculus_query`
Eligible when:
- query intent is explicit intervention effect,
- SCM assumptions for adjustment/identification are documented.

Disqualify when:
- required graph assumptions missing or contradicted,
- identifiability cannot be established.

---

## 9) Selection Output Contract

Every selection must emit a machine-readable record.

File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/causal-method-selection-report.json`

Required fields:
- `selection_id`
- `timestamp`
- `query_intent`
- `selected_method`
- `candidate_methods`
- `eligibility_checks[]`
- `disqualifiers[]`
- `assumptions_declared[]`
- `identifiability_status`: `identified | partially_identified | not_identified`
- `confidence_score` (0-1)
- `fallback_method` (if any)

---

## 10) Confidence and Identifiability Gates

## 10.1 Confidence Score Composition

`confidence_score` is computed from:
- data sufficiency,
- assumption compliance,
- bootstrap stability,
- cross-method agreement (where applicable).

## 10.2 Hard Gates

Block causal claim promotion if any:
1. `identifiability_status = not_identified`
2. required assumptions unresolved
3. method disqualified but still selected
4. selection report missing required fields

## 10.3 Soft Warnings

Warn (do not block) when:
- confidence score between `0.50` and `0.70`
- `pc` and `fci` disagree materially but claim severity not critical

---

## 11) Benchmark and Evaluation Contract

## 11.1 Benchmark Runner
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-causal-method-selection.ts`

Command:
```bash
npm run governance:causal-method-eval -- \
  --scenarioPack docs/governance/causal-method-scenarios.v1.json \
  --runs 100 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

## 11.2 Scenario Families (v1)

1. observational, low confounding
2. observational, high latent confounding
3. interventional with known targets
4. interventional with partial target metadata
5. multi-environment invariance scenario
6. non-identifiable query scenario

## 11.3 Core Metrics

1. `method_selection_accuracy` (against scenario oracle policy)
2. `false_identifiability_rate`
3. `disqualified_selection_rate`
4. `cross_method_disagreement_rate`
5. `runtime_cost_ms`

## 11.4 Enforce Thresholds

Fail enforce mode when:
- `false_identifiability_rate > 0.01`
- `disqualified_selection_rate > 0`
- selection report schema invalid

---

## 12) CI Integration Contract

Workflow target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/causal-method-policy-sentinel.yml`

Triggers:
- `pull_request`
- `push` to `main`
- nightly `schedule`
- `workflow_dispatch`

Rollout:
- Week 1: report-only
- Week 2: enforce on PR
- Week 3+: enforce on PR and main

Independence rule:
- This workflow is independent from M6 health and claim-drift checks.

---

## 13) Promotion and Change Governance

## 13.1 Policy Change Ledger
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/causal-method-policy-ledger.json`

Required fields:
- `change_id`
- `baseline_policy_version`
- `candidate_policy_version`
- `benchmark_snapshot`
- `decision`: `promote | reject | hold`
- `approved_by`
- `created_at`

## 13.2 Promotion Rule

Promote candidate policy only if:
1. no hard gate failures,
2. no increase in false identifiability,
3. method selection accuracy non-decreasing,
4. CODEOWNERS approval on critical policy changes.

---

## 14) Overrides and TTL

File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/causal-method-overrides.json`

Override record must include:
- `override_id`
- `ticket`
- `reason`
- `approved_by`
- `created_at`
- `expires_at`
- `suppressed_gate_ids[]`

Rules:
- max TTL: 14 days
- expired overrides ignored automatically
- no silent bypasses

---

## 15) Test Plan

1. Unit tests
- eligibility and disqualifier logic per method.

2. Property tests
- deterministic selection reproducibility under fixed seed/input.

3. Schema tests
- selection report JSON schema validation.

4. Regression tests
- known confounding scenarios must not route to invalid primary method.

5. CI mode tests
- report vs enforce behavior.

---

## 16) Acceptance Criteria

1. Deterministic method policy returns valid method for all v1 scenarios.
2. Selection report emitted for every run.
3. Enforce mode blocks disqualified/invalid selections.
4. Benchmark artifacts generated and retained.
5. Policy changes are auditable via ledger records.

---

## 17) Critical Gaps / User Actions Required

1. **User action required:** assign CODEOWNERS for causal policy files.
2. **User action required:** confirm preferred default method order for your primary domain.
3. **User action required:** approve benchmark scenario oracle definitions.

---

## 18) Assumptions and Defaults

1. Default discovery fallback: `fci` when confounding risk is medium/high.
2. Default query policy: `do_calculus_query` for intervention effect queries.
3. Scenario source v1: simulator + curated synthetic datasets.
4. Timeline anchor: 2026-02-11.

---

## 19) Immediate Implementation Tasks

1. Add `src/types/causal-method-policy.ts`.
2. Add `scripts/evaluate-causal-method-selection.ts`.
3. Add `docs/governance/causal-method-scenarios.v1.json`.
4. Add `docs/governance/causal-method-policy-ledger.json`.
5. Add `docs/governance/causal-method-overrides.json`.
6. Add workflow `causal-method-policy-sentinel.yml`.
7. Add npm script `governance:causal-method-eval`.
8. Add tests for eligibility/disqualifier/enforce gates.

