# MASA Architecture and Current-State Implementation Summary
**Date Anchor:** 2026-02-13 (updated for current implementation slice)  
**Program:** MASA (Methods of Automated Scientific Analysis) / Wu-Weism Product Stack  
**System Under Active Build:** `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`  
**Primary White-Paper Reference:** `/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html`

---

## 1. Why We Are Building This

The core objective is to build an **Automated Scientist**: a system that moves beyond probabilistic text generation and toward causal, falsifiable scientific reasoning.

In practical terms, the intended transition is:

- From correlation-style output to causal mechanism modeling
- From “looks plausible” to “can be tested and potentially falsified”
- From one-off chat responses to persistent, governed epistemic workflows

This is consistent with the white-paper framing in `/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html`, especially the emphasis on closed-loop scientific discovery and Pearl-style causal depth.

---

## 2. Ultimate Goal (North Star)

### North-star capability
A production system that can:

1. Ingest heterogeneous evidence
2. Detect meaningful contradictions
3. Generate structured hypotheses
4. Evaluate novelty against prior art
5. Enforce falsifiability and identifiability gates
6. Surface uncertainty explicitly when evidence is weak
7. Preserve decisions and provenance for governance and replay

### Product-level interpretation
Your current app is evolving into a **causal research workbench** with three first-class scientific interfaces:

- `/chat`: causal dialogue + intervention framing
- `/hybrid`: contradiction-driven synthesis + novelty proofing
- `/legal`: causation analysis under structured harm logic

---

## 3. Architecture Model (How the System Is Organized)

The implementation is converging on a layered model:

### Layer A: Interface / Workbench
- 2041-style workbench UI across Chat, Hybrid, Legal
- Evidence rails and stage telemetry for transparency
- Session/history UX with authenticated persistence

### Layer B: Causal Application Logic
- Domain classification and constraint injection in chat paths
- Synthesis orchestration with contradiction, novelty, and recovery logic
- Legal causation analysis with but-for/proximate concepts

### Layer C: Governance and Scientific Integrity
- Claim drift sentinel and governance evaluators
- Novelty proof sentinel pipeline
- Policy/method/calibration/law-falsification specs and contracts

### Layer D: Truth Store / Persistence
- Supabase-backed persistence for histories and run artifacts
- Migration-led schema evolution
- Session/import/adoption workflows for user-scoped history

---

## 4. Current-State Implementation (Code Reality)

This section summarizes what is materially implemented in code as of 2026-02-13.

### 4.1 Core API Surface
Under `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api`, the system already exposes substantial capability, including:

- Causal chat: `/api/causal-chat`, `/api/causal-chat/history`
- Hybrid synthesis: `/api/hybrid-synthesize`, `/api/synthesis-history`
- Legal reasoning: `/api/legal-reasoning`
- Education flows: analysis, intervention optimization, plans, apprenticeship routes
- SCM governance APIs: model registry, promote/version endpoints, disagreement, autopsy, intervention validation
- OpenClaw integration endpoints: status/search/test
- History import/adoption routes for post-login data continuity

### 4.2 Chat: Current Reality
Implemented:

- Causal chat route with structured processing path
- Evidence rail model/domain/density outputs
- Session persistence and history loading
- Fact-grounding upgrade with targeted web grounding for factual/entity prompts

New anti-hallucination behavior (implemented):

- Entity/fact trigger classifier
- Serper-backed grounding for triggered prompts
- Verify-or-uncertain policy
- Inline citation behavior + grounding source cards in Evidence rail
- SSE observability events:
  - `fact_trigger_evaluated`
  - `web_grounding_started`
  - `web_grounding_completed`
  - `web_grounding_failed`
  - `factual_confidence_assessed`

Relevant files:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/chat-fact-trigger.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/chat-web-grounding.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`

### 4.3 Hybrid: Current Reality
Implemented:

- V2 workbench for hybrid synthesis
- Novelty proof and gate plumbing
- Recovery-mode behavior for weak novelty
- Timeline stage model and processing visualization
- Governance evaluator + workflow for novelty proof monitoring

Key indicators in code:
- `HYBRID_NOVELTY_PROOF_V1` feature flag path
- Novelty gate decision and proof count event handling
- Timeline stage semantics across ingestion -> novelty -> gate -> recovery

Relevant files:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/synthesis-engine.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/novelty-proof-engine.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/novelty-recovery-planner.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/contradiction-matrix.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/hybrid/HybridWorkbenchV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/hybrid/HybridResultPanelV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/hybrid/timeline.ts`

### 4.4 Legal: Current Reality
Implemented:

- Dedicated legal reasoning route and UI
- Case-detail intake and structured analysis pipeline
- Alignment with causal harm reasoning abstractions

Relevant file:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/legal-reasoning/route.ts`

### 4.5 Governance and Drift Control: Current Reality
Implemented governance infrastructure includes:

- Claim drift sentinel workflow
- M6 health and closeout trackers
- Hybrid novelty proof sentinel workflow
- Persistent memory integrity sentinel workflow (report-first rollout)
- Governance scripts and contracts (S1 foundational layer)

Relevant files:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-closeout-tracker.yml`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/hybrid-novelty-proof-sentinel.yml`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/persistent-memory-sentinel.yml`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/scan-claim-drift.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-hybrid-novelty-proof.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/evaluate-persistent-memory-integrity.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/persistent-memory.scenarios.v1.json`

### 4.6 Persistent Memory (MASA × OpenClaw-Style): Current Reality
Implemented (additive, flag-gated, report-first):

- Canonical persistent-memory contract types:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/persistent-memory.ts`
- Cache-TTL-aware causal pruning policy for prompt assembly (not transcript deletion):
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-pruning-policy.ts`
- Axiom-first compaction orchestrator with explicit fallback receipt semantics:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/compaction-orchestrator.ts`
- Hybrid retrieval fusion (vector + lexical + causal priority):
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/memory-retrieval-fusion.ts`
- Cross-session causal lattice broadcast service (policy-gated):
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-lattice.ts`
- Chat route integration for additive SSE and metadata emission:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts`
- Feature flags added (default-off):
  - `MASA_CAUSAL_PRUNING_V1`
  - `MASA_COMPACTION_AXIOM_V1`
  - `MASA_MEMORY_FUSION_V1`
  - `MASA_MEMORY_RRF_V1`
  - `MASA_CAUSAL_LATTICE_V1`
  - defined in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/config/feature-flags.ts`
  - documented in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.env.example`
- Additive migration authored:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260213_persistent_memory_v1.sql`

Additive SSE/event surface now includes:
- `causal_pruning_started`
- `causal_pruning_completed`
- `compaction_window_opened`
- `axiom_extraction_completed`
- `compaction_receipt_written`
- `compaction_summary_fallback`
- `retrieval_fusion_debug`
- `lattice_broadcast_started`
- `lattice_broadcast_applied`
- `lattice_broadcast_rejected`

Validation status for this slice:
- `npm run governance:persistent-memory-integrity ...` passed (0 hard-gate failures)
- Targeted tests passed for pruning/fusion/lattice
- Typecheck passed (`npx tsc --noEmit`)

### 4.7 Identity and Behavioral Doctrine: Current Reality
Chat behavioral standard has been formalized as a canonical manifesto:

- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/openclaw-skills/CHAT_FUNDAMENTALS.md`

This document anchors:
- Operational Taoist tone constraints
- Causal-first response doctrine
- Refusal/recovery behavior
- Runtime crosswalk to chat route reality

### 4.8 Auth and Persistence Continuity: Current Reality
Implemented:

- Google/Supabase auth-enabled model
- User-scoped history pathways
- Import/adopt routes for local-to-cloud continuity

Relevant files:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/history/import/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/adopt-legacy/route.ts`

---

## 5. OpenClaw Dashboard in the Overall System

From the dashboard context you shared, OpenClaw is functioning as an operational control plane around agent/session tooling and visibility.

Within this MASA trajectory, OpenClaw serves as:

1. A practical orchestration interface for running and inspecting sessions
2. A bridge between low-level execution and high-level research workflows
3. A place to observe real operator behavior and identify UX/traceability bottlenecks

Strategically, this is aligned with MASA’s “scientific operating system” direction: not only generating outputs, but governing how outputs are produced, audited, and replayed.

---

## 6. What Is Already Strong

1. **Architecture momentum is real**
- You now have feature depth (chat/hybrid/legal) and governance depth in the same codebase.

2. **Governance is no longer abstract**
- Claim drift and novelty proof are integrated into scripts/workflows, not just docs.

3. **Hybrid novelty posture is materially improved**
- Contradiction + novelty + gate + recovery is explicit in both backend and UI.

4. **Chat factual reliability just improved**
- Entity/fact web grounding and uncertainty fallback reduce unsupported assertions.

5. **Design system direction is coherent**
- The 2041 workbench language has started to unify feature surfaces.

---

## 7. Critical Gaps Still to Close

1. **Universal causal determinism is not complete**
- Some outputs still rely on LLM interpretation where strict structural derivation is expected.

2. **Grounding quality depends on external config health**
- Missing keys/flags degrade behavior to uncertainty fallback.

3. **Governance contracts need full production enforcement maturation**
- Several governance streams are still in report-first or staged rollout posture.

4. **Scientific identity requires stricter “trace-to-claim” UX by default**
- Users should never need to infer why a claim is trustworthy.

5. **Closed-loop experimental execution remains partially simulated**
- Full lab-grade execution and falsification loop depth is still evolving.
6. **Persistent-memory slice requires operator activation**
- The new migration and feature flags are authored but require manual environment + DB rollout before full production behavior is active.

---

## 8. Code-Reality vs White-Paper Intent

`/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html` remains the strategic intent document and conceptual north star.

Current project posture should be interpreted as:

- **Intent:** full causal-first autonomous scientific discovery loop
- **Reality:** strong causal/governance scaffolding with selective deterministic enforcement, plus active hardening toward strict scientific integrity

This distinction is healthy and expected in a long-horizon architecture program, as long as code-reality remains the scoring authority for claims.

---

## 9. Recommended Near-Term Focus (Execution-Priority)

1. **Tighten factual grounding coverage in Chat**
- Expand trigger quality and source reliability scoring.

2. **Activate persistent-memory rollout gates**
- Apply migration `20260213_persistent_memory_v1.sql`, enable flags gradually, and monitor `persistent-memory-sentinel.yml` in report mode before enforce.

3. **Finish governance enforce-mode ramps**
- Move key report-mode streams to controlled enforce mode with low false positives.

4. **Deepen trace persistence and replayability**
- Make every high-impact claim reconstructible from stored causal artifacts.

5. **Continue Hybrid as flagship scientific engine**
- Keep novelty proof + falsification + recovery as mandatory, not optional.

6. **Harden OpenClaw operational integration**
- Ensure session tooling cleanly reflects and supports MASA traceability goals.

---

## 10. Final Statement

What you are building is not a conventional chat product.

You are building a **causal research system** where interfaces, governance, memory, and model orchestration converge toward one purpose: producing claims that are testable, attributable, and epistemically honest.

The architecture already shows meaningful convergence toward that goal. The next phase is less about inventing new slogans and more about finishing deterministic enforcement, trace completeness, and governance rigor so the system earns scientific trust by default.

---

## References

### Primary
- `/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html`

### Architecture and Audit Documents
- `/Users/lesz/Documents/Synthetic-Mind/Codex-Audit/Automated-Scientist-Audit-2026-02-05.md`
- `/Users/lesz/Documents/Synthetic-Mind/Codex-Audit/Plan_v2.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/AUTOMATED_SCIENTIST_IMPLEMENTATION_SUMMARY.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/GOVERNANCE_SPEC_INDEX.md`
- `/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md`

### Key Implementation Paths
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/hybrid-synthesize/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/legal-reasoning/route.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/hybrid/HybridWorkbenchV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/openclaw-skills/CHAT_FUNDAMENTALS.md`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/claim-drift-sentinel.yml`
