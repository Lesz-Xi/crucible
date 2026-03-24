-- Migration: Add Axiom Compression Trigger and Session Status
-- 
-- CRITICAL GAP: This migration requires manual execution in Supabase SQL Editor
-- USER ACTION REQUIRED: Run this SQL in your Supabase dashboard

-- 1. Add status column to causal_chat_sessions for tracking compression state
ALTER TABLE causal_chat_sessions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'completed', 'compressed'));

-- Add updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_causal_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_causal_chat_sessions_updated_at ON causal_chat_sessions;
CREATE TRIGGER update_causal_chat_sessions_updated_at
  BEFORE UPDATE ON causal_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_causal_chat_sessions_updated_at();

-- 2. Add causal_density column to messages for storing evaluation results
ALTER TABLE causal_chat_messages 
ADD COLUMN IF NOT EXISTS causal_density JSONB DEFAULT NULL;

COMMENT ON COLUMN causal_chat_messages.causal_density IS 
'Stores the CausalDensityResult: {score, label, confidence, detectedMechanisms}';

-- 3. Create function to queue axiom compression when session completes
CREATE OR REPLACE FUNCTION trigger_axiom_compression()
RETURNS TRIGGER AS $$
BEGIN
  -- When a session is marked as completed, queue it for compression
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Use pg_notify to trigger external compression service
    PERFORM pg_notify('axiom_compression_queue', 
      json_build_object(
        'session_id', NEW.id,
        'timestamp', NOW()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS queue_axiom_compression ON causal_chat_sessions;
CREATE TRIGGER queue_axiom_compression
  AFTER UPDATE ON causal_chat_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION trigger_axiom_compression();

-- 4. Create index for faster axiom lookups
CREATE INDEX IF NOT EXISTS idx_causal_axioms_session_id 
ON causal_axioms(session_id);

CREATE INDEX IF NOT EXISTS idx_causal_axioms_confidence 
ON causal_axioms(confidence_score DESC);

-- 5. Create view for session statistics
CREATE OR REPLACE VIEW causal_session_stats AS
SELECT 
  s.id as session_id,
  s.title,
  s.status,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
  COUNT(CASE WHEN m.causal_density->>'score' = '3' THEN 1 END) as l3_messages,
  COUNT(CASE WHEN m.causal_density->>'score' = '2' THEN 1 END) as l2_messages,
  COUNT(CASE WHEN m.causal_density->>'score' = '1' THEN 1 END) as l1_messages,
  AVG(CASE WHEN m.causal_density IS NOT NULL 
    THEN (m.causal_density->>'confidence')::float 
    END) as avg_confidence,
  COUNT(a.id) as extracted_axioms,
  s.created_at,
  s.updated_at
FROM causal_chat_sessions s
LEFT JOIN causal_chat_messages m ON m.session_id = s.id
LEFT JOIN causal_axioms a ON a.session_id = s.id
GROUP BY s.id, s.title, s.status, s.created_at, s.updated_at;

COMMENT ON VIEW causal_session_stats IS 
'Provides aggregated statistics for each chat session including causal density metrics';

-- 6. Add RLS policy for axioms (allow users to view axioms from their sessions)
CREATE POLICY "Users can view axioms from their sessions"
  ON causal_axioms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM causal_chat_sessions
      WHERE id = causal_axioms.session_id
      AND user_id = auth.uid()
    )
  );
