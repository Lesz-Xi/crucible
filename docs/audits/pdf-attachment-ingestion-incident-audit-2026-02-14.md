# Comprehensive Audit Report: Chat PDF Attachment Ingestion Incident

**Date:** 2026-02-14  
**Scope:** `/api/causal-chat` + scientific attachment pipeline (extractors, ingestion, claim ledger, SSE)  
**Auditor:** Assistant (main session)  
**Status:** Mitigations shipped; one DB follow-up migration required

---

## Executive Summary

Chat attachment flow is now functionally wired and processing events are emitted, but quality and consistency issues were uncovered across runtime extraction and claim-ledger persistence.

### Primary outcomes

1. ✅ **Attach button + attachment payload wiring fixed** (frontend was initially non-functional).
2. ✅ **Hard runtime failures fixed** (detached `ArrayBuffer`, fragile PDF module loading).
3. ✅ **Attachment-first web grounding behavior enforced** (prevents unrelated web substitutions).
4. ✅ **Prose numeric extraction fallback shipped (v1 + v2)** for non-tabular journal PDFs.
5. ⚠️ **Behavioral inconsistency remains**: model sometimes says “no PDF uploaded” despite successful `scientific_extraction_*` events.
6. ⚠️ **Claim ledger insert failures observed** due DB check constraint mismatch for `scientific_provenance` evidence type.

---

## Incident Evidence (from runtime screenshots)

### Confirmed from EventStream

- `scientific_extraction_started` present
- `scientific_extraction_complete` present in later runs
- `web_grounding_failed` reason `attachment_mode` (expected under attachment-first policy)
- `claim_record_failed` with constraint violation on `claim_evidence_links`
- `complete` emitted successfully (request does not crash)

### Observed user-visible failures

- Earlier: module loading error while parsing PDF
- Mid: detached `ArrayBuffer` error
- Later: extraction completes but response text still claims no PDF uploaded

---

## Root Cause Analysis

## A) Frontend wiring gap (resolved)

**Issue:** Attach button was disabled and did not trigger file selection.  
**Impact:** No actual PDF payload reached route despite UI affordance.  
**Fix:** File input + attachment chips + serialization to API request.

## B) Extractor runtime fragility (resolved)

**Issue:** PDF parser module loading instability in runtime environments.  
**Impact:** Scientific extraction failed with module-load errors.  
**Fix:** Added resilient loader (`pdfjs` entrypoint fallback) and extraction fallback paths.

## C) Detached `ArrayBuffer` reuse (resolved)

**Issue:** Same `ArrayBuffer` consumed by multiple extraction stages, causing detached-buffer failure.  
**Impact:** Pipeline crashed before meaningful extraction.  
**Fix:** Clone buffer per extraction stage in ingestion pipeline.

## D) Stale completed ingestion reuse (resolved)

**Issue:** Completed ingestions could return stale/empty artifacts from previous bad runs.  
**Impact:** Repeated low-value outputs even after pipeline fixes.  
**Fix:** Reprocess completed ingestions with latest extractor pipeline.

## E) Extraction quality limits on formal journals (partially resolved)

**Issue:** Table-only assumptions miss many prose/figure-heavy research layouts.  
**Impact:** Low confidence, 0 tables, insufficient data points.
**Fix:** Added prose numeric extraction fallback v1 + v2 (ranges, slash metrics, metric-aware parsing).

## F) Prompt-level contradiction (“no PDF uploaded”) (partially resolved)

**Issue:** Model occasionally asserts no uploaded PDF despite authoritative ingestion events.  
**Cause:** Weakly enforced attachment-status instruction in final prompt context.  
**Fix shipped:** Added authoritative attachment-ingestion status + hard policy prohibiting “no upload” claims.

## G) Claim ledger constraint mismatch (open until migration applied)

**Issue:** App sends `evidence_type='scientific_provenance'`, but DB check constraint still allows old set only.  
**Impact:** `claim_record_failed` events; claim evidence links insertion fails.
**Fix prepared:** New migration to extend allowed evidence types.

---

## Changes Shipped (selected)

- `6829d4c` — wire attach button + send PDF attachments to chat API
- `52ffc5e` — preserve scientific summary when factual grounding appended
- `25405d7` — resilient pdfjs loading + attachment-first grounding enforcement
- `cceda7a` — unpdf fallback in extractors
- `d9f9547` — clone buffer to avoid detached `ArrayBuffer`
- `f6ec2ad` — prose numeric fallback v1
- `1216755` — prose numeric extractor v2
- `fcddc05` — reprocess completed ingestions (avoid stale empty cache)
- *(current)* prompt hardening against false “no PDF uploaded” claims

---

## New Artifacts in this audit cycle

- `supabase/migrations/20260214_claim_evidence_scientific_provenance.sql`  
  Adds `scientific_provenance` to `claim_evidence_links.evidence_type` check constraint.

---

## Remaining Risks

1. **Parser coverage risk:** PDFs with heavy figure-based metrics can still yield sparse numeric extraction.
2. **LLM compliance risk:** Despite hard prompt rules, model may still drift; should be guarded by post-generation assertion checks if strictness required.
3. **Operational drift risk:** If migration above is not applied in target DB, claim evidence insertion will continue failing.

---

## Recommended Next Steps (priority ordered)

1. **Apply migration immediately**
   - `20260214_claim_evidence_scientific_provenance.sql`
2. **Run one golden-path verification** with the exact problematic PDF:
   - confirm `scientific_extraction_complete`
   - confirm `complete.scientificAnalysis[0].summary`
   - confirm no “no PDF uploaded” claim in answer text
3. **Add deterministic post-generation guard**
   - If attachment count > 0 and answer contains `no PDF uploaded`, rewrite with authoritative correction block.
4. **Add extraction telemetry event** (recommended)
   - `scientific_extraction_debug` with markdown length, numeric count, first N values.

---

## Sign-off Assessment

- **System stability:** Improved substantially ✅
- **Functional path:** Working with degraded-quality fallback ✅
- **Trustworthiness:** Improved but not fully closed ⚠️
- **DB governance consistency:** Pending migration ⚠️

**Overall status:** **Near-ready with one required DB migration + one validation pass.**
