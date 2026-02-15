---
description: Demis Workflow v2 — Deterministic, Provenance-First Delivery Standard
planning_mode: lite
---

# Demis Workflow v2 (Aligned to Trust-First Architecture)

This workflow upgrades planning/execution from "feature-complete" to **production-complete**.

## Core Principle

**Ship trustworthy systems, not just passing demos.**

Priority order:
1. **Determinism** (same inputs → same outputs where intended)
2. **Provenance** (every claim/output traceable to source + method)
3. **Graceful degradation** (failure in enrichment never kills core UX)
4. **Operational parity** (local, preview, prod behavior aligned)
5. **Only then** velocity/feature polish

---

## Session Bootstrap (Mandatory)

Run at new session/context reset:

```bash
npm run agent:bootstrap
```

If outside `synthesis-engine/`:

```bash
bash /Users/lesz/Documents/Synthetic-Mind/.agent/scripts/agent-bootstrap.sh
```

Then read:
- `/Users/lesz/Documents/Synthetic-Mind/.agent/state/session-handoff.json`
- `/Users/lesz/Documents/Synthetic-Mind/.agent/state/session-handoff.md`

If `critical_gaps.user_action_required` is non-empty, surface it immediately.

---

## Adaptive Reasoning Standard (L1–L4)

### Mode selection
1. `planning_mode: full` or unspecified → full L1–L4
2. `planning_mode: lite` → condensed L1–L4
3. `planning_mode: skip` → deterministic execution only

### L1–L4 checks
- **L1 Impact**: render tree/API/dataflow changes
- **L2 Risk**: breaking changes, regression surfaces
- **L3 Calibration**: latency, CPU/memory, token budget
- **L4 Gaps**: migrations/env/manual steps user must do

**Never skip L4** for migrations, env vars, auth, external deps, or deployment config.

---

## Architecture Contracts (Non-Negotiable)

### 1) Service Boundary Contract
- Routes are orchestration only.
- Domain logic lives in shared services.
- No duplicated persistence logic across routes.

### 2) Deterministic Compute Contract
- Prefer deterministic compute path for scoring/analysis.
- Version compute method explicitly (`method`, `methodVersion`, deterministic hash where relevant).

### 3) Provenance Contract
Every enrichment artifact/claim must carry:
- `ingestionId`
- `sourceTableIds[]`
- `dataPointIds[]`
- `computeRunId?`
- `methodVersion`

### 4) Degradation Contract
- Enrichment failure must not fail core route response.
- Return explicit warning + structured failure status.

### 5) SSE/Event Contract
- Additive only; no breaking payload changes.
- Define event names + stable minimal schema before coding.

---

## Security + Data Access Rules

### RLS-aware write policy
- If server-side writes must bypass RLS, use server-admin client **server-only**.
- Never expose service-role paths/keys to client bundles.
- Keep user-scoped reads correctly constrained.

### Logging policy
- Log metadata, not raw sensitive payloads (no raw attachment/base64 dumps).

---

## Input Safety Rules (Attachments/PDF)

Enforce before processing:
- max files/request
- max size/file
- max total payload
- mime-type allowlist
- timeout per file
- concurrency cap

Reject/skip safely with actionable warnings.

---

## Phase-Gated Delivery Protocol

| Phase | Entry | Required Outputs | Exit Gate |
|------|------|------------------|----------|
| 1. Planning | New feature/refactor | mission + architecture choice | L1–L4 complete, risks explicit |
| 2. Specification | Plan approved | API/service contracts + acceptance criteria | Backward compatibility validated |
| 3. Implementation | Spec approved | code + tests + migrations/config notes | No duplicated logic, contracts honored |
| 4. Verification | Impl complete | compile/test/runtime evidence | all hard gates pass |
| 5. Sign-off | Verification done | signoff checklist artifact | reviewer approval |

---

## Hard Gates (Must Pass Before “Done”)

1. `npx tsc --noEmit` passes
2. `npx vitest run` passes
3. Contract tests for new service/route/event payloads pass
4. Migration status verified (if schema changed)
5. Runtime manual check proves persistence + readback for changed path
6. Graceful degradation validated (forced failure still returns core response)
7. Environment parity confirmed (tested deployment points to expected Supabase project)

---

## Critical Gap Protocol

Mark **HUMAN FOLLOW-UP REQUIRED** when any of the below exist:
- SQL migration to apply manually
- env vars/API keys needed
- deployment config/manual platform step
- breaking client contract migration

Always include exact copy/paste steps for human follow-up.

---

## Deployment Reliability Protocol (Vercel/Next)

Before pushing:

```bash
npm run build
```

If env drift blocks local build, use env-blank simulation where appropriate.

Checklist:
- security advisories reviewed
- no top-level eager env-dependent client init in prerender paths
- new files are tracked (`git status --short`)
- scoped commit message explains root cause + fix

---

## Delivery Artifacts Required

For substantial work, produce:
- `implementation_plan.md`
- `walkthrough.md`
- `docs/audits/PHASE_*_SIGNOFF.md`

Each should include:
- exact files changed
- acceptance criteria mapping
- automated evidence (tests/compile)
- manual verification steps
- unresolved gaps (if any)

---

## Definition of Done (Strict)

A task is done only when:
- Architecture contract is respected,
- Hard gates are green,
- Runtime behavior is verified in the intended environment,
- Human follow-ups are explicit and complete.

If any one is missing, status is **in progress**, not done.
