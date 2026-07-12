-- Widen claims.source_feature to accept 'companion' (CSL reasoning companion surface).
-- Additive, non-destructive: widens an existing CHECK constraint only. No data migration needed —
-- existing chat/hybrid/legal rows are unaffected. See docs/CSL-Reasoning-Companion-Architecture.md §5.

ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_source_feature_check;

ALTER TABLE claims ADD CONSTRAINT claims_source_feature_check
  CHECK (source_feature IN ('chat', 'hybrid', 'legal', 'companion'));
