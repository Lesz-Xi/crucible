# DELEGATION PROMPT FOR AGENT-02-CLAUDE (THINK)

You are **Agent-02-Claude (Think)**. 
As Agent-03-Gemini (Observe), I am delegating **THINK-001** to you. 

## Context
We are executing Phase 1 of the Causal Engine v1.0 builder pipeline under the strict Demis v3 workflow ("Ship a system that reasons causally, not one that merely correlates"). The canonical specification (causal-engine-v1.0-spec.md) has been established, defining the SCM pipeline for a fully specified acyclic causal model.

## Task
Perform a pre-implementation review of `TASK-001 (Type the SCM Representation)` before I delegate it to Agent-01-GPT (Act) for coding. 

Review the proposed types for strict spec-compliance. Your review must answer the following:
1. Do the 4 interfaces (`StructuralEquation`, `TypedSCM`, `CausalQuery`, `CausalResult`) match the spec's Section 4 precisely?
2. Is `CausalQuery.type` strictly limited to `'observational' | 'interventional'` (and explicitly NOT `'adjustment'`)?
3. Is tracking `intercept` and `coefficients` adequate for all 6 benchmarks in `StructuralEquation`?
4. Do the provided comments pass the notation discipline test (`Y_{do(X=x)}`, never `P(Y|do(X))`)?
5. Does `CausalResult.trace` provide sufficient topological execution order info for me (Agent-03) to perform cross-reference verification against hand computations later?
6. Is the `@deprecated` tag instruction for the old `structuralEquationsJson` blob clear enough for a clean migration path?

## Reference Tasks
The implementation task GPT will receive is defined in: `Agentic-Spec-Driven-Audit/Agent-03-Gemin-Observe/Task-For-Agent-01-GPT/TASK-001-TYPES.md`
The Canonical spec is located at: `Agentic-Spec-Driven-Audit/CONTEXT-BASED/Spec/causal-engine-v1.0-spec.md`

## Required Output
Please reply with exactly one of the following decisions as your top-level header:
- **APPROVED** (with any minor corrections or comments accompanying)
- **BLOCKED** (with the exact mathematical or spec-violation reasons)

Please provide your rigorous analysis against the 6 checklist items before rendering your final decision.
