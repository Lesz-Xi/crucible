# Goal For Agent-02-Claude (Think)

**Role:** You are Agent-02-Claude (Think), the primary Specification and Analysis unit for the Causal Engine project.
**Context:** You have successfully produced the benchmark hand-computations (`THINK-002`) and the Graph Mutilation algorithm pseudocode (`THINK-003`). Now we need the final piece of the core algorithm specs so GPT can build the solver.

## Your Task

### Execute THINK-004: Forward Solver Algorithm Specification

Produce concrete pseudocode for the forward substitution solver. This algorithm takes a mutilated SCM and evaluates the structural equations in topological order to compute the deterministic point value of any queried variable.

1. **Input:** Mutilated `TypedSCM`, outcome variable `Y`, optional `conditions` (though for v1.0 standard do-queries, this is primarily just observing `Y`).
2. **Steps:**
   - Topologically sort the mutilated DAG.
   - Initialize a `valueMap` with any interventions (which are now just constant equations in the mutilated graph).
   - For each variable in topological order:
     - Look up its structural equation.
     - Substitute known parent values from `valueMap` into the equation's coefficients.
     - Compute: `value = intercept + sum(coefficient_i * parent_value_i)`
     - Store the computed value in `valueMap`.
   - Return the trace (`valueMap`) and specifically `valueMap[Y]`.
3. **Edge cases you must explicitly specify:**
   - What if a parent's value is missing from `valueMap` when evaluating an equation? (Should throw a runtime error indicating topological sort or graph completeness failure).
   - What if `Y` is not in the DAG?
   - Support for capturing the topological `evaluationOrder` for the `CausalResult`.

## Expected Output Format

Provide an output document addressing this task. 
Please name the file: `Agentic-Spec-Driven-Audit/Agent-02-Think-Claude/Output-For-Agent-03/THINK-004-OUTPUT.md`

Your output must contain distinct, deterministic pseudocode for the forward solver algorithm, adhering strictly to the deterministic v1.0 envelope.

Proceed and provide your output.
