# MASA Governance Specification Index

**Date:** 2026-02-11  
**Status:** Active — updated with each governance slice  

---

## Purpose

This document serves as the single entry point for all governance-related specifications, contracts, and reference documents in the MASA (Multi-Agent Synthesis Architecture) framework.

All governance specs follow the **19-section standard format** (see any spec below for the canonical structure).

---

## Governance Specifications

| # | Document | Domain | Status | Slice |
|---|---|---|---|---|
| 1 | [POLICY_EVALUATION_SPEC.md](./POLICY_EVALUATION_SPEC.md) | Experiment Policy Evaluation & Promotion | Implementation-ready | S1 |
| 2 | [CAUSAL_METHOD_SELECTION_POLICY.md](./CAUSAL_METHOD_SELECTION_POLICY.md) | Causal Method Selection & Routing | Implementation-ready | S1 |
| 3 | [UNCERTAINTY_CALIBRATION_GATES.md](./UNCERTAINTY_CALIBRATION_GATES.md) | Uncertainty Calibration & Confidence Gates | Implementation-ready | S1 |
| 4 | [LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md](./LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md) | Law-Candidate Lifecycle & Falsification | Implementation-ready | S1 |

---

## Reference Documents

| # | Document | Purpose |
|---|---|---|
| 1 | [THEORY_TO_CODE_MATRIX.md](./THEORY_TO_CODE_MATRIX.md) | Maps theoretical foundations to code implementations |
| 2 | [AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md](./AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md) | High-level implementation roadmap for the Automated Scientist |
| 3 | [DOMAIN_PROFILE_SCHEMA_WITH_CLASSIFIER_MAPPING.md](./DOMAIN_PROFILE_SCHEMA_WITH_CLASSIFIER_MAPPING.md) | Domain classifier schema and mapping rules |
| 4 | [domain-profiles.v1.json](./domain-profiles.v1.json) | Domain profile data (source-of-truth for domain validation) |

---

## Implementation Artifacts (synthesis-engine)

### Type Contracts
- `src/types/governance-envelope.ts` — Shared `GovernanceResultEnvelope` base
- `src/types/policy-evaluation.ts` — Policy evaluation stream types
- `src/types/causal-method-policy.ts` — Causal method selection stream types
- `src/types/uncertainty-calibration.ts` — Uncertainty calibration stream types
- `src/types/law-discovery-falsification.ts` — Law falsification stream types

### Shared Governance Logic
- `src/lib/governance/policy-evaluation.ts`
- `src/lib/governance/causal-method-selection.ts`
- `src/lib/governance/uncertainty-calibration.ts`
- `src/lib/governance/law-falsification.ts`

### CLI Evaluators
- `scripts/evaluate-experiment-policies.ts`
- `scripts/evaluate-causal-method-selection.ts`
- `scripts/evaluate-uncertainty-calibration.ts`
- `scripts/evaluate-law-falsification.ts`

### Governance Fixtures (`docs/governance/`)
- 4 scenario packs (`*-scenarios.v1.json`)
- 4 override files (`*-overrides.v1.json`)
- 4 promotion ledgers (`*-ledger.v1.json`)

---

## Slice Tracker

| Slice | Scope | Status |
|---|---|---|
| **S1** | Report-mode evaluators, types, docs, fixtures, tests | 🟡 In Progress |
| **S2** | CI workflows, enforce mode, CODEOWNERS, threshold tuning | ⬜ Planned |

---

## Section Format Standard (19 Sections)

All governance specs must follow this structure:

1. Executive Summary
2. Goals
3. Non-Goals
4. Current-State Baseline
5. Domain-Specific Interface Contract
6. Domain-Specific Catalog / Taxonomy
7. Deterministic Decision Rules
8. Eligibility and Disqualifiers
9. Output Contract
10. Confidence / Identifiability Gates
11. Benchmark and Evaluation Contract
12. Runner and Artifact Contract (CLI + outputs)
13. CI Workflow Contract
14. Promotion Governance
15. Overrides
16. API Response Contract Updates
17. Test Plan
18. Acceptance Criteria
19. Critical Gaps, Assumptions, and Immediate Tasks
