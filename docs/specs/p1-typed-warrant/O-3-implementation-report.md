# O-3 — P1 Stage 0 Implementation Pack and Readiness Report

**Joint authors:** Fable & Sol
**Research cycle:** 2026-07-19
**Predecessors:** O-1 (*Boundary-Typed Epistemic Control* — the theory), O-2 (*P1 Typed-Warrant Advantage — Benchmark Specification and Execution Contract* — the experiment design)
**Method:** Crossed independent scope proposals, divided implementation, mutual cross-review with mandatory-fix cycles, joint dry verification, final conceptual and implementation check
**Status:** Final — jointly approved 2026-07-19 (assembly: Fable; final implementation and conceptual check: Sol, passed — see T-3 Coms 06–09)
**Claim status:** Implementation and readiness report only. **No model has been run. No comparative outcome exists. Nothing here is evidence for or against BTEC.**

---

## 1 — Verdict: Readiness State

**Conditionally ready.** Every artifact O-2 §10.2 authorizes through step 7 is built and dry-verified in [`p1-benchmark/`](p1-benchmark/). Three blockers remain, all deliberate, none a defect:

| Blocker | What it blocks | Owner |
|---|---|---|
| Margin-charter values and signature (`margin-charter-TEMPLATE.json` — value slots are null, and *null blocks unblinding; it is never read as zero*) | comparative Stage 0 outcome **unblinding** | **Chief** |
| Model/provider and run-budget selection | Stage 0 **execution** | **Chief** |
| Prompt + infrastructure freeze (O-2 §6.4) | follows model choice | Sol & Fable, after the above |

Per O-2 §10.2 step 9, Stage 0 may execute before the charter is signed, provided comparative outcomes stay blinded to margin setting; the charter gates interpretation, not the run.

## 2 — What Was Built

The complete pre-run ledger is [`p1-benchmark/O-2-COMPLIANCE-MATRIX.md`](p1-benchmark/O-2-COMPLIANCE-MATRIX.md); every row is now `built+verified` except the human-owned blockers above. Summary:

- **30 pilot cases** (10 formal, 10 empirical, 10 bridge) with case-specific option menus and no gold vocabulary in any input file (machine-scanned). 12 adversarial injections across families: exhausted search traces, Gödel-rhetoric-after-timeout, theory-relative proof, corrupted/stale/mismatched grounding, unresolved and reliability-ordered source conflicts, invalid and verified proxies, hypothetical bridge, prior sensitivity, out-of-scope calibration, corrupted provenance, action-contract pressure (secondary-only).
- **Isolated answer keys**: per-case gold with total per-option kind maps (`correct` / `ordinary_error` / `category_error(label)` — labels restricted to O-2 §4's frozen five), certificates for every formal claim (proofs, refutations, two-model independence witnesses with metatheory, genuine machine-generated resolution transcripts for the resource-limit cases), exact recomputed arithmetic for every arithmetic-bearing empirical key (E01, E02, E06) with remaining semantic keys reviewed, `claim_answerable` / `action_authorizable` / `primary_eligible` / `expected_disposition` on every case.
- **Schemas** for the common decision envelope and arms A / A+ / B (envelope open for composition; each arm schema closed with `unevaluatedProperties: false`).
- **Arm B typed-invariant validators** — all six O-2 §3.6 rules, pure, no answer-key access, structurally and behaviorally incapable of touching the primary score.
- **Deterministic primary scorer** — `case_id + selected_option → frozen label`, arm-neutral, `primary_eligible:false` enforced inside the scorer, malformed envelopes scored as coverage failures.
- **Confirmatory-loader stub** that permanently rejects all 30 pilot IDs.
- **Margin-charter template** with Chief-owned value slots and locked O-2 thresholds.
- **Pre-freeze hash inventory** (sha256 over **77 payload files; the manifest excludes itself** — a manifest cannot honestly hash its own final bytes) — explicitly *not* the O-2 §6.4 freeze, which additionally needs prompts, model versions, analysis code, and the signed charter.

## 3 — Verification Actually Run (all no-model, deterministic, stdlib-only)

| Suite | Result |
|---|---|
| `tests/test_acceptance.py` — O-2 §10.3 acceptance + pack integrity, incl. timeout-never-independence, probability-never-proof, arm-neutrality of scoring, validator non-interference, pilot-ID rejection, gold isolation, schema-composition contract, secondary-only enforcement | **15/15 PASS** |
| `tests/test_typed_invariants.py` (Sol) | **8/8 PASS** |
| `tests/test_empirical_cases.py` (Sol) | **7/7 PASS** |

Cross-verification beyond the suites: Sol independently **replayed every step of all three resolution transcripts** (120 resolution steps, all valid, no empty clause); Fable independently **recomputed every arithmetic-bearing empirical key (E01, E02, E06 — including the exact E02 values `BF = 6.4072265625`, posterior `0.8649967040210943`) and reviewed the remaining semantic keys**.

## 4 — Corrections Ledger (what cross-review changed, preserved not flattened)

The build cycle killed or corrected eight defects before any model ever sees the benchmark. Full trace in `T-3 Coms/`.

| # | Defect | Found by | Fix |
|---|---|---|---|
| 1 | Common-envelope schema's `additionalProperties:false` would have made every real arm response invalid under a conforming Draft 2020-12 validator | Sol | envelope opened; arm schemas closed with `unevaluatedProperties:false`; regression check added |
| 2 | Scorer could count the secondary-only action-contract case (E08) toward the primary verdict | Sol | `primary_eligible` enforced inside the scorer; labels preserved as secondary only |
| 3 | B10 gold authorized action through an explicitly hypothetical bridge — P3 permission leaking into P1 | Sol | custom menu separating conditional-derivation validity from action permission; `action_authorizable:false` |
| 4 | B6 lacked a declared conflict-resolution policy, leaving escalation defensible against the gold | Sol | explicit evidence policy added to scope note and certificate |
| 5 | F4 originally asserted an unproven resolution-complexity lower bound | Sol (T-2 lineage) | replaced with genuine exhausted-transcript classification cases |
| 6 | E06 had no category-error distractor, violating O-2 §5.2's own pilot rule | Fable | option D reworded to assert proof; labeled `probability_to_proof` |
| 7 | E07's act-through-broken-grounding option carried the denial label, breaking cross-family label comparability | Fable | option A → `proof_erases_grounding`; option C stays `hidden_source_conflict` |
| 8 | E02 posterior had a transcription error in an early note | Sol (self, during dry validation) | exact value corrected and regression-tested |

Rows 1–5 are Fable-authored defects caught by Sol; rows 6–7 are Sol-authored defects caught by Fable; row 8 is a self-catch. The direction of correction ran both ways — which is the point of the protocol.

## 5 — Claim Boundary

What O-3 establishes: the P1 benchmark is *implementable and implemented* — its measurement path is deterministic, arm-neutral, and mechanically inspected. What O-3 does **not** establish: anything about whether typed warrant works. A pack this carefully built can still measure the wrong thing; that is what Stage 0's measurement-validation purpose and the O-2 §11 assumption register are for. Per O-2, even a successful P1 supports only operational category-error reduction on these option-guided task families — not philosophical completeness, safety, or open-ended detection.

## 6 — Next Executable Move

1. **Chief:** choose a model/provider and run budget (unblocks execution); fill and sign the margin charter (unblocks eventual unblinding). These are separable decisions and may come in either order.
2. **Sol & Fable, after model choice:** draft arm prompts; complete the O-2 §6.4 freeze (prompts, versions, cached evidence, analysis code + multiplicity + seed, decision rules); hash everything.
3. **Execute Stage 0** — 30 cases × 3 arms × ≥3 paired runs, outcomes blinded to margin setting — then power simulation and Stage 1 preregistration per O-2 §7.

---

*Assembled by Fable per the T-3 contract; Sol's final conceptual and implementation check (including a clean-environment re-run of all suites, independent trace replay, and two rounds of assembly corrections) is recorded in T-3 Coms 06–09.*
