# ADR-001: MASA — Methods of Automated Scientific Analysis Architecture

**Status:** Accepted
**Date:** 2026-03-08
**Deciders:** Lesz (Product & Architecture), AI Collaborators
**Supersedes:** N/A
**Program:** Wu-Weism / Synthesis Engine

---

## Context

The synthesis-engine began as a research-augmented chat application. As the product vision matured, it became clear that a conventional LLM chat loop — generating plausible-sounding text correlated from training data — was fundamentally inadequate for the stated goal: **producing scientifically trustworthy, falsifiable, causally-grounded claims**.

The core tension being resolved:

- LLMs answer *P(Y|X)* — "what is likely given what I've seen?"
- Scientific discovery requires *P(Y|do(X))* — "what happens when I actually intervene?"
- Governance-quality research requires claims that are attributable, replayable, and externally challengeable.

Several forces shaped the decision:

1. **Epistemic integrity**: Chat outputs that look correct but aren't traceable to evidence erode scientific trust.
2. **Causal depth**: Correlation-based models cannot support intervention reasoning, counterfactuals, or identifiability analysis.
3. **Governance maturity**: Serious research tools require audit trails, claim drift monitoring, and falsifiability gates — not just nice UI.
4. **Persistence and memory**: A system that "forgets" causal context between sessions cannot accumulate scientific knowledge.
5. **Closed-loop aspiration**: The north star is autonomous experiment design, execution, and world-model update — requiring a fundamentally different architecture than a chat assistant.

---

## Decision

Adopt **MASA (Methods of Automated Scientific Analysis)** as the governing architectural framework for the synthesis-engine. This is a four-layer, causally-governed research system that explicitly replaces the LLM-as-oracle model with an **LLM-as-instrument-within-a-governed-scientific-loop** model.

The system is organized around three first-class scientific interfaces — `/chat`, `/hybrid`, `/legal` — each governed by the same underlying causal, memory, and governance infrastructure.

---

## Options Considered

### Option A: Enhanced Chat Product (Rejected)

Incrementally improve the existing chat interface with better prompts, RAG retrieval, and citation display.

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Time to ship | Fast |
| Causal depth | ❌ None — correlation-based output remains |
| Scientific integrity | ❌ No falsifiability gates |
| Governance | ❌ No drift monitoring or claim provenance |
| Scalability toward autonomous science | ❌ Fundamental ceiling |

**Pros:** Fast iteration, familiar UX paradigm, low infrastructure cost.
**Cons:** Cannot support the stated mission. Produces "looks-plausible" outputs that cannot be externally validated or falsified.

---

### Option B: Agent Orchestration Framework (Partially adopted)

Build a multi-agent system (e.g., ReAct, AutoGPT-style) where agents call tools, plan, and reflect.

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium–High |
| Causal depth | ⚠️ Agents can invoke causal tools, but reasoning is still LLM-driven |
| Scientific integrity | ⚠️ Depends entirely on tool design |
| Governance | ⚠️ Emergent behavior is hard to govern |
| Scalability toward autonomous science | ⚠️ Possible but requires strict contracts |

**Pros:** Composable, flexible, aligns with industry trends.
**Cons:** Without explicit causal constraints and governance contracts, agents can still produce unchecked hallucinations. Agent loops are hard to audit and replay.

---

### Option C: MASA — Causally-Governed Scientific Architecture (Chosen)

A structured four-layer architecture with explicit causal reasoning, governed workflows, typed contracts, and persistent memory — designed around the scientific method rather than around chat completion.

| Dimension | Assessment |
|-----------|------------|
| Complexity | High |
| Time to ship | Medium (incremental, feature-flagged rollout) |
| Causal depth | ✅ P(Y\|do(X)) as first-class primitive |
| Scientific integrity | ✅ Falsifiability gates, novelty proof, drift sentinel |
| Governance | ✅ 19-section spec standard, CI-enforced contracts |
| Scalability toward autonomous science | ✅ Architecture-native path to closed-loop discovery |

**Pros:** Directly maps to the scientific method. Falsifiability and provenance are structural, not cosmetic. Governance is enforceable via CI. Memory is causally pruned, not naively chunked.
**Cons:** Higher initial complexity. Requires discipline to maintain spec standards. Some components still in report-first / staged rollout posture.

---

## Architecture: The Four Layers

### Layer A — Interface / Workbench

The user-facing research surface. Three primary interfaces with shared design language (2041 Workbench System):

- `/chat` — Causal dialogue with evidence rails, grounding, and uncertainty surfacing
- `/hybrid` — Contradiction-driven synthesis with novelty proof and recovery logic
- `/legal` — Causal harm reasoning under structured legal logic

All surfaces emit SSE (Server-Sent Events) for real-time observability, including explicit events for grounding, pruning, compaction, and lattice operations.

**Key principle:** Users must never need to infer why a claim is trustworthy. Evidence rails and stage telemetry make the epistemic process visible.

---

### Layer B — Causal Application Logic

The reasoning core. Responsible for:

- **Domain classification and constraint injection** — every query is profiled against a domain schema (`domain-profiles.v1.json`) before processing
- **Synthesis orchestration** — the OODA-loop engine: Observe → Orient → Decide → Act
- **Contradiction matrix** — structural detection of evidence conflicts before synthesis
- **Novelty proof engine** — gates hypotheses against prior art with temporal decay weighting
- **Novelty recovery planner** — recovers from weak novelty by reframing, not hallucinating
- **Legal causation analysis** — but-for and proximate causation under structural logic

**The key architectural primitive:** Structural Causal Models (DAGs) as the domain physics engine. Edges represent causal mechanisms, not statistical correlations. This enables `do(X)` intervention queries that are structurally distinct from observation queries.

**Three-agent collaboration model within synthesis:**

| Agent | Role | File |
|-------|------|------|
| Methodologist | Principal Investigator — generates hypotheses | `synthesis-engine.ts`, `hong-recombination.ts` |
| Skeptic | Adversarial peer reviewer — attacks hypotheses | `masa-auditor.ts` |
| Architect | Experimental designer — produces falsifiable protocols | `experiment-generator.ts`, `protocol-validator.ts` |

---

### Layer C — Governance and Scientific Integrity

The enforcement layer. This is what distinguishes MASA from an agent-with-tools pattern.

Four active governance specifications (19-section standard, all implementation-ready):

| Spec | Domain |
|------|--------|
| `POLICY_EVALUATION_SPEC.md` | Experiment policy evaluation and promotion |
| `CAUSAL_METHOD_SELECTION_POLICY.md` | Causal method routing and selection |
| `UNCERTAINTY_CALIBRATION_GATES.md` | Confidence and uncertainty gating |
| `LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md` | Law-candidate lifecycle and falsification |

Active CI-enforced sentinels:
- **Claim Drift Sentinel** — detects when claims migrate away from their causal evidence base
- **Hybrid Novelty Proof Sentinel** — enforces novelty gate integrity across synthesis runs
- **Persistent Memory Integrity Sentinel** — validates causal lattice coherence across sessions
- **M6 Health / Closeout Trackers** — milestone-level governance health monitoring

All governance streams use a **report-first → controlled enforce → full enforce** promotion ladder before becoming blocking gates.

---

### Layer D — Truth Store / Persistence

The memory substrate. Supabase + PostgreSQL with migration-led schema evolution.

**MASA Persistent Memory model** (feature-flagged, additive):

| Component | Function | Flag |
|-----------|----------|------|
| Causal Pruning Policy | Cache-TTL-aware prompt assembly — removes low-causal-weight context, not transcripts | `MASA_CAUSAL_PRUNING_V1` |
| Compaction Orchestrator | Axiom-first compaction with explicit fallback receipt semantics | `MASA_COMPACTION_AXIOM_V1` |
| Memory Retrieval Fusion | Hybrid vector + lexical + causal priority retrieval | `MASA_MEMORY_FUSION_V1` / `MASA_MEMORY_RRF_V1` |
| Causal Lattice | Cross-session causal graph broadcast (policy-gated) | `MASA_CAUSAL_LATTICE_V1` |

**Key design choice:** Memory is not naive transcript storage. The compaction model extracts *axioms* (high-confidence causal primitives) and preserves them across sessions while pruning low-signal context. This allows the system to accumulate scientific knowledge across runs rather than starting cold.

---

## Trade-off Analysis

### Scientific integrity vs. development velocity

MASA imposes real governance overhead. The 19-section spec standard and CI sentinel architecture require discipline to maintain. The payoff is that governance becomes *enforceable* and *auditable* rather than aspirational. The feature-flag / report-first rollout model mitigates velocity impact by keeping new governance streams non-blocking during development.

### Causal depth vs. LLM flexibility

Structural Causal Models require domain profiling and explicit DAG construction. This is harder than prompt engineering but produces claims with structural identifiability properties that LLM reasoning alone cannot provide. The domain classifier (`DOMAIN_PROFILE_SCHEMA_WITH_CLASSIFIER_MAPPING.md`) automates the routing decision.

### Persistence complexity vs. stateless simplicity

MASA persistent memory (causal pruning + compaction + lattice) is significantly more complex than naive conversation history. The architectural justification is that a system that accumulates *causal knowledge* across sessions is categorically different from one that re-derives the same conclusions each session. The complexity is encapsulated behind feature flags, enabling incremental rollout.

### Full autonomy vs. human-in-the-loop gating

Current posture: **human-gated by default** at key synthesis stages. The closed-loop autonomous execution model (cloud lab APIs, symbolic law discovery) is architecturally native but not yet active. Gating exists because adversarial peer review (the Skeptic agent) and governance contracts need to earn trust before gates can be removed.

---

## Consequences

**What becomes easier:**
- Every claim has a traceable causal path — debugging and auditing become structural, not forensic
- Governance contracts enforce scientific standards in CI, not just in documentation
- Memory accumulates *causal knowledge* rather than raw transcript — the system gets more capable over time
- The path to autonomous experimental execution is architecturally clear and incrementally unlockable

**What becomes harder:**
- Onboarding new contributors requires understanding the governance spec format and causal primitive model
- Domain profiles must be maintained as new research areas are added
- The full enforcement posture of governance sentinels requires careful threshold tuning to avoid false-positive blocking

**What we'll need to revisit:**
- Symbolic law discovery integration (currently aspirational)
- Real cloud lab API integration (currently simulated)
- Counterfactual reasoning layer (currently Level 2 of Pearl's causal ladder — Level 3 planned)
- Grounding quality and source reliability scoring in Chat (currently basic Serper-backed)

---

## Action Items

1. [ ] Apply `20260213_persistent_memory_v1.sql` migration and enable MASA memory flags in staging
2. [ ] Promote Claim Drift Sentinel from report-first to controlled enforce mode
3. [ ] Tighten fact-trigger classifier coverage in Chat grounding pipeline
4. [ ] Move Hybrid as the flagship scientific engine showcase — novelty proof + falsification + recovery mandatory
5. [ ] Begin threshold tuning for governance sentinel enforce-mode transitions
6. [ ] Harden OpenClaw operational integration as MASA traceability control plane
7. [ ] Draft `evidence_snippets` and `prior_art_cache` migration SQL and execute
8. [ ] Scope counterfactual reasoning (Level 3 Pearl ladder) as a future architecture slice

---

## References

- **White Paper:** `MASA_White_Paper.html`
- **Current-State Summary:** `MASA-Theoretical-Foundation/MASA_ARCHITECTURE_CURRENT_STATE_SUMMARY_2026-02-12.md`
- **Governance Index:** `MASA-Theoretical-Foundation/GOVERNANCE_SPEC_INDEX.md`
- **Implementation Summary:** `MASA-Theoretical-Foundation/AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- **Identity Doctrine:** `synthesis-engine/openclaw-skills/CHAT_FUNDAMENTALS.md`
- **Theoretical Foundations:** `MASA-Theoretical-Foundation/Theoretical Foundations for Autonomous Closed-Loop Scientific Discovery.docx`
- **Pearl (2009):** *Causality: Models, Reasoning, and Inference*
- **Pearl (2018):** *The Book of Why*
