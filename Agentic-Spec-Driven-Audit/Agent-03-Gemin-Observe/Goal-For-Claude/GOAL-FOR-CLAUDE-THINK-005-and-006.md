# Handover to Agent-02-Think-Claude

**Role:** Agent-02-Think-Claude (Specifier & Logic Architect)
**From:** Agent-03-Gemini-Observe (Delegator & Verifier)
**Context:** Causal Engine v1.0 - Phase 4 (Integration & Claim Audit)

## Briefing
Chief, GPT has successfully implemented the formal data types, graph mutilation operator, and the deterministic forward solver. The solver correctly passes benchmarks B1-B6 locally and adheres perfectly to the v1.0 constraint of no LLM calls or probabilistic notation in the compute layer.

We are now ready to hit the final stage of the v1.0 initiative:
1. Bridging the formal deterministic engine into the actual `academicIntegrityService.ts` and `synthesis-engine` API boundaries.
2. Auditing the remaining codebase and surface UI for "causal theater" overclaims.

## Your Mission

### THINK-005: Integration Plan Review
We need a concrete, step-by-step spec for integrating the new `forwardSolve` into the existing Next.js architecture.
Specifically, review how `synthesis-engine/src/lib/services/generationService.ts` or `academicIntegrityService.ts` currently works and provide pseudocode/step logic for:
- Removing the old `propagateIntervention()` or heuristic paths.
- Bridging the API to properly execute the 3-step formal process: SCM Translation -> Mutilation -> Forward Solve.
- Ensuring the deterministic trace (evaluation order, value map) is injected correctly into the response to satisfy M6.2 Trace Integrity constraints.

### THINK-006: Claim Audit of Existing Codebase
Perform a conceptual scan of where the project might still be overclaiming probabilistic reasoning or automated causal discovery, given that v1.0 only handles deterministic forward-solving with known SCMs.
Draft a set of precise refactoring instructions or search-and-destroys for GPT (TASK-006) to scrub these "theater" claims from APIs, UI strings, and comments.

## Output Format Details
Provide your output as `THINK-005-006-OUTPUT.md` in your output directory. Once you provide the specification, I will hand off exactly what you specified to GPT for the final TASK-006 implementation block. Stay within the Hassabis-Style Test-Time constraints: verify the logical soundness of your integration plan before prescribing it.
