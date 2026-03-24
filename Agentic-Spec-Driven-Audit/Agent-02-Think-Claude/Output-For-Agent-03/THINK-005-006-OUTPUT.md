# THINK-005 + THINK-006 Combined Output

**Output Classification:** Execution Spec (THINK-005) + Overclaim Audit (THINK-006)
**Formal Artifacts Produced:**
  - `runCausalQuery` bridge function pseudocode (THINK-005)
  - Updated `buildCounterfactualTrace` pseudocode for engine path (THINK-005)
  - Exhaustive theater claim audit with exact file locations and GPT fix instructions (THINK-006)
**Spec Sections Affected:** Section 7 (all layers), Section 10 (Failure Modes), Section 12 (Claim Discipline)
**Notation Compliance:** COMPLIANT

---

# Part 1 — THINK-005: Integration Plan Review

## Codebase State (Verified from Source)

Before specifying integration, the actual current state must be documented:

| Component | File | What it does | What it claims |
|---|---|---|---|
| `CausalSolver.solve()` | `causal-solver.ts:27–52` | Sets node values in a Map, returns CausalState. No propagation. | "implements Do-Calculus (Rung 2/3)" |
| `CausalSolver.generateDoPrompt()` | `causal-solver.ts:89–102` | Returns a prompt string telling the LLM to "derive consequences based on structural equations" | Implies LLM has structural equations. It does not. |
| `propagateIntervention()` | `causal-blueprint.ts:626–646` | BFS with 0.7 decay factor per edge, max depth 6 | Called by `queryIntervention()`, labeled `P(Y\|do(X=x))` |
| `queryIntervention()` | `causal-blueprint.ts:443–461` | Calls `propagateIntervention()`, adds delta to baseline | Returns `estimand: "P(outcome \| do(var=val))"` |
| `buildCounterfactualTrace()` | `counterfactual-trace.ts:81–135` | Calls `scm.queryCounterfactual()` and `scm.queryIntervention()` | Persists with `method: "deterministic_graph_diff"` |

**The gap:** No file currently loads `TypedSCM`, calls `mutilateGraph`, or calls `forwardSolve`. These do not exist yet — they are what GPT implements from THINK-003/004.

---

## Integration Architecture

The new engine is inserted as a **bridge layer** between the existing API surface and the formal solver. Two principles:

1. **Graceful degradation:** When a `TypedSCM` with valid structural equations is not available for a model, the existing LLM-prompt path continues to work. The engine path is an upgrade, not a replacement that breaks existing behavior.

2. **No LLM in the compute path:** The bridge function calls `mutilateGraph` and `forwardSolve` with zero LLM calls. The LLM receives the result as a hard constraint (existing `ConstraintInjector` mechanism).

---

## New File: `src/lib/compute/causal-engine-bridge.ts`

GPT creates this file. It contains one function. It has no dependencies except the types from `scm.ts` and the solver from `structural-equation-solver.ts`.

```
Algorithm: runCausalQuery
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input:
  typedSCM: TypedSCM
    — A fully-specified SCM from scm_model_versions.
      Must pass model completeness validation before this function is called.

  query: CausalQuery
    — The formal causal query. For v1.0: type is 'interventional'.
      treatment, doValue, outcome, optional conditions.

Output:
  CausalResult {
    value:           number        — the computed outcome value
    query:           CausalQuery   — the original query, echoed back
    trace:           Record<string, number>  — all computed variable values
    evaluationOrder: string[]     — topological sequence
    mutilatedEdges:  Array<{from:string; to:string}>  — edges removed
    method:          'structural_equation_solver'
  }

Throws:
  MutilationError   — if treatment variable not in DAG or has no equation
  SolverError       — if forward evaluation fails
  EngineQueryError  — if query.type is not 'interventional' or 'observational'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pseudocode:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FUNCTION runCausalQuery(typedSCM: TypedSCM, query: CausalQuery): CausalResult

  // ── STEP 1: Route by query type ──────────────────────────────────────

  IF query.type === 'observational':

    // Observational query: evaluate equations in the UNMUTILATED graph.
    // No graph surgery — forward solve the natural model.
    solverResult ← forwardSolve(
      mutilatedSCM:    typedSCM,       // natural model, no mutation
      outcomeVariable: query.outcome,
      conditions:      query.conditions
    )
    removedEdges ← []                  // no edges removed

  ELSE IF query.type === 'interventional':

    // Step 1a: Perform graph mutilation
    mutilationResult ← mutilateGraph(
      typedSCM,
      interventions: { [query.treatment]: query.doValue }
    )
    // mutilationResult contains:
    //   mutilatedSCM:  TypedSCM   — the modified model
    //   removedEdges:  Array<{from:string; to:string}>  — edges deleted

    // Step 1b: Forward solve the mutilated model
    solverResult ← forwardSolve(
      mutilatedSCM:    mutilationResult.mutilatedSCM,
      outcomeVariable: query.outcome,
      conditions:      query.conditions
    )
    removedEdges ← mutilationResult.removedEdges

  ELSE:
    THROW EngineQueryError {
      code:    'UNSUPPORTED_QUERY_TYPE',
      message: "Query type '" + query.type + "' is not supported in v1.0. " +
               "Supported types: 'observational', 'interventional'."
    }

  // ── STEP 2: Assemble CausalResult ────────────────────────────────────

  RETURN CausalResult {
    value:           solverResult.outcomeValue,
    query:           query,                        // echo original query
    trace:           solverResult.valueMap,
    evaluationOrder: solverResult.evaluationOrder,
    mutilatedEdges:  removedEdges,
    method:          'structural_equation_solver'
  }

END FUNCTION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Note on mutilateGraph return signature:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THINK-003 specified mutilateGraph returning TypedSCM only. GPT must update it
to also return removedEdges so the bridge can populate CausalResult.mutilatedEdges.

Updated return signature for mutilateGraph:
  RETURN {
    mutilatedSCM:  TypedSCM,
    removedEdges:  Array<{ from: string; to: string }>  // edges deleted in Step 3a
  }

Collect removedEdges by aggregating all removedForX arrays from Step 3a of
the mutilateGraph pseudocode (THINK-003).
```

---

## Update: `src/lib/services/causal-solver.ts`

GPT modifies `CausalSolver.solve()` to route through the engine when `TypedSCM` is available.

```
MODIFIED FUNCTION: CausalSolver.solve()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updated signature:
  solve(
    scm:           StructuralCausalModel,
    interventions: Intervention[],
    currentState?: Map<string, string>,
    typedSCM?:     TypedSCM              // NEW optional parameter
  ): CausalState | CausalResult

Pseudocode:

  IF typedSCM is provided AND interventions.length > 0:

    // ── ENGINE PATH ──────────────────────────────────────────────────────
    // Build a CausalQuery from the Intervention[] list.
    // v1.0 supports single-treatment interventional queries.
    // Multi-variable interventions: map to first intervention for query,
    // pass all in the mutilateGraph interventions map.

    query ← CausalQuery {
      type:       'interventional',
      treatment:  interventions[0].nodeName,
      doValue:    parseFloat(interventions[0].value),
      outcome:    ???,           // CALLER MUST SUPPLY — see note below
      conditions: undefined
    }

    RETURN runCausalQuery(typedSCM, query)

    // ── EXISTING PATH (graceful fallback) ─────────────────────────────
  ELSE:
    // Original stub behavior — unchanged.
    // Caller routes to generateDoPrompt() for LLM constraint injection.
    state ← CausalState { nodes: new Map(currentState), interventions: new Set() }
    FOR EACH intervention in interventions:
      state.nodes.set(intervention.nodeName, intervention.value)
      state.interventions.add(intervention.nodeName)
    RETURN state
```

**BLOCKER NOTE for GPT:** `CausalSolver.solve()` does not currently receive the `outcome` variable — it only receives `interventions`. `runCausalQuery` requires an outcome variable. This mismatch means `solve()` is not the right insertion point for the full engine call. The correct insertion point is **`buildCounterfactualTrace()`** in `counterfactual-trace.ts`, which already receives both `intervention` AND `outcome`. See next section.

---

## Primary Integration Point: `src/lib/services/counterfactual-trace.ts`

This is the correct bridge location. `buildCounterfactualTrace()` already holds:
- The intervention variable and value (`input.intervention`)
- The outcome variable (`input.outcome`)
- The model reference (`input.modelRef`)

GPT modifies `buildCounterfactualTrace()` to route to the engine when `TypedSCM` is available.

```
MODIFIED FUNCTION: buildCounterfactualTrace()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updated signature:
  buildCounterfactualTrace(
    scm:      StructuralCausalModel,
    input:    BuildCounterfactualTraceInput,
    typedSCM?: TypedSCM                       // NEW optional parameter
  ): CounterfactualTrace

Pseudocode:

  interventionVariable ← input.intervention.variable.trim()
  outcome              ← input.outcome.trim()
  traceId              ← input.traceId || crypto.randomUUID()

  IF typedSCM is provided:

    // ── ENGINE PATH ──────────────────────────────────────────────────────

    query ← CausalQuery {
      type:       'interventional',
      treatment:  interventionVariable,
      doValue:    input.intervention.value,
      outcome:    outcome,
      conditions: undefined
    }

    engineResult ← runCausalQuery(typedSCM, query)
    // engineResult is a CausalResult

    RETURN CounterfactualTrace {
      traceId,
      modelRef:   input.modelRef,
      query: {
        intervention: { variable: interventionVariable, value: input.intervention.value },
        outcome,
        observedWorld: sanitizeObservedWorld(input.observedWorld)
      },
      assumptions:  sanitizeStrings(input.assumptions),
      adjustmentSet: sanitizeStrings(input.adjustmentSet),
      computation: {
        method:        'structural_equation_solver',    // M6.2 COMPLIANT
        affectedNodes: engineResult.evaluationOrder,   // topological trace
        evaluationOrder: engineResult.evaluationOrder, // explicit for M6.2
        traceValues:   engineResult.trace,             // full valueMap
        uncertainty:   'none'                          // deterministic — no uncertainty
      },
      result: {
        actualOutcome:          observedWorld[outcome] ?? null,
        counterfactualOutcome:  engineResult.value,
        delta: observedWorld[outcome] != null
                 ? engineResult.value - observedWorld[outcome]
                 : null
      }
    }

  ELSE:

    // ── EXISTING PATH (graceful fallback) ─────────────────────────────
    // Original implementation unchanged.
    // Uses scm.queryCounterfactual() and scm.queryIntervention().
    // computation.method remains 'deterministic_graph_diff'.
    [original body as-is]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M6.2 Trace Integrity satisfaction:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

M6.2 requires the trace to contain:
  ✓ computation_method = 'structural_equation_solver'     → computation.method
  ✓ evaluationOrder (topological sequence)                → computation.evaluationOrder
  ✓ valueMap (all intermediate values)                    → computation.traceValues
  ✓ No LLM in compute path                                → runCausalQuery has zero LLM calls
  ✓ Deterministic result (point value, not distribution)  → computation.uncertainty = 'none'
```

---

## Deprecation of `propagateIntervention()` and `queryIntervention()`

These must be deprecated for interventional claims once the engine path is live. GPT adds the following guard at the top of both functions:

```typescript
// DEPRECATED for formal interventional claims (v1.0+).
// This function uses BFS with 0.7 decay — graph signal propagation, NOT do-calculus.
// For results labeled "causal effect", use runCausalQuery() with a TypedSCM.
// This function remains for: (a) heuristic UI animations, (b) fallback when TypedSCM unavailable.
// Remove from all claim-labeled outputs after TypedSCM migration is complete.
```

**Do NOT remove the function body.** The graceful fallback path in `buildCounterfactualTrace()` still calls it when `TypedSCM` is absent. Removal before full migration would break existing queries.

---

## File Map: What GPT Touches in TASK-006

| File | Action | Scope |
|---|---|---|
| `src/lib/compute/structural-equation-solver.ts` | CREATE | `mutilateGraph` + `topologicalSort` + `forwardSolve` (from THINK-003/004) |
| `src/lib/compute/causal-engine-bridge.ts` | CREATE | `runCausalQuery` (from THINK-005 above) |
| `src/types/scm.ts` | MODIFY | Add `SolverResult`, `SolverError` interfaces (from THINK-004) |
| `src/lib/services/counterfactual-trace.ts` | MODIFY | Add engine path in `buildCounterfactualTrace()` |
| `src/lib/ai/causal-blueprint.ts` | MODIFY | Add deprecation guards to `propagateIntervention()`, `queryIntervention()`, `queryCounterfactual()` |
| `src/lib/services/causal-solver.ts` | MODIFY | Add deprecation guards to `generateDoPrompt()`, add optional `typedSCM` routing |

---

---

# Part 2 — THINK-006: Claim Audit of Existing Codebase

## Audit Method

I read the source files directly and catalogued every string, comment, function name, and return value that uses v2+ vocabulary, probabilistic notation, or overclaims v1.0 engine capabilities. Each finding has an exact file:line reference, the current text, the correct text, and the fix type.

---

## Theater Claim Register

### CLAIM-001 — `causal-solver.ts:16` — Class-level JSDoc overclaims Rung 2/3

```
FILE:    src/lib/services/causal-solver.ts
LINE:    16
TYPE:    JSDoc comment
CURRENT: "This service implements the Do-Calculus (Rung 2/3) logic."
PROBLEM: CausalSolver.solve() is a Map setter. It does not implement do-calculus.
         It stores intervention values and returns. No propagation occurs.
FIX:     Replace with:
         "This service is the integration point for do-operator queries.
          In v1.0+, when TypedSCM is available, it delegates to runCausalQuery()
          (structural equation solver). When TypedSCM is absent, it generates a
          constraint prompt for LLM-assisted resolution (fallback path only)."
FIX TYPE: Comment replacement — no logic change
```

### CLAIM-002 — `causal-solver.ts:18` — "calculates the mandatory state"

```
FILE:    src/lib/services/causal-solver.ts
LINE:    18
TYPE:    JSDoc comment
CURRENT: "calculates the mandatory state of the downstream nodes"
PROBLEM: solve() does not calculate anything. It sets one Map entry per intervention
         and returns. The comment describes a capability that does not exist.
FIX:     Replace with:
         "Records the intervention state. Downstream propagation is handled by
          runCausalQuery() (engine path) or generateDoPrompt() (fallback path)."
FIX TYPE: Comment replacement — no logic change
```

### CLAIM-003 — `causal-solver.ts:25` — "Solves the graph"

```
FILE:    src/lib/services/causal-solver.ts
LINE:    25
TYPE:    JSDoc comment
CURRENT: "Solves the graph for a given set of interventions."
PROBLEM: solve() does not solve the graph. See above.
FIX:     Replace with:
         "Applies interventions to the causal state. Engine path: delegates to
          runCausalQuery(). Fallback path: caller invokes generateDoPrompt()."
FIX TYPE: Comment replacement — no logic change
```

### CLAIM-004 — `causal-solver.ts:98–100` — `generateDoPrompt()` claims LLM has structural equations

```
FILE:    src/lib/services/causal-solver.ts
LINES:   98–100
TYPE:    Prompt string content
CURRENT: "you must strictly derive the consequences on downstream nodes based
          on the structural equations."
PROBLEM: The LLM has no structural equations. It has a text description of the
         intervention. Telling it to "derive from structural equations" is
         requesting a computation the LLM cannot perform correctly.
FIX:     Replace with:
         "Describe the likely consequences on downstream nodes, based on
          your understanding of the domain. Note: this is an approximate
          narrative response. For precise causal computation, the engine
          requires a formal TypedSCM with structural equations."
         AND add to the prompt header:
         "⚠ FALLBACK PATH: Formal equations not loaded. LLM narrative only."
FIX TYPE: Prompt string edit — no logic change.
         This is a vocabulary fix (removing "derive" / "structural equations")
         and an honest label (fallback path disclosure).
```

### CLAIM-005 — `causal-blueprint.ts:440–441` — `queryIntervention()` JSDoc uses P() notation

```
FILE:    src/lib/ai/causal-blueprint.ts
LINE:    440–441
TYPE:    JSDoc comment
CURRENT: "Intervention operator: estimate P(Y | do(X = x)).
          Propagates an exogenous change through directed edges with depth decay."
PROBLEM: (a) "P(Y | do(X = x))" is distributional notation — forbidden in v1.0.
         (b) The function does NOT compute P(Y | do(X = x)). It computes a BFS
             delta with 0.7 decay. These are different things.
FIX:     Replace with:
         "@deprecated for formal interventional claims (v1.0+). Use runCausalQuery().
          Heuristic propagation: BFS with 0.7 decay factor per edge.
          Returns a signal delta, not a causal effect estimate.
          Do not label outputs of this function as 'causal effects'."
FIX TYPE: JSDoc replacement + @deprecated tag
```

### CLAIM-006 — `causal-blueprint.ts:455` — `queryIntervention()` return value uses P() notation

```
FILE:    src/lib/ai/causal-blueprint.ts
LINE:    455
TYPE:    Return value field
CURRENT: estimand: `P(${outcome} | do(${interventionVariable}=${interventionValue}))`
PROBLEM: The estimand field uses distributional notation for a BFS-delta computation.
         This string propagates into trace logs and potentially UI display,
         creating visible causal theater.
FIX:     Replace with:
         estimand: `heuristic_signal(${outcome} | bfs_decay(${interventionVariable}=${interventionValue}))`
         OR if the field is used by the LLM explanation layer:
         estimand: `[HEURISTIC] Δ${outcome} given ${interventionVariable}=${interventionValue} (BFS approximation, not do-calculus)`
FIX TYPE: String literal replacement
```

### CLAIM-007 — `causal-blueprint.ts:431` — `queryAssociation()` uses P() notation

```
FILE:    src/lib/ai/causal-blueprint.ts
LINE:    431
TYPE:    Return value field
CURRENT: estimand: `P(${effect} | ${cause})`
PROBLEM: queryAssociation() computes a path weight (product of edge signs and
         strengths along the shortest directed path). This is a graph score, not
         a conditional probability P(effect | cause).
FIX:     Replace with:
         estimand: `assoc(${effect} | ${cause})`
         OR:
         estimand: `path_weight(${cause} → ${effect})`
FIX TYPE: String literal replacement
```

### CLAIM-008 — `causal-blueprint.ts:463–464` — `queryCounterfactual()` JSDoc uses Y_x(u) notation

```
FILE:    src/lib/ai/causal-blueprint.ts
LINE:    463–464
TYPE:    JSDoc comment
CURRENT: "Counterfactual operator: estimate Y_x(u) given observed world and a hypothetical action."
PROBLEM: (a) Y_x(u) is Pearl's Level 3 counterfactual notation requiring abduction
             over specific noise realization u. This function does not implement that.
         (b) The function calls queryIntervention() (BFS delta) and subtracts
             actualOutcome. This is "intervention comparison", not counterfactual.
FIX:     Replace with:
         "@deprecated for formal counterfactual claims (v2.0+).
          Computes difference between two heuristic BFS estimates:
          (intervenedOutcome - actualOutcome). This is NOT Y_x(u).
          Do not label outputs as 'counterfactual' without v2 abduction implementation."
FIX TYPE: JSDoc replacement + @deprecated tag
```

### CLAIM-009 — `causal-blueprint.ts:484` — `queryCounterfactual()` return value uses Level-3 notation

```
FILE:    src/lib/ai/causal-blueprint.ts
LINE:    484
TYPE:    Return value field
CURRENT: estimand: `${outcome}_${interventionVariable}(${interventionValue})`
PROBLEM: This uses Y_x(u) subscript notation (Pearl's Level 3) for what is
         actually a difference of two BFS-approximated values.
FIX:     Replace with:
         estimand: `[HEURISTIC] intervention_comparison(${outcome}, ${interventionVariable}=${interventionValue})`
FIX TYPE: String literal replacement
```

### CLAIM-010 — `counterfactual-trace.ts:91` — `computation_method: "deterministic_graph_diff"` is a misnomer

```
FILE:    src/lib/services/counterfactual-trace.ts
LINE:    91
TYPE:    Default value assignment
CURRENT: const method = input.method ?? "deterministic_graph_diff";
PROBLEM: The default method name "deterministic_graph_diff" implies a formal
         graph operation. The actual method is BFS with 0.7 decay — a heuristic
         signal propagation. The name misleads both engineers and audit logs.
FIX:     Replace with:
         const method = input.method ?? "heuristic_bfs_propagation";
         AND update the CounterfactualComputationMethod type in scm.ts to include:
           | "heuristic_bfs_propagation"    // BFS with decay — fallback path
           | "structural_equation_solver"   // v1.0 engine path — M6.2 compliant
FIX TYPE: String literal + type union update
```

### CLAIM-011 — `counterfactual-trace.ts:126` — `affectedPaths` uses string arrows implying causation

```
FILE:    src/lib/services/counterfactual-trace.ts
LINE:    73–78 (buildAffectedPaths) and line 126
TYPE:    Computed field format
CURRENT: paths like "InterestRate -> GDP" stored in computation.affectedPaths
PROBLEM: These strings use "→" to imply directed causal paths. They are actually
         just the set of nodes BFS visited from the intervention root.
         BFS-visited nodes are not necessarily causally downstream.
FIX:     Rename field to affectedNodes (which counterfactual-trace.ts line 459
         calls "affectedNodes" in the InterventionQueryResult anyway).
         Change format to: ["InterestRate", "GDP"] (plain array, not arrows).
         Add label in trace_json: "note": "BFS-visited nodes from intervention root.
         Not a formal causal path computation."
FIX TYPE: Field rename + format change
```

### CLAIM-012 — `causal-blueprint.ts:519–540` — `checkIdentifiability()` JSDoc claims backdoor criterion

```
FILE:    src/lib/ai/causal-blueprint.ts
LINES:   519–540 (function + JSDoc)
TYPE:    JSDoc comment and function name
CURRENT: JSDoc says "Backdoor-style identifiability check".
         Function name: checkIdentifiability.
PROBLEM: The function checks whether a provided adjustment set contains all
         known confounders (one-hop only: getStructuralConfounders() finds
         common parents). This is not the backdoor criterion.
         The backdoor criterion requires: (1) the adjustment set blocks all
         back-door paths, (2) no descendant of treatment is in the set.
         The current implementation satisfies neither condition formally.
FIX:     Rename to checkConfounderCoverage().
         JSDoc: "@deprecated for formal identifiability (v1.1+).
         Checks whether provided adjustment set covers known structural confounders.
         This is a coverage check, not the backdoor criterion.
         True backdoor identifiability requires path enumeration (v1.1)."
FIX TYPE: Function rename (requires find-replace across callers) + JSDoc update
```

---

## Search-and-Destroy Instructions for GPT (TASK-006)

Execute these in order. Each is a discrete, verifiable change.

```
TASK-006-A: String replacements in causal-solver.ts
  File: src/lib/services/causal-solver.ts

  A1. Replace JSDoc at line 16–19 (class description)
      OLD: "This service implements the Do-Calculus..."
      NEW: Per CLAIM-001 fix text above.

  A2. Replace JSDoc at line 18 ("calculates the mandatory state")
      Per CLAIM-002.

  A3. Replace JSDoc at line 25 ("Solves the graph")
      Per CLAIM-003.

  A4. Replace prompt text in generateDoPrompt() lines 98–100
      Per CLAIM-004.
      Also add @deprecated tag to generateDoPrompt():
      "@deprecated Direct LLM path. Use runCausalQuery() for engine-computed results.
       Retained for fallback when TypedSCM is not available."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK-006-B: String replacements and @deprecated tags in causal-blueprint.ts
  File: src/lib/ai/causal-blueprint.ts

  B1. queryIntervention() JSDoc at line 440–441
      Per CLAIM-005.

  B2. queryIntervention() return value estimand at line 455
      Per CLAIM-006.

  B3. queryAssociation() return value estimand at line 431
      Per CLAIM-007.

  B4. queryCounterfactual() JSDoc at line 463–464
      Per CLAIM-008.

  B5. queryCounterfactual() return value estimand at line 484
      Per CLAIM-009.

  B6. propagateIntervention() — add deprecation guard comment at line 626:
      "// DEPRECATED for causal-effect-labeled outputs (v1.0+).
      // This is BFS with 0.7 decay. Not do-calculus. Not graph mutilation.
      // Retained for fallback path in counterfactual-trace.ts when TypedSCM absent.
      // Do NOT use for any result labeled 'causal effect', 'intervention', or 'do()'."

  B7. checkIdentifiability() — per CLAIM-012.
      NOTE: Before renaming, run grep for all callers of checkIdentifiability
      and update each call site to checkConfounderCoverage().
      Callers: identifiability-gate.ts (verify at line ~63).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK-006-C: Method name and type updates in counterfactual-trace.ts and scm.ts
  Files: src/lib/services/counterfactual-trace.ts
         src/types/scm.ts

  C1. Change default method from "deterministic_graph_diff" to "heuristic_bfs_propagation"
      Per CLAIM-010 (counterfactual-trace.ts line 91).

  C2. Update CounterfactualComputationMethod union type in scm.ts to include:
      | "heuristic_bfs_propagation"
      | "structural_equation_solver"
      Remove "deterministic_graph_diff" if it was the only prior member,
      OR keep it as an alias with @deprecated if old traces exist in the DB.

  C3. Rename affectedPaths field in CounterfactualTrace computation block
      to affectedNodes. Change string format from "A -> B" to ["A", "B"].
      Update buildAffectedPaths() accordingly.
      Add note field: "note": "BFS-visited nodes from intervention root. Not a formal causal path."
      Per CLAIM-011.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK-006-D: Verification grep — run after all changes
  After completing A, B, C above, run the following searches
  and confirm zero results:

  grep -r "P(Y | do("           src/   → should find 0 matches
  grep -r "P(${outcome}"        src/   → should find 0 matches
  grep -r "Rung 2/3"            src/   → should find 0 matches
  grep -r "Do-Calculus"         src/   → should find 0 matches (unless in v2 stubs)
  grep -r "deterministic_graph_diff"   → should find 0 matches (replaced by heuristic_bfs_propagation)
  grep -r "derive the consequences.*structural equations"  → should find 0 matches
  grep -r "Y_x("                src/   → should find 0 matches in v1.0 engine code

  Any remaining match is an uncaught theater claim that must be resolved before TASK-006 closes.
```

---

## Claims NOT Audited Here (Out of Scope / Deferred)

| Location | Reason deferred |
|---|---|
| UI strings in React components | Requires separate UI audit. No React files read. Flag for v1.1 UI pass. |
| `scientific-gateway.ts` `verify()` output | Calls `validateMechanism()` — this is Tier 1 physics constraint validation, not causal theater. Different domain. |
| Database `counterfactual_traces` rows already persisted | Cannot be changed retroactively. Existing rows with `deterministic_graph_diff` are data artifacts. New rows will use correct method name. |
| `88.4% causal accuracy` claim | If this appears in UI or docs, it must be removed. Not found in files read. Search for "88.4" if it exists elsewhere. |

---

## Output Classification Footer

```
Output Classification:     Execution Spec (THINK-005) + Overclaim Audit (THINK-006)
Formal Artifacts Produced:
  THINK-005:
    1. runCausalQuery pseudocode (causal-engine-bridge.ts)
    2. Modified buildCounterfactualTrace pseudocode (M6.2 compliant)
    3. Modified CausalSolver.solve() routing pseudocode
    4. mutilateGraph return signature update
  THINK-006:
    5. Theater Claim Register: 12 claims, each with exact file:line, current text,
       fix text, and fix type
    6. TASK-006-A through TASK-006-D: discrete GPT instructions
    7. Verification grep set (post-fix confirmation)
Spec Sections Affected:    Section 7 (Layers 1–5), Section 10 (F1–F5), Section 12
Notation Compliance:       COMPLIANT
Recommendation for Gemini:
  Hand TASK-006 instructions (A through D + verification greps) to GPT verbatim.
  After GPT completes, run the verification grep set to confirm zero theater claims remain.
  Then run B1–B6 benchmark suite to confirm engine path produces correct results.
  Final 6-point verification checklist: LLM-independence test, notation audit,
  benchmark pass rate, trace integrity, graceful degradation, assumption disclosure.
```
