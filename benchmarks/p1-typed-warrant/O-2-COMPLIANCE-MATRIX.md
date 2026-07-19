# O-2 Compliance Matrix — Stage 0 Pre-Run Ledger

**Date:** 2026-07-19 · **Author:** Fable (per T-3 split) · **Status legend:** `built+verified` (file exists, machine check passed) / `built-unverified` / `contract-only` / `blocked-on-human` / `owner-pending` (Sol's half, in progress)

| # | O-2 §10.2 step / artifact | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | Margin-charter template with value ownership assigned to Chief | Sol | **built+verified** | `margin-charter-TEMPLATE.json`; nulls block unblinding; Fable-approved (Coms 05) |
| 2 | Common decision envelope, implemented + tested | Fable | **built+verified** | `schemas/common-envelope.schema.json`; M1 composition fix applied; suite check M1 |
| 3a | Arm A schema | Sol | **built+verified** | `schemas/arm-a.schema.json`; M1 closure applied |
| 3b | Arm A+ schema | Sol | **built+verified** | `schemas/arm-a-plus.schema.json`; Fable-approved field-complete-unenforced |
| 3c | Arm B `EpistemicClaim` schema | Sol | **built+verified** | `schemas/arm-b-epistemic-claim.schema.json` |
| 4 | B validators (six rejection rules) + unit tests | Sol | **built+verified** | `validators/typed_invariants.py`; pure, no answer-key access; §3.7 verified structurally+behaviorally (suite 10.3-7); 8/8 unit tests |
| 5a | Pilot cases: formal F1–F10, per-option kinds, certificates | Fable | **built+verified** | `cases/pilot/formal/`, `gold/`, generator consistency checks NONE-failed; audit doc |
| 5b | Pilot cases: bridge B1–B10, per-option kinds, certificates | Fable | **built+verified** | `cases/pilot/bridge/`, `gold/`, same checks |
| 5c | Pilot cases: empirical E01–E10 | Sol | **built+verified** | per-case gold; arithmetic independently recomputed by Fable (Coms 05); E06/E07 corrections applied and countersigned (Coms 05/06) |
| 5d | Frozen search transcripts for exhausted-trace cases | Fable | **built+verified** | `traces/` — genuine machine-generated resolution derivations, budget 40, no certificate |
| 6 | Deterministic option scorer | Fable | **built+verified** | `scorer/primary.py`; M2 primary_eligible enforcement; arm-neutral (suite 10.3-6/7) |
| 7 | Dry parser/validator/scorer test, no model | Fable | **built+verified** | `tests/` — 15/15 acceptance + 8/8 validator + 7/7 empirical, all no-model, deterministic |
| 8 | Freeze (prompts, templates, keys, versions, budgets, exclusions, analysis code, seed, charter, rules) | joint | **blocked-on-human** (partially) | hash checklist to ship in O-3; freeze itself requires model choice (execution blocker) + charter signature (unblinding blocker) |
| 9 | Stage 0 execution (blinded to margin setting) | — | **out of O-3 scope** | requires model/provider + run budget: Chief's decision |
| 10 | Stage 1 preregistration | — | **out of O-3 scope** | requires Stage 0 estimates |

## O-2 §10.3 acceptance tests (pre-model) — current state

| Test | Status |
|---|---|
| Proof timeout cannot score as independence unless independence option selected | **holds by construction** in F4/F8/F9 gold files (D=correct; C=category_error) — mechanical re-test at assembly dry-run |
| Posterior option cannot be labeled proof | **built+verified** — acceptance 10.3-2 PASS over E01–E10 |
| Every `independent_with_certificate` gold case has theory, metatheory, certificate | **built+verified**: F3, F7 carry two-model witnesses + metatheory field |
| Every empirical arithmetic key independently recomputed | **built+verified** — arithmetic-bearing keys (E01, E02, E06) independently recomputed by Fable; remaining semantic keys reviewed; empirical suite 7/7 PASS |
| Corrupted-bridge cases preserve valid-proof-in-T / invalid-world-bridge distinction | **built+verified**: B2, B7, B8 gold rationales state it explicitly |
| Scorer identical across arms for same envelope | **built+verified** — acceptance 10.3-6 PASS |
| Validator diagnostics cannot modify primary labels | **built+verified** — acceptance 10.3-7 PASS (structural + behavioral) |
| Pilot IDs rejected by confirmatory loader | **built+verified** — `ConfirmatoryLoader` implemented; rejects all 30 pilot IDs; acceptance 10.3-8 PASS |
| Action authorization cannot alter P1 claim coverage | **built+verified** — claim/action fields separated in every gold file; acceptance 10.3-9 PASS |

## Discrepancies found in O-2 during implementation (logged, not silently fixed)

0. **Cross-half items — RESOLVED (Sol, T-3 Coms 05):** E06 option D reworded to assert proof and labeled `probability_to_proof` (O-2 §5.2 rule satisfied); E07 option A relabeled `proof_erases_grounding` per Fable's cross-family consistency argument, option C remains `hidden_source_conflict`.
1. **§4 vs §5.3 label naming:** §5.3 B2 says option A "is `corrupted_bridge_ignored`"; §4's frozen five-label table has no such label. Resolution applied: canonical label `proof_erases_grounding` with `alias: corrupted_bridge_ignored` recorded on B2 as audit-only metadata. **Countersigned by Sol (T-3 Coms 04 judgment call 6, reaffirmed T-3 Coms 05).**
2. **§5.4 row "certificate relabeling" says "secondary unless option asserts proof"** — implemented implication: no formal/bridge case in my half uses that injection; it lives in Sol's empirical half (E4-type cases). No action from me; noted so the injection isn't silently dropped from the pilot.

## Readiness verdict (final, joint)

**Conditionally ready.** All O-2 §10.2 step 1–7 artifacts built and dry-verified (acceptance 15/15, validators 8/8, empirical 7/7, no-model, deterministic). Blocked on: (1) Chief's margin-charter values/signature → blocks comparative outcome unblinding; (2) Chief's model/provider + run-budget choice → blocks Stage 0 execution; (3) prompt+infrastructure freeze → follows (2). Both Chief-owned blockers are expected boundaries, not defects.
