-- Migration: SCM Report Sources
-- SCM-Grounded Report Analysis — source provenance table
-- Apply after: supabase/migrations/20260120_vector_memory.sql

CREATE TABLE IF NOT EXISTS scm_report_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compute_run_id uuid NOT NULL,
  source_id text NOT NULL,
  url text NOT NULL,
  domain text NOT NULL,
  published_at timestamptz,
  credibility_score float4 NOT NULL CHECK (credibility_score BETWEEN 0 AND 1),
  recency_score float4 NOT NULL CHECK (recency_score BETWEEN 0 AND 1),
  corroboration_score float4 NOT NULL CHECK (corroboration_score BETWEEN 0 AND 1),
  excerpt text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  ingestion_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scm_report_sources_source_id_unique UNIQUE (source_id)
);

CREATE INDEX IF NOT EXISTS scm_report_sources_run_idx
  ON scm_report_sources (compute_run_id);

CREATE INDEX IF NOT EXISTS scm_report_sources_domain_credibility_idx
  ON scm_report_sources (domain, credibility_score DESC);

-- RLS: authenticated users can read all sources; only service_role can insert
ALTER TABLE scm_report_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scm_report_sources_select"
  ON scm_report_sources FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "scm_report_sources_insert"
  ON scm_report_sources FOR INSERT TO service_role
  WITH CHECK (true);
