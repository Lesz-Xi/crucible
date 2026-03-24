-- Enhanced Synthesis Validation migration
-- USER ACTION REQUIRED: run in Supabase SQL Editor before deploying Phase 3 UI/API.

BEGIN;

-- Phase 3: Evidence snippet structure v2
ALTER TABLE synthesis_results
ADD COLUMN IF NOT EXISTS evidence_snippets_v2 JSONB;

-- Backfill v2 from legacy prior_art or leave null if unavailable.
UPDATE synthesis_results
SET evidence_snippets_v2 = COALESCE(evidence_snippets_v2, '[]'::jsonb)
WHERE evidence_snippets_v2 IS NULL;

-- Phase 1: Prior art temporal fields
ALTER TABLE synthesis_results
ADD COLUMN IF NOT EXISTS prior_art_publication_year INTEGER,
ADD COLUMN IF NOT EXISTS prior_art_temporal_weight DECIMAL(5,4);

UPDATE synthesis_results
SET
  prior_art_publication_year = COALESCE(prior_art_publication_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  prior_art_temporal_weight = COALESCE(prior_art_temporal_weight, 1.0)
WHERE prior_art_publication_year IS NULL
   OR prior_art_temporal_weight IS NULL;

COMMIT;

-- Optional follow-up (DESTRUCTIVE, run only after verification and backups):
-- ALTER TABLE synthesis_results DROP COLUMN evidence_snippets;
-- ALTER TABLE synthesis_results RENAME COLUMN evidence_snippets_v2 TO evidence_snippets;

-- Rollback (within controlled maintenance window):
-- ALTER TABLE synthesis_results DROP COLUMN IF EXISTS evidence_snippets_v2;
-- ALTER TABLE synthesis_results DROP COLUMN IF EXISTS prior_art_publication_year;
-- ALTER TABLE synthesis_results DROP COLUMN IF EXISTS prior_art_temporal_weight;
