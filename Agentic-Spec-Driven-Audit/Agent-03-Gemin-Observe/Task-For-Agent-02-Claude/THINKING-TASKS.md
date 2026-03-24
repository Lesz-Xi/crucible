# Thinking Tasks for Claude (Agent-02)

## Active Tasks

### THINK-001: Pre-Implementation Review of TASK-001 (Types)

**Status**: Ready for review

Claude must verify that TASK-001 (Type the SCM Representation) is spec-compliant before GPT begins implementation.

Review checklist:
- [ ] Do the 4 interfaces match the spec's Section 4 exactly?
- [ ] Is `CausalQuery.type` limited to `'observational' | 'interventional'`?
- [ ] Is the `StructuralEquation` format sufficient for all 6 benchmarks?
- [ ] Are JSDoc comments notation-compliant (`Y_{do(X=x)}`, not `P(Y|do(X))`)?
- [ ] Does the `CausalResult.trace` field capture enough information for Gemini's verification?
- [ ] Is the `@deprecated` tag on `structuralEquationsJson` clear about the migration path?

**Output**: Approved (with any corrections) or Blocked (with specific reasons).

---

### THINK-002: Benchmark Verification Hand-Computations

**Status**: Pending (after THINK-001)

Claude must independently verify all 6 benchmark expected values by showing the full computation chain:

For each benchmark (B1–B6):
1. Write out the DAG
2. Write out the structural equations
3. Apply the do-operator (remove specified edges, replace equation with constant)
4. Show the mutilated system
5. Solve in topological order, showing each substitution step
6. Confirm the expected value

This produces a verification document that Gemini uses to check GPT's solver output.

**Output**: Hand-computation document for all 6 benchmarks.

---

### THINK-003: Graph Mutilation Algorithm Specification

**Status**: Pending (after THINK-001)

Claude must produce pseudocode for the graph mutilation algorithm that is precise enough for GPT to implement without ambiguity:

1. Input: `TypedSCM`, intervention variable `X`, intervention value `x`
2. Steps:
   - Identify all incoming edges to X in the DAG
   - Remove those edges from the edge list
   - Replace X's structural equation with a constant equation: `X = x`
   - Return the mutilated `TypedSCM`
3. Edge cases to specify:
   - What if X has no parents? (no edges to remove, just replace equation)
   - What if X is not in the DAG? (error)
   - What if the intervention value type is wrong? (error)

**Output**: Pseudocode with edge case handling, ready for GPT implementation.

---

### THINK-004: Forward Solver Algorithm Specification

**Status**: Pending (after THINK-003)

Claude must produce pseudocode for the forward substitution solver:

1. Input: Mutilated `TypedSCM`, outcome variable `Y`, optional conditions
2. Steps:
   - Topologically sort the mutilated DAG
   - Initialize value map with intervention constants and any conditioned values
   - For each variable in topological order:
     - Look up its equation
     - Substitute known parent values into coefficients
     - Compute: `value = intercept + sum(coefficient_i * parent_value_i)`
     - Store in value map
   - Return value map[outcome]
3. Edge cases:
   - What if the outcome is unreachable from the intervention? (still computable if fully specified)
   - What if a parent's value is not yet computed? (impossible if topological sort is correct — but validate)
   - What if the conditioned variable is downstream of the intervention? (compute anyway — conditioning is filtering, not intervening)

**Output**: Pseudocode with edge case handling, ready for GPT implementation.

---

## Queued Tasks

### THINK-005: Integration Plan Review
Review the plan for replacing `CausalSolver.solve()` stub and deprecating `propagateIntervention()`. Verify that the integration does not break existing functionality during the transition.

### THINK-006: Claim Audit of Existing Codebase
Audit `causal-blueprint.ts`, `causal-solver.ts`, and `causal-chat/route.ts` for overclaims that should be corrected once the real engine exists. Produce a list of specific code comments, variable names, and function descriptions that need updating.

---

## Task Sequencing

```
THINK-001 (review types task)
  → THINK-002 (verify benchmarks) + THINK-003 (mutilation pseudocode) [parallel]
    → THINK-004 (solver pseudocode) [depends on THINK-003]
      → THINK-005 (integration review) [depends on THINK-004]
        → THINK-006 (claim audit) [can run anytime, low priority]
```
