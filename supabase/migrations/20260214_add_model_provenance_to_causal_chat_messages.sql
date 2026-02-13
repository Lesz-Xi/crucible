-- Persist model provenance for Chat history evidence rail hydration
ALTER TABLE IF EXISTS public.causal_chat_messages
  ADD COLUMN IF NOT EXISTS model_key TEXT,
  ADD COLUMN IF NOT EXISTS model_version TEXT;

CREATE INDEX IF NOT EXISTS idx_causal_chat_messages_model_key_created_at
  ON public.causal_chat_messages(model_key, created_at DESC);
