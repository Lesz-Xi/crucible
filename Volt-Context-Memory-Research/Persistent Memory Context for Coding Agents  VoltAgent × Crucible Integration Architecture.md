# Persistent Memory Context for Coding Agents: VoltAgent × Crucible Integration Architecture

## Executive Summary

VoltAgent is an open-source TypeScript AI agent framework that provides a modular, adapter-based memory system supporting persistent conversation storage, semantic vector search, and working memory across sessions. Crucible is a causality-aware scientific reasoning platform that already implements a sophisticated multi-layered memory architecture—including axiom compression, causal density tagging, embedding-based rejection learning, and temporal decay—all persisted via Supabase. Both systems are TypeScript-based and use Supabase as a storage backend, creating a natural integration surface. This report analyzes how persistent memory context works in modern coding agents, examines VoltAgent's architecture in detail, maps it against Crucible's existing memory primitives, and proposes a concrete integration plan.[^1]

## How Persistent Memory Works in Agent Frameworks

### The Core Problem

Most AI agents are stateless by default—when a session ends, all context is lost. For coding agents specifically, this is catastrophic: the agent forgets project structure, prior decisions, rejected approaches, and the user's coding style. Persistent memory solves this by maintaining context across sessions, scaling with the agent's experience, and retrieving relevant context efficiently.[^2]

### The Multi-Layer Memory Pattern

The dominant architecture for persistent agent memory uses a four-layer separation, each optimized for a different time horizon:[^3][^4]

| Layer | Purpose | Time Horizon | Crucible Equivalent |
|-------|---------|-------------|-------------------|
| **Working Memory** | Active reasoning context (current prompt window) | Per-turn | `conversation-context.ts` |
| **Short-Term / Episodic** | Session-specific message history | Per-session | `chat-persistence.ts`, `session-service.ts` |
| **Semantic / Long-Term** | Vector-indexed knowledge, distilled facts | Cross-session | `embedding-service.ts`, `axiom-compression-service.ts` |
| **Metadata / Retrieval** | Organization, indexing, retrieval orchestration | Structural | `memory-retrieval-fusion.ts`, `temporal-decay.ts` |

Experimental evaluations demonstrate that hybrid architectures combining these layers outperform simpler approaches in task completion, consistency, and resource efficiency. The key insight is that different memory types serve different retrieval patterns—recency-based for short-term, similarity-based for semantic, and rule-based for structural metadata.[^3]

## VoltAgent's Memory Architecture

### The Memory V2 Adapter Pattern

VoltAgent's memory system is built around three composable adapter interfaces that together form its `Memory` class:

**StorageAdapter** — handles persistence of conversations, messages, working memory, and workflow state. The interface requires implementations for `addMessage`, `getMessages`, `createConversation`, `getWorkingMemory`, `setWorkingMemory`, and workflow state operations. Five production adapters exist: InMemory (dev only), ManagedMemory (VoltOps-hosted), LibSQL/Turso, PostgreSQL, and Supabase.[^1]

**EmbeddingAdapter** — converts text to vector representations via `embed()` and `embedBatch()` methods, with `getDimensions()` for compatibility checking. VoltAgent wraps any AI SDK embedding model through `AiSdkEmbeddingAdapter`.

**VectorAdapter** — stores and searches vectors via `store()`, `storeBatch()`, `search()`, and `delete()` methods. Options include InMemoryVectorAdapter (dev), LibSQLVectorAdapter (persistent SQLite), PostgresVectorAdapter (pgvector), and ManagedMemoryVectorAdapter.[^1]

Initialization composes these together:

```typescript
const memory = new Memory({
  storage: new SupabaseMemoryAdapter({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
  }),
  embedding: new AiSdkEmbeddingAdapter(openai.embedding("text-embedding-3-small")),
  vector: new LibSQLVectorAdapter({ url: "file:./.voltagent/memory.db" }),
  enableCache: true,
});
```

### Working Memory

Working memory stores compact context across conversation turns—not full message history, but distilled key facts, preferences, and goals. Three formats are supported:[^5]

- **Markdown template** — structured sections with headings that agents fill in (e.g., "# User Profile / - Name: / - Role:")
- **JSON schema** — validated structured data using Zod, enabling type-safe memory
- **Free-form** — unstructured text that agents manage autonomously

The agent receives two auto-injected tools: `get_working_memory()` and `update_working_memory(content)`, which it calls autonomously during conversation. Scope can be `conversation` (per-thread) or `user` (shared across all conversations).[^5]

### Semantic Search

When embedding and vector adapters are configured, VoltAgent automatically embeds each message on save, stores vectors with metadata (`messageId`, `conversationId`, `userId`, `role`, `createdAt`), and performs similarity search on retrieval. Three merge strategies determine how semantic results combine with recency-based history: `append` (default), `prepend`, and `interleave`.[^1]

### MCP Integration

VoltAgent implements a full MCP (Model Context Protocol) client, allowing agents to connect to external tools via stdio or SSE transports. An `MCPConfiguration` object defines servers, and tools are passed to agents at initialization or per-request. This is the mechanism through which VoltAgent agents can access filesystem operations, browser automation, databases, and custom external services.[^6][^7]

### Supabase Schema

The Supabase adapter creates tables for users, conversations, messages (with `parts` as JSONB), workflow states, and conversation steps—all prefixed with `voltagent_memory_`. Migration from the 0.1.x API to the 1.x `Memory V2` pattern was a breaking change that moved from `new SupabaseMemory({...})` to `new Memory({ storage: new SupabaseMemoryAdapter({...}) })`.[^8][^1]

## Crucible's Existing Memory Architecture

### Causal Density Enrichment

Every message in Crucible carries a `CausalDensityResult` that classifies its reasoning depth on Pearl's Ladder of Causation:

- **L1 (Association)** — statistical correlations ("X correlates with Y")
- **L2 (Intervention)** — causal claims ("X causes Y")
- **L3 (Counterfactual)** — deep reasoning ("If X had been different, Y would have changed")

This metadata is persisted in the `causal_chat_messages` table alongside domain classification, SCM tier usage, and confidence scores. The `CausalRung` type (`"L1" | "L2" | "L3"`) propagates through the entire system.

### Axiom Compression (Fractal Memory)

The `AxiomCompressionService` implements what Crucible calls "Fractal Memory"—compressing L3-quality messages into high-level causal axioms. The process:

1. Fetch all messages for a session
2. Filter to L3 messages with confidence ≥ 0.7
3. Group temporally proximate messages (within 5 minutes)
4. Use LLM to extract a single falsifiable causal law from each group
5. Deduplicate against existing axioms (Jaccard similarity > 0.85)
6. Store in `causal_axioms` table with confidence scores

This is directly analogous to what persistent memory literature calls "semantic memory distillation"—converting episodic interactions into durable knowledge.[^3]

### Embedding-Based Rejection Learning

The `EmbeddingService` creates a vector-indexed memory of previously rejected scientific ideas using Gemini embeddings and Supabase pgvector. Key features:

- **Hong Pattern Avoidance** — clusters rejected embeddings into Wilf Equivalence Classes using centroid-based clustering, blocking semantically similar ideas from reappearing
- **Domain Projector** — applies manifold perturbation to isolate domain-specific memory subspaces
- **Fail-open design** — vector search failures never block the main synthesis flow

### Memory Retrieval Fusion

The `fuseMemoryRetrieval` function implements a weighted scoring system that combines three signals:

- Vector similarity (weight: 0.45)
- Lexical overlap (weight: 0.30)
- Causal priority (weight: 0.25, where L3=1.0, L2=0.6, L1=0.3)

An optional Reciprocal Rank Fusion (RRF) mode is available for alternative scoring. This is more sophisticated than VoltAgent's built-in semantic search, which uses only vector similarity with a threshold cutoff.

### Temporal Decay

The `temporal-decay.ts` service applies exponential decay to prior art relevance: `weight = exp(-λ * age_years)` with a configurable decay constant (default λ=0.1) and minimum weight floor (default 10%). This prevents stale knowledge from dominating retrieval.

### Cross-Session Axiom Broadcasting

The type system defines `CrossSessionAxiomEvent` and `LatticeBroadcastGateResult`, indicating a mechanism for axioms to propagate across session boundaries—a form of agent-level knowledge transfer that VoltAgent does not natively support.

## Integration Strategy

### Architectural Compatibility

| Dimension | VoltAgent | Crucible | Compatibility |
|-----------|-----------|----------|---------------|
| Language | TypeScript | TypeScript | ✅ Direct |
| Storage Backend | Supabase adapter | Supabase (direct client) | ✅ Shared infra |
| Embedding | AI SDK (OpenAI, etc.) | Gemini via custom service | ⚠️ Adapter needed |
| Vector Search | Pluggable VectorAdapter | pgvector via Supabase RPC | ⚠️ Bridge needed |
| Working Memory | Template/Schema/Free-form | Axioms + Causal Context | ✅ Natural mapping |
| Message Format | UIMessage (AI SDK) | Custom Message type | ⚠️ Transform needed |

### Phase 1: Custom StorageAdapter for Crucible

The most direct integration path is implementing VoltAgent's `StorageAdapter` interface backed by Crucible's existing Supabase tables. This preserves Crucible's causal metadata while gaining VoltAgent's agent orchestration capabilities.

The adapter must implement all required methods from the interface—`addMessage`, `getMessages`, `createConversation`, `getWorkingMemory`/`setWorkingMemory`, and workflow state operations. The critical transformation is mapping VoltAgent's `UIMessage` (which uses a `parts` array for content) to Crucible's `Message` type (which uses a flat `content` string with attached causal metadata).

The working memory implementation should serialize Crucible's axioms into VoltAgent's working memory format. A JSON schema using Zod would be ideal because Crucible's causal data is already structured:

```typescript
const crucibleWorkingMemory = z.object({
  activeAxioms: z.array(z.object({
    axiom: z.string(),
    confidence: z.number(),
    causalLevel: z.enum(["L1", "L2", "L3"]),
    domain: z.string(),
  })).optional(),
  rejectedPatterns: z.array(z.string()).optional(),
  currentDomain: z.string().optional(),
  causalContext: z.object({
    avgCausalLevel: z.number().optional(),
    topMechanisms: z.array(z.string()).optional(),
  }).optional(),
});
```

### Phase 2: Custom VectorAdapter Wrapping pgvector

Crucible already uses Supabase pgvector with RPC functions (`match_idea_embeddings`). Rather than replacing this, a custom `VectorAdapter` should wrap Crucible's existing vector infrastructure:

The adapter would implement VoltAgent's `store()`, `search()`, `delete()`, and `clear()` methods but route them through Crucible's pgvector RPC functions. The `search()` method should inject Crucible's retrieval fusion logic—the weighted combination of vector, lexical, and causal priority scores—rather than using VoltAgent's default cosine-only similarity.

The embedding adapter should wrap Crucible's existing `generateEmbedding` function (which uses Gemini) to conform to VoltAgent's `EmbeddingAdapter` interface. The `DomainProjector`'s manifold perturbation can be applied as a post-processing step inside this adapter.

### Phase 3: MCP Server for Crucible's Causal Tools

VoltAgent's MCP client capability can expose Crucible's specialized services as MCP tools. An MCP server wrapping Crucible's services would give any VoltAgent agent access to:[^6]

- **Axiom extraction** — compress a conversation into causal laws
- **Rejection checking** — query Hong Pattern Avoidance before proposing new ideas
- **Causal density analysis** — classify reasoning depth of any text
- **Cross-session axiom retrieval** — fetch relevant axioms from other sessions
- **Temporal relevance scoring** — apply decay-weighted retrieval

The MCP server would be configured as a `stdio` transport in VoltAgent's `MCPConfiguration`, making Crucible's tools available to any agent in the orchestration graph.[^7]

### Phase 4: Causal-Aware Working Memory Lifecycle

The integration should implement an automatic lifecycle for working memory that leverages Crucible's unique capabilities:

1. **On session start** — Load relevant axioms from the `causal_axioms` table into VoltAgent working memory, filtered by domain and confidence threshold
2. **During conversation** — The `AxiomCompressionService` monitors incoming L3 messages and extracts new axioms in real-time, updating working memory via `update_working_memory()`
3. **On session end** — Run compaction: the `CompactionOrchestrator` and `CausalPruningPolicy` evaluate which messages to retain, and the `LatticeBroadcastGate` determines which new axioms should propagate to other sessions
4. **Cross-session retrieval** — When a new session starts in a similar domain, the `CrossSessionAxiomEvent` mechanism injects prior axioms into VoltAgent's working memory pre-fill

This lifecycle goes beyond VoltAgent's built-in `conversation` and `user` scopes by adding a `domain`-level scope mediated by Crucible's causal lattice.[^5]

## Critical Gaps and Counter-Considerations

### What VoltAgent Does Not Provide

VoltAgent's memory system is designed for general-purpose conversational persistence. It lacks:

- **Causal reasoning awareness** — no concept of reasoning depth or Pearl's Ladder
- **Memory quality gating** — no mechanism to evaluate whether a memory is worth persisting
- **Cross-session knowledge transfer** — working memory is scoped to conversation or user, not to domain or topic
- **Retrieval fusion** — semantic search uses only vector similarity without multi-signal weighting
- **Temporal decay** — no built-in mechanism to de-prioritize stale memories

Crucible already solves all of these. The integration should preserve Crucible's enrichments rather than replacing them with VoltAgent's simpler defaults.

### Risks

**Schema collision** — VoltAgent's Supabase adapter expects `voltagent_memory_*` tables, while Crucible uses `causal_chat_*` tables. The custom adapter must bridge these schemas without requiring either system to adopt the other's table naming.[^1]

**Message format divergence** — VoltAgent uses AI SDK's `UIMessage` with a `parts` array, while Crucible uses a flat `content` string plus separate metadata fields for causal density, domain, and SCM tiers. Lossless bidirectional conversion is non-trivial—causal metadata would need to be serialized into UIMessage's `metadata` field or stored in a parallel table.

**Embedding model mismatch** — Crucible uses Gemini embeddings; VoltAgent's examples default to OpenAI `text-embedding-3-small`. Mixing embedding models in the same vector space produces nonsensical similarity scores. The integration must enforce a single embedding model across both systems.[^1]

**Working memory size limits** — VoltAgent injects working memory directly into the system prompt. If Crucible accumulates dozens of axioms, the working memory could consume significant context window space. A selection/ranking mechanism (using causal level and confidence) should limit injection to the top-N most relevant axioms.[^5]

### What This Architecture Enables for Coding Agents

When fully integrated, a coding agent running on VoltAgent with Crucible's memory backend would:

- **Remember rejected approaches** across sessions via Hong Pattern Avoidance
- **Carry forward design decisions** as compressed axioms rather than full conversation history
- **Prioritize high-quality reasoning** by weighting L3 counterfactual memories above L1 correlations
- **Decay stale context** so that outdated technical decisions don't pollute current reasoning
- **Access external tools** via MCP for filesystem, GitHub, databases, and custom services[^6]
- **Suspend and resume workflows** using VoltAgent's workflow state persistence, enabling long-running coding tasks that survive process restarts

## Implementation Roadmap

| Phase | Deliverable | Effort | Dependencies |
|-------|------------|--------|-------------|
| 1 | `CrucibleStorageAdapter` implementing VoltAgent `StorageAdapter` | Medium | Crucible Supabase schema access |
| 2 | `CrucibleVectorAdapter` wrapping pgvector + retrieval fusion | Medium | Phase 1, embedding model decision |
| 3 | MCP server exposing Crucible's causal tools | Low | Crucible service interfaces stable |
| 4 | Causal-aware working memory lifecycle | High | Phases 1-3, axiom selection logic |
| 5 | Cross-session axiom propagation via VoltAgent agent graph | High | Phase 4, lattice broadcast gate |

The highest-leverage starting point is Phase 1, because it immediately gives Crucible access to VoltAgent's agent orchestration (sub-agents, tool routing, streaming) while preserving all existing causal memory infrastructure.

---

## References

1. [Supabase Memory | VoltAgent](https://voltagent.dev/docs/agents/memory/supabase/) - Managed Memory - Production-ready hosted memory with zero setup; Working Memory - Maintain compact c...

2. [Building Persistent Memory for AI Agents: A 4-Layer File-Based ...](https://dev.to/oblivionlabz/building-persistent-memory-for-ai-agents-a-4-layer-file-based-architecture-4pip) - Building Persistent Memory for AI Agents: A 4-Layer File-Based Architecture As AI agents...

3. [Persistent Agent Architecture - Emergent Mind](https://www.emergentmind.com/topics/persistent-agent-architecture) - Persistent agent architecture integrates memory management, process control, and user interaction to...

4. [Building Production-Ready Infrastructure for Persistent AI Agents ...](https://bix-tech.com/building-production-ready-infrastructure-for-persistent-ai-agents-with-redis-and-vector-databases/) - Build production-ready persistent AI agents with Redis and vector databases. Learn memory layers, da...

5. [Working Memory - VoltAgent](https://voltagent.dev/docs/agents/memory/working-memory/) - Working memory stores compact context across conversation turns. Unlike full message history, it tra...

6. [MCP Client - VoltAgent](https://voltagent.dev/docs/agents/mcp/) - The Model Context Protocol (MCP) is a standardized protocol for AI agents to interact with external ...

7. [MCP: Connect to External Systems - VoltAgent Tutorial](https://voltagent.dev/tutorial/mcp/) - Use Model Context Protocol to give your agent access to any external system

8. [VoltAgent/voltagent @voltagent/supabase@1.0.0 on GitHub](https://newreleases.io/project/github/VoltAgent/voltagent/release/@voltagent%2Fsupabase@1.0.0) - New release VoltAgent/voltagent version @voltagent/supabase@1.0.0 on GitHub.

