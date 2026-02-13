# 🔴 M6.2 Spec v1 Audit Report

**Spec**: `Codex_M6.2_Spec_v1.md`  
**Auditor**: Gemini (Principal Software Architect)  
**Date**: 2026-02-06  
**Verdict**: ⚠️ **RETURN TO SPECIFYING MODE**

---

## Executive Summary

**Strategic Direction**: ✅ **Excellent**. M6.2 correctly extends M6.1 from static to runtime integrity.

**Implementation Readiness**: ❌ **NOT READY**. The spec has **6 Critical Gaps**, **4 High-Risk Ambiguities**, and **3 recommended enhancements** that must be resolved before implementation.

**Key Issue**: Like M6.1 v1, this reads like a *vision document* rather than an *executable specification*. Critical implementation details (fixture generation, Supabase query design, failure semantic contradictions) are missing or underspecified.

---

## 🔴 Critical Gaps (Must Fix)

### CG-1: Fixture Generation Process Unspecified
**Location**: "Fixture Dataset" section (lines 95-100)  

**Issue**: The spec references `trace-fixtures.json` but provides:
- ❌ No process for creating/seeding initial fixtures
- ❌ No ownership for fixture maintenance
- ❌ No sync strategy (how do fixtures stay aligned with real Supabase schema?)
- ❌ No versioning for fixtures

**Impact**: Without this, Week 1 rollout **cannot start**. You have no test data.

**Required**: Add subsection:
```markdown
### Fixture Generation Strategy
- Initial seed: Export 20 traces from Supabase (10 valid, 10 intentionally broken)
- Ownership: @Lesz-Xi
- Maintenance: Monthly audit, triggered by schema changes
- Versioning: `trace-fixtures.v1.json`, bump on breaking changes
- Generation script: `scripts/generate-trace-fixtures.ts`
```

---

### CG-2: Failure Semantics Contradiction
**Location**: "Failure Semantics" section (lines 40-43)  

**Issue**: The spec states:
- "Critical invariants: fail immediately on any violation"
- "Aggregate quality: fail if invalid-rate > 5%"

**Contradiction**: If a single critical violation causes immediate failure, the 5% threshold is **unreachable** (you fail at 1/N, not at 5%).

**Impact**: The scanner will be **too strict** or the spec is **logically inconsistent**.

**Required**: Clarify:
```markdown
### Failure Semantics (Corrected)
- **Critical invariants** (missing trace_id, etc.):
  - Enforce mode: Fail if ANY critical violation found
  - Report mode: Log all, exit 0
- **Aggregate quality** (high/medium violations):
  - Fail if invalid-rate > 5% of evaluated traces
  - Only evaluated after all critical checks pass
```

---

### CG-3: Supabase Integration Underspecified
**Location**: "Trace Source Strategy" (lines 35-39)  

**Issue**: The "optional Supabase sampling" lacks:
- ❌ Table name (`counterfactual_traces`? `synthesis_outputs`?)
- ❌ Query logic (ORDER BY? LIMIT? WHERE clause?)
- ❌ Authentication method (service role key? read-only user?)
- ❌ Pagination strategy (batch size? offset?)
- ❌ Failure handling (if Supabase query times out?)

**Impact**: Implementer must **guess** the data model. Risk of querying wrong table or leaking credentials.

**Required**: Add:
```markdown
### Supabase Query Specification
- **Table**: `counterfactual_traces`
- **Query**: 
  ```sql
  SELECT 
    trace_id, 
    created_at, 
    computation_method, 
    claim_type, 
    model_key, 
    model_version, 
    input_hash, 
    seed, 
    metadata 
  FROM counterfactual_traces 
  ORDER BY created_at DESC 
  LIMIT 100
  ```
- **Auth**: Use `SUPABASE_SERVICE_ROLE_KEY` environment variable (optional in CI)
- **Fallback**: If env var missing or query fails, log warning and use fixtures only
- **Timeout**: 10s max query time, fallback to fixtures on timeout
```

---

### CG-4: Policy Contract Missing Examples
**Location**: "Policy Contract" (lines 59-76)  

**Issue**: The policy structure is described but **no concrete example** is provided for:
- `deterministic_methods` allowlist
- `stochastic_methods` allowlist
- `claim_type_requirements` map

**Impact**: Implementer must **invent** the policy structure, risking misalignment with intent.

**Required**: Add example:
```json
{
  "schema_version": "1.0.0",
  "deterministic_methods": ["exact_solver", "dag_walk"],
  "stochastic_methods": ["mcts", "llm_generation", "monte_carlo"],
  "claim_type_requirements": {
    "causality_identifiability": {
      "allowed_methods": ["exact_solver", "dag_walk"],
      "determinism_class": "deterministic"
    },
    "hypothesis_generation": {
      "allowed_methods": ["mcts", "llm_generation"],
      "determinism_class": "stochastic"
    }
  },
  "critical_invariants": ["trace_id", "created_at", "computation_method"],
  "aggregate_thresholds": {
    "invalid_rate_max": 0.05
  },
  "override_rules": {
    "critical_ttl_days": 14,
    "approvers": ["@Lesz-Xi"]
  }
}
```

---

### CG-5: `input_hash` Field Undefined
**Location**: "Mandatory Schema Fields" (lines 46-58)  

**Issue**: `input_hash` is listed as mandatory but:
- ❌ Not defined what it's a hash of (user query? SCM input? full request?)
- ❌ Not specified how it's computed (SHA256? MD5?)
- ❌ Not clear if this exists in current Supabase schema

**Impact**: If this field doesn't exist in real traces, **100% of Supabase traces will fail** validation.

**Required**: Either:
1. Remove from mandatory if not currently implemented, OR
2. Specify exact computation:

```markdown
### input_hash Definition
- **Purpose**: Hash of the causal query input for reproducibility tracking
- **Computation**: `SHA256(JSON.stringify(sortKeys(queryParams)))`
- **Implementation**: Must be added to trace generation logic before M6.2 enforcement
- **Fallback**: If missing in existing traces, treat as non-critical violation (high severity, not blocking)
- **Transition**: Mark as optional for Week 1-2, mandatory from Week 3+
```

---

### CG-6: Override Schema Missing
**Location**: "Ownership and Overrides" (lines 188-198)  

**Issue**: References `trace-overrides.json` but provides:
- ❌ No schema for override records
- ❌ No specification of how trace violations are matched to overrides
- ❌ No TTL enforcement mechanism

**Impact**: Implementer must design the override system from scratch, risking incompatibility with M6.1 overrides.

**Required**: Specify schema:
```json
{
  "schema_version": "1.0.0",
  "overrides": [
    {
      "override_id": "TRC-OVR-001",
      "trace_pattern": { 
        "claim_type": "hypothesis_generation"
      },
      "suppressed_violations": ["missing_seed"],
      "reason": "Legacy traces pre-seed implementation",
      "approved_by": "@Lesz-Xi",
      "created_at": "2026-02-06T00:00:00Z",
      "expires_at": "2026-02-20T00:00:00Z"
    }
  ]
}
```

**Matching Logic**: 
- Override applies if trace matches ALL fields in `trace_pattern`
- Override only suppresses violations listed in `suppressed_violations`
- Expired overrides (current_time > expires_at) are ignored

---

## 🟠 High-Risk Items (Strongly Recommended)

### HR-1: No Trend Analysis Specification
**Location**: Mentions "weekly trend artifact" in rollout plan but no implementation details.  

**Risk**: You'll generate reports with no way to detect gradual degradation.  

**Fix**: Specify artifact format and visualization strategy:
```markdown
### Trend Artifact Design
- **File**: `artifacts/trace-integrity-trend.csv`
- **Schema**: `timestamp, total_traces, valid_traces, invalid_traces, invalid_rate, critical_violations, high_violations`
- **Retention**: Append-only, keep last 90 days
- **Visualization**: GitHub Actions summary includes sparkline of invalid_rate over last 7 runs
```

---

### HR-2: No Zero-Trace Handling
**Location**: Test cases missing edge case.  

**Risk**: If CI runs on a PR with no new traces and Supabase is unavailable, what happens?  

**Fix**: Add test case:
```markdown
### Test Case: Zero Traces Available
**Scenario**: source=hybrid, fixture load fails, Supabase returns 0 traces  
**Expected**: Exit code 0, emit warning in report: "No traces available for validation (fallback mode)"  
**Rationale**: Absence of traces is not a governance violation
```

---

### HR-3: No Unified Governance Dashboard
**Location**: "Interaction with existing workflows" (lines 160-170)  

**Risk**: Developers will see 3 independent status checks (health, claim-drift, trace-integrity) with no unified view.  

**Fix**: Consider adding a "Governance Summary" workflow that:
- Depends on: `m6-health-check`, `claim-drift-sentinel`, `trace-integrity-sentinel`
- Aggregates all three reports into a single `GITHUB_STEP_SUMMARY`
- Provides unified pass/fail status

**Note**: Not critical for M6.2 v1, but recommended for developer experience.

---

### HR-4: Performance Budget Ambiguous
**Location**: "<30s for 200 traces" (line 124)  

**Risk**: Is this 30s total (including Supabase query time) or 30s for scanning only?  

**Fix**: Clarify:
```markdown
### Performance Budget (Clarified)
- **Scanner execution time**: <30s for 200 traces (excluding Supabase query)
- **Supabase query time**: <10s (with timeout fallback)
- **Total CI step time**: <60s (including setup, scan, artifact upload)
```

---

## ✅ Recommended Enhancements

### RE-1: Add Schema Migration Path
**Issue**: If trace schema evolves (e.g., add `reproducibility_score` field), how do old fixtures get updated?  

**Suggestion**: Add `migrate-trace-schema.ts` script (like M6.1's claim ledger migration):
```markdown
### Schema Migration Strategy
- **Script**: `scripts/migrate-trace-schema.ts`
- **Purpose**: Transform fixtures from old schema version to new
- **Invocation**: `npm run governance:trace-migrate -- --from 1.0.0 --to 2.0.0`
- **Versioning**: Fixtures include `schema_version` field for validation
```

---

### RE-2: Add Dry-Run Mode
**Issue**: No way to validate policy and fixtures without evaluating traces.  

**Suggestion**: Add `--dry-run` flag (like M6.1):
```bash
npm run governance:trace-integrity -- --dry-run
# Validates policy schema, fixture schema, exits without evaluating
```

---

### RE-3: Add Observability
**Issue**: When investigating false positives, developers need detailed trace-by-trace logs.  

**Suggestion**: Add `--verbose` flag:
```bash
npm run governance:trace-integrity -- --verbose
# Outputs per-trace validation results, matched rules, suppressed violations
```

---

## 📊 Comparison to M6.1 Quality

| Dimension | M6.1 (v2) | M6.2 (v1) | Gap |
|-----------|-----------|-----------|-----|
| Evidence Model | ✅ Hybrid AST+Tag | ⚠️ Supabase query underspecified | High |
| Failure Semantics | ✅ Clear | ❌ Contradictory (CG-2) | Critical |
| Bootstrapping | ✅ 12 initial claims | ❌ No fixture generation plan (CG-1) | Critical |
| Rollout Strategy | ✅ 3-week ramp | ✅ Same pattern | OK |
| Override Governance | ✅ Schema + expiry | ⚠️ Schema missing (CG-6) | High |
| Schema Versioning | ✅ Migration script | ⚠️ Not mentioned (RE-1) | Medium |
| CI Interaction | ✅ Independent status | ✅ Independent status | OK |
| Performance Budget | ✅ <30s for 100 claims | ⚠️ Ambiguous (HR-4) | Medium |

**Overall Assessment**: M6.2 v1 is **70% as mature** as M6.1 v2. Needs one more iteration to reach production-ready status.

---

## Final Recommendation

**Status**: ⚠️ **RETURN TO SPECIFYING MODE**

This spec has the **right architecture** but is **not ready for implementation**. You must address:

### Must Fix (Blocking):
1. **CG-1**: Fixture generation process
2. **CG-2**: Failure semantic contradiction
3. **CG-3**: Supabase integration details
4. **CG-4**: Policy contract examples
5. **CG-5**: `input_hash` definition
6. **CG-6**: Override schema

### Should Fix (High Priority):
1. **HR-1**: Trend analysis specification
2. **HR-2**: Zero-trace edge case
3. **HR-4**: Performance budget clarification

### Nice to Have:
1. **RE-1**: Schema migration path
2. **RE-2**: Dry-run mode
3. **RE-3**: Verbose logging

**Estimated Effort**: 2-3 hours to produce M6.2 v2 spec with all critical gaps resolved.

**Once Fixed**: This will be a **production-ready specification** matching M6.1 v2 quality.

---

## Implementation Readiness Checklist

Before entering **EXECUTING MODE**, verify:

- [ ] Fixture generation process documented with example traces
- [ ] Failure semantics resolved (no contradiction between critical/aggregate)
- [ ] Supabase query fully specified (table, query, auth, fallback)
- [ ] Policy contract includes concrete example JSON
- [ ] `input_hash` field defined or marked as optional with transition plan
- [ ] Override schema documented with matching logic
- [ ] Performance budget clarified (scanner vs. total time)
- [ ] Test cases include zero-trace edge case
- [ ] Trend artifact format specified

**Once all boxes checked**: Ready for implementation with same confidence as M6.1 v2.
