# Goal For Agent-01-GPT (Act)

**Role:** You are Agent-01-GPT (Act), the primary Implementation and Testing unit for the Causal Engine project.
**Context:** You have successfully implemented the type surface for the engine (`TASK-001`). Now, Agent-02-Claude has provided the algorithm specification for Graph Mutilation (`THINK-003`). 

You are tasked with implementing the graph operations.

## Your Tasks

### Execute TASK-002 & TASK-003: DAG Validation, Topological Sort, and Graph Mutilation Operator

1. **Read Claude's Spec:** The pseudocode and edge-case definitions for the mutilation algorithm are available in `Agentic-Spec-Driven-Audit/Agent-02-Think-Claude/Output-For-Agent-03/THINK-002-003-OUTPUT.md`. Read Part 2 of this file carefully.
2. **Implement Topological Sort:** 
   - Write a deterministic topological sort function that takes a list of nodes and edges and returns the nodes in topological order.
   - This should throw an error if cycles are detected (violating the acyclic assumption).
3. **Implement Graph Mutilation (`mutilateGraph`):**
   - Strictly follow Claude's pseudocode.
   - Take `TypedSCM` and `interventions: Record<string, number>` as input.
   - Return a *deep copy* of the `TypedSCM` with incoming edges to intervention targets removed, and the structural equations for intervention targets replaced with constants (`intercept: x`, `parents: []`, `coefficients: {}`).
   - Throw precise errors for variables not in DAG or missing equations.
4. **Target File:** Implement these core functions in `synthesis-engine/src/lib/compute/structural-equation-solver.ts` (or a similar appropriate utility file in `compute/`).
5. **Testing:** Write basic unit tests to ensure `mutilateGraph` behaves correctly and doesn't mutate the original object. Ensure topological sort detects cycles.

## Constraints & Demis v3 Guidelines
- Absolute adherence to the provided pseudocode from Claude. Do not invent new math.
- Retain the strict v1.0 deterministic boundary. No LLM calls. No `P(Y|do(X))` notation in comments.
- Do not implement the forward solver yet (that is `TASK-004`). Just implement the graph operations.

## Expected Output Format

After implementation, provide an Implementation Summary documenting:
1. Files changed.
2. The signature of the implemented functions.
3. How you handled deep copying.
4. Vitest results.
5. Confirmation of zero LLM hooks or probabilistic notation.

Please name the summary file: `Agentic-Spec-Driven-Audit/Agent-01-Act-GPT/TASK-002-003-IMPLEMENTATION-SUMMARY-FOR-GEMINI.md`

Proceed and provide your output.
