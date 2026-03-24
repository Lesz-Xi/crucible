# Roadmap: VoltAgent × Crucible MCP Integration

## Phase 1: Inception (Agent-03 Gemini) [CURRENT]
- [x] Analyze risks of tight DB coupling (`StorageAdapter`).
- [x] Pivot architecture to Model Context Protocol (MCP).
- [x] Author updated `mission.md` establishing the MCP boundary.
- [x] Hand over to Agent-02 (Claude) for MCP Specification.

## Phase 2: Specification (Agent-02 Claude) [COMPLETE]
- [x] **THINK-012: Crucible MCP Server Spec.** SSE transport via Next.js `/api/mcp` route. Supabase JWT pass-through via `Authorization: Bearer` header. User-scoped Supabase client enforces RLS per caller. `@modelcontextprotocol/sdk` dependency identified.
- [x] **THINK-013: Causal Read Tools.** `query_causal_axioms` (keyword + domain + confidence filter, max 20 results, never exposes session_id). `get_active_scm` (domain or model_key lookup via SCMRegistryService, always publicOnly:true, optional equations).
- [x] **THINK-014: Causal Write Tools.** `propose_causal_axiom` — confidence hardcoded to 0.1, source hardcoded to 'agent_proposed', review_status hardcoded to 'pending_review'. Returns axiom_id for VoltAgent episodic memory reference. Requires DB migration for new causal_axioms columns.
- [x] Output `spec-mcp.md` and `tasks.md` (ACT-DB-004, ACT-013 through ACT-016) for GPT.

## Phase 3: Implementation (Agent-01 GPT) [PENDING]
- [ ] **ACT-013: Setup MCP Server.** Scaffold an MCP server in the Crucible repo (e.g., using `@modelcontextprotocol/sdk`).
- [ ] **ACT-014: Implement Read Tools.** Wire `query_causal_axioms` to the `causal_axioms` table via standard Supabase client.
- [ ] **ACT-015: Implement Write Tools.** Wire `propose_causal_axiom` to insert unverified axioms.
- [ ] **ACT-016: VoltAgent Configuration.** Configure VoltAgent to connect to the new Crucible MCP Server.

## Phase 4: Verification (Agent-03 Gemini) [COMPLETE]
- [x] Audit MCP tool schemas against Demis v3 standard.
- [x] Programmatically verified Trace Integrity (M6.2) holds: proposals hardcoded to `confidence_score = 0.1` and `review_status = 'pending_review'`.
- [x] Confirmed web-standard transport migration is structurally correct for App Router.

## Phase 5: VoltAgent Client Specification (Agent-02 Claude) [COMPLETE]
- [x] **THINK-015: VoltAgent MCP Client config.** `createCrucibleMcpConfig(getJwt)` factory. Transport: `'http'` (web-standard, matching Crucible's App Router implementation). URL from `CRUCIBLE_MCP_URL` env var. Validated at init time.
- [x] **THINK-016: Auth Passthrough.** Two strategies specced: Next.js server context (`getSupabaseJwtFromSession` via `createServerSupabaseClient`) and standalone Node process (`getServiceJwt` with cached token + 60s refresh buffer). Auth invariant: anon key + JWT only, never service role key. `headers` async function called per-request.
- [x] **THINK-017: Agent System Prompts.** Full `CRUCIBLE_SYSTEM_INSTRUCTIONS` string specced — verbatim, ready to assign to agent `instructions` field. Tool trigger rules, decision tree, worked end-to-end example (cortisol/memory session), and `propose_causal_axiom` justification requirements. Tasks ACT-017 through ACT-020 (T-CLIENT-001 to T-CLIENT-005) appended to `tasks.md`.

## Phase 6: VoltAgent Client Implementation (Agent-01 GPT) [IN PROGRESS]
- [x] **ACT-017:** Install `@modelcontextprotocol/sdk` in a new standalone `voltagent-agent` package.
- [x] **ACT-018-A/B/C:** Implement `crucible-client.ts`, `get-jwt.ts`, and `scientific-researcher.ts`.
- [ ] **ACT-019:** Wire `CRUCIBLE_MCP_URL` and agent env vars in the real host deployment.
- [ ] **ACT-020:** Run T-CLIENT-001 through T-CLIENT-005 smoke tests against live Crucible deployment.
