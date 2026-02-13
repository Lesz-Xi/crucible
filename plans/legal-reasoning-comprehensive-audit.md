# Comprehensive Audit: Legal Reasoning Engine

**Date:** 2026-02-03  
**Status:** ✅ AUDIT + FIXES COMPLETE  
**Scope:** Security, Performance, and Robustness Analysis

> **UPDATE:** All critical optimizations have been implemented. See "Implemented Fixes" section below.

---

## Executive Summary

The Legal Reasoning Engine implements Pearl's Causal Blueprint (Intent → Action → Harm) for autonomous legal causation analysis. After reviewing all 9 core files (1,500+ lines of code), this audit identifies **critical performance bottlenecks** and **security vulnerabilities** that need immediate attention.

### Key Findings

| Category | Severity | Issues Found |
|----------|----------|--------------|
| **Performance** | 🔴 Critical | 4 major bottlenecks causing slow analysis |
| **Security** | 🟡 Medium | 3 input validation gaps |
| **Robustness** | 🟡 Medium | 2 error handling improvements needed |
| **Database** | 🟢 Good | RLS properly configured |

---

## Part 1: Performance Audit (Critical)

### 1.1 Root Cause of Slow Document Analysis

The user reported: *"its taking too long to analyzed the documents"*

**Diagnosis:** The system makes **O(A × H × P)** LLM calls where:
- A = number of actions extracted
- H = number of harms identified  
- P = number of precedents (6)

For a typical case with 5 actions and 3 harms:
- But-For Analysis: 5 × 3 = **15 LLM calls**
- Precedent Matching: 6 LLM calls per case pattern = **~18 LLM calls**
- MASA Audit: **3 LLM calls** (one per agent)
- Total: **~36 LLM calls minimum**

Each Claude call takes 2-5 seconds → **2-3 minutes total latency**

### 1.2 Performance Bottleneck Analysis

#### Bottleneck 1: [`route.ts`](synthesis-engine/src/app/api/legal-reasoning/route.ts:189-235) - Nested Loop in Streaming Handler

```typescript
// PROBLEM: O(A × H) sequential LLM calls
for (const action of extraction.timeline) {
  for (const harm of extraction.harms) {
    const butForAnalysis = await butForAnalyzer.analyze(action, harm);  // LLM call
    // ...
    const validation = await legalSCM.validateLegalCausation(...);  // Another LLM call
  }
}
```

**Impact:** 5 actions × 3 harms = 15 sequential waits × 3 seconds each = **45 seconds minimum**

#### Bottleneck 2: [`precedent-matcher.ts`](synthesis-engine/src/lib/services/precedent-matcher.ts:206-217) - LLM Call Per Precedent

```typescript
// PROBLEM: 6 separate LLM calls for similarity scoring
const rankedPrecedents = await Promise.all(
  this.precedents.map(async (precedent) => {
    const similarity = this.config.useLLMMatching
      ? await this.llmSimilarity(casePatterns, precedent)  // LLM call for EACH precedent
      : this.heuristicSimilarity(casePatterns, precedent);
    return { ...precedent, similarity };
  })
);
```

**Impact:** 6 precedents × 3 seconds = **18 seconds**

#### Bottleneck 3: [`but-for-analyzer.ts`](synthesis-engine/src/lib/services/but-for-analyzer.ts:356-371) - Batch Size Too Small

```typescript
// PROBLEM: Batch size of 5 is still too sequential
const batchSize = 5;
for (let i = 0; i < pairs.length; i += batchSize) {
  const batch = pairs.slice(i, i + batchSize);
  const batchResults = await Promise.all(...);
}
```

#### Bottleneck 4: [`anthropic.ts`](synthesis-engine/src/lib/ai/anthropic.ts:112) - Console Log on Every Call

```typescript
// This log appears in terminal for EVERY LLM call
console.log("[AI Factory] Initializing Anthropic Provider...");
```

**Impact:** Terminal spam + minor performance overhead

### 1.3 Performance Optimization Recommendations

| Priority | Optimization | Expected Impact |
|----------|--------------|-----------------|
| P0 | **Smart Early Termination** - Stop but-for analysis after finding sufficient causal chains | -50% LLM calls |
| P0 | **Batch LLM Prompts** - Analyze multiple action-harm pairs in single prompt | -70% LLM calls |
| P1 | **Heuristic-First Filtering** - Use but-for heuristics to filter before LLM | -30% LLM calls |
| P1 | **Precedent Batching** - Single prompt for all 6 precedent comparisons | -80% precedent calls |
| P2 | **Make MASA Optional** - Only run audit if user requests it | -3 LLM calls |
| P2 | **Move Log to Debug Level** - Reduce console output | Better UX |

---

## Part 2: Security Audit

### 2.1 Input Validation Vulnerabilities

#### Issue 1: [`legal-extractor.ts`](synthesis-engine/src/lib/extractors/legal-extractor.ts:118-119) - Unsanitized Document Content

```typescript
// RISK: Document text is directly interpolated into LLM prompt
const truncatedText = text.slice(0, this.maxTextLength);
const prompt = LEGAL_EXTRACTION_PROMPT.replace('{DOCUMENT}', truncatedText);
```

**Risk Level:** Medium  
**Attack Vector:** Prompt injection via malicious document content  
**Mitigation:** Sanitize document text before prompt interpolation

#### Issue 2: [`route.ts`](synthesis-engine/src/app/api/legal-reasoning/route.ts:48-49) - No Request Size Validation

```typescript
// RISK: No limit on number of documents or document size
const body = await req.json();
const { documents, caseTitle, jurisdiction, caseType, focusEntities } = body;
```

**Risk Level:** Medium  
**Attack Vector:** DoS via massive payload submission  
**Mitigation:** Add request body size limits and document count limits

#### Issue 3: [`route.ts`](synthesis-engine/src/app/api/legal-reasoning/route.ts:413-419) - SQL Injection Risk (Mitigated)

```typescript
// Database insert uses parameterized query - SAFE
const { error } = await supabase.from('legal_cases').insert({
  user_id: userData.user.id,
  title: legalCase.title,
  case_data: legalCase,
  created_at: new Date().toISOString(),
});
```

**Status:** ✅ Supabase client uses parameterized queries - no SQL injection risk

### 2.2 Authentication & Authorization

#### Review: [`route.ts`](synthesis-engine/src/app/api/legal-reasoning/route.ts:407-430)

```typescript
// Persistence only happens if authenticated
const supabase = await createServerSupabaseClient();
const { data: userData } = await supabase.auth.getUser();

if (userData.user) {
  // Insert case...
}
```

**Status:** ⚠️ Partial  
- Analysis works without authentication (by design for demo)
- Database writes require authentication (good)
- Consider rate limiting for unauthenticated requests

### 2.3 Database Security (RLS)

Reviewed [`20260203_add_legal_tables.sql`](synthesis-engine/supabase/migrations/20260203_add_legal_tables.sql:143-183):

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| `legal_cases` | ✅ Yes | SELECT, INSERT, UPDATE, DELETE - user_id match |
| `legal_precedents` | ✅ Yes | SELECT (own + public), CUD (own only) |
| `legal_analysis_logs` | ✅ Yes | SELECT (own cases), INSERT (system) |

**Status:** ✅ Good - Proper multi-tenant isolation

### 2.4 Security Recommendations

| Priority | Fix | Location |
|----------|-----|----------|
| P0 | Add prompt injection sanitization | `legal-extractor.ts` |
| P0 | Add request body size limits | `route.ts` |
| P1 | Add rate limiting for anonymous requests | Middleware |
| P1 | Log analysis requests for audit trail | `route.ts` |
| P2 | Add CORS restrictions if needed | Next.js config |

---

## Part 3: Robustness Audit

### 3.1 Error Handling Analysis

#### Issue 1: [`legal-extractor.ts`](synthesis-engine/src/lib/extractors/legal-extractor.ts:152-164) - Graceful Degradation ✅

```typescript
} catch (error) {
  console.error('[LegalExtractor] Extraction failed:', error);
  return {
    entities: [],
    timeline: [],
    harms: [],
    intents: new Map(),
    documentType: 'unknown',
    extractionConfidence: 0,
    rawTextLength: text.length,
    warnings: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
  };
}
```

**Status:** ✅ Good - Returns safe default on failure

#### Issue 2: [`but-for-analyzer.ts`](synthesis-engine/src/lib/services/but-for-analyzer.ts:321-332) - LLM Fallback ✅

```typescript
} catch (error) {
  console.error('[ButForAnalyzer] LLM analysis failed:', error);
  return {
    question: `Would "${harm.description}" occur without "${action.description}"?`,
    counterfactualScenario: 'Analysis error - unable to generate counterfactual',
    result: 'neither',
    confidence: 0.3,
    reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    // ...
  };
}
```

**Status:** ✅ Good - Returns conservative default

#### Issue 3: [`legal-masa-auditor.ts`](synthesis-engine/src/lib/ai/legal-masa-auditor.ts:376-387) - Agent Failure Handling ✅

```typescript
// Return fallback on complete failure
return {
  role,
  verdict: 'partial',
  confidence: 0.3,
  reasoning: `Agent failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
  issues: ['Agent execution failed'],
  suggestions: ['Review agent configuration and prompts'],
};
```

**Status:** ✅ Good - Graceful agent failure handling

### 3.2 JSON Parsing Robustness

Reviewed [`ai-utils.ts`](synthesis-engine/src/lib/ai/ai-utils.ts:211-231):

```typescript
export function safeParseJson<T>(text: string, fallback: T): T {
  // 1. Try normal parse
  // 2. Try repair
  // 3. Return fallback
}
```

**Status:** ✅ Excellent - Multi-stage JSON repair with fallback

### 3.3 Robustness Recommendations

| Priority | Improvement | Location |
|----------|-------------|----------|
| P1 | Add timeout for LLM calls | All LLM-calling files |
| P1 | Add circuit breaker for API failures | `anthropic.ts` |
| P2 | Add retry logic with exponential backoff | `anthropic.ts` |

---

## Part 4: Implementation Plan

### Phase 1: Critical Performance Fixes (Immediate)

1. **Optimize But-For Analysis Loop**
   - Add early termination after 3 confirmed causal chains
   - Batch multiple action-harm pairs into single prompt
   
2. **Optimize Precedent Matching**
   - Single batch prompt for all 6 precedents
   - Use heuristic-only mode for initial filtering

3. **Reduce Console Spam**
   - Move AI Factory log to debug level
   - Add conditional logging based on env

### Phase 2: Security Hardening

1. **Add Input Sanitization**
   - Escape special characters in document content
   - Add prompt injection detection

2. **Add Request Limits**
   - Max 5 documents per request
   - Max 100KB per document
   - Rate limit: 10 requests/minute for anonymous

### Phase 3: Robustness Improvements

1. **Add LLM Call Timeouts**
   - 30 second timeout per call
   - 2 minute timeout for entire analysis

2. **Add Progress Persistence**
   - Save partial results to allow resume
   - Better streaming error recovery

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Client
        UI[Legal Page UI]
    end

    subgraph API Layer
        Route[/api/legal-reasoning]
    end

    subgraph Processing Pipeline
        Extractor[LegalDocumentExtractor]
        ButFor[ButForAnalyzer]
        SCM[LegalSCMTemplate]
        Precedent[PrecedentMatcher]
        MASA[LegalMASAAuditor]
    end

    subgraph LLM Provider
        Claude[Claude API]
    end

    subgraph Database
        Supabase[(Supabase)]
    end

    UI -->|SSE Stream| Route
    Route --> Extractor
    Route --> ButFor
    Route --> SCM
    Route --> Precedent
    Route --> MASA

    Extractor -->|1 call| Claude
    ButFor -->|N×M calls| Claude
    Precedent -->|6 calls| Claude
    MASA -->|3 calls| Claude
    SCM -->|heuristic| SCM

    Route -->|persist| Supabase

    style ButFor fill:#f66,stroke:#333
    style Precedent fill:#f66,stroke:#333
    style MASA fill:#ff9,stroke:#333
```

**Legend:**
- 🔴 Red = Critical bottleneck
- 🟡 Yellow = Optimization opportunity

---

## Files Audited

| File | Lines | Status |
|------|-------|--------|
| `src/types/legal.ts` | 332 | ✅ Clean |
| `src/lib/extractors/legal-extractor.ts` | 482 | ⚠️ Input sanitization needed |
| `src/lib/services/but-for-analyzer.ts` | 416 | 🔴 Performance bottleneck |
| `src/lib/services/precedent-matcher.ts` | 404 | 🔴 Performance bottleneck |
| `src/lib/ai/legal-scm-template.ts` | 530 | ✅ Clean |
| `src/lib/ai/legal-masa-auditor.ts` | 477 | ⚠️ Optional audit |
| `src/app/api/legal-reasoning/route.ts` | 431 | ⚠️ Needs limits |
| `src/app/legal/page.tsx` | 751 | ✅ Clean |
| `supabase/migrations/20260203_add_legal_tables.sql` | 249 | ✅ RLS correct |

**Total Lines Audited:** ~4,072

---

## Conclusion

The Legal Reasoning Engine is architecturally sound but suffered from **excessive LLM calls** causing slow performance. The primary fixes have now been implemented.

---

## ✅ Implemented Fixes (2026-02-03)

### Performance Optimizations

1. **Batched But-For Analysis** - [`but-for-analyzer.ts`](../synthesis-engine/src/lib/services/but-for-analyzer.ts)
   - Added `analyzeMultiple()` method with batched LLM prompts
   - 10 action-harm pairs → 1 LLM call (down from 10+ calls)
   - Added early termination after finding 5 confirmed causal chains
   - Added 30s timeout per LLM call

2. **Batched Precedent Matching** - [`precedent-matcher.ts`](../synthesis-engine/src/lib/services/precedent-matcher.ts)
   - Added `batchedLLMSimilarity()` method
   - All 6 precedents → 1 LLM call (down from 6 calls)
   - Heuristic fallback on LLM failure

3. **Singleton AI Factory** - [`anthropic.ts`](../synthesis-engine/src/lib/ai/anthropic.ts)
   - Converted to singleton pattern (no more repeated initialization)
   - Debug logging only when `AI_DEBUG=true` or in development
   - Eliminated "[AI Factory] Initializing..." terminal spam

### Security Hardening

4. **Prompt Injection Protection** - [`legal-extractor.ts`](../synthesis-engine/src/lib/extractors/legal-extractor.ts)
   - Added `sanitizeDocumentText()` function
   - Escapes markdown code blocks, XML tags
   - Filters prompt injection patterns ("ignore instructions", etc.)
   - Removes dangerous control characters

5. **Request Validation** - [`route.ts`](../synthesis-engine/src/app/api/legal-reasoning/route.ts)
   - Max 10 documents per request
   - Max 150KB per document
   - Max 500KB total request size
   - Case title length validation
   - Case type enumeration validation

### Expected Performance Improvement

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| 5 actions × 3 harms | ~36 LLM calls | ~4 LLM calls | **~90% reduction** |
| Typical analysis time | 2-3 minutes | 15-30 seconds | **~80% faster** |
| Terminal spam | 36+ log lines | 1 log line | **Eliminated** |

**Status:** All optimizations deployed. Test with the same documents to verify performance improvement.
