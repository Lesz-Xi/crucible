# VoltAgent Client Walkthrough

## What Was Built

The VoltAgent client package now wraps Crucible MCP as three native VoltAgent tools:

- `query_causal_axioms`
- `get_active_scm`
- `propose_causal_axiom`

The wrapper lives in:

- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/crucible-client.ts`

## Why The Client Wrapper Exists

The current VoltAgent API does not support async per-request auth headers through `MCPConfiguration`, but Crucible requires a fresh bearer token for every call. The wrapper solves that by:

1. validating `CRUCIBLE_MCP_URL` at initialization
2. calling `getJwt()` on every tool execution
3. creating a fresh Streamable HTTP MCP client per tool execution
4. disconnecting cleanly after the call

This keeps the auth boundary honest and avoids stale token reuse.

## JWT Retrieval

JWT helpers live in:

- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/get-jwt.ts`

Available paths:

- `getSupabaseJwtFromSession(createServerSupabaseClient)`
- `getServiceJwt({...})`

`getServiceJwt()` caches tokens and refreshes when less than 60 seconds remain.

## Agent Factory

The scientific researcher agent factory lives in:

- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/agents/scientific-researcher.ts`

It:

- injects the full Crucible instructions block
- attaches the three Crucible tools
- optionally provisions VoltAgent `Memory` backed by `SupabaseMemoryAdapter`

## Automated Verification

Run from:

- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent`

Commands:

```bash
npm run build
npm test
```

## Manual Verification Still Required

1. Set `CRUCIBLE_MCP_URL` to a live Crucible deployment.
2. Supply a real JWT path:
   - request-scoped Next.js session, or
   - standalone agent credentials.
3. Verify live tool discovery against Crucible.
4. Verify 401 behavior for expired JWT.
5. Verify proposal invisibility end-to-end against the live server.
