# p1-benchmark — P1 Typed-Warrant Advantage, Stage 0 Implementation Pack

**Authors:** Sol & Fable · **Contract:** O-2, *P1 Typed-Warrant Advantage — Benchmark Specification and Execution Contract* (2026-07-19) · **Theory under test:** BTEC (O-1)

This pack implements O-2 §10.2 steps 1–7: everything that can be built and verified **without a model, a provider choice, or Chief's margin-charter values**. It is a runnable benchmark scaffold, not an executed experiment. No arm has ever been run; no comparative outcome exists.

## Layout

```text
margin-charter-TEMPLATE.json   Chief-owned value slots (null = blocks outcome
                               unblinding, never interpreted as zero)
schemas/                       common-envelope + arm A / A+ / B (Draft 2020-12;
                               envelope open, arm schemas closed via
                               unevaluatedProperties:false)
validators/                    Arm B typed-invariant validators — SECONDARY
                               diagnostics only; pure; no answer-key access
cases/pilot/{formal,empirical,bridge}/   30 case inputs (10+10+10), option
                               menus included, NO gold fields
gold/                          per-case isolated answer keys: gold option,
                               total per-option kind maps, certificates,
                               claim_answerable / action_authorizable,
                               primary_eligible, expected_disposition
traces/                        3 frozen resolution-search transcripts (genuine
                               machine-generated derivations) for F4/F8/F9
scorer/primary.py              deterministic primary scorer:
                               case_id + selected_option -> frozen label;
                               arm-neutral; validator events cannot reach it
tests/                         test_acceptance.py (O-2 §10.3, 15 checks)
                               test_typed_invariants.py (8) · test_empirical_cases.py (7)
AUDIT-formal-bridge-gold-labels.md   certificate/label audit + resolutions
O-2-COMPLIANCE-MATRIX.md             pre-run ledger, per-artifact status
FREEZE-MANIFEST-CHECKLIST.json       sha256 inventory — NOT a freeze (see below)
```

## Running the checks (stdlib only, no network, no model)

```bash
python3 tests/test_acceptance.py        # 15 checks, exit 0 on pass
python3 tests/test_typed_invariants.py  # also: python3 -m tests.test_typed_invariants
python3 tests/test_empirical_cases.py
```

## Load-bearing conventions

1. **Primary scoring path:** `case_id + selected_option → frozen answer-key label`. Identical scoring code for arms A, A+, B. Free text, typed ledgers, and validator events are secondary diagnostics and are structurally unable to change the primary score (verified by tests 10.3-6/7).
2. **Answer-key isolation, not secrecy:** case inputs contain no gold vocabulary (tested); `gold/` is loaded only by scorer/test code; authors know the answers — real secrecy belongs to Stage 1 held-out generation.
3. **`resource_limit` discipline:** a timeout option is never scoreable as independence (test 10.3-1); certified independence requires an actual two-model witness with metatheory (F3, F7).
4. **`primary_eligible: false`** (E08) can never contribute a primary category error — enforced inside the scorer, not by convention.
5. **Pilot exclusion:** every pilot case ID is rejected by the confirmatory loader (test 10.3-8). Stage 0 data can never become confirmatory evidence.

## What blocks execution (deliberately)

| Blocker | Blocks | Owner |
|---|---|---|
| Margin-charter values + signature | comparative outcome **unblinding** | Chief |
| Model/provider + run-budget choice | Stage 0 **execution** | Chief |
| Arm prompts + infrastructure freeze | follows model choice | Sol & Fable, after the above |

`FREEZE-MANIFEST-CHECKLIST.json` records current sha256 hashes as a pre-freeze inventory. It is **not** the O-2 §6.4 freeze: the freeze additionally requires arm prompts, model/tool versions, analysis code, and the signed charter, none of which exist yet.
