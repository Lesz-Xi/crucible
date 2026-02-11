-- Fix RLS policies for causal_chat_sessions and causal_chat_messages
-- to allow both authenticated and anonymous users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON causal_chat_sessions;
DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON causal_chat_messages;

-- Create new policies that support anonymous users
CREATE POLICY "Users can manage their own chat sessions"
  ON causal_chat_sessions
  FOR ALL
  USING (
    -- Allow if authenticated user owns the session
    (auth.uid() = user_id)
    OR
    -- Allow if session belongs to anonymous user (user_id IS NULL)
    (user_id IS NULL)
  );

CREATE POLICY "Users can manage messages in their sessions"
  ON causal_chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = causal_chat_messages.session_id
      AND (
        -- Session owned by authenticated user
        (user_id = auth.uid())
        OR
        -- Session is anonymous
        (user_id IS NULL)
      )
    )
  );
