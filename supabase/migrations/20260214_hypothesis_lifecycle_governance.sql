-- Phase M3: Hypothesis lifecycle governance

ALTER TABLE synthesis_results
  ADD COLUMN IF NOT EXISTS hypothesis_state TEXT NOT NULL DEFAULT 'proposed'
    CHECK (hypothesis_state IN ('proposed', 'tested', 'falsified', 'retracted'));

ALTER TABLE synthesis_results
  ADD COLUMN IF NOT EXISTS hypothesis_events JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS hypothesis_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES synthesis_results(id) ON DELETE CASCADE,
  run_id UUID REFERENCES synthesis_runs(id) ON DELETE SET NULL,
  hypothesis_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('proposed', 'tested', 'falsified', 'retracted')),
  trigger TEXT NOT NULL CHECK (trigger IN ('generation', 'intervention_result', 'counterfactual_failure', 'manual_review')),
  evidence_ref TEXT[] NOT NULL DEFAULT '{}',
  rationale TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hypothesis_audit_events_result
  ON hypothesis_audit_events(result_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hypothesis_audit_events_run
  ON hypothesis_audit_events(run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hypothesis_audit_events_state
  ON hypothesis_audit_events(state, created_at DESC);

COMMENT ON COLUMN synthesis_results.hypothesis_state IS
  'Current lifecycle state of the hypothesis (proposed/tested/falsified/retracted).';

COMMENT ON COLUMN synthesis_results.hypothesis_events IS
  'Embedded audit event ledger for lifecycle transitions.';

COMMENT ON TABLE hypothesis_audit_events IS
  'Append-only lifecycle event log for hypothesis governance.';
