-- Add contradictions column to synthesis_runs for persisting 'Tension Detected' panels
ALTER TABLE synthesis_runs 
ADD COLUMN IF NOT EXISTS contradictions jsonb;
