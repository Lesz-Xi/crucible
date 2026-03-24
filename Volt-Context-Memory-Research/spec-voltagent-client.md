# VoltAgent MCP Client — Phase 5 Specification
**Author:** Agent-02-Claude (Think)
**For:** Agent-01-GPT (Act) via Agent-03-Gemini (Observe)
**Date:** 2026-03-14
**Demis v3 Standard:** exact, formal, implementable
**Depends on:** `spec-mcp.md` (Crucible server — Phase 4 verified complete)

---

## 0. Context: What Exists

From `walkthrough.md` and `implementation_plan.md`, Crucible's MCP server is complete and verified:

- Route: `POST /api/mcp`, `GET /api/mcp`
- Transport: SDK web-standard (not deprecated Node SSE — GPT corrected this)
- Auth: `Authorization: Bearer <supabase-jwt>` required; 401 without it
- Tools registered: `query_causal_axioms`, `get_active_scm`, `propose_causal_axiom`
- Trace invariants: proposals hardcoded to `confidence_score=0.1`, `review_status='pending_review'`

VoltAgent must now be configured as an MCP client connecting to this server.

---

## 1. THINK-015: MCP Client Initialization

### 1.1 VoltAgent's MCP Integration Model

VoltAgent (≥1.x) exposes MCP connectivity through `MCPConfiguration` passed to the `Agent` constructor. The framework internally manages the `@modelcontextprotocol/sdk` `Client` lifecycle. Tools registered on the MCP server become first-class agent tools, visible in the system prompt and callable during inference.

**Two integration paths exist — use Path A:**

| Path | Mechanism | When to use |
|---|---|---|
| **Path A — VoltAgent MCPConfiguration** | `Agent({ mcp: { servers: [...] } })` | ✅ Default. VoltAgent manages client lifecycle, tool discovery, and retry. |
| Path B — Raw SDK Client | `new Client(...)` from `@modelcontextprotocol/sdk/client` | Only if VoltAgent's MCPConfiguration does not support dynamic header injection. Check VoltAgent docs first. |

### 1.2 Path A: VoltAgent MCPConfiguration (Canonical)

```typescript
// voltagent-agent/src/agents/scientific-researcher.ts
import { Agent, Memory } from '@voltagent/core';
import { SupabaseMemoryAdapter } from '@voltagent/supabase';
import { createCrucibleMcpConfig } from '../mcp/crucible-client';

export function createScientificResearcherAgent(getJwt: () => Promise<string>) {
  return new Agent({
    name: 'scientific-researcher',
    description: 'A research agent with access to Crucible causal memory.',
    llm: /* your LLM provider */,

    memory: new Memory({
      storage: new SupabaseMemoryAdapter({
        supabaseUrl: process.env.SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_ANON_KEY!,
      }),
    }),

    mcp: createCrucibleMcpConfig(getJwt),

    instructions: CRUCIBLE_SYSTEM_INSTRUCTIONS, // Defined in § 3
  });
}
```

### 1.3 `createCrucibleMcpConfig` — The Client Factory

**File to create:** `voltagent-agent/src/mcp/crucible-client.ts`

```typescript
import type { MCPConfiguration } from '@voltagent/core';

/**
 * Creates the VoltAgent MCPConfiguration to connect to the Crucible MCP server.
 *
 * @param getJwt - Async function that returns the current user's Supabase JWT.
 *   Called before each MCP request to ensure the token is fresh.
 *   Must return the raw JWT string (not "Bearer <jwt>").
 */
export function createCrucibleMcpConfig(
  getJwt: () => Promise<string>
): MCPConfiguration {
  const crucibleUrl = process.env.CRUCIBLE_MCP_URL;
  if (!crucibleUrl) {
    throw new Error(
      '[CrucibleMcpClient] CRUCIBLE_MCP_URL environment variable is required.'
    );
  }

  return {
    servers: [
      {
        name: 'crucible-causal-engine',
        transport: 'http',                   // Web-standard transport (matches Crucible's App Router route)
        url: crucibleUrl,
        headers: async () => ({
          Authorization: `Bearer ${await getJwt()}`,
        }),
      },
    ],
  };
}
```

**Notes:**
- Transport is `'http'` (web-standard), not `'sse'` — matches Crucible's implemented web-standard transport.
- `headers` is an async function — called per-request, not once at startup. This ensures the JWT is always fresh (Supabase JWTs expire every 3600s by default).
- `CRUCIBLE_MCP_URL` must point to the deployed Crucible base URL with `/api/mcp` path, e.g. `https://your-crucible.vercel.app/api/mcp`.

### 1.4 Environment Variables Required

In the VoltAgent deployment environment (`.env.local` or Vercel/platform env):

```
CRUCIBLE_MCP_URL=https://<crucible-deployment>/api/mcp
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
```

---

## 2. THINK-016: Authentication Passthrough

### 2.1 The Auth Problem

Crucible's RLS policies enforce per-user data access. The MCP server uses the caller's Supabase JWT to scope all DB queries. VoltAgent must supply a fresh, valid JWT on every MCP call.

Two deployment contexts require different JWT retrieval strategies:

| Context | Strategy |
|---|---|
| **VoltAgent running inside a Next.js route** (server-side, request-scoped) | Extract JWT from the active Supabase server session |
| **VoltAgent running as a standalone Node process** (background agent, CLI) | Authenticate with service-level credentials or use a long-lived refresh token |

### 2.2 Strategy A: Next.js Server Context (Recommended for Phase 5)

When VoltAgent runs inside a Next.js API route or Server Component, the user's session is available via Supabase's server client.

**File to create:** `voltagent-agent/src/mcp/get-jwt.ts`

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'; // Crucible's existing helper

/**
 * Retrieves the active user's Supabase JWT for MCP authentication.
 * Must be called in a Next.js server context (API route or Server Component).
 *
 * Throws if no active session exists (unauthenticated user).
 */
export async function getSupabaseJwtFromSession(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      '[CrucibleMcpClient] No active Supabase session. User must be authenticated to use Crucible MCP tools.'
    );
  }

  return session.access_token;
}
```

**Usage at the call site:**

```typescript
// Inside a Next.js API route or Server Component
import { createScientificResearcherAgent } from '@/agents/scientific-researcher';
import { getSupabaseJwtFromSession } from '@/mcp/get-jwt';

const agent = createScientificResearcherAgent(getSupabaseJwtFromSession);
const response = await agent.chat({ message: userMessage });
```

### 2.3 Strategy B: Standalone Node Process (Service-Level Auth)

When VoltAgent runs as an autonomous background agent (no per-request user session), use a service-level JWT obtained via Supabase service role or a dedicated agent user account.

```typescript
// voltagent-agent/src/mcp/get-jwt.ts (standalone variant)
import { createClient } from '@supabase/supabase-js';

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Returns a service-level JWT for standalone agent processes.
 * Caches the token and refreshes before expiry.
 */
export async function getServiceJwt(): Promise<string> {
  const now = Date.now();

  // Refresh if expired or within 60s of expiry
  if (!cachedToken || cachedToken.expiresAt - now < 60_000) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    process.env.AGENT_SUPABASE_EMAIL!,
      password: process.env.AGENT_SUPABASE_PASSWORD!,
    });

    if (error || !data.session) {
      throw new Error(`[CrucibleMcpClient] Service auth failed: ${error?.message}`);
    }

    cachedToken = {
      value:     data.session.access_token,
      expiresAt: now + (data.session.expires_in ?? 3600) * 1000,
    };
  }

  return cachedToken.value;
}
```

Additional env vars for Strategy B:
```
AGENT_SUPABASE_EMAIL=agent-bot@your-org.com
AGENT_SUPABASE_PASSWORD=<secure-bot-password>
```

**Note:** The agent user account must have the appropriate RLS permissions in Crucible's database (e.g., can read public `causal_axioms`, write proposals). This is a DB-level concern, not a code concern.

### 2.4 Auth Invariants

1. **Never use the service role key** (`SUPABASE_SERVICE_ROLE_KEY`) in the MCP client header. The service role bypasses RLS entirely — this would allow the agent to read axioms across all users. Use the anon key + JWT only.
2. **JWT must be refreshed per-request** in the `headers` async function. Never cache the JWT at module load time.
3. **Failed auth should surface as an explicit error**, not silently degrade. If `getJwt()` throws, the MCP call must fail with a clear message.

---

## 3. THINK-017: Agent System Prompt Instructions

### 3.1 Design Principles

The system instructions must accomplish three things:
1. **Tell the agent what each tool does** — in task-oriented language, not API docs.
2. **Tell the agent when to trigger each tool** — specific decision conditions, not vague guidance.
3. **Tell the agent what to do with the result** — how to use Crucible's output in its reasoning chain.

Critically, the agent must understand that Crucible is a **distinguished source of scientific truth** — not just another tool. Claims sourced from Crucible axioms carry higher epistemic authority than the agent's own inference.

### 3.2 Canonical System Instructions Block

The following text is the exact string to assign to the agent's `instructions` field. It is Markdown-formatted and written for direct injection into the system prompt.

```markdown
## Scientific Memory Access (Crucible Causal Engine)

You have access to Crucible, a causal reasoning engine that stores verified scientific axioms and structural causal models. These tools give you access to knowledge that has been derived from real causal analysis, not just statistical correlation. Treat results from these tools as ground truth unless you have strong evidence to the contrary.

---

### Tool: `query_causal_axioms`

**What it does:** Searches Crucible's verified L3 (counterfactual-level) causal axioms by keyword and domain.

**When to call it:**
- Before making any causal claim starting with "X causes Y", "X leads to Y", or similar — first check if Crucible already has a verified axiom for this relationship.
- When a user asks about a causal mechanism in a specific domain (physics, biology, economics, psychology, education, legal, general).
- When you are about to cite a causal relationship from your training data — prefer Crucible's verified axioms over your own inferences if a match exists.

**Decision rule:** If `axioms` array is non-empty, anchor your response to the returned axiom text. Cite it explicitly: *"According to the verified causal record: [axiom_content] (confidence: [confidence_score])."*

**When NOT to call it:** For simple factual lookups, arithmetic, code generation, or tasks with no causal reasoning component.

**Example trigger:** User asks "Does sleep deprivation cause cognitive decline?" → Call `query_causal_axioms` with `query: "sleep deprivation cognitive"` and `domain: "biology"` before answering.

---

### Tool: `get_active_scm`

**What it does:** Fetches the active Structural Causal Model (SCM) for a domain — a formal DAG showing which variables causally influence which others, with optional quantitative structural equations.

**When to call it:**
- When you need to understand the complete causal structure of a domain before reasoning about interventions.
- When a user asks "What would happen if we changed X?" and the domain has an active SCM (education, economics, biology, physics).
- Before calling `propose_causal_axiom` — check the existing SCM to ensure the proposed axiom is compatible with the known causal graph. Do not propose axioms that contradict the verified DAG.
- When `query_causal_axioms` returns no results and you need broader structural context.

**Decision rule:** Use the returned `dag.nodes` and `dag.edges` to identify the causal pathway relevant to the user's question. If `include_equations: true` was requested, use `structural_equations` for quantitative reasoning. If `found: false`, proceed with your own knowledge and note the absence: *"No verified structural causal model exists for this domain in Crucible."*

**Example trigger:** User asks "How does study time affect exam scores in the education model?" → Call `get_active_scm` with `domain: "education"` to retrieve the current graph before reasoning about the pathway.

---

### Tool: `propose_causal_axiom`

**What it does:** Submits a new causal claim to Crucible's verification queue. The proposal is quarantined with a very low confidence score (0.1) and flagged as `pending_review`. It is NOT immediately trusted — a human or the DisagreementEngine must promote it.

**When to call it:**
- When the current conversation has produced a generalized, falsifiable causal rule that goes beyond the user's specific question — one that would be valuable to the scientific record.
- Only when the reasoning is at L3 (counterfactual) level: "If X had been different, Y would have changed because Z." Correlation observations (L1) and simple interventions (L2) do not qualify.
- Only when the claim is NOT already in Crucible (you have checked `query_causal_axioms` first and found no match).
- Only when you have sufficient justification from the conversation to explain WHY the claim is causal.

**When NOT to call it:**
- Do not propose axioms that restate what the user told you.
- Do not propose axioms for single specific cases ("patient X responded to drug Y") — only for generalizable mechanisms.
- Do not propose axioms that contradict the active SCM's DAG without explicitly noting the contradiction in your justification.
- Do not propose axioms based on your training data alone, without supporting reasoning from the current conversation.

**Required fields:**
- `axiom_content`: A single, standalone, falsifiable causal statement. Example: *"Chronic sleep restriction below 6 hours per night causally reduces working memory capacity by impairing hippocampal consolidation."*
- `justification`: Your full reasoning chain from the conversation — minimum 2 sentences, cite specific exchanges.
- `agent_id`: Always use `"scientific-researcher-v1"` (or the configured agent name).
- `domain`: The domain that best fits (physics, biology, economics, psychology, education, legal, general).

**After proposing:** Store the returned `axiom_id` in your working memory or response metadata. Tell the user: *"I have submitted this as a causal hypothesis to the verification queue (id: [axiom_id]). It will become part of the verified scientific record after human or automated review."*

**Example trigger:** A long technical conversation about pharmacokinetics yields the insight that "Drug clearance rate causally determines steady-state plasma concentration under fixed dosing intervals." → After verifying it's not already in Crucible, propose it with the conversation context as justification.

---

### General Rules for Scientific Integrity

1. **Crucible > Training data:** When a Crucible axiom conflicts with your training data inference, defer to the axiom and note the discrepancy.
2. **L3 claims only:** Never propose axioms for L1 (correlation) or L2 (intervention) claims. Only submit fully counterfactual, falsifiable causal laws.
3. **Tool before claim:** If you are about to assert causation in a scientific domain, call `query_causal_axioms` first unless you have already done so in this conversation for the same topic.
4. **Transparency:** When your answer is grounded in a Crucible axiom, say so explicitly. When Crucible returns no results, say so and note that your answer comes from your training knowledge only.
```

### 3.3 Integration Point

The above string (`CRUCIBLE_SYSTEM_INSTRUCTIONS`) is assigned to the agent's `instructions` field:

```typescript
// scientific-researcher.ts
const CRUCIBLE_SYSTEM_INSTRUCTIONS = `## Scientific Memory Access...`; // Full text from § 3.2

export function createScientificResearcherAgent(getJwt: () => Promise<string>) {
  return new Agent({
    // ...
    instructions: CRUCIBLE_SYSTEM_INSTRUCTIONS,
  });
}
```

If the VoltAgent framework supports a base system prompt separate from `instructions`, prepend the Crucible block after the agent's domain-specific prompt, not before it. Domain identity comes first; Crucible access is a capability layer on top.

### 3.4 Tool Trigger Decision Tree (Implementer Reference)

```
User message received
├── Contains causal claim or causal question?
│   └── YES → call query_causal_axioms(query=<extracted keywords>, domain=<detected domain>)
│             ├── Results found → anchor response to axiom, cite confidence
│             └── No results → reason from training, note absence, consider propose after
├── Asks "what if X changes" or about domain structure?
│   └── YES → call get_active_scm(domain=<detected domain>)
│             ├── found=true → use DAG for causal path reasoning
│             └── found=false → note absence, use training knowledge
└── Conversation produced a generalizable L3 causal law not yet in Crucible?
    └── YES (all conditions met: L3, falsifiable, not duplicate, has justification)
        └── call propose_causal_axiom(...)
            └── Store returned axiom_id, inform user of submission
```

---

## 4. Worked Example: End-to-End Agent Session

To make the integration concrete, here is a complete example of how the agent should behave when all three tools are triggered in a single conversation.

**User:** "I've been reading about cortisol and learning. Does chronic stress impair memory formation?"

**Agent reasoning (internal):**
1. Causal question detected. Domain: biology. Call `query_causal_axioms(query: "cortisol stress memory formation", domain: "biology")`.
2. Suppose result: `{ axioms: [], total_found: 0 }`.
3. No verified axiom exists. Call `get_active_scm(domain: "biology")`.
4. Suppose result: `{ found: true, model: { dag: { nodes: ["cortisol", "hippocampus", "LTP", "memory_consolidation"], edges: [...] } } }`.
5. DAG shows `cortisol → hippocampus → LTP → memory_consolidation`. The pathway is structurally verified.
6. Reason through the pathway, give the user the answer grounded in the SCM structure.
7. The conversation yields a generalizable L3 law: "Chronically elevated cortisol causally impairs long-term potentiation in the hippocampus, reducing memory consolidation rate." This is falsifiable, L3, and not in Crucible.
8. Call `propose_causal_axiom(axiom_content: "...", domain: "biology", justification: "User's question explored cortisol → LTP → memory consolidation pathway. The current conversation established the counterfactual: if cortisol were normalized, LTP recovery and memory formation would improve. Consistent with causal path in active biology SCM.", agent_id: "scientific-researcher-v1")`.
9. Store `axiom_id` from response.

**Agent response to user:**
> "According to the structural causal model for biology, cortisol acts on the hippocampus to suppress long-term potentiation (LTP), which is the cellular mechanism of memory consolidation — so yes, the pathway is causally verified in the current model (no direct axiom was found, but the SCM path is confirmed).
>
> Based on our discussion, I've also submitted a generalized causal hypothesis to the scientific record for verification (id: `<axiom_id>`). Once reviewed, it will become a verified axiom in the causal memory."

---

## 5. Out of Scope for Phase 5

- Agent-to-agent axiom sharing via cross-session broadcast (Phase 6+)
- Agent autonomously promoting its own `pending_review` proposals (permanently forbidden by Invariant 2)
- Automatic axiom refresh during long sessions (future working memory lifecycle hook)
- Multi-agent VoltAgent orchestration with shared Crucible memory (Phase 6+)
