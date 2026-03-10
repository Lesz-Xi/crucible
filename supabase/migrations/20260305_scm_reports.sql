-- Migration: SCM-Grounded Report Analysis Tables (M6.2 Compliant)
-- Date: 2026-03-05
-- Combines claims, sources, and reports into a unified migration.

-- 1. Source records for SCM-Grounded Report Analysis
CREATE TABLE IF NOT EXISTS scm_report_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compute_run_id uuid NOT NULL,          -- Ties to report run
  source_id text NOT NULL UNIQUE,        -- UUIDv7 from pipeline
  url text NOT NULL,
  domain text NOT NULL,
  published_at timestamptz,
  credibility_score float4 NOT NULL CHECK (credibility_score BETWEEN 0 AND 1),
  recency_score float4 NOT NULL CHECK (recency_score BETWEEN 0 AND 1),
  corroboration_score float4 NOT NULL CHECK (corroboration_score BETWEEN 0 AND 1),
  excerpt text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  ingestion_id text NOT NULL,            -- UUIDv7 retrieval batch ID
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scm_report_sources_run_idx ON scm_report_sources (compute_run_id);
CREATE INDEX IF NOT EXISTS scm_report_sources_domain_idx ON scm_report_sources (domain);

-- RLS: readable by anon and authenticated users; insertable only by service role
ALTER TABLE scm_report_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scm_report_sources_select" ON scm_report_sources;
CREATE POLICY "scm_report_sources_select" ON scm_report_sources
  FOR SELECT TO authenticated, anon USING (true);
-- No insert policy needed because service_role bypasses RLS

-- 2. Claim records with full M6.2 provenance
CREATE TABLE IF NOT EXISTS scm_report_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id text NOT NULL UNIQUE,         -- UUIDv7 from pipeline
  compute_run_id uuid NOT NULL,          -- M6.2 trace anchor (maps to TraceRecord.trace_id)
  report_id text NOT NULL,              -- References scm_reports.report_id
  claim_text text NOT NULL,
  entities text[] NOT NULL DEFAULT '{}',
  event_time timestamptz,
  source_ids text[] NOT NULL DEFAULT '{}',
  evidence_tier text NOT NULL CHECK (evidence_tier IN ('A','B','C','UNKNOWN')),
  claim_class text NOT NULL CHECK (claim_class IN (
    'IDENTIFIED_CAUSAL','INFERRED_CAUSAL','ASSOCIATIONAL_ONLY','INSUFFICIENT_EVIDENCE'
  )),
  scm_edge_support text NOT NULL CHECK (scm_edge_support IN ('observed','inferred','speculative')),
  confidence float4 NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  warning_codes text[] NOT NULL DEFAULT '{}',
  falsifier_tests text[] NOT NULL DEFAULT '{}',
  -- M6.2 provenance fields
  provenance_model text NOT NULL,
  provenance_prompt_version text NOT NULL,
  provenance_input_hash text NOT NULL,
  provenance_method_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scm_report_claims_run_idx ON scm_report_claims (compute_run_id);
CREATE INDEX IF NOT EXISTS scm_report_claims_report_idx ON scm_report_claims (report_id);

ALTER TABLE scm_report_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scm_report_claims_select" ON scm_report_claims;
CREATE POLICY "scm_report_claims_select" ON scm_report_claims
  FOR SELECT TO authenticated, anon USING (true);
-- No insert policy needed because service_role bypasses RLS

-- 3. Report metadata with full M6.2 trace
CREATE TABLE IF NOT EXISTS scm_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL UNIQUE,         -- UUIDv7
  report_version int NOT NULL DEFAULT 1,
  compute_run_id uuid NOT NULL,
  input_hash text NOT NULL,               -- SHA-256(query + source_ids[])
  query text NOT NULL,
  causal_depth text NOT NULL CHECK (causal_depth IN ('verified','heuristic','warning','unknown')),
  allow_verified boolean NOT NULL DEFAULT false,
  verification_failures text[] NOT NULL DEFAULT '{}',
  unknowns text[] NOT NULL DEFAULT '{}',
  method_version text NOT NULL,
  pipeline_config jsonb NOT NULL DEFAULT '{}',
  report_json jsonb NOT NULL,             -- Full SCMGroundedReport blob
  user_id uuid REFERENCES auth.users(id), -- Nullable for anon/passcode
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scm_reports_compute_run_idx ON scm_reports (compute_run_id);
CREATE INDEX IF NOT EXISTS scm_reports_user_idx ON scm_reports (user_id);
CREATE INDEX IF NOT EXISTS scm_reports_generated_idx ON scm_reports (generated_at DESC);

ALTER TABLE scm_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scm_reports_select_own_or_anon" ON scm_reports;
CREATE POLICY "scm_reports_select_own_or_anon" ON scm_reports
  FOR SELECT TO authenticated, anon USING (true);
-- No insert policy needed because service_role bypasses RLS
