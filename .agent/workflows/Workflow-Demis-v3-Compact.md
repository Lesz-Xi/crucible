# Demis Workflow v3 — Causal Engine Architecture

Extends v2 (Trust-First) with formal contracts, reasoning layers, and verification for a **real Causal Engine** — a system that intervenes and imagines, not just predicts.

## Pearl Causal Hierarchy (PCH)

> Every design decision maps to a PCH layer.

| Layer | Symbolic | Activity | Engine Capability |
|-------|----------|----------|-------------------|
| **L1** | `P(y|x)` | Seeing | Observational inference |
| **L2** | `P(y|do(x),c)` | Doing | Interventions via do-calculus |
| **L3** | `P(y_x|x',y')` | Imagining | Counterfactual reasoning over full SCM |

**CHT**: L1 underdetermines L2; L2 underdetermines L3. Never let observational queries masquerade as causal claims.

## Core Principle

**Ship a system that reasons causally, not one that merely correlates.**

1. **Causal Soundness** — claims at correct PCH layer, never leaking upward
2. **Determinism** — same SCM + inputs → same outputs
3. **Provenance** — traceable to source data + graph + method + PCH layer
4. **Graceful Degradation** — ID failure → explicit weaker claim
5. **Operational Parity** — local/preview/prod aligned
6. Then velocity/polish

## Tri-Module Architecture

**Module A — SCM Graph Manager**: DAG spec, variable registry, mechanism functions, exogenous distributions, versioning.
**Module B — Identification & do-Calculus Engine**: Back-door, front-door, do-calculus Rules 1-3, ID algorithm, d-separation.
**Module C — Estimation & Inference Runtime**: L1 P(y|x), L2 do(x), L3 counterfactual, sensitivity analysis, refutation.
**Provenance Layer**: Query→PCH layer, graph hash, ID strategy, assumptions, refutation results.

## Session Bootstrap (Mandatory)

```bash
npm run agent:bootstrap
# Or: bash /Users/lesz/Documents/Synthetic-Mind/.agent/scripts/agent-bootstrap.sh
```

Read: `session-handoff.json`, `session-handoff.md`
Also load: `causal-graph-registry.json` (active SCMs + assumptions), `identification-cache.json` (resolved ID queries).
Surface `critical_gaps.user_action_required` immediately.

## Reasoning Standard (L1–L4 + C1–C3)

**Engineering**: L1 Impact (render/API/dataflow) · L2 Risk (breaking changes) · L3 Calibration (perf budgets) · L4 Gaps (migrations/env/manual steps). Never skip L4.

**Causal (new)**:
- **C1 Layer Classification** — which PCH layer? Must be explicit before coding.
- **C2 Identification Audit** — identifiable from data + graph? Assumptions? ID strategy or "NON-IDENTIFIABLE" declared.
- **C3 Sensitivity & Refutation** — robust to confounders, misspecification, perturbation? Bounds documented.

Modes: `full` → L1–L4+C1–C3 · `lite` → condensed+C1 · `skip` → deterministic only.

## Architecture Contracts

### Retained (1–5)
1. **Service Boundary** — routes orchestrate; domain logic in shared services; no duplicated persistence.
2. **Deterministic Compute** — deterministic path preferred; versioned (`method`, `methodVersion`, hash).
3. **Provenance** — `ingestionId`, `sourceTableIds[]`, `dataPointIds[]`, `computeRunId?`, `methodVersion`.
4. **Degradation** — enrichment failure ≠ core failure; return warning + structured status.
5. **SSE/Event** — additive only; define event names + stable schema before coding.

### New Causal Contracts (6–10)

**6) SCM Contract** — Every SCM is `M = ⟨U, V, F, P(U)⟩`. Requirements: versioned (`scmId`, `scmVersion`, `graphHash`); typed variables; declared functional forms; DAG as adjacency list; explicit exogenous distributions.

**7) Identification Contract** — Before any estimate: parse estimand → d-separation check → apply strategy (back-door/front-door/do-calculus/IV) → if non-identifiable: HALT with blocking paths. No causal claim without completed identification.

Do-calculus rules: R1 insertion/deletion of observations, R2 action/observation exchange, R3 insertion/deletion of actions — each conditioned on d-separation in mutilated graphs.

**8) PCH Layer Enforcement** — Every result tagged with `pchLayer`, `identificationStrategy`, `assumptions[]`, `refutationStatus`, `scmVersion`. Layer leakage prohibited: L1 cannot answer L2/L3 questions.

**9) Counterfactual Contract** — L3 requires full SCM: Abduction (`P(U|evidence)`) → Action (modify equations) → Prediction (compute under modified model). Declare when L3 is answerable vs. bounds-only.

**10) Refutation & Sensitivity** — Mandatory battery: random common cause, placebo treatment, data subset, Rosenbaum Γ bounds, bootstrap CI. `refutationStatus: "FAILED"` → never surface as confirmed; carry warnings + failed tests.

## Security & Input Safety (Retained)

**RLS**: server-admin client server-only; never expose service-role to client. **Logging**: metadata only. **Input**: max files/size/payload, mime allowlist, timeout, concurrency cap.

## Causal Graph Management

Graphs as versioned JSON: `scmId`, `scmVersion`, `graphHash`, typed endogenous/exogenous variables, edges, structural equations, explicit assumptions. Semver versioning; breaking changes = major bump; all priors retained.

## Causal Discovery Protocol

When graph is unknown: constraint-based (PC, FCI), score-based (GES, NOTEARS), hybrid, human-in-the-loop. Discovered graphs marked `"graphOrigin": "discovered"` with algorithm + confidence. No L2/L3 use without human review.

## Phase-Gated Delivery

| Phase | Key Outputs | Exit Gate |
|-------|-------------|-----------|
| 1. Planning | Mission + C1 layer classification | L1–L4+C1, risks explicit |
| 2. Specification | Contracts + SCM spec | Backward compat; SCM contract satisfied |
| 3. Causal Verification *(new)* | ID audit + testable implications | C2 complete; assumptions signed off |
| 4. Implementation | Code + tests + migrations | Contracts honored |
| 5. Verification | Compile/test/runtime + refutation | All gates pass; C3 documented |
| 6. Sign-off | Checklist artifact | Reviewer approval |

## Hard Gates

**Engineering (1–7)**: tsc --noEmit · vitest · contract tests · migration verified · runtime persistence · degradation validated · env parity confirmed.

**Causal (8–14)**: PCH layer tag on every endpoint · ID strategy documented · refutation suite passes · sensitivity Γ bounds · assumption inventory signed off · layer leakage test passes · graph version = deployed version.

## Critical Gaps — Mark HUMAN FOLLOW-UP REQUIRED

Retained: SQL migration, env vars, deployment config, breaking contract migration.
New: graph needs expert review before L2/L3 · discovered graph needs validation · non-identifiable query needs data/graph refinement.
Always include copy/paste steps.

## Deployment

`npm run build` before push. Checklist: security advisories, no eager env-dependent init, files tracked, scoped commit message, graph registry version matches, no L2/L3 without ID audit.

## Delivery Artifacts

`implementation_plan.md` · `walkthrough.md` · `PHASE_*_SIGNOFF.md`
New: `docs/causal/SCM_SPEC.md` · `IDENTIFICATION_AUDIT.md` · `REFUTATION_REPORT.md`

## Definition of Done

Architecture contracts respected + hard gates green (engineering AND causal) + runtime verified + human follow-ups explicit + every causal claim at correct PCH layer + L2/L3 passed ID and refutation + assumption inventory complete. Missing any → **in progress**.

## Query Flowchart

```
QUERY → C1: Classify PCH Layer
  L1 → standard inference → return
  L2/L3 → Load SCM → C2: Identification
    Non-identifiable → HALT + blocking paths
    Identifiable → Estimate (backdoor/IV/front-door)
      → C3: Refutation Battery (5 tests)
        FAILED → return with WARNING
        PASSED → return with full provenance
                 (PCH tag, ID strategy, assumptions, Γ, SCM version)
```
