# THINK-004: Forward Solver Algorithm Specification

**Output Classification:** Execution Spec
**Formal Artifact Produced:** `topologicalSort` pseudocode + `forwardSolve` pseudocode
**Depends On:** THINK-003 (mutilateGraph) — complete
**Spec Sections Affected:** Section 7 (Layer 3 / Computation Core), Section 8 (Canonical Pipeline Steps 4–5)
**Notation Compliance:** COMPLIANT

---

## Preamble — What This Algorithm Is and Is Not

`forwardSolve` is a pure algebraic evaluator. It receives an already-mutilated SCM (output of `mutilateGraph`) and evaluates every structural equation in topological order. There is no graph surgery here — that is `mutilateGraph`'s job. There is no LLM involvement here — that is Layer 1 and Layer 5's job. This function is arithmetic on a sorted list.

---

## Supporting Type: `SolverResult`

Define this in `src/types/scm.ts` alongside the existing types:

```typescript
/**
 * The raw output of forwardSolve.
 * Caller maps this to CausalResult.
 */
interface SolverResult {
  /** The computed value of the queried outcome variable */
  outcomeValue: number;
  /** All computed values, keyed by variable name */
  valueMap: Record<string, number>;
  /** The topological evaluation sequence used by the solver */
  evaluationOrder: string[];
}
```

**Mapping to `CausalResult`** (caller's responsibility):
```
CausalResult.value           ← SolverResult.outcomeValue
CausalResult.trace           ← SolverResult.valueMap
CausalResult.evaluationOrder ← SolverResult.evaluationOrder
CausalResult.mutilatedEdges  ← collected by mutilateGraph (caller holds this)
CausalResult.method          ← 'structural_equation_solver'  (constant)
```

---

## Supporting Type: `SolverError`

```typescript
interface SolverError {
  code:
    | 'OUTCOME_NOT_IN_DAG'
    | 'EQUATION_MISSING'
    | 'PARENT_VALUE_MISSING'
    | 'CYCLE_DETECTED'
    | 'CONDITION_VARIABLE_NOT_COMPUTED'
    | 'CONDITION_NOT_SATISFIED';
  message: string;
  variable?: string;
  missingParent?: string;
  computedValue?: number;
  requiredValue?: number;
}
```

---

## Algorithm 1: `topologicalSort`

This is a sub-function of the forward solver. Specified separately because it has its own error case (cycle detection) and is independently testable.

```
Algorithm: topologicalSort
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input:
  dag: { nodes: string[]; edges: Array<{ from: string; to: string }> }
    — The mutilated DAG. Assumed acyclic by v1.0 precondition.

Output:
  sorted: string[]
    — All node names in valid topological order.
      A node appears before all its descendants.
      For nodes at the same depth level, alphabetical ordering is used
      to guarantee determinism across equivalent valid orderings.

Preconditions:
  - dag.nodes is non-empty
  - dag is acyclic (guaranteed by model completeness validation upstream)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pseudocode: (Kahn's Algorithm — BFS-based)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FUNCTION topologicalSort(dag): string[]

  // Step 1: Initialize in-degree map and children map
  inDegree: Record<string, number>    ← {}
  children: Record<string, string[]>  ← {}

  FOR EACH node N in dag.nodes:
    inDegree[N] ← 0
    children[N] ← []

  FOR EACH edge {from, to} in dag.edges:
    inDegree[to]        ← inDegree[to] + 1
    children[from]      ← children[from] + [to]

  // Step 2: Initialize queue with zero-in-degree nodes
  // Sort alphabetically to guarantee deterministic output
  // when multiple nodes share the same topological depth.
  queue: string[] ← sort(
    all nodes N in dag.nodes WHERE inDegree[N] === 0
  ) alphabetically

  sorted: string[] ← []

  // Step 3: Process queue
  WHILE queue is not empty:

    u ← remove first element from queue

    sorted ← sorted + [u]

    FOR EACH child v in children[u]:
      inDegree[v] ← inDegree[v] - 1

      IF inDegree[v] === 0:
        // Insert v into queue maintaining alphabetical sort
        insert v into queue in alphabetical position

  // Step 4: Cycle detection
  IF length(sorted) < length(dag.nodes):
    THROW SolverError {
      code:    'CYCLE_DETECTED',
      message: "Topological sort processed " + length(sorted) + " of " +
               length(dag.nodes) + " nodes. A cycle exists in the DAG. " +
               "This violates the v1.0 acyclicity assumption. " +
               "Model completeness validation should have rejected this model."
    }

  RETURN sorted

END FUNCTION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Edge Cases:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE 1: Single node, no edges
  — queue starts with [that node]
  — sorted = [that node] after one iteration
  — Correct: a single exogenous variable is trivially in topological order

CASE 2: All nodes are roots (no edges at all)
  — inDegree is 0 for every node
  — queue starts with all nodes in alphabetical order
  — sorted = [all nodes alphabetically]
  — Correct: any order is valid; alphabetical ensures determinism

CASE 3: Linear chain A→B→C→D
  — inDegree: {A:0, B:1, C:1, D:1}
  — queue starts with [A]
  — Processes A, then B, then C, then D
  — sorted = [A, B, C, D]

CASE 4: Diamond X→{A,B}→Y (B6)
  — inDegree: {X:0, A:1, B:1, Y:2}
  — queue starts with [X]
  — Processes X; A and B both reach in-degree 0 and are inserted alphabetically: [A, B]
  — Processes A; Y's in-degree drops to 1
  — Processes B; Y's in-degree drops to 0, inserted into queue
  — Processes Y
  — sorted = [X, A, B, Y]
```

---

## Algorithm 2: `forwardSolve`

```
Algorithm: forwardSolve
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input:
  mutilatedSCM: TypedSCM
    — Output of mutilateGraph. Intervention variables have already been
      replaced with constant equations (parents=[], coefficients={},
      intercept=interventionValue). Do NOT pass the original unmutilated SCM.

  outcomeVariable: string
    — The variable Y whose value is to be returned.
    — Must exist in mutilatedSCM.dag.nodes.

  conditions: Record<string, number>   [OPTIONAL — default: {}]
    — For conditional interventional queries Y_{do(X=x), Z=z}.
    — Specifies observed values for non-intervened variables.
    — After full forward computation, the solver checks whether each
      conditioned variable's computed value equals the required value
      (within CONDITION_TOLERANCE = 1e-10).
    — If any condition is not satisfied, throws ConditionNotSatisfiedError.
    — In a fully deterministic v1.0 model, a condition is either exactly
      met or the query is unsatisfiable for this model.

Output:
  SolverResult {
    outcomeValue:    number      — the computed value of outcomeVariable
    valueMap:        Record<string, number>  — all computed variable values
    evaluationOrder: string[]   — topological sequence used
  }

Preconditions:
  - mutilatedSCM.dag is acyclic
  - mutilatedSCM.equations has exactly one entry per node in dag.nodes
  - mutilatedSCM is the output of a valid mutilateGraph call

Constant:
  CONDITION_TOLERANCE = 1e-10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pseudocode:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FUNCTION forwardSolve(
  mutilatedSCM: TypedSCM,
  outcomeVariable: string,
  conditions?: Record<string, number>
): SolverResult

  // ── STEP 1: Validate outcome variable ────────────────────────────────

  IF outcomeVariable not in mutilatedSCM.dag.nodes:
    THROW SolverError {
      code:     'OUTCOME_NOT_IN_DAG',
      message:  "Outcome variable '" + outcomeVariable + "' does not exist " +
                "in the mutilated DAG nodes.",
      variable: outcomeVariable
    }

  // ── STEP 2: Build equation index for O(1) lookup ─────────────────────
  //   Map each variable name to its StructuralEquation.
  //   This avoids O(n) search per variable during evaluation.

  equationIndex: Record<string, StructuralEquation> ← {}

  FOR EACH equation E in mutilatedSCM.equations:
    equationIndex[E.variable] ← E

  // ── STEP 3: Topological sort ──────────────────────────────────────────

  evaluationOrder: string[] ← topologicalSort(mutilatedSCM.dag)
  // Throws SolverError { code: 'CYCLE_DETECTED' } if cycle found.
  // Under v1.0 assumptions, this should never fire if model completeness
  // validation ran successfully. Kept here as a defensive guarantee.

  // ── STEP 4: Forward evaluation ────────────────────────────────────────

  valueMap: Record<string, number> ← {}
  // valueMap accumulates computed values as we process in topological order.
  // Each variable is evaluated exactly once.

  FOR EACH variable V in evaluationOrder:

    // 4a. Retrieve V's structural equation
    IF V not in equationIndex:
      THROW SolverError {
        code:     'EQUATION_MISSING',
        message:  "No structural equation found for variable '" + V + "'. " +
                  "Every node in the DAG must have exactly one equation. " +
                  "Model completeness validation should have caught this.",
        variable: V
      }

    equation ← equationIndex[V]

    // 4b. Verify all of V's parents have been computed
    //     This must be true if the topological sort is correct.
    //     If a parent is missing here, the sort is invalid or the model is inconsistent.

    FOR EACH parent P in equation.parents:
      IF P not in valueMap:
        THROW SolverError {
          code:          'PARENT_VALUE_MISSING',
          message:       "Cannot evaluate variable '" + V + "': parent '" + P + "' " +
                         "has no computed value. This indicates either a topological " +
                         "sort failure or a parent reference that exists in the equation " +
                         "but not in the DAG edges.",
          variable:      V,
          missingParent: P
        }

    // 4c. Evaluate the linear structural equation:
    //     V = intercept + Σ (coefficients[P] * valueMap[P])
    //     For variables with no parents (exogenous or intervened),
    //     the sum is empty and computedValue = equation.intercept.

    computedValue: number ← equation.intercept

    FOR EACH parent P in equation.parents:
      computedValue ← computedValue + (equation.coefficients[P] * valueMap[P])

    // 4d. Store the result
    valueMap[V] ← computedValue

  // ── STEP 5: Condition check (post-computation) ────────────────────────
  //   Applies only to conditional interventional queries: Y_{do(X=x), Z=z}.
  //   The full model has been evaluated at this point.
  //   We now verify that the observed condition values are consistent
  //   with the deterministic model's output.

  IF conditions is defined and conditions is non-empty:

    FOR EACH (condVar, requiredValue) in conditions:

      IF condVar not in valueMap:
        THROW SolverError {
          code:     'CONDITION_VARIABLE_NOT_COMPUTED',
          message:  "Conditioned variable '" + condVar + "' was not found in " +
                    "computed values. Verify it is a node in the mutilated DAG.",
          variable: condVar
        }

      actualValue ← valueMap[condVar]

      IF |actualValue - requiredValue| > CONDITION_TOLERANCE:
        THROW SolverError {
          code:           'CONDITION_NOT_SATISFIED',
          message:        "Conditioning on '" + condVar + "' = " + requiredValue +
                          " is not satisfiable. The deterministic model computes " +
                          condVar + " = " + actualValue + ". In v1.0 (U_i=0), " +
                          "there is no distributional support to condition on. " +
                          "The condition is either wrong or requires v2+ stochastic SCMs.",
          variable:       condVar,
          computedValue:  actualValue,
          requiredValue:  requiredValue
        }

  // ── STEP 6: Return result ─────────────────────────────────────────────

  RETURN SolverResult {
    outcomeValue:    valueMap[outcomeVariable],
    valueMap:        valueMap,
    evaluationOrder: evaluationOrder
  }

END FUNCTION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Edge Cases:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE 1: outcomeVariable not in DAG
  — Caught in Step 1.
  — THROW SolverError { code: 'OUTCOME_NOT_IN_DAG' }
  — No computation is performed.

CASE 2: Parent P appears in equation.parents but P is not in DAG edges
  — Caught in Step 4b.
  — THROW SolverError { code: 'PARENT_VALUE_MISSING' }
  — This indicates a model where an equation references a parent
    that has no edge in the DAG — a data integrity bug that model
    completeness validation should have caught upstream.

CASE 3: Intervention variable X in the mutilated SCM
  — X's equation is: { parents: [], coefficients: {}, intercept: x }
  — When V = X is processed in Step 4:
      equation.parents is []
      the inner loop in 4b runs 0 times (no parents to check)
      the inner loop in 4c runs 0 times
      computedValue = equation.intercept = x
      valueMap[X] = x
  — Correct: intervention variables self-evaluate to their constant value.
  — No special-casing needed.

CASE 4: Exogenous variable with no intervention (e.g., Z=2 in B1, B4)
  — Same as Case 3: parents=[], coefficients={}, intercept=naturalValue
  — Evaluates to intercept directly.
  — Correct: exogenous variables self-evaluate to their natural value.

CASE 5: conditions is undefined or empty
  — Step 5 is skipped entirely.
  — Standard observational or unconditional interventional query.

CASE 6: Conditioned variable satisfies its condition
  — |actualValue - requiredValue| ≤ 1e-10
  — Step 5 loop completes without error.
  — Computation proceeds normally to Step 6.

CASE 7: Conditioned variable does NOT satisfy its condition
  — |actualValue - requiredValue| > 1e-10
  — THROW SolverError { code: 'CONDITION_NOT_SATISFIED' }
  — This is not a bug — it means the specified condition is
    not realizable in this fully deterministic model with U_i = 0.
  — The caller should surface this to the user as a model query error,
    not as an engine failure.
```

---

## Dry-Run Verification: B6 (Diamond Graph)

To confirm the pseudocode produces the correct result for `do(X=2)` on B6:

**Mutilated SCM (from THINK-002 B6):**
```
Nodes:     {X, A, B, Y}
Edges:     X→A, X→B, A→Y, B→Y    (no edges removed — X was already root)
Equations:
  X: parents=[], coefficients={}, intercept=2        (intervention constant)
  A: parents=[X], coefficients={X:0.5}, intercept=0
  B: parents=[X], coefficients={X:−0.3}, intercept=0
  Y: parents=[A,B], coefficients={A:1,B:1}, intercept=0
```

**Step 3 — topologicalSort:**
```
inDegree:  {X:0, A:1, B:1, Y:2}
children:  {X:[A,B], A:[Y], B:[Y]}
queue init: [X]   (only zero-in-degree node)

Iteration 1: dequeue X, sorted=[X]
  Process children [A, B]:
    inDegree[A]=0 → insert A: queue=[A]
    inDegree[B]=0 → insert B (alphabetical after A): queue=[A,B]

Iteration 2: dequeue A, sorted=[X,A]
  Process children [Y]:
    inDegree[Y]=1 (not zero yet)

Iteration 3: dequeue B, sorted=[X,A,B]
  Process children [Y]:
    inDegree[Y]=0 → insert Y: queue=[Y]

Iteration 4: dequeue Y, sorted=[X,A,B,Y]

evaluationOrder = [X, A, B, Y]
```

**Step 4 — forward evaluation:**
```
V=X: parents=[]
  computedValue = 2 (intercept)
  valueMap = {X:2}

V=A: parents=[X], coefficients={X:0.5}
  computedValue = 0 (intercept) + 0.5 * valueMap[X]
               = 0 + 0.5 * 2 = 1.0
  valueMap = {X:2, A:1.0}

V=B: parents=[X], coefficients={X:−0.3}
  computedValue = 0 (intercept) + (−0.3) * valueMap[X]
               = 0 + (−0.3) * 2 = −0.6
  valueMap = {X:2, A:1.0, B:−0.6}

V=Y: parents=[A,B], coefficients={A:1,B:1}
  computedValue = 0 (intercept) + 1 * valueMap[A] + 1 * valueMap[B]
               = 0 + 1 * 1.0 + 1 * (−0.6)
               = 1.0 − 0.6 = 0.4
  valueMap = {X:2, A:1.0, B:−0.6, Y:0.4}
```

**Step 6 — return:**
```
SolverResult {
  outcomeValue:    0.4,
  valueMap:        {X:2, A:1.0, B:−0.6, Y:0.4},
  evaluationOrder: [X, A, B, Y]
}
```

**Expected from THINK-002:** `Y_{do(X=2)} = 0.4` ✓

---

## Connection to the Full Engine Pipeline

```
User query
  → [Layer 1 / LLM] CausalQuery { type:'interventional', treatment:'X', outcome:'Y', doValue:2 }
  → [Layer 3] mutilateGraph(originalSCM, { X: 2 })  → mutilatedSCM + removedEdges
  → [Layer 3] forwardSolve(mutilatedSCM, 'Y')       → SolverResult
  → [Layer 4] Assemble CausalResult:
        {
          value:          SolverResult.outcomeValue,
          query:          originalQuery,
          trace:          SolverResult.valueMap,
          evaluationOrder:SolverResult.evaluationOrder,
          mutilatedEdges: removedEdges,  // from mutilateGraph
          method:         'structural_equation_solver'
        }
  → [Layer 4] Domain bounds check, numeric sanity, assumption disclosure
  → [Layer 5 / LLM] Explanation (CausalResult is a hard constraint — LLM cannot modify value)
```

---

## Output Classification Footer

```
Output Classification:     Execution Spec (THINK-004)
Formal Artifacts Produced:
  1. topologicalSort pseudocode (Kahn's algorithm, deterministic alphabetical tie-breaking)
  2. forwardSolve pseudocode (5-step, all edge cases explicit)
  3. SolverResult interface definition
  4. SolverError interface definition
  5. B6 dry-run verification confirming pseudocode correctness
Spec Sections Affected:    Section 7 (Layer 3 Computation Core), Section 8 (Pipeline Steps 4–5)
Notation Compliance:       COMPLIANT — Y_{do(X=x)} throughout, no P() notation
Benchmark Impact:          Enables B1–B6 (all benchmarks require forwardSolve)

Recommendation for Gemini:
  THINK-004 is complete. The three core algorithm specs are now available:
    THINK-003: mutilateGraph pseudocode
    THINK-004: topologicalSort + forwardSolve pseudocode
  GPT can implement structural-equation-solver.ts from these two documents alone.
  Ready for THINK-005 (integration plan review) when Gemini delegates it.
```
