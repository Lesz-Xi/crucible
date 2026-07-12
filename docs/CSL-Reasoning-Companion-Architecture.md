# CSL Reasoning Companion — Architecture (crucible fusion)

Status: Design (Phase B). Not yet implemented.
Created: 2026-07-12
Owner concept: `Cognitive_Sovereignty_Loop/New Plan/Cognitive-Sovereignty-Private-Reasoning-Companion-Spec.md`
Binding invariants source: `Cognitive_Sovereignty_Loop/architecture/Cognitive-Sovereignty-T1-Spec.md` §6–§7

> This document fuses the Cognitive Sovereignty Loop (CSL) "private reasoning companion" identity with crucible's existing claim/governance ledger. It reuses what crucible already has and specifies the **minimum additive** changes needed to carry CSL's epistemic discipline. It does not authorize a rewrite of the ledger.

## 1. Product identity (adopted)

> **A private reasoning companion for examining consequential claims before accepting, repeating, or acting on them.**

The user brings one bounded claim; the companion separates what a source *states* from what is *independently supported*, preserves uncertainty, records disconfirmation, and ends in one revisable private disposition — `unknown` included. The **non-attribution boundary is the product soul**: the surface never labels an actor or episode as FIMI, coordinated, foreign-linked, or intentional.

## 2. What crucible already provides (the reuse surface)

Crucible's `claim_reconstruction_ledger_v1` migration + `src/lib/services/claim-ledger-service.ts` already implement most of the CSL spine:

| Crucible artifact | Shape | CSL role it already fills |
|---|---|---|
| `claims` | `claim_text`, `claim_kind` (assertion/hypothesis/decision/verdict), `uncertainty_label` (low/medium/high/**unknown**), `status` (draft/emitted/retracted), `user_id` + RLS | The case's typed items and the `unknown` terminal state |
| `claim_evidence_links` | `evidence_type` (source/citation/…), `evidence_ref`, `snippet`, `reliability_score`, **`metadata` JSONB** | Evidence attached to a claim |
| `claim_counterfactual_tests` | `necessity_supported`, `sufficiency_supported`, `result_label` (supported/rejected/inconclusive) | **Disconfirmation** (necessity/sufficiency = falsifier machinery) |
| `claim_receipts` | `receipt_type` (**emission/revision/retraction**), `actor`, `receipt_json` | **Supersession/revision trail** (not erasure) |
| `claim_gate_decisions` | `gate_name`, `decision` (pass/fail/warn), `rationale` | Governance gates (host for the non-attribution guard) |

RLS is user-scoped, persistence is Supabase/Postgres, and `metadata`/`receipt_json` JSONB columns are additive extension points. This is ~70% of the CSL data contract already in production shape.

## 3. The three load-bearing gaps (the fusion's actual value)

A scan of all 45 migrations confirms crucible has **no** `assessment_scope`, **no** claim-relative source `independence`, and **no** epistemic-item kind beyond `assertion/hypothesis/decision/verdict`. These are precisely the CSL invariants that prevent overclaim:

1. **`assessment_scope`** — `source_statement` vs `world_claim` vs `personal_experience` (CSL Spec §6.5, FR-035, FR-014, validation rule 14). Without it, "the report *says* X" renders indistinguishably from "X is *independently true*." **This is the product soul; it is absent.**
2. **Evidence-link `relation` + `source_independence`** — `supports|contradicts|contextualizes` and `primary|independent|related_party|unknown`, claim-relative (CSL Spec §6.4, FR-032/033). Crucible's `reliability_score` is a scalar and does not encode independence relative to the target claim.
3. **Epistemic-item kind** — `observation | source_claim | inference | hypothesis | felt_state` (CSL Spec §6.2). Crucible's `claim_kind` cannot distinguish an observation from a source's assertion from the user's inference.

Also missing at the surface: a **`/claims` index route** — only `claims/[claimId]/page.tsx` exists (`/claims` returns 404). The ledger has no list view.

## 4. Integration strategy — additive, backward-compatible

**Principle (Senior Backend):** never disturb the contract that chat/hybrid/legal already rely on. Introduce CSL fields nullable/optional, defaulted so existing writes are unaffected. Two-stage rollout per field:

- **Stage 1 (zero-migration):** store CSL fields inside the existing `metadata` / `receipt_json` JSONB. The companion surface reads/writes them; other features ignore them.
- **Stage 2 (typed promotion):** once the surface exercises them, promote to nullable typed columns + CHECK constraints in a new migration (`add nullable → backfill from metadata → add constraint`). Never lock a populated table without a rollout.

| Field | Stage 1 (JSONB) | Stage 2 (typed column) | Tradeoff |
|---|---|---|---|
| `assessment_scope` | `claims.…` not available → store on evidence link `metadata.assessment_scope` at assessment time, or add a lightweight `claim_assessments` row in JSONB receipt | `ALTER TABLE claims ADD COLUMN assessment_scope TEXT NULL CHECK (...)` | JSONB = no migration, weaker query/validation; column = enforceable, indexable |
| evidence `relation` + `independence` | `claim_evidence_links.metadata.relation` / `.independence` | nullable columns on `claim_evidence_links` | Same tradeoff; independence is claim-relative so it belongs on the *link*, not the source |
| `epistemic_kind` | `claims.…` via `metadata`? No — `claims` has no metadata col → carry in `receipt_json` of the emission receipt, or add column | nullable `claims.epistemic_kind TEXT` (keep `claim_kind` untouched) | Adding a parallel column avoids repurposing `claim_kind`'s existing semantics |

**Recommendation:** ship the companion surface Stage-1 (JSONB) first to validate the flow with real claims, then promote the three fields to typed columns in one migration (`2026xxxx_csl_epistemic_scope_v1`) once the read/write paths are proven. Rationale: the surface, not the schema, is the risky unknown; prove it before committing DDL.

## 5. Companion flow → crucible primitives

One bounded claim = one `claims` row (`source_feature` extended to include `'companion'`, or reuse an existing value + `epistemic_kind`). Per stage:

1. **Choose the object / name the question** → create `claims` row (`status='draft'`, `claim_text`, `epistemic_kind` seeded).
2. **Separate layers** → for each distinct item, a `claims` row (or child item) tagged `epistemic_kind ∈ {observation, source_claim, inference, hypothesis, felt_state}`. Enforce: a `felt_state` item can never be the `from` side of a `supports` link to a `world_claim`.
3. **Ground the reading** → `claim_evidence_links` with `relation` + `independence` (Stage-1 in `metadata`). Reliability stays as-is. **Invariant:** a `source`-type link whose `independence='primary'` supports only an `assessment_scope='source_statement'` claim, never `world_claim`.
4. **Disconfirmation** → `claim_counterfactual_tests` (`necessity_supported`/`sufficiency_supported`) + a plain-language falsifier stored on the assessment. A material hypothesis with no falsifier cannot advance (FR-023).
5. **Private disposition** → a `claims` row `claim_kind='decision'` (disposition ∈ accept-limited/hold/investigate/reject/unknown/archive) + a `claim_receipts` `emission`. Revision → new decision + `receipt_type='revision'` referencing the prior (supersession, not erasure).

The compact "reasoning card" (Spec §7) is a read projection over these rows; the full ledger is progressive-disclosure only.

## 6. Invariant enforcement points

Defense in depth — enforce at three layers, not one:

1. **Service layer** (`claim-ledger-service.ts`): extend `RecordClaimInput`/`ClaimLedgerEvidenceInput` with optional `epistemicKind`, `assessmentScope`, `relation`, `independence`. Add a validator that rejects: (a) `felt_state → world_claim supports` links; (b) a `world_claim` assessment whose only support is a `primary`/`related_party` source; (c) synthesizing a coordination/foreign-nexus verdict into any actor label.
2. **DB constraints** (Stage 2): CHECK enums + a trigger asserting no `world_claim` assessment references only non-independent evidence.
3. **Surface**: the companion UI renders "Source says" and "Independently supported" as **distinct rows** (Spec §7) and shows `unknown` as an accepted disposition. Never a single merged "verified" badge.

The non-attribution guard lives as a named `claim_gate_decisions` gate (`gate_name='non_attribution'`) that fails any claim asserting actor coordination/intent/foreign-nexus without sufficient independent evidence — reusing crucible's existing gate machinery.

## 7. Surfaces to build (Phase C, sequenced)

1. **`/claims` index** (currently 404) — list view over `claim-ledger-service`, filter by `epistemic_kind`/`status`, entry point to `/claims/[claimId]`.
2. **Companion capture surface** — conversational, one-question-at-a-time, per-stage correctable "what I recorded" mirror, hidden ledger/progressive disclosure, exit at every step (Spec §9). Likely a new route (`/companion` or an `/epistemic` mode) writing through the extended service.
3. **Reasoning card** — the compact result projection (Spec §7 fields).

## 8. Personal-case ritual

Deferred and unvalidated. `epistemic_kind='felt_state'` remains representable, but no personal-case surface is built. No manufactured-episode gate. (Consistent with `Phase-0-Premise-Correction.md`.)

## 9. Build order & verification

1. Extend service types + validator (unit-tested: the three rejection rules). Verify: `npm run test`.
2. Stage-1 JSONB writes from a scripted fixture claim; confirm round-trip via `/claims/[claimId]`.
3. Build `/claims` index; verify it lists the fixture.
4. Build companion capture; walk one real bounded claim (e.g. a PCIJ statistic) end-to-end; confirm the card shows "source says" ≠ "independently supported" and permits `unknown`.
5. Promote the three fields to typed columns (migration + backfill); re-run `npm run validate:schemas` and `governance:claim-drift`.

**Acceptance:** a claim walkthrough where a `source_statement` never renders as independent confirmation of a `world_claim`, `unknown` is a first-class disposition, and no actor is labeled.

## 10. Risks / guardrails

- **Schema drift vs. governance tooling:** new fields must pass `validate:schemas`/`validate:consistency`; run them in CI before promotion.
- **Behavioral contract:** existing chat/hybrid/legal claim writes must be untouched — all new fields optional/nullable. Rollback = drop nullable columns (no data loss for existing features).
- **Product soul:** non-attribution is enforced in code (gate + validator), not left to UI copy.
- **RLS:** companion claims inherit `claims` RLS (user-scoped, private-by-default) — matches CSL "private by default."
