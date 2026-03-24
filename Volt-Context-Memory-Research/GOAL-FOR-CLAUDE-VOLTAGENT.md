# Goal for Agent-02-Think-Claude: Specification of VoltAgent Storage Adapter

**From:** Agent-03-Gemini (Observe / Architect)
**Context:** VoltAgent × Crucible Integration (Phase 1)
**Architecture Doc:** `Volt-Context-Memory-Research/Persistent Memory Context for Coding Agents  VoltAgent × Crucible Integration Architecture.md`

## Objective
Chief has provided a brilliant new architecture document for integrating VoltAgent's memory framework with Crucible's causal capabilities. My role is to architect the vision; your role is to write the rigorous technical specifications.

We are currently executing **Phase 1** of this integration: building a custom `CrucibleStorageAdapter` that implements VoltAgent's `StorageAdapter` interface, entirely backed by Crucible's existing Supabase tables (`causal_chat_messages` and `causal_axioms`). 

We are not touching VectorAdapters or MCP tools yet.

## Your Tasks (SPECIFICATION MODE)

Please analyze the architecture document and write a comprehensive `spec.md` and detailed `tasks.md` covering the following:

### 1. [THINK-009] Data Mapping Spec (The Hardest Problem)
VoltAgent uses an AI SDK `UIMessage` standard which relies on a `parts` array for multimodality. Crucible uses a flat `content` string, but attaches critical scientific metadata (`domain`, `causal_density`, `confidence`, `scm_version`).
- Define exactly how a VoltAgent `UIMessage` compresses into a Crucible `causal_chat_messages` row.
- Where does the causal metadata live on the VoltAgent side when retrieved? (e.g., hidden in the `metadata` object of an `ai` message?).
- Ensure lossless bidirectional mapping.

### 2. [THINK-010] Adapter Interface Spec
Define the exact TypeScript signatures required to implement VoltAgent's `StorageAdapter` backed by Supabase. You need to spec out the operations for:
- `addMessage` / `getMessages`
- `createConversation`
- `workflow` state persistence (VoltAgent requires this)

### 3. [THINK-011] Working Memory Spec
Crucible already extracts L3 axioms into the `causal_axioms` table. VoltAgent injects "working memory" directly into system prompts.
- Design the Zod schema representing the working memory context.
- Specify how `getWorkingMemory()` should pull from `causal_axioms`.
- Specify how `setWorkingMemory()` should handle updates (does it write back to `causal_axioms`, or just update a VoltAgent-specific table?).

## Output
Produce your output in standard spec markdown format, and generate the atomic checklist for Agent-01-GPT to implement. Maintain the Demis v3 standard—be exact, formal, and leave no ambiguity for the implementer.
