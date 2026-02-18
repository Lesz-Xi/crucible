# Migration 001 — Lab Experiments Table

**Date:** 2026-02-19 | **Status:** Applied

---

## Purpose

Creates the `lab_experiments` table to persist Bio-Computation Lab tool executions with causal role tracking and RLS enforcement.

## Schema

```sql
CREATE TYPE causal_role AS ENUM ('observation', 'intervention', 'counterfactual');

CREATE TABLE lab_experiments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name   TEXT NOT NULL,
  causal_role causal_role NOT NULL,
  input_json  JSONB NOT NULL,
  result_json JSONB,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failure')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE lab_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own experiments"
  ON lab_experiments
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Causal Role Values

| Value | Meaning |
|-------|---------|
| `observation` | Passive data collection (e.g., fetch protein structure) |
| `intervention` | Active manipulation (e.g., dock ligand, simulate hypothesis) |
| `counterfactual` | What-if analysis (e.g., mutate sequence, compare outcomes) |

## RLS Policy

- All rows are scoped to `auth.uid()` — no cross-user data leakage
- `ON DELETE CASCADE` ensures experiments are cleaned up when user account is deleted

---

*This document satisfies GAP-3 Step 11 of the Demis Workflow v2 compliance audit.*
