# Causal Engine v1.0
## Specification

A deterministic SCM intervention executor for fully specified acyclic causal models, with graph mutilation and benchmarked forward solving, plus an LLM explanation layer.

- **Project:** MASA — Methods of Automated Scientific Analysis
- **Author:** Rhine Lesther Tague
- **Institution:** Mapua Malayan University, Davao City, Philippines
- **Spec Rewrite:** Claude Opus 4.6, from Perplexity Computer original (March 12, 2026)
- **Date:** March 13, 2026
- **Classification:** Internal Engineering Document

> "If the LLM disappeared tomorrow, would the core causal computation still work? If the answer is no, that component is not part of the engine."

---

# Part 1 — Rewrite Summary

## What the Original Spec Was Trying to Do

The original spec (517 lines, 13 sections) aimed to define a v1 causal engine for the Crucible/MASA platform. It correctly diagnosed the codebase's core problem — all causal reasoning is delegated to LLMs via prompt engineering, with zero genuine causal computation — and proposed an SCM execution engine as the fix. The diagnosis was accurate. The architecture was sound. The failure modes section was unusually honest.

## What the Main Weaknesses Were

Seven systematic problems, all stemming from one root cause: the spec was written from Pearl's textbook perspective (where adjustment, identifiability, and distributional notation are central) rather than from the v1 engineering perspective (where the model is fully specified and the engine just needs to solve equations).

1. **Probabilistic notation overclaim.** The spec uses P(Y | do(X = x)) throughout, but v1 is deterministic (all U_i = 0). It computes point values, not distributions. Using distributional notation for scalar computation is mathematically misleading.

2. **Adjustment logic included too early.** Backdoor and frontdoor adjustment are observational recovery formulas — they recover causal effects from observational data when you lack the full model. v1 has the full model. Graph mutilation IS the v1 answer. Adjustment is a category error here.

3. **Identifiability gate is vacuous.** With no hidden confounders and a fully specified model, every causal effect is identifiable by construction. An identifiability check is tautological under the v1 assumption envelope.

4. **Query class inflation.** Seven query types listed, but only three are real for a deterministic full-model executor: observational, interventional, and conditional interventional. "Backdoor adjustment" and "frontdoor adjustment" are irrelevant when you can compute directly.

5. **Benchmark mismatch.** B3 (Frontdoor) requires a hidden confounder U. B7 (Napkin Problem) is semi-Markovian. Both violate the v1 assumption of no hidden confounders. The spec tests capabilities it explicitly defers.

6. **Mixed vocabulary.** Three notation styles coexist: P(Y | do(X = x)), Y_x(u), and Y(do(X=x)). The spec identifies the correct fix in failure mode F7 but never applies it retroactively.

7. **Residual hype.** "Mathematically legitimate causal inference engine" overstates what v1 delivers. v1 is an algebraic equation solver with graph surgery. Valuable, but should not be dressed up.

## What the Rewritten v1.0 Now Is

**Causal Engine v1.0 is a deterministic SCM intervention executor for fully specified acyclic causal models, with graph mutilation and benchmarked forward solving, plus an LLM explanation layer.**

It takes a complete SCM (DAG + linear structural equations + parameters), performs graph surgery for do-operations, solves the mutilated system by forward substitution in topological order, and returns a numeric result. The LLM translates user questions into formal queries and explains results. The LLM never computes.

---

# Part 2 — Rewritten Causal Engine v1.0 Spec

---

## 1. Executive Framing

### What Causal Engine v1.0 Is

A deterministic structural causal model execution engine. Given a fully specified SCM — a directed acyclic graph, linear structural equations with known parameters, and an intervention do(X = x) — the engine performs graph mutilation, solves the modified system by forward evaluation in topological order, and returns the numeric value of any downstream variable. All exogenous noise terms are fixed at zero. The result is a point value, not a distribution.

### What Causal Engine v1.0 Is Not

- Not a causal discovery engine. It does not learn graph structure from data.
- Not a probabilistic inference engine. It does not compute distributions over outcomes.
- Not a counterfactual engine. Pearl's Level 3 (abduction–action–prediction) is deferred.
- Not an adjustment engine. It does not recover causal effects from observational data.
- Not a do-calculus theorem prover. It does not apply Pearl's three rules symbolically.
- Not a replacement for the LLM layer. The LLM translates queries and explains results.

### Design Test

The engine must satisfy two non-negotiable tests:

1. **LLM-disappearance test.** Remove all LLM calls. Feed the engine a programmatic CausalQuery and a typed SCM. It must return the correct numeric answer. If it cannot, the engine is not real.

2. **Engineer-buildability test.** An engineer must be able to implement the v1.0 core from this document alone, without pretending that unsupported math (adjustment formulas, noise distributions, identifiability algorithms) already exists.

---

## 2. Problem Statement

### The Problem

The MASA codebase contains zero genuine causal inference algorithms. The technical audit established:

- Intervention effects are computed by BFS with a hardcoded 0.7 decay factor per edge (`propagateIntervention()` in `causal-blueprint.ts`, line 639). This is graph signal propagation, not do-calculus.
- d-Separation uses a one-hop common-parent check (`checkIdentifiability()` in `causal-blueprint.ts`, lines 519–541). It fails on multi-hop confounding and does not handle colliders correctly.
- `CausalSolver.solve()` is an explicit stub (`causal-solver.ts`, lines 27–53). The source comment reads: *"For MASA v3.1, since we don't have the equation definitions f_i in the TS class yet, we perform a 'Graph Traversal'… and generate a 'Constraint Prompt' for the LLM to solve the specific value."*
- `CounterfactualGenerator` prompts the LLM for three hypothetical scenarios and parses the JSON response. No algorithmic counterfactual computation exists.
- `structuralEquationsJson` in the database schema (`scm_model_versions` table) is typed as `Array<Record<string, unknown>>` — an unstructured blob with no enforced shape.

The system is, in Pearl's taxonomy, a Layer 1 (Association) statistical engine wrapped in Layer 2/3 vocabulary.

### Why LLM-Based Causal Reasoning Is Insufficient

An LLM has no access to the data-generating process. It cannot compute the value of Y under do(X = x) because it has no structural equations, no graph mutilation operator, and no formal model of confounding. It can only pattern-match on text that resembles causal reasoning.

LLM outputs are stochastic and unverifiable. Two runs of the same intervention query may produce contradictory numeric estimates with no mechanism for detecting the inconsistency.

### Why a Formal Computation Core Is Required

Without one, every causal claim produced by MASA is an LLM opinion with causal vocabulary. Users receive numerically wrong causal effect estimates with no way to detect the error. The system cannot be benchmarked against known causal inference test cases. A formal engine eliminates both risks for the class of problems it covers.

---

## 3. Formal Target of v1.0

| Engine Type | v1.0? | Rationale |
|---|---|---|
| **Deterministic SCM Execution Engine** | **YES** | Given a fully specified SCM (DAG + equations + parameters), compute the value of any variable under do(X = x) by graph mutilation and forward evaluation. Smallest real unit. No data needed. Pure algebra. |
| Stochastic SCM Execution Engine | NO (v2) | Requires noise distributions P(U_i), Monte Carlo sampling, and distributional output. Significant infrastructure beyond v1.0. |
| Adjustment / Observational Recovery Engine | NO (v1.1) | Recovers causal effects from observational data via backdoor/frontdoor formulas. Irrelevant when the full model is given. |
| Identifiability Engine | NO (v1.1) | Determines whether a causal effect is identifiable from a DAG with latent variables. Under v1.0 assumptions (no hidden confounders, full model), everything is identifiable by construction. |
| Do-Calculus Theorem Prover | NO (v2+) | Implements Pearl's three rules as symbolic rewrite rules. Overkill for v1.0. |
| Causal Discovery Engine | NO (v2+) | Learns graph structure from observational data (PC, GES, LiNGAM). Orthogonal to computation. |
| Counterfactual Engine | NO (v2) | Pearl's three-step procedure (abduction, action, prediction) requires posterior inference over noise terms. |

**Decision: v1.0 is a deterministic SCM execution engine.**

An SCM execution engine is the foundation for all higher causal operations. Do-calculus needs an executor to produce numeric answers. Counterfactual inference needs an executor for the action and prediction steps. Everything else builds on solving f_i(pa_i) under graph surgery. This is the smallest unit that passes the LLM-disappearance test.

---

## 4. Minimal Mathematical Requirements

| Component | What It Is | v1.0? | Crucible Status |
|---|---|---|---|
| **Variables V** | Finite set of named variables, each with a defined domain (real, integer, binary). | YES | `CausalNode` exists but lacks typed domain ranges. |
| **Structural Equations F** | For each endogenous variable V_i, a function f_i: Pa(V_i) → V_i mapping parent values to outcome. v1.0: linear only. | YES | `structuralEquationsJson` exists as `Array<Record<string, unknown>>`. Untyped. First task. |
| **Parameters θ** | Known numeric coefficients in each structural equation. | YES | Not represented. Must be part of the typed equation format. |
| **DAG G** | Directed acyclic graph encoding parent–child relationships consistent with F. | YES | `dagJson` exists with nodes/edges. Adequate. |
| **Intervention Operator do(X=x)** | Graph mutilation: remove all incoming edges to X in G, fix f_X = x (constant), recompute downstream. | YES | Does not exist. `generateDoPrompt()` describes this in English for the LLM. Must become code. |
| **Graph Mutilation** | Given do(X=x): (1) clone G to G', (2) delete edges into X in G', (3) replace f_X with constant x in G'. | YES | Not implemented. This is the core deliverable. |
| **Forward Computation** | Topological sort of mutilated graph G', then evaluate each f_i in causal order to compute all downstream values. | YES | Does not exist. `propagateIntervention()` BFS with 0.7 decay is not this. |
| **Model Completeness Validation** | Verify: DAG is acyclic, every endogenous node has an equation, every parent referenced in equations exists as a node, no orphan variables, all parameters present. | YES | Partially exists. Needs expansion. |
| Exogenous Noise U_i | Independent noise terms with specified distributions. | v2 | Not represented. v1.0 sets all U_i = 0. |
| Adjustment Formulas | Backdoor: Σ_Z P(Y\|X,Z)P(Z). Frontdoor: Σ_M P(M\|X) Σ_X' P(Y\|M,X')P(X'). | v1.1 | `checkIdentifiability()` is one-hop only. Irrelevant for v1.0 (full model available). |
| Probability Infrastructure | Parameterized distributions, density evaluation, expectation computation. | v2 | Nothing exists. |

**v1.0 core: Variables, Structural Equations (linear), Parameters, DAG, Intervention Operator (Graph Mutilation), Forward Computation, Model Completeness Validation.**

---

## 5. Assumption Envelope

Every assumption exists to avoid a complexity class that would compromise mathematical correctness. These are not weaknesses — they are honesty.

| Assumption | Why Imposed | What It Avoids | Relaxation Path |
|---|---|---|---|
| **Acyclic DAGs only** | Cyclic SCMs require fixed-point computation and may have multiple equilibria. | Equilibrium selection, convergence proofs. | v2+: Fixed-point iteration for cycles. |
| **No hidden confounders** | Hidden confounders require the full ID algorithm or partial identification bounds. | Tian's c-component decomposition, causal bounds. | v1.1: Backdoor/frontdoor for known latent structure. v2: Full ID algorithm. |
| **Fully specified model** | v1.0 does not learn parameters from data. The user or domain template provides all equations and coefficients. | Parameter estimation, maximum likelihood, Bayesian inference. | v2+: Parameter learning from data. |
| **Linear structural equations only** | Linear SCMs have closed-form solutions: V_i = Σ(β_j · Pa_j). | Nonlinear equation solving, iterative numeric methods, convergence. | v1.1: Nonlinear via mathjs.evaluate() or Pyodide + SymPy. |
| **Deterministic (U_i = 0)** | All noise terms fixed at zero. The engine returns point values, not distributions. | Monte Carlo sampling, density estimation, distributional output. | v2: Stochastic SCMs with P(U_i) specifications. |
| **No causal discovery** | Structure learning is a separate problem. v1.0 assumes the graph is given. | PC algorithm, GES, conditional independence testing. | v2+: At least one discovery algorithm. |
| **No time-series** | Temporal causal models require dynamic Bayesian networks. | State-space models, lag selection, temporal confounding. | v2+: Granger or structural time-series models. |

**Notation consequence:** Because v1.0 is deterministic, the result of an intervention is a point value, not a distribution. The correct notation is:

- **v1.0:** `Y_{do(X=x)}` — "the value of Y when X is set to x in the mutilated model"
- **Not v1.0:** `P(Y | do(X = x))` — this is distributional and requires noise distributions (v2)

This notation discipline must be enforced throughout the codebase, UI, and documentation.

---

## 6. Supported Query Classes

| Query Type | Notation | v1.0? | How Computed | Notes |
|---|---|---|---|---|
| **Observational** | Y given X=x, Z=z | YES | Evaluate structural equations in the natural (unmutilated) graph. Topological sort, forward propagation. | No causal claims. This is conditional evaluation given the model. |
| **Interventional** | Y_{do(X=x)} | YES | Graph mutilation: remove edges into X, set f_X = x, forward-compute Y. | The core v1.0 operation. |
| **Conditional Interventional** | Y_{do(X=x), Z=z} | YES | Graph mutilation + conditioning: set X = x in mutilated graph, then evaluate Y for cases where Z = z. | Must not confuse do(X) with Z=z versus do(X, Z). |

### Derived Computations (not separate query classes)

| Computation | How Derived | Notes |
|---|---|---|
| **Treatment effect (model-conditional)** | Y_{do(X=1)} − Y_{do(X=0)} | Difference of two interventional queries. Valid for the given model. Not a population ATE without data. |
| **Multi-variable intervention** | Y_{do(X=x, Z=z)} | Mutilate both X and Z simultaneously. |

### Explicitly Not Supported in v1.0

- Backdoor adjustment (observational recovery — requires data, not full model)
- Frontdoor adjustment (observational recovery — requires hidden confounder structure)
- Counterfactuals: Y_{x}(u) for specific u (requires abduction)
- Nested counterfactuals: P(Y_{x'} = y' | X = x, Y = y)
- Natural direct/indirect effects (NDE/NIE)
- Instrumental variable estimation
- Causal effect bounds under non-identifiability
- Conditional average treatment effects from heterogeneous data

---

## 7. Engine Architecture

Five layers with strict boundaries between what the formal engine computes and what the LLM may contribute.

### Layer 1: Query Representation

Parses user input into a formal query. Accepts either a programmatic API call or a natural-language question via LLM translation.

**LLM may:** Translate natural language to a CausalQuery object.
**LLM must NOT:** Supply or modify structural equations, graph structure, or parameters.

```typescript
interface CausalQuery {
  type: 'observational' | 'interventional';
  treatment: string;          // Variable name to intervene on
  outcome: string;            // Variable name to observe
  doValue: number;            // Intervention value
  conditions?: Record<string, number>; // Optional conditioning set
}
```

### Layer 2: Formal Causal Model Representation

Stores and validates the SCM. This is where the existing `structuralEquationsJson` blob becomes typed and executable.

```typescript
interface StructuralEquation {
  variable: string;                    // V_i (endogenous variable name)
  parents: string[];                   // Pa(V_i) — parent variable names
  coefficients: Record<string, number>; // {parentName: coefficient} for linear form
  intercept: number;                   // Constant term (default 0)
}
// V_i = intercept + Σ(coefficients[parent] * parent_value)
// All U_i implicitly zero in v1.0.
```

```typescript
interface TypedSCM {
  variables: SCMVariable[];             // Typed variable definitions with domains
  equations: StructuralEquation[];      // One per endogenous variable
  dag: { nodes: string[]; edges: Array<{ from: string; to: string }> };
}
```

**Insertion point:** The `structuralEquationsJson: Array<Record<string, unknown>>` field in `scm_model_versions` is the migration target. The `counterfactual_traces` table already has `computation_method = 'structural_equation_solver'` as a valid CHECK constraint.

### Layer 3: Computation Core

> **The LLM has zero involvement in this layer.**

Three operations, executed in sequence:

1. **Model Completeness Validation.** Verify: DAG is acyclic (topological sort succeeds), every endogenous variable has exactly one equation, every parent referenced in an equation exists as a node, all coefficients are finite numbers, no orphan variables. Reject with typed error if invalid.

2. **Graph Mutilation.** Given do(X = x): clone the DAG and equation set, remove all incoming edges to X, replace the equation for X with `{ variable: X, parents: [], coefficients: {}, intercept: x }`. Return the mutilated SCM.

3. **Forward Computation.** Topologically sort the mutilated DAG. Evaluate each equation in order by direct substitution: V_i = intercept + Σ(coeff_j × value_j) where value_j is the already-computed value of parent j. Return all computed values.

**Implementation:** Linear equations via `mathjs.evaluate()` or direct arithmetic. No external solver needed for linear systems with known topological order.

**Deprecation:** Once this layer exists, `propagateIntervention()` in `causal-blueprint.ts` (BFS with 0.7 decay) must be blocked for interventional claims. It may remain for heuristic UI animations but must not produce values labeled as causal effects.

### Layer 4: Validation Layer

Post-computation checks before results are returned:

- **Domain bounds check:** Computed values fall within declared variable domains.
- **Numeric sanity:** No NaN, no Infinity, no magnitudes exceeding plausible bounds.
- **Computation trace:** Full record of mutilated graph, evaluation order, intermediate values, and final result.
- **Assumption disclosure:** Every result carries: "This result assumes: (1) the provided model is correct, (2) no hidden confounders exist, (3) all noise terms are zero."

### Layer 5: Explanation Layer

The LLM re-enters here, and only here.

**LLM receives:** The numeric result, the mutilated graph, the evaluation trace, and the assumption disclosure.

**LLM produces:** A natural-language explanation of what the engine computed and what it means.

**LLM must NOT:** Override, adjust, or second-guess the numeric output. The computed value is injected into the LLM's context as a hard constraint via the existing `ConstraintInjector`.

**UI requirement:** Computed values (from the engine) must be visually distinguished from explained values (from the LLM). The UI must never present an LLM-generated number in the same format as an engine-computed number.

---

## 8. Canonical v1.0 Query Pipeline

Steps 3–5 are the engine. The LLM participates only in Steps 1, 2, and 7.

### Step 1: User Question [LLM]

User asks: "What would happen to GDP if we set Interest Rate to 5%?"

### Step 2: Query Translation [LLM, constrained]

LLM produces a structured CausalQuery:
```json
{ "type": "interventional", "treatment": "InterestRate", "outcome": "GDP", "doValue": 5.0 }
```

### Step 3: SCM Load + Validation [Engine]

Load the domain's SCM from `scm_model_versions`. Run model completeness validation:
- DAG is acyclic ✓
- All endogenous variables have equations ✓
- All parent references resolve ✓
- All coefficients are finite ✓

If invalid → reject with typed error. Do not compute.

### Step 4: Graph Mutilation [Engine]

Clone the SCM. Remove all incoming edges to InterestRate. Replace its equation with:
```
InterestRate = 5.0  (constant, no parents)
```

### Step 5: Forward Computation [Engine]

Topological sort of mutilated graph: [InterestRate, Inflation, GDP]

Evaluate in order:
```
InterestRate = 5.0                                    (intervention)
Inflation    = 0.3 × InterestRate         = 0.3 × 5.0 = 1.5
GDP          = −0.4 × InterestRate + 0.6 × Inflation
             = −0.4 × 5.0 + 0.6 × 1.5    = −2.0 + 0.9 = −1.1
```

Return:
```json
{
  "outcome": "GDP",
  "value": -1.1,
  "allValues": { "InterestRate": 5.0, "Inflation": 1.5, "GDP": -1.1 },
  "evaluationOrder": ["InterestRate", "Inflation", "GDP"],
  "mutilatedEdgesRemoved": ["ConsumerConfidence → InterestRate"],
  "assumptions": ["deterministic (U=0)", "no hidden confounders", "model as specified"]
}
```

### Step 6: Trace Persistence [Engine]

Store in `counterfactual_traces` with `computation_method = 'structural_equation_solver'`, full `trace_json` including mutilated graph, evaluation order, intermediate values, and assumption set.

### Step 7: Explanation [LLM, constrained]

LLM receives the full computation result. LLM produces natural-language explanation. The value −1.1 is a hard constraint the LLM cannot modify.

> **Integration:** This replaces Steps 12–13 of the current causal-chat pipeline (`CausalSolver.solve()` stub + `generateDoPrompt()`). The engine's result is injected as a hard constraint into the `ConstraintInjector` system prompt. The LLM explains but cannot override.

---

## 9. Benchmark / Validation Suite

Every benchmark uses a fully specified SCM with no hidden confounders, consistent with the v1.0 assumption envelope. Each has a hand-computable correct answer.

| ID | Name | Graph | Equations (U_i = 0) | Correct Answer | What Failure Means |
|---|---|---|---|---|---|
| **B1** | Confounded Fork | X ← Z → Y, X → Y | Z=1, X = 0.5Z, Y = 0.3X + 0.7Z | Y_{do(X=1)} = 0.3(1) + 0.7(1) = 1.0. Mutilation severs Z→X, so Z retains its natural value. | Engine includes Z→X path in do-computation (fails to mutilate). |
| **B2** | Collider Bias | X → C ← Y | C = X + Y, X=1, Y=1 | Y_{do(X=2)}: Y unchanged = 1. X does not cause Y. | Engine incorrectly propagates through collider. |
| **B3** | Simple Chain | X → M → Y | M = 0.8X, Y = 0.6M | Y_{do(X=1)} = 0.6 × 0.8 = 0.48. | Incorrect forward propagation through mediator. |
| **B4** | Common Cause (Fork) | Z → X, Z → Y | Z=2, X = Z, Y = 0.5Z | Y_{do(X=5)}: Y = 0.5(2) = 1.0. X does not cause Y. Mutilation severs Z→X. | Reports X→Y effect (fundamental mutilation failure). |
| **B5** | Multi-Intervention | X → Y, Z → Y, W → X | W=1, X = 0.5W, Z=3, Y = 0.4X + 0.6Z | Y_{do(X=2, Z=3)} = 0.4(2) + 0.6(3) = 2.6. | Incorrect handling of simultaneous interventions. |
| **B6** | Diamond Graph | X → A, X → B, A → Y, B → Y | A = 0.5X, B = −0.3X, Y = A + B | Y_{do(X=2)} = 0.5(2) + (−0.3)(2) = 1.0 − 0.6 = 0.4. | Incorrect multi-path propagation or sign handling. |

**Acceptance criteria:**

- B1–B6 must pass with exact numeric agreement (floating-point tolerance: 1e-10).
- All benchmarks automated as unit tests running on every commit.
- Each test specifies the SCM, the do-query, and the expected answer — no LLM involvement.

**Deferred benchmarks (v1.1+):**

- Frontdoor criterion (requires hidden confounders — outside v1.0 assumptions)
- Napkin Problem / semi-Markovian graphs (requires full ID algorithm)
- Stochastic benchmarks with E[Y | do(X)] (requires noise distributions)

---

## 10. Failure Modes and Fake-Causality Risks

### F1: Graph propagation masquerading as intervention

**Risk:** The existing `propagateIntervention()` in `causal-blueprint.ts` uses BFS with a 0.7 decay factor. This computes a graph signal, not a causal effect. It includes spurious paths through confounders because it does not mutilate the graph.

**Mitigation:** Once the engine exists, do-queries must exclusively use graph mutilation + forward evaluation. The 0.7-decay path must be deprecated for any output labeled "causal effect." It may remain for non-causal UI heuristics only.

### F2: LLM-generated causal language without formal backing

**Risk:** `CounterfactualGenerator` asks the LLM to imagine scenarios. The output sounds like counterfactual reasoning but has no mathematical basis.

**Mitigation:** v1.0 must clearly label: (a) engine-computed values as "computed," (b) LLM-generated explanations as "explained (not computed)." The UI must visually distinguish these. No LLM-generated number may appear in the same format as an engine result.

### F3: Regression coefficients mislabeled as causal effects

**Risk:** `linearRegression()` in `scientific-compute-engine.ts` computes valid OLS. Regression coefficients are associational, not causal, unless the model is correctly specified and confounding is addressed.

**Mitigation:** Regression results must be labeled "association (Layer 1)." Only engine-computed interventional results may be labeled "causal effect (Layer 2)."

### F4: Model specification errors

**Risk:** If the user provides wrong structural equations, the engine computes the wrong answer correctly. Garbage in, garbage out — but confidently.

**Mitigation:** Every output must state: "Result is conditional on the provided model specification." The assumption disclosure is mandatory, not optional. v2+ should include sensitivity analysis.

### F5: Deterministic results presented as distributional

**Risk:** v1.0 returns Y_{do(X=x)} = −1.1, a point value. If presented as P(Y | do(X)) or described as "the probability distribution," users are misled about the engine's capabilities.

**Mitigation:** Strict notation discipline. v1.0 outputs must use deterministic notation. The string `P(Y | do(X))` must not appear in any v1.0 engine output, UI label, or log message. Reserve distributional notation for v2 when noise distributions are implemented.

### F6: Hidden confounding assumed away

**Risk:** v1.0 assumes no hidden confounders. Users may specify models with implicit missing common causes. The engine will compute a biased answer with full confidence.

**Mitigation:** Every output must include the assumption: "No hidden confounders between [variables]. If unmeasured confounding exists, this estimate is biased." Make the assumption loud, not buried.

---

## 11. Implementation Priorities

### v1.0 Core (must build)

| Deliverable | File | Effort | Dependencies |
|---|---|---|---|
| **StructuralEquation type** | `src/types/scm.ts` | ~1 day | None. This is the foundation. Type `structuralEquationsJson` properly. |
| **Structural Equation Solver** | NEW: `src/lib/compute/structural-equation-solver.ts` | ~3–4 days | Types. Parse linear equations, topological sort, forward evaluation via direct arithmetic or mathjs. |
| **Graph Mutilation operator** | Within `structural-equation-solver.ts` | ~1–2 days | Solver. Clone graph, remove incoming edges to X, replace equation with constant. |
| **CausalSolver.solve() rewrite** | `src/lib/services/causal-solver.ts` | ~2 days | Solver + Mutilation. Replace stub with call to real solver. Graceful fallback to LLM-based path when equations are missing. |
| **Model Completeness Validation** | Within solver or `identifiability-gate.ts` | ~1 day | Types. Acyclicity check (topological sort), equation coverage, parent resolution, parameter completeness. |
| **Benchmark test suite** | NEW: `tests/benchmarks/causal-engine-v1.test.ts` | ~2 days | Solver. Implement B1–B6 as automated tests. |
| **Hard constraint injection** | `src/lib/services/constraint-injector.ts` | ~1 day | Solver. Inject computed values as non-negotiable constraints in LLM prompt. |

**Total estimated effort: 11–14 engineering days.**

### v1.1 Candidates (build next)

- Nonlinear equation support via `mathjs.evaluate()` or Pyodide + SymPy fallback
- CausalQuery type and LLM-to-formal query translation pipeline
- Existing domain SCM templates converted to typed StructuralEquation format
- UI visual distinction between computed (engine) and explained (LLM) results
- Backdoor criterion (multi-hop path enumeration) for models with declared confounders
- Frontdoor criterion check
- Database migration enforcing `structural_equations_json` schema validation

### v2+ (explicitly deferred)

- Stochastic SCMs with noise distributions and Monte Carlo
- Pearl's three-step counterfactual procedure
- Full ID algorithm for semi-Markovian graphs
- Causal discovery from data (PC, GES, LiNGAM)
- Treatment effect estimation from observational data (IPW, AIPW)
- Sensitivity analysis (Rosenbaum bounds, E-values)
- Causal effect bounds for non-identifiable queries
- Integration with DoWhy/pgmpy via Pyodide
- Time-series causal models

---

## 12. Claim Discipline

### Notation Discipline

| Notation | When to Use | When NOT to Use |
|---|---|---|
| Y_{do(X=x)} | Engine computed a deterministic result | Never in v2 stochastic context |
| P(Y \| do(X = x)) | v2+ stochastic computation with noise distributions | Anywhere in v1.0 |
| Y_x(u) | v2+ counterfactual with specific noise realization | Anywhere in v1.0 |
| "causal effect" | Engine computed Y_{do(X=x)} from structural equations | Regression coefficient or LLM estimate |

### Vocabulary Discipline

| Term | Permitted When | Prohibited When |
|---|---|---|
| **Causal effect** | Engine computed Y_{do(X=x)} via graph mutilation + forward evaluation | BFS propagation with decay, regression coefficient, or LLM narrative |
| **Intervention** | Graph mutilation was performed (edges removed, equation replaced) | Signal propagation without graph surgery |
| **Causal inference** | v1.0 engine produced a numeric result from structural equations | LLM explained causal concepts (call this "causal reasoning assistance") |
| **Counterfactual** | v2+: Three-step procedure with abduction was performed | v1.0: Two interventional queries compared (call this "intervention comparison") |
| **SCM-based computation** | Structural equations were loaded, mutilated, and solved | `propagateIntervention()` BFS or `generateDoPrompt()` LLM delegation |

### Claims Prohibited Until Implemented

| Claim | Required Implementation |
|---|---|
| "Counterfactual intelligence" | Pearl's three-step with abduction (v2) |
| "Do-calculus engine" | Full three rules as symbolic rewrite system (v2+) |
| "Causal discovery" | At least one structure learning algorithm (v2+) |
| "Complete" badge on any causal capability | Benchmarks independently verified |
| "88.4% causal accuracy" | Replace with benchmark pass rate (e.g., "B1–B6 passing, 1e-10 tolerance") |

---

## 13. Final Recommendation

### Engine Type

**Deterministic SCM Execution Engine.** A structural equation solver with graph mutilation, operating on fully specified linear acyclic causal models with known parameters and zero noise.

### Assumptions

- Acyclic DAGs only
- No hidden confounders
- Fully specified model (user provides graph + equations + parameters)
- Linear structural equations only
- Deterministic computation (all U_i = 0)

### First Working Milestone

A TypeScript module (`structural-equation-solver.ts`) that:

1. Accepts a typed SCM (StructuralEquation[] + DAG) and a CausalQuery
2. Validates model completeness (acyclicity, equation coverage, parent resolution)
3. Performs graph mutilation for do(X = x)
4. Computes the answer by forward evaluation in topological order
5. Returns a typed result with the numeric value and full computation trace
6. Passes benchmarks B1–B6 with exact numeric agreement (1e-10 tolerance)

### Evidence of Scientific Legitimacy

v1.0 is scientifically legitimate when:

1. **Benchmark suite passes.** B1–B6 all produce results matching hand-computed values to floating-point precision.
2. **LLM-independence test.** Remove all LLM calls. The engine accepts a programmatic CausalQuery and returns the correct answer.
3. **Textbook reproduction.** Reproduce at least one published result from Pearl's *Causality* (2009) or Peters, Janzing, and Scholkopf's *Elements of Causal Inference* (2017) using the engine.
4. **External validation.** For the same SCM and query, confirm that v1.0's answer matches DoWhy's GCM module or pgmpy's CausalInference class.
5. **No regression.** The existing LLM-based causal reasoning pipeline continues to work for queries outside v1.0's scope. Graceful degradation is maintained.

### Closing

The MASA platform has the vocabulary, the architecture, and the ambition. What it needs now is the algebra. v1.0 is not about building everything — it is about building one thing that is real. A single structural equation solver that passes six benchmarks is worth more than ten LLM prompts that describe causal reasoning in eloquent prose.

---

# Part 3 — v1.0 vs Deferred Work Boundary

| Capability | Status | Why |
|---|---|---|
| Deterministic SCM execution (linear, U=0) | **v1.0 core** | The irreducible unit. Graph mutilation + forward solve. |
| Graph mutilation (do-operator) | **v1.0 core** | Inseparable from SCM execution. Edge deletion + equation replacement. |
| Topological forward solving | **v1.0 core** | The computation method for acyclic graphs with known equations. |
| Model completeness validation | **v1.0 core** | Prerequisite for correct computation. Acyclicity, coverage, resolution. |
| Benchmark suite (B1–B6) | **v1.0 core** | Correctness evidence. No engine claim without passing benchmarks. |
| LLM query translation | **v1.0 core** | Layer 1. Natural language → CausalQuery. Not computation. |
| LLM explanation layer | **v1.0 core** | Layer 5. Explains engine output. Cannot override numeric results. |
| Hard constraint injection (engine → LLM) | **v1.0 core** | Prevents LLM from contradicting computed values. |
| Nonlinear equation support | **v1.1 candidate** | Requires mathjs.evaluate() or Pyodide/SymPy. Linear-first is simpler and covers most templates. |
| Backdoor adjustment (observational recovery) | **v1.1 candidate** | Irrelevant when full model is given. Needed when v1.1 handles partial models or declared confounders. |
| Frontdoor adjustment | **v1.1 candidate** | Same rationale as backdoor. Requires hidden confounder modeling. |
| Identifiability checking | **v1.1 candidate** | Vacuous under v1.0 assumptions. Becomes real when hidden confounders are modeled. |
| d-Separation (Bayes-Ball algorithm) | **v1.1 candidate** | Not needed for v1.0 computation. Needed for v1.1 identifiability and adjustment validation. |
| Stochastic SCMs (P(U_i) distributions) | **v2+** | Requires probability infrastructure, Monte Carlo, distributional output. Major scope increase. |
| Full distributional P(Y \| do(X)) | **v2+** | Requires stochastic SCMs. v1.0 returns point values only. |
| Counterfactual abduction–action–prediction | **v2+** | Requires posterior inference over noise terms. Pearl's Level 3. |
| Do-calculus theorem prover | **v2+** | Symbolic implementation of Pearl's three rules. Research-grade complexity. |
| Causal discovery from data | **v2+** | PC, GES, LiNGAM. Orthogonal to computation. Requires statistical infrastructure. |
| Treatment effect estimation from data | **v2+** | IPW, AIPW, doubly robust. Requires observational datasets. |
| Sensitivity analysis | **v2+** | Rosenbaum bounds, E-values. Requires stochastic framework. |
| Time-series causal models | **v2+** | Dynamic Bayesian networks, Granger causality. Different mathematical framework. |
| Causal effect bounds (partial identification) | **v2+** | For non-identifiable effects. Requires Manski bounds or similar. |
| Cyclic SCM support | **Out of scope** | Requires fixed-point computation, equilibrium selection. Research frontier. |
| Multi-world counterfactuals | **Out of scope** | Twin network construction. Specialized research tool. |

---

## References

[1] Pearl, J. (2009). *Causality: Models, Reasoning, and Inference* (2nd ed.). Cambridge University Press.

[2] Peters, J., Janzing, D., & Scholkopf, B. (2017). *Elements of Causal Inference*. MIT Press.

[3] Sharma, A. & Kiciman, E. (2020). "DoWhy: An End-to-End Library for Causal Inference." Microsoft Research.

[4] Ankan, A. & Panda, A. (2015). "pgmpy: Probabilistic Graphical Models using Python."

[5] MASA Technical Audit Report. March 2026. Codebase analysis of causal-solver.ts, causal-blueprint.ts, and related modules.
