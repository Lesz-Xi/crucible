-- Add missing columns to persist full synthesis history

-- 1. Add structured_approach to synthesis_runs (Implementation Approach)
ALTER TABLE synthesis_runs 
ADD COLUMN IF NOT EXISTS structured_approach jsonb;

-- 2. Add prior_art to synthesis_results (Prior Art Analysis)
ALTER TABLE synthesis_results 
ADD COLUMN IF NOT EXISTS prior_art jsonb;
