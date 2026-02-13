---
name: "masa-session-bootstrap"
description: "Internal agent-only skill to generate deterministic MASA session handoff context (json+md+summary) before planning/execution."
planning_mode: lite
---

# MASA Session Bootstrap Skill

## When to use
Use this skill at the start of:
- a new session
- a context-reset conversation
- any large planning or implementation cycle

This skill is internal and agent-only. It is designed to reduce cold-start time by generating deterministic session state artifacts.

## Canonical command
Universal (works from anywhere):

```bash
bash /Users/lesz/Documents/Synthetic-Mind/scripts/agent-bootstrap.sh
```

Local shortcut (from `synthesis-engine/`):

```bash
npm run agent:bootstrap
```

## Required outputs
The command must produce or refresh:
- `/Users/lesz/Documents/Synthetic-Mind/.agent/state/session-handoff.json`
- `/Users/lesz/Documents/Synthetic-Mind/.agent/state/session-handoff.md`
- `/Users/lesz/Documents/Synthetic-Mind/.agent/state/session-handoff.summary.md`

Interpretation:
- `session-handoff.json` is machine-authoritative (schema `1.1.0`).
- `session-handoff.md` is compatibility human digest.
- `session-handoff.summary.md` is precision-focused operator summary.

## Redaction and safety policy
Hard rules:
1. Never write any secret values.
2. Persist env key names only.
3. Ignore `.env*` file contents entirely.
4. Truncate long outputs to bounded sizes.
5. If a scan fails, keep generating outputs and include failure notes.

## Operating checklist
1. Run bootstrap command.
2. Read `critical_gaps.user_action_required` first.
3. If non-empty, surface blocking markers before continuing.
4. Use `next_tasks` as default execution queue unless the user overrides.
5. Run validator:

```bash
bash /Users/lesz/Documents/Synthetic-Mind/.agent/scripts/validate-session-handoff.sh
```
