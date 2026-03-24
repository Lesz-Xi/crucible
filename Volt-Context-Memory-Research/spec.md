# [DEPRECATED] CrucibleStorageAdapter — Phase 1 Specification

> **WARNING:** This specification has been ABORTED in favor of an MCP-based architecture. A tight `StorageAdapter` was deemed an architectural anti-pattern and a risk to Deterministic Trace Integrity (M6.2). See `mission.md` for the new MCP strategy.

**Author:** Agent-02-Claude (Think)
**For:** Agent-01-GPT (Act) via Agent-03-Gemini (Observe)
**Date:** 2026-03-14
**Demis v3 Standard:** exact, formal, no ambiguity for the implementer

---

## 0. Canonical Source of Truth

All Crucible DB column names are authoritative as found in:
- `crucible/src/lib/services/chat-persistence.ts` — `Message` type, `causal_chat_messages` columns
- `crucible/src/lib/services/axiom-compression-service.ts` — `causal_axioms` columns, `AxiomCompressionResult`
- `crucible/src/lib/ai/causal-integrity-service.ts` — `CausalDensityResult` shape

**Table inventory used by Phase 1:**
| Table | Purpose |
|---|---|
| `causal_chat_sessions` | Conversation rows (`id`, `user_id`, `title`, `updated_at`, `created_at`) |
| `causal_chat_messages` | Message rows (see § 1.1) |
| `causal_axioms` | LLM-extracted causal axioms (see § 3.1) |
| `crucible_working_memory` | **NEW — agent-written memos** (see § 3.2) |
| `crucible_workflow_states` | **NEW — VoltAgent workflow state** (see § 2.5) |

---

## 1. THINK-009: Data Mapping Spec

### 1.1 Canonical Column Map — `causal_chat_messages`

From `chat-persistence.ts` `saveMessage()` payload:

| DB column | TS type | Nullable |
|---|---|---|
| `id` | `string` (UUID) | NO |
| `session_id` | `string` (UUID) | NO |
| `role` | `'user' \| 'assistant' \| 'system'` | NO |
| `content` | `string` | NO |
| `domain_classified` | `string` | YES |
| `scm_tier1_used` | `string[]` | YES |
| `scm_tier2_used` | `string[]` | YES |
| `confidence_score` | `number` | YES |
| `causal_graph` | `Record<string, unknown>` | YES |
| `model_key` | `string` | YES |
| `model_version` | `string` | YES |
| `causal_density` | `CausalDensityResult` (JSONB) | YES |
| `scientific_analysis` | `ScientificAnalysisResponse` (JSONB) | YES |
| `created_at` | `string` (ISO 8601) | NO |

### 1.2 VoltAgent `UIMessage` Shape

From AI SDK v4 (the version used by VoltAgent 1.x):

```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;        // Derived from parts for backward compat
  parts: MessagePart[];   // Primary content carrier
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolInvocation: ToolInvocation }
  | { type: 'tool-result'; toolResult: ToolResult }
  | { type: 'image'; image: string; mimeType?: string }
  | { type: 'file'; data: string; mimeType: string };
```

### 1.3 Bidirectional Mapping Rules

#### UIMessage → `causal_chat_messages` (write path / `addMessage`)

| UIMessage field | DB column | Rule |
|---|---|---|
| `id` | `id` | Direct |
| `role` | `role` | Direct; `'tool'` → `'assistant'` (Crucible has no tool role) |
| `parts` (text parts joined) | `content` | Extract all `{ type: 'text' }` parts, join with `"\n"`. If no text parts, use `message.content`. |
| `parts` (non-text or all parts) | `metadata.crucible.parts` | If any non-text parts exist OR if original `parts` length > 1, serialize full `parts` array into `metadata.crucible.parts` for lossless recovery |
| `metadata.crucible.domain` | `domain_classified` | Direct if present |
| `metadata.crucible.tier1Used` | `scm_tier1_used` | Direct if present |
| `metadata.crucible.tier2Used` | `scm_tier2_used` | Direct if present |
| `metadata.crucible.confidenceScore` | `confidence_score` | Direct if present |
| `metadata.crucible.causalDensity` | `causal_density` | Direct if present |
| `metadata.crucible.causalGraph` | `causal_graph` | Direct if present |
| `metadata.crucible.modelKey` | `model_key` | Direct if present |
| `metadata.crucible.modelVersion` | `model_version` | Direct if present |
| `createdAt` | `created_at` | `.toISOString()` |

**`metadata.crucible` is the causal metadata envelope.** VoltAgent's `metadata` field is a free JSONB field — we namespace our metadata under the key `"crucible"` to avoid collisions.

**NOTE:** `metadata` itself is NOT persisted to `causal_chat_messages` as a column — `causal_chat_messages` does not have a generic metadata column. The causal fields are extracted from `metadata.crucible.*` and written to their dedicated columns. Non-text `parts` that cannot be stored elsewhere are stored in a new `parts_json` column (see § 1.5).

#### `causal_chat_messages` → UIMessage (read path / `getMessages`)

| DB column | UIMessage field | Rule |
|---|---|---|
| `id` | `id` | Direct |
| `role` | `role` | Direct |
| `content` | `parts[0]` | Reconstruct as `[{ type: 'text', text: row.content }]` |
| `parts_json` | `parts` | If `parts_json` is non-null, use it directly (overrides content reconstruction) |
| `domain_classified` | `metadata.crucible.domain` | Direct if non-null |
| `scm_tier1_used` | `metadata.crucible.tier1Used` | Direct if non-null |
| `scm_tier2_used` | `metadata.crucible.tier2Used` | Direct if non-null |
| `confidence_score` | `metadata.crucible.confidenceScore` | Direct if non-null |
| `causal_density` | `metadata.crucible.causalDensity` | Direct if non-null |
| `causal_graph` | `metadata.crucible.causalGraph` | Direct if non-null |
| `model_key` | `metadata.crucible.modelKey` | Direct if non-null |
| `model_version` | `metadata.crucible.modelVersion` | Direct if non-null |
| `created_at` | `createdAt` | `new Date(row.created_at)` |

#### Lossless Guarantee

A message roundtrips losslessly if and only if:
1. All text content is preserved in `content`.
2. If non-text parts were present, they are recoverable from `parts_json`.
3. All causal metadata fields are recovered into `metadata.crucible.*`.

The adapter MUST verify this invariant in unit tests (see `tasks.md` ACT-012).

### 1.4 Role Mapping

| VoltAgent role | Crucible role | Note |
|---|---|---|
| `'user'` | `'user'` | Direct |
| `'assistant'` | `'assistant'` | Direct |
| `'system'` | `'system'` | Direct |
| `'tool'` | `'assistant'` | Crucible has no tool role; tool messages folded into assistant with a `metadata.crucible.isToolMessage: true` flag |

### 1.5 Schema Migration Required

Add one column to `causal_chat_messages`:

```sql
-- Migration: add_parts_json_to_causal_chat_messages
ALTER TABLE causal_chat_messages
  ADD COLUMN IF NOT EXISTS parts_json JSONB DEFAULT NULL;
```

This column stores the full VoltAgent `parts` array when multimodal content is present. It is `NULL` for all existing rows (safe, backward compatible).

---

## 2. THINK-010: Adapter Interface Spec

### 2.1 File Location

```
crucible/src/lib/memory/CrucibleStorageAdapter.ts
```

### 2.2 VoltAgent `StorageAdapter` Interface Requirements

Based on VoltAgent 1.x `@voltagent/supabase` source (Memory V2 API). The adapter must implement:

```typescript
import type { StorageAdapter } from '@voltagent/core';
```

Required method signatures:

```typescript
interface StorageAdapter {
  // Conversation (= Crucible session) management
  createConversation(params: {
    id?: string;
    userId?: string;
    title?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Conversation>;

  getConversation(conversationId: string): Promise<Conversation | null>;

  listConversations(params?: {
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]>;

  updateConversation(
    conversationId: string,
    params: { title?: string; metadata?: Record<string, unknown> }
  ): Promise<Conversation>;

  deleteConversation(conversationId: string): Promise<void>;

  // Message management
  addMessage(params: {
    conversationId: string;
    message: UIMessage;
    userId?: string;
  }): Promise<UIMessage>;

  getMessages(params: {
    conversationId: string;
    userId?: string;
    limit?: number;
    before?: Date;
  }): Promise<UIMessage[]>;

  // Working memory
  getWorkingMemory(params: {
    conversationId?: string;
    userId?: string;
    agentId?: string;
  }): Promise<{ content: string } | null>;

  setWorkingMemory(params: {
    conversationId?: string;
    userId?: string;
    agentId?: string;
    content: string;
  }): Promise<{ content: string }>;

  // Workflow state
  getWorkflowState(params: {
    workflowId: string;
    conversationId?: string;
  }): Promise<WorkflowState | null>;

  setWorkflowState(params: {
    workflowId: string;
    conversationId?: string;
    state: Record<string, unknown>;
  }): Promise<WorkflowState>;

  deleteWorkflowState(params: {
    workflowId: string;
    conversationId?: string;
  }): Promise<void>;
}

interface Conversation {
  id: string;
  userId?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowState {
  workflowId: string;
  conversationId?: string;
  state: Record<string, unknown>;
  updatedAt: Date;
}
```

### 2.3 `createConversation` Implementation

Maps to `causal_chat_sessions`:

```typescript
async createConversation(params): Promise<Conversation> {
  const { data, error } = await supabase
    .from('causal_chat_sessions')
    .insert({
      id: params.id ?? crypto.randomUUID(),
      user_id: params.userId ?? null,
      title: params.title ?? 'Untitled',
    })
    .select('id, user_id, title, created_at, updated_at')
    .single();

  if (error) throw error;
  return toCrucibleConversation(data);
}
```

**`toCrucibleConversation`** maps `causal_chat_sessions` row → `Conversation`:
```typescript
function toCrucibleConversation(row): Conversation {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    title: row.title ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

### 2.4 `addMessage` / `getMessages` Implementation

**`addMessage`**: Apply mapping rules from § 1.3 (write path), then:

```typescript
async addMessage(params): Promise<UIMessage> {
  const payload = uiMessageToDbRow(params.message, params.conversationId);
  const { data, error } = await supabase
    .from('causal_chat_messages')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return dbRowToUiMessage(data);
}
```

**`getMessages`**: Apply mapping rules from § 1.3 (read path):

```typescript
async getMessages(params): Promise<UIMessage[]> {
  let query = supabase
    .from('causal_chat_messages')
    .select('*')
    .eq('session_id', params.conversationId)
    .order('created_at', { ascending: true });

  if (params.limit) query = query.limit(params.limit);
  if (params.before) query = query.lt('created_at', params.before.toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(dbRowToUiMessage);
}
```

### 2.5 `getWorkflowState` / `setWorkflowState` Implementation

Requires a new table (no existing Crucible table handles workflow state):

```sql
-- Migration: create_crucible_workflow_states
CREATE TABLE IF NOT EXISTS crucible_workflow_states (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  TEXT NOT NULL,
  conversation_id UUID REFERENCES causal_chat_sessions(id) ON DELETE CASCADE,
  state        JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, conversation_id)
);
```

```typescript
async setWorkflowState(params): Promise<WorkflowState> {
  const { data, error } = await supabase
    .from('crucible_workflow_states')
    .upsert({
      workflow_id: params.workflowId,
      conversation_id: params.conversationId ?? null,
      state: params.state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workflow_id, conversation_id' })
    .select('*')
    .single();

  if (error) throw error;
  return { workflowId: data.workflow_id, conversationId: data.conversation_id, state: data.state, updatedAt: new Date(data.updated_at) };
}
```

### 2.6 Constructor Signature

```typescript
export class CrucibleStorageAdapter implements StorageAdapter {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly options: {
      /** Max axioms to inject into working memory. Default: 5 */
      maxWorkingMemoryAxioms?: number;
      /** Min confidence to include an axiom. Default: 0.7 */
      axiomConfidenceThreshold?: number;
    } = {}
  ) {}
}
```

---

## 3. THINK-011: Working Memory Spec

### 3.1 Zod Schema — `CrucibleWorkingMemorySchema`

```typescript
import { z } from 'zod';

const AxiomEntrySchema = z.object({
  axiomId:      z.string().uuid().optional(), // row.id from causal_axioms
  axiom:        z.string(),                   // row.axiom_content
  confidence:   z.number().min(0).max(1),     // row.confidence_score
  causalLevel:  z.literal(3),                 // All stored axioms are L3
  domain:       z.string().optional(),        // future: when causal_axioms stores domain
  derivedFrom:  z.array(z.string()).optional(), // row.derived_from_messages
});

const AgentMemoSchema = z.object({
  key:       z.string(),
  value:     z.string(),
  updatedAt: z.string(), // ISO 8601
});

export const CrucibleWorkingMemorySchema = z.object({
  /** Top-N L3 axioms sourced from causal_axioms (read-only from agent perspective) */
  activeAxioms: z.array(AxiomEntrySchema).optional(),

  /** Free-form agent-written memos (written by setWorkingMemory) */
  agentMemos: z.array(AgentMemoSchema).optional(),

  /** Domain of the current conversation (derived from most-recent message domain_classified) */
  currentDomain: z.string().optional(),

  /** Causal context summary for injection into system prompt */
  causalContext: z.object({
    avgCausalLevel: z.number().optional(),
    topMechanisms:  z.array(z.string()).optional(),
  }).optional(),
});

export type CrucibleWorkingMemory = z.infer<typeof CrucibleWorkingMemorySchema>;
```

### 3.2 `crucible_working_memory` Table (New)

Stores agent-written memos (`setWorkingMemory` writes here only):

```sql
-- Migration: create_crucible_working_memory
CREATE TABLE IF NOT EXISTS crucible_working_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES causal_chat_sessions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id        TEXT,
  content         JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id, agent_id)
);
```

### 3.3 `getWorkingMemory` Specification

```
getWorkingMemory({ conversationId, userId, agentId })
  → CrucibleWorkingMemory serialized as JSON string
```

**Algorithm:**

1. **Pull axioms** from `causal_axioms` where `session_id = conversationId`, ordered by `confidence_score DESC`, limited to `options.maxWorkingMemoryAxioms` (default 5), filtered to `confidence_score >= options.axiomConfidenceThreshold` (default 0.7):

   ```typescript
   const { data: axiomRows } = await supabase
     .from('causal_axioms')
     .select('id, axiom_content, confidence_score, derived_from_messages')
     .eq('session_id', conversationId)
     .gte('confidence_score', threshold)
     .order('confidence_score', { ascending: false })
     .limit(maxAxioms);
   ```

2. **Pull agent memos** from `crucible_working_memory` where `conversation_id = conversationId AND user_id = userId AND agent_id = agentId`. Return `content` JSONB → `agentMemos`.

3. **Pull current domain** from `causal_chat_messages` most recent row for this session where `domain_classified IS NOT NULL`:

   ```typescript
   const { data: lastMsg } = await supabase
     .from('causal_chat_messages')
     .select('domain_classified')
     .eq('session_id', conversationId)
     .not('domain_classified', 'is', null)
     .order('created_at', { ascending: false })
     .limit(1)
     .single();
   ```

4. **Assemble** `CrucibleWorkingMemory` object, validate with `CrucibleWorkingMemorySchema.parse(...)`, serialize to JSON string.

5. **Return** `{ content: JSON.stringify(assembled) }`.

6. **Never throws** — if any step fails, return assembled partial data (axioms or memos alone is better than nothing). Log warnings.

### 3.4 `setWorkingMemory` Specification

```
setWorkingMemory({ conversationId, userId, agentId, content: string })
  → { content: string } (echo)
```

**Algorithm:**

1. Parse `content` as JSON. Validate against `CrucibleWorkingMemorySchema`. If validation fails, treat as free-form and store as `{ agentMemos: [{ key: '__raw', value: content, updatedAt: now }] }`.

2. Extract only `agentMemos` from the parsed content. **Do NOT write to `causal_axioms`** — axioms are LLM-extracted by `AxiomCompressionService` and are read-only from the adapter's perspective.

3. Upsert into `crucible_working_memory`:

   ```typescript
   await supabase
     .from('crucible_working_memory')
     .upsert({
       conversation_id: conversationId ?? null,
       user_id: userId ?? null,
       agent_id: agentId ?? null,
       content: { agentMemos: parsed.agentMemos ?? [] },
       updated_at: new Date().toISOString(),
     }, { onConflict: 'conversation_id, user_id, agent_id' });
   ```

4. Return `{ content }` unchanged (echo).

### 3.5 Working Memory Size Budget

VoltAgent injects working memory content directly into the system prompt. To prevent context window exhaustion:

| Parameter | Default | Rationale |
|---|---|---|
| `maxWorkingMemoryAxioms` | 5 | 5 axioms × ~50 tokens each ≈ 250 tokens |
| `axiomConfidenceThreshold` | 0.7 | Matches `AxiomCompressionService.compressSession()` L3 filter |
| Total working memory budget | ≤ 500 tokens | Leave ≥ 95% of context window for live conversation |

Axioms are ranked by `confidence_score DESC`. If the conversation has >N axioms above threshold, only the top-N are injected.

---

## 4. Invariants and Error Contracts

| Invariant | Enforcement |
|---|---|
| `addMessage` never silently drops causal metadata | Unit test: roundtrip test with full `CausalDensityResult` |
| `getWorkingMemory` never throws | try/catch with partial return |
| `setWorkingMemory` never writes to `causal_axioms` | Code review + unit test asserting no calls to `causal_axioms` insert |
| `causal_density` column absence degrades gracefully | Mirror `ChatPersistence.verifyCausalDensityColumn()` pattern |
| Workflow state upsert is idempotent | `onConflict: 'workflow_id, conversation_id'` |
| Working memory content ≤ 500 tokens | Enforced by `maxWorkingMemoryAxioms` limit |

---

## 5. Out of Scope for Phase 1

- VectorAdapter, EmbeddingAdapter (Phase 2)
- MCP server for causal tools (Phase 3)
- Cross-session axiom propagation via `LatticeBroadcastGate` (Phase 4)
- `listConversations`, `deleteConversation` (not required by VoltAgent core flow but must return not-implemented error gracefully)
- User-level working memory scope (Phase 1 only implements `conversation` scope)
