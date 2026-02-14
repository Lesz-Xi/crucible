-- Allow scientific provenance entries in claim_evidence_links.evidence_type
-- Required for Phase E/F claim ledger integration.

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname
    INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'claim_evidence_links'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%evidence_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.claim_evidence_links DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.claim_evidence_links
ADD CONSTRAINT claim_evidence_links_evidence_type_check
CHECK (
  evidence_type IN (
    'source',
    'tool_output',
    'citation',
    'memory',
    'counterfactual_trace',
    'scientific_provenance'
  )
);
