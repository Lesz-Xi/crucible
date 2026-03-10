# Causal Copilot v1 — Spec + Implementation Plan

## Origin of Idea (for Gemini validation context)
This v1 concept is directly inspired by **Judea Pearl’s podcast framing** (recalled by Chief from ~1 year ago), especially the three practical causal question types:

1. **Intervention effectiveness** — e.g., “How effective is treatment X in preventing outcome Y?”
2. **Attribution / mechanism** — e.g., “Did tax breaks cause sales growth, or was it marketing?”
3. **Counterfactual burden / responsibility** — e.g., “What annual costs are attributable to obesity?”

Design intent: turn those question classes into concrete product features and APIs, while enforcing identifiability and evidence guardrails.

---

## 1) Target
Build a decision-grade causal layer that can answer Pearl-style Q1–Q3 safely and reproducibly.

## 2) Definition of Done (v1)
For each query class, system must:
- Parse natural language into a formal causal query
- Resolve a versioned DAG + assumptions
- Run identifiability check (`identifiable | partially_identifiable | not_identifiable`)
- Estimate effect when identifiable (with diagnostics)
- Return an Evidence Card (answer + assumptions + uncertainty + caveats)
- Explicitly avoid numeric causal claims when not identifiable

## 3) v1 Scope
### In Scope
- Observational tabular data
- Binary/continuous treatment and outcome
- Backdoor-based adjustment
- Basic mediation decomposition (for attribution)
- Counterfactual burden simulation (`do(X=0)` and partial reduction scenarios)

### Out of Scope (v1)
- Full time-varying longitudinal methods (MSM, g-methods)
- General causal discovery from raw data
- Full IV stack (defer to v1.1 unless needed)

---

## 4) Core Components
1. **Query Compiler** (NL → `CausalQuery`)
2. **Graph + Assumption Registry** (versioned DAG, provenance)
3. **Identification Engine** (identifiable? why/why not?)
4. **Estimation Engine** (ATE + subgroup effects + diagnostics)
5. **Counterfactual Simulator** (burden/cost scenarios)
6. **Evidence Card Renderer** (human-safe answer object)

---

## 5) API Contract (v1)
### `POST /causal/query`
Orchestrator endpoint: classifies query, identifies, estimates/simulates, returns Evidence Card.

### `POST /causal/identify`
Returns:
- status (`identifiable | partially_identifiable | not_identifiable`)
- required adjustment set (if available)
- assumptions + blockers

### `POST /causal/estimate`
Runs estimation pipeline and diagnostics.

### `POST /causal/simulate`
Runs burden/cost under intervention scenarios.

### `GET /causal/graphs/:id`
Returns DAG version, assumptions, changelog, provenance.

---

## 6) Minimal Schemas
### `CausalQuery`
- `queryType`: `intervention | attribution | burden`
- `outcome`
- `treatment` or `treatments[]`
- `population` (optional)
- `estimand`: `ATE | CATE | natural_direct | natural_indirect | attributable_fraction | avoidable_cost`

### `EvidenceCard`
- `headlineAnswer`
- `effectEstimate`
- `uncertaintyInterval`
- `identifiabilityStatus`
- `assumptions`
- `diagnostics`
- `sensitivityNote`
- `failureModes`
- `recommendedNextData`

---

## 7) Guardrails (non-negotiable)
- No numeric causal claim when non-identifiable
- Always distinguish observed association vs causal effect
- Confidence labels:
  - `heuristic`
  - `identified_estimate`
  - `validated`
- Diagnostics required before `validated`
- Full provenance: dataset hash, graph version, estimator config

---

## 8) Implementation Plan (4 weeks)

## Week 1 — Foundations
- Define schemas (`CausalQuery`, `IdentificationResult`, `EstimateResult`, `EvidenceCard`)
- Build versioned DAG registry
- Implement Query Compiler v1
- Ship `POST /causal/identify`

**Exit criteria**
- Deterministic identify responses
- Test coverage for parse + identification logic

## Week 2 — Estimation Core
- Ship `POST /causal/estimate`
- Implement baseline estimators (regression adjustment; optional weighting)
- Add diagnostics: overlap, balance, bootstrap CI
- Add provenance logs

**Exit criteria**
- Synthetic benchmark recovers known ATE within tolerance
- No estimate promoted without diagnostics

## Week 3 — Attribution + Burden
- Implement direct vs mediated decomposition (basic)
- Ship `POST /causal/simulate`
- Add attributable fraction + avoidable cost pipeline

**Exit criteria**
- Q2 and Q3 flows produce Evidence Cards
- Non-identifiable paths block overclaims

## Week 4 — Hardening + UX
- Render final Evidence Cards in UI/API
- Enforce language firewall (association vs causation)
- Run adversarial tests (colliders, hidden confounding stress, positivity violations)
- Final docs and demo notebooks

**Exit criteria**
- End-to-end for Q1–Q3
- Guardrails verified by tests

---

## 9) Milestone Scoring (Psycho-Cybernetic)
At each milestone, score 1–10:
- Target alignment
- Causal validity
- Reproducibility
- Overclaim risk (reverse)
- Decision usefulness

Rule: if any score < 7, pause and correct before continuing.

---

## 10) Gemini Review Prompt Seed
Use this context line in Gemini review prompts:

> “This implementation plan is explicitly derived from Judea Pearl’s podcast-style three-question framing: intervention effectiveness, attribution/mechanism, and counterfactual burden. Please audit whether the plan preserves causal identifiability rigor and avoids correlation-overclaim failure modes.”
