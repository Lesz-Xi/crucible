# Wave 7–8 Implementation Blueprint

**Version:** 1.0.0 | **Date:** 2026-02-24 | **Status:** Draft for Review
**Author:** Gemini, Principal Implementation Architect

---

## 1) Executive Intent

We are building a **two-system Decision Intelligence platform** that enables operators to make better decisions—backed by causal reasoning, traceable evidence, and structured human oversight—deployed as a revenue-generating product within 90 days.

**System 1: The Automated Scientist** (`synthesis-engine`) is the intelligence core—a Next.js 15 application with 71+ services, 51 API routes, causal solvers, SCM registries, and evidence extraction pipelines. It already provides heuristic and verified causal reasoning, counterfactual generation, and scientific analysis.

**System 2: Mission Control** (`mission-control-standalone`) is the orchestration cockpit—a Next.js 16 dashboard (v0.2.0) with operator workflows, decision visualization, and a CLI core. It renders the intelligence into actionable governance UX.

**Why now:** Causal AI is projected to hit mainstream enterprise adoption in 2026, with 62% of enterprises planning to evolve to decision intelligence (Foresight §3, Claim 7.3). A 74% faithfulness gap in current LLM/CoT/RAG pipelines (Foresight §5, Nuance 10) creates urgent demand for systems that separate verified reasoning from plausible-sounding explanations. Our existing causal stack (SCM registry, counterfactual generator, integrity services) gives us a 6–12 month structural lead—but only if we harden the bridge contract, build feedback integrity monitoring, and ship a trust-legible cockpit before the window closes.

**Wave 7 alters priorities** by shifting the bottleneck from model IQ to **state quality + feedback integrity** (Foresight §3, Claim 7.5, Confidence: High). Every service must carry provenance; every optimization loop needs Goodhart drift detection.

**Wave 8 alters priorities** by demanding **coordination architecture**—dissent protocols, plural-objective surfaces, and institutionalized distrust—not as future features, but as architectural foundations poured now.

---

## 2) Strategic Translation Layer

| # | Directive | Reasoning from Report | Repo Owner | Expected Value | Risk if Ignored |
|---|-----------|----------------------|------------|---------------|-----------------|
| D1 | **Harden Causal Registry with DAG versioning & do-calculus interface** | Claim 7.3: 74% faithfulness gap; Insight 2: Causal AI is the missing "Layer 3" (Actionability: 5/5); Nuance 2: Democratization is the bottleneck, not theory | **Synthesis Engine** | Provably differentiated reasoning; verified causal depth on every response | System cannot distinguish verified from heuristic outputs; undead assumptions linger unversioned |
| D2 | **Implement PROV-DM provenance graph on every inference** | Nuance 9: Provenance stripping is existential; §7: "Knowledge without provenance is indistinguishable from hallucination" | **Synthesis Engine** (produce), **Mission Control** (render) | Every claim traceable to source → methodology → confidence; audit-grade transparency | Confident hallucinations shipped to operators; regulatory and trust failure |
| D3 | **Build Feedback Integrity Monitor with Goodhart drift alerting** | Claim 7.5 (Confidence: High); Nuance 3: "Goodhart dynamics are worse in simulation"; Risk 2: Proxy-target correlation breaks silently | **Synthesis Engine** (detect), **Mission Control** (dashboard) | Early warning before proxy diverges from target; prevents optimization theater | Optimization against simulation proxies eventually produces negatively-correlated outcomes |
| D4 | **Activate and implement Bridge Contract v0.1.0** | Existing bridge-spec.md (draft); §7 Design Implications: interoperability is prerequisite | **Shared** | Stable, versioned API between repos; independent deployment; schema drift impossible | Two repos drift apart; integration becomes crisis sprint |
| D5 | **Formalize Dissent/Override Protocols as API + UX** | Nuance 8: Override is leadership, not UX feature; Claim 8.3 (Confidence: High); Insight 5: Institutionalized distrust | **Mission Control** (UX), **Synthesis Engine** (API) | Operators empowered to slow/stop/override; documented dissent patterns auditable | "AI recommends" → "AI decides unless stopped"; career risk for dissenters |
| D6 | **Surface Plural Objective Tradeoffs** | Claim 8.2: PAMA reduces multi-objective to O(n); Insight 7; Nuance 3: Single-objective = Goodhart failure | **Synthesis Engine** (compute Pareto), **Mission Control** (visualize) | Stakeholders see tradeoff surfaces, not hidden scalar rewards; defensible choices | Hidden value priors embedded in ostensibly neutral optimization (objective laundering) |
| D7 | **Build Trust Legibility Interface** | Nuance 10: 74% faithfulness gap; §7: Counterfactual explanations required | **Mission Control** | Non-technical stakeholders can audit reasoning paths; public-trust readiness | Users accept plausible but unfaithful explanations; governance theater |
| D8 | **Formalize Simulation Sandbox with three-layer gap monitoring** | Claim 7.1; Insight 4: Visual/dynamics/transfer gaps need independent solutions; Nuance 1: Gap is epistemological | **Synthesis Engine** | Structured pre-mortem analysis; reality divergence budgets enforced | Models trained on simulation artifacts, not reality structure |

---

## 3) Architecture Plan (2-Repo Topology)

### 3.1 Boundary of Responsibility

```
┌─────────────────────────────────────────┐
│         MISSION CONTROL  (port 4311)    │
│  • Operator Workflows (Ask/Simulate/    │
│    Calibrate)                           │
│  • Decision/Audit Timeline              │
│  • Override & Dissent UX                │
│  • Plural Objective Visualizer          │
│  • Trust Legibility Panels              │
│  • Feedback Integrity Dashboard         │
│  • Governance Policy Overlays           │
│  • Cross-run Monitoring & Alerting      │
│                                         │
│  Stack: Next.js 16, React 19, Zustand,  │
│         Framer Motion, XYFlow           │
└──────────────────┬──────────────────────┘
                   │
          Bridge API (v0.1.0)
          POST /api/bridge/chat-verified
          POST /api/bridge/simulate-verified
          POST /api/bridge/override
          GET  /api/bridge/health
          GET  /api/bridge/provenance/:traceId
          GET  /api/bridge/feedback-integrity
                   │
┌──────────────────┴──────────────────────┐
│       SYNTHESIS ENGINE   (port 3000)    │
│  • Causal Registry (SCM DAGs,           │
│    versioning, do-calculus)             │
│  • Inference/Reasoning Runtime          │
│  • Evidence Extraction + Attribution    │
│  • Provenance Graph (PROV-DM)            │
│  • Counterfactual Generator             │
│  • Simulation Sandbox (gap monitoring)  │
│  • Feedback Integrity Detector          │
│  • Confidence/Uncertainty Outputs       │
│  • Override Recording API               │
│                                         │
│  Stack: Next.js 15, React 19, Supabase, │
│         Anthropic/Gemini SDK, Pyodide,  │
│         mathjs, D3/Three.js             │
└─────────────────────────────────────────┘
```

### 3.2 Bridge Contract Expectations

| Field | Requirement | Source |
|-------|-------------|--------|
| `traceId` | UUIDv7; generated by caller, propagated end-to-end | bridge-spec §8; M6.2 Trace Integrity |
| `requestId` | UUIDv4; request-scoped | bridge-spec §4 |
| `causalDepth` | Enum: `"heuristic"` \| `"verified"` | bridge-spec §4 |
| `evidence[]` | Array with `sourceId`, `title`, `uri`, `snippet`, `methodology`, `confidenceContribution` | PROV-DM alignment (D2) |
| `assumptions[]` | Explicit assumptions used in reasoning | bridge-spec §8 |
| `uncertainty[]` | Identified unknowns | bridge-spec §8 |
| `provenanceHash` | SHA-256 of the full provenance chain | New (D2) |
| `overrideHistory[]` | Array of override events on this trace | New (D5) |
| Schema package | `@synthetic-mind/bridge-types` (shared NPM workspace) | bridge-spec §12 open question → resolved |

### 3.3 Integration Modes

| Mode | Config | Notes |
|------|--------|-------|
| **Local dev** | MC → `http://localhost:3000/api/bridge/*` | Both repos running; `.env.local` |
| **Staging** | MC → `https://staging.synthesis-engine.vercel.app/api/bridge/*` | Vercel preview deploys |
| **Production** | MC → `https://synthesis-engine.vercel.app/api/bridge/*` | Canary → full rollout |

### 3.4 Degradation Behavior

When Synthesis Engine is unavailable:
1. Mission Control shows **degraded mode banner** (amber, not red)
2. Cached last-known responses surfaced with staleness indicator
3. Override/dissent recording continues locally (replayed on reconnection)
4. Health-check polling every 15s; auto-reconnect on recovery
5. Audit trail records: `{ event: "BRIDGE_UNAVAILABLE", timestamp, fallbackUsed: true }`

---

## 4) Capability Roadmap (Wave-Aligned)

### 4.1 Wave 7-Ready Capabilities

#### C1: Evidence Graph (Provenance)
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Every inference response includes `evidence[]` with PROV-DM-compatible fields; Mission Control renders evidence chain with clickable source links; provenance hash verifiable |
| **Dependencies** | Bridge contract v0.1.0 active; `claims-ledger-service.ts` extended |
| **Owner** | Synthesis Engine (produce); Mission Control (render) |
| **Sequence** | D4 → D2 → C1 |

#### C2: Causal Registry
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | SCM DAGs versioned (semver); do-calculus queries via API; causal model diff view; at least 3 domain DAGs seeded |
| **Dependencies** | Existing `scm/models` endpoints; `seed-framework-scms.mjs` script |
| **Owner** | Synthesis Engine |
| **Sequence** | D1 → C2 |

#### C3: Simulation Sandbox
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Pre-mortem analysis endpoint returns `resultClass`, `projectedOutcomes`, three-layer gap scores (visual, dynamics, transfer); reality divergence budget configuration per scenario; never directly optimized against simulation output |
| **Dependencies** | C2 (causal models to simulate against) |
| **Owner** | Synthesis Engine |
| **Sequence** | C2 → D8 → C3 |

#### C4: Feedback Integrity Monitor
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Real-time proxy-target correlation tracking across all verified inference loops; alert when correlation drops below configurable threshold (default: r < 0.6); Goodhart drift dashboard in Mission Control; red-team adversarial test suite on state model inputs |
| **Dependencies** | C1 (provenance to trace which metrics are proxies) |
| **Owner** | Synthesis Engine (detect); Mission Control (dashboard) |
| **Sequence** | C1 → D3 → C4 |

### 4.2 Wave 8-Robust Capabilities

#### C5: Dissent/Override Protocols
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Override API records: who, when, why, what-was-overridden; Mission Control renders override timeline; dissent budget allocated (% of decisions requiring mandatory review); whistle-blowing-safe logging (no attribution without consent) |
| **Dependencies** | D4 (bridge contract with override endpoint) |
| **Owner** | Mission Control (UX); Synthesis Engine (API) |
| **Sequence** | D4 → D5 → C5 |

#### C6: Plural Objective Surfaces
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Multi-objective queries return Pareto frontier (≥2 objectives); Mission Control renders interactive tradeoff surface; stakeholders can explore weighting schemes with "what-if" sliders; no hidden scalar reward |
| **Dependencies** | C3 (simulation results to optimize across) |
| **Owner** | Synthesis Engine (compute); Mission Control (visualize) |
| **Sequence** | C3 → D6 → C6 |

#### C7: Trust Legibility Interface
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Non-technical stakeholders can: (a) trace any recommendation to evidence, (b) see counterfactual explanations ("decision would differ if X"), (c) view faithfulness confidence score; all explanations independently verifiable |
| **Dependencies** | C1 (evidence graph); C5 (override context) |
| **Owner** | Mission Control |
| **Sequence** | C1 + C5 → D7 → C7 |

#### C8: Coordination Protocol Stack
| Attribute | Value |
|-----------|-------|
| **Definition of Done** | Multi-agent handoff protocols documented; conflict resolution escalation path defined; graceful degradation under coordination failure; anti-capture mechanisms (cooling-off periods, sunset clauses) in governance config |
| **Dependencies** | C5 (override infrastructure); C6 (multi-objective) |
| **Owner** | Shared (architectural pattern, not single-repo) |
| **Sequence** | C5 + C6 → C8 (Phase 3, 60–90d) |

---

## 5) Execution Plan (Time-Phased)

### Phase 0: 72 Hours — Foundation

| Deliverable | Repo | Acceptance Test | Demo Artifact |
|-------------|------|-----------------|---------------|
| Bridge contract `v0.1.0` implemented: health check endpoint live, JSON schema package created (`@synthetic-mind/bridge-types`) | Shared | `curl localhost:3000/api/bridge/health` returns `{ "status": "ok", "version": "0.1.0" }` | Health-check response screenshot |
| Mission Control calls Synthesis Engine `chat-verified` endpoint successfully in local dev | Both | MC sends test query → receives response with `traceId`, `causalDepth`, `evidence[]` | End-to-end trace log |
| Dev environment documentation: README update with cross-repo startup instructions | Shared | New developer can start both repos and see bridge communication in < 15 min | README diff |
| Shared error taxonomy implemented in both repos | Shared | MC handles `BRIDGE_UPSTREAM_UNAVAILABLE` gracefully (shows degraded banner) | Degraded-mode screenshot |

### Phase 1: 14 Days — Core Intelligence Layer

| Deliverable | Repo | Acceptance Test | Demo Artifact |
|-------------|------|-----------------|---------------|
| SCM DAG versioning: create, update, diff, rollback via API | SE | `POST /api/scm/models` creates versioned DAG; `GET /api/scm/models/[key]/versions/[v]` retrieves specific version; diff endpoint shows changes between versions | API response showing v1→v2 diff |
| Provenance graph: every `chat-verified` response includes PROV-DM `evidence[]` with `methodology`, `confidenceContribution` | SE | Parse response, verify `evidence[0].methodology` exists; `provenanceHash` matches SHA-256 of evidence chain | Provenance chain JSON |
| Evidence Trail panel in Mission Control: clickable source links, confidence bar, causal depth label | MC | Visual test: panel renders evidence, links are clickable, confidence displayed as colored bar | Panel screenshot |
| Bridge contract tests: JSON schema validation for N and N-1 versions | Shared | `npm run test:bridge-contract` passes in both repos | Test output log |
| `simulate-verified` endpoint activated with causal depth classification | SE | `POST /api/bridge/simulate-verified` returns `resultClass`, `projectedOutcomes`, `causalDepth` | Simulation response JSON |

### Phase 2: 30 Days — Feedback Integrity & Sandbox

| Deliverable | Repo | Acceptance Test | Demo Artifact |
|-------------|------|-----------------|---------------|
| Feedback Integrity Monitor: proxy-target correlation tracking on verified inference loops | SE | Synthetic test: inject proxy drift (r < 0.6) → alert fires within 60s | Alert notification log |
| Goodhart Drift Dashboard in Mission Control | MC | Dashboard shows: current correlation, trend line (30d), threshold alert indicator | Dashboard screenshot |
| Simulation Sandbox with reality divergence budget config | SE | `POST /api/bridge/simulate-verified` includes `gapScores: { visual, dynamics, transfer }`; rejects simulation with expired divergence budget | Gap scores in response |
| Red-team adversarial test suite on state model inputs (≥10 attack vectors) | SE | `npm run test:adversarial-state` passes; covers label-flipping, feature manipulation, stealth corruption | Test summary report |
| Monetization-ready packaging: "Decision Intelligence Audit" service offer documented | Shared | Service description, scope template, pricing bands defined | 1-page service offer PDF |

### Phase 3: 60 Days — Governance Layer

| Deliverable | Repo | Acceptance Test | Demo Artifact |
|-------------|------|-----------------|---------------|
| Override API: `POST /api/bridge/override` records who, when, why; linked to traceId | SE | Override event persisted; retrievable via `GET /api/bridge/provenance/:traceId` showing override in timeline | Override event JSON |
| Dissent/Override UX in Mission Control: override button per recommendation, override timeline, whistle-blowing-safe logging | MC | Operator clicks override → modal captures reason → event logged → timeline updated | Override flow recording |
| Plural Objective Surface: multi-objective query returns Pareto frontier for ≥2 objectives | SE | `POST /api/bridge/simulate-verified` with `objectives: ["revenue", "churn"]` returns Pareto frontier array | Pareto frontier JSON |
| Interactive Tradeoff Visualizer in Mission Control: sliders for objective weighting, Pareto frontier chart | MC | Drag slider → chart updates showing new recommended operating point | Visualizer recording |
| First paid pilot operating: 1 client using Decision Intelligence Audit | Shared | Signed contract; first deliverable completed; client feedback recorded | Client deliverable snapshot |

### Phase 4: 90 Days — Production Readiness

| Deliverable | Repo | Acceptance Test | Demo Artifact |
|-------------|------|-----------------|---------------|
| Trust Legibility Interface: counterfactual explanations, faithfulness score, non-technical audit view | MC | Non-technical tester can trace recommendation → evidence → source in ≤ 3 clicks; can see "what would change if X" | User testing recording |
| Coordination Protocol documentation: handoff procedures, conflict resolution, escalation paths | Shared | Protocol doc covers: trigger → response → escalation → fallback; reviewed by 2 team members | Protocol document |
| Full governance operating cadence running: weekly reviews, decision logs, escalation protocol | Shared | 4 weekly reviews completed; decision log has ≥10 entries; 1 escalation test completed | Review meeting notes |
| SLOs measured and baselined: availability, latency (p50/p95/p99), error rate | Shared | Telemetry dashboard shows 14d of data; SLOs met (99.5% availability, p95 < 3s chat, < 5s simulate) | SLO dashboard screenshot |
| Revenue pipeline: 2–3 pilot clients in pipeline; conversion path to recurring SaaS documented | Shared | Pipeline tracker shows qualified leads; SaaS pricing model reviewed | Pipeline screenshot |

---

## 6) Monetization Plan

### 6.1 Immediate (0–2 Months): Service Revenue

**Offer: Decision Intelligence Audit**

Deliver a structured causal analysis of a client's decision environment using the Synthesis Engine as the intelligence backend and Mission Control as the delivery cockpit.

| Band | Scope | Price | Delivery |
|------|-------|-------|----------|
| **Starter** | Single decision domain; 1 causal model (DAG); pre-mortem report with evidence trail | $2,500 | 5 business days |
| **Professional** | 3 decision domains; counterfactual analysis; simulation pre-mortem; feedback integrity assessment | $7,500 | 10 business days |
| **Enterprise** | Full organizational decision audit; plural-objective tradeoff surface; override protocol design; governance cadence setup | $15,000–$25,000 | 20 business days |

**Delivery Workflow:**
1. Intake call → scope definition → DAG construction
2. Synthesis Engine runs causal analysis + simulation
3. Mission Control renders audit report with evidence trails
4. Client presentation with interactive tradeoff explorer
5. Override/dissent protocol recommendations

### 6.2 Conversion Path (2–6 Months): Service → Product

| Step | Trigger | Action |
|------|---------|--------|
| 1 | Pilot client completes audit | Offer ongoing monitoring subscription |
| 2 | Client asks "can we do this ourselves?" | Offer Mission Control seat license with Synthesis Engine API access |
| 3 | 3+ clients on monitoring | Standardize into SaaS tier: $500/mo (Starter), $2,000/mo (Pro), Enterprise custom |

### 6.3 Stability Requirements Before First Paid Pilot

- [ ] Bridge contract v0.1.0 stable (health check working)
- [ ] `chat-verified` endpoint returning evidence with provenance
- [ ] `simulate-verified` endpoint returning `resultClass` and `projectedOutcomes`
- [ ] Mission Control renders evidence trail panel legibly
- [ ] Degraded mode works (SE down → MC shows banner, not crash)
- [ ] Basic error handling for all `BRIDGE_*` error codes
- [ ] Service offer document with clear scope boundaries

---

## 7) KPI & Instrumentation System

### 7.1 Leading Indicators

| Metric | Measures | Target | Instrument |
|--------|----------|--------|------------|
| **Causal Depth Ratio** | % of responses classified `"verified"` vs `"heuristic"` | ≥40% verified within 30d | Bridge response logging |
| **Evidence Completeness** | Average `evidence[].length` per verified response | ≥3 sources per response | Response telemetry |
| **Proxy-Target Correlation** | Pearson r between proxy metrics and ground-truth outcomes | r > 0.7 (alert at < 0.6) | Feedback Integrity Monitor |
| **Override Usage Rate** | Overrides per 100 verified recommendations | 5–15% (healthy range) | Override API logging |
| **Dissent Response Time** | Time between dissent raised → resolution recorded | < 48h | Override timeline events |
| **Bridge Latency (p95)** | 95th percentile response time for `chat-verified` | < 3,000ms | Request telemetry |
| **Pilot Pipeline** | Qualified leads in active pipeline | ≥3 by day 60 | CRM / tracker |

### 7.2 Lagging Indicators

| Metric | Measures | Target | Instrument |
|--------|----------|--------|------------|
| **Decision Quality** | % of AI-assisted decisions that achieve stated objective within timeframe | ≥70% (vs ~45% unassisted baseline from literature) | Post-decision outcome tracking |
| **Simulation Fidelity** | Delta between simulation prediction and observed outcome | ≤ 20% MAPE | Post-intervention comparison |
| **Feedback Integrity Drift** | Number of Goodhart drift alerts in rolling 30d | < 2 critical alerts / month | Feedback Integrity Monitor |
| **Revenue** | Monthly recurring revenue from services/subscriptions | $5K by month 2; $15K by month 3 | Financial tracking |
| **Pilot Conversion** | % of audit clients converting to monitoring/SaaS | ≥33% | Client tracking |

---

## 8) Risk Register + Controls

### R1: Data Poisoning of State Models

| Attribute | Value |
|-----------|-------|
| **Description** | Adversarial corruption of real-time data feeding causal models (Report: Risk 1, Foresight §8) |
| **Detection Signal** | Anomalous data patterns; sudden accuracy drops; statistical outliers in input feeds |
| **Threshold** | ≥3 anomaly alerts in 24h window OR single >2σ deviation in validated metric |
| **Owner** | Synthesis Engine (detection); Mission Control (alerting) |
| **Mitigation Playbook** | 1) Anomaly detection on all input streams (deployed in Phase 2); 2) Ensemble methods for robustness; 3) Access controls on data pipelines; 4) Provenance hashing prevents silent data swap |

### R2: Goodhart Drift (Feedback Corruption)

| Attribute | Value |
|-----------|-------|
| **Description** | Proxy metrics diverge from true objectives under optimization pressure (Report: Risk 2, Foresight §8; Nuance 3) |
| **Detection Signal** | Proxy improving while ground-truth stagnates; proxy-target r declining over time |
| **Threshold** | Proxy-target r < 0.6 (warning) / r < 0.4 (critical, halt optimization loop) |
| **Owner** | Synthesis Engine (Feedback Integrity Monitor) |
| **Mitigation Playbook** | 1) Never optimize directly against simulation; 2) Multiple independent metrics tracked; 3) Periodic ground-truth audits (30d cadence); 4) Optimization budget caps |

### R3: Sim-to-Real Divergence

| Attribute | Value |
|-----------|-------|
| **Description** | Simulation results learn artifacts of the model rather than reality patterns (Report: Risk 3, Foresight §8; Nuance 1) |
| **Detection Signal** | Performance degrades at deployment; strategies exploit model quirks; high sensitivity to simulation-only parameters |
| **Threshold** | Any of: visual gap > 0.3 / dynamics gap > 0.3 / transfer gap > 0.5 (normalized scores) |
| **Owner** | Synthesis Engine (Simulation Sandbox) |
| **Mitigation Playbook** | 1) Three-layer gap monitoring (visual, dynamics, transfer); 2) Reality divergence budgets per scenario; 3) Mandatory sim-to-real validation before deployment recommendations; 4) Reality re-anchoring every 14d |

### R4: Schema Drift Between Repos

| Attribute | Value |
|-----------|-------|
| **Description** | Synthesis Engine and Mission Control evolve API contracts independently, causing silent breakages |
| **Detection Signal** | Bridge contract test failures; deserialization errors; `BRIDGE_SCHEMA_MISMATCH` errors |
| **Threshold** | Any test failure on PR merge |
| **Owner** | Shared (bridge contract CI) |
| **Mitigation Playbook** | 1) Shared `@synthetic-mind/bridge-types` package; 2) Contract tests run in both CI pipelines; 3) N/N-1 version compatibility; 4) 14-day deprecation notice for breaking changes |

### R5: Objective Laundering

| Attribute | Value |
|-----------|-------|
| **Description** | Hidden value priors embedded in optimization targets, causing coordination to serve undisclosed goals (Report: Risk 5, Foresight §8; Insight 9) |
| **Detection Signal** | Systematic bias favoring specific outcomes; behavioral testing inconsistent with stated objectives |
| **Threshold** | Bias audit detects >15% directional skew in recommendations |
| **Owner** | Synthesis Engine (alignment audit); Mission Control (display audit results) |
| **Mitigation Playbook** | 1) Explicit Pareto surfaces (no hidden scalar rewards); 2) Independent third-party alignment audits quarterly; 3) All objective functions documented and version-controlled; 4) Counterfactual testing: "what if objectives were weighted differently?" |

### R6: Governance Deadlock

| Attribute | Value |
|-----------|-------|
| **Description** | Multiple stakeholders with incompatible requirements block collective action (Report: Risk 6, Foresight §8) |
| **Detection Signal** | Escalating coordination rounds; declining consensus; veto mechanism overuse |
| **Threshold** | Decision stalled >7d with >2 escalation attempts |
| **Owner** | Mission Control (governance cadence enforcement) |
| **Mitigation Playbook** | 1) Tiered governance: routine → algorithmic, contested → committee, crisis → designated authority; 2) Mandatory response deadlines with default actions; 3) Independent arbitration mechanism; 4) Graceful degradation: safe fallback that doesn't require consensus |

---

## 9) Governance & Operating Cadence

### 9.1 Weekly Operating Review Template

```
# Weekly Review — [DATE]

## 1. Metrics Snapshot (5 min)
- Causal Depth Ratio: ____%
- Evidence Completeness: ____ avg sources
- Proxy-Target Correlation: r = ____
- Override Usage: ____%
- Bridge Latency p95: ____ms
- Open Issues: ____

## 2. Progress vs Plan (10 min)
- Current phase: [0/1/2/3/4]
- Completed this week: [list deliverables marked [x]]
- Blocked items: [list with owner + unblock action]

## 3. Risks & Incidents (5 min)
- New risks identified: [list]
- Goodhart drift alerts: [count + disposition]
- Override events: [count + summary]

## 4. Decisions Required (10 min)
- [Decision]: [Options] → [Chosen] / [Deferred to ____]

## 5. Next Week Priorities (5 min)
- [Priority 1 with owner]
- [Priority 2 with owner]
```

### 9.2 Decision Log Format

```
| Date | Decision | Context | Options Considered | Chosen | Rationale | Owner | Outcome (retrospective) |
|------|----------|---------|--------------------|--------|-----------|-------|------------------------|
```

### 9.3 Escalation Protocol

| Level | Trigger | Response | Responder | SLA |
|-------|---------|----------|-----------|-----|
| **L0: Auto** | Bridge health check fails | Auto-retry 3x → degraded mode | System | < 30s |
| **L1: Alert** | Goodhart drift warning (r < 0.6) | Investigate; document findings | On-call engineer | < 4h |
| **L2: Escalate** | Critical drift (r < 0.4) OR override on high-confidence recommendation | Halt optimization loop; convene review | Tech lead + domain expert | < 24h |
| **L3: Crisis** | Data poisoning detected OR simulation recommendation caused real-world harm | Full system pause; root-cause analysis; stakeholder notification | Project lead + all hands | < 4h |

### 9.4 Kill / Pivot Criteria

| Signal | Threshold | Action |
|--------|-----------|--------|
| Bridge latency consistently > 10s p95 for 7d | Re-architecture required | Investigate caching / async bridge; pivot to event-driven bridge if needed |
| Zero pilot clients after 60d of active outreach | Market signal negative | Pivot: reposition from "Decision Intelligence" to "AI Audit" (compliance angle) |
| Goodhart drift alerts > 5/month sustained | Feedback integrity model not working | Halt automated recommendations; retreat to advisory-only mode |
| Core maintainer leaves with no knowledge transfer | Bus factor = 0 | Immediate documentation sprint; pause feature work until KT complete |

---

## 10) Final Output Artifacts

### 10.1 Prioritized Backlog

#### P0 — Must Ship (72h–14d)

- [ ] `[SE]` Bridge health endpoint: `GET /api/bridge/health`
- [ ] `[Shared]` Bridge types package: `@synthetic-mind/bridge-types`
- [ ] `[SE]` `POST /api/bridge/chat-verified` live with provenance fields
- [ ] `[MC]` Bridge client: call SE health + chat-verified from MC
- [ ] `[MC]` Degraded mode banner on bridge failure
- [ ] `[SE]` SCM DAG versioning: create, diff, rollback
- [ ] `[SE]` PROV-DM evidence fields on every verified response
- [ ] `[MC]` Evidence Trail panel (clickable sources, confidence bar)
- [ ] `[Shared]` Bridge contract tests (JSON schema N/N-1)

#### P1 — Core Value (14d–30d)

- [ ] `[SE]` `POST /api/bridge/simulate-verified` with `resultClass`, gap scores
- [ ] `[SE]` Feedback Integrity Monitor (proxy-target correlation tracker)
- [ ] `[MC]` Goodhart Drift Dashboard
- [ ] `[SE]` Simulation Sandbox: divergence budgets, three-layer gap scores
- [ ] `[SE]` Red-team adversarial test suite (≥10 attack vectors)
- [ ] `[Shared]` Decision Intelligence Audit service offer documentation

#### P2 — Governance & Scale (30d–90d)

- [ ] `[SE]` Override API: `POST /api/bridge/override`
- [ ] `[MC]` Override UX: button, modal, timeline
- [ ] `[SE]` Multi-objective Pareto frontier computation
- [ ] `[MC]` Interactive Tradeoff Visualizer
- [ ] `[MC]` Trust Legibility Interface (counterfactual, faithfulness score)
- [ ] `[Shared]` Coordination Protocol documentation
- [ ] `[Shared]` Full governance cadence running (weekly reviews, decision logs)
- [ ] `[Shared]` SLO measurement and baselining

### 10.2 Milestone Checklist

- [ ] **M1 (72h):** Bridge alive — health check responds, cross-repo communication verified
- [ ] **M2 (14d):** Intelligence layer — verified chat with provenance, SCM versioning, evidence panel
- [ ] **M3 (30d):** Feedback integrity — drift detection, simulation sandbox, first service offer
- [ ] **M4 (60d):** Governance layer — overrides, dissent, multi-objective, first paid pilot
- [ ] **M5 (90d):** Production-ready — trust legibility, SLOs met, 2–3 pipeline clients, governance cadence operating

### 10.3 One-Page Operator Command Sheet

```
╔══════════════════════════════════════════════════════════════════╗
║            SYNTHETIC-MIND — OPERATOR COMMAND SHEET              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  START DEV ENVIRONMENT                                          ║
║  ├─ Synthesis Engine: cd synthesis-engine && npm run dev         ║
║  └─ Mission Control:  cd mission-control-standalone && npm run dev║
║                                                                  ║
║  VERIFY BRIDGE                                                   ║
║  └─ curl http://localhost:3000/api/bridge/health                ║
║                                                                  ║
║  RUN GOVERNANCE CHECKS                                          ║
║  ├─ npm run governance:claim-drift                              ║
║  ├─ npm run governance:uncertainty-cal                           ║
║  ├─ npm run governance:causal-method                            ║
║  └─ npm run validate:all                                        ║
║                                                                  ║
║  RUN TESTS                                                       ║
║  ├─ SE: npm run test                                            ║
║  ├─ SE: npm run test:scientific-integrity                       ║
║  └─ Bridge: npm run test:bridge-contract                        ║
║                                                                  ║
║  MONITOR (Mission Control Dashboard)                            ║
║  ├─ Causal Depth Ratio → target: ≥40% verified                 ║
║  ├─ Evidence Completeness → target: ≥3 sources/response        ║
║  ├─ Proxy-Target Correlation → alert: r < 0.6                  ║
║  └─ Override Rate → healthy: 5-15%                              ║
║                                                                  ║
║  ESCALATION                                                      ║
║  ├─ L0: System auto-handles (retry + degrade)                  ║
║  ├─ L1: Alert → On-call investigates (< 4h)                    ║
║  ├─ L2: Halt optimization → Review (< 24h)                     ║
║  └─ L3: Full pause → Root-cause → Notify (< 4h)               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Red-Team Audit

### Attack 1: "The bridge contract creates a single point of failure"
**Attack:** If Synthesis Engine goes down, Mission Control becomes a pretty but useless dashboard. Revenue stops.
**Assessment:** Partially valid. Mission Control *does* depend on SE for intelligence.
**Survivability:** **Survived with adjustment.** The degraded mode design (§3.4) mitigates this with cached responses, staleness indicators, and local override recording. Design adjustment: add a **fallback heuristic engine** embedded in Mission Control that provides basic (non-verified) responses using cached DAGs when bridge is unavailable. Mark these as `causalDepth: "heuristic-fallback"`.

### Attack 2: "The monetization timeline is too aggressive — 60 days to first pilot is unrealistic"
**Attack:** Building both the intelligence layer AND selling it simultaneously splits focus. Revenue pressure leads to premature deployment (Scenario 3 from report).
**Assessment:** Valid concern. The service model requires less than full product maturity.
**Survivability:** **Survived, slightly weakened.** The service model deliberately uses the *current* causal stack (which is already mature). The service offer is essentially "we run our existing tools on your problem"—not "we build new features for you." The 60-day target is for the first *pilot*, not the first *product*. Adjustment: explicitly budget 30% time for service delivery starting day 30, separate from engineering.

### Attack 3: "Goodhart drift detection is itself subject to Goodhart dynamics"
**Attack:** If the team is measured on "number of Goodhart alerts detected," they'll tune the detector to find more false positives. The detector's proxy (correlation threshold) can itself diverge from the true goal (actual feedback integrity).
**Assessment:** Deeply valid (meta-Goodhart). This is the "who watches the watchers" problem.
**Survivability:** **Weakened but standing.** The mitigation is structural: correlation thresholds are validated against *ground-truth outcomes*, not self-referential metrics. Design adjustment: add periodic **external audits** where a third party reviews detection accuracy; never optimize the detector against its own alert count.

### Attack 4: "Override protocols won't be used — automation bias is stronger than UX"
**Attack:** Research shows humans defer to statistical authority (Foresight Nuance 8). No matter how good the override button looks, operators won't click it.
**Assessment:** Valid and directly supported by the report.
**Survivability:** **Survived with critical adjustment.** The design already includes institutional support (whistle-blowing-safe logging, protected dissent). Additional adjustment: implement **mandatory review gates** for high-consequence recommendations — not just optional override buttons. Make the system *require* human sign-off above a configurable consequence threshold, transforming override from opt-in to opt-out.

### Attack 5: "Evidence completeness metric can be gamed by surfacing more low-quality sources"
**Attack:** If evidence completeness is measured as `evidence[].length`, the system can boost this by including marginally relevant sources, diluting signal with noise.
**Assessment:** Valid. Count-based metrics are easily gamed.
**Survivability:** **Survived with redesign.** Replace count-based metric with **evidence quality score**: relevance × confidence × methodological rigor, averaged over sources. Minimum quality threshold per source (below threshold → excluded from count). Track both quantity and quality independently.

---

## Assumptions vs Validated Facts

| Category | Item | Status |
|----------|------|--------|
| **Validated** | Synthesis Engine has 71+ services, 51 API routes, functional causal stack | Confirmed via codebase audit |
| **Validated** | Mission Control is v0.2.0 with 8 React components and CLI core | Confirmed via codebase audit |
| **Validated** | Bridge spec draft exists with 3 endpoints defined | Confirmed via `bridge-spec.md` |
| **Validated** | SE runs Next.js 15 on Turbopack; MC runs Next.js 16 on port 4311 | Confirmed via `package.json` |
| **Assumption** | Bridge contract can be implemented within 72h using existing SE route infrastructure | Based on SE already having 51 API routes; assumes no auth complexity |
| **Assumption** | First pilot client reachable within 60d | Assumes existing network/pipeline; no validated demand signal yet |
| **Assumption** | PROV-DM fields can be added to existing `evidence[]` without breaking consumers | SE response contract under our control; no external consumers identified |
| **Assumption** | Three-layer gap scoring (visual, dynamics, transfer) applicable to our decision domains | Report evidence primarily from robotics/physics; organizational domains untested |

---

## Rejected Alternatives

| Option | Rejected Because | Report Evidence |
|--------|-----------------|-----------------|
| **Monorepo** (merge SE + MC into one repo) | Violates separation of concerns; prevents independent deployment; makes the bridge contract invisible | §7: Design for interoperability and graceful degradation |
| **Skip Wave 8 capabilities, focus only on Wave 7** | Coordination architecture must be poured as foundation, not bolted on later; architectural decisions made now constrain Wave 8 readiness | Foresight §6, Nuance 12: "Coordination failure is the natural state" |
| **Build custom LLM fine-tuning for causal reasoning** | Wrong bottleneck — the constraint is democratization and middleware, not model capability (Nuance 2); causal AI theory is mature | Foresight §5, Nuance 2: "Only 10–15% in production; requires PhD-level teams" |
| **Event-driven bridge (Kafka/NATS) instead of REST** | Over-engineering for current scale; REST with SSE streaming satisfies latency SLOs; reintroduce when multi-consumer pattern emerges | Pragmatic engineering judgment; no report evidence against REST |
| **Start with SaaS product instead of services** | Premature productization without demand validation; services provide revenue + learning simultaneously | Foresight §10 Action Playbook: prototype first; validate demand |

---

*Blueprint compiled 2026-02-24. All estimates are preliminary and will be refined after Phase 0 baseline measurement. Report references cite [Wave-7-8-Strategic-Foresight.md](file:///Users/lesz/Documents/Synthetic-Mind/Mission_Control_Automated_Scientist/Wave-7-8-Strategic-Foresight.md) sections and claim numbers.*
