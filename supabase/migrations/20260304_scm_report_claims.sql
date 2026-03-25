-- Migration: SCM Report Claims
-- SCM-Grounded Report Analysis — claim records with full M6.2 provenance
-- Apply after: 20260304_scm_report_sources.sql

CREATE TABLE IF NOT EXISTS scm_report_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id text NOT NULL,
  compute_run_id uuid NOT NULL,
  report_id text NOT NULL,
  claim_text text NOT NULL,
  entities text[] NOT NULL DEFAULT '{}',
  event_time timestamptz,
  source_ids text[] NOT NULL DEFAULT '{}',
  evidence_tier text NOT NULL CHECK (evidence_tier IN ('A', 'B', 'C', 'UNKNOWN')),
  claim_class text NOT NULL CHECK (claim_class IN (
    'IDENTIFIED_CAUSAL',
    'INFERRED_CAUSAL',
    'ASSOCIATIONAL_ONLY',
    'INSUFFICIENT_EVIDENCE'
  )),
  scm_edge_support text NOT NULL CHECK (scm_edge_support IN ('observed', 'inferred', 'speculative')),
  confidence float4 NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  warning_codes text[] NOT NULL DEFAULT '{}',
  falsifier_tests text[] NOT NULL DEFAULT '{}',
  -- M6.2 provenance fields (resolves audit C1)
  provenance_model text NOT NULL,
  provenance_prompt_version text NOT NULL,
  provenance_input_hash text NOT NULL,
  provenance_method_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scm_report_claims_claim_id_unique UNIQUE (claim_id)
);

CREATE INDEX IF NOT EXISTS scm_report_claims_run_idx
  ON scm_report_claims (compute_run_id);

CREATE INDEX IF NOT EXISTS scm_report_claims_report_idx
  ON scm_report_claims (report_id);

CREATE INDEX IF NOT EXISTS scm_report_claims_class_confidence_idx
  ON scm_report_claims (claim_class, confidence DESC);

-- RLS
ALTER TABLE scm_report_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scm_report_claims_select"
  ON scm_report_claims FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "scm_report_claims_insert"
  ON scm_report_claims FOR INSERT TO service_role
  WITH CHECK (true);
