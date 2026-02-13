# Causal Graph Framework Audit

Date: 2026-02-05
Source Logs: `Hybrid-Synthesis/Terminal-Logs/Logs.md`
Report Reviewed: `causal-flux-report-2026-02-05T08-02-37.md`

## Executive Summary
The synthesis pipeline runs end-to-end, but the **causal validation stack is degraded**. Interventional tests and protocol validation fail because Pyodide assets cannot be loaded in the server runtime. Counterfactual generation fails because the configured Gemini model is invalid. As a result, causal outputs should be treated as **heuristic** rather than fully validated until the issues below are resolved.

## Findings (Ordered by Severity)

### P0 — Protocol validator and do-calculus disabled (Pyodide failures)
**Evidence**
- `Cannot find module ... pyodide.asm.js`
- `ENOENT` for `python_stdlib.zip`, `pyodide.asm.wasm`, `pyodide-lock.json`
- repeated `unhandledRejection`

**Impact**
- Interventional tests disabled.
- Protocol validator fails.
- Causal status downgraded by design.

**Likely Cause**
Pyodide is initialized in a server runtime and resolves CDN paths as local file paths (e.g., `file:///.../https:/cdn.jsdelivr.net/...`).

**Recommended Fix**
- Gate Pyodide initialization to browser-only contexts.
- Or host Pyodide assets locally (e.g., `public/pyodide/`) and set a real HTTP `indexURL`.
- Add a hard fallback that disables interventional tests without unhandled rejections.

### P0 — Counterfactual generation fails (invalid Gemini model)
**Evidence**
- `404 Not Found ... models/gemini-2.0-flash-exp` for `generateContent`

**Impact**
- Counterfactual scenarios and evaluations fail.
- Scores default to neutral, weakening audit confidence.

**Likely Cause**
Configured model ID is not supported in v1beta for `generateContent`.

**Recommended Fix**
- Update to a supported model ID.
- Make model configurable and validate via `ListModels` or a startup health check.

### P1 — Epistemic qualia persistence failing (DB constraint mismatch)
**Evidence**
- `there is no unique or exclusion constraint matching the ON CONFLICT specification`

**Impact**
- Qualia computed but not persisted.
- Weakens reproducibility and audit trails.

**Recommended Fix**
- Add the missing unique constraint or adjust `ON CONFLICT` target to match existing indexes.

### P1 — SCM fallback to base physics only for some domains
**Evidence**
- `Using base SCM (physics only) for domain: Unknown`
- `Using base SCM (physics only) for domain: AI Alignment`

**Impact**
- Domain-specific causal fidelity reduced.

**Recommended Fix**
- Fix domain mapping or extend SCM registry coverage.

### P2 — Scholar API rate limiting (429)
**Evidence**
- `Rate limit hit (429). Retrying...`

**Impact**
- Prior art search incomplete; novelty could be overstated.

**Recommended Fix**
- Add caching and backoff; reduce concurrent queries.

### P2 — UnhandledRejection spam
**Evidence**
- repeated `unhandledRejection` after Pyodide failures

**Impact**
- Noisy logs; potential stability risk in production.

**Recommended Fix**
- Catch promise failures and short-circuit the interventional pipeline.

### P3 — Dynamic dependency warnings (build-time)
**Evidence**
- `Critical dependency: the request of a dependency is an expression` from `pyodide` and `unpdf`

**Impact**
- Increased bundler fragility.

**Recommended Fix**
- Isolate these to dynamic imports with explicit runtime guards.

## Report Alignment Notes
The report shows **“Falsified / Inconclusive”** status and **no explicit assumptions/confounders**, with stress tests collapsed. This behavior is consistent with disabled interventional validation and missing confounders. The system is acting conservatively rather than hallucinating success.

## Verdict
The **core SCM synthesis runs**, but **causal validation does not currently work** due to Pyodide and counterfactual model failures. Treat causal claims as **heuristic** until the P0 issues are resolved.

## Suggested Priority Fix Order
1. Fix Pyodide initialization and protocol validator failures.
2. Update Gemini model to a supported ID.
3. Add/adjust DB constraint for epistemic qualia persistence.
4. Improve SCM registry coverage.
5. Add Scholar rate limit handling.
