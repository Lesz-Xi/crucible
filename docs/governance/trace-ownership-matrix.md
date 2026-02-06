# Trace Integrity Ownership Matrix

| Domain | Owner | Scope | Escalation |
|---|---|---|---|
| Trace policy and schema | @Lesz-Xi | `trace-integrity-policy.json`, `trace-integrity.schema.json` | Open governance issue and tag owner |
| Trace fixtures | @Lesz-Xi | `trace-fixtures.v1.json` and fixture generator | Open governance issue and tag owner |
| Trace overrides | @Lesz-Xi | `trace-overrides.json` approval and expiry management | Open governance issue and tag owner |
| CI enforcement | @Lesz-Xi | `trace-integrity-sentinel.yml` rollout stage management | Open governance issue and tag owner |

Notes:
- Critical override approvals are CODEOWNERS-gated.
- Maximum override TTL target is 14 days.
- Fixture set must be reviewed monthly or on schema/policy change.
