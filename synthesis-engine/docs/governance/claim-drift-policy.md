# Claim Drift Sentinel Policy

## Purpose
The claim-drift sentinel prevents architecture overclaim by continuously checking declared claims against code evidence.

## Severity model
- `critical`: core scientific integrity/governance claims (blocking in enforce mode)
- `high`: security/data governance claims (warning in v1)
- `medium`: architecture consistency claims (warning in v1)
- `low`: documentation or naming claims (warning in v1)

## Drift semantics
- `ok`: all required evidence matched and no contradictions matched.
- `partial`: at least one required evidence matched and at least one required evidence missing.
- `missing`: zero required evidence matched.
- `contradicted`: any contradiction matcher matched.

## Evidence model (Hybrid AST + Tag)
Primary evidence comes from AST/static checks (`ast_*` matchers). Marker tags are fallback only.

Supported matcher types:
- `ast_export`: exported symbol/interface/class/function exists.
- `ast_function_call`: function call exists in AST call expressions.
- `ast_route_handler`: exported HTTP verb handler exists.
- `ast_workflow_step`: workflow YAML includes named step.
- `regex`: pattern exists in file text.
- `marker_tag`: explicit marker comment in file.

Marker tag format:
- `@claim-evidence:CLM-001`

Override marker format (documentation fallback):
- `@claim-override:CLM-001;<ticket>;<expires=YYYY-MM-DD>;<reason>`

## Contradiction model
Contradiction is explicit and matcher-driven. A claim is `contradicted` when any configured contradiction matcher matches.

Example contradiction spec:
```json
{
  "matcher_type": "regex",
  "matcher": "/if:\\s*false\\s*$/m",
  "reason": "Governance gate was hard-disabled"
}
```

## Override governance
- Only CODEOWNERS-approved overrides are valid policy.
- Override file: `docs/governance/claim-overrides.json`
- Required fields: `claim_id`, `ticket`, `reason`, `approved_by`, `expires_at`
- Maximum TTL: 14 days (policy target)
- Expired overrides are ignored.

Example override record:
```json
{
  "claim_id": "CLM-101",
  "ticket": "GOV-201",
  "reason": "False positive due to temporary parser mismatch.",
  "approved_by": "@Lesz-Xi",
  "expires_at": "2026-03-01T00:00:00Z"
}
```

## Workflow interaction matrix
- Drift fail + M6 pass: governance failure; merge blocked.
- Drift pass + M6 fail: runtime integrity failure; merge blocked.
- Both fail: blocked independently.
- Both pass: healthy.

No workflow is dependent on the other.

## Rollout policy (3-week ramp)
- Week 1: report-only for PR/main/nightly.
- Week 2: critical-block on PR; report-only on main/nightly.
- Week 3+: critical-block on PR and main; nightly enforce + artifact upload.

## Performance budget
- Scanner must complete in under 30 seconds for 100 claims on CI baseline.
