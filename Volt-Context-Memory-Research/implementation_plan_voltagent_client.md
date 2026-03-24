# VoltAgent Client Implementation Plan

## Mission

Implement the VoltAgent-side Crucible client as a standalone package that can:

- authenticate to Crucible MCP with a fresh Supabase JWT
- expose `query_causal_axioms`, `get_active_scm`, and `propose_causal_axiom` as VoltAgent tools
- instantiate a scientific researcher agent with the Crucible system instructions

## Architecture Choice

The workspace does not contain the `voltagent-agent/` package assumed by Gemini's spec, so the client was implemented as a new standalone package:

- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent`

## Important Spec Drift

Claude's pseudocode assumed `new Agent({ mcp: ... })` with async per-request header injection. The installed VoltAgent version (`@voltagent/core@2.6.8`) does not expose that runtime shape. It uses:

- `MCPConfiguration`
- `tools: await mcpConfig.getTools()`

and its HTTP config only supports static `requestInit.headers`.

To preserve the auth invariant instead of shipping a stale JWT path, the implementation uses the official MCP SDK directly inside local VoltAgent tool wrappers. Each tool call creates a fresh MCP client connection with a freshly resolved bearer token.

## Files Added

- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/package.json`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/tsconfig.json`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/vitest.config.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/.env.example`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/.gitignore`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/index.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/types.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/crucible-client.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/get-jwt.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/agents/scientific-researcher.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/tests/crucible-client.test.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/tests/get-jwt.test.ts`
- `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/tests/scientific-researcher.test.ts`

## Acceptance Mapping

- ACT-017: completed via package dependency installation
- ACT-018-A: completed via `createCrucibleMcpConfig()` and `CrucibleMcpClient`
- ACT-018-B: completed via `getSupabaseJwtFromSession()` and `getServiceJwt()`
- ACT-018-C: completed via `createScientificResearcherAgent()` and `CRUCIBLE_SYSTEM_INSTRUCTIONS`
- ACT-019: partially prepared via `.env.example`; not verified in a live deployment
- ACT-020: not completed; requires a deployed Crucible MCP URL and real JWT
