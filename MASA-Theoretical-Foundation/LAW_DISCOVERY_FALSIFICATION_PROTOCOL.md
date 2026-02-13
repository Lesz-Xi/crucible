# Law Discovery & Falsification Protocol v1.0
**Title:** Law-Candidate Lifecycle Management and Falsification Governance Contract  
**Date:** 2026-02-11  
**Status:** Implementation-ready specification  
**Workflow Basis:** `/Users/lesz/Documents/Synthetic-Mind/.agent/workflows/Demis-Workflow.md`  
**Related Inputs:**
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/Theoretical Foundations for Autonomous Closed-Loop Scientific Discovery.docx`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/THEORY_TO_CODE_MATRIX.md`

---

## 1) Executive Summary

This spec defines the **law-candidate lifecycle** that governs how the Automated Scientist proposes, tests, falsifies, and retracts candidate scientific laws. It ensures that no law-candidate persists in the system without surviving rigorous, deterministic falsification checks.

The design converts deep research theory (symbolic regression, Popperian falsification, cross-domain transfer, boundary condition probing) into an auditable, benchmarked, deterministic governance contract.

Primary principle: **no law-candidate is promoted by narrative plausibility; promotion requires surviving systematic falsification under controlled benchmarks.**

---

## 2) Goals

1. Enable deterministic law-candidate lifecycle management: `proposed → tested → falsified | confirmed → retracted`.
2. Enforce Popperian falsification discipline — every candidate must be testable and have defined failure conditions.
3. Provide a benchmark suite for evaluating law-candidate robustness under adversarial scenarios.
4. Track law-candidate provenance and evidence basis for full auditability.

---

## 3) Non-Goals

1. This spec does not implement a theorem prover or formal verification system.
2. This spec does not replace symbolic regression internals (covered by the synthesis engine).
3. This spec does not serve as a publication or dissemination system.
4. This spec does not define the experiment-selection logic (covered by `POLICY_EVALUATION_SPEC.md`).

---

## 4) Current-State Baseline (Code Reality)

No formal law-candidate lifecycle tracking exists in the repository:

- Available foundations:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts` (provides causal reasoning primitives)
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scientific-integrity-service.ts` (provides integrity checks)
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/governance/trace-integrity.ts` (trace-level governance)
- Available governance workflows:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`

Gap to close: law-candidates are currently ad-hoc strings with no formal lifecycle states, evidence tracking, or falsification governance.

---

## 5) Law Discovery Interface Contract

### 5.1 `LawCandidate` Type

```typescript
interface LawCandidate {
  id: string;                    // UUIDv7
  hypothesis: string;            // Human-readable law statement
  formalExpression?: string;      // Optional: symbolic / mathematical form
  domain: string;                // Domain classifier key from domain-profiles
  evidenceBasis: EvidenceBasis[];
  status: LawLifecycleState;
  proposedAt: string;            // ISO-8601
  lastTransitionAt: string;      // ISO-8601
  falsificationCriteria: string; // What would disprove this law
  confidenceScore: number;       // 0–1 calibrated confidence
}
```

### 5.2 `EvidenceBasis`

```typescript
interface EvidenceBasis {
  sourceId: string;              // Reference to original data/experiment
  sourceType: 'experiment' | 'observation' | 'cross-domain-transfer';
  summary: string;
  strength: 'strong' | 'moderate' | 'weak';
  timestamp: string;             // ISO-8601
}
```

### 5.3 `LawLifecycleState`

```typescript
type LawLifecycleState = 'proposed' | 'tested' | 'falsified' | 'confirmed' | 'retracted';
```

---

## 6) Falsification Methods Catalog

| Method | Description | When Applied |
|---|---|---|
| **Counterfactual Testing** | Generate interventional scenarios that contradict the candidate | After proposal, before confirmation |
| **Boundary Condition Probing** | Test candidate at extremes of its domain variables | After initial testing passes |
| **Cross-Domain Transfer** | Apply candidate to adjacent domains where it should also hold | During confirmation evaluation |
| **Contradiction Detection** | Check candidate against confirmed laws for logical conflicts | On every state transition |
| **Replication Challenge** | Re-derive evidence using different seeds / input orderings | Required for confirmation |

---

## 7) Deterministic Decision Rules (State Transitions)

### Valid transitions:

| From → To | Required Condition |
|---|---|
| `proposed → tested` | ≥ 1 evidence basis entry with `strength ≥ moderate` |
| `tested → falsified` | ≥ 1 counter-evidence entry from any falsification method |
| `tested → confirmed` | ≥ 2 independent replications AND zero active counter-evidence |
| `confirmed → retracted` | New counter-evidence invalidates ≥ 1 prior replication |
| `falsified → retracted` | Administrative cleanup; optional |

### Invalid transitions (must reject):

| Transition | Reason |
|---|---|
| `proposed → confirmed` | Cannot skip testing phase |
| `proposed → retracted` | Must have evidence before retraction |
| `falsified → confirmed` | Contradicts falsification evidence |
| `confirmed → proposed` | Cannot regress without retraction first |

### Determinism invariant:
Given identical `(candidateId, evidenceSet, seed)`, the transition decision and resulting state must be identical across runs.

---

## 8) Eligibility and Disqualifiers

A law-candidate is **disqualified** from progressing past `proposed` if any apply:

1. **Unfalsifiable**: No `falsificationCriteria` defined or criteria is tautological.
2. **Tautological**: Hypothesis is logically vacuous (e.g. "A or not A").
3. **Circular Evidence**: All evidence basis entries reference the candidate itself.
4. **Domain Mismatch**: Candidate's `domain` does not match any registered domain profile.
5. **Duplicate**: Another active candidate with identical `formalExpression` exists.

Disqualified candidates remain in `proposed` state with a `disqualified: true` flag until evidence is corrected.

---

## 9) Output Contract

### `LawEvaluationResult` (extends `GovernanceResultEnvelope`)

```typescript
interface LawEvaluationResult extends GovernanceResultEnvelope {
  candidateId: string;
  previousState: LawLifecycleState;
  newState: LawLifecycleState;
  transitionValid: boolean;
  falsificationMethodsApplied: string[];
  evidenceSummary: {
    supporting: number;
    contradicting: number;
    replications: number;
  };
  disqualifiers: string[];       // Empty if eligible
  lifecycleComplete: boolean;    // True if terminal state reached
}
```

---

## 10) Confidence and Identifiability Gates

| Gate | Threshold | Hard/Soft | Action on Fail |
|---|---|---|---|
| **Min Evidence Count** | `evidenceBasis.length ≥ 2` | Hard | Block `proposed → tested` |
| **Falsification Criteria Present** | `falsificationCriteria.length > 0` | Hard | Block all transitions |
| **Cross-Domain Replication** | ≥ 1 cross-domain evidence for `tested → confirmed` | Soft | Warning in report |
| **Confidence Floor** | `confidenceScore ≥ 0.3` for `tested → confirmed` | Hard | Block confirmation |
| **Counter-Evidence Absence** | Zero active counter-evidence for confirmation | Hard | Block confirmation |

---

## 11) Benchmark and Evaluation Contract

### Scenario Families:

| Family | Purpose | Expected Outcomes |
|---|---|---|
| `valid-transition` | Test correct state transitions with valid evidence | All transitions succeed |
| `invalid-transition` | Test rejection of invalid transitions | All transitions rejected |
| `disqualifier` | Test disqualification detection | Candidates flagged correctly |
| `falsification-discovery` | Test detection of counter-evidence | State changes to `falsified` |
| `lifecycle-completeness` | Full lifecycle from `proposed` to terminal state | Complete lifecycle traced |

### Determinism requirement:
Given scenario pack + seed, identical `LawEvaluationResult` outputs across runs.

### Scenario pack format: `docs/governance/law-falsification-scenarios.v1.json`

---

## 12) Runner and Artifact Contract

### CLI:

```bash
npm run governance:law-falsification -- \
  --scenarioPack docs/governance/law-falsification-scenarios.v1.json \
  --runs 50 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

### Artifact outputs (flat paths):
- `artifacts/law-falsification-report.json`
- `artifacts/law-falsification-report.md`
- `artifacts/law-falsification-trend.csv`

### Exit codes:
| Code | Meaning |
|---|---|
| `0` | Success (report mode: always; enforce mode: no hard-gate failures) |
| `2` | Hard-gate failure (enforce mode only) |
| `3` | Invalid input (corrupt scenario pack, missing required args) |
| `4` | Runtime error |

---

## 13) CI Workflow Contract

> **Deferred to S2.** CI workflow YAML will be added when enforcement mode is enabled. This section is a placeholder to maintain 19-section format alignment with sister specs.

Planned workflow: `.github/workflows/law-falsification-gate.yml`
- Trigger: push to `main`, PR to `main`
- Runs: `npm run governance:law-falsification -- --mode enforce --seed $GITHUB_RUN_ID`
- Gate: exit code 0 required for merge

---

## 14) Promotion Governance

### Promotion criteria:
A law-candidate evaluation configuration is eligible for promotion from `experimental` to `trusted` when:

1. ≥ 3 consecutive CI runs with zero hard-gate failures.
2. All scenario families exercised in benchmarks.
3. Determinism verified across ≥ 5 seeds.
4. No regressions in any sister governance stream.

### Promotion ledger: `docs/governance/law-falsification-ledger.v1.json`

### Approval: Requires governance CODEOWNERS sign-off (USER-configured).

---

## 15) Overrides

### Override file: `docs/governance/law-falsification-overrides.v1.json`

```json
[
  {
    "id": "override-001",
    "gate": "min-evidence-count",
    "ticket": "GOV-042",
    "reason": "Bootstrapping new domain with limited initial data",
    "expiresAt": "2026-02-25T00:00:00Z"
  }
]
```

### Override rules:
- Each override must reference a gate by name, a tracking ticket, a human-readable reason, and an expiration.
- Default TTL: 14 days.
- Expired overrides are ignored (gate failure is reported normally).
- Active overrides suppress gate failures in reports with an `[OVERRIDDEN]` annotation.

---

## 16) API Response Contract Updates

Optional: if law lifecycle state is exposed in the synthesis response, add to the existing response envelope:

```typescript
interface SynthesisResponseLawExtension {
  activeLawCandidates?: {
    id: string;
    hypothesis: string;
    status: LawLifecycleState;
    confidenceScore: number;
  }[];
}
```

> This is deferred to S2 and depends on API surface decisions.

---

## 17) Test Plan

### Unit tests (determinism + logic):
1. **Determinism**: Same `(candidateId, evidenceSet, seed)` → identical `LawEvaluationResult`.
2. **Valid transitions**: All valid transitions succeed with correct evidence.
3. **Invalid transitions**: All invalid transitions are rejected with correct error codes.
4. **Disqualifier detection**: Unfalsifiable, tautological, circular, and duplicate candidates are flagged.
5. **Lifecycle completeness**: Full `proposed → tested → confirmed` and `proposed → tested → falsified → retracted` paths.

### Integration tests:
6. **Override application**: Active override suppresses gate failure; expired override does not.
7. **Exit codes**: Correct exit code for each failure mode.

### Test location: `src/lib/governance/__tests__/law-falsification.test.ts`

### Tests import from:
- `src/lib/governance/law-falsification.ts` (shared evaluation logic)
- `src/types/law-discovery-falsification.ts` (type contracts)

---

## 18) Acceptance Criteria

1. All valid state transitions produce correct `LawEvaluationResult` outputs.
2. All invalid state transitions are rejected deterministically.
3. All disqualifier rules fire correctly on qualifying candidates.
4. CLI runner generates all 3 artifact formats (json, md, csv).
5. Determinism holds across 5+ seeds with identical scenarios.
6. Override system correctly handles active and expired overrides.
7. No regressions in existing governance workflows.

---

## 19) Critical Gaps, Assumptions, and Immediate Tasks

### Critical Gaps:
1. **No existing falsification evidence corpus** — scenario fixtures will use synthetic test data initially.
2. **No symbolic regression integration** — `formalExpression` is optional and not validated in S1.
3. **Cross-domain replication** — soft gate only; requires domain profile expansion for full enforcement.

### Assumptions:
1. S1 is report-mode only; enforcement deferred to S2.
2. Domain classifier mapping from `domain-profiles.v1.json` is source-of-truth for domain validation.
3. `UUIDv7` generation uses the trace-integrity service pattern.

### Immediate Implementation Tasks (S1):
1. Create `src/types/law-discovery-falsification.ts` with all types from Section 5 and 9.
2. Create `src/lib/governance/law-falsification.ts` with evaluation logic.
3. Create `scripts/evaluate-law-falsification.ts` as thin CLI wrapper.
4. Create `docs/governance/law-falsification-scenarios.v1.json` with scenario fixtures.
5. Create `docs/governance/law-falsification-overrides.v1.json` (initial: empty array with schema).
6. Create `docs/governance/law-falsification-ledger.v1.json` (initial: empty array).
7. Add tests in `src/lib/governance/__tests__/law-falsification.test.ts`.
