-- Phase M2: Deterministic counterfactual trace persistence

CREATE TABLE IF NOT EXISTS counterfactual_traces (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_feature TEXT NOT NULL CHECK (source_feature IN ('hybrid', 'legal', 'education', 'chat', 'scm')),
  model_key TEXT NOT NULL,
  model_version TEXT NOT NULL,
  intervention_variable TEXT NOT NULL,
  intervention_value DOUBLE PRECISION NOT NULL,
  outcome_variable TEXT NOT NULL,
  observed_world JSONB NOT NULL DEFAULT '{}'::jsonb,
  assumptions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  adjustment_set JSONB NOT NULL DEFAULT '[]'::jsonb,
  computation_method TEXT NOT NULL CHECK (computation_method IN ('deterministic_graph_diff', 'structural_equation_solver')),
  affected_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  uncertainty TEXT NOT NULL CHECK (uncertainty IN ('high', 'medium', 'low')),
  actual_outcome DOUBLE PRECISION NOT NULL,
  counterfactual_outcome DOUBLE PRECISION NOT NULL,
  delta DOUBLE PRECISION NOT NULL,
  trace_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counterfactual_traces_user_created
  ON counterfactual_traces(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_counterfactual_traces_model_created
  ON counterfactual_traces(model_key, model_version, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_counterfactual_traces_feature_created
  ON counterfactual_traces(source_feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_counterfactual_traces_trace_json
  ON counterfactual_traces USING GIN (trace_json);

ALTER TABLE counterfactual_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "counterfactual_traces_select_scope" ON counterfactual_traces;
CREATE POLICY "counterfactual_traces_select_scope"
  ON counterfactual_traces
  FOR SELECT
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS "counterfactual_traces_insert_scope" ON counterfactual_traces;
CREATE POLICY "counterfactual_traces_insert_scope"
  ON counterfactual_traces
  FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

COMMENT ON TABLE counterfactual_traces IS
  'Deterministic counterfactual execution traces for intervention-supported outputs.';
