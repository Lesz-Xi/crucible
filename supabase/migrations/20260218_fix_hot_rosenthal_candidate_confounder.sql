-- M6 promotion-governance hotfix:
-- Ensure hot_rosenthal_v1 candidate version keeps the C_creature confounder
-- aligned with the current baseline version to prevent false high-severity
-- confounder disagreement atoms during promotion preflight.

UPDATE scm_model_versions AS versions
SET confounders_json = CASE
  WHEN versions.confounders_json IS NULL
    OR jsonb_typeof(versions.confounders_json) <> 'array'
    THEN '["C_creature"]'::jsonb
  WHEN NOT (versions.confounders_json @> '["C_creature"]'::jsonb)
    THEN versions.confounders_json || '["C_creature"]'::jsonb
  ELSE versions.confounders_json
END
FROM scm_models AS models
WHERE models.id = versions.model_id
  AND models.model_key = 'hot_rosenthal_v1'
  AND versions.version = 'v1.0.0';
