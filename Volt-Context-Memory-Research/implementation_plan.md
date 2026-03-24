# Volt MCP Implementation Plan

## Mission

Implement the Crucible-side Phase 1 MCP surface for causal reads and low-confidence agent proposals without exposing raw chat history or bypassing existing SCM registry logic.

## Architecture Choice

- Add proposal provenance columns to `causal_axioms`.
- Add a small MCP module under `crucible/src/lib/mcp`.
- Reuse `SCMRegistryService` for public SCM lookup.
- Use JWT-scoped Supabase clients at the route boundary.
- Use the SDK's web-standard MCP transport in `/api/mcp`.

## Files Changed

- `crucible/package.json`
- `crucible/package-lock.json`
- `crucible/supabase/migrations/20260315_add_mcp_proposal_columns_to_causal_axioms.sql`
- `crucible/src/lib/mcp/auth.ts`
- `crucible/src/lib/mcp/errors.ts`
- `crucible/src/lib/mcp/types.ts`
- `crucible/src/lib/mcp/server.ts`
- `crucible/src/lib/mcp/tools/query-causal-axioms.ts`
- `crucible/src/lib/mcp/tools/get-active-scm.ts`
- `crucible/src/lib/mcp/tools/propose-causal-axiom.ts`
- `crucible/src/app/api/mcp/route.ts`
- `crucible/src/lib/mcp/__tests__/mcp-tools.test.ts`

## Acceptance Criteria Mapping

- ACT-DB-004: implemented via additive `causal_axioms` migration.
- ACT-013-A through ACT-013-D: implemented via dependency install plus auth/error/server scaffolding.
- ACT-013-E: implemented as `/api/mcp` route with JWT validation and MCP transport.
- ACT-014-A: implemented in `query-causal-axioms.ts`.
- ACT-014-B: implemented in `get-active-scm.ts` using `SCMRegistryService`.
- ACT-015-A: implemented in `propose-causal-axiom.ts`.

## Deliberate Correction

The Claude handoff specified deprecated Node-only SSE transport inside Next.js App Router. The implemented route uses the SDK's web-standard MCP transport instead because it is the working transport shape for App Router `Request`/`Response`.

## Verification Plan

- `TMPDIR=/tmp npx vitest run src/lib/mcp/__tests__/mcp-tools.test.ts`
- `npx tsc --noEmit --pretty false`

## Known Gaps

- Full-repo `tsc` is currently blocked by an unrelated existing duplicate file: `crucible/src/lib/db/persistence-service 2.ts`.
- ACT-016 VoltAgent wiring is out of repo scope and remains manual.
- Runtime JWT + MCP client verification still needs a live environment.
