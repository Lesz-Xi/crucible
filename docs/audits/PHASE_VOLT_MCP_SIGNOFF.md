# Phase Volt MCP Signoff

## Scope

Phase 1 Crucible MCP server implementation for:

- causal axiom query
- active SCM retrieval
- low-confidence causal axiom proposal

## Files Changed

- `package.json`
- `package-lock.json`
- `supabase/migrations/20260315_add_mcp_proposal_columns_to_causal_axioms.sql`
- `src/lib/mcp/auth.ts`
- `src/lib/mcp/errors.ts`
- `src/lib/mcp/types.ts`
- `src/lib/mcp/server.ts`
- `src/lib/mcp/tools/query-causal-axioms.ts`
- `src/lib/mcp/tools/get-active-scm.ts`
- `src/lib/mcp/tools/propose-causal-axiom.ts`
- `src/app/api/mcp/route.ts`
- `src/lib/mcp/__tests__/mcp-tools.test.ts`

## Acceptance Criteria

- Additive proposal metadata migration: implemented
- MCP SDK installed: implemented
- JWT-scoped auth helper: implemented
- `query_causal_axioms`: implemented
- `get_active_scm` via `SCMRegistryService`: implemented
- `propose_causal_axiom` low-confidence quarantine: implemented

## Automated Evidence

- `TMPDIR=/tmp npx vitest run src/lib/mcp/__tests__/mcp-tools.test.ts`
  - passed: 1 file, 5 tests

## TypeScript Status

- `npx tsc --noEmit --pretty false`
  - blocked by unrelated pre-existing file: `src/lib/db/persistence-service 2.ts`
  - no additional MCP-local TypeScript errors surfaced after fixing the proposal tool constants

## Manual Verification Steps

1. Apply `20260315_add_mcp_proposal_columns_to_causal_axioms.sql`.
2. Start Crucible.
3. Verify `GET /api/mcp` without JWT returns `401`.
4. Verify `GET /api/mcp` with valid JWT returns the manifest JSON.
5. Use an MCP client to initialize against `/api/mcp`.
6. Confirm the tool registry includes:
   - `query_causal_axioms`
   - `get_active_scm`
   - `propose_causal_axiom`

## Unresolved Gaps

- HUMAN FOLLOW-UP REQUIRED: apply the Supabase migration in the target environment.
- HUMAN FOLLOW-UP REQUIRED: wire VoltAgent to `CRUCIBLE_MCP_URL`.
- HUMAN FOLLOW-UP REQUIRED: perform live JWT-authenticated MCP verification in preview or production.
- The route uses the SDK's web-standard MCP transport instead of the deprecated Node-only SSE transport from the handoff because that is the compatible App Router implementation path.
