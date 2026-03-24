# THINK-007 + THINK-008 OUTPUT
**Agent:** Claude (Think) → GPT (Act) via Gemini (Observe)
**Status:** IMPLEMENTED — both tasks executed directly by Claude (not delegated to GPT)
**Date:** 2026-03-13

---

## THINK-007: `[do-Calculus]` Terminology Cleanup — COMPLETE

### File Modified
`synthesis-engine/src/lib/services/causal-interventions.ts`

### Changes Made

**1. Line 2 header comment:**
- Old: `* Phase 28 Component 2: Causal Interventions Service (do-Calculus Approximation)`
- New: `* Phase 28 Component 2: Causal Interventions Service (Pyodide Interventional Simulation)`

**2. All `[do-Calculus]` console prefixes — 9 occurrences replaced:**
- Old: `[do-Calculus]`
- New: `[causal-interventions]`
- Lines affected (pre-edit): 61, 63, 64, 153, 169, 190, 193, 201, 216

### Verification
Post-edit grep for `do-[Cc]alculus` in the file returns exactly one hit — the LIMITATION section (line 11):
```
LIMITATION: This is NOT true do-calculus because:
```
This honest disclaimer is correct and was not touched.

### What Was Preserved
- LIMITATION section ("This is NOT true do-calculus") — correct claim discipline, unchanged
- `do(...)` notation in intervention strings (correct mathematical notation)
- All other `do-calculus` references outside this file (honest disclaimers, correct notation)

---

## THINK-008: API Route Handler `typedScm` Wiring — COMPLETE

### New File Created
**`synthesis-engine/src/lib/compute/scm-loader.ts`**

```typescript
export async function loadTypedSCM(
  modelKey: string,
  supabase: SupabaseClient
): Promise<TypedSCM | undefined>
```

Queries `scm_model_versions` for the active row matching `modelKey`, validates that `equations` is a non-empty typed array (not the legacy blob), and returns a `TypedSCM` or `undefined`. Never throws — fully graceful.

---

### Route 1: `causal-chat/route.ts` — ENGINE PATH ACTIVATED

**Import added (line 17):**
```typescript
import { loadTypedSCM } from '@/lib/compute/scm-loader';
```

**Before `buildCounterfactualTrace` at line ~902 (now ~910):**
```typescript
// Load TypedSCM for engine path (graceful — undefined if not available,
// falls back to heuristic_bfs_propagation)
const modelKey = scmContext.model?.modelKey;
const typedScm = modelKey
  ? await loadTypedSCM(modelKey, supabase)
  : undefined;
```

**Call site updated:**
```typescript
const trace = buildCounterfactualTrace(subjectScm, {
  // ...all existing args unchanged...
  observedWorld: {},
}, typedScm);  // ← third arg added
```

**Result:** When `scm_model_versions` has an active row with typed `equations[]` for the model, the engine path is now activated. `computation_method` in the persisted trace will be `structural_equation_solver` instead of `heuristic_bfs_propagation`.

---

### Route 2: `legal-reasoning/route.ts` — NO LOGIC CHANGE (comment only)

**Reason:** `legalSCM` is a hardcoded `LegalSCMTemplate`, not a DB model. No `scm_model_versions` row exists for the intent-action-harm DAG. Deliberately stays on BFS fallback for v1.0.

**Comment added before the call:**
```typescript
// typedScm not passed: legalSCM is a hardcoded LegalSCMTemplate, not a DB model.
// No scm_model_versions row exists for intent-action-harm. Stays on heuristic BFS path.
// v1.1 scope: author typed StructuralEquation[] for the legal DAG and load via loadTypedSCM().
```

---

### Route 3: `optimize-intervention/route.ts` — NO LOGIC CHANGE (comments only)

**Reason:** Both call sites use `buildEducationalScm(studentGraph)` — an in-memory `EducationalSCM` constructed from the student profile, not a row in `scm_model_versions`. No `modelKey` maps to typed equations in the DB. Deliberately stays on BFS fallback for v1.0.

**Comments added before each of the two call sites (lines ~282 and ~647):**
```typescript
// typedScm not passed: scm is built from in-memory EducationalSCM (buildEducationalScm),
// not loaded from scm_model_versions. Stays on heuristic BFS path.
// v1.1 scope: author typed StructuralEquation[] for the educational DAG.
```

---

## Summary of All Files Modified

| File | Change Type | Engine Path |
|---|---|---|
| `src/lib/services/causal-interventions.ts` | THINK-007: rename console prefixes + header | N/A |
| `src/lib/compute/scm-loader.ts` | NEW FILE: `loadTypedSCM()` helper | N/A |
| `src/app/api/causal-chat/route.ts` | Import + `loadTypedSCM` call + third arg | **ACTIVATED** |
| `src/app/api/legal-reasoning/route.ts` | Comment only, no logic | Stays on fallback (correct) |
| `src/app/api/education/optimize-intervention/route.ts` | Comments only, no logic (2 sites) | Stays on fallback (correct) |

---

## Verification Checklist for Gemini / GPT

1. **THINK-007 grep:** `grep -n "do-Calculus\|do-calculus" synthesis-engine/src/lib/services/causal-interventions.ts` → only the LIMITATION section should appear
2. **Benchmark suite:** `npx jest src/lib/compute/__tests__/structural-equation-solver.test.ts` — B1–B6 must still pass (no solver logic was modified)
3. **Engine path activation test:** Issue a causal-chat intervention query where the model has a valid `scm_model_versions` row with typed equations. Check `counterfactual_traces` DB table — `computation_method` should be `structural_equation_solver`
4. **Legal fallback preserved:** Issue a legal-reasoning query → `computation_method` should remain `heuristic_bfs_propagation`
5. **Call site audit:** `grep -rn "buildCounterfactualTrace" src/app/api/**/*.ts` → every call site should either pass `typedScm` OR have an explicit v1.1 fallback comment

---

## Claim Discipline Notes

- The engine bridge (`buildCounterfactualTrace` → `runCausalQuery`) was correctly wired by GPT in Phase 4
- The activation gap was that no production route caller ever passed `typedScm` → engine always fell through to BFS
- After THINK-008: `causal-chat` now attempts the engine path for any model with typed equations in DB
- `legal-reasoning` and `optimize-intervention` correctly stay on BFS — their SCMs are in-memory templates, not DB-typed models
- The distinction is architecturally sound: typed engine requires `StructuralEquation[]` in `scm_model_versions`; in-memory templates do not have this
