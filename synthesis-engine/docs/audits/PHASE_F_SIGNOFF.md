# Phase F Sign-off Checklist

**Project:** Cross-Cutting Scientific Infrastructure (Option A → C Upgrade)  
**Date:** 2026-02-14  
**Owner:** __________________  
**Reviewer:** __________________  

---

## A. API & Contract Stability

- [ ] `attachments?` is additive in Chat request schema
- [ ] Existing clients without attachments remain unaffected
- [ ] SSE scientific event contract documented and versioned:
  - [ ] `scientific_extraction_started`
  - [ ] `scientific_extraction_complete`
  - [ ] `scientific_extraction_failed`
- [ ] Each scientific SSE event includes `fileName` and stable minimal payload

---

## B. Input Limits & Safety

- [ ] Max PDFs/request enforced (recommended: `<= 3`)
- [ ] Max file size enforced (recommended: `<= 10MB` per file)
- [ ] Total attachment budget enforced (recommended: `<= 20MB`)
- [ ] Non-PDF attachments rejected or ignored with explicit warning
- [ ] Base64 decode failures handled gracefully (no route crash)

---

## C. Reliability & Graceful Degradation

- [ ] Per-file timeout enforced (recommended: 15–30s)
- [ ] Concurrency cap enforced for attachment processing (recommended: 2)
- [ ] Scientific-analysis failures do **not** fail core chat response
- [ ] Failure emits warning + `scientific_extraction_failed` event

---

## D. Prompt Budget Discipline

- [ ] Prompt injection uses compact summary (not full raw table dump)
- [ ] Summary includes key findings, counts, confidence distribution, warnings
- [ ] Prompt growth remains within agreed token budget

---

## E. Architecture Boundaries

- [ ] `chat-scientific-bridge.ts` remains thin orchestration only
- [ ] `epistemic-data-bridge.ts` is server-side only
- [ ] `live-epistemic-monitor.tsx` consumes evidence via API/server action (not direct DB bridge)
- [ ] No scientific persistence logic duplicated in routes/components

---

## F. Security & Privacy

- [ ] Admin Supabase client imports are server-only
- [ ] No service-role exposure in client bundles
- [ ] Logs avoid raw table payloads / attachment contents
- [ ] User-scoped evidence query access verified

---

## G. UI/UX Integration

- [ ] `ScientificTableCard` handles empty/malformed data safely
- [ ] Confidence badge + QA flags render correctly
- [ ] UI remains stable if scientific payload is missing/empty
- [ ] Visual style remains clean and minimal in chat flow

---

## H. Automated Test Gates

- [ ] Unit tests for `chat-scientific-bridge.ts` (decode, timeout, mapping, summary shaping)
- [ ] Unit tests for `epistemic-data-bridge.ts` (query filters, user scoping, mapping)
- [ ] Integration: Chat with attachments emits scientific SSE events
- [ ] Integration: Chat without attachments emits no scientific events (backward compatible)
- [ ] Integration: scientific failure path still returns assistant response
- [ ] `npx vitest run` passes
- [ ] `npx tsc --noEmit` passes

---

## I. Performance Gates

- [ ] P95 chat latency regression within agreed budget
- [ ] No sustained memory spikes on multi-PDF requests
- [ ] CPU usage remains bounded under concurrency cap

---

## Final Decision

- [ ] **APPROVED FOR RELEASE**
- [ ] **REQUIRES FIXES**

**Reviewer Notes:**

```

```

**Sign-off:** ___________________________  
**Date:** ________________________________
