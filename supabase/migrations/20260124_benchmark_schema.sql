-- Benchmark Runs Table
-- Stores results and metadata for empirical validation runs
-- Part of Empirical Benchmarking System to improve K-Dense AI validation score
-- Created: 2026-01-24

-- Create benchmark_runs table
CREATE TABLE IF NOT EXISTS benchmark_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Benchmark identification
  suite_name TEXT NOT NULL CHECK (suite_name IN ('duplicate_detection', 'spectral_drift', 'protocol_validity', 'full_suite')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}', -- Benchmark parameters (e.g., domain, sample size)
  
  -- Results
  results JSONB DEFAULT NULL, -- Metrics collected during execution
  error_message TEXT DEFAULT NULL, -- Error details if failed
  
  -- Metadata
  cost_estimate NUMERIC(10,2) NOT NULL, -- Estimated cost in USD
  cost_actual NUMERIC(10,2) DEFAULT NULL, -- Actual cost incurred
  duration_seconds INT DEFAULT NULL, -- Duration of execution
  token_usage JSONB DEFAULT NULL, -- Token breakdown by operation
  
  -- Progress tracking
  progress JSONB DEFAULT NULL -- Current step, completed items, etc.
);

-- Indexes for performance
CREATE INDEX idx_benchmark_runs_suite ON benchmark_runs(suite_name);
CREATE INDEX idx_benchmark_runs_created ON benchmark_runs(created_at DESC);
CREATE INDEX idx_benchmark_runs_status ON benchmark_runs(status);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_benchmark_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table
CREATE TRIGGER benchmark_runs_updated_at
  BEFORE UPDATE ON benchmark_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_benchmark_runs_updated_at();

-- Add table comment for documentation
COMMENT ON TABLE benchmark_runs IS 'Empirical validation benchmark results for K-Dense AI scoring improvement (3.5/10 → 6.0/10)';
