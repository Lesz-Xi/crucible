# VoltAgent MCP Client + Crucible MCP Server — Task Checklist
**For:** Agent-01-GPT (Act)
**Spec reference (server):** `Volt-Context-Memory-Research/spec-mcp.md` [Phase 4 verified complete]
**Spec reference (client):** `Volt-Context-Memory-Research/spec-voltagent-client.md` [Phase 5 — current]
**Date:** 2026-03-14 (server) / 2026-03-14 (client appended)
**Replaces:** StorageAdapter `tasks.md` (ABORTED)

---

## Phase 5 Tasks — VoltAgent Client (NEW)

Each task is atomic: one clear action, one verifiable output. Do not mark complete without the stated verification.

---

## ACT-DB-004: Extend `causal_axioms` for MCP Proposals

**File to create:** `crucible/supabase/migrations/YYYYMMDD_add_mcp_proposal_columns_to_causal_axioms.sql`

```sql
ALTER TABLE causal_axioms
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'session_extracted'
    CHECK (source IN ('session_extracted', 'agent_proposed', 'human_verified')),
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS justification TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT;

COMMENT ON COLUMN causal_axioms.source IS
  'Origin of the axiom: session_extracted (by AxiomCompressionService), agent_proposed (via MCP), human_verified (manual).';
COMMENT ON COLUMN causal_axioms.review_status IS
  'Approval state. agent_proposed axioms start as pending_review. session_extracted starts as approved.';
COMMENT ON COLUMN causal_axioms.agent_id IS
  'VoltAgent agent identifier for agent_proposed axioms. NULL for session_extracted.';
COMMENT ON COLUMN causal_axioms.justification IS
  'Agent-provided reasoning for agent_proposed axioms. Used for human review.';
COMMENT ON COLUMN causal_axioms.domain IS
  'Domain classification. NULL for legacy rows.';
```

**Verification:**
- `SELECT source, review_status, agent_id FROM causal_axioms LIMIT 1;` — no error
- Existing rows have `source = 'session_extracted'` and `review_status = 'approved'` (defaults applied)
- No existing data is altered

---

## ACT-013: Install MCP SDK and Scaffold Server

### ACT-013-A: Install dependency

```bash
cd crucible
npm install @modelcontextprotocol/sdk
```

**Verification:** `@modelcontextprotocol/sdk` appears in `crucible/package.json` dependencies.

### ACT-013-B: Create auth helper

**File to create:** `crucible/src/lib/mcp/auth.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createUserScopedSupabaseClient(jwt: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    }
  );
}

export function extractJwt(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
```

**Verification:** `npx tsc --noEmit` passes.

### ACT-013-C: Create MCP error class

**File to create:** `crucible/src/lib/mcp/errors.ts`

```typescript
export class McpToolError extends Error {
  constructor(toolName: string, message: string) {
    super(`[${toolName}] ${message}`);
    this.name = 'McpToolError';
  }
}
```

### ACT-013-D: Create server entry point

**File to create:** `crucible/src/lib/mcp/server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { registerQueryCausalAxioms } from './tools/query-causal-axioms';
import { registerGetActiveScm } from './tools/get-active-scm';
import { registerProposeCausalAxiom } from './tools/propose-causal-axiom';

export function createCrucibleMcpServer(supabase: SupabaseClient): Server {
  const server = new Server(
    { name: 'crucible-causal-engine', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  registerQueryCausalAxioms(server, supabase);
  registerGetActiveScm(server, supabase);
  registerProposeCausalAxiom(server, supabase);

  return server;
}
```

### ACT-013-E: Create Next.js route handler

**File to create:** `crucible/src/app/api/mcp/route.ts`

Implement the SSE route handler using `@modelcontextprotocol/sdk`'s SSE server transport. The route must:
1. Extract JWT from `Authorization` header using `extractJwt()`
2. Return HTTP 401 if JWT is absent
3. Create user-scoped Supabase client using `createUserScopedSupabaseClient(jwt)`
4. Instantiate `createCrucibleMcpServer(supabase)`
5. Connect to SSE transport and stream responses

*Consult `@modelcontextprotocol/sdk` README for the exact SSE + Next.js App Router integration pattern. The SDK provides an `SSEServerTransport` class.*

**Verification:** `curl -H "Authorization: Bearer invalid" https://localhost:3000/api/mcp` returns 401. `curl -H "Authorization: Bearer <valid-jwt>"` returns an MCP capabilities response.

---

## ACT-014: Implement Read Tools

### ACT-014-A: `query_causal_axioms`

**File to create:** `crucible/src/lib/mcp/tools/query-causal-axioms.ts`

Implement `registerQueryCausalAxioms(server, supabase)` which:

1. Registers a tool named `query_causal_axioms` with the input schema from spec-mcp.md § 2.1
2. Implements the behavior from spec-mcp.md § 2.1 exactly:
   - `ilike` on `axiom_content`
   - `gte` on `confidence_score` (default 0.7, minimum accepted 0.5)
   - `limit` capped at 20
   - Optional `domain` filter
   - Returns fields: `id, axiom_content, confidence_score, causal_level (hardcoded 3), source, created_at`
   - Does NOT return: `session_id`, `derived_from_messages`
3. Uses Zod to validate input before querying
4. On DB error, throws `McpToolError('query_causal_axioms', ...)`

**Verification:**
- Call with `query: "causes"`, `confidence_threshold: 0.9` — returns only rows with confidence ≥ 0.9
- Call without JWT (HTTP 401 at route level, tool never reached)
- Response never contains `session_id` field

### ACT-014-B: `get_active_scm`

**File to create:** `crucible/src/lib/mcp/tools/get-active-scm.ts`

Implement `registerGetActiveScm(server, supabase)` which:

1. Registers a tool named `get_active_scm` with the input schema from spec-mcp.md § 2.2
2. Uses `SCMRegistryService` (import from `@/lib/services/scm-registry`) — never raw Supabase queries
3. Always passes `{ publicOnly: true }` to `SCMRegistryService` — never exposes draft models
4. Returns DAG always; returns `structural_equations` only when `include_equations: true`
5. Returns `{ found: false }` when no active model exists for the domain (never throws for "not found")

**Verification:**
- Call with a known `domain` that has an active SCM — `found: true`, `dag.nodes` is non-empty
- Call with an unknown domain — `{ found: false }` (no error)
- Call with `include_equations: false` — no `structural_equations` in response
- Call with `include_equations: true` — `structural_equations` array present

---

## ACT-015: Implement Write Tool

### ACT-015-A: `propose_causal_axiom`

**File to create:** `crucible/src/lib/mcp/tools/propose-causal-axiom.ts`

Implement `registerProposeCausalAxiom(server, supabase)` which:

1. Registers a tool named `propose_causal_axiom` with the input schema from spec-mcp.md § 3.1
2. Implements the behavior from spec-mcp.md § 3.1 exactly:
   - `confidence_score` HARDCODED to `0.1` — no exception
   - `source` HARDCODED to `'agent_proposed'`
   - `review_status` HARDCODED to `'pending_review'`
   - Inserts to `causal_axioms`
   - Returns `{ success: true, axiom_id, status: 'pending_review', confidence_score: 0.1, message }`
3. Input validation via Zod (both `justification` and `agent_id` are required, non-empty)

**Verification (critical — Trace Integrity tests):**

- **T-WRITE-001:** Call `propose_causal_axiom` with valid input. Verify `causal_axioms` row has `confidence_score = 0.1`, `source = 'agent_proposed'`, `review_status = 'pending_review'`.
- **T-WRITE-002:** Immediately call `query_causal_axioms` with `confidence_threshold: 0.5`. The newly proposed axiom must NOT appear (0.1 < 0.5).
- **T-WRITE-003:** Call `propose_causal_axiom` without `justification` field. Expect `InvalidParams` MCP error.
- **T-WRITE-004:** Call `propose_causal_axiom` without `agent_id` field. Expect `InvalidParams` MCP error.
- **T-WRITE-005:** Verify the output `axiom_id` is a valid UUID matching the inserted row.

---

## ACT-016: VoltAgent Configuration

**This task is in the VoltAgent project, not Crucible.**

In the VoltAgent agent definition, configure the Crucible MCP server as an SSE client:

```typescript
const agent = new Agent({
  name: 'scientific-researcher',
  mcp: {
    servers: [
      {
        name: 'crucible-causal-engine',
        transport: 'sse',
        url: process.env.CRUCIBLE_MCP_URL!,  // e.g., 'https://<deployment>/api/mcp'
        headers: async () => ({
          Authorization: `Bearer ${await getActiveSupabaseJwt()}`,
        }),
      },
    ],
  },
});
```

Environment variable to add to VoltAgent: `CRUCIBLE_MCP_URL`.

**Verification:** Agent lists `query_causal_axioms`, `get_active_scm`, `propose_causal_axiom` in its tool registry. Call `query_causal_axioms` from VoltAgent session — receives valid axiom list.

---

## Completion Criteria (Phase 3 Handoff to Gemini)

All must be true before Phase 4 verification:

- [ ] `causal_axioms` migration applied (ACT-DB-004): new columns exist, no existing data altered
- [ ] `@modelcontextprotocol/sdk` installed in Crucible
- [ ] `/api/mcp` route returns 401 without JWT, responds to valid JWT (ACT-013-E)
- [ ] `query_causal_axioms`: only returns `confidence_score ≥ threshold`, never returns `session_id` (ACT-014-A)
- [ ] `get_active_scm`: always `publicOnly: true`, returns `{ found: false }` for unknown domains (ACT-014-B)
- [ ] T-WRITE-001 through T-WRITE-005 all pass (ACT-015-A)
- [ ] Newly proposed axiom NOT visible via `query_causal_axioms` at any threshold ≥ 0.5 (T-WRITE-002)
- [ ] VoltAgent lists all 3 tools in its tool registry (ACT-016)

**Do NOT claim Phase 4 readiness until all 8 boxes above are checked.**

---

## Phase 5 Tasks — VoltAgent Client

**Spec reference:** `spec-voltagent-client.md`
**These tasks live in the VoltAgent repo, not Crucible.**

---

### ACT-017: Install MCP SDK in VoltAgent

```bash
cd voltagent-agent
npm install @modelcontextprotocol/sdk
```

**Verification:** `@modelcontextprotocol/sdk` appears in `voltagent-agent/package.json` dependencies.

**Status:** Completed in `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/package.json`.

---

### ACT-018-A: Create `crucible-client.ts`

**File to create:** `voltagent-agent/src/mcp/crucible-client.ts`

Implement `createCrucibleMcpConfig(getJwt)` exactly as specified in `spec-voltagent-client.md` § 1.3:

- Returns a `MCPConfiguration` object with a single server entry named `'crucible-causal-engine'`
- Transport: `'http'` (web-standard — matches Crucible's App Router implementation)
- URL sourced from `process.env.CRUCIBLE_MCP_URL`
- `headers` is an **async function** that calls `await getJwt()` on every invocation and returns `{ Authorization: 'Bearer <token>' }`
- Throws at initialization time if `CRUCIBLE_MCP_URL` is not set

**Verification:** `npx tsc --noEmit` passes. Import and call `createCrucibleMcpConfig(() => Promise.resolve('test'))` — no throw, returns object with `servers[0].name === 'crucible-causal-engine'`.

**Status:** Implemented with one architecture correction. The current VoltAgent version does not support Claude's `Agent({ mcp: ... })` pseudocode or async per-request HTTP headers, so ACT-018-A was realized as:
- `createCrucibleMcpConfig(getJwt)`
- `CrucibleMcpClient`
- local VoltAgent tool wrappers in `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/crucible-client.ts`

---

### ACT-018-B: Create `get-jwt.ts` (Next.js server context)

**File to create:** `voltagent-agent/src/mcp/get-jwt.ts`

Implement `getSupabaseJwtFromSession()` exactly as specified in `spec-voltagent-client.md` § 2.2:

- Calls Supabase server client (`createServerSupabaseClient()` or equivalent)
- Returns `session.access_token`
- Throws with a clear message if no active session (do not return `null` or `undefined`)

If the VoltAgent project runs as a standalone Node process (not inside Next.js), implement `getServiceJwt()` from § 2.3 instead:
- Authenticates via `signInWithPassword` using `AGENT_SUPABASE_EMAIL` + `AGENT_SUPABASE_PASSWORD`
- Caches the token and refreshes within 60 seconds of expiry

**Auth invariants (must be enforced in code, not just docs):**
- Never use `SUPABASE_SERVICE_ROLE_KEY` in the MCP headers — use anon key + JWT only
- `headers` function must call `getJwt()` fresh on every invocation, never at module load time

**Verification:** Mock Supabase returning a session with `access_token: 'test-token'`. Call `getSupabaseJwtFromSession()` → returns `'test-token'`. Call with session=null → throws with message containing `'No active Supabase session'`.

**Status:** Completed in `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/mcp/get-jwt.ts`.

---

### ACT-018-C: Create `scientific-researcher.ts` Agent

**File to create:** `voltagent-agent/src/agents/scientific-researcher.ts`

Wire together:
1. `createCrucibleMcpConfig(getJwt)` from ACT-018-A
2. `getSupabaseJwtFromSession` (or `getServiceJwt`) from ACT-018-B
3. `CRUCIBLE_SYSTEM_INSTRUCTIONS` — the exact string from `spec-voltagent-client.md` § 3.2 (copy verbatim, no paraphrasing)

```typescript
export function createScientificResearcherAgent(
  getJwt: () => Promise<string>
): Agent {
  return new Agent({
    name: 'scientific-researcher',
    description: 'A research agent with access to Crucible causal memory.',
    llm: /* configured LLM provider */,
    memory: /* configured Memory instance */,
    mcp: createCrucibleMcpConfig(getJwt),
    instructions: CRUCIBLE_SYSTEM_INSTRUCTIONS,
  });
}
```

**Verification:** `npx tsc --noEmit` passes. Agent instantiates without throwing.

**Status:** Completed in `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/src/agents/scientific-researcher.ts`.

---

### ACT-019: Environment Variable Wiring

Add to VoltAgent's `.env.local` (or platform env config):

```
CRUCIBLE_MCP_URL=https://<crucible-deployment>/api/mcp
```

For standalone agent context, additionally add:
```
AGENT_SUPABASE_EMAIL=agent-bot@your-org.com
AGENT_SUPABASE_PASSWORD=<secure-password>
```

**Verification:** `process.env.CRUCIBLE_MCP_URL` is defined at runtime. `createCrucibleMcpConfig(...)` does not throw.

**Status:** Prepared via `/Users/lesz/Documents/Synthetic-Mind/voltagent-agent/.env.example`; live env wiring still pending.

---

### ACT-020: Integration Smoke Test

Perform a live end-to-end test with a real JWT against the deployed Crucible MCP server:

**T-CLIENT-001: Tool discovery**
```
Create agent with valid JWT → agent.listTools()
Assert: tool list includes 'query_causal_axioms', 'get_active_scm', 'propose_causal_axiom'
```

**T-CLIENT-002: Read tool call**
```
Agent receives message: "Does sleep affect memory?"
Observe: agent calls query_causal_axioms (check tool call log)
Assert: response either cites an axiom OR notes absence and falls back to training knowledge
```

**T-CLIENT-003: Auth enforcement**
```
Create agent with expired/invalid JWT
Agent attempts tool call
Assert: MCP server returns 401, agent surfaces clear error (does not silently ignore)
```

**T-CLIENT-004: Proposal → invisible**
```
Agent proposes a new axiom via propose_causal_axiom
Note returned axiom_id
Immediately call query_causal_axioms with same keyword
Assert: proposed axiom does NOT appear in results (confidence 0.1 < threshold 0.7)
```

**T-CLIENT-005: System prompt verification**
```
Inspect agent's resolved system prompt
Assert: contains "## Scientific Memory Access (Crucible Causal Engine)" section
Assert: contains all three tool trigger descriptions
```

---

## Phase 5 Completion Criteria

All must be true before Phase 6 (if any):

- [ ] `CRUCIBLE_MCP_URL` env var set and validated at agent init (ACT-019)
- [ ] Agent instantiates without error, JWT retrieved asynchronously per-request (ACT-018-A, ACT-018-B)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT present in MCP headers (auth invariant)
- [ ] T-CLIENT-001: all 3 tools in agent's tool registry
- [ ] T-CLIENT-002: agent calls `query_causal_axioms` before asserting causation
- [ ] T-CLIENT-003: expired JWT surfaces as explicit error, not silent failure
- [ ] T-CLIENT-004: proposal not visible via read tools (Trace Integrity preserved end-to-end)
- [ ] T-CLIENT-005: system prompt contains full Crucible instructions block

**Do NOT claim Phase 5 complete until all 8 boxes above are checked.**
