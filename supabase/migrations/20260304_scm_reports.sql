-- Migration: SCM Reports
-- SCM-Grounded Report Analysis — top-level report metadata table
-- Apply after: 20260304_scm_report_claims.sql

CREATE TABLE IF NOT EXISTS scm_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL,
  report_version int NOT NULL DEFAULT 1,
  compute_run_id uuid NOT NULL,
  input_hash text NOT NULL,
  query text NOT NULL,
  causal_depth text NOT NULL CHECK (causal_depth IN ('verified', 'heuristic', 'warning', 'unknown')),
  allow_verified boolean NOT NULL DEFAULT false,
  verification_failures text[] NOT NULL DEFAULT '{}',
  unknowns text[] NOT NULL DEFAULT '{}',
  method_version text NOT NULL,
  pipeline_config jsonb NOT NULL DEFAULT '{}',
  report_json jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scm_reports_report_id_unique UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS scm_reports_compute_run_idx
  ON scm_reports (compute_run_id);

CREATE INDEX IF NOT EXISTS scm_reports_user_generated_idx
  ON scm_reports (user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS scm_reports_input_hash_idx
  ON scm_reports (input_hash);

-- RLS: users can only access their own reports (or public reports with null user_id)
ALTER TABLE scm_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scm_reports_select_own"
  ON scm_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "scm_reports_insert"
  ON scm_reports FOR INSERT TO service_role
  WITH CHECK (true);
