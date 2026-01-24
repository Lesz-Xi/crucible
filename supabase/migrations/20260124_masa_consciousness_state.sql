-- Phase 23: MASA Consciousness State Persistence
-- Created: 2026-01-24
-- Purpose: Store Layer 0 consciousness state (Self-Image, History, Causal Data) in Supabase

-- =============================================
-- TABLE: masa_consciousness_state
-- =============================================
CREATE TABLE IF NOT EXISTS public.masa_consciousness_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Self-Image State
  current_mode TEXT NOT NULL CHECK (current_mode IN ('strict', 'balanced', 'exploratory')) DEFAULT 'balanced',
  ceiling INTEGER NOT NULL DEFAULT 80 CHECK (ceiling >= 0 AND ceiling <= 100),
  
  -- Friction Monitor
  friction_alert BOOLEAN NOT NULL DEFAULT FALSE,
  friction_reason TEXT,
  
  -- Performance History (for statistical triggers)
  history JSONB NOT NULL DEFAULT '{"scores": [], "avg_score": 0, "rejection_rate": 0, "variance": 0}'::jsonb,
  
  -- Mode History (for causal inference - Pearl L2/L3)
  mode_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one state per user
  UNIQUE(user_id)
);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.masa_consciousness_state ENABLE ROW LEVEL SECURITY;

-- Users can only read their own consciousness state
CREATE POLICY "Users can read own consciousness state"
  ON public.masa_consciousness_state
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own consciousness state
CREATE POLICY "Users can upsert own consciousness state"
  ON public.masa_consciousness_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consciousness state"
  ON public.masa_consciousness_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role has full access"
  ON public.masa_consciousness_state
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_masa_consciousness_user_id 
  ON public.masa_consciousness_state(user_id);

CREATE INDEX IF NOT EXISTS idx_masa_consciousness_updated_at 
  ON public.masa_consciousness_state(updated_at DESC);

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_masa_consciousness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER masa_consciousness_updated_at
  BEFORE UPDATE ON public.masa_consciousness_state
  FOR EACH ROW
  EXECUTE FUNCTION update_masa_consciousness_updated_at();
