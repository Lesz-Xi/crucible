# Grounding Relevance Failure Audit + Remediation Plan (2026-03-07)

## Scope
Systematic audit of causal-chat web grounding path for failure mode:
- Topically irrelevant sources returned for historical query
- Trigger confidence reported as 1.00
- No downstream rejection of mismatch

Workflow basis: `/Users/lesz/Documents/Synthetic-Mind/.agent/workflows/Demis-Workflow.md` (planning_mode: lite)

---

## Session Bootstrap Evidence
- Executed: `bash /Users/lesz/Documents/Synthetic-Mind/.agent/scripts/agent-bootstrap.sh`
- Reviewed:
  - `.agent/state/session-handoff.json`
  - `.agent/state/session-handoff.md`
- `critical_gaps.user_action_required`: none

---

## Code Audit Evidence (Files)
1. `src/lib/services/chat-fact-trigger.ts`
2. `src/lib/services/chat-web-grounding.ts`
3. `src/app/api/causal-chat/route.ts`
4. `src/types/chat-grounding.ts`
5. `src/components/causal-chat/ChatWorkbenchV2.tsx`

---

## Findings (Root Cause, Confirmed in Code)

### F1 — Imperative-token entity capture (primary)
In `chat-fact-trigger.ts`:
- Entity extraction uses capitalized token matcher: `ENTITY_CANDIDATE = /\b([A-Z][a-zA-Z0-9]+...)\b/g`
- Stop list excludes `"Do"`
- For prompts starting with `"Do ..."`, token `Do` becomes normalized entity

Impact:
- False entity enters grounding pipeline.

### F2 — Query synthesis amplifies false entity
In `chat-web-grounding.ts`:
- `buildQueries(question, entities)` emits:
  - original question
  - `${entity} founder`
  - `${entity} creator`
- With false entity `Do`, generated queries include:
  - `Do founder`
  - `Do creator`

Impact:
- Search engine receives intent-corrupt queries; retrieves `Do`-named entities.

### F3 — No topical relevance gate before returning sources
In `chat-web-grounding.ts`:
- Dedupes by `domain|title`, but no semantic or lexical topicality check against user subject entities.
- Returns top-K raw deduped results.

Impact:
- Off-topic results are passed as grounding evidence.

### F4 — Confidence function is quantity/diversity-biased, not relevance-grounded
In `assessFactualConfidence(question, sources)`:
- Score boosts for source count + unique domains.
- Direct mention check uses first token of question:
  - `question.toLowerCase().split(" ")[0]`
- If question begins with `Do`, any title/snippet containing `Do` raises confidence.

Impact:
- Wrong evidence can still score high confidence (false assurance).

### F5 — Missing contract tests for this failure class
No dedicated tests found for:
- imperative-token collision
- query synthesis safety
- relevance gating
- confidence calibration under adversarial lexical collisions

Impact:
- Regression risk remains high.

---

## L1–L4 (Demis Lite)

### L1 Impact (Dataflow/API/UI)
- Service logic changes in `chat-fact-trigger.ts` and `chat-web-grounding.ts`
- SSE payload additions from `causal-chat/route.ts` (non-breaking additive)
- UI messaging update in `ChatWorkbenchV2.tsx` for confidence provenance

### L2 Risk
- Potential under-triggering if stopword/entity filters become too strict
- Potential drop in source count due to relevance threshold
- Must avoid breaking current SSE event consumers

### L3 Calibration
- Relevance gate adds CPU cost (lexical/Jaccard + optional embedding rerank)
- Keep latency budget: <= +150ms p95 on grounding path (without external embedding API)

### L4 Gaps (human follow-up)
- Optional if semantic reranker requires new env key (e.g., embedding provider)
- If no new external deps, no manual env action required

---

## Structured Fix Plan (Phase-Gated)

## Phase 1 — Query Safety + Entity Hygiene
### Changes
1. Add imperative stop-entities (at minimum): `Do`, `Search`, `Find`, `Tell`, `Give`, `Show`, `Explain`.
2. Add positional heuristic: ignore first-token imperative verb when followed by action phrase (`web/search/look up/check`).
3. Add minimum entity quality rule: reject entities shorter than 3 chars unless in allowlist.
4. Restrict founder/creator expansion to organization/person candidates only.

### Acceptance Criteria
- Prompt `"Do a web search about Alexander..."` does not yield entity `Do`.
- Generated query set always includes topic-preserving form (`Alexander ...`) and excludes imperative-only expansions.

## Phase 2 — Relevance Gate (Hard Block)
### Changes
1. Add post-retrieval topicality scoring per result:
   - lexical overlap with extracted subject entities + key nouns
   - title/snippet/domain checks
2. Drop results below threshold; return structured reject reasons.
3. Enforce minimum topicality coverage for final list; if unmet, return `grounding_failed` with `reason: low_topical_relevance`.

### Acceptance Criteria
- Off-topic `Do` entities are filtered out.
- Grounding returns empty + explicit warning when no relevant evidence is found.

## Phase 3 — Confidence Recalibration (No fake precision)
### Changes
1. Replace first-token mention logic with subject-entity coverage metric.
2. Confidence requires both:
   - source diversity and
   - topical relevance convergence.
3. Add confidence guardrails:
   - cap confidence to `low` when relevance coverage < threshold
   - expose reasons in SSE payload

### Acceptance Criteria
- Irrelevant sources cannot produce `high` confidence.
- Confidence rationale references relevance metrics, not just source count.

## Phase 4 — Provenance + Explainability
### Changes
1. Add query provenance payload:
   - `rawQuestion`
   - `normalizedEntities`
   - `generatedQueries`
   - `filteredOutCount` + reasons
2. Persist grounding audit metadata with each session turn.

### Acceptance Criteria
- Every displayed source is auditable to generated query + topicality score.

## Phase 5 — Test Suite + Regression Harness
### Add tests
1. `chat-fact-trigger.test.ts`
   - imperative-token collision cases
2. `chat-web-grounding.test.ts`
   - query generation safety
   - relevance filter behavior
   - confidence calibration
3. route-level tests for SSE events in `causal-chat`

### Acceptance Criteria
- Reproduction fixture for Alexander query fails pre-fix and passes post-fix.
- CI includes these tests.

---

## Non-Negotiable Contracts Check
- Determinism: deterministic query generation + deterministic relevance thresholds
- Provenance: every source linked to query and scoring path
- Graceful degradation: if grounding fails relevance gate, core response still returns with explicit uncertainty
- SSE: additive events only

---

## Execution Order (Recommended)
1. Phase 1 + Phase 2 in one PR (stops active harm quickly)
2. Phase 3 second PR (confidence calibration)
3. Phase 4 + 5 third PR (provenance hardening + regression safety)

---

## Hard Gates Before Sign-off
1. `npx tsc --noEmit`
2. `npx vitest run`
3. New contract tests for grounding/query/confidence
4. Manual runtime check: Alexander prompt returns only topical sources or explicit low-relevance failure
5. Graceful degradation check: missing/failed search does not break core answer path

---

## Risk Register
- Over-filtering may hide weak but useful sources → mitigate with threshold tuning + fallback explanation.
- Entity extraction may miss valid short entities (e.g., "AI") → allowlist and domain-specific exceptions.
- Latency increase from reranking → start with lightweight lexical scorer; gate semantic reranker behind feature flag.

---

## Proposed Immediate Next Action
Implement **Phase 1 + Phase 2** behind feature flag `CHAT_WEB_GROUNDING_RELEVANCE_GATE_V1=true`, with reproduction tests for the Alexander/"Do" collision case.
