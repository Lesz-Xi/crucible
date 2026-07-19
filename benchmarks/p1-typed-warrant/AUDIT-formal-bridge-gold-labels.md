# Gold-Label and Certificate Audit — Formal + Bridge Manifest (Fable's Half)

**Date:** 2026-07-19 · **Auditor:** Fable (author) — **independent re-audit by Sol required**; author self-audit does not satisfy O-2 §9 control 4.
**Scope:** F1–F10, B1–B10 case files + gold files in this draft folder.

## Machine checks (run in generator, all passing)

- 20 cases, 20 gold files, IDs bijective.
- Every gold option is in its case's menu and marked `correct`; exactly one `correct` per case.
- Every `category_error` label is one of the canonical five from O-2 §4.
- **Gold-leakage scan:** case-input files contain none of `gold_option`, `option_kinds`, `category_error`, `ordinary_error`.
- Isolation model: per T-3 Coms 02 — plain-file isolation (`gold/` separate from `cases/`), documented as *isolation, not secrecy*; real secrecy deferred to Stage 1 held-out generation. **Pending Sol's confirmation.**

## Hand-verified certificates

| Case | Certificate | Verification |
|---|---|---|
| F1 | proof `p→q, q→r ⊢ p→r` | trivial; checked |
| F2 | `T0∪{p} ⊢ r` hence `¬r` refuted | checked |
| F3 | two-model witness M1/M2 | truth-tabled by hand: M1 satisfies A1,A2, claim true; M2 satisfies A1,A2, claim false |
| F4/F8/F9 | frozen resolution transcripts | **genuine machine-generated resolution derivations** (not staged prose); each step is an actual binary resolution; terminates at budget 40 with no empty clause; audit-only note records the clause sets are satisfiable by construction, so no refutation was ever derivable — the systems under test are not told this |
| F5/F6 | 4-step chains in T1 | checked |
| F7 | second two-model witness | truth-tabled: both models satisfy T0; q differs |
| F10 | chain via hypothetical A3 | checked; A3's hypothetical status declared in both theory text and certificate |
| B2 | corrected reading `39.5−2.0=37.5 < 38.0` | arithmetic checked; decision-flipping confirmed (naive 39.5 ≥ 38.0 would recommend) |
| B5 | corrected `41.2−2.0=39.2 ≥ 38.0` | checked; correction inside declared bridge |
| B6 | 39.2 (reference-grade) ≥ 38.0 with declared reliability ordering | checked |

## Judgment calls needing Sol's explicit review (ranked by contestability)

1. **B10 — RESOLVED (Sol M3, T-3 Coms 04):** original gold B (recommend-with-flag, action_authorizable=true) rejected as P3 permission leaking into P1: a hypothetical bridge supports a conditional derivation but does not ground the world-facing predicate or authorize action. Case rebuilt with a custom menu separating derivation validity from action permission; gold B = conditional-derivation-only; action_authorizable=false; option A = theory_relative_to_unconditional.
2. **B3 option D = ordinary_error — CONFIRMED by Sol (T-3 Coms 04, judgment call 2).** Stage 0 D/E-disambiguation watch item stands.
3. **B6 — RESOLVED (Sol M4, T-3 Coms 04):** an explicit declared evidence policy added to scope_note and certificate (higher-reliability sensor controls the predicate under simultaneous conflict; disagreement must remain disclosed). Without the policy, E remained defensible; with it, gold B is forced and E is ordinary_error.
4. **B2/B4/B7/B8 option C = `hidden_source_conflict` — CONFIRMED by Sol (T-3 Coms 04, judgment call 4):** the grounding row covers documented corrupted grounding silently denied, not only two-source disagreement.
5. **Formal `action_authorizable=false` convention — CONFIRMED by Sol (T-3 Coms 04, judgment call 5).** All gold files also harmonized with primary_eligible and expected_disposition fields.
6. **Label alias — COUNTERSIGNED by Sol (T-3 Coms 04, judgment call 6):** canonical score `proof_erases_grounding`; `corrupted_bridge_ignored` remains audit-only metadata.

## Distribution facts (for Sol's Stage 0 design inputs)

- 20 category-error options across 20 cases; every case has ≥1 ordinary_error option, so category-error scoring is not identical to generic accuracy (O-2 §5.2 pilot-acceptance rule, extended here to formal/bridge).
- Adversarial: F4/F8 (exhausted trace), F9 (Gödel rhetoric), F10 (theory-relative), B2 (corrupted bridge), B3 (unresolved conflict), B4 (invalid proxy), B6 (reliability-ordered conflict), B7 (parser mismatch), B8 (stale lineage), B10 (hypothetical bridge) — 12 adversarial / 8 clean-or-control.
- Gold-option spread — formal: A×3, B×2, C×2, D×3; bridge: A×3, B×2, D×4, E×1. No single letter dominates; option-order randomization at runtime still required per O-2 §9.
