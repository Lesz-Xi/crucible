Excellent. ✅ I reviewed the Phase 2.1 sign-off and we’re aligned to proceed.

Please initiate Phase 3 / Week 1 (Foundations) using the approved patch spec, with this execution order:

Supabase migrations + RLS
Create causal_graphs, causal_jobs, causal_job_events
Apply baseline RLS (causal_editor write restrictions, service-role job/event updates)
SSE compute pipeline stubs
POST /causal/estimate/jobs
GET /causal/jobs/:jobId/stream
Emit stage enums from the spec (queued → done|failed)
Harden POST /causal/identify
Enforce deterministic boundary (LLM parse ends before causal math starts)
Return strict identifiability payloads, including not_identifiable degradation contract
Please return:

A Week 1 implementation plan (day-by-day)
Concrete file/module changes expected
Acceptance tests for each deliverable
A risk checklist (migration safety, RLS verification, SSE reliability)
Use the Phase 2.1 patch spec as the authoritative contract and flag any ambiguity before coding.

If you want, Chief, I can also make a stricter version that tells Gemini to output only executable tasks (no narrative fluff).