# Hybrid Verified Closure Spec
**Date:** 2026-03-03  
**Owner:** Chief / Hybrid Team  
**Status:** Superseded on 2026-03-08 by `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/specs/VCC-v2-masa-aligned-2026-03-08.md`

> Superseded notice (2026-03-08): This document is retained for historical context only.
> Active trust contract authority has moved to report-pipeline semantics in `synthesis-engine`.
> Do not use this spec for new implementation decisions.

---

## 1) Context
Hybrid has meaningful progress on evidence UX, claim lineage, and bridge endpoints, but there is a persistent trust gap between **"verified" labeling** and **runtime-grounded causal verification**.

### Existing strengths
- Evidence rail + run telemetry + claim lineage surfaced in Hybrid UI.
- Bridge endpoints exist for `simulate-verified` and `chat-verified`.
- Scientific integrity checklist logic exists (benchmark, lifecycle, deterministic trace provenance).

### Current gap (problem statement)
The system can emit outputs marked as `verified` while some verification inputs remain heuristic/mock-like or non-runtime-grounded. This creates **semantic overclaim risk** (verified in label > verified in evidence).

---

## 2) Gap Inventory (with code evidence)

1. **Heuristic scoring in `simulate-verified` (Phase-1 behavior)**  
   - File: `src/app/api/bridge/simulate-verified/route.ts`  
   - Current note indicates heuristic gap scoring intended to be backed by real data in Phase 2.

2. **Static/example-like evidence payload in `chat-verified`**  
   - File: `src/app/api/bridge/chat-verified/route.ts`  
   - Evidence entries include hardcoded sources/snippets, which should be replaced by live retrieval + run context.

3. **Mismatch risk between causal depth label and evidence tier**  
   - `causalDepth` can be provided/derived without strict gating against source quality and deterministic replay standards.

4. **No strict verification contract defining when `verified` is allowed**  
   - Need explicit rule set that blocks `verified` if minimum criteria are not met.

---

## 3) Target Outcome
Implement a **Verified Causal Contract (VCC)** so that `verified` outputs are only emitted when strict runtime-grounded criteria pass.

### Definition of Done (DoD)
A response is allowed to claim `causalDepth=verified` **only if all pass**:
1. Deterministic trace exists and replay succeeds.
2. Evidence sources meet minimum quality threshold (no demo/static placeholder as primary evidence).
3. Gap score is computed from real runtime artifacts and model state, not heuristic-only fallback.
4. Integrity checklist pass (or equivalent gate) returns pass for required checks.
5. Provenance bundle contains stable IDs linking query -> model version -> evidence -> trace.

If any condition fails, downgrade to `heuristic` + explicit warning.

---

## 4) Required Implementation

### A. Verification policy layer (new)
Create a shared service: `src/lib/services/verification-policy.ts`

Responsibilities:
- Evaluate verification eligibility.
- Return structured decision:
```ts
{
  allowVerified: boolean;
  failures: string[];
  evidenceTier: 'A' | 'B' | 'C';
  replayPass: boolean;
  tracePass: boolean;
  integrityPass: boolean;
}
```

### B. `simulate-verified` hardening
File: `src/app/api/bridge/simulate-verified/route.ts`

Changes:
1. Replace heuristic-only `gapScoreBreakdown` path with runtime data adapter.
2. Add strict fallback:
   - If runtime artifacts unavailable, emit `causalDepth='heuristic'`.
   - Include warning code: `VERIFIED_DOWNGRADED_RUNTIME_GAP`.
3. Attach `modelKey`, `modelVersion`, runtime trace refs in provenance.
4. Gate final `causalDepth` via verification policy layer.

### C. `chat-verified` evidence hardening
File: `src/app/api/bridge/chat-verified/route.ts`

Changes:
1. Replace static evidence array with retriever pipeline:
   - query-based retrieval from approved internal/traceable sources.
   - include evidence IDs + fetch timestamp.
2. Reject/flag placeholder evidence.
3. Apply same verification policy gate before setting `causalDepth='verified'`.
4. Add warning code: `VERIFIED_DOWNGRADED_EVIDENCE_TIER`.

### D. Shared response contract updates
Add consistent fields in both bridge responses:
- `verificationDecision`: object from policy layer
- `verificationFailures`: string[]
- `warningCodes`: string[]
- `evidenceTier`: A/B/C

### E. Integrity gate integration
- Reuse/bridge `scientific-integrity-service` outcomes where applicable.
- Ensure `verified` requires deterministic trace provenance pass.

---

## 5) Non-Functional Requirements
1. **No silent downgrade**: if verified fails, caller sees explicit reason.
2. **Determinism**: replay of same trace + version yields stable classification.
3. **Auditability**: every verified result references machine-resolvable trace/evidence IDs.
4. **Latency guardrail**: verification policy evaluation adds <= 150ms p95 overhead (excluding retrieval).

---

## 6) Test Plan

### Unit tests
1. Policy gate returns `allowVerified=false` when evidence tier below threshold.
2. Policy gate returns `allowVerified=false` when replay fails.
3. Policy gate returns `allowVerified=true` only when all required checks pass.

### Integration tests
1. `simulate-verified` with missing runtime artifacts -> downgraded to heuristic + warning code.
2. `chat-verified` with static/demo evidence -> downgraded.
3. End-to-end verified run includes full provenance links and no failure codes.

### Regression tests
- Existing clients parsing previous response shape continue to work (additive fields only).

---

## 7) Rollout Plan
1. Phase 1: Ship policy gate in shadow mode (log only, no blocking).
2. Phase 2: Enable enforcement for internal/staging.
3. Phase 3: Production enforce + dashboard tracking of downgrade reasons.

---

## 8) Success Metrics
1. `verified_without_policy_pass` = 0
2. `% verified responses with deterministic replay pass` >= 95%
3. `% downgraded due to evidence tier` trending downward week-over-week
4. Reduction in overclaim incidents (manual audit)

---

## 9) Risks & Mitigations
- **Risk:** Fewer responses labeled verified initially.  
  **Mitigation:** transparent downgrade reasons + iterative data connector completion.

- **Risk:** Retrieval outages increase heuristic downgrades.  
  **Mitigation:** cache recent trusted evidence packs + circuit breaker messaging.

---

## 10) Source Anchors
- `src/app/api/bridge/simulate-verified/route.ts`
- `src/app/api/bridge/chat-verified/route.ts`
- `src/lib/services/scientific-integrity-service.ts`
- `src/components/hybrid/HybridWorkbenchV2.tsx`
