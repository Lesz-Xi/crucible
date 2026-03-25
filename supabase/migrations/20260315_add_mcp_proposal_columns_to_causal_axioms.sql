ALTER TABLE causal_axioms
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'session_extracted'
    CHECK (source IN ('session_extracted', 'agent_proposed', 'human_verified')),
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS justification TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT;

COMMENT ON COLUMN causal_axioms.source IS
  'Origin of the axiom: session_extracted (by AxiomCompressionService), agent_proposed (via MCP), human_verified (manual).';
COMMENT ON COLUMN causal_axioms.review_status IS
  'Approval state. agent_proposed axioms start as pending_review. session_extracted starts as approved.';
COMMENT ON COLUMN causal_axioms.agent_id IS
  'VoltAgent agent identifier for agent_proposed axioms. NULL for session_extracted.';
COMMENT ON COLUMN causal_axioms.justification IS
  'Agent-provided reasoning for agent_proposed axioms. Used for human review.';
COMMENT ON COLUMN causal_axioms.domain IS
  'Domain classification. NULL for legacy rows.';
