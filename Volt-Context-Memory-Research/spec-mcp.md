# Crucible MCP Server — Phase 1 Specification
**Author:** Agent-02-Claude (Think)
**For:** Agent-01-GPT (Act) via Agent-03-Gemini (Observe)
**Date:** 2026-03-14
**Demis v3 Standard:** exact, formal, no ambiguity for the implementer
**Replaces:** `spec.md` (StorageAdapter approach — ABORTED)

---

## 0. Architectural Invariants (Non-Negotiable)

From `mission.md` § 5. These constrain every decision below:

| Rule | Statement | Implementation consequence |
|---|---|---|
| **No Cross-Contamination** | VoltAgent's tables never hold definitive scientific truth. Crucible's tables never hold raw agent chatter. | `propose_causal_axiom` must write with `source: 'agent_proposed'` and `confidence_score ≤ 0.3`. Crucible's read tools must never expose session-level chat content. |
| **Traceability** | Any axiom proposed via MCP must be flagged with VoltAgent's identity and requires human/MCTS verification before promotion. | `propose_causal_axiom` output MUST return the inserted row's `id` so VoltAgent can store the reference in its own episodic memory. |
| **Loose Coupling** | The MCP server must be agnostic to VoltAgent's internal versions and data structures. | All tool I/O uses plain JSON Schema (no VoltAgent types imported). Any MCP client can call these tools. |

---

## 1. THINK-012: Server Architecture & Transport

### 1.1 Transport Decision: SSE via Next.js API Route

**Decision: SSE (Server-Sent Events) transport hosted inside Crucible's existing Next.js app.**

Rationale:

| Option | Verdict | Reason |
|---|---|---|
| Separate Node process (stdio) | ❌ Rejected | Requires a separately deployed process, separate auth, separate environment. Adds infra overhead for Phase 1. |
| Next.js SSE API route | ✅ Selected | Crucible is already a Next.js 15 app deployed on Vercel. An SSE route at `/api/mcp` reuses all existing middleware, Supabase server client, RLS policies, and deployment pipeline. Zero new infrastructure. |
| VoltOps-hosted MCP | ❌ Out of scope | Phase 3+ only. |

**Endpoints:**

```
POST /api/mcp          → MCP SSE session initiation + tool calls
GET  /api/mcp          → MCP capability discovery (tools manifest)
```

The `@modelcontextprotocol/sdk` package's `Server` class handles the MCP protocol layer. The Next.js route wraps it with the SSE transport adapter.

### 1.2 SDK Dependency

```bash
npm install @modelcontextprotocol/sdk
```

Package: `@modelcontextprotocol/sdk` (latest stable). This is the official TypeScript MCP SDK from Anthropic/MCP working group.

### 1.3 Authentication — Supabase JWT Pass-Through

**Problem:** Crucible's `causal_axioms` and `scm_models` tables are protected by Supabase RLS policies. The MCP server must enforce these policies per-caller.

**Solution:** Bearer token pass-through via the MCP `Authorization` header.

**Protocol:**
1. VoltAgent includes a Supabase JWT in every MCP request: `Authorization: Bearer <supabase-jwt>`
2. The Crucible MCP route extracts the token from the request header.
3. The route creates a **user-scoped** Supabase client using the caller's JWT (not the service role key):

```typescript
import { createClient } from '@supabase/supabase-js';

function createUserScopedClient(jwt: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // anon key — RLS enforced
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    }
  );
}
```

4. All DB queries within a tool call use this user-scoped client. RLS policies are enforced automatically by Supabase.
5. If the `Authorization` header is absent or the JWT is invalid, return HTTP 401 before reaching any MCP handler.

**Token acquisition on VoltAgent side:**
VoltAgent calls `supabase.auth.getSession()` to get the user's JWT and includes it in every MCP HTTP request header.

### 1.4 MCP Server File Location

```
crucible/src/app/api/mcp/route.ts       ← Next.js route handler
crucible/src/lib/mcp/server.ts          ← MCP Server instance + tool registration
crucible/src/lib/mcp/tools/
  ├── query-causal-axioms.ts            ← THINK-013
  ├── get-active-scm.ts                 ← THINK-013
  └── propose-causal-axiom.ts          ← THINK-014
```

### 1.5 Server Initialization Pattern

```typescript
// crucible/src/lib/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

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

### 1.6 Next.js Route Handler

```typescript
// crucible/src/app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createCrucibleMcpServer } from '@/lib/mcp/server';
import { createUserScopedClient } from '@/lib/mcp/auth';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!jwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createUserScopedClient(jwt);
  const server = createCrucibleMcpServer(supabase);

  const transport = new SSEServerTransport('/api/mcp', /* response writer */);
  await server.connect(transport);
  // transport handles SSE streaming to client
}
```

*GPT: consult `@modelcontextprotocol/sdk` documentation for exact SSE transport constructor signature in Next.js App Router context. The pattern above is the correct conceptual shape.*

---

## 2. THINK-013: Causal Read Tools

### 2.1 Tool: `query_causal_axioms`

**Purpose:** Search `causal_axioms` by keyword and/or domain. Returns only high-confidence L3 axioms. VoltAgent calls this before generating a causal claim to check if Crucible already has a relevant truth.

#### Input Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Keyword search string to match against axiom_content. Case-insensitive substring match.",
      "minLength": 3,
      "maxLength": 500
    },
    "domain": {
      "type": "string",
      "description": "Optional domain filter (e.g., 'physics', 'biology', 'economics'). If omitted, searches all domains.",
      "enum": ["physics", "biology", "economics", "psychology", "general", "education", "legal"]
    },
    "confidence_threshold": {
      "type": "number",
      "description": "Minimum confidence_score to include. Default: 0.7. Enforced maximum: 1.0.",
      "minimum": 0.5,
      "maximum": 1.0,
      "default": 0.7
    },
    "limit": {
      "type": "integer",
      "description": "Maximum number of axioms to return. Default: 5. Maximum: 20.",
      "minimum": 1,
      "maximum": 20,
      "default": 5
    }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

#### Output Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "axioms": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id":               { "type": "string", "format": "uuid" },
          "axiom_content":    { "type": "string" },
          "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 },
          "causal_level":     { "type": "integer", "const": 3, "description": "Always 3 (L3 Counterfactual). Only L3 axioms are returned." },
          "source":           { "type": "string", "enum": ["session_extracted", "agent_proposed", "human_verified"] },
          "created_at":       { "type": "string", "format": "date-time" }
        },
        "required": ["id", "axiom_content", "confidence_score", "causal_level", "source", "created_at"],
        "additionalProperties": false
      }
    },
    "total_found": { "type": "integer" },
    "query_echo":  { "type": "string" }
  },
  "required": ["axioms", "total_found", "query_echo"],
  "additionalProperties": false
}
```

#### Behavior Specification

```typescript
async function queryCausalAxioms(input: QueryCausalAxiomsInput, supabase: SupabaseClient) {
  const threshold = input.confidence_threshold ?? 0.7;
  const limit = Math.min(input.limit ?? 5, 20);

  let query = supabase
    .from('causal_axioms')
    .select('id, axiom_content, confidence_score, source, created_at')
    .ilike('axiom_content', `%${input.query}%`)    // Case-insensitive substring
    .gte('confidence_score', threshold)
    .order('confidence_score', { ascending: false })
    .limit(limit);

  if (input.domain) {
    query = query.eq('domain', input.domain);
  }

  const { data, error } = await query;
  if (error) throw new McpToolError('query_causal_axioms', error.message);

  return {
    axioms: (data ?? []).map(row => ({
      ...row,
      causal_level: 3,                             // All stored axioms are L3
      source: row.source ?? 'session_extracted',   // Backward compat for rows before source column
    })),
    total_found: (data ?? []).length,
    query_echo: input.query,
  };
}
```

**Security invariant:** RLS on `causal_axioms` must prevent callers from reading axioms belonging to sessions they do not own. The user-scoped Supabase client (§ 1.3) enforces this automatically.

**What is NOT returned:** `session_id`, `derived_from_messages`. These are internal Crucible provenance fields, not consumed by external agents. Exposing `session_id` would leak session membership information across RLS boundaries.

---

### 2.2 Tool: `get_active_scm`

**Purpose:** Fetch the active Structural Causal Model for a domain. VoltAgent calls this to understand the quantitative causal structure of a domain before proposing interventions.

#### Input Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "domain": {
      "type": "string",
      "description": "The domain to retrieve the active SCM for (e.g., 'physics', 'biology').",
      "minLength": 1,
      "maxLength": 100
    },
    "model_key": {
      "type": "string",
      "description": "Optional specific model key (e.g., 'education_student_graph'). If omitted, returns the active model for the domain.",
      "maxLength": 200
    },
    "include_equations": {
      "type": "boolean",
      "description": "If true, includes structural_equations_json. Defaults to false (returns DAG only) to limit response size.",
      "default": false
    }
  },
  "required": ["domain"],
  "additionalProperties": false
}
```

#### Output Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "found": { "type": "boolean" },
    "model": {
      "type": "object",
      "properties": {
        "model_key":    { "type": "string" },
        "domain":       { "type": "string" },
        "name":         { "type": "string" },
        "description":  { "type": "string" },
        "status":       { "type": "string", "enum": ["active", "draft"] },
        "version":      { "type": "string" },
        "dag": {
          "type": "object",
          "description": "DAG as { nodes: string[], edges: { from: string, to: string }[] }",
          "properties": {
            "nodes": { "type": "array", "items": { "type": "string" } },
            "edges": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "from": { "type": "string" },
                  "to":   { "type": "string" }
                },
                "required": ["from", "to"]
              }
            }
          },
          "required": ["nodes", "edges"]
        },
        "structural_equations": {
          "type": "array",
          "description": "Only present when include_equations=true. Array of StructuralEquation objects.",
          "items": { "type": "object" }
        },
        "assumptions": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["model_key", "domain", "name", "status", "version", "dag"]
    }
  },
  "required": ["found"],
  "additionalProperties": false
}
```

#### Behavior Specification

```typescript
async function getActiveScm(input: GetActiveScmInput, supabase: SupabaseClient) {
  const registry = new SCMRegistryService(supabase);

  const result = input.model_key
    ? await registry.getModelVersion(input.model_key, undefined, { publicOnly: true })
    : await registry.getCurrentModelByDomain(input.domain);

  if (!result) return { found: false };

  const { model, version } = result;

  const output: Record<string, unknown> = {
    found: true,
    model: {
      model_key:   model.modelKey,
      domain:      model.domain,
      name:        model.name,
      description: model.description ?? '',
      status:      model.status,
      version:     version.version,
      dag:         version.dagJson,
      assumptions: version.assumptionsJson ?? [],
    },
  };

  if (input.include_equations) {
    output.model.structural_equations = version.structuralEquationsJson ?? [];
  }

  return output;
}
```

**Security invariant:** `publicOnly: true` is always passed to `SCMRegistryService` — only `status: 'active'` models are returned to external MCP callers. Draft models are not exposed.

---

## 3. THINK-014: Causal Write Tool

### 3.1 Tool: `propose_causal_axiom`

**Purpose:** Allow a VoltAgent agent to propose a new causal axiom for human or DisagreementEngine review. The axiom is written to `causal_axioms` with a low initial confidence score and a `source: 'agent_proposed'` flag. It is **never** promoted to high-confidence truth without external verification.

This tool is the sole write path from the MCP boundary into Crucible's causal tables.

#### Input Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "axiom_content": {
      "type": "string",
      "description": "The causal claim to propose. Must be a standalone, falsifiable causal statement.",
      "minLength": 20,
      "maxLength": 1000
    },
    "domain": {
      "type": "string",
      "description": "The domain of the proposed axiom.",
      "enum": ["physics", "biology", "economics", "psychology", "general", "education", "legal"],
      "default": "general"
    },
    "justification": {
      "type": "string",
      "description": "REQUIRED. The agent's reasoning or evidence supporting this axiom. Must be non-empty. Used for human review.",
      "minLength": 30,
      "maxLength": 2000
    },
    "session_id": {
      "type": "string",
      "format": "uuid",
      "description": "Optional. The VoltAgent conversation/session ID from which this insight was derived. Stored for provenance only."
    },
    "agent_id": {
      "type": "string",
      "description": "REQUIRED. Identifier of the VoltAgent agent instance proposing this axiom (e.g., 'researcher-agent-01'). Stored for traceability.",
      "minLength": 1,
      "maxLength": 200
    }
  },
  "required": ["axiom_content", "justification", "agent_id"],
  "additionalProperties": false
}
```

#### Output Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "success":          { "type": "boolean" },
    "axiom_id":         { "type": "string", "format": "uuid", "description": "The UUID of the newly inserted row. VoltAgent MUST store this in its episodic memory." },
    "status":           { "type": "string", "const": "pending_review", "description": "Always 'pending_review'. Proposals are never immediately active." },
    "confidence_score": { "type": "number", "const": 0.1, "description": "Always 0.1 on proposal. Promotion is external." },
    "message":          { "type": "string", "description": "Human-readable confirmation message." }
  },
  "required": ["success", "axiom_id", "status", "confidence_score", "message"],
  "additionalProperties": false
}
```

#### Schema Migration Required

Add two columns to `causal_axioms`:

```sql
-- Migration: add_mcp_proposal_columns_to_causal_axioms
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

**Backward compatibility:** All existing rows default to `source = 'session_extracted'` and `review_status = 'approved'`. No data migration needed.

#### Behavior Specification

```typescript
async function proposeCausalAxiom(input: ProposeCausalAxiomInput, supabase: SupabaseClient) {
  // Hard-coded enforcement — never trust caller to set these
  const PROPOSAL_CONFIDENCE = 0.1;
  const PROPOSAL_SOURCE = 'agent_proposed';
  const PROPOSAL_STATUS = 'pending_review';

  const { data, error } = await supabase
    .from('causal_axioms')
    .insert({
      axiom_content:  input.axiom_content,
      confidence_score: PROPOSAL_CONFIDENCE,
      source:           PROPOSAL_SOURCE,
      review_status:    PROPOSAL_STATUS,
      agent_id:         input.agent_id,
      justification:    input.justification,
      domain:           input.domain ?? 'general',
      session_id:       input.session_id ?? null,
      derived_from_messages: [],  // No Crucible session messages — agent-sourced
    })
    .select('id')
    .single();

  if (error) throw new McpToolError('propose_causal_axiom', error.message);

  return {
    success: true,
    axiom_id: data.id,
    status: PROPOSAL_STATUS,
    confidence_score: PROPOSAL_CONFIDENCE,
    message: `Axiom proposal recorded with id ${data.id}. Status: pending_review. Confidence will remain at 0.1 until verified by a human or the DisagreementEngine.`,
  };
}
```

**Trace Integrity Invariants:**

1. `confidence_score` is HARDCODED to `0.1`. The input schema has no `confidence_score` field — callers cannot set it.
2. `source` is HARDCODED to `'agent_proposed'`. Not user-settable.
3. `review_status` is HARDCODED to `'pending_review'`. Not user-settable.
4. The `axiom_id` in the output is the caller's proof of submission. VoltAgent stores this ID in its episodic memory to track the proposal's lifecycle.
5. `query_causal_axioms` will NOT return `pending_review` axioms by default (they do not have `confidence_score ≥ 0.7`). They are invisible to other agents until promoted.

---

## 4. Error Handling

All tool implementations must use a consistent error type:

```typescript
class McpToolError extends Error {
  constructor(toolName: string, message: string) {
    super(`[${toolName}] ${message}`);
    this.name = 'McpToolError';
  }
}
```

MCP error codes to return to the client:

| Condition | MCP error code | Message |
|---|---|---|
| Missing/invalid JWT | HTTP 401 (pre-MCP) | `'Unauthorized'` |
| Input schema validation failure | `InvalidParams` | Zod validation message |
| Supabase RLS rejection | `InternalError` | `'Access denied by policy'` |
| Row not found | `InternalError` | `'<tool>: no results'` |
| DB error | `InternalError` | Sanitized error (no raw Supabase internals) |

---

## 5. VoltAgent Configuration (Informational — for ACT-016)

When VoltAgent configures its MCP client to connect to Crucible:

```typescript
import { Memory } from '@voltagent/core';

const agent = new Agent({
  name: 'scientific-researcher',
  memory: new Memory({ storage: new SupabaseMemoryAdapter({ ... }) }),
  mcp: {
    servers: [
      {
        name: 'crucible-causal-engine',
        transport: 'sse',
        url: 'https://<crucible-deployment>/api/mcp',
        headers: async () => ({
          Authorization: `Bearer ${await getSupabaseJwt()}`,
        }),
      },
    ],
  },
});
```

VoltAgent will then have `query_causal_axioms`, `get_active_scm`, and `propose_causal_axiom` available as native agent tools, automatically exposed in the system prompt and callable during reasoning.

---

## 6. Out of Scope for Phase 1

- `get_rejection_patterns` / Hong Pattern Avoidance via MCP (Phase 2)
- `run_causal_query` — exposing the structural equation solver via MCP (Phase 2)
- Automatic promotion of `pending_review` axioms by `DisagreementEngine` (Phase 4)
- Cross-session axiom broadcasting via `LatticeBroadcastGate` (Phase 4)
- Any reads from `causal_chat_messages` — raw session content is never exposed via MCP (permanent, Invariant 1)
