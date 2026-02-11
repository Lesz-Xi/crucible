-- ==============================================================================
-- Education Apprenticeship Sessions (Causal Apprenticeship Mode)
-- ==============================================================================

-- Preflight: ensure dependency table exists
DO $$
BEGIN
  IF to_regclass('public.education_plans') IS NULL THEN
    RAISE EXCEPTION 'Missing dependency: education_plans. Run 20260204_education_plans.sql first.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS education_apprenticeship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES education_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  session_number SMALLINT NOT NULL CHECK (session_number IN (1, 2)),
  week_start DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),

  focus_node TEXT,
  intervention_name TEXT,
  intent_note TEXT,
  mood TEXT CHECK (mood IN ('low', 'mid', 'high')),
  reflection_note TEXT,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_apprenticeship_session UNIQUE (plan_id, week_start, session_number)
);

CREATE INDEX IF NOT EXISTS idx_apprenticeship_sessions_user_week
  ON education_apprenticeship_sessions(user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_apprenticeship_sessions_plan_status
  ON education_apprenticeship_sessions(plan_id, status);

CREATE OR REPLACE FUNCTION set_education_apprenticeship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS education_apprenticeship_sessions_updated_at ON education_apprenticeship_sessions;
CREATE TRIGGER education_apprenticeship_sessions_updated_at
  BEFORE UPDATE ON education_apprenticeship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_education_apprenticeship_updated_at();

ALTER TABLE education_apprenticeship_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own apprenticeship sessions" ON education_apprenticeship_sessions;
CREATE POLICY "Users can manage own apprenticeship sessions"
  ON education_apprenticeship_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON education_apprenticeship_sessions TO authenticated;

COMMENT ON TABLE education_apprenticeship_sessions IS 'Weekly 2-session apprenticeship labs linked to education plans';
