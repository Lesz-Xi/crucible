-- Phase G: Scientific UI Polish - Domain Grouping
-- Adds domain_classified to causal_chat_sessions to enable sidebar grouping by research domain.

ALTER TABLE IF EXISTS causal_chat_sessions
  ADD COLUMN IF NOT EXISTS domain_classified TEXT;

CREATE INDEX IF NOT EXISTS idx_causal_chat_sessions_domain
  ON causal_chat_sessions(domain_classified);
