# THINK-002 + THINK-003 Combined Output

**Output Classification:** Benchmark Formalization (THINK-002) + Execution Spec (THINK-003)
**Formal Artifacts Produced:**
  - Hand-computed expected values for B1–B6 (source-of-truth for Gemini's solver verification)
  - Graph Mutilation Algorithm pseudocode (implementation-grade, unambiguous)
**Spec Sections Affected:** Section 9 (Benchmark Suite), Section 7 (Layer 3 / Computation Core)
**Notation Compliance:** COMPLIANT — all results use `Y_{do(X=x)}` notation

---

# Part 1 — THINK-002: Benchmark Verification Hand-Computations (B1–B6)

Each benchmark follows the canonical format:
1. Original DAG and structural equations
2. Intervention applied (do-operator)
3. Mutilated system
4. Forward computation in topological order (every substitution shown)
5. Expected result confirmed against spec Section 9

---

## Benchmark B1: Confounded Fork

**Spec entry:** `X ← Z → Y, X → Y` | Equations: `Z=1, X=0.5Z, Y=0.3X+0.7Z` | Query: `do(X=1)`

### DAG
```
Nodes: {Z, X, Y}
Edges: Z→X, Z→Y, X→Y
```

### Structural Equations (U_i = 0)
```
Z = 1                     (exogenous — no parents, intercept=1)
X = 0.5·Z                 (parents=[Z], coefficients={Z:0.5}, intercept=0)
Y = 0.3·X + 0.7·Z        (parents=[X,Z], coefficients={X:0.3,Z:0.7}, intercept=0)
```

### Intervention: do(X = 1)

### Mutilation
```
Edges removed:   Z→X  (all incoming edges to X)
Equation replaced:
  Before: X = 0.5·Z
  After:  X = 1        (parents=[], coefficients={}, intercept=1)
```

### Mutilated System
```
Z = 1
X = 1                     (constant — do-operator)
Y = 0.3·X + 0.7·Z        (unchanged)
```

### Topological Order of Mutilated Graph
```
Z has no parents             → first
X has no parents (post-mutilation) → second
Y depends on {X, Z}         → third

Order: [Z, X, Y]
```

### Forward Computation
```
Step 1:  Z = 1
Step 2:  X = 1                                     (intervention constant)
Step 3:  Y = 0.3·X + 0.7·Z
           = 0.3·(1) + 0.7·(1)
           = 0.3 + 0.7
           = 1.0
```

### Expected Result
```
Y_{do(X=1)} = 1.0
```

**Spec confirmation:** Matches spec Section 9. ✓

**What this tests:** Graph mutilation must sever Z→X so that Z no longer determines X. Despite Z=1 being correlated with X=0.5 in the natural model, the intervention overrides X. Z still affects Y directly through Z→Y. The engine must NOT treat X as transmitting Z's effect upward.

---

## Benchmark B2: Collider Bias

**Spec entry:** `X → C ← Y` | Equations: `C=X+Y, X=1, Y=1` | Query: `do(X=2)`

### DAG
```
Nodes: {X, Y, C}
Edges: X→C, Y→C
```

### Structural Equations (U_i = 0)
```
X = 1                     (exogenous — parents=[], coefficients={}, intercept=1)
Y = 1                     (exogenous — parents=[], coefficients={}, intercept=1)
C = 1·X + 1·Y            (parents=[X,Y], coefficients={X:1,Y:1}, intercept=0)
```

### Intervention: do(X = 2)

### Mutilation
```
Edges removed:   (none — X has no incoming edges in the original DAG)
Equation replaced:
  Before: X = 1
  After:  X = 2        (parents=[], coefficients={}, intercept=2)
```

### Mutilated System
```
X = 2                     (constant — do-operator)
Y = 1                     (unchanged — Y is exogenous, no parents)
C = 1·X + 1·Y            (unchanged)
```

### Topological Order of Mutilated Graph
```
X has no parents           → first (tied with Y)
Y has no parents           → first (tied with X)
C depends on {X, Y}       → third

Order: [X, Y, C]  (X and Y may be ordered arbitrarily between themselves)
```

### Forward Computation
```
Step 1:  X = 2                                     (intervention constant)
Step 2:  Y = 1                                     (exogenous, unchanged)
Step 3:  C = 1·X + 1·Y
           = 1·(2) + 1·(1)
           = 2 + 1
           = 3
```

Query outcome is Y: Y = 1

### Expected Result
```
Y_{do(X=2)} = 1
```

**Spec confirmation:** Matches spec Section 9. ✓

**What this tests:** C is a collider (common effect of X and Y). X does not cause Y — there is no directed path from X to Y. After mutilation (which removes no edges because X is already exogenous), Y remains at its natural value. The engine must NOT propagate X's change through C to Y. C is downstream of X, but Y is not downstream of X.

**Critical implementation note:** The solver must only compute Y's value using Y's own structural equation. Y's equation has no parents, so Y = intercept = 1 regardless of what X does. The solver must NOT invert edges or follow colliders backward.

---

## Benchmark B3: Simple Chain

**Spec entry:** `X → M → Y` | Equations: `M=0.8X, Y=0.6M` | Query: `do(X=1)`

### DAG
```
Nodes: {X, M, Y}
Edges: X→M, M→Y
```

### Structural Equations (U_i = 0)
```
X = 0                     (exogenous root — for the do-query, X is the intervention target;
                           its natural value is unspecified, intercept=0 by convention)
M = 0.8·X                (parents=[X], coefficients={X:0.8}, intercept=0)
Y = 0.6·M                (parents=[M], coefficients={M:0.6}, intercept=0)
```

### Intervention: do(X = 1)

### Mutilation
```
Edges removed:   (none — X has no incoming edges; it is the DAG root)
Equation replaced:
  Before: X = 0  (or whatever natural value)
  After:  X = 1  (parents=[], coefficients={}, intercept=1)
```

### Mutilated System
```
X = 1                     (constant — do-operator)
M = 0.8·X                (unchanged)
Y = 0.6·M                (unchanged)
```

### Topological Order of Mutilated Graph
```
X has no parents           → first
M depends on {X}           → second
Y depends on {M}           → third

Order: [X, M, Y]
```

### Forward Computation
```
Step 1:  X = 1                                     (intervention constant)
Step 2:  M = 0.8·X
           = 0.8·(1)
           = 0.8
Step 3:  Y = 0.6·M
           = 0.6·(0.8)
           = 0.48
```

### Expected Result
```
Y_{do(X=1)} = 0.48
```

**Spec confirmation:** Matches spec Section 9. ✓

**What this tests:** Correct forward propagation through a mediator. X affects Y exclusively through M. The engine must correctly chain the two linear equations in topological order.

---

## Benchmark B4: Common Cause (Fork)

**Spec entry:** `Z → X, Z → Y` | Equations: `Z=2, X=Z, Y=0.5Z` | Query: `do(X=5)`

### DAG
```
Nodes: {Z, X, Y}
Edges: Z→X, Z→Y
```

### Structural Equations (U_i = 0)
```
Z = 2                     (exogenous — parents=[], coefficients={}, intercept=2)
X = 1·Z                   (parents=[Z], coefficients={Z:1}, intercept=0)
Y = 0.5·Z                 (parents=[Z], coefficients={Z:0.5}, intercept=0)
```

### Intervention: do(X = 5)

### Mutilation
```
Edges removed:   Z→X  (all incoming edges to X)
Equation replaced:
  Before: X = 1·Z
  After:  X = 5        (parents=[], coefficients={}, intercept=5)
```

### Mutilated System
```
Z = 2                     (unchanged)
X = 5                     (constant — do-operator)
Y = 0.5·Z                 (unchanged — Y does NOT depend on X)
```

### Topological Order of Mutilated Graph
```
Z has no parents             → first
X has no parents (post-mutilation) → second (independent of Y)
Y depends on {Z} only        → third (after Z; X does not appear in Y's equation)

Order: [Z, X, Y]  (or [Z, Y, X] — X and Y are independent post-mutilation)
```

### Forward Computation
```
Step 1:  Z = 2
Step 2:  X = 5                                     (intervention constant — not used by Y)
Step 3:  Y = 0.5·Z
           = 0.5·(2)
           = 1.0
```

### Expected Result
```
Y_{do(X=5)} = 1.0
```

**Spec confirmation:** Matches spec Section 9. ✓

**What this tests:** This is the fundamental test of causal vs. associational reasoning. In the natural model, X and Y are positively correlated (both caused by Z). An engine that confuses correlation with causation would compute Y ≈ 0.5·X = 0.5·5 = 2.5 — WRONG. The correct answer is 1.0 because X does not cause Y. After mutilation, Z→X is severed and X does not appear in Y's structural equation at all. The engine must return Y = 0.5·Z = 0.5·2 = 1.0.

---

## Benchmark B5: Multi-Intervention

**Spec entry:** `X → Y, Z → Y, W → X` | Equations: `W=1, X=0.5W, Z=3, Y=0.4X+0.6Z` | Query: `do(X=2, Z=3)`

### DAG
```
Nodes: {W, X, Z, Y}
Edges: W→X, X→Y, Z→Y
```

### Structural Equations (U_i = 0)
```
W = 1                     (exogenous — parents=[], coefficients={}, intercept=1)
X = 0.5·W                (parents=[W], coefficients={W:0.5}, intercept=0)
Z = 3                     (exogenous — parents=[], coefficients={}, intercept=3)
Y = 0.4·X + 0.6·Z        (parents=[X,Z], coefficients={X:0.4,Z:0.6}, intercept=0)
```

### Intervention: do(X = 2, Z = 3)

### Mutilation — two simultaneous interventions, applied independently

**For X:**
```
Edges removed:   W→X  (all incoming edges to X)
Equation replaced:
  Before: X = 0.5·W
  After:  X = 2        (parents=[], coefficients={}, intercept=2)
```

**For Z:**
```
Edges removed:   (none — Z has no incoming edges; it is exogenous)
Equation replaced:
  Before: Z = 3
  After:  Z = 3        (parents=[], coefficients={}, intercept=3)
          [Note: do(Z=3) is a formal no-op here since Z=3 is Z's natural value,
           but the mutilation procedure is applied identically regardless]
```

### Mutilated System
```
W = 1                     (unchanged)
X = 2                     (constant — do-operator)
Z = 3                     (constant — do-operator, same as natural value)
Y = 0.4·X + 0.6·Z        (unchanged)
```

### Topological Order of Mutilated Graph
```
W has no parents             → first (W, X, Z are all roots post-mutilation)
X has no parents (post-mutilation) → first (tied with W and Z)
Z has no parents             → first (tied with W and X)
Y depends on {X, Z}         → last

Order: [W, X, Z, Y]  (W, X, Z may be ordered arbitrarily among themselves)
```

### Forward Computation
```
Step 1:  W = 1                                     (exogenous, not used by Y)
Step 2:  X = 2                                     (intervention constant)
Step 3:  Z = 3                                     (intervention constant)
Step 4:  Y = 0.4·X + 0.6·Z
           = 0.4·(2) + 0.6·(3)
           = 0.8 + 1.8
           = 2.6
```

### Expected Result
```
Y_{do(X=2, Z=3)} = 2.6
```

**Spec confirmation:** Matches spec Section 9. ✓

**What this tests:** Simultaneous multi-variable intervention. Both X and Z are set by the do-operator in the same query. W→X is severed, so W has no effect on the outcome. The engine must handle multiple simultaneous mutilations without interference between them.

---

## Benchmark B6: Diamond Graph

**Spec entry:** `X → A, X → B, A → Y, B → Y` | Equations: `A=0.5X, B=−0.3X, Y=A+B` | Query: `do(X=2)`

### DAG
```
Nodes: {X, A, B, Y}
Edges: X→A, X→B, A→Y, B→Y
```

### Structural Equations (U_i = 0)
```
X = 0                     (root node — natural value unspecified; intervention target)
A = 0.5·X                (parents=[X], coefficients={X:0.5}, intercept=0)
B = −0.3·X               (parents=[X], coefficients={X:−0.3}, intercept=0)
Y = 1·A + 1·B            (parents=[A,B], coefficients={A:1,B:1}, intercept=0)
```

### Intervention: do(X = 2)

### Mutilation
```
Edges removed:   (none — X has no incoming edges; it is the DAG root)
Equation replaced:
  Before: X = 0  (natural value)
  After:  X = 2  (parents=[], coefficients={}, intercept=2)
```

### Mutilated System
```
X = 2                     (constant — do-operator)
A = 0.5·X                (unchanged)
B = −0.3·X               (unchanged)
Y = 1·A + 1·B            (unchanged)
```

### Topological Order of Mutilated Graph
```
X has no parents             → first
A depends on {X}             → second (tied with B)
B depends on {X}             → second (tied with A)
Y depends on {A, B}          → fourth

Order: [X, A, B, Y]  (A and B may be ordered arbitrarily between themselves)
```

### Forward Computation
```
Step 1:  X = 2                                     (intervention constant)
Step 2:  A = 0.5·X
           = 0.5·(2)
           = 1.0
Step 3:  B = −0.3·X
           = −0.3·(2)
           = −0.6
Step 4:  Y = 1·A + 1·B
           = 1·(1.0) + 1·(−0.6)
           = 1.0 + (−0.6)
           = 0.4
```

### Expected Result
```
Y_{do(X=2)} = 0.4
```

**Spec confirmation:** Matches spec Section 9. ✓

**What this tests:** Multi-path propagation through a diamond with opposing-sign coefficients. X reaches Y through two paths: X→A→Y (positive contribution) and X→B→Y (negative contribution). The engine must correctly compute both paths independently and sum them. Sign handling on B's coefficient (−0.3) is critical — an engine that drops negative signs or incorrectly handles the summation at Y will fail this benchmark.

---

## B1–B6 Summary Table

| ID | Benchmark | Intervention | Expected Value | Arithmetic Check |
|---|---|---|---|---|
| B1 | Confounded Fork | do(X=1) | Y_{do(X=1)} = **1.0** | 0.3(1) + 0.7(1) = 0.3 + 0.7 = 1.0 ✓ |
| B2 | Collider Bias | do(X=2) | Y_{do(X=2)} = **1** | Y is exogenous, equation: Y=1 ✓ |
| B3 | Simple Chain | do(X=1) | Y_{do(X=1)} = **0.48** | 0.6 × (0.8 × 1) = 0.6 × 0.8 = 0.48 ✓ |
| B4 | Common Cause | do(X=5) | Y_{do(X=5)} = **1.0** | 0.5(2) = 1.0; X not in Y's equation ✓ |
| B5 | Multi-Intervention | do(X=2, Z=3) | Y_{do(X=2,Z=3)} = **2.6** | 0.4(2) + 0.6(3) = 0.8 + 1.8 = 2.6 ✓ |
| B6 | Diamond Graph | do(X=2) | Y_{do(X=2)} = **0.4** | 0.5(2) + (−0.3)(2) = 1.0 − 0.6 = 0.4 ✓ |

**Verification tolerance:** GPT's solver must match these values to floating-point precision (1e-10). Any deviation indicates a mutilation or forward-evaluation bug.

---

---

# Part 2 — THINK-003: Graph Mutilation Algorithm Specification

---

```
Algorithm: mutilateGraph
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input:
  scm: TypedSCM
    — The original fully-specified SCM. Must not be mutated in place.
  interventions: Record<string, number>
    — Map of variable names to intervention values.
      Example: { "X": 1 } for do(X=1)
      Example: { "X": 2, "Z": 3 } for do(X=2, Z=3)

Output:
  mutilatedSCM: TypedSCM
    — A deep copy of scm with all intervention mutations applied.
    — The original scm is unchanged.

Preconditions:
  - scm.dag is a valid acyclic graph (guaranteed by model completeness validation)
  - scm.equations has exactly one entry per endogenous variable
  - interventions is non-empty

Error types:
  MutilationError: { code: string; message: string; variable: string }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pseudocode:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FUNCTION mutilateGraph(scm: TypedSCM, interventions: Record<string, number>): TypedSCM

  // ── STEP 1: Validate all intervention variables ──────────────────────
  FOR EACH variable X IN keys(interventions):

    1a. IF X is not in scm.dag.nodes:
          THROW MutilationError {
            code: "VARIABLE_NOT_IN_DAG",
            message: "Intervention variable '" + X + "' does not exist in DAG nodes.",
            variable: X
          }

    1b. IF no equation E in scm.equations satisfies (E.variable === X):
          THROW MutilationError {
            code: "EQUATION_NOT_FOUND",
            message: "No structural equation found for variable '" + X + "'.",
            variable: X
          }

  // ── STEP 2: Deep copy the edge list and equation list ────────────────
  //   (The original scm must not be mutated.)

  workingEdges      ← deep copy of scm.dag.edges
                      // Each edge is { from: string; to: string }
  workingEquations  ← deep copy of scm.equations
                      // Each equation is a full StructuralEquation object

  // ── STEP 3: Apply each intervention in sequence ──────────────────────
  //   (Order of application is irrelevant: each intervention replaces an
  //    equation with a constant that has no parents, so no intervention
  //    can affect another intervention variable's substituted equation.)

  FOR EACH (X, x) IN interventions:

    // 3a. Remove all incoming edges to X from the working edge list.
    //     "Incoming edges to X" = all edges where edge.to === X.
    //     If X has no incoming edges, this step produces no change (not an error).

    removedForX      ← all edges E in workingEdges WHERE E.to === X
    workingEdges     ← workingEdges EXCLUDING removedForX

    // 3b. Replace X's structural equation with a constant equation.
    //     This encodes: f_X is replaced by the constant function f_X() = x.

    Find equation index i in workingEquations WHERE workingEquations[i].variable === X
    workingEquations[i] ← {
      variable:     X,
      parents:      [],      // X now has no parents
      coefficients: {},      // no coefficients
      intercept:    x        // the intervention value
    }

  // ── STEP 4: Construct and return the mutilated SCM ───────────────────

  RETURN TypedSCM {
    variables:  scm.variables,      // unchanged — nodes are not removed
    equations:  workingEquations,   // mutilated equations
    dag: {
      nodes:    scm.dag.nodes,      // unchanged — nodes are not removed
      edges:    workingEdges        // edges with all X-incoming edges removed
    }
  }

END FUNCTION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Edge Cases (explicit specification — no ambiguity permitted):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE 1: X has no incoming edges (X is an exogenous root node)
  — Example: B2 (X), B3 (X), B6 (X)
  — removedForX is the empty set: []
  — Step 3a is a no-op (no edges removed)
  — Step 3b still replaces the equation with intercept = x
  — Result: X's natural exogenous value is overridden by the intervention value
  — This is correct: do(X=x) on an exogenous variable overrides its natural value

CASE 2: X is not in scm.dag.nodes
  — Caught in Step 1a
  — THROW MutilationError with code "VARIABLE_NOT_IN_DAG"
  — Do NOT proceed to edge removal or equation replacement
  — The original scm is returned unchanged (no partial mutation)

CASE 3: X is in scm.dag.nodes but has no structural equation
  — Caught in Step 1b
  — THROW MutilationError with code "EQUATION_NOT_FOUND"
  — This state should not occur if model completeness validation passed upstream,
    but must be handled defensively here
  — Do NOT proceed to edge removal or equation replacement

CASE 4: Multiple simultaneous interventions (|interventions| > 1)
  — Example: B5 (do(X=2, Z=3))
  — Steps 3a and 3b are applied for each intervention variable in sequence
  — Application order does not affect the result:
      Each replaced equation has parents=[] and coefficients={},
      so no intervention variable can appear in another's post-mutation equation.
  — All validations in Step 1 are completed for ALL variables
    before any mutation begins (fail-all-or-succeed-all semantics)

CASE 5: interventions is empty
  — Step 1 loop does not execute (no variables to validate)
  — Steps 3a and 3b loop does not execute (no mutations to apply)
  — Returns a deep copy of the original SCM with no changes
  — This is a degenerate but valid call (observational query — no do-operator)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implementation Notes for GPT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Deep copy must be a true structural clone, not a shallow reference copy.
   Use structuredClone(), JSON.parse(JSON.stringify(...)), or equivalent.
   Mutating the original scm is a disqualifying bug.

2. The returned TypedSCM must preserve the same variable list (scm.variables).
   Nodes are never removed by mutilation — only edges and equations change.

3. The removedEdges for each intervention variable should be collected and
   stored if the caller needs them for CausalResult.mutilatedEdges.
   Suggested: return both the mutilated SCM and the list of removed edges,
   or collect removed edges as a side-output during Step 3a.

4. "Find equation index i where workingEquations[i].variable === X" assumes
   exactly one equation per variable. This is guaranteed by model completeness
   validation. If two equations exist for the same variable (malformed model),
   the first match is used and the duplicate is a pre-existing data bug —
   not a mutilation concern.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spec Reference: Section 7 (Layer 3 / Computation Core), Section 4 (Graph Mutilation)
Benchmark Impact: Required for B1–B6 (all benchmarks use the do-operator)
```

---

## Benchmark-to-Mutilation Mapping

| Benchmark | X incoming edges in original | Edges removed by mutilation | Equation replaced |
|---|---|---|---|
| B1 | Z→X | Z→X | X = 0.5Z → X = 1 |
| B2 | (none — X exogenous) | (none) | X = 1 → X = 2 |
| B3 | (none — X is root) | (none) | X = 0 → X = 1 |
| B4 | Z→X | Z→X | X = Z → X = 5 |
| B5 (X) | W→X | W→X | X = 0.5W → X = 2 |
| B5 (Z) | (none — Z exogenous) | (none) | Z = 3 → Z = 3 |
| B6 | (none — X is root) | (none) | X = 0 → X = 2 |

---

## Output Classification Footer

```
Output Classification:     Benchmark Formalization (B1–B6) + Execution Spec (mutilateGraph)
Formal Artifacts Produced:
  1. B1–B6 hand-computed expected values with full substitution chains
  2. mutilateGraph pseudocode (deterministic, unambiguous, edge-cases explicit)
Spec Sections Affected:    Section 7 (Layer 3), Section 9 (Benchmarks)
Notation Compliance:       COMPLIANT
Recommendation:
  Gemini: Use B1–B6 table as the source-of-truth for GPT solver verification.
  Gemini: Delegate THINK-004 (forward solver pseudocode) to Claude — depends on THINK-003 complete.
  GPT:    Implement mutilateGraph per pseudocode above in structural-equation-solver.ts.
          Collect removedEdges during Step 3a for CausalResult.mutilatedEdges population.
```
