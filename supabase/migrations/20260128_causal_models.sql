-- Phase 33: Causal Models and Interventions (MASA v3.1)
-- Introduces "Truth Store" for formal SCM definitions and "Surgical History" for user interventions.

-- 1. Causal Models (The Truth Cartridge)
-- Stores the formal JSON definition of the graph.
CREATE TABLE IF NOT EXISTS causal_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE, -- e.g. 'economics', 'biology'
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  
  -- The Pearlian Structure
  nodes JSONB NOT NULL, -- Array of {name, type, domain}
  edges JSONB NOT NULL, -- Array of {from, to, constraint}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Causal Interventions (The Surgical History)
-- Logs every "System 2" action (Slider change, Node click).
CREATE TABLE IF NOT EXISTS causal_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  session_id UUID REFERENCES causal_chat_sessions(id) ON DELETE CASCADE,
  model_domain TEXT REFERENCES causal_models(domain),
  
  -- The Intervention (The Do-Operator)
  -- e.g. { "node": "InterestRate", "old_value": "5%", "new_value": "20%" }
  intervention_data JSONB NOT NULL,
  
  -- The Consequence (The Counterfactual State)
  -- e.g. { "nodes": { "Inflation": "Low", "Unemployment": "High" } }
  result_state JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE causal_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE causal_interventions ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can READ public SCM models
CREATE POLICY "Public generic read access to causal_models"
  ON causal_models
  FOR SELECT
  USING (true);

-- Only Admins/Service Role can WRITE models (For now)
-- (No policy needed implies default deny for anon/authenticated, 
-- service role bypasses RLS)

-- Users can READ/WRITE their own interventions
CREATE POLICY "Users can manage their own interventions"
  ON causal_interventions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = causal_interventions.session_id
      AND user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interventions_session_id ON causal_interventions(session_id);
CREATE INDEX IF NOT EXISTS idx_causal_models_domain ON causal_models(domain);
