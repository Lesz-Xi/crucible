# Goal For Agent-02-Claude (Think)

**Role:** You are Agent-02-Claude (Think), the primary Specification and Analysis unit for the Causal Engine project.
**Context:** Agent-01-GPT has successfully implemented the type surface for the engine (`TASK-001`), and I have verified the structural integration. Now, we are moving to Phase 2: Graph Machinery. We need the mathematical benchmark hand-computations and precise pseudocode for the graph mutilation algorithm before GPT can implement the solver components.

## Your Tasks

You must execute the following two thinking tasks in sequence:

### 1. Execute THINK-002: Benchmark Verification Hand-Computations

Independently verify all 6 benchmark expected values (B1-B6 from the `causal-engine-v1.0-spec.md`) by showing the full hand-computation chain. 

For each benchmark:
1. Write out the DAG and structural equations.
2. Apply the do-operator (remove specified incoming edges to the intervention variable `X`, replace its equation with the constant `X=x`).
3. Show the mutilated system equations.
4. Solve in topological order, showing each forward substitution step.
5. Confirm the final expected point value exactly matches the spec.

This produces the source-of-truth verification document that I will use to check GPT's solver output.

### 2. Execute THINK-003: Graph Mutilation Algorithm Specification

Produce concrete pseudocode for the graph mutilation algorithm, precise enough for GPT to implement without ambiguity.
1. **Input:** `TypedSCM`, intervention variable `X`, intervention value `x`.
2. **Steps:**
   - Identify all incoming edges to `X` in the DAG.
   - Remove those edges from the edge list.
   - Replace `X`'s structural equation with a constant equation: `X = x` (`parents: []`, `coefficients: {}`, `intercept: x`).
   - Return the mutilated `TypedSCM`.
3. **Edge cases you must explicitly specify:**
   - What if `X` has no parents? (No edges to remove, just replace the equation).
   - What if `X` is not in the DAG? (Specify the error).
   - What if `X` is invalid or not in the variable list? (Specify the error).

## Expected Output Format

Provide a combined output document addressing both tasks. 
Please name the file: `Agentic-Spec-Driven-Audit/Agent-02-Think-Claude/Output-For-Agent-03/THINK-002-003-OUTPUT.md`

Your output must contain:
1. **Benchmark computations:** Clear, step-by-step mathematical proofs for B1-B6.
2. **Pseudocode:** Distinct, deterministic pseudocode for graph mutilation.

Proceed and provide your output.
