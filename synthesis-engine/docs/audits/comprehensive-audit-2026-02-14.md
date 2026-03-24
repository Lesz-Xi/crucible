# Comprehensive Architecture & Code Audit — 2026-02-14

**Project:** `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`  
**Reference baselines:**
1. `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/MASA_ARCHITECTURE_CURRENT_STATE_SUMMARY_2026-02-12.md`
2. `/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html`

---

## (a) Executive Summary

The codebase shows strong MASA-aligned architecture momentum (chat/hybrid/legal workbenches, SCM retrieval, novelty gate/recovery, governance workflows, and persistent-memory scaffolding). Most major components named in the architecture summary are present and wired.

However, there are **critical production-readiness gaps**:

- **Build is currently broken** (`next build` fails due to missing `styled-jsx` module).
- **Test system is partially broken** (path-alias resolution failures in Vitest, mixed Jest/Vitest usage, and at least one failing assertion).
- **Security/privacy exposure risks exist** (sensitive `.env.local` contains live-looking keys; some APIs are unauthenticated while using service-role access; optional auth for core chat path).
- **Architecture-vs-vision gap remains**: closed-loop causal scaffolding exists, but several paths are still simulated/mock-driven and not full deterministic scientific execution.

**Overall assessment:**  
- **Architecture conformance:** Moderate-to-Strong (implemented scaffolding)  
- **Operational maturity:** Moderate-to-Weak (build/test/security hygiene gaps)

---

## (b) Architecture Conformance Gaps vs Reference Docs

### What aligns well

1. **Three-surface product shape (Chat/Hybrid/Legal)** is implemented.
   - Evidence: `src/app/api/causal-chat/route.ts`, `src/app/api/hybrid-synthesize/route.ts`, `src/app/api/legal-reasoning/route.ts`

2. **Governance and sentinel posture** exists in workflows.
   - Evidence: `.github/workflows/claim-drift-sentinel.yml`, `.github/workflows/hybrid-novelty-proof-sentinel.yml`, `.github/workflows/persistent-memory-sentinel.yml`

3. **Persistent-memory v1.1 ingredients** exist and are feature-flagged.
   - Evidence: `src/types/persistent-memory.ts`, `src/lib/services/causal-pruning-policy.ts`, `src/lib/services/compaction-orchestrator.ts`, `src/lib/services/memory-retrieval-fusion.ts`, `src/lib/services/causal-lattice.ts`, `supabase/migrations/20260213_persistent_memory_v1.sql`

4. **Pearl-style intervention/counterfactual gating appears in runtime paths.**
   - Evidence: `evaluateInterventionGate(...)` usage in chat and legal routes.

### Conformance gaps (document intent vs code reality)

1. **Closed-loop “robot scientist” remains partly simulated** (not full empirical loop).
   - White paper frames in-silico/in-vivo continuum.
   - Code uses explicit mock lab stochastic simulator:
     - `src/lib/services/mock-cloud-lab.ts` comment: “stochastic simulator for ‘In Silico’ verification of the ‘In Vivo’ protocol.”

2. **True streaming is not yet true token streaming in causal chat.**
   - `src/app/api/causal-chat/route.ts`: `// TODO: Implement true streaming when Claude SDK supports it` and current single-chunk send.

3. **Governance integrity features partially staged, not fully enforced.**
   - Multiple feature flags default-off in `src/lib/config/feature-flags.ts` (`MASA_CAUSAL_PRUNING_V1`, `MASA_COMPACTION_AXIOM_V1`, etc.)

4. **Self-improvement still mostly rejection filtering rather than model improvement.**
   - Conforms with white paper caveat; still a gap versus long-term autonomous-scientist north star.

---

## (c) Code Quality Findings by Severity (with paths)

### Critical

1. **Build failure blocks deployability**
   - Command evidence: `npm run build` fails
   - Error: `Cannot find module 'styled-jsx/package.json'`
   - Impact: cannot reliably ship production artifacts.

2. **Test harness instability prevents trustworthy CI signal**
   - Command evidence: `npx vitest run` → 8 failed suites, 1 failed test.
   - Key causes:
     - TS path alias import failures: `Cannot find package '@/lib/...` across multiple suites.
     - Jest globals imported under Vitest (`Do not import @jest/globals outside of the Jest test environment`).
     - Functional assertion failure in `src/lib/services/__tests__/markdown-export-service.test.ts`.

### High

3. **High warning debt in lint (274 warnings)**
   - Command evidence: `npm run lint` → 274 warnings.
   - Dominant issues: `no-explicit-any`, unused vars, unsafe patterns.
   - Hotspot files include:
     - `src/lib/services/benchmark-service.ts` (very large + many warnings)
     - `src/app/api/causal-chat/route.ts`
     - `src/app/api/legal-reasoning/route.ts`
     - multiple UI legacy pages.

4. **Oversized files indicate maintainability risk**
   - Evidence (`wc -l`):
     - `src/lib/services/benchmark-service.ts` — 2094 LOC
     - `src/app/api/causal-chat/route.ts` — 976 LOC
     - `src/app/api/legal-reasoning/route.ts` — 935 LOC
     - `src/lib/ai/synthesis-engine.ts` — 917 LOC

### Medium

5. **Accidental duplicate artifact indicates repo hygiene drift**
   - Evidence: `src/verify-static 2.ts` exists alongside `src/verify-static.ts`.

6. **Mixed production vs legacy components increase cognitive load**
   - Example: `HybridWorkbenchV2.tsx` + `HybridLegacyPage.tsx`; similar pattern in legal/chat paths.

---

## (d) Security & Privacy Risks

### Critical

1. **Sensitive secrets present in `.env.local` in working tree**
   - Evidence from grep shows populated values for:
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ANTHROPIC_API_KEY`
     - `GOOGLE_API_KEY`
     - `SERPER_API_KEY`
   - Risk: accidental commit, local leakage, logs/exfiltration blast radius.

### High

2. **Unauthenticated route with privileged DB key fallback**
   - `src/app/api/benchmark-runs/route.ts`:
     - no auth checks
     - uses `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Risk: data exposure/abuse if route is publicly reachable.

3. **Core chat route explicitly allows unauthenticated usage**
   - `src/app/api/causal-chat/route.ts`: comment `Authentication is optional for MVP`.
   - Risk: cost abuse, prompt abuse, weak tenant boundaries unless externally mitigated.

4. **Header-based user attribution fallback**
   - `src/app/api/hybrid-synthesize/route.ts`: `let userId = request.headers.get("x-user-id") || undefined;`
   - Risk: spoofing if not protected by trusted edge/auth layer.

### Medium

5. **Debug endpoint may overexpose internals**
   - `src/app/api/verify-db/route.ts` returns `raw_debug`, and on error can return stack trace.
   - Risk: information disclosure.

6. **Trace-integrity signing marked TODO**
   - `src/lib/governance/trace-integrity.ts`: `TODO: Implement HMAC-SHA256 signing`
   - Risk: weaker tamper-evidence posture.

---

## (e) Performance & Scalability Concerns

1. **Sequential PDF processing in hybrid route**
   - `src/app/api/hybrid-synthesize/route.ts` loops file-by-file; no bounded worker pool for extraction stage.
   - Impact: latency growth with source count.

2. **Large monolithic route handlers**
   - Very large single-file APIs likely causing cold-start and maintainability penalties.

3. **Simulated streaming in chat**
   - Single-chunk response reduces incremental UX and may increase perceived latency.

4. **Potential expensive operations per request**
   - Deep orchestration (classification + SCM retrieval + grounding + persistence + claim ledger) in single request path without clear per-stage budget enforcement.

---

## (f) Reliability / Testing / Deploy Risks

1. **Build pipeline currently non-green** (`next build` failure).
2. **Test suite not CI-trustworthy** (alias config, framework mismatch, failing tests).
3. **Feature-flagged paths can diverge from production reality** without enforce-mode gating and observability SLOs.
4. **Dependency/runtime mismatch risk** (Node v24 used locally; not guaranteed aligned with Next/tooling expectations in all environments).

---

## (g) Prioritized 30/60/90 Day Remediation Roadmap

### Day 0–30 (stabilize production baseline)

1. **Fix build deterministically**
   - Reinstall lockfile cleanly; ensure `styled-jsx` dependency integrity; enforce reproducible install in CI.
2. **Repair test infrastructure**
   - Configure Vitest path aliases (`@/`), remove Jest globals from Vitest suites, make `npx vitest run` green.
3. **Immediate secrets hygiene**
   - Rotate exposed keys; enforce `.env.local` non-commit; add secret scanning pre-commit/CI.
4. **Lock down risky APIs**
   - Require auth on `benchmark-runs` and `verify-db`; remove stack/raw debug in prod.
5. **Add rate limiting for chat/hybrid/legal APIs**
   - Prevent abuse and runaway cost.

### Day 31–60 (security + quality hardening)

1. **Refactor monolith files into service modules** (chat/hybrid/legal routes).
2. **Reduce lint debt by policy**
   - Start with `no-explicit-any` in API/service boundary files.
3. **Implement trace signing** in governance integrity path.
4. **Replace header-based user identity fallback** with verified auth claims only.

### Day 61–90 (scientific integrity maturity)

1. **Promote governance from report-first to enforce-mode** for selected gates.
2. **Implement true token streaming and stage-level timeout budgets**.
3. **Advance from mock to stronger empirical validation tiers** where feasible.
4. **Define and track MASA architecture conformance KPIs** (causal determinism %, trace completeness %, gate coverage %, reproducibility pass rate).

---

## (h) Ready-to-Run Checklist of Fixes

> Run from: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`

### 1) Build/test baseline

- [ ] Clean install and dependency integrity:
```bash
rm -rf node_modules .next
npm ci
npm run build
```

- [ ] Make Vitest environment deterministic:
```bash
npx vitest run
```

- [ ] Ensure alias support in Vitest config (add/verify `resolve.alias` for `@/`), then rerun.

### 2) Security hardening

- [ ] Rotate all secrets currently present in `.env.local`.
- [ ] Confirm `.env.local` ignored and never committed:
```bash
git check-ignore -v .env.local
```
- [ ] Add secret scanning (e.g., gitleaks/trufflehog) to CI.
- [ ] Add auth guards to:
  - `src/app/api/benchmark-runs/route.ts`
  - `src/app/api/verify-db/route.ts`
- [ ] Remove stack traces/raw debug payloads from production responses.

### 3) Reliability and quality

- [ ] Split oversized API files into stage services + shared validators.
- [ ] Fix failing markdown export test and prevent regressions.
- [ ] Resolve Jest/Vitest mixed imports.
- [ ] Introduce per-route rate limiting and request budget guards.

### 4) MASA conformance enforcement

- [ ] Add conformance test suite (architecture checklist assertions).
- [ ] Gradually enable persistent-memory feature flags in controlled rollout.
- [ ] Enable signed trace receipts and verify in governance workflows.

---

## Exact Commands Run (audit trail)

```bash
pwd && ls -la /Users/lesz/Documents/Synthetic-Mind && ls -la /Users/lesz/Documents/Synthetic-Mind/synthesis-engine

# Read baseline references + package scripts
cat /Users/lesz/Documents/Synthetic-Mind/synthesis-engine/package.json
cat /Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/MASA_ARCHITECTURE_CURRENT_STATE_SUMMARY_2026-02-12.md
cat /Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html

# Repository inventory
find src -maxdepth 4 -type f
find src/app/api -type f

# Quality and build signals
npm run lint
npm run build
npm run test:scientific-integrity
npm run test:benchmark-governance
npm run test:scm-promotion-governance
npx vitest run

# Risk scans / code evidence
grep -RIn "process\.env\|NEXT_PUBLIC\|SUPABASE_SERVICE_ROLE\|SERPER\|ANTHROPIC\|GOOGLE" src .env.example .env.local
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -nr | head -n 20
find src -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -path '*/__tests__/*' \)
grep -RIn "TODO\|FIXME\|HACK\|mock\|simulat" src | head -n 120

# Conformance existence checks
# (verified key files from architecture summary exist)
```

---

## Evidence Snippets (selected)

1. **Auth optional in chat route**
```ts
// src/app/api/causal-chat/route.ts
// Authentication is optional for MVP
```

2. **Simulated streaming in chat**
```ts
// src/app/api/causal-chat/route.ts
console.log("[Streaming] Starting LLM generation (simulated streaming)...");
// TODO: Implement true streaming when Claude SDK supports it
```

3. **Header user-id fallback**
```ts
// src/app/api/hybrid-synthesize/route.ts
let userId = request.headers.get("x-user-id") || undefined;
```

4. **Unauthenticated benchmark route using privileged key fallback**
```ts
// src/app/api/benchmark-runs/route.ts
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export async function GET() { ... } // no auth check
```

5. **Mock in-vivo lab simulation**
```ts
// src/lib/services/mock-cloud-lab.ts
"...stochastic simulator for 'In Silico' verification of the 'In Vivo' protocol."
```

6. **Build failure proof**
```text
Error: Cannot find module 'styled-jsx/package.json'
```

7. **Test suite instability proof**
```text
npx vitest run -> Failed Suites: 7, Failed Tests: 1
Cannot find package '@/lib/...'
Do not import `@jest/globals` outside of the Jest test environment
```

8. **Lint debt proof**
```text
npm run lint -> ✖ 274 problems (0 errors, 274 warnings)
```

---

## Final Assessment

This codebase is **architecturally ambitious and directionally aligned with MASA**, but **not yet operationally hardened** to match the scientific-integrity bar claimed in docs. The next most valuable step is **stabilization (build/test/security)**, followed by **enforcement-mode governance and deterministic conformance instrumentation**.
