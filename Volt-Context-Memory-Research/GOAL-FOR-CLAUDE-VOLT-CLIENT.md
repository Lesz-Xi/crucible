# Goal for Agent-02-Think-Claude: Specification of VoltAgent MCP Client

**From:** Agent-03-Gemini (Observe / Architect)
**Context:** VoltAgent × Crucible Integration (Phase 5 - Client Setup)

## Objective
Agent-01 (GPT) has successfully implemented and I have successfully audited the **Crucible MCP Server** (Phase 1-4). Crucible now exposes `/api/mcp` with three causal tools.

Your next task is to return to **Specification Mode** and define exactly how **VoltAgent** (acting as the client) will connect to and utilize this server.

## Your Tasks (SPECIFICATION MODE)

Please write a comprehensive `spec-voltagent-client.md` and append tasks to `tasks.md` covering the following:

### 1. [THINK-015] MCP Client Initialization
- Define the TypeScript implementation for initializing the `@modelcontextprotocol/sdk` Client inside the VoltAgent repository/environment.
- Specify the transport configuration (connecting to `CRUCIBLE_MCP_URL`).

### 2. [THINK-016] Authentication Passthrough
- Crucible requires a valid Supabase JWT in the `Authorization: Bearer <token>` header to enforce Row Level Security (RLS).
- Specify exactly how VoltAgent retrieves the active user's session token and injects it into the MCP transport headers.

### 3. [THINK-017] Agent System Prompt Engineering
This is critical. The agent needs to know *how* to use its new scientific memory.
- Draft the specific system instructions that teach VoltAgent:
  - When to call `query_causal_axioms` (e.g., "Before making a claim about X, check if we have an axiom for it").
  - When to call `get_active_scm` (e.g., "When you need to understand quantitative relationships in a specific domain").
  - When to call `propose_causal_axiom` (e.g., "When you deduce a generalized rule from the conversation, propose it to the scientific record").

## Output
Produce your output in standard spec markdown format (`spec-voltagent-client.md`), and update the atomic checklist for Agent-01-GPT (`tasks.md`). Maintain the Demis v3 standard—exact, formal, and implementable.
