# Uncertainty Calibration Gates v1.0
**Title:** Epistemic Uncertainty Calibration and CI Gating Spec for Automated Scientist  
**Date:** 2026-02-11  
**Status:** Implementation-ready specification  
**Workflow Basis:** `/Users/lesz/Documents/Synthetic-Mind/.agent/workflows/Demis-Workflow.md`  
**Related Inputs:**
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/Theoretical Foundations for Autonomous Closed-Loop Scientific Discovery.docx`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/THEORY_TO_CODE_MATRIX.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/POLICY_EVALUATION_SPEC.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/CAUSAL_METHOD_SELECTION_POLICY.md`

---

## 1) Executive Summary

This spec defines how the Automated Scientist measures and governs uncertainty quality before promoting models, policies, and scientific claims.

Primary principle: **high confidence is not valid unless calibration evidence supports it.**

The spec introduces deterministic calibration contracts, OOD behavior gates, confidence-reporting rules, and CI enforcement rollout.

---

## 2) Goals

1. Quantify calibration quality for predictive and causal outputs.
2. Detect overconfidence and confidence laundering across runtime surfaces.
3. Enforce uncertainty quality thresholds in CI before promotion.
4. Standardize uncertainty metadata across API responses and artifacts.

---

## 3) Non-Goals

1. This spec does not pick a single uncertainty estimator family.
2. This spec does not replace SCM or claim-drift governance; it augments them.
3. This spec does not define symbolic-regression law validation details.

---

## 4) Current-State Baseline (Code Reality)

Current foundations in repo:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scientific-integrity-service.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-promotion-governance.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`

Current gap:
- No dedicated uncertainty calibration benchmark + CI gate contract.

---

## 5) Uncertainty Contract

## 5.1 Core Schema
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/uncertainty-calibration.ts`

```ts
export type UncertaintyClass = "aleatoric" | "epistemic" | "total";

export interface UncertaintyEstimate {
  class: UncertaintyClass;
  value: number; // normalized 0..1
  method: "gp_posterior" | "ensemble" | "mc_dropout" | "evidential" | "other";
  calibrated: boolean;
  calibrationVersion: string;
}

export interface ConfidenceReport {
  traceId: string;
  predictionTarget: string;
  predictedScore: number;
  confidence: number; // 0..1
  uncertainty: UncertaintyEstimate[];
  oodScore: number; // 0..1
  calibration: {
    ece: number;
    brier: number;
    nll?: number;
    reliabilityBinCount: number;
  };
  reproducibility: {
    seed?: number;
    inputHash: string;
    modelVersion: string;
  };
}
```

## 5.2 Required Runtime Fields
Every confidence-bearing output must include:
- `confidence`
- `oodScore`
- `uncertainty.class=epistemic` estimate
- calibration metadata version

No confidence field may be emitted without corresponding uncertainty metadata.

---

## 6) Calibration Metrics and Definitions

## 6.1 Required Metrics

1. `ECE` (Expected Calibration Error)
- Measures mismatch between confidence and empirical correctness.

2. `Brier Score`
- Measures probabilistic forecast quality.

3. `NLL` (optional but recommended)
- Penalizes overconfident wrong predictions.

4. `OOD Confidence Risk`
- Mean confidence on out-of-distribution samples.

5. `Coverage@Tau`
- Interval/credible coverage against target confidence thresholds.

## 6.2 Segment Reporting (mandatory)
Metrics must be reported per:
- in-distribution (ID)
- out-of-distribution (OOD)
- high-impact scientific claims (critical severity class)

---

## 7) Gate Policy

## 7.1 Hard Gates (enforce mode)
Fail CI if any condition true:
1. `ECE_ID > 0.05`
2. `ECE_OOD > 0.10`
3. `OOD confidence risk > 0.35`
4. Missing uncertainty metadata on any confidence output
5. Missing reproducibility fields (`inputHash`, and `seed` where stochastic)

## 7.2 Soft Gates (warning-only in v1)
Warn if:
- `Brier` regresses by >10% from baseline
- `Coverage@Tau` deviates by >5% from target
- uncertainty method disagreement exceeds configured threshold

## 7.3 Confidence Suppression Rule
If hard gate fails for a claim class, UI/API must:
- suppress high-confidence phrasing,
- downgrade confidence label to `uncalibrated`,
- attach warning reason code.

---

## 8) Benchmark Scenario Contract

File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/uncertainty-calibration-scenarios.v1.json`

Required scenario families:
1. well-calibrated baseline ID
2. mild OOD shift
3. severe OOD shift
4. adversarial confidence inflation scenario
5. sparse-data high-uncertainty scenario

Scenario fields:
- `scenario_id`
- `distribution_type` (`id` or `ood`)
- `target_task`
- `expected_calibration_profile`
- `oracle_outcomes`
- `risk_class`

---

## 9) Runner and Artifact Contract

## 9.1 CLI
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-uncertainty-calibration.ts`

Command:
```bash
npm run governance:uncertainty-calibration -- \
  --scenarioPack docs/governance/uncertainty-calibration-scenarios.v1.json \
  --runs 50 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

## 9.2 Outputs
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/uncertainty-calibration-report.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/uncertainty-calibration-report.md`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/uncertainty-calibration-trend.csv`

## 9.3 Exit Codes
- `0`: no blocking calibration failures
- `2`: blocking calibration failure
- `3`: invalid scenario/config
- `4`: runtime evaluation error

---

## 10) CI Workflow Contract

Workflow target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/uncertainty-calibration-sentinel.yml`

Triggers:
- `pull_request`
- `push` to `main`
- nightly `schedule`
- `workflow_dispatch`

Rollout:
- Week 1: report-only
- Week 2: enforce on PR
- Week 3+: enforce on PR and main

Independence:
- Runs independently of M6 health and claim-drift sentinels.

---

## 11) Promotion Governance

## 11.1 Ledger Contract
File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/uncertainty-calibration-ledger.json`

Required fields:
- `evaluation_id`
- `baseline_version`
- `candidate_version`
- `metrics_snapshot`
- `gate_results`
- `decision` (`promote|reject|hold`)
- `approved_by`
- `created_at`

## 11.2 Promotion Rule
Promote candidate only if:
1. all hard gates pass,
2. no OOD risk degradation,
3. ECE non-increasing on ID and OOD,
4. CODEOWNERS approval for critical claim-path changes.

---

## 12) Overrides and TTL

File target:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/uncertainty-calibration-overrides.json`

Required override fields:
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
- override usage appears in CI summary and artifacts

---

## 13) API Response Contract Updates (Future Interface Additions)

Confidence-bearing API routes must embed calibration metadata.

Candidate routes:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/hybrid-synthesize/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/synthesize/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts`

Required envelope extension:
```json
{
  "confidence": 0.78,
  "calibration": {
    "status": "calibrated",
    "ece": 0.032,
    "oodScore": 0.21,
    "version": "uncal-v1.0.0"
  },
  "warnings": []
}
```

---

## 14) Test Plan

1. Metric unit tests
- validate ECE/Brier/NLL computations against fixtures.

2. Gate tests
- enforce mode fails on threshold violations.

3. Metadata completeness tests
- confidence outputs without calibration fields fail.

4. OOD behavior tests
- high-confidence OOD outputs trigger blocking or suppression.

5. Determinism tests
- fixed seed/input produces same calibration report values.

6. CI integration tests
- report/enforce modes honor rollout stage.

---

## 15) Acceptance Criteria

1. Calibration runner executes all v1 scenarios and emits JSON/MD/CSV artifacts.
2. Enforce mode blocks on hard-gate failures.
3. Confidence suppression rule is implemented for failed classes.
4. Calibration ledger records each promotion decision.
5. Trend CSV provides longitudinal monitoring for at least 7 days.

---

## 16) Critical Gaps / User Actions Required

1. **User action required:** define CODEOWNERS approvers for calibration override/promotion files.
2. **User action required:** approve initial hard-gate thresholds for your domain risk tolerance.
3. **User action required:** confirm baseline calibration version to compare against.

---

## 17) Assumptions and Defaults

1. Calibration thresholds above are v1 defaults.
2. Scenario source v1: simulator + controlled replay datasets.
3. Enforcement target: block overconfident, under-calibrated outputs.
4. Timeline anchor: 2026-02-11.

---

## 18) Immediate Implementation Tasks

1. Add `src/types/uncertainty-calibration.ts`.
2. Add `scripts/evaluate-uncertainty-calibration.ts`.
3. Add `docs/governance/uncertainty-calibration-scenarios.v1.json`.
4. Add `docs/governance/uncertainty-calibration-ledger.json`.
5. Add `docs/governance/uncertainty-calibration-overrides.json`.
6. Add workflow `uncertainty-calibration-sentinel.yml`.
7. Add npm script `governance:uncertainty-calibration`.
8. Add tests for metric correctness, gates, metadata completeness, and OOD behavior.

