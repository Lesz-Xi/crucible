# Codex Task: Database Integration for Higher-Order Theory Causal Graph

## Context

I have a production-ready Structural Causal Model (SCM) for **Rosenthal's Higher-Order Theory of Consciousness**:

**Higher-Order Theory SCM** (`Higher-Order/hot_causal_graph.json`)
- 18 nodes: C_creature, s, h, Target_h, Attitude_h, H_s, C_s, Q_s, etc.
- Focus: Rosenthal's consciousness theory
- Validation: `hot_audit.py` ✅ (graph validation passed, TP violations detected, separability confirmed)

## Current MASA Database Schema

My synthesis engine uses Supabase with the following SCM-related tables:

**`scm_models`** (stores graph definitions):
```sql
CREATE TABLE scm_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model_key)
);
```

**`scm_model_versions`** (stores graph structure):
```sql
CREATE TABLE scm_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scm_model_id UUID REFERENCES scm_models(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  dag_json JSONB NOT NULL,  -- nodes[], edges[]
  validation_json JSONB,     -- audit results, constraints
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scm_model_id, version)
);
```

## TypeScript Retrieval System

My `scm-retrieval.ts` already supports:
- Domain aliases: `ai_alignment` → `alignment`
- Database lookup via `SCMRetriever.retrieve(domain)`
- Returns `SCMContext` with populated `model.validationJson`

## Task: Create Database Migration

Write a **Supabase SQL migration** that:

1. **Inserts the HOT causal graph** into the database
2. **Preserves all graph metadata** (nodes, edges, structural equations, constraints, interventions)
3. **Includes validation summaries** from `hot_audit.py`
4. **Follows versioning conventions** (e.g., `v1.0.0`)
5. **Uses proper JSONB formatting** for PostgreSQL

### Required Deliverable

**File:** `synthesis-engine/supabase/migrations/YYYYMMDD_hot_graph_import.sql`

### Expected Structure

```sql
-- Migration: Import Higher-Order Theory (HOT) Causal Graph
-- Description: Adds Rosenthal's HOT formalism as tier-1 innate SCM for consciousness domain
-- Date: 2026-02-04

-- ============================================================================
-- HIGHER-ORDER THEORY SCM (Rosenthal)
-- ============================================================================

INSERT INTO scm_models (model_key, domain, description)
VALUES (
  'hot_rosenthal_v1',
  'consciousness',
  'Rosenthal Higher-Order Theory: formalization of state consciousness via assertoric HOTs'
)
ON CONFLICT (model_key) DO NOTHING;

INSERT INTO scm_model_versions (
  scm_model_id,
  version,
  dag_json,
  validation_json,
  is_active
)
VALUES (
  (SELECT id FROM scm_models WHERE model_key = 'hot_rosenthal_v1'),
  'v1.0.0',
  '{
    "nodes": [...],  -- From hot_causal_graph.json
    "edges": [...]
  }'::jsonb,
  '{
    "core_principles": {
      "transitivity_principle": "C(s) = 1 iff exists h : Target(h) = s and Attitude(h) = Assert",
      "separability": "Q(s) independent of C(s)",
      "assertoric_constraint": "Only assertoric attitudes yield consciousness"
    },
    "audit_status": {
      "graph_validation": "passed",
      "tp_violations": 3,
      "separability_correlation": 0.049
    }
  }'::jsonb,
  true
);
```

### Data Transformation Requirements

1. **Flatten `hot_causal_graph.json` structure:**
   - Extract `nodes[]` and `edges[]` into `dag_json.nodes` and `dag_json.edges`
   - Move `structural_equations`, `constraints`, `interventions` into `validation_json`

2. **Add audit results** from `hot_audit.py`:
   - Graph validation status (19 nodes, 15 edges, DAG confirmed)
   - TP violation count (e.g., 3 violations: s_14, s_29, s_41)
   - Separability correlation (r = 0.049)
   - Core HOT principles encoded in `validation_json`

### Validation Steps

After migration, verify:
```sql
-- Check HOT model exists
SELECT model_key, domain, description FROM scm_models 
WHERE model_key = 'hot_rosenthal_v1';

-- Check version is active and has correct node count
SELECT v.version, v.is_active, jsonb_array_length(v.dag_json->'nodes') AS node_count
FROM scm_model_versions v
JOIN scm_models m ON v.scm_model_id = m.id
WHERE m.model_key = 'hot_rosenthal_v1';

-- Expected: version = 'v1.0.0', is_active = true, node_count = 18
```

### Notes

- Use proper JSONB escaping for PostgreSQL
- Ensure all JSON is valid (run through `jq` validator)
- Keep migration idempotent with `ON CONFLICT DO NOTHING`
- Add comments explaining the theoretical significance of each graph

## Expected Outcome

After running this migration:
1. ✅ HOT graph is queryable via `SCMRetriever.retrieve('consciousness')` or `SCMRetriever.retrieve('hot')`
2. ✅ `validation_json` contains HOT audit summaries (TP validation, separability, etc.)
3. ✅ Frontend can display HOT principles and state topologies in causal chat interface
4. ✅ MASA can use HOT SCM for consciousness-related synthesis tasks

---

**Style Notes:**
- Follow existing migration conventions in `synthesis-engine/supabase/migrations/`
- Use descriptive comments
- Include RLS policies if needed (likely not for read-only innate SCMs)
- Test locally before committing
