# VCC v2 Consumer Migration Notes (2026-03-08)

## Audience
Consumers of `synthesis-engine` trust and bridge APIs.

## Effective Date
2026-03-08

## What Changed
1. `/api/bridge/simulate-verified` is retired.
2. `/api/bridge/chat-verified` is telemetry ingestion only.
3. Canonical trust-state now remains report-native:
- `report.meta.causalDepth`
- `report.meta.allowVerified`
- `report.meta.verificationFailures`

## Required Consumer Updates
1. Stop reading trust-state from bridge responses.
2. Read trust-state from report payloads returned by `/api/reports/analyze` and `/api/reports/{reportId}`.
3. If legacy code referenced `simulate-verified`, remove integration and route to report workflows.

## Backward Compatibility
- No breaking structural change is introduced to report trust fields.
- Compatibility expectation remains additive fields only for report payload evolution.

## Operational Checklist
- [ ] Confirm migration `synthesis-engine/supabase/migrations/20260305_bridge_verification_log.sql` is applied.
- [ ] Confirm `/api/bridge/chat-verified` writes rows to `bridge_verification_log`.
- [ ] Confirm report trust fields are present in production payloads.
- [ ] Run weekly downgrade trend query and review top failure reasons.

### Telemetry flow check
```sql
select count(*) as rows_last_24h
from public.bridge_verification_log
where created_at >= now() - interval '24 hours';
```

### Warning/failure trend query
```sql
select failure_reason, count(*) as total
from (
  select unnest(verification_failures) as failure_reason
  from public.scm_reports
  where generated_at >= now() - interval '7 days'
) t
group by failure_reason
order by total desc;
```
