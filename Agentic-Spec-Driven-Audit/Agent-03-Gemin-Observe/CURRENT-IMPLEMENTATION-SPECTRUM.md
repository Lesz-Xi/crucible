# CURRENT IMPLEMENTATION SPECTRUM

**Project:** Causal Engine v1.0
**Date:** 2026-03-13
**Document Purpose:** Knowledge persistence of the system's present capability spectrum.

## System Capability Spectrum

This document maps the implementation state of the causal engine, strictly differentiating between formal components that have been fully validated, and boundary layers that are pending or deferred.

### 1. Solidified Core (Fully Implemented & Verified)
These components form the bedrock of the v1.0 engine. They pass the Demis v3 deterministic mandate and execute free of any stochastic LLM logic.
- **Formal Data Structures:** `TypedSCM`, `StructuralEquation`, `CausalQuery`, `CausalResult`. (Defined in `src/types/scm.ts`).
- **Graph Mutilation Operator:** A precise, acyclic implementation handling formal `do()` applications via targeted parent edge severance and intercept override. No in-place mutations.
- **Topological Forward Solver:** Deterministic (alphabetically tie-broken) forward substitution solver. Computes strictly linear structural equations.
- **Benchmark B1-B6 Compliance:** The solver passes the 6 canonical benchmark suites (Confounded Fork, Collider Bias, Simple Chain, Common Cause, Multi-Intervention, Diamond Graph).

### 2. Under Construction (Integration Layer)
These components connect the mathematical engine to the end-user API boundary.
- **CausalSolver Integration:** Re-wiring the old, legacy `propagateIntervention()` to bridge directly to the new `forwardSolve` engine.
- **Trace Persistence:** Logging the `CausalResult.evaluationOrder` and `valueMap` trace into existing API payload systems to satisfy M6.2 Trace Integrity governance.

### 3. Pending Deprecation / Overclaim Audits
These components exist in the repository but represent technical debt or "causal theater" that the v1.0 engine is phasing out.
- **`structuralEquationsJson` Blob:** The untyped structural object, preserved safely via `@deprecated` tags to guide future refactoring migrations.
- **Heuristic Propagation:** Any residual `heuristic_graph_propagation` claims within the UI or API descriptions.

### 4. Deferred to Future Specifications (v1.1 / v2.0)
These components intentionally fall outside the v1.0 capability envelope and must not be engaged.
- Non-linear structural equations
- Cyclical DAG support
- Handling unmeasured confounders (Probabilistic `P(Y | do(X))` queries)
- Adjustment Formulas and Backdoor/Frontdoor criterion algorithms

---
*Note to KNOWLEDGE SUBAGENT: Store this spectrum under Causal Engine Phase 3 Implementation status.*
