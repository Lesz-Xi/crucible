-- Phase 2: OpenClaw Search Results Storage
-- Purpose: Store external evidence from OpenClaw with causal density scoring
-- Dependencies: auth.users (Supabase Auth)

-- Create search_results table
CREATE TABLE IF NOT EXISTS search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Search context
  query TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'openclaw',
  
  -- Result data from OpenClaw
  title TEXT NOT NULL,
  snippet TEXT NOT NULL,
  url TEXT NOT NULL,
  relevance_score NUMERIC(3, 2), -- 0.00 to 1.00
  
  -- Causal scoring (from CausalIntegrityService)
  causal_density_score INT CHECK (causal_density_score IN (1, 2, 3)),
  causal_label TEXT CHECK (causal_label IN ('Association', 'Intervention', 'Counterfactual')),
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
  detected_mechanisms JSONB DEFAULT '[]',
  
  -- Evidence details (optional structured data from CausalIntegrityService)
  evidence_details JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_search_results_user_query 
  ON search_results(user_id, query);

CREATE INDEX IF NOT EXISTS idx_search_results_created 
  ON search_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_results_causal_score 
  ON search_results(causal_density_score DESC, confidence DESC);

-- Enable Row Level Security
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own search results
CREATE POLICY "Users can view their own search results"
  ON search_results FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own search results
CREATE POLICY "Users can insert their own search results"
  ON search_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own search results (for metadata edits)
CREATE POLICY "Users can update their own search results"
  ON search_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own search results
CREATE POLICY "Users can delete their own search results"
  ON search_results FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE search_results IS 'External evidence from OpenClaw searches, scored with causal density metrics (L1-L3)';
COMMENT ON COLUMN search_results.causal_density_score IS 'Rung of causal ladder: 1=Association, 2=Intervention, 3=Counterfactual';
COMMENT ON COLUMN search_results.confidence IS 'Confidence score from CausalIntegrityService pattern matching';
COMMENT ON COLUMN search_results.detected_mechanisms IS 'JSONB array of detected causal mechanisms from text analysis';
