-- Legacy chat adoption support (token-based ownership recovery)
-- Timeline anchor: 2026-02-12

ALTER TABLE IF EXISTS causal_chat_sessions
  ADD COLUMN IF NOT EXISTS legacy_client_token TEXT;

CREATE INDEX IF NOT EXISTS idx_causal_chat_sessions_legacy_client_token
  ON causal_chat_sessions(legacy_client_token)
  WHERE legacy_client_token IS NOT NULL;
