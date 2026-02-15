# Demis Workflow Checklist (One-Page Runbook)

Use this for fast execution. If any required box is unchecked, task is **not done**.

---

## 0) Bootstrap (Every fresh session)

- [ ] `npm run agent:bootstrap`
- [ ] Read `/.agent/state/session-handoff.json`
- [ ] Read `/.agent/state/session-handoff.md`
- [ ] Surface `critical_gaps.user_action_required` immediately (if any)

---

## 1) L1–L4 Reasoning Pass

- [ ] **L1 Impact** documented (UI/API/dataflow)
- [ ] **L2 Risk** documented (breaking/regression surfaces)
- [ ] **L3 Calibration** documented (latency/cost/cpu/memory)
- [ ] **L4 Critical Gaps** documented (migrations/env/manual steps)
- [ ] Mode selected correctly (`full` / `lite` / `skip`)
- [ ] If migration/env/dependency exists, L4 was **not skipped**

---

## 2) Architecture Contract Checks

- [ ] Route is orchestration-only (logic in shared service)
- [ ] No duplicated persistence/business logic across routes
- [ ] Deterministic compute path/versioning defined (`method`, `methodVersion`)
- [ ] Provenance fields enforced:
  - [ ] `ingestionId`
  - [ ] `sourceTableIds[]`
  - [ ] `dataPointIds[]`
  - [ ] `computeRunId?`
  - [ ] `methodVersion`
- [ ] Graceful degradation defined (enrichment failure ≠ route failure)
- [ ] SSE/event payload is additive + schema-stable

---

## 3) Security + Access

- [ ] RLS strategy explicit (user-scoped read/write OR server-admin write)
- [ ] Server-admin client is server-only (never client bundle)
- [ ] No secrets leaked in code/logs
- [ ] Logs avoid raw sensitive payloads (attachments/table dumps)

---

## 4) Input Safety (if attachments/files involved)

- [ ] Max files/request enforced
- [ ] Max size/file enforced
- [ ] Max total payload enforced
- [ ] MIME allowlist enforced
- [ ] Timeout per file enforced
- [ ] Concurrency cap enforced
- [ ] Validation failures return actionable warnings

---

## 5) Implementation Hygiene

- [ ] Changes are scoped and minimal
- [ ] New files tracked (`git status --short`)
- [ ] Commit messages are scoped and meaningful
- [ ] No unrelated files staged

---

## 6) Hard Gates (Required)

- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` passes
- [ ] Contract/unit/integration tests for new behavior pass
- [ ] Migration status verified (if schema changed)
- [ ] Forced failure test proves graceful degradation
- [ ] Runtime readback verifies persistence in target env
- [ ] Env parity confirmed (app and queried DB are same project)

---

## 7) Human Follow-Up Block

If any applies, mark **HUMAN FOLLOW-UP REQUIRED** and provide exact steps:

- [ ] SQL migration needs manual apply
- [ ] New env vars/API keys required
- [ ] Deployment/platform manual change needed
- [ ] Breaking contract migration required

---

## 8) Deployment Gate

- [ ] `npm run build` passes locally (or approved env-blank simulation)
- [ ] Security advisories reviewed (Next/Vercel)
- [ ] No eager env-dependent init in prerender import paths
- [ ] Push + deploy target confirmed

---

## 9) Required Artifacts

- [ ] `implementation_plan.md`
- [ ] `walkthrough.md`
- [ ] `docs/audits/PHASE_*_SIGNOFF.md`
- [ ] Evidence included (tests, compile, runtime checks, remaining gaps)

---

## 10) Final Done Criteria

- [ ] Architecture contracts respected
- [ ] All hard gates green
- [ ] Runtime behavior verified in intended environment
- [ ] Human follow-ups complete or explicitly handed off

**If any box above is unchecked → status = IN PROGRESS.**
