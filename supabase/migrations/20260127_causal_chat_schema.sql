-- Phase 32: Causal Chatbot Persistence
-- Creates tables for storing chat sessions and messages with causal provenance.

-- 1. Causal Chat Sessions
CREATE TABLE IF NOT EXISTS causal_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Causal Chat Messages
CREATE TABLE IF NOT EXISTS causal_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES causal_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Causal Provenance
  domain_classified TEXT,
  scm_tier1_used TEXT[], -- e.g., ['conservation_of_energy', 'entropy']
  scm_tier2_used TEXT[], -- e.g., ['mycorrhizal_network']
  confidence_score FLOAT, -- 0-1
  causal_graph JSONB, -- { nodes: [], edges: [] }
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE causal_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE causal_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own chat sessions"
  ON causal_chat_sessions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their sessions"
  ON causal_chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = causal_chat_messages.session_id
      AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON causal_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON causal_chat_sessions(user_id);
