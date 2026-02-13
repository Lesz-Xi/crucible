# Automated Scientist Architecture Audit (Code-Reality-First)

Date anchor: 2026-02-05  
Audit mode: code-first, white-paper-as-claim-set  
Primary system: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`  
Spec inputs: `/Users/lesz/Documents/Synthetic-Mind/Codex-Audit/Plan_v2.md`, `/Users/lesz/Documents/Synthetic-Mind/Codex-Audit/Plan_v1.md`, `/Users/lesz/Documents/Synthetic-Mind/Codex-Audit/Automated-Scientist.md`, `/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html`

---

## 0. Requirements Matrix (R001-R023)

| ID | Requirement | Class | Source | Satisfaction |
|---|---|---|---|---|
| R001 | Code reality overrides white-paper intent | Mandatory analysis | Plan_v2.md:25-27, Plan_v1.md:3,68-69 | Enforced across Sections 1,5,6,7 |
| R002 | Build requirement matrix | Mandatory output | User implementation plan step 1 | This section |
| R003 | Build white-paper claim ledger C001+ | Mandatory output | User implementation plan step 2 | Section 5 |
| R004 | Build code evidence matrix with L1/L2/L3 and execution type | Mandatory output | User implementation plan step 3 | Appendix A |
| R005 | Feature causal audits: Chat | Mandatory analysis | User implementation plan step 4 | Section 4.1 |
| R006 | Feature causal audits: Hybrid | Mandatory analysis | User implementation plan step 4 | Section 4.2 |
| R007 | Feature causal audits: Legal | Mandatory analysis | User implementation plan step 4 | Section 4.3 |
| R008 | Feature causal audits: Educational | Mandatory analysis | User implementation plan step 4 | Section 4.4 |
| R009 | SCM kernel as science OS audit | Mandatory analysis | User implementation plan step 5 | Section 6 |
| R010 | Benchmark and governance audit | Mandatory analysis | User implementation plan step 6 | Section 7 |
| R011 | Propose new benchmark suites (4 required) | Mandatory output | User implementation plan step 6 | Section 7.3 |
| R012 | Non-optional risk analysis (listed risks) | Mandatory risk control | User implementation plan step 7 | Section 8.2 |
| R013 | 12-24 month roadmap by epistemic priority | Mandatory output | User implementation plan step 8 | Section 10 |
| R014 | Executive verdict + reasons | Mandatory output | Required structure item 1 | Section 1 |
| R015 | Executive summary 1-2 pages | Mandatory output | Required structure item 2 | Section 2 |
| R016 | Capability maturity table feature x Pearl ladder | Mandatory output | Required structure item 3 | Section 3 |
| R017 | Feature verdict table Keep/Modify/Demote/Remove | Mandatory output | Required structure item 4 | Section 4 |
| R018 | Critical gaps must-build-next | Mandatory output | Required structure item 8 | Section 8.1 |
| R019 | Architectural delta plan | Mandatory output | Required structure item 9 | Section 9 |
| R020 | Non-negotiable design principles | Mandatory output | Required structure item 11 | Section 11 |
| R021 | 2041 readiness scorecard | Mandatory output | Required structure item 12 | Section 12 |
| R022 | Final Pearl question answer | Mandatory output | Required structure item 13 | Section 13 |
| R023 | Baseline guardrail test rerun and status | Mandatory analysis | User implementation plan test #6 | Appendix B |

---

## 1. Executive Verdict

**Verdict: Conditional.**

The system is a credible **platform for causal-science tooling**, but it is **not yet a credible automated scientist core**.

Reasons:
1. Deterministic SCM primitives exist, but many production decisions at L2/L3 remain LLM-mediated or heuristic (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts:45`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:291`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:246`).
2. Identifiability/confounder handling is now hard-gated in key paths (chat intervention flow + explicit intervention validation API), but enforcement is still not universal across all claim-bearing endpoints (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/identifiability-gate.ts:39`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts:23`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:298`).
3. White-paper "complete" claims overstate runtime reality for full Pearl ladder execution and learning closure (`/Users/lesz/Documents/Synthetic-Mind/MASA_White_Paper.html:333`, `:803`, `:1711` vs `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts:45`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/db/persistence-service.ts:226`).
4. Benchmarks include useful scaffolding, but several suites measure proxy behavior with synthetic inputs rather than causal correctness against grounded test oracles (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/benchmark-service.ts:393`, `:467`, `:651`, `:734`).
5. Critical deployment dependencies (migrations, env keys, benchmark flags, external grounding network) are real blockers to full verification (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260129_add_axiom_compression_trigger.sql:3`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.env.example:1`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/run-benchmark/route.ts:33`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/external-grounding-service.ts:45`).

---

## 2. Executive Summary

This codebase has moved beyond pure chat patterning and now contains substantial causal infrastructure: a canonical SCM registry schema, variable ontology alignment service, disagreement and autopsy engines, causal output contracts, and feature-specific APIs for chat, synthesis, legal, and education. That is meaningful progress toward an Automated Scientist architecture.

However, the strongest bottleneck is **execution semantics mismatch**: the system frequently describes intervention and counterfactual behavior in causal terms while relying on prompt-constrained language generation and heuristic pattern checks for final behavior. In other words, there is a solid kernel scaffold, but the runtime critical path is still often "LLM as simulator" instead of "SCM as executor."

### L1 Impact (render tree / architecture surface)
- Frontend and API surfaces already expose ladder and causal confidence affordances, including a heuristic badge in chat (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/CausalDensityBadge.tsx:142`).
- This increases apparent causal maturity at the UI layer faster than underlying deterministic guarantees.

### L2 Risk (regression / interface break)
- Chat includes a conversational fast path that bypasses full causal retrieval/injection (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:213`).
- Legal but-for analysis and precedent matching are partly heuristic/LLM and therefore sensitive to prompt drift (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:92`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/precedent-matcher.ts:373`).
- Autopsy persistence currently writes `user_id = "system"` into a table keyed to `auth.users(id)`, creating data integrity risk under strict FK enforcement (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/autopsy/route.ts:21`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260206_causal_autopsy_mode.sql:5`).

### L3 Calibration (latency / error / token)
- The system has explicit cost confirmation and benchmark flags (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/run-benchmark/route.ts:25`, `:33`) and broad benchmark scaffolding.
- But benchmark suites are still largely synthetic/proxy in several tracks, so current calibration is mostly internal consistency, not hard external validity.

### L4 Critical Gaps (non-skippable user actions)
- Manual migrations are required for full behavior, including chat density persistence and SCM registry/disagreement/autopsy tables (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260129_add_axiom_compression_trigger.sql:3`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/README.md:21`).
- API keys and flags are required for runtime paths (`ANTHROPIC_API_KEY`, `BENCHMARK_ENABLED`) but not fully documented in `.env.example` (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.env.example:1`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:105`).

### Net assessment
The architecture is currently best described as **"causal-enabled synthesis system"** rather than **"automated scientist."** A concrete shift has started with implemented intervention gating, but the decisive transition still requires full endpoint coverage, deterministic counterfactual trace contracts, explicit falsification lifecycle, and benchmarks tied to causal ground truth rather than output plausibility.

---

## 3. Capability Maturity Table (Feature x Pearl Ladder)

Scale: 0-5 (0 none, 5 robust production-grade)

| Feature | L1 Association | L2 Intervention | L3 Counterfactual | Dominant execution type | Maturity |
|---|---:|---:|---:|---|---:|
| Chat | 4.0 | 3.0 | 1.7 | Prompt-constrained LLM + gated interventions + heuristic scoring | 2.9 |
| Hybrid Synthesis | 4.0 | 2.5 | 2.0 | SCM-first attempt + LLM-heavy pipeline | 2.8 |
| Legal Reasoning | 3.5 | 2.5 | 2.5 | Heuristic + LLM but-for and precedent matching | 2.8 |
| Educational System | 3.5 | 2.5 | 1.5 | Deterministic graph heuristics, scripted counterfactuals | 2.6 |
| SCM Kernel/Registry | 3.5 | 3.3 | 2.5 | Deterministic graph operations + registry services + gate contract | 3.2 |
| Benchmark/Governance | 2.8 | 2.4 | 2.0 | Synthetic benchmark harness with partial kernel tasks | 2.4 |

Evidence highlights:
- Chat fast path bypass: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:213`
- Intervention gate service and API: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/identifiability-gate.ts:39`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts:23`
- Solver "future work" on explicit equations: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts:45`
- Hybrid SCM-first fallback: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/synthesis-engine.ts:284`
- Legal but-for LLM fallback: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:113`
- Educational intervention simulation path: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/optimize-intervention/route.ts:219`
- Kernel deterministic query methods: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/causal-blueprint.ts:421`, `:443`, `:466`, `:517`

---

## 4. Feature Verdict Table and Causal Audits

### 4.0 Verdict Table

| Feature | Verdict | Why (causal justification) | Immediate architectural action |
|---|---|---|---|
| Chat | **Modify + Demote to causal view layer** | Core response generation is still prompt-first; fast path bypasses causal kernel | Extend current gate coverage and require trace contract for all claim-bearing outputs |
| Hybrid Synthesis | **Keep + Major Modify** | Closest to science engine; has SCM-first path and guards but still mixed with narrative generation | Make SCM-first mandatory for claim-bearing outputs; hard-fail when unverifiable |
| Legal | **Keep + Modify** | Strong domain decomposition (Intent -> Action -> Harm), but but-for/counterfactual often heuristic/LLM | Replace LLM counterfactual finality with deterministic trace + legal uncertainty bounds |
| Educational | **Keep + Modify** | Good deterministic graph personalization; counterfactual teaching is still mostly heuristic/story mode | Bind teach-back output to kernel trace IDs and uncertainty rails |

### 4.1 Chat Audit

What is real:
- Domain classification, SCM retrieval, constraint injection, streaming analysis, provenance events are implemented (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:250`, `:259`, `:341`, `:423`).
- Intervention requests now pass through an explicit identifiability gate with downgrade/block behavior and typed gate classes (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:291`, `:298`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/identifiability-gate.ts:39`).

What is partial:
- Intervention handling is now gated, but downstream narrative still comes from LLM stream (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:298`, `:356`).
- Counterfactual scenarios are generated from output text, not strict structural abduction-action-prediction (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:438`).

What fails threshold:
- Explicit conversational fast path bypasses full causal path (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:213`).
- Causal density displayed as percent badge is heuristic (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/causal-integrity-service.ts:53`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/CausalDensityBadge.tsx:142`).

### 4.2 Hybrid Synthesis Audit

What is real:
- End-to-end ingestion -> contradiction detection -> hypothesis generation -> persistence pipeline exists (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/hybrid-synthesize/route.ts:54`, `:91`, `:137`, `:157`).
- SCM hypothesis generator plus hypothesis guard enforce do/falsifier/confounder presence at generation time (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/scm-hypothesis-generator.ts:330`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/hypothesis-guard.ts:37`).

What is partial:
- SCM-first is feature-flagged and falls back to prompt-first (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/synthesis-engine.ts:284`, `:299`, `:303`).
- Ranking uses intervention value and identifiability but still downstream of LLM-heavy generation/refinement loops (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/synthesis-engine.ts:1010`, `:1115`, `:1224`).

What fails threshold:
- Hypothesis lifecycle is not persisted as explicit states (proposed/tested/falsified/retracted).
- Counterfactual semantics still partly narrative in generated prose/artifacts.

### 4.3 Legal Audit

What is real:
- Intent -> Action -> Harm pipeline and but-for chain construction are explicit (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/legal-reasoning/route.ts:219`, `:476`).
- Legal SCM template includes proximate cause, mens rea, intervening cause, and correlation-trap checks (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/legal-scm-template.ts:106`, `:138`, `:153`, `:168`, `:195`).

What is partial:
- But-for analyzer uses heuristic shortcuts first, then LLM counterfactual reasoning (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:92`, `:113`, `:246`).
- Precedent matching uses static landmark set with LLM/heuristic similarity (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/precedent-matcher.ts:22`, `:373`).

What fails threshold:
- Counterfactual liability quality still depends on prompt interpretation under ambiguity.
- Shared kernel reuse exists conceptually, but legal-specific heuristics are still bespoke in key scoring paths.

### 4.4 Educational Audit

What is real:
- Personalized causal graph generation is deterministic rule-based (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/analyze-student/route.ts:163`, `:276`, `:396`, `:427`).
- Teach-back service explicitly exposes uncertainty/method/limitations (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/scm.ts:126`).

What is partial:
- Intervention optimizer calls itself do-calculus but uses path-strength heuristic propagation (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/optimize-intervention/route.ts:219`, `:235`, `:257`).
- Counterfactual scenarios are template-generated and not derived from structural equation solves (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/optimize-intervention/route.ts:371`).

What fails threshold:
- Causal literacy integrity risk: explanation can appear stronger than kernel evidence unless trace links are mandatory.

---

## 5. Claim Verification Ledger (White Paper vs Code)

Legend for evidence status: `implemented`, `partial`, `narrative-only`, `contradicted`

| Claim ID | White-paper claim (source) | Declared status | Code mapping | Evidence status | Overclaim risk |
|---|---|---|---|---|---|
| C001 | "full implementation ... Pearl's Causal Blueprint" (`MASA_White_Paper.html:333`) | Complete | Solver + chat + hybrid + kernel files | **partial** | High |
| C002 | "complete Ladder of Causation gatekeeper layer" (`MASA_White_Paper.html:803`) | Complete | Chat/Hybrid/Legal paths | **partial** (chat intervention gate implemented; broad runtime coverage still incomplete) | High |
| C003 | Registry architecture with multi-framework canonical models (`MASA_White_Paper.html:1013`, `:1660`) | Complete | Registry migrations/services | **implemented** (with runtime dependency on migrations/flags) | Medium |
| C004 | Closed-loop persistent learning from outcomes (`MASA_White_Paper.html:333`) | Complete | Rejection memory in persistence | **partial** (rejection caching, not full model revision) | High |
| C005 | "Physical Validation complete" (`MASA_White_Paper.html:1655`) | Complete | Mock cloud lab + protocol checks | **partial** (in silico/sandbox-centric) | Medium |
| C006 | Benchmark suite "refutes" core weaknesses (`MASA_White_Paper.html:1680`) | Complete/refuted | Benchmark service suites | **partial** (many synthetic/proxy benchmarks) | High |
| C007 | Update mechanism noted as "Foundation" and true learning not yet implemented (`MASA_White_Paper.html:1650-1652`) | Foundation | `checkRejection` + embeddings | **implemented** (self-limited claim) | Low |
| C008 | Constraint caveat: stateless between sessions for domain expertise (`MASA_White_Paper.html:1717`) | Limitation stated | Domain projector + API-model limits | **implemented/acknowledged** | Low |
| C009 | Multi-scale domain template stack breakthrough (`MASA_White_Paper.html:1668`) | Complete | Tier2 templates + retrieval switching | **partial** (template presence yes, deterministic stacked execution limited) | Medium |
| C010 | Cost savings via pre-epistemic rejection (`MASA_White_Paper.html:995-999`) | Claimed metric | Hybrid pipeline + guards | **narrative-only** (no direct audited cost accounting found in code paths) | Medium |

Key contradiction anchor:
- Solver explicitly states no full structural equation solving in current TS path (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts:45`).

---

## 6. SCM Kernel Evaluation (Science OS Audit)

| Dimension | Assessment | Evidence |
|---|---|---|
| Registry/versioning/provenance integrity | **Real** (schema + service + RLS) | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260206_canonical_scm_registry.sql:7`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-registry.ts:108` |
| Multi-DAG and ontology alignment | **Partial** | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-registry.ts:158`, `:168`; `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-disagreement-engine.ts:266` |
| Registry-first retrieval with fallback | **Real** | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-retrieval.ts:222`, `:272` |
| Identifiability enforcement | **Partial** (runtime gate exists for chat + validate API, not universal) | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/identifiability-gate.ts:39`; `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts:23`; `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:291` |
| Confounder completeness enforcement | **Partial** | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/causal-blueprint.ts:543`; `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-output-contract.ts:224` |
| Counterfactual execution path integrity (abduction-action-prediction) | **Partial to missing in production paths** | Deterministic query exists: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/causal-blueprint.ts:466`; production narrative generation still dominant: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:438`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:246` |
| Disagreement and autopsy governance | **Real but with persistence caveat** | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-disagreement-engine.ts:262`; `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/autopsy/route.ts:77` |

Science OS verdict: **Kernel foundations are present; deterministic enforcement is not yet universal at feature runtime boundaries.**

---

## 7. Benchmark and Governance Evaluation

### 7.1 Current benchmark quality

Strengths:
- Multi-suite harness exists with run records and cost estimation (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/benchmark-service.ts:280`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/benchmark-cost/route.ts:37`).
- Benchmark gating requires explicit user cost confirmation and environment enablement (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/run-benchmark/route.ts:25`, `:33`).
- Hybrid SCM kernel suite includes association/intervention/counterfactual/identifiability/disagreement tasks (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/benchmark-service.ts:799`).

Weaknesses:
- Major suites use synthetic data generation and embedding proxies; causal correctness oracle remains limited (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/benchmark-service.ts:409`, `:491`, `:517`, `:671`, `:757`).
- Several pass thresholds are convenience thresholds, not externally validated scientific standards.
- No explicit anti-overclaim benchmark that compares generated certainty language to evidential class.

### 7.2 Governance posture

Current controls:
- Feature flags and explicit benchmark enablement (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/config/feature-flags.ts:9`).
- Causal output contract softens certainty language and emits unresolved gaps (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-output-contract.ts:19`, `:217`).

Current gaps:
- No mandatory refusal gate when identifiability fails in all runtime APIs (implemented in chat + validate endpoint, still missing broad enforcement).
- No lifecycle event model for hypothesis retraction and audit replay.

### 7.3 Required new benchmark suites

1. **Hypothesis Falsification Benchmark (required)**
- Goal: verify hypotheses include executable disconfirmation paths and retract state on failure.
- Input: fixed corpus + intervention logs + falsifier outcomes.
- Pass: >=95% of accepted hypotheses have machine-checkable falsifier + correct state transition to `falsified`/`retracted` when failed.

2. **Counterfactual Stability Benchmark (required)**
- Goal: test robustness of counterfactual outputs under equivalent graph representations.
- Input: semantically equivalent DAG variants.
- Pass: sign and ranking stability >=90%, with explicit uncertainty widening when instability detected.

3. **Intervention-Value Regression Benchmark (required)**
- Goal: prevent drift toward novelty ranking over intervention leverage.
- Input: known scenarios where novelty and intervention value conflict.
- Pass: intervention-value ranking dominates in >=95% cases.

4. **Identifiability Gate Compliance Benchmark (required)**
- Goal: enforce refusal/degrade behavior when required confounders missing.
- Input: controlled missing-confounder test set.
- Pass: 100% gate enforcement (no causal claim beyond allowed status).

---

## 8. Critical Gaps

### 8.1 Must-build-next (non-negotiable)

| Gap ID | Gap | Why non-negotiable | Owner |
|---|---|---|---|
| G001 | Universal identifiability gate before intervention/counterfactual claims | Prevents causal theater and unsafe recommendations; current implementation is not yet system-wide | Core causal platform |
| G002 | Deterministic counterfactual trace contract in runtime APIs | Needed to distinguish true SCM path from narrative simulation | Core causal platform |
| G003 | Hypothesis lifecycle and retraction events | Required for falsification-driven science loop | Hybrid + persistence |
| G004 | Evidence-class-aware UI confidence policy | Prevents confidence laundering via polished UI | Frontend + governance |
| G005 | Benchmark oracle upgrade (real causal tasks) | Synthetic proxy metrics cannot certify scientific integrity | Benchmark/governance |

### 8.2 Existential integrity risk register (non-optional)

| Risk | Severity | Likelihood | Detectability | Current safeguard | Needed safeguard | Ownership |
|---|---|---|---|---|---|---|
| Causal theater | Critical | High | Medium | Prompt constraints + heuristics | Hard identifiability and trace gates | Core causal platform |
| Memory poisoning | High | Medium | Medium | Rejection vector lookup | Provenance-tagged memory + poisoning tests | Persistence/governance |
| Confidence laundering through UI | High | Medium | High | Tooltip disclaimer | Evidence-class rendering policy + caps | Frontend/governance |
| Educational drift from kernel truth | High | Medium | Medium | Teach-back limitations fields | Mandatory trace-link to kernel outputs | Education + causal platform |
| Novelty-engine failure mode | High | High | Medium | Some intervention ranking | Regression benchmark + gate policy | Hybrid + governance |
| Overclaim governance drift | Critical | Medium | Low | None formal | Claim-to-code diff audit in CI | Product governance |

### 8.3 USER ACTION REQUIRED (runtime verification blockers)

1. **Apply required migrations in Supabase SQL Editor**
- Minimum set for audited capabilities:
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260129_add_axiom_compression_trigger.sql`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260206_canonical_scm_registry.sql`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260206_causal_disagreement_engine.sql`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260206_causal_autopsy_mode.sql`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260207_expand_benchmark_suites.sql`
- Migration evidence for manual step requirement: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260129_add_axiom_compression_trigger.sql:3`

2. **Configure environment variables not documented in `.env.example`**
- Must include at least:
  - `ANTHROPIC_API_KEY` (required by chat/legal/hybrid generation paths)
  - `BENCHMARK_ENABLED=true` (required to run benchmark API)
  - `BENCHMARK_MAX_COST` (recommended guardrail)
- Evidence: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:105`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/run-benchmark/route.ts:33`

3. **Ensure valid authenticated user context for autopsy persistence or patch route**
- Current route uses `user_id = "system"` (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/autopsy/route.ts:21`, `:77`) while table requires FK to `auth.users` (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/supabase/migrations/20260206_causal_autopsy_mode.sql:5`).

4. **Enable network access for external grounding checks**
- External grounding uses PubChem HTTP calls (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/external-grounding-service.ts:45`).

---

## 9. Architectural Delta Plan

This audit pass includes implemented baseline deltas for intervention gating. Remaining deltas below are required for full Automated Scientist alignment.

### 9.1 Identifiability Gate Contract (implemented baseline, extend system-wide)

```ts
// Implemented API contract
POST /api/scm/intervention/validate
{
  modelRef: { modelKey: string; version?: string },
  treatment: string,
  outcome: string,
  adjustmentSet: string[],
  knownConfounders?: string[]
}

200 {
  allowed: boolean,
  identifiability: {
    identifiable: boolean,
    requiredConfounders: string[],
    missingConfounders: string[],
    note: string
  },
  allowedOutputClass: "association_only" | "intervention_inferred" | "intervention_supported"
}
```

Rule: if `allowed=false`, downstream features must refuse causal intervention claims and downgrade to association-only.
Current implementation evidence: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts:23`, `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:298`.

### 9.2 Counterfactual Trace Schema (new)

```ts
interface CounterfactualTrace {
  traceId: string;
  modelRef: { modelKey: string; version: string };
  query: {
    intervention: { variable: string; value: number };
    outcome: string;
    observedWorld: Record<string, number>;
  };
  assumptions: string[];
  adjustmentSet: string[];
  computation: {
    method: "deterministic_graph_diff" | "structural_equation_solver";
    affectedPaths: string[];
    uncertainty: "high" | "medium" | "low";
  };
  result: {
    actualOutcome: number;
    counterfactualOutcome: number;
    delta: number;
  };
}
```

Rule: any UI counterfactual claim must include `traceId` and method class.

### 9.3 Hypothesis Lifecycle and Audit Events (new)

```ts
type HypothesisState = "proposed" | "tested" | "falsified" | "retracted";

interface HypothesisAuditEvent {
  hypothesisId: string;
  state: HypothesisState;
  trigger: "generation" | "intervention_result" | "counterfactual_failure" | "manual_review";
  evidenceRef: string[]; // trace IDs, run IDs, dataset refs
  rationale: string;
  timestamp: string;
}
```

Rule: no hypothesis may remain in production recommendations without auditable state.

---

## 10. 12-24 Month Roadmap (Epistemic Priority Order)

### Milestone M1 (Months 0-3): Causal Claim Gating
- Entry criteria: baseline SCM query methods already available.
- Deliverables:
  - identifiability gate service (**implemented**)
  - intervention validation API contract (**implemented**)
  - refusal/degrade policy integration in hybrid/legal/education endpoints (**remaining**)
- Exit criteria:
  - 100% intervention claims pass gate checks
  - zero uncited intervention outputs in audit logs
- Dependencies: registry tables live; env keys configured.
- Rollback expectation: feature-flag gate to warn-only mode if severe false negatives appear.

### Milestone M2 (Months 3-6): Deterministic Counterfactual Tracing
- Entry criteria: M1 complete.
- Deliverables:
  - counterfactual trace schema
  - trace persistence + API retrieval
  - UI trace linking
- Exit criteria:
  - all L3 outputs contain trace IDs
  - no narrative-only counterfactual in production mode
- Dependencies: migration for trace tables.
- Rollback: maintain read-only traces while disabling write path if storage regressions occur.

### Milestone M3 (Months 6-9): Hypothesis Lifecycle Governance
- Entry criteria: M1-M2 complete.
- Deliverables:
  - lifecycle states + audit events
  - automatic demotion on failed falsifier
- Exit criteria:
  - every surfaced hypothesis has explicit state
  - falsified hypotheses no longer appear in recommendation top-N
- Dependencies: persistence schema extension.
- Rollback: fallback to shadow state ledger if write latency spikes.

### Milestone M4 (Months 9-12): Benchmark Oracle Upgrade
- Entry criteria: lifecycle events operational.
- Deliverables:
  - four required suites from Section 7.3
  - CI gate on overclaim and identifiability compliance
- Exit criteria:
  - stable pass rates on real benchmark data
  - benchmark reports include failure-condition ownership
- Dependencies: benchmark credentials, datasets, network policy.
- Rollback: isolate flaky suites; keep non-flaky compliance suites blocking.

### Milestone M5 (Months 12-18): Cross-Domain Causal Integrity
- Entry criteria: upgraded benchmark suite available.
- Deliverables:
  - stronger ontology alignment checks across model domains
  - disagreement engine promoted to mandatory pre-deploy audit for new model versions
- Exit criteria:
  - no high-severity unresolved disagreement atoms at model promotion
- Dependencies: canonical model seeding discipline.
- Rollback: require manual approval override with logged rationale.

### Milestone M6 (Months 18-24): Automated Scientist Candidate Gate
- Entry criteria: M1-M5 complete.
- Deliverables:
  - end-to-end "propose -> test -> falsify/retract" loop
  - scientific integrity dashboard and governance signoff checklist
- Exit criteria:
  - sustained benchmark compliance
  - auditable hypothesis retraction behavior
  - no causal claims without deterministic trace provenance
- Dependencies: ongoing data and operations maturity.
- Rollback: freeze model promotion and revert to supporting-tool mode.

---

## 11. Non-Negotiable Design Principles

1. No intervention claim without identifiability check.
2. No counterfactual claim without explicit trace contract.
3. No confidence display above evidence class.
4. No hypothesis promotion without falsifier.
5. No persistence of "complete" status without benchmark evidence.
6. No benchmark pass based solely on synthetic proxy similarity.
7. No domain template activation without provenance and version pinning.
8. No UI explanation that omits critical assumptions/confounders.
9. No silent fallback from deterministic path to narrative path without status downgrade.
10. No claim-to-code drift: white-paper claims must be continuously diffed against runtime behavior.

---

## 12. 2041 Readiness Scorecard

Scale: 0-5

| Dimension | Score | Rationale |
|---|---:|---|
| Deterministic causal execution | 2.3 | Kernel exists but runtime still often prompt-mediated |
| Identifiability governance | 2.8 | Gate service and intervention validation API are implemented; universal coverage still missing |
| Counterfactual integrity | 2.1 | Deterministic method available, not consistently enforced in features |
| Falsification lifecycle | 1.9 | Contracts/gaps discussed, no full lifecycle state machine |
| Memory integrity | 2.4 | Rejection memory present, poisoning safeguards limited |
| Registry/provenance maturity | 3.4 | Strong schema/services with migration dependency |
| Benchmark scientific validity | 2.2 | Useful harness, many synthetic/proxy suites |
| UX calibration honesty | 2.3 | Some disclaimers, still prone to confidence laundering |

**Weighted overall readiness: 2.43 / 5 (49 / 100).**

Interpretation: promising infrastructure, not yet scientifically autonomous.

---

## 13. Final Pearl Question Answer

If Judea Pearl reviewed this system in 2041, he would likely recognize **serious architectural intent and partial causal scaffolding**, but he would still reject the current form as a full automated scientist because too many L2/L3 outputs depend on narrative generation and heuristic mediation rather than deterministic, auditable causal execution. The path remains legitimate only if the next phases harden identifiability gates, counterfactual traces, falsification lifecycle, and benchmark oracles exactly as outlined above.

---

## Appendix A: Code Evidence Matrix (Ladder + Execution Type)

| Evidence ID | Capability | Ladder evidence | Execution type | Anchor |
|---|---|---|---|---|
| E001 | Chat conversational bypass | L1 only for fast path | LLM-mediated heuristic | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:213` |
| E002 | Chat intervention gate emission | L2 support | Deterministic gate + LLM downstream answer | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:298` |
| E003 | Chat L3 scenario generation | L3 partial/weak | LLM-mediated scenario generation | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/causal-chat/route.ts:438` |
| E019 | Identifiability gate service | L2 governance primitive | Deterministic check against confounders | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/identifiability-gate.ts:39` |
| E020 | Intervention validation API | L2 contract boundary | Deterministic gate API over model registry | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/scm/intervention/validate/route.ts:23` |
| E004 | Causal solver equation gap | L2/L3 gap | Deterministic graph only, no full equations | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-solver.ts:45` |
| E005 | Hybrid SCM-first toggle | L2 partial | Flagged deterministic/heuristic + fallback | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/synthesis-engine.ts:284` |
| E006 | Hypothesis guard do/falsifier/confounder checks | L2 support | Deterministic rule checks | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/hypothesis-guard.ts:37` |
| E007 | Causal output contract uncertainty controls | L1-L2 governance | Deterministic text contract logic | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-output-contract.ts:90` |
| E008 | Legal but-for heuristic-first | L3 partial | Heuristic then LLM | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:92` |
| E009 | Legal LLM counterfactual fallback | L3 partial | LLM-mediated | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/but-for-analyzer.ts:246` |
| E010 | Educational graph personalization | L1-L2 partial | Deterministic heuristics | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/analyze-student/route.ts:163` |
| E011 | Educational intervention simulation | L2 partial | Graph/path heuristic | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/optimize-intervention/route.ts:219` |
| E012 | Educational counterfactual scenarios | L3 weak | Scripted narrative cases | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/optimize-intervention/route.ts:371` |
| E013 | Registry service versioned model retrieval | Kernel maturity | Deterministic DB services | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-registry.ts:108` |
| E014 | Retriever registry-first then legacy fallback | Kernel maturity | Deterministic control path | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-retrieval.ts:222` |
| E015 | Disagreement atom construction | L2/L3 governance support | Deterministic graph comparison + simple intervention effects | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-disagreement-engine.ts:285` |
| E016 | Autopsy root-cause scoring and plan | L3 governance support | Deterministic scoring + optional LLM critique | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-autopsy-mode.ts:159` |
| E017 | Kernel association/intervention/counterfactual ops | L1/L2/L3 primitives | Deterministic graph propagation approximation | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/causal-blueprint.ts:421`, `:443`, `:466` |
| E018 | Benchmark hybrid SCM kernel suite | Governance support | Deterministic tasks + synthetic harness | `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/benchmark-service.ts:799` |

---

## Appendix B: Audit Quality Tests and Results

### B1. Traceability test
- Result: **Pass**
- Every major conclusion in Sections 1-12 includes at least one concrete code path reference under `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`.

### B2. Ladder calibration test
- Result: **Pass with caveat**
- L1/L2/L3 labels in this report are assigned by execution semantics, not prompt text.
- Caveat: codebase UI labels still use heuristic confidence scales in some paths (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/CausalDensityBadge.tsx:142`).

### B3. Determinism test
- Result: **Pass with caveat**
- Deterministic graph operations verified in kernel (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/ai/causal-blueprint.ts:421`).
- Caveat: production feature outputs remain mixed deterministic + LLM.

### B4. Overclaim test
- Result: **Pass (issues detected and flagged)**
- "Complete" white-paper claims not fully matched by runtime behavior are marked governance-critical in Section 5.

### B5. Consistency test against Plan_v2 mandatory outputs
- Result: **Pass**
- Required sections 1-13 are present.
- Requirements matrix and evidence appendices included.

### B6. Baseline guardrail test
- `npm run test`: **not runnable** (no `test` script) (`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/package.json:5`).
- Executed targeted tests:
  - `npx vitest run src/lib/services/__tests__/identifiability-gate.test.ts src/lib/services/__tests__/causal-output-contract.test.ts src/lib/services/__tests__/causal-integrity-service.test.ts src/lib/services/__tests__/causal-literacy.test.ts`
  - `npx tsc --noEmit`
- Result: **4 files passed, 20 tests passed; TypeScript no-emit check passed**.
