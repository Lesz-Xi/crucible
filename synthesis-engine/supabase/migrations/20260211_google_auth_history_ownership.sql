-- ==============================================================================
-- Google Auth + History Ownership Hardening
-- Timeline anchor: 2026-02-11
-- ==============================================================================

-- 1) Synthesis ownership columns (hybrid domain)
ALTER TABLE IF EXISTS synthesis_runs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS synthesis_runs
  ADD COLUMN IF NOT EXISTS external_import_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_synthesis_runs_external_import_id
  ON synthesis_runs(external_import_id)
  WHERE external_import_id IS NOT NULL;

ALTER TABLE IF EXISTS synthesis_results
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS synthesis_results
  ADD COLUMN IF NOT EXISTS external_import_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_synthesis_results_external_import_id
  ON synthesis_results(external_import_id)
  WHERE external_import_id IS NOT NULL;

-- Backfill created_by_user_id from synthesis_runs when possible.
DO $$
BEGIN
  IF to_regclass('public.synthesis_results') IS NOT NULL AND to_regclass('public.synthesis_runs') IS NOT NULL THEN
    UPDATE synthesis_results sr
    SET created_by_user_id = r.user_id
    FROM synthesis_runs r
    WHERE sr.run_id = r.id
      AND sr.created_by_user_id IS NULL
      AND r.user_id IS NOT NULL;
  END IF;
END $$;

-- 2) Causal chat ownership + import keys
ALTER TABLE IF EXISTS causal_chat_sessions
  ADD COLUMN IF NOT EXISTS external_import_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_causal_chat_sessions_external_import_id
  ON causal_chat_sessions(external_import_id)
  WHERE external_import_id IS NOT NULL;

ALTER TABLE IF EXISTS causal_chat_messages
  ADD COLUMN IF NOT EXISTS external_import_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_causal_chat_messages_external_import_id
  ON causal_chat_messages(external_import_id)
  WHERE external_import_id IS NOT NULL;

-- Replace permissive anonymous chat policies with authenticated owner policies.
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON causal_chat_sessions;
DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON causal_chat_messages;
DROP POLICY IF EXISTS "read_sessions_authenticated_or_anonymous" ON causal_chat_sessions;
DROP POLICY IF EXISTS "read_messages_authenticated_or_anonymous" ON causal_chat_messages;

CREATE POLICY "Users can manage their own chat sessions"
  ON causal_chat_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their sessions"
  ON causal_chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = causal_chat_messages.session_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = causal_chat_messages.session_id
        AND user_id = auth.uid()
    )
  );

-- 3) Legal history ownership hardening (if table exists)
DO $$
BEGIN
  IF to_regclass('public.legal_analysis_history') IS NOT NULL THEN
    ALTER TABLE legal_analysis_history
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

    ALTER TABLE legal_analysis_history
      ADD COLUMN IF NOT EXISTS external_import_id TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_legal_analysis_history_external_import_id
      ON legal_analysis_history(external_import_id)
      WHERE external_import_id IS NOT NULL;

    EXECUTE 'ALTER TABLE legal_analysis_history ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "Users can manage own legal analysis history" ON legal_analysis_history;
    DROP POLICY IF EXISTS "Users can read legal analysis history" ON legal_analysis_history;

    CREATE POLICY "Users can manage own legal analysis history"
      ON legal_analysis_history
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4) Import job tracking
CREATE TABLE IF NOT EXISTS history_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  source_version TEXT NOT NULL,
  summary_json JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_import_jobs_user_status
  ON history_import_jobs(user_id, status, created_at DESC);

ALTER TABLE history_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own history import jobs" ON history_import_jobs;
CREATE POLICY "Users can manage own history import jobs"
  ON history_import_jobs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_history_import_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS history_import_jobs_updated_at ON history_import_jobs;
CREATE TRIGGER history_import_jobs_updated_at
  BEFORE UPDATE ON history_import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_history_import_jobs_updated_at();

-- 5) Synthesis run RLS (if table exists)
DO $$
BEGIN
  IF to_regclass('public.synthesis_runs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE synthesis_runs ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "Users can manage own synthesis runs" ON synthesis_runs;
    CREATE POLICY "Users can manage own synthesis runs"
      ON synthesis_runs
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
