# Mission Control (Standalone) — Synthesized Spec

## Status
- **Separated from core app navigation** (no sidebar Mission button in main Chat shell).
- **Kept as standalone concept/project** to avoid coupling with core chat workflows.

## Why Standalone
From your journal thesis: Mission Control should be a **deep reflection + delegation + future-task system**, not just another page in the core product.

Keeping it separate gives:
1. Architectural freedom (independent release cycle)
2. Lower risk to core chat UX
3. Clear identity: execution cockpit + reflective intelligence

---

## Synthesized Vision (from your journal)
Mission Control is a **personal command center for agentic work** where:
- task orchestration,
- causal planning,
- memory/experience traces,
- and reflective intelligence

exist in one loop.

### Core principles
1. **Causality-first planning** (not todo-list-only)
2. **Experience-aware operations** (memory + reflection)
3. **Closed-loop audits** before major execution
4. **Human–agent co-reflection** to align direction and responsibility

---

## v1 Scope (lean, high-leverage)

### 1) Delegation Board
- Missions, sub-missions, owners (human/agent)
- State model: `planned -> active -> blocked -> validated -> archived`
- Explicit Definition of Done on every mission

### 2) Causal Plan Panel
- For each mission: cause/effect assumptions
- Intervention hypotheses (`If X, expect Y because Z`)
- Counterfactual note field (`What could falsify this?`)

### 3) Reflection Ledger
- Two streams:
  - **Operator reflection** (you)
  - **Agent reflection** (assistant)
- Daily synthesis card: what worked, drift, correction

### 4) Audit Gate (pre-ship)
- Trigger Closed-Loop Audit tool before major implementation
- Attach scorecard + revised draft to mission artifact

---

## Data Model (v1)

### Mission
- `id`, `title`, `status`, `owner_type`, `priority`, `due_at`
- `definition_of_done`, `success_metrics[]`
- `created_at`, `updated_at`

### CausalAssumption
- `id`, `mission_id`
- `cause`, `effect`, `mechanism`, `confidence`
- `falsifier`

### ReflectionEntry
- `id`, `mission_id`, `author_type` (`human|agent`)
- `content`, `mood_tag`, `energy`, `correction_note`
- `created_at`

### AuditArtifact
- `id`, `mission_id`, `run_id`
- `score_total`, `verdict`, `report_path`, `revised_path`
- `created_at`

---

## Integration Contract (decoupled)
Mission Control remains standalone, but may consume exports from your two tools:

- From `local-memory-experience`:
  - `lme export` JSON snapshots
- From `closed-loop-audit`:
  - audit report artifacts (`audit-report.json`, `revised-draft.md`)

**Rule:** file-based interop only (no tight runtime coupling).

---

## UX Direction
- Left: mission graph / queue
- Center: selected mission + DoD + causal panel
- Right: reflection + audit history
- Top command bar: `New Mission`, `Run Audit`, `Log Reflection`, `Export`

Tone: operator-grade + calm; less dashboard noise, more decision signal.

---

## v2 Ideas
- Timeline replay of mission decisions
- Drift alerts when assumptions conflict with outcomes
- Weekly psycho-cybernetic scorecard (target, drift, correction trend)

---

## Immediate Next Steps
1. Keep Mission route hidden from core sidebar (done)
2. Spin standalone repo: `mission-control-standalone`
3. Build read-only v1 with mock data + import pipeline
4. Add write-path for reflections + causal assumptions
5. Wire audit artifact ingestion

---

## Definition of Done (this separation task)
- [x] Mission button removed from core Chat sidebar nav
- [x] Mission concept captured in a standalone design/spec file
- [x] Journal ideas synthesized into actionable architecture
