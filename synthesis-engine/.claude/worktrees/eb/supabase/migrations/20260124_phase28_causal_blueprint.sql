-- Phase 28: Pearl's Causal Blueprint Integration
-- Add SCM violation tracking and causal credit decomposition

-- Add SCM violations column to track constraint failures
ALTER TABLE synthesis_results
ADD COLUMN IF NOT EXISTS scm_violations JSONB DEFAULT '[]'::jsonb;

-- Add causal credit decomposition column
ALTER TABLE synthesis_results
ADD COLUMN IF NOT EXISTS causal_credit JSONB DEFAULT NULL;

-- Create GIN index for efficient querying by violation type
CREATE INDEX IF NOT EXISTS idx_scm_violations 
ON synthesis_results USING GIN (scm_violations);

-- Create index for causal credit queries
CREATE INDEX IF NOT EXISTS idx_causal_credit
ON synthesis_results USING GIN (causal_credit);

-- Add comments for documentation
COMMENT ON COLUMN synthesis_results.scm_violations IS 
'Array of constraint violations from Pearl SCM validation. Each violation contains: {constraint: string, description: string, severity: string, evidence?: string}';

COMMENT ON COLUMN synthesis_results.causal_credit IS 
'Causal decomposition of failure using counterfactuals: {mechanism_fault: number, evidence_fault: number, novelty_fault: number, formulation_fault: number}. Values are 0-1 indicating degree of fault.';

-- Verify migration (SELECT test query)
-- After running this migration, test with:
-- SELECT id, scm_violations, causal_credit FROM synthesis_results LIMIT 5;
