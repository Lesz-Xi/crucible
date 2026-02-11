-- Phase M6: Scientific integrity signoff records
-- Stores governance checklist signoff decisions and status snapshots.

CREATE TABLE IF NOT EXISTS scm_integrity_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  rationale TEXT NOT NULL,
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  status_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scm_integrity_signoffs_user_created
  ON scm_integrity_signoffs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scm_integrity_signoffs_snapshot_gin
  ON scm_integrity_signoffs USING GIN (status_snapshot);

ALTER TABLE scm_integrity_signoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scm_integrity_signoffs_select_own" ON scm_integrity_signoffs;
CREATE POLICY "scm_integrity_signoffs_select_own"
  ON scm_integrity_signoffs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scm_integrity_signoffs_insert_own" ON scm_integrity_signoffs;
CREATE POLICY "scm_integrity_signoffs_insert_own"
  ON scm_integrity_signoffs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scm_integrity_signoffs_update_own" ON scm_integrity_signoffs;
CREATE POLICY "scm_integrity_signoffs_update_own"
  ON scm_integrity_signoffs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scm_integrity_signoffs_delete_own" ON scm_integrity_signoffs;
CREATE POLICY "scm_integrity_signoffs_delete_own"
  ON scm_integrity_signoffs
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE scm_integrity_signoffs IS
  'Scientific integrity dashboard signoff decisions with status snapshots.';
