-- =============================================================
-- Automated Scientist: Scientific Data Pipeline Schema
-- Phase A — Data Foundations
-- Creates: document_ingestions, extracted_tables,
--          scientific_data_points, compute_runs
-- =============================================================

-- 1) document_ingestions: Track PDF ingestion lifecycle
CREATE TABLE IF NOT EXISTS document_ingestions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_hash_sha256 TEXT NOT NULL,
  file_size_bytes  BIGINT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  ingestion_version INTEGER NOT NULL DEFAULT 1,
  error_message    TEXT,
  page_count       INTEGER,
  metadata_jsonb   JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  
  -- Idempotency: same file + user + version = no duplicate
  UNIQUE (user_id, file_hash_sha256, ingestion_version)
);

-- 2) extracted_tables: Store table extraction results per page
CREATE TABLE IF NOT EXISTS extracted_tables (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_id    UUID NOT NULL REFERENCES document_ingestions(id) ON DELETE CASCADE,
  page_number     INTEGER NOT NULL,
  table_index     INTEGER NOT NULL DEFAULT 0,
  headers_jsonb   JSONB NOT NULL DEFAULT '[]'::jsonb,
  rows_jsonb      JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence      REAL NOT NULL DEFAULT 0.0
                    CHECK (confidence >= 0.0 AND confidence <= 1.0),
  parse_status    TEXT NOT NULL DEFAULT 'parsed'
                    CHECK (parse_status IN ('parsed', 'partial', 'failed')),
  qa_flags_jsonb  JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3) scientific_data_points: Individual experimental measurements
CREATE TABLE IF NOT EXISTS scientific_data_points (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_id    UUID REFERENCES document_ingestions(id) ON DELETE CASCADE,
  source_table_id UUID REFERENCES extracted_tables(id) ON DELETE SET NULL,
  variable_x_name TEXT NOT NULL,
  variable_y_name TEXT NOT NULL,
  x_value         DOUBLE PRECISION NOT NULL,
  y_value         DOUBLE PRECISION NOT NULL,
  unit_x          TEXT,
  unit_y          TEXT,
  metadata_jsonb  JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4) compute_runs: Deterministic computation audit trail
CREATE TABLE IF NOT EXISTS compute_runs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_id      UUID REFERENCES document_ingestions(id) ON DELETE CASCADE,
  method            TEXT NOT NULL,
  method_version    TEXT NOT NULL DEFAULT '1.0.0',
  params_jsonb      JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_jsonb      JSONB NOT NULL DEFAULT '{}'::jsonb,
  deterministic_hash TEXT NOT NULL,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE document_ingestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE scientific_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE compute_runs ENABLE ROW LEVEL SECURITY;

-- document_ingestions: owner-only access
CREATE POLICY "Users can view own ingestions"
  ON document_ingestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingestions"
  ON document_ingestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingestions"
  ON document_ingestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- extracted_tables: via ingestion ownership
CREATE POLICY "Users can view own extracted tables"
  ON extracted_tables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_ingestions
      WHERE document_ingestions.id = extracted_tables.ingestion_id
        AND document_ingestions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own extracted tables"
  ON extracted_tables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_ingestions
      WHERE document_ingestions.id = extracted_tables.ingestion_id
        AND document_ingestions.user_id = auth.uid()
    )
  );

-- scientific_data_points: via ingestion ownership
CREATE POLICY "Users can view own data points"
  ON scientific_data_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_ingestions
      WHERE document_ingestions.id = scientific_data_points.ingestion_id
        AND document_ingestions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own data points"
  ON scientific_data_points FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_ingestions
      WHERE document_ingestions.id = scientific_data_points.ingestion_id
        AND document_ingestions.user_id = auth.uid()
    )
  );

-- compute_runs: via creator ownership
CREATE POLICY "Users can view own compute runs"
  ON compute_runs FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own compute runs"
  ON compute_runs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =============================================================
-- Indexes for query performance
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_document_ingestions_user_id
  ON document_ingestions(user_id);

CREATE INDEX IF NOT EXISTS idx_document_ingestions_file_hash
  ON document_ingestions(file_hash_sha256);

CREATE INDEX IF NOT EXISTS idx_extracted_tables_ingestion_id
  ON extracted_tables(ingestion_id);

CREATE INDEX IF NOT EXISTS idx_scientific_data_points_ingestion_id
  ON scientific_data_points(ingestion_id);

CREATE INDEX IF NOT EXISTS idx_compute_runs_ingestion_id
  ON compute_runs(ingestion_id);

CREATE INDEX IF NOT EXISTS idx_compute_runs_deterministic_hash
  ON compute_runs(deterministic_hash);
