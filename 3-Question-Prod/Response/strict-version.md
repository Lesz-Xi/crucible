Proceed with Phase 3 / Week 1 (Foundations) per approved Phase 2.1 patch spec.

Constraints
No architecture changes beyond approved contracts.
Deterministic boundary is mandatory.
Heavy compute must use job + SSE flow.
Provenance and degradation contracts must remain exact.
Deliverables (Week 1)
DB + RLS
Create tables:
causal_graphs
causal_jobs
causal_job_events
Add constraints/indexes/foreign keys.
Implement baseline RLS:
authorized read only
graph writes restricted to causal_editor
job/event updates restricted to service role
SSE Job Skeleton
Implement:
POST /causal/estimate/jobs
GET /causal/jobs/:jobId/stream
Implement stage event enum pipeline:
queued, resolving_graph, validating_query, identification, checking_overlap, estimating_effect, bootstrapping, running_sensitivity, assembling_evidence_card, done, failed
Ensure stream reconnect safety (resume from last event id if supported).
Identify Endpoint Hardening
Harden POST /causal/identify:
enforce deterministic validation/coercion after parse
return strict statuses: identifiable | partially_identifiable | not_identifiable
include required adjustment set or blocker reasons
Implement exact not_identifiable degradation payload:
canEstimateNumericEffect=false
blockers[]
minimumAdditionalRequirements[]
safeFallback object
Required Output Format
Return exactly these sections:

DAY-BY-DAY PLAN (D1–D5)
FILES TO CHANGE (path + purpose)
MIGRATIONS SQL (full SQL, ready to run)
RLS POLICIES (full policy statements)
API CONTRACT TEST CASES
E2E ACCEPTANCE CHECKLIST
RISKS + MITIGATIONS
OPEN QUESTIONS (only blockers; otherwise “None”)
Acceptance Gates (must pass)
Migration applies cleanly on empty DB and existing env.
RLS blocks unauthorized writes.
Job creation returns jobId and initial status.
SSE stream emits ordered stages and terminal event (done|failed).
/causal/identify never returns numeric causal claims on not_identifiable.
Contract tests validate exact degradation JSON shape.
If any gate cannot be met this week, stop and return a blocker report with minimal patch options.

Chief, this version is pure operator mode: no fluff, just execution pressure.