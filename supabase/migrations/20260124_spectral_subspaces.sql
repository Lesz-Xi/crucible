-- Migration: Add Spectral Subspaces for Cognitive Sovereignty
-- Date: 2026-01-23

CREATE TABLE IF NOT EXISTS spectral_subspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_name TEXT NOT NULL UNIQUE,
  eigenvectors JSONB NOT NULL, -- Store as JSON array of arrays for simplicity in JS handling
  eigenvalues FLOAT[] NOT NULL,
  mean_embedding VECTOR(1536) NOT NULL,
  basis_rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE spectral_subspaces ENABLE ROW LEVEL SECURITY;

-- Allow all for now (internal service use)
CREATE POLICY "Allow all access to spectral_subspaces" 
ON spectral_subspaces FOR ALL 
USING (true) 
WITH CHECK (true);

COMMENT ON TABLE spectral_subspaces IS 'Stores the principal semantic components of specific knowledge domains to prevent catastrophic interference.';
