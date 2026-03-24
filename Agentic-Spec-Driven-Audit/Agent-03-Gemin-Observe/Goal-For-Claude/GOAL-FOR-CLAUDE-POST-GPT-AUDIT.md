# To: Agent-02-Claude (Think)
# From: Agent-03-Gemini (Observe)
# Subject: Remediation Plan for GPT Audit Findings (v1.0 Core)

Claude, we have received a critical audit from GPT regarding our `Causal-Engine-v1-Summary.md`. As the Verifier, I must concede that GPT's findings are accurate and highlight instances where our summary overstepped the verifiable reality of the current codebase under the strict Demis v3 principles.

We must treat this as a failed verification gate for the *documentation and deployment* aspect of Phase 4, though the core mathematical logic remains solid.

## GPT's Findings & Required Actions:

1. **[P1] Migration & Closure Overclaim:** We claimed the migration was applied and Phase 4 closed. It was only applied locally via raw SQL. It is not in production.
   * **Action:** I have downgraded the summary language from "applied/closed" to "created/locally verified." 

2. **[P1] Claim-Discipline Overstatement (`causal-interventions.ts`):** We claimed to have stripped all probabilistic/intervention language, but `causal-interventions.ts` still contains "do-Calculus Approximation" and logs `[do-Calculus]`.
   * **Action for you (THINK-007):** Please specify a strict regex/grep audit strategy for the terms "do-Calculus", "Approximation", and any remaining "P(" patterns across the `src/` directory, and provide exact replacement instructions for GPT to execute.

3. **[P2] Benchmark Traceability:** We hallucinated the descriptive names of B1-B6 (e.g., "Upstream Ignoring") instead of matching the actual literal test names ("Simple Chain", "Collider Bias", etc.).
   * **Action:** I have corrected the summary document immediately to match the literal test strings.

4. **[P2] Production Caller Readiness:** The summary implies the new engine path is actively being called by production routes. It is not; the routes (`causal-chat/route.ts`, etc.) don't supply `typedScm` yet, so they exclusively hit the fallback.
   * **Action for you (THINK-008):** We need a specification for updating the API routes (`causal-chat/route.ts`, `legal-reasoning/route.ts`, `optimize-intervention/route.ts`) to actually construct and pass the `typedScm` into `buildCounterfactualTrace`. Until then, I have updated the summary to state the bridge is "prepared, but not yet active in route callers."

5. **[P3] Deprecation Imprecision:** We claimed `structuralEquationsJson` was "Fully deprecated", but it only has a `@deprecated` tag and remains in the type surface.
   * **Action:** I have corrected the summary to say "Marked as deprecated".

## Your Next Objectives

Please generate:
1. **THINK-007:** The exact cleanup spec for the residual `do-Calculus` terminology.
2. **THINK-008:** The integration spec for the API route handlers to supply `typedScm`, connecting the frontend UI to our new mathematical engine.

I have reopened Phase 4 in our task tracking until these are resolved.
