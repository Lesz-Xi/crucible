# Task 001 — Type the SCM Representation

## Task Header

```
Task ID: TASK-001
Task Type: Implementation
Category: variable/model representation + structural equation representation
Spec Mapping: Causal Engine v1.0 / Section 4 (Minimal Mathematical Requirements)
Core or Non-Core: Core
Formal Artifact Expected: TypedSCM, StructuralEquation, CausalQuery interfaces in src/types/scm.ts
Benchmark Impact: Enables B1–B6 (none pass yet — this is infrastructure)
Claim Boundary: Types only. No computation, no graph operations, no solver.
Dependencies: None — this is the first task
Acceptance Criteria: See below
```

## Context

The current codebase has `structuralEquationsJson: Array<Record<string, unknown>>` — an untyped blob. This task replaces it with typed interfaces that the rest of the engine depends on.

## What to Implement

### 1. `StructuralEquation` interface

```typescript
/**
 * A linear structural equation: V = intercept + sum(coefficient_i * parent_i)
 * v1.0 scope: linear only. Nonlinear deferred to v1.1.
 */
interface StructuralEquation {
  /** The variable this equation defines */
  variable: string;
  /** Parent variables (direct causes) in the DAG */
  parents: string[];
  /** Coefficient for each parent: { parentName: coefficient } */
  coefficients: Record<string, number>;
  /** Constant term (intercept). Includes absorbed exogenous effect (U_i = 0) */
  intercept: number;
}
```

### 2. `TypedSCM` interface

```typescript
/**
 * A fully specified Structural Causal Model for v1.0.
 * Deterministic (U_i = 0), linear, acyclic, no hidden confounders.
 */
interface TypedSCM {
  /** All variables in the model with metadata */
  variables: SCMVariable[];
  /** One structural equation per endogenous variable */
  equations: StructuralEquation[];
  /** The causal DAG */
  dag: {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
  };
}
```

### 3. `CausalQuery` interface

```typescript
/**
 * A formal causal query for the v1.0 engine.
 * v1.0 supports: observational and interventional.
 * Adjustment queries are deferred to v1.1.
 */
interface CausalQuery {
  type: 'observational' | 'interventional';
  /** The intervention variable (for interventional queries) */
  treatment: string;
  /** The outcome variable to compute */
  outcome: string;
  /** The value to set the treatment to: do(treatment = doValue) */
  doValue: number;
  /** Optional conditioning: compute Y_{do(X=x)} given Z=z */
  conditions?: Record<string, number>;
}
```

### 4. `CausalResult` interface

```typescript
/**
 * The result of a v1.0 engine computation.
 * Returns a deterministic point value, not a distribution.
 */
interface CausalResult {
  /** The computed value: Y_{do(X=x)} */
  value: number;
  /** The query that produced this result */
  query: CausalQuery;
  /** Which variables were computed and their values, in topological order */
  trace: Record<string, number>;
  /** The mutilated DAG (edges removed by do-operator) */
  mutilatedEdges: Array<{ from: string; to: string }>;
  /** Computation method — always 'structural_equation_solver' for v1.0 */
  method: 'structural_equation_solver';
}
```

## Where to Put It

File: `src/types/scm.ts`

- Add the new interfaces alongside existing types
- Add a `@deprecated` JSDoc tag to `structuralEquationsJson` pointing to `TypedSCM.equations`
- Do NOT remove existing types yet — they are used by the current (stub) system
- Export all new interfaces

## Acceptance Criteria

1. All 4 interfaces compile with zero TypeScript errors
2. `StructuralEquation` has exactly 4 fields: `variable`, `parents`, `coefficients`, `intercept`
3. `CausalQuery.type` is exactly `'observational' | 'interventional'` — no other values
4. `CausalResult.method` is exactly `'structural_equation_solver'`
5. `structuralEquationsJson` has `@deprecated` tag
6. No uses of `P(Y | do(X))` in any comment or documentation
7. All interfaces use the notation `Y_{do(X=x)}` in JSDoc where applicable

## What This Task Does NOT Do

- Does not implement computation
- Does not validate DAG acyclicity
- Does not parse structural equations
- Does not touch the solver, mutilation, or benchmark code
- Does not modify `CausalSolver`, `causal-blueprint.ts`, or any pipeline code

## Next Task After This

TASK-002: DAG validation (acyclicity check via topological sort) — depends on `TypedSCM.dag` existing.
