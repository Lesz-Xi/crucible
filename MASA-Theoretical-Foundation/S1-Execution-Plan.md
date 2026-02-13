# Slice S1 Execution Plan: MASA Governance Foundation (Decision-Complete)

> **Revision**: v2 — Post-audit amendment (2026-02-11)
> **Audit ref**: [S1 Audit Report](../../.gemini/antigravity/brain/d8dcbf1e-fffc-4c79-a9bb-46e64210e9fc/theoretical_foundations_audit.md)

## Summary
Implement the **first execution slice** of the updated MASA completion program with minimal risk and no enforcement coupling yet:
1. Finish missing governance docs in `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation`.
2. Add deterministic contract types + evaluator CLIs in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`.
3. Add report artifacts + tests in report mode only.
4. Keep existing M6/claim-drift stability untouched.

> **Path clarification (2026-02-11):** canonical governance specifications for S1 live in `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation` (not `synthesis-engine/docs/specs`).

This slice is designed to convert draft intent into executable governance contracts before CI blocking gates are introduced.

---

## Current Ground Truth (from repo scan — 2026-02-11)

### Missing docs:
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/GOVERNANCE_SPEC_INDEX.md`

### Existing governance workflows (6 total):
1. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`
2. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`
3. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-closeout-tracker.yml`
4. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/causal-integrity-check.yml`
5. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-governance.yml`
6. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/policy-gate.yml`

### Existing claim governance scripts (6 total):
1. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/scan-claim-drift.ts`
2. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/reconcile-claim-ledger.ts`
3. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/migrate-claim-ledger.ts`
4. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/promote-scm-model.ts`
5. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/validate-schema.ts`
6. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/claim-drift-evaluator.ts`

> **⚠️ Cleanup needed**: `migrate-claim-ledger 2.ts` (duplicate with space in name) should be deleted.

### Existing type barrel:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/index.ts` (349 lines)

### Existing governance library:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/governance/trace-integrity.ts`

### Parked out-of-scope assets (explicitly ignored):
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/openclaw-skills/`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/public/automated-scientist.mp4`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/public/images/`

---

## L1-L4 Planning Check
- **L1 Impact:** Moderate; adds governance contracts/scripts and docs, no endpoint behavior change.
- **L2 Risk:** Main risk is spec/code drift in newly added contracts; mitigated with schema + deterministic tests.
- **L3 Calibration:** CLI-only additions; expected low runtime overhead, CI impact minimal in report mode.
- **L4 Critical Gaps:** CODEOWNERS and threshold approvals are still required before enforce-mode rollout (deferred to later slice).

---

## Implementation Scope (S1 only)

## A) Documentation Finalization (MASA-Theoretical-Foundation)

### Create:
1. `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md`
2. `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/GOVERNANCE_SPEC_INDEX.md`

### Section format standard:

> **All governance spec documents use the established 19-section format.**
> The existing specs (`POLICY_EVALUATION_SPEC.md`, `CAUSAL_METHOD_SELECTION_POLICY.md`, `UNCERTAINTY_CALIBRATION_GATES.md`) already follow this structure and **must NOT be renumbered or restructured**.
> The new `LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md` **must also** follow this same 19-section format.

Standard sections (19-section format):
1. Goals
2. Non-Goals
3. Current-State Baseline
4. Domain-Specific Interface Contract (e.g. Law Discovery Interface)
5. Domain-Specific Catalog / Taxonomy (e.g. Falsification Methods)
6. Deterministic Decision Rules
7. Eligibility and Disqualifiers
8. Output Contract (domain-specific schema)
9. Confidence / Identifiability Gates
10. Benchmark and Evaluation Contract
11. Runner and Artifact Contract (CLI + outputs)
12. CI Workflow Contract (deferred to S2 — stub section only)
13. Promotion Governance
14. Overrides
15. API Response Contract Updates (if applicable)
16. Test Plan
17. Acceptance Criteria
18. Critical Gaps and Assumptions
19. Immediate Implementation Tasks

### LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md — Content Outline:

| Section | Domain Content |
|---|---|
| 1. Goals | Enable deterministic law-candidate lifecycle management (propose → test → falsify → retract) |
| 2. Non-Goals | Not a theorem prover; not a publication system |
| 3. Current-State | No law lifecycle tracking exists; candidates are ad-hoc |
| 4. Law Discovery Interface | `LawCandidate` type: `id`, `hypothesis`, `domain`, `evidenceBasis[]`, `status` |
| 5. Falsification Methods | Counterfactual testing, boundary condition probing, cross-domain transfer |
| 6. Decision Rules | Status transitions: `proposed→tested` (requires evidence), `tested→falsified` (requires counter-evidence), `tested→confirmed` (requires replication) |
| 7. Disqualifiers | Unfalsifiable hypotheses, tautological claims, circular evidence |
| 8. Output Contract | `LawEvaluationResult` with lifecycle state, evidence summary, confidence |
| 9. Confidence Gates | Min evidence count, cross-domain replication threshold |
| 10. Benchmark Contract | Scenario families: valid transition, invalid transition, edge cases |
| 11. Runner/CLI | Same pattern as other evaluators (see Section C below) |
| 12. CI | Stub: "Deferred to S2" |
| 13. Promotion | Same governance as other streams |
| 14. Overrides | Per-stream override file with TTL |
| 15. API Updates | Optional: expose law status in synthesis response |
| 16. Test Plan | Determinism, invalid transitions, lifecycle completeness |
| 17. Acceptance | All transitions validated, deterministic outputs |
| 18. Gaps | No existing falsification evidence corpus |
| 19. Immediate Tasks | Create type file, evaluator script, scenario fixtures |

### GOVERNANCE_SPEC_INDEX.md must index:
- `THEORY_TO_CODE_MATRIX.md`
- `AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- `POLICY_EVALUATION_SPEC.md`
- `CAUSAL_METHOD_SELECTION_POLICY.md`
- `UNCERTAINTY_CALIBRATION_GATES.md`
- `LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md`
- `DOMAIN_PROFILE_SCHEMA_WITH_CLASSIFIER_MAPPING.md`
- `domain-profiles.v1.json`

---

## B) Contract Types (synthesis-engine)

### Create:
1. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/governance-envelope.ts`
2. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/policy-evaluation.ts`
3. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/causal-method-policy.ts`
4. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/uncertainty-calibration.ts`
5. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/law-discovery-falsification.ts`

### Type architecture:

**Base envelope** (`governance-envelope.ts`):
All governance result types extend a shared `GovernanceResultEnvelope`:
```typescript
export interface GovernanceResultEnvelope {
  runId: string;           // UUIDv7
  inputHash: string;       // SHA-256 of scenario input
  seed: number;
  mode: 'report' | 'enforce';
  timestamp: string;       // ISO-8601
  decision: string;        // stream-specific decision value
  hardGateFailures: string[];
  warnings: string[];
}
```

**Per-stream types** (each file implements spec-specific interfaces that extend the envelope):

| File | Spec-Specific Types (from spec documents) |
|---|---|
| `policy-evaluation.ts` | `PolicyDecision`, `ScenarioResult`, `PromotionRecord`, `PolicyFamily` |
| `causal-method-policy.ts` | `DataRegime`, `MethodCard`, `SelectionOutput`, `EligibilityResult` |
| `uncertainty-calibration.ts` | `ConfidenceReport`, `GateResult`, `CalibrationMetric`, `CalibrationLevel` |
| `law-discovery-falsification.ts` | `LawCandidate`, `LawLifecycleState` (`proposed \| tested \| falsified \| retracted`), `LawEvaluationResult`, `FalsificationEvidence` |

### Determinism keys:
- Identical `inputHash + seed + mode` must produce identical `decision` and `hardGateFailures` set.

### Update exports in:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/index.ts`

---

## C) Evaluator Scripts (report-only behavior in S1)

### Create:
1. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-experiment-policies.ts`
2. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-causal-method-selection.ts`
3. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-uncertainty-calibration.ts`
4. `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-law-falsification.ts`

### CLI contracts (per-stream, from spec documents):

**evaluate-experiment-policies.ts**:
```bash
npm run governance:policy-eval -- \
  --policy eig,bo_ucb,bo_ts,efe \
  --scenarioPack docs/governance/policy-eval-scenarios.v1.json \
  --runs 50 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

**evaluate-causal-method-selection.ts**:
```bash
npm run governance:causal-method-eval -- \
  --scenarioPack docs/governance/causal-method-scenarios.v1.json \
  --runs 100 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

**evaluate-uncertainty-calibration.ts**:
```bash
npm run governance:uncertainty-calibration -- \
  --scenarioPack docs/governance/uncertainty-calibration-scenarios.v1.json \
  --runs 50 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

**evaluate-law-falsification.ts**:
```bash
npm run governance:law-falsification -- \
  --scenarioPack docs/governance/law-falsification-scenarios.v1.json \
  --runs 50 \
  --seed 20260211 \
  --format json,md,csv \
  --mode report|enforce
```

### Shared CLI rules:
- `--mode` defaults to `report` in S1; `enforce` is accepted but behaves identically to `report`.
- `--seed` is mandatory for determinism compliance.
- All evaluators share exit codes: `0` success, `2` hard-gate (enforce only), `3` invalid input, `4` runtime error.

### Artifact output paths (flat, per spec convention):

| Evaluator | Outputs |
|---|---|
| Policy Eval | `artifacts/policy-eval-report.json`, `artifacts/policy-eval-report.md`, `artifacts/policy-eval-trend.csv` |
| Causal Method | `artifacts/causal-method-selection-report.json`, `artifacts/causal-method-selection-report.md`, `artifacts/causal-method-selection-trend.csv` |
| Uncertainty | `artifacts/uncertainty-calibration-report.json`, `artifacts/uncertainty-calibration-report.md`, `artifacts/uncertainty-calibration-trend.csv` |
| Law Falsification | `artifacts/law-falsification-report.json`, `artifacts/law-falsification-report.md`, `artifacts/law-falsification-trend.csv` |

### Script architecture note:
Each evaluator script should be a **thin CLI wrapper** that:
1. Parses CLI args
2. Calls shared evaluation logic from `src/lib/governance/<stream>.ts`
3. Writes artifacts

This keeps domain logic testable without coupling tests to CLI parsing. Shared types come from `src/types/`, shared evaluation functions live in `src/lib/governance/`.

---

## D) Governance Artifacts (seeded fixtures)

### Scenario packs (one per stream):
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/policy-eval-scenarios.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/causal-method-scenarios.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/uncertainty-calibration-scenarios.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/law-falsification-scenarios.v1.json`

### Override files (one per stream, NOT shared):
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/policy-eval-overrides.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/causal-method-overrides.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/uncertainty-calibration-overrides.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/law-falsification-overrides.v1.json`

### Promotion ledger files (one per stream):
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/policy-eval-ledger.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/causal-method-ledger.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/uncertainty-calibration-ledger.v1.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/law-falsification-ledger.v1.json`

### Schema constraints:
- Each scenario has a stable `scenarioId`.
- Each scenario defines `expectedHardGates` and `expectedDecision`.
- Overrides require: `id`, `ticket`, `reason`, `expiresAt` (TTL default 14 days).
- Ledgers are initially empty arrays `[]`; evaluators append promotion records.

### .gitignore update:
Add to `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.gitignore`:
```
# Governance evaluator outputs (regenerated on each run)
artifacts/*.json
artifacts/*.md
artifacts/*.csv
```

---

## E) Package Scripts
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/package.json`:
- `governance:policy-eval`
- `governance:causal-method-eval`
- `governance:uncertainty-calibration`
- `governance:law-falsification`

All should use `npx --yes tsx ...` pattern for consistency with existing scripts.

---

## F) Tests (determinism + schema + gating)

### Test location:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/governance/__tests__/`

### Architecture note:
Tests should import from `src/lib/governance/<stream>.ts` (shared evaluation logic) and `src/types/<stream>.ts` (type contracts), **not** directly from `scripts/` CLI wrappers. This ensures tests validate domain logic independent of CLI layer.

### Required tests:
1. **Determinism**: same `inputHash + seed` → same `decision` + `hardGateFailures`
2. **Schema validity**: reports include all `GovernanceResultEnvelope` fields plus stream-specific fields
3. **Gate behavior**: intentional hard-gate case reports correctly in report mode (no exit code 2)
4. **Law lifecycle**: invalid state transitions (e.g. `proposed → retracted`) are rejected
5. **Method routing**: disqualified method never selected when rule says disqualify
6. **Override application**: active override suppresses gate failure; expired override does not

---

## Public APIs / Interfaces / Types Changes
- **Additive only** internal governance contracts.
- New TS interfaces under `src/types/*` for four governance streams + shared envelope.
- New CLI interfaces via scripts in `/scripts`.
- New shared governance logic in `src/lib/governance/`.
- No runtime endpoint removals or breaking API changes in S1.

---

## Test Cases and Scenarios (S1 acceptance)
1. `npm run governance:policy-eval -- --mode report ...` generates json/md/csv artifacts.
2. Same test input rerun with same seed yields identical outputs.
3. Corrupt scenario pack returns exit code `3`.
4. All four evaluators complete and write artifacts to `artifacts/` (flat paths).
5. Existing workflows (`claim-drift`, `m6-health-check`, `m6-closeout-tracker`, etc.) remain unaffected.
6. Override with valid TTL suppresses reported gate failure.
7. Override with expired TTL does NOT suppress gate failure.

---

## Execution Order (strict)
1. Add missing docs + spec index (Section A).
2. Add type contracts: envelope + 4 stream files + index exports (Section B).
3. Add shared evaluation logic in `src/lib/governance/` (new files per stream).
4. Add evaluator CLI scripts (Section C — thin wrappers calling shared logic).
5. Add scenario/override/ledger artifacts (Section D).
6. Update `.gitignore` for artifact outputs (Section D).
7. Add `package.json` scripts (Section E).
8. Add tests (Section F).
9. Run local verification:
   - `npm run governance:policy-eval -- --scenarioPack docs/governance/policy-eval-scenarios.v1.json --seed 42 --mode report --format json`
   - `npm run governance:causal-method-eval -- --scenarioPack docs/governance/causal-method-scenarios.v1.json --seed 42 --mode report --format json`
   - `npm run governance:uncertainty-calibration -- --scenarioPack docs/governance/uncertainty-calibration-scenarios.v1.json --seed 42 --mode report --format json`
   - `npm run governance:law-falsification -- --scenarioPack docs/governance/law-falsification-scenarios.v1.json --seed 42 --mode report --format json`
   - Run targeted tests for new governance suite.
10. Commit as one slice commit with message:
    - `feat(governance): add S1 policy/method/calibration/law evaluator foundations`

---

## Assumptions and Defaults
1. This slice is **report-first** and does not add new blocking CI checks yet.
2. **CI workflow YAML files are explicitly deferred to S2.** Each spec defines a CI workflow; these will be implemented when enforcement mode is enabled.
3. Override TTL default is `14 days`.
4. Existing domain classifier mapping remains source-of-truth for domain coverage in S1.
5. Parked media/skill assets stay out-of-scope for this slice.
6. CODEOWNERS for governance files is the USER's responsibility to configure before S2.
7. Timeline anchor for status statements: **2026-02-11**.

---

## Deferred to S2 (explicit)
| Item | Reason |
|---|---|
| CI workflow YMLs (3 existing specs + 1 new) | Requires enforcement mode; S1 is report-only |
| CODEOWNERS for `docs/governance/`, `src/lib/governance/` | Requires USER configuration |
| `--mode enforce` behavior (exit code 2 blocking) | Deferred until CI workflows are in place |
| Threshold tuning for confidence gates | Requires baseline data from S1 report runs |
