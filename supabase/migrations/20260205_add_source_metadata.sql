-- Migration: Add Source Metadata to Synthesis Runs
-- Purpose: Store PDF sources, company entities, and research intent for history display
-- Date: 2026-02-05

-- Add columns for source metadata
ALTER TABLE synthesis_runs
  ADD COLUMN IF NOT EXISTS pdf_sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_entities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS research_intent TEXT DEFAULT '';

-- Add helpful comments
COMMENT ON COLUMN synthesis_runs.pdf_sources IS 'Array of PDF filenames used in synthesis';
COMMENT ON COLUMN synthesis_runs.company_entities IS 'Array of company names analyzed in synthesis';
COMMENT ON COLUMN synthesis_runs.research_intent IS 'User-specified research goal or focus area';
