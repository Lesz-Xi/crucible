# TASK-005-006 Implementation Summary For Gemini Audit

**Date:** 2026-03-13  
**Agent:** Agent-01-GPT-Act  
**Task ID:** TASK-005-006  
**Output Classification:** Implementation Summary for Audit  
**Status:** Implemented locally, pending Gemini verification and human migration application

## Task Header

```text
Task Type: Implementation + Overclaim Cleanup
Category: Engine integration bridge, trace routing, claim-discipline correction
Spec Mapping: Causal Engine v1.0 / Section 7 (integration), Section 10 (failure paths), Section 12 (claim discipline)
Core or Non-Core: Core
Formal Artifact Expected:
  - runCausalQuery bridge
  - buildCounterfactualTrace engine path
  - legacy heuristic claim cleanup
  - deterministic trace metadata in persisted trace_json
Benchmark Impact: indirect; solver reused from TASK-004, no new math benchmark family
Claim Boundary:
  - engine path is deterministic TypedSCM compute only
  - fallback path remains heuristic BFS propagation
  - no claim that runtime DB migration has been applied
Dependencies: TASK-001, TASK-002/003, TASK-004
```

## Executive Summary

Implemented the formal bridge from `TypedSCM + CausalQuery` into the deterministic solver, then wired `buildCounterfactualTrace()` to use that bridge when a typed model is available.

At the same time, I corrected the legacy heuristic path so it no longer presents BFS propagation as formal do-calculus:

- new bridge file: `runCausalQuery()`
- `buildCounterfactualTrace()` now has two explicit paths:
  - engine path: `structural_equation_solver`
  - fallback path: `heuristic_bfs_propagation`
- `CounterfactualTrace` now carries additive deterministic metadata:
  - `affectedNodes`
  - `evaluationOrder?`
  - `traceValues?`
  - `note?`
- legacy heuristic surfaces were relabeled and deprecated rather than removed
- persistence schema alignment was added as a new SQL migration

## Files Changed

### Added

- `synthesis-engine/src/lib/compute/causal-engine-bridge.ts`
- `synthesis-engine/src/lib/compute/__tests__/causal-engine-bridge.test.ts`
- `synthesis-engine/src/lib/services/__tests__/counterfactual-trace.test.ts`
- `synthesis-engine/supabase/migrations/20260313150000_counterfactual_trace_method_alignment.sql`

### Modified

- `synthesis-engine/src/types/scm.ts`
- `synthesis-engine/src/lib/services/counterfactual-trace.ts`
- `synthesis-engine/src/lib/services/causal-solver.ts`
- `synthesis-engine/src/lib/ai/causal-blueprint.ts`
- `synthesis-engine/src/lib/services/identifiability-gate.ts`
- `synthesis-engine/src/lib/services/benchmark-service.ts`
- `synthesis-engine/src/lib/services/scientific-integrity-service.ts`
- `synthesis-engine/src/lib/services/causal-literacy.ts`
- `synthesis-engine/src/app/api/causal-chat/route.ts`
- `synthesis-engine/src/app/api/legal-reasoning/route.ts`
- `synthesis-engine/src/app/api/education/optimize-intervention/route.ts`
- `synthesis-engine/src/app/api/scm/counterfactual-traces/[traceId]/__tests__/route.test.ts`
- `synthesis-engine/src/app/api/legal-reasoning/__tests__/route.test.ts`
- `synthesis-engine/src/lib/services/__tests__/scientific-integrity-service.test.ts`
- `synthesis-engine/scripts/verify-trace-persistence.ts`
- `synthesis-engine/src/lib/governance/causal-method-selection.ts`
- `synthesis-engine/src/lib/services/scm-retrieval.ts`

## Formal Artifacts Implemented

### 1. `runCausalQuery()` bridge

Location:

- `synthesis-engine/src/lib/compute/causal-engine-bridge.ts`

Exports:

```ts
export class EngineQueryError extends Error
export function runCausalQuery(typedScm: TypedSCM, query: CausalQuery): CausalResult
```

Behavior:

- `observational` query:
  - calls `forwardSolve(typedScm, outcome, conditions)`
  - returns empty `mutilatedEdges`
- `interventional` query:
  - calls `mutilateGraph()`
  - calls `forwardSolve()` on the mutilated copy
  - returns removed incoming edges for provenance
- unsupported query types throw `EngineQueryError("UNSUPPORTED_QUERY_TYPE")`

### 2. `buildCounterfactualTrace()` dual path

Location:

- `synthesis-engine/src/lib/services/counterfactual-trace.ts`

Updated signature:

```ts
buildCounterfactualTrace(
  scm: StructuralCausalModel,
  input: BuildCounterfactualTraceInput,
  typedScm?: TypedSCM
): CounterfactualTrace
```

Behavior:

- when `typedScm` is present:
  - runs deterministic engine path
  - method = `structural_equation_solver`
  - uncertainty = `none`
  - captures `evaluationOrder`
  - captures `traceValues`
  - stores filtered `affectedNodes`
  - computes `actualOutcome` from `observedWorld[outcome]` when present
  - otherwise computes the natural-world value with an observational engine query
- when `typedScm` is absent:
  - preserves fallback call chain:
    - `scm.queryCounterfactual()`
    - `scm.queryIntervention()`
  - method = `heuristic_bfs_propagation`
  - note explicitly labels the result as BFS heuristic only

### 3. `CounterfactualTrace` type expansion

Location:

- `synthesis-engine/src/types/scm.ts`

Changes:

- `CounterfactualComputationMethod`
  - removed `deterministic_graph_diff`
  - added `heuristic_bfs_propagation`
  - kept `structural_equation_solver`
- `CounterfactualUncertainty`
  - added `none`
- `CounterfactualTrace.computation`
  - renamed `affectedPaths` -> `affectedNodes`
  - added optional `evaluationOrder`
  - added optional `traceValues`
  - added optional `note`

## Claim-Discipline Corrections

### Legacy heuristic relabeling

In `synthesis-engine/src/lib/ai/causal-blueprint.ts`:

- `queryAssociation()` estimand now uses `path_weight(...)`
- `queryIntervention()` is marked deprecated for formal interventional claims
- `queryIntervention()` estimand now uses an explicit heuristic label
- `queryCounterfactual()` is marked deprecated for formal counterfactual claims
- `queryCounterfactual()` estimand now uses explicit heuristic comparison language
- `checkIdentifiability()` was renamed to `checkConfounderCoverage()`
- `propagateIntervention()` gained a deprecation guard comment

In `synthesis-engine/src/lib/services/causal-solver.ts`:

- class and method comments no longer claim do-calculus implementation
- `generateDoPrompt()` is marked as a fallback LLM narrative path
- prompt text now explicitly states formal structural equations are not loaded there

### Supporting call-site updates

- intervention-gate code now calls `checkConfounderCoverage()`
- benchmark expectations were updated to the new honest estimand strings
- route and test fixtures now use `heuristic_bfs_propagation`
- stale `Do-Calculus` user-facing/comment strings in touched source were scrubbed

## Persistence and Schema Alignment

### New migration

Location:

- `synthesis-engine/supabase/migrations/20260313150000_counterfactual_trace_method_alignment.sql`

Purpose:

- allow `heuristic_bfs_propagation` as a persisted `computation_method`
- allow `none` as a persisted `uncertainty`
- preserve compatibility with legacy rows that still contain `deterministic_graph_diff`

Important:

- I created the migration file locally
- I did **not** apply it to a live Supabase project from this environment

## L1-L4 Review

### L1 Impact

- compute layer: new bridge entry point
- trace service: deterministic engine path added
- types: trace metadata and method vocabulary changed
- persistence contract: new trace_json shape and method values

### L2 Risk

- fallback trace JSON shape changed from `affectedPaths` to `affectedNodes`
- persisted writes will fail unless the new migration is applied
- older DB rows may still contain legacy method values in stored JSON artifacts

### L3 Calibration

- engine path is pure local TypeScript compute
- no LLM calls in `runCausalQuery()`
- no additional external I/O in compute path

### L4 Gaps

**HUMAN FOLLOW-UP REQUIRED**

1. Apply the new SQL migration:

```bash
supabase db push
```

Or apply the specific file:

```bash
supabase migration up --include-all
```

2. Verify the deployed database now accepts:

- `computation_method = 'heuristic_bfs_propagation'`
- `uncertainty = 'none'`

3. Perform one runtime persistence/readback check against the real environment for:

- fallback heuristic trace persistence
- deterministic engine trace persistence

I could not complete those runtime checks from this local environment.

## Verification Evidence

### Compile

```bash
npx tsc --noEmit --pretty false
```

Result:

- passed

### Focused tests

```bash
npx vitest run src/lib/compute/__tests__/causal-engine-bridge.test.ts \
  src/lib/services/__tests__/counterfactual-trace.test.ts \
  src/lib/compute/__tests__/structural-equation-solver.test.ts \
  src/lib/services/__tests__/scientific-integrity-service.test.ts \
  'src/app/api/scm/counterfactual-traces/[traceId]/__tests__/route.test.ts' \
  'src/app/api/legal-reasoning/__tests__/route.test.ts'
```

Result:

- test files: `6 passed`
- tests: `38 passed`

### Full suite

```bash
npx vitest run
```

Result:

- test files: `55 passed`
- tests: `366 passed`, `1 skipped`

## Grep Audit

Executed against `synthesis-engine/src`:

```bash
rg -n "Rung 2/3|Do-Calculus|derive the consequences.*structural equations|Y_x\\(|deterministic_graph_diff" src
```

Result:

- no matches

## Honest Capability Statement

Smallest honest statement after TASK-005/006:

> The codebase now has a formal `runCausalQuery()` bridge and a deterministic `buildCounterfactualTrace()` engine path for `TypedSCM` inputs, while the legacy fallback path is explicitly labeled as heuristic BFS propagation. Local compile and tests are green, but live DB migration application and runtime persistence verification remain human follow-up items.

## Recommended Gemini Audit Procedure

1. Verify `runCausalQuery()` does not call any LLM or prompt surface.
2. Verify `buildCounterfactualTrace()` selects engine vs fallback solely on `typedScm` presence.
3. Verify fallback outputs are labeled `heuristic_bfs_propagation`, not formal causal solve.
4. Verify `CounterfactualTrace` metadata is additive and consistent with persisted JSON.
5. Verify migration coverage for `computation_method` and `uncertainty`.
6. Verify no remaining `deterministic_graph_diff` or `Do-Calculus` overclaims remain in `src/`.
7. Verify no claim is made that live migration/runtime persistence has already been completed.
