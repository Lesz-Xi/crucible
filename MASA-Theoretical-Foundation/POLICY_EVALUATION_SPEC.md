# Policy Evaluation Spec v1.0
**Title:** Experiment Policy Evaluation and Promotion Contract for Automated Scientist  
**Date:** 2026-02-11  
**Status:** Implementation-ready specification  
**Workflow Basis:** `/Users/lesz/Documents/Synthetic-Mind/.agent/workflows/Demis-Workflow.md`  
**Related Inputs:**
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/Theoretical Foundations for Autonomous Closed-Loop Scientific Discovery.docx`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/THEORY_TO_CODE_MATRIX.md`

---

## 1) Executive Summary

This spec defines the **policy layer** that chooses the next experiment in the closed-loop Automated Scientist and governs promotion of policy behavior from experimental to trusted runtime.

The design converts deep research theory (EIG, BO, Active Inference, uncertainty-aware exploration, safety constraints) into an auditable, benchmarked, deterministic governance contract.

Primary principle: **no policy is promoted by narrative quality; promotion requires measured scientific utility under controlled benchmarks.**

---

## 2) Goals

1. Standardize experiment-selection policies under one runtime interface.
2. Compare policy families on identical scenarios with reproducible metrics.
3. Enforce safety, identifiability, and uncertainty constraints before policy promotion.
4. Provide CI-visible evidence that policy behavior improves scientific outcomes.

---

## 3) Non-Goals

1. This spec does not implement physical lab adapters directly.
2. This spec does not define symbolic-regression internals (covered by law-discovery spec).
3. This spec does not replace SCM integrity gates; it extends them for experiment choice.

---

## 4) Current-State Baseline (Code Reality)

The repository currently has strong SCM/governance primitives but no formal policy-evaluation contract:

- Available foundations:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-registry.ts`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-promotion-governance.ts`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scientific-integrity-service.ts`
- Available governance workflows:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-closeout-tracker.yml`

Gap to close: policy comparison and promotion are not yet first-class benchmark-governed artifacts.

---

## 5) Policy Interface Contract

## 5.1 New Type Contract
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/policy-evaluation.ts`

```ts
export type PolicyId = "eig" | "bo_ucb" | "bo_ts" | "efe";

export interface PolicyContext {
  sessionId: string;
  domain: string;
  budgetRemaining: {
    experiments: number;
    costUsd: number;
    wallClockMinutes: number;
  };
  candidateInterventions: InterventionCandidate[];
  uncertaintyState: UncertaintySnapshot;
  safetyConstraints: SafetyConstraint[];
  identifiabilityConstraints: IdentifiabilityConstraint[];
  objectiveSpec: ObjectiveSpec;
}

export interface PolicyDecision {
  policyId: PolicyId;
  selectedInterventionId: string;
  score: number;
  rankedAlternatives: Array<{ interventionId: string; score: number }>;
  rationale: {
    primaryMetric: string;
    uncertaintySignal: number;
    safetyGatePassed: boolean;
    identifiabilityGatePassed: boolean;
  };
  reproducibility: {
    seed?: number;
    stochastic: boolean;
    modelVersion: string;
    inputHash: string;
  };
}

export interface ExperimentPolicy {
  id: PolicyId;
  evaluate(context: PolicyContext): Promise<PolicyDecision>;
}
```

## 5.2 Determinism Rule
- Policies must emit `reproducibility.inputHash` for every decision.
- Stochastic policies must emit `seed`.
- Same input hash + seed must reproduce identical ranked order.

---

## 6) Policy Families (Required v1)

1. `eig`
- Objective: maximize expected information gain.
- Target use: structure-learning and uncertainty reduction phases.

2. `bo_ucb`
- Objective: maximize upper confidence bound.
- Target use: constrained optimization with explicit exploration coefficient.

3. `bo_ts`
- Objective: Thompson sampling over posterior/surrogate.
- Target use: robust exploration under model uncertainty.

4. `efe`
- Objective: minimize expected free energy (risk + epistemic value).
- Target use: preference-aware exploration when utility + uncertainty tradeoff must be explicit.

---

## 7) Evaluation Scenario Contract

## 7.1 Scenario Definition
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/policy-eval-scenarios.v1.json`

Minimum required scenario fields:
- `scenario_id`
- `domain`
- `ground_truth_mode`: `simulator` or `historical_replay`
- `candidate_interventions[]`
- `safety_constraints[]`
- `identifiability_constraints[]`
- `objective_spec`
- `budget`
- `expected_failure_modes[]`

## 7.2 Required Scenario Packs (v1)
1. Low-noise identifiable SCM scenario
2. Latent confounder stress scenario
3. Safety-constrained intervention scenario
4. Multi-fidelity budget scenario
5. Drifted-observation scenario

---

## 8) Metrics Contract

## 8.1 Primary Promotion Metrics

1. `scientific_yield`
- Definition: validated high-value findings per 10 experiments.

2. `information_gain_per_step`
- Definition: posterior uncertainty reduction normalized per experiment.

3. `regret_normalized`
- Definition: policy regret relative to scenario oracle/best-known baseline.

4. `falsification_efficiency`
- Definition: rate at which weak hypotheses are invalidated early.

5. `safety_violation_rate`
- Definition: proportion of selected interventions that violate safety constraints.

6. `identifiability_violation_rate`
- Definition: proportion of decisions that violate identifiability requirements.

7. `calibration_error`
- Definition: mismatch between predicted confidence and empirical outcome reliability.

## 8.2 Hard Gates

Policy is **auto-blocked** if any of the following occurs:
- `safety_violation_rate > 0`
- `identifiability_violation_rate > 0.02`
- missing reproducibility metadata (`inputHash`; and `seed` for stochastic)

---

## 9) Benchmark Runner Contract

## 9.1 CLI
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-experiment-policies.ts`

Command:
```bash
npm run governance:policy-eval -- \
  --policy eig,bo_ucb,bo_ts,efe \
  --scenarioPack docs/governance/policy-eval-scenarios.v1.json \
  --runs 50 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

## 9.2 Outputs
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/policy-eval-report.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/policy-eval-report.md`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/policy-eval-trend.csv`

## 9.3 Exit Codes
- `0`: no blocking policy violations
- `2`: blocking policy failure
- `3`: invalid scenario/contract
- `4`: runtime evaluation error

---

## 10) CI Workflow Contract

Workflow target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/policy-eval-sentinel.yml`

Triggers:
- `pull_request`
- `push` to `main`
- `workflow_dispatch`
- nightly `schedule`

Rollout:
- Week 1: report-only
- Week 2: enforce on `pull_request`
- Week 3+: enforce on `pull_request` and `main`

Independence rule:
- Policy eval must not depend on M6 health workflow completion.
- Policy eval status is independent and additive.

---

## 11) Promotion Governance Contract

## 11.1 Promotion Decision Record
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/policy-promotion-ledger.json`

Record fields:
- `promotion_id`
- `candidate_policy_version`
- `baseline_policy_version`
- `scenario_pack_version`
- `metrics_snapshot`
- `blocking_checks`
- `decision`: `promote | reject | hold`
- `approved_by`
- `created_at`

## 11.2 Promotion Rule
Promote candidate only if:
1. Hard gates all pass.
2. Candidate beats baseline on at least 2 of 3 core utility metrics:
- `scientific_yield`
- `information_gain_per_step`
- `regret_normalized`
3. No degradation >5% on safety/calibration metrics.

---

## 12) Overrides and Expiry

File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/policy-eval-overrides.json`

Required fields:
- `override_id`
- `policy_id`
- `ticket`
- `reason`
- `approved_by`
- `created_at`
- `expires_at`

TTL rule:
- maximum 14 days
- expired overrides are ignored

---

## 13) Test Plan

1. Interface tests
- Policy implementations satisfy `ExperimentPolicy` contract.

2. Determinism tests
- Same input hash + seed returns identical decision ordering.

3. Metric correctness tests
- Synthetic fixtures verify metric formulas and normalization.

4. Gate tests
- Intentional safety violation must fail enforce mode.

5. Rollout tests
- report/enforce mode transitions behave as configured.

6. Artifact tests
- JSON/MD/CSV outputs are generated and parseable.

---

## 14) Acceptance Criteria

1. Policy evaluation runner executes all required policy families on v1 scenario pack.
2. Artifacts are produced on every CI run.
3. Enforce mode blocks policy candidates violating hard gates.
4. Promotion records are machine-readable and auditable.
5. Policy evaluation remains deterministic under fixed seed/input hash.

---

## 15) Critical Gaps / User Actions Required

1. **User action required:** confirm benchmark environment variables for CI runners.
2. **User action required:** designate CODEOWNERS approvers for policy promotion and overrides.
3. **User action required:** decide initial production baseline policy (`eig` recommended).

---

## 16) Assumptions and Defaults

1. Initial policy baseline: `eig`.
2. Enforcement target: block unsafe or non-identifiable policy behavior.
3. Scenario source v1: simulator + controlled replay only.
4. Timeline anchor: 2026-02-11.

---

## 17) Immediate Implementation Tasks

1. Add `src/types/policy-evaluation.ts`.
2. Add `scripts/evaluate-experiment-policies.ts`.
3. Add `docs/governance/policy-eval-scenarios.v1.json`.
4. Add `docs/governance/policy-promotion-ledger.json`.
5. Add `docs/governance/policy-eval-overrides.json`.
6. Add workflow `policy-eval-sentinel.yml`.
7. Add npm script `governance:policy-eval`.
8. Add tests for determinism, metrics, and enforcement gates.

