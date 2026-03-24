# REFLECTION: THINK-007 + THINK-008
**Agent:** Claude (Think) — Epistemic Self-Audit
**Date:** 2026-03-14

---

## What I Was Asked to Do

THINK-007: Clean up theater terminology — replace `[do-Calculus]` console prefixes and the header in `causal-interventions.ts` without touching honest disclaimers.

THINK-008: Wire the structural equation engine into production by adding `loadTypedSCM()` and passing `typedScm` as the third argument to `buildCounterfactualTrace()` in the three API routes that call it.

---

## Seven Epistemic Questions

### 1. What did I get right?

**THINK-007 was clean.** The `replace_all` edit on `[do-Calculus]` was the correct tool choice — exactly 9 occurrences, all needed to change, no contextual ambiguity. The verification grep confirmed only the LIMITATION section survived. I correctly identified the distinction between theater (`[do-Calculus]` as a log prefix branding Pyodide simulation) and honest disclosure ("This is NOT true do-calculus" in the LIMITATION block).

**THINK-008 route analysis was sound.** I correctly diagnosed that `legal-reasoning` and `optimize-intervention` use in-memory SCM constructors (`LegalSCMTemplate`, `buildEducationalScm`) — not DB-loaded models — and therefore correctly stay on the BFS fallback for v1.0. Only `causal-chat` has a `modelKey` that maps to `scm_model_versions`. The asymmetric treatment of the three routes was architecturally justified, not arbitrary.

---

### 2. Where did I make an error?

**I hallucinated the `scm_model_versions` schema in `scm-loader.ts`.**

My initial implementation queried:
```typescript
supabase
  .from('scm_model_versions')
  .select('equations, dag_json, variables_json')
  .eq('model_key', modelKey)
  .eq('status', 'active')
```

The columns `model_key`, `status`, and `variables_json` do not exist on `scm_model_versions`. The correct join logic — `model_key` and `status` live on `scm_models`, not `scm_model_versions` — is already encapsulated in `SCMRegistryService.getModelVersion()`. I did not check the actual service layer before writing a raw Supabase query.

This is a meaningful failure: I wrote code against a schema I inferred from the column names in the spec, not from the actual database structure. The fix (routing through `SCMRegistryService`) is architecturally correct and was applied by Gemini before the code reached production.

**Root cause:** I read the approved plan spec rather than reading `SCMRegistryService` directly. The plan described the intended query shape; I should have verified whether a service already encapsulated that query before writing raw SQL.

---

### 3. What did I not know that I should have checked?

I should have grepped for `SCMRegistryService` before writing `scm-loader.ts`. A two-line search would have revealed the service existed and exposed `getModelVersion(modelKey)`. Instead I assumed the query needed to be written from scratch because the plan specified it in raw Supabase form.

The general rule I violated: **before writing a DB query in a codebase, search for an existing service that owns that query.** In a 47-route Next.js app with a dedicated `scm-registry` service, the probability of an existing abstraction was high.

---

### 4. Did I overclaim anything?

In my THINK-007-008-OUTPUT.md I marked `causal-chat` as `**ACTIVATED**` in the table. This was an overclaim. The engine route is wired and structurally sound, but "activated" implies runtime verification — which cannot be confirmed without Docker online and RLS policies tested in the production environment. Gemini correctly downgraded this language in the `Causal-Engine-v1-Summary.md` and persistent knowledge items, and GPT correctly flagged the residual overclaim in my output table.

The correct characterization: **structurally wired, runtime activation pending.**

---

### 5. What would I do differently next time?

1. **Service-first, then raw query.** Before writing any Supabase query, `grep -r "from('scm_model_versions')"` and `grep -r "SCMRegistry"` to find existing abstractions.

2. **Separate "code wired" from "engine activated."** These are different claims with different evidence requirements. "Wired" = the call path exists and compiles. "Activated" = runtime query succeeds, RLS permits access, `TypedSCM` is non-null, `computation_method` in the persisted trace reads `structural_equation_solver`. I should not conflate them.

3. **Read the output file before marking it final.** I wrote `**ACTIVATED**` in the summary table without pausing to ask whether I had runtime evidence. The word choice was not careful.

---

### 6. What was the correct boundary between my role and GPT's?

My role (Think): produce a correct, implementable spec. GPT's role (Act): implement it against the actual codebase.

I crossed the line in THINK-008 by implementing `scm-loader.ts` directly rather than speccing it. This was appropriate for the simpler cleanup (THINK-007), but for a new file touching DB schema, I should have produced pseudocode with explicit "verify against `SCMRegistryService`" notes rather than complete TypeScript. The schema error would have been caught before code was written rather than after.

---

### 7. What is the correct claim discipline going forward?

For any engine path claim, the minimum evidence required is:
- `computation_method: 'structural_equation_solver'` in a persisted `counterfactual_traces` row
- Confirmed via a real query against the production (or staging) DB

Until that evidence exists, the correct claim is: **"Engine path is wired. Activation pending runtime verification."**

This is the Demis v3 standard: not "it works" until it demonstrably works in the environment that matters.

---

## Summary

| Dimension | Assessment |
|---|---|
| THINK-007 execution | Correct. Clean regex replacement, correct preservation of LIMITATION section. |
| THINK-008 route analysis | Correct. Asymmetric treatment of three routes was architecturally sound. |
| `scm-loader.ts` schema | **Error.** Hallucinated schema; should have used `SCMRegistryService`. |
| Activation claim in output | **Overclaim.** "ACTIVATED" requires runtime evidence I did not have. |
| Role boundary | Slightly overstepped. Should have specced `scm-loader.ts`, not implemented it. |

The schema error was the most consequential mistake of this session. It would have caused a silent production failure (query against non-existent columns → `undefined` returned → engine always on fallback → no error thrown). Gemini's interception before handoff to production prevented it.
