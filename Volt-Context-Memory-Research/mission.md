# Mission: VoltAgent × Crucible MCP Integration (Phase 1)

**Date:** 2026-03-15
**Author:** Agent-03-Gemini (Observe / Architect)
**Status:** ACTIVE (PIVOTED to MCP Architecture)

## 1. The Core Objective
Integrate **VoltAgent** (orchestration, multi-agent frameworks) with **Crucible** (causal reasoning and deterministic evidence), using the **Model Context Protocol (MCP)** as the sole integration boundary. 

*Previous attempt (StorageAdapter) was aborted due to violations of Separation of Concerns and risks to Deterministic Trace Integrity (M6.2).*

## 2. The Problem
VoltAgent excels at workflow orchestration, episodic memory, and human-in-the-loop interactions. However, it lacks deep causal reasoning and deterministic proof generation.
Crucible excels at scientific provenance, structural causal models (SCMs), and trace integrity. 

Combining them via a direct database layer (`StorageAdapter`) risks dataset pollution and breaking complex metadata mappings. We need VoltAgent to "consult" Crucible as a distinguished source of scientific truth without cross-contaminating their respective state machines.

## 3. The Strategy: Decoupled Architecture via MCP
We will treat Crucible as a specialized **Causal Engine Provider**. We will expose Crucible's capabilities through an MCP Server.

1. **Episodic Memory & State (VoltAgent):** VoltAgent runs in its standard configuration, using standard `@voltagent/supabase` for its UI messages, workflow states, and generic episodic memory.
2. **Semantic Causal Memory (Crucible):** Crucible remains the ultimate authority on `causal_chat_messages`, `causal_axioms`, and `scm_models`.
3. **The Integration Boundary (MCP):** Crucible will host an MCP Server exposing specific tools. When VoltAgent detects a need for causal reasoning, it calls a Crucible MCP tool (e.g., `query_causal_axioms`, `propose_axiom`, `verify_intervention`).

## 4. Success Criteria for Phase 1 (The Pivot)
- [ ] Define the exact capabilities of the **Crucible MCP Server**.
- [ ] Specify the precise schemas for at least 3 core MCP tools (Read Axioms, Propose Axiom, Verify SCM).
- [ ] Ensure Zero-Migration on Crucible's core tables.
- [ ] Establish how VoltAgent receives, stores, and utilizes the results from the MCP tool calls in its own episodic memory.

## 5. Architectural Invariants (Hassabis-Style Rules)
- **Rule 1 (No Cross-Contamination):** VoltAgent's native DB tables must never hold definitive scientific truth. Crucible's DB tables must never hold raw, unverified agent chatter.
- **Rule 2 (Traceability):** Any axiom proposed by VoltAgent via MCP MUST be flagged with VoltAgent's identity and requires human/MCTS verification before promotion.
- **Rule 3 (Loose Coupling):** The MCP server must be entirely agnostic to VoltAgent's internal versions and data structures. Any LLM client that speaks MCP should be able to query Crucible.
