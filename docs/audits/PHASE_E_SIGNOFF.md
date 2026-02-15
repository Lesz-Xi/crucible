# Phase E Sign-off Checklist

**Project:** Automated Scientist → Hybrid Synthesis Integration  
**Date:** 2026-02-14  
**Owner:** __________________  
**Reviewer:** __________________  

---

## A. Contract & API Shape

- [ ] `DefaultScientificAnalysisService` implemented in `src/lib/science/scientific-analysis-service.ts`
- [ ] Service uses shared pipeline (`runIngestionPipeline`) without route-level duplication
- [ ] Response contract fields present:
  - [ ] `ingestionId`
  - [ ] `status` (`completed|partial|failed`)
  - [ ] `summary.tableCount`
  - [ ] `summary.trustedTableCount`
  - [ ] `summary.dataPointCount`
  - [ ] `computeRunId?`
  - [ ] `reasoningGraph?`
  - [ ] `warnings[]`
- [ ] Hybrid SSE `complete` payload includes:
  - [ ] `scientificAnalysis: ScientificAnalysisResponse[]`
  - [ ] `featureContext: "hybrid"`

---

## B. Reliability & Graceful Degradation

- [ ] Scientific-analysis failures do **not** fail the overall hybrid synthesis request
- [ ] Failed analysis returns `status: "failed"` + actionable warning
- [ ] Per-file timeout guard implemented
- [ ] Abort/cancel handling verified (no hanging promises)

---

## C. Performance & Concurrency

- [ ] Scientific analysis runs in parallel with existing PDF extraction
- [ ] Concurrency cap applied for multi-PDF uploads (recommended 2–3)
- [ ] No LLM-token increase caused by scientific-analysis path
- [ ] P95 latency regression within budget (target: ≤ +10%)

---

## D. Provenance & Claim Ledger

- [ ] `ProvenanceReference` type added and wired
- [ ] Evidence lineage includes:
  - [ ] `ingestionId`
  - [ ] `sourceTableIds[]`
  - [ ] `dataPointIds[]`
  - [ ] `computeRunId?`
  - [ ] `methodVersion`
- [ ] Claim linkage failures degrade gracefully (warning only)

---

## E. Observability

- [ ] Structured logs emitted per analyzed file:
  - [ ] `fileName`
  - [ ] `durationMs`
  - [ ] `status`
  - [ ] `warningsCount`
- [ ] Request-level summary log emitted:
  - [ ] `pdfCount`
  - [ ] `completed/partial/failed counts`

---

## F. Automated Verification

- [ ] `scientific-analysis-service.test.ts` passes
- [ ] Hybrid route test validates `scientificAnalysis` in SSE completion envelope
- [ ] `npx vitest run` passes
- [ ] `npx tsc --noEmit` passes

---

## G. Manual Verification

- [ ] Single PDF upload returns `scientificAnalysis[0].status`
- [ ] Mixed-quality PDFs produce expected warnings for low-confidence extraction
- [ ] `computeRunId` and provenance IDs are persisted and queryable
- [ ] Client/UI remains stable if `scientificAnalysis` is empty or missing

---

## Final Decision

- [ ] **APPROVED FOR RELEASE**
- [ ] **REQUIRES FIXES**

**Reviewer Notes:**

```

```

**Sign-off:** ___________________________  
**Date:** ________________________________
