# PHASE GROUNDING HARDENING SIGNOFF — 2026-03-07

## Scope Signed Off
- Phase 1 (query/entity hygiene)
- Phase 2 (topical relevance gate)
- Hardening extension: confidence calibration + provenance diagnostics

## Architecture Contract Check
- Service boundary respected: grounding logic remains in service layer (`chat-web-grounding.ts`), route orchestrates and emits events.
- Deterministic compute: query generation + lexical topicality threshold deterministic for identical inputs.
- Provenance: additive `web_grounding_provenance` event provides query/filter diagnostics.
- Graceful degradation: no relevant sources -> structured `web_grounding_failed`; core chat path continues.
- SSE compatibility: additive event only, no breaking payload changes.

## Acceptance Criteria Mapping
1. Imperative token collision blocked ✅
2. Query expansions no longer overfit to `founder/creator` ✅
3. Off-topic results filtered by topicality threshold ✅
4. Empty filtered set emits explicit failure reason ✅
5. Confidence cannot inflate on weak topical alignment ✅
6. Regression tests added for collision, filtering, confidence, diagnostics ✅

## Verification Evidence
- `npx vitest run src/lib/services/__tests__/chat-fact-trigger.test.ts src/lib/services/__tests__/chat-web-grounding.test.ts`
  - Passed: 2 files, 6 tests
- `npx tsc --noEmit`
  - Not green due to existing type-def noise in workspace (`TS2688` implicit type libs with suffixed names), pre-existing and not introduced by this change.

## Risk Review
- Over-filter risk: medium; mitigated by modest threshold and explicit failure message.
- Under-recall risk: low-medium; follow-up tuning should use replay corpus.
- Latency impact: low (lightweight lexical scoring only).

## Human Follow-up Required
- None for runtime behavior.
- Optional infra hygiene: clean workspace TypeScript type-definition pollution to restore `tsc` hard gate.
