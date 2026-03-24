-- Migration: Fix epistemic_qualia upsert constraint
-- Adds composite UNIQUE constraint for (scm_id, functional_hash)
-- Resolves error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Drop existing UNIQUE constraint on functional_hash alone
ALTER TABLE epistemic_qualia DROP CONSTRAINT IF EXISTS epistemic_qualia_functional_hash_key;

-- Add composite UNIQUE constraint on (scm_id, functional_hash)
-- This matches the onConflict specification in phenomenal-bridge.ts:259
ALTER TABLE epistemic_qualia 
ADD CONSTRAINT epistemic_qualia_scm_func_key UNIQUE (scm_id, functional_hash);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✓ Migration complete: epistemic_qualia composite UNIQUE constraint added';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify constraint: SELECT conname, contype FROM pg_constraint WHERE conrelid = ''epistemic_qualia''::regclass;';
  RAISE NOTICE '2. Test upsert: Should no longer error with code 42P10';
END $$;
