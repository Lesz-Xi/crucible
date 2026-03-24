-- Week 1: Claim Reconstruction Ledger (v1)
-- Purpose: Persist replayable claim lineage artifacts across chat/hybrid/legal outputs.

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID,
  trace_id TEXT,
  source_feature TEXT NOT NULL CHECK (source_feature IN ('chat', 'hybrid', 'legal')),
  claim_text TEXT NOT NULL,
  claim_kind TEXT NOT NULL DEFAULT 'assertion' CHECK (claim_kind IN ('assertion', 'hypothesis', 'decision', 'verdict')),
  confidence_score DOUBLE PRECISION,
  uncertainty_label TEXT CHECK (uncertainty_label IN ('low', 'medium', 'high', 'unknown')),
  model_key TEXT,
  model_version TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'emitted', 'retracted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_user_created
  ON claims(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claims_trace
  ON claims(trace_id)
  WHERE trace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_claims_session
  ON claims(session_id)
  WHERE session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS claim_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('source', 'tool_output', 'citation', 'memory', 'counterfactual_trace')),
  evidence_ref TEXT NOT NULL,
  snippet TEXT,
  reliability_score DOUBLE PRECISION,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_links_claim
  ON claim_evidence_links(claim_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_links_metadata
  ON claim_evidence_links USING GIN (metadata);

CREATE TABLE IF NOT EXISTS claim_gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  gate_name TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('pass', 'fail', 'warn')),
  rationale TEXT NOT NULL,
  score DOUBLE PRECISION,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_gate_decisions_claim
  ON claim_gate_decisions(claim_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_claim_gate_decisions_gate
  ON claim_gate_decisions(gate_name, created_at DESC);

CREATE TABLE IF NOT EXISTS claim_counterfactual_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  counterfactual_trace_id UUID REFERENCES counterfactual_traces(id) ON DELETE SET NULL,
  necessity_supported BOOLEAN,
  sufficiency_supported BOOLEAN,
  method TEXT,
  assumptions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcome_delta DOUBLE PRECISION,
  result_label TEXT NOT NULL DEFAULT 'inconclusive' CHECK (result_label IN ('supported', 'rejected', 'inconclusive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_counterfactual_tests_claim
  ON claim_counterfactual_tests(claim_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_claim_counterfactual_tests_trace
  ON claim_counterfactual_tests(counterfactual_trace_id)
  WHERE counterfactual_trace_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS claim_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  receipt_type TEXT NOT NULL CHECK (receipt_type IN ('emission', 'revision', 'retraction')),
  actor TEXT NOT NULL,
  receipt_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_receipts_claim
  ON claim_receipts(claim_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_claim_receipts_json
  ON claim_receipts USING GIN (receipt_json);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_gate_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_counterfactual_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "claims_select_scope" ON claims;
CREATE POLICY "claims_select_scope"
  ON claims
  FOR SELECT
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS "claims_insert_scope" ON claims;
CREATE POLICY "claims_insert_scope"
  ON claims
  FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS "claims_update_scope" ON claims;
CREATE POLICY "claims_update_scope"
  ON claims
  FOR UPDATE
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS "claim_evidence_links_scope" ON claim_evidence_links;
CREATE POLICY "claim_evidence_links_scope"
  ON claim_evidence_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_evidence_links.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_evidence_links.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  );

DROP POLICY IF EXISTS "claim_gate_decisions_scope" ON claim_gate_decisions;
CREATE POLICY "claim_gate_decisions_scope"
  ON claim_gate_decisions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_gate_decisions.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_gate_decisions.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  );

DROP POLICY IF EXISTS "claim_counterfactual_tests_scope" ON claim_counterfactual_tests;
CREATE POLICY "claim_counterfactual_tests_scope"
  ON claim_counterfactual_tests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_counterfactual_tests.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_counterfactual_tests.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  );

DROP POLICY IF EXISTS "claim_receipts_scope" ON claim_receipts;
CREATE POLICY "claim_receipts_scope"
  ON claim_receipts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_receipts.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_receipts.claim_id
        AND (
          c.user_id IS NULL
          OR auth.uid() = c.user_id
          OR auth.jwt() ->> 'role' = 'service_role'
        )
    )
  );

CREATE OR REPLACE FUNCTION set_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claims_updated_at ON claims;
CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION set_claims_updated_at();

COMMENT ON TABLE claims IS
  'Primary ledger for claim emission and replay reconstruction.';
COMMENT ON TABLE claim_evidence_links IS
  'Evidence bindings used to support or contextualize each claim.';
COMMENT ON TABLE claim_gate_decisions IS
  'Gate decisions (novelty/falsifiability/identifiability/etc.) per claim.';
COMMENT ON TABLE claim_counterfactual_tests IS
  'Counterfactual validation outcomes attached to claims.';
COMMENT ON TABLE claim_receipts IS
  'Operational receipts for claim emission, revision, and retraction.';
