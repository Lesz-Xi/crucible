-- Phase M5: SCM model promotion governance audits
-- Enforces an auditable trail for pre-promotion disagreement checks, overrides, and decisions.

CREATE TABLE IF NOT EXISTS scm_model_promotion_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES scm_models(id) ON DELETE CASCADE,
  model_key TEXT NOT NULL,
  candidate_version TEXT NOT NULL,
  baseline_version TEXT NOT NULL,
  disagreement_report_id UUID REFERENCES causal_disagreement_reports(id) ON DELETE SET NULL,
  outcome_var TEXT NOT NULL,
  interventions JSONB NOT NULL DEFAULT '[]'::jsonb,
  cross_domain BOOLEAN NOT NULL DEFAULT FALSE,
  alignment_coverage NUMERIC(6, 4) NOT NULL DEFAULT 0,
  required_alignment_coverage NUMERIC(6, 4) NOT NULL DEFAULT 0.9,
  high_severity_atoms INT NOT NULL DEFAULT 0,
  medium_severity_atoms INT NOT NULL DEFAULT 0,
  low_severity_atoms INT NOT NULL DEFAULT 0,
  unresolved_high_atoms INT NOT NULL DEFAULT 0,
  blocked BOOLEAN NOT NULL,
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_rationale TEXT,
  override_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_reason TEXT NOT NULL,
  gate_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scm_model_promotion_audits_model_created
  ON scm_model_promotion_audits(model_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scm_model_promotion_audits_user_created
  ON scm_model_promotion_audits(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scm_model_promotion_audits_gate_gin
  ON scm_model_promotion_audits USING GIN (gate_json);

ALTER TABLE scm_model_promotion_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scm_promotion_audits_select_own" ON scm_model_promotion_audits;
CREATE POLICY "scm_promotion_audits_select_own"
  ON scm_model_promotion_audits
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scm_promotion_audits_insert_own" ON scm_model_promotion_audits;
CREATE POLICY "scm_promotion_audits_insert_own"
  ON scm_model_promotion_audits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scm_promotion_audits_update_own" ON scm_model_promotion_audits;
CREATE POLICY "scm_promotion_audits_update_own"
  ON scm_model_promotion_audits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scm_promotion_audits_delete_own" ON scm_model_promotion_audits;
CREATE POLICY "scm_promotion_audits_delete_own"
  ON scm_model_promotion_audits
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE scm_model_promotion_audits IS 'Governance log for SCM model promotion decisions, disagreement risk, and overrides.';
