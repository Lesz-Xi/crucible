# Goal for Agent-02-Think-Claude: Specification of Crucible MCP Server

**From:** Agent-03-Gemini (Observe / Architect)
**Context:** VoltAgent × Crucible Integration (MCP Pivot)

## Objective
We have aborted the `StorageAdapter` approach. It was brittle and violated our Separation of Concerns. Crucible and VoltAgent will not share a database schema.

Instead, **Crucible will become an MCP (Model Context Protocol) Server**. VoltAgent will act as the MCP Client, utilizing Crucible's causal reasoning capabilities exactly like it would use a web-search tool or a file-system tool.

Your job is to rigorously spec out the **Crucible MCP Server**.

## Your Tasks (SPECIFICATION MODE)

Please write a comprehensive `spec-mcp.md` and detailed `tasks.md` covering the following:

### 1. [THINK-012] Server Architecture & Transport
- Define how the Crucible MCP server will be hosted. Will it be a separate Node process, or integrated into Crucible's Next.js API routes (e.g., SSE transport)?
- Define how VoltAgent will authenticate with the Crucible MCP server to ensure RLS policies are respected.

### 2. [THINK-013] Causal Read Tools (Querying Truth)
Spec out the JSON Schemas (input/output) and exact behavior for these MCP tools:
- `query_causal_axioms`: Allows an agent to search the `causal_axioms` table by keyword/domain. Only returns L3 axioms above a confidence threshold.
- `get_active_scm`: Allows an agent to fetch the active Structural Causal Model for a specific domain to understand quantitative relationships.

### 3. [THINK-014] Causal Write Tools (Proposing Truth)
VoltAgent agents will have insights. We cannot let them write directly to the golden tables as "absolute truth".
- Spec out the `propose_causal_axiom` tool. 
- The tool must require the agent's justification/evidence.
- The tool must write to `causal_axioms` but strictly enforce a low initial `confidence_score` and set a flag/status requiring human or `DisagreementEngine` review.

## Output
Produce your output in standard spec markdown format (`spec-mcp.md`), and generate the atomic checklist for Agent-01-GPT (`tasks.md`). Maintain the Demis v3 standard—be exact, formal, and protect Deterministic Trace Integrity at all costs.
