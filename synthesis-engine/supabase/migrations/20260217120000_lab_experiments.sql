-- Create Causal Role Enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'causal_role') THEN
        CREATE TYPE causal_role AS ENUM ('observation', 'intervention', 'counterfactual');
    END IF;
END $$;

-- Create Lab Experiments Table
CREATE TABLE IF NOT EXISTS lab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  tool_name text NOT NULL, -- 'protein_viewer', 'analyze_sequence', 'docking'
  causal_role causal_role NOT NULL, -- 'observation' ($P(Y|X)$), 'intervention' ($P(Y|do(X))$), 'counterfactual'
  input_hash text NOT NULL, -- SHA-256 of ALL input params (ensure determinism check)
  input_json jsonb NOT NULL,
  result_json jsonb,
  status text NOT NULL, -- 'pending', 'success', 'failure'
  error_message text,
  metadata jsonb, -- { "method_version": "1.0", "seed": 12345, "graph_node": "C" }
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lab_experiments ENABLE ROW LEVEL SECURITY;

-- Policies (Read Own, Write Own)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lab_experiments' AND policyname = 'Users can read their own experiments'
    ) THEN
        CREATE POLICY "Users can read their own experiments" ON lab_experiments FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lab_experiments' AND policyname = 'Users can create their own experiments'
    ) THEN
        CREATE POLICY "Users can create their own experiments" ON lab_experiments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lab_experiments' AND policyname = 'Users can update their own experiments'
    ) THEN
        CREATE POLICY "Users can update their own experiments" ON lab_experiments FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
