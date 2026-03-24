-- Fix RLS policies for causal_chat_sessions and causal_chat_messages
-- to allow SELECT operations for anonymous users (user_id IS NULL)

-- Drop existing policies
DROP POLICY IF EXISTS "read_own_sessions" ON causal_chat_sessions;
DROP POLICY IF EXISTS "read_own_messages" ON causal_chat_messages;

-- Create new policies that support both authenticated AND anonymous users
-- Sessions: Allow reading sessions where user_id matches OR user_id is NULL
CREATE POLICY "read_sessions_authenticated_or_anonymous" ON causal_chat_sessions
  FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Messages: Allow reading messages from sessions where user_id matches OR user_id is NULL
CREATE POLICY "read_messages_authenticated_or_anonymous" ON causal_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = session_id
      AND (auth.uid() = user_id OR user_id IS NULL)
    )
  );
