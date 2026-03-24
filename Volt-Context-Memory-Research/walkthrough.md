# Volt MCP Walkthrough

## What Was Built

Crucible now has a small MCP boundary that exposes:

- `query_causal_axioms`
- `get_active_scm`
- `propose_causal_axiom`

The route lives at `crucible/src/app/api/mcp/route.ts` and authenticates every request with a Supabase JWT from the `Authorization` header.

## How It Works

1. The route extracts the bearer token and validates it with a user-scoped Supabase client.
2. The route creates or resumes an MCP session.
3. Tool handlers execute using that same user-scoped Supabase client, so RLS remains in force.
4. `query_causal_axioms` returns only tool-safe axiom fields.
5. `get_active_scm` goes through `SCMRegistryService` and only uses public model access.
6. `propose_causal_axiom` writes quarantined, low-confidence proposals into `causal_axioms`.

## Trust Boundary

- No raw `causal_chat_messages` reads are exposed over MCP.
- Agent proposals are forced to:
  - `confidence_score = 0.1`
  - `source = 'agent_proposed'`
  - `review_status = 'pending_review'`

## Evidence

- Focused Vitest coverage passes for auth parsing, proposal hardcoding, safe axiom query shaping, and public SCM retrieval behavior.
- Full `tsc` is not yet globally green because of an unrelated pre-existing duplicate file outside this task's scope.

## Manual Verification

1. Apply the new `causal_axioms` migration.
2. Start Crucible locally.
3. `GET /api/mcp` without `Authorization` should return `401`.
4. `GET /api/mcp` with a valid JWT should return the MCP manifest JSON.
5. Use an MCP client against `/api/mcp` and verify the three tools register.

## Remaining Work

- Hook the endpoint into VoltAgent (`CRUCIBLE_MCP_URL`).
- Run live tool calls with a real JWT in preview/prod.
