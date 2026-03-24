# TASK-002 + TASK-003 Implementation Summary For Gemini Audit

**Date:** 2026-03-13  
**Agent:** Agent-01-GPT-Act  
**Task IDs:** TASK-002, TASK-003  
**Output Classification:** Implementation Summary for Audit  
**Status:** Implemented locally, pending Gemini verification

## Task Header

```text
Task Type: Implementation
Category: graph representation + graph mutilation execution
Spec Mapping: Causal Engine v1.0 / Section 4 (Graph Mutilation), Section 7 (Layer 3 / Computation Core)
Core or Non-Core: Core
Formal Artifact Expected: deterministic topological sort, DAG acyclicity validation, graph mutilation operator
Benchmark Impact: Required for B1-B6 (graph-operation prerequisite; no benchmark passes claimed yet)
Claim Boundary: Graph operations only. No forward solver, no numeric intervention execution, no pipeline integration.
Dependencies: TASK-001 typed SCM interfaces
```

## Executive Summary

Implemented the graph-operation phase in `synthesis-engine/src/lib/compute/structural-equation-solver.ts` and added unit coverage in `synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts`.

Delivered functions:

- `topologicalSort`
- `validateAcyclicScm`
- `mutilateGraph`

Claude's THINK-003 pseudocode was followed directly:

- all intervention variables are validated before any mutation starts
- incoming edges to intervention targets are removed
- intervention equations are replaced with constants
- the original `TypedSCM` is not mutated
- removed edges are collected for future `CausalResult.mutilatedEdges` population

## Files Changed

### Added

- `synthesis-engine/src/lib/compute/structural-equation-solver.ts`
- `synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts`

### Unchanged by this task

- `causal-solver.ts`
- `causal-blueprint.ts`
- route handlers
- benchmark files
- migrations
- deployment config

## Implemented Function Signatures

```ts
export function topologicalSort(nodes: string[], edges: DagEdge[]): string[]
export function validateAcyclicScm(scm: TypedSCM): string[]
export function mutilateGraph(
  scm: TypedSCM,
  interventions: Record<string, number>
): MutilatedGraphResult
```

Supporting exports:

```ts
export class GraphValidationError extends Error
export class MutilationError extends Error
export interface MutilatedGraphResult {
  scm: TypedSCM
  removedEdges: DagEdge[]
}
```

## Code Location Map

| Artifact | Location | Notes |
|---|---|---|
| Error types | `synthesis-engine/src/lib/compute/structural-equation-solver.ts:5-33` | Explicit codes for cycle/unknown-node and mutilation failures |
| Deterministic topological sort | `synthesis-engine/src/lib/compute/structural-equation-solver.ts:35-93` | Kahn-style traversal with tie-breaking by input node order |
| Acyclicity wrapper | `synthesis-engine/src/lib/compute/structural-equation-solver.ts:95-101` | TASK-002 validation entry point |
| Graph mutilation operator | `synthesis-engine/src/lib/compute/structural-equation-solver.ts:103-168` | Fail-all-or-succeed-all validation and constant-equation substitution |
| Unit tests | `synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts:1-226` | 9 tests covering deterministic order, cycle detection, deep copy, errors, and multi-intervention behavior |

## Implementation Details

### Deterministic Topological Sort

- Uses indegree counting and outgoing adjacency lists
- Preserves deterministic ordering by using the input `nodes` order as the tie-breaker
- Throws `GraphValidationError` with:
  - `CYCLE_DETECTED`
  - `UNKNOWN_NODE_REFERENCE`

This satisfies TASK-002 without introducing solver logic.

### DAG Validation

- `validateAcyclicScm` is a thin wrapper around `topologicalSort`
- Success returns the topological order
- Failure throws immediately

### Graph Mutilation

`mutilateGraph` follows Claude's pseudocode with explicit fail-all-or-succeed-all behavior:

1. Validate every intervention variable exists in `scm.dag.nodes`
2. Validate every intervention variable has a structural equation
3. Perform a true structural clone of the SCM
4. Remove all edges where `edge.to === interventionVariable`
5. Replace the matching equation with:

```ts
{
  variable: X,
  parents: [],
  coefficients: {},
  intercept: x
}
```

6. Return the cloned SCM plus the collected `removedEdges`

### Deep Copy Handling

Deep copying is done with:

```ts
const clonedScm = structuredClone(scm) as TypedSCM;
```

This clones:

- `variables`
- `equations`
- `dag.nodes`
- `dag.edges`

The tests explicitly confirm the returned SCM is not the same object as the original, and that the original DAG/equations remain unchanged after mutilation.

### Why `mutilateGraph` Returns `removedEdges`

Claude's implementation notes called out that removed incoming edges should be collected for later `CausalResult.mutilatedEdges` population. To avoid recomputing provenance later, `mutilateGraph` returns:

- `scm`: the mutilated deep copy
- `removedEdges`: the exact edges removed during Step 3a

This is a narrow extension of the pseudocode, not a change in mutilation semantics.

## Test Coverage Added

Unit tests cover:

- deterministic topological order for tied roots
- cycle detection
- unknown-node edge detection
- `validateAcyclicScm` success path
- single-intervention mutilation
- multi-intervention mutilation
- precise error on variable missing from DAG
- precise error on missing equation
- empty-intervention degenerate case returning an unchanged deep copy

## Verification Evidence

### Targeted Test Run

Command:

```bash
npx vitest run src/lib/compute/__tests__/structural-equation-solver.test.ts
```

Result:

- `1` test file passed
- `9` tests passed

### Compile

Command:

```bash
npx tsc --noEmit --pretty false
```

Result:

- Passed with exit code `0`

### Full Test Suite

Command:

```bash
npx vitest run
```

Result:

- Test files: `53 passed`
- Tests: `347 passed`, `1 skipped`

## Notation and LLM Boundary Check

Command used:

```bash
rg -n "P\(Y\s*\|\s*do|P\(Y\|do|causal inference|OpenAI|Anthropic|Google AI|prompt|completion|chat\.completions|responses\.create" \
  synthesis-engine/src/lib/compute/structural-equation-solver.ts \
  synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts
```

Result:

- No matches

Interpretation:

- no probabilistic notation introduced in the touched files
- no LLM hooks or prompt construction in the computation path

## L1-L4 Review

### L1 Impact

- New compute module for graph operations
- No render-tree changes
- No route-contract changes
- No persistence logic changes

### L2 Risk

- Low to moderate
- New shared compute module, but isolated and unit-tested
- No existing runtime integration touched yet
- Errors are explicit rather than silent

### L3 Calibration

- Minimal runtime cost
- Pure in-memory graph operations
- Deterministic and synchronous

### L4 Gaps

- No migration required
- No env vars required
- No manual deployment step required for this patch
- Existing repo-level migration/deployment follow-ups from session handoff remain unresolved and unaffected

## Claim Boundary Audit

### What this task does claim

- DAG acyclicity validation now exists via deterministic topological sort
- Graph mutilation now exists as executable code
- Original SCM inputs are preserved via deep copy
- Removed incoming edges are captured for future result provenance

### What this task does not claim

- no forward substitution solver yet
- no benchmark B1-B6 pass claims yet
- no `CausalResult` runtime assembly yet
- no `causal-solver.ts` integration yet
- no deprecation of `propagateIntervention()` runtime behavior yet

## Benchmark Impact

This task is necessary for all benchmarks but does not complete any benchmark end-to-end.

| Benchmark | Status After TASK-002/003 | Reason |
|---|---|---|
| B1 | Closer | Mutilation now severs confounder path into treatment |
| B2 | Closer | Topological order + root override now available |
| B3 | Closer | Forward graph order available, solver still missing |
| B4 | Closer | Fork mutilation behavior now implemented |
| B5 | Closer | Multi-intervention mutilation now implemented |
| B6 | Closer | Deterministic topological order now implemented |

Current honest capability statement:

> Graph mutilation implemented, not yet benchmarked end-to-end.

## Recommended Gemini Audit Procedure

### 1. Verify Code Surface

Inspect:

- `synthesis-engine/src/lib/compute/structural-equation-solver.ts`
- `synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts`

Confirm:

- `topologicalSort` exists and is deterministic
- `validateAcyclicScm` exists
- `mutilateGraph` validates before mutating
- `mutilateGraph` replaces equations with constants
- `removedEdges` are collected

### 2. Re-run Verification

```bash
cd synthesis-engine
npx tsc --noEmit --pretty false
npx vitest run src/lib/compute/__tests__/structural-equation-solver.test.ts
npx vitest run
```

### 3. Re-run Boundary Checks

```bash
rg -n "P\(Y\s*\|\s*do|P\(Y\|do|causal inference" \
  synthesis-engine/src/lib/compute/structural-equation-solver.ts \
  synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts

rg -n "OpenAI|Anthropic|Google AI|prompt|completion|chat\.completions|responses\.create" \
  synthesis-engine/src/lib/compute/structural-equation-solver.ts \
  synthesis-engine/src/lib/compute/__tests__/structural-equation-solver.test.ts
```

Expected outcome:

- zero matches

## Suggested Gemini Classification

If the checks above pass, the most precise classification is:

- **Mathematically Advancing**
- **Needs Benchmarking**
- **Core graph-operations phase complete, solver phase still pending**
