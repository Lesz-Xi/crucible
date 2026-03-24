-- Migration: Add Phase 3 Outputs to synthesis_results
-- Date: 2026-01-23
-- Purpose: Persist Protocol Code, Lab Manual, Lab Job JSON, and Spectral Interference metrics

ALTER TABLE synthesis_results 
ADD COLUMN IF NOT EXISTS protocol_code TEXT,
ADD COLUMN IF NOT EXISTS lab_manual TEXT,
ADD COLUMN IF NOT EXISTS lab_job JSONB,
ADD COLUMN IF NOT EXISTS spectral_interference JSONB;

COMMENT ON COLUMN synthesis_results.protocol_code IS 'Python/Julia simulation code generated for the idea';
COMMENT ON COLUMN synthesis_results.lab_manual IS 'Markdown lab guide for experimental validation';
COMMENT ON COLUMN synthesis_results.lab_job IS 'RIL JSON payload for robotic lab automation';
COMMENT ON COLUMN synthesis_results.spectral_interference IS 'Domain separation metrics (Map of domain_name -> interference_strength)';
