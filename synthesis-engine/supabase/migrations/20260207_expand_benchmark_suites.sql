-- Expand benchmark suite check constraint to include new Hybrid SCM benchmark suites.

DO $$
DECLARE
  suite_constraint_name text;
BEGIN
  SELECT c.conname
  INTO suite_constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'benchmark_runs'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%suite_name%';

  IF suite_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.benchmark_runs DROP CONSTRAINT %I', suite_constraint_name);
  END IF;
END $$;

ALTER TABLE public.benchmark_runs
ADD CONSTRAINT benchmark_runs_suite_name_check
CHECK (
  suite_name IN (
    'duplicate_detection',
    'spectral_drift',
    'protocol_validity',
    'adversarial_injection',
    'novelty_velocity',
    'hybrid_scm_kernel',
    'full_suite'
  )
);
