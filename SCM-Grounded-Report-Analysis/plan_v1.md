
---

# Comprehensive Structured Plan
## Feature: SCM-Grounded Comprehensive Report Analysis (with Brave Retrieval + Honest Framing)

## 0) North Star
Build an Automated Scientist capability that produces **long-horizon, evidence-grounded, SCM-structured reports** while explicitly separating:
- identified causal findings,
- inferred hypotheses,
- and unknowns.

No fake certainty. No “single root cause” theater.

---

## 1) Problem Statement
Current AI analysis systems often:
- overfit to recent headlines,
- conflate correlation and causation,
- and hide uncertainty.

For geopolitical/high-stakes domains, we need a pipeline that is:
- retrieval-rich (Brave),
- causally disciplined (SCM + identifiability),
- and epistemically honest (explicit confidence/failure framing).

---

## 2) Product Scope

### In Scope (v1)
- Brave-powered multi-source retrieval.
- Structured evidence extraction.
- Claim-to-SCM mapping.
- Honest Framing output contract.
- Report generation with falsifier tests.
- UI trust states (verified/heuristic/warning/unknown).

### Out of Scope (v1)
- Fully autonomous world-model building from raw internet.
- Live policy execution or recommendations without human review.
- Perfect causal identification under latent-confounder-heavy settings.

---

## 3) System Architecture

### 3.1 Pipeline
1. **Query Planner**
- Creates base, opposing, historical, and falsifier-oriented queries.
2. **Retrieval Layer (Brave)**
- Pull top K per query.
3. **Fetch & Parse Layer**
- Extract article text + metadata.
4. **Evidence Normalizer**
- Canonicalize entities, events, dates, claims.
5. **Source Scoring**
- Credibility, recency, corroboration, diversity.
6. **SCM Mapper**
- Map claims to nodes/edges/mechanisms.
7. **Identifiability Gate**
- Mark each claim as identified/inferred/associational/insufficient.
8. **Honest Framing Policy**
- Enforce downgrade/uncertainty language.
9. **Report Synthesizer**
- Generate structured report with citations + falsifier tests.
10. **Telemetry + Audit Log**
- Persist why each claim got its confidence/state.

---

## 4) Data Model (Core Contracts)

```ts
type ClaimClass =
| "IDENTIFIED_CAUSAL"
| "INFERRED_CAUSAL"
| "ASSOCIATIONAL_ONLY"
| "INSUFFICIENT_EVIDENCE";

type EvidenceTier = "A" | "B" | "C" | "UNKNOWN";

interface SourceRecord {
sourceId: string;
url: string;
domain: string;
publishedAt?: string;
credibilityScore: number; // 0..1
recencyScore: number; // 0..1
corroborationScore: number; // 0..1
excerpt: string;
}

interface ClaimRecord {
claimId: string;
text: string;
entities: string[];
eventTime?: string;
sourceIds: string[];
evidenceTier: EvidenceTier;
claimClass: ClaimClass;
confidence: number; // 0..1
warningCodes: string[];
falsifierTests: string[];
}

interface ReportMeta {
causalDepth: "verified" | "heuristic";
allowVerified: boolean;
verificationFailures: string[];
unknowns: string[];
generatedAt: string;
}
```

---

## 5) Honest Framing Rules (Hard Policy)

1. `verified` only if all required gates pass.
2. If critical metadata is missing, force heuristic + warning.
3. Every high-impact claim must include:
- evidence tier,
- confidence,
- uncertainty note,
- falsifier.
4. If evidence is sparse/contradictory:
- output “No verified conclusion available.”

### Mandatory warning code set
- `VERIFIED_DOWNGRADED_RUNTIME_GAP`
- `VERIFIED_DOWNGRADED_EVIDENCE_TIER`
- `VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE`
- `VERIFIED_NOT_EVALUATED`
- `UNKNOWN_VERIFICATION_STATE`

---

## 6) Report Output Spec (User-Facing)

1. **Executive Summary** (5–7 bullets)
2. **Causal Map** (drivers → mechanisms → outcomes)
3. **Primary Hypotheses** (ranked + confidence)
4. **Counter-Hypotheses**
5. **Evidence Table** (claim | sources | tier | caveat)
6. **SCM Notes**
- identifiable links
- inferred links
- latent confounders
7. **Falsifier Tests (next 7/30 days)**
8. **Unknowns & Data Gaps**
9. **Decision Guidance**
- what is safe to conclude now
- what is not

---

## 7) Retrieval Strategy (Brave-Specific)

### Query families
- Direct event query
- Historical baseline query (90s/2000s/2010s)
- Opposing narrative query
- Data-only query (institutions, statistics)
- Falsifier query (“what evidence would disprove X?”)

### Source quality controls
- Require minimum domain diversity.
- Penalize duplicate narrative chains.
- Prefer primary statements + reputable reporting + institutional analysis.

---

## 8) SCM Strategy

### 8.1 Model layers
- Structural layer (state capabilities, alliance architecture, sanctions regime)
- Strategic layer (deterrence, doctrine, escalation ladders)
- Trigger layer (specific events, strikes, proxy actions)

### 8.2 Causal rigor
- Mark each edge as:
- observed support
- inferred support
- speculative
- Require intervention/counterfactual checks where feasible.
- Explicitly register latent confounders.

---

## 9) UX / UI Plan

### Key UI surfaces
- Report canvas
- Evidence rail
- Trust/state chips
- “Why downgraded?” drawer
- Falsifier checklist block

### UI behavior
- Never show strong-green verified without policy pass.
- Humanized warning text (no raw enum dump).
- Persistent copy/export controls (prompt + response + report JSON).

---

## 10) Engineering Work Breakdown

### Backend
- Add retrieval orchestrator service (Brave integration).
- Add source normalization + scoring module.
- Add claim extraction + SCM mapping module.
- Add honest-framing policy evaluator.
- Add report composer + telemetry sink.

### Frontend
- Build report viewer with evidence linkage.
- Add trust badge/tooltip + downgrade reason chips.
- Add “unknowns” panel + falsifier panel.
- Add export actions (Markdown/JSON/PDF).

### Infra
- Cache layer for fetched sources.
- Rate-limit + retry controls for Brave calls.
- Feature flagging for staged rollout.

---

## 11) Testing Strategy

### Unit tests (minimum)
- Query expansion correctness
- Source scoring deterministic behavior
- Honest framing downgrade logic
- Claim class assignment
- Humanized warning code mapping

### Integration tests
- End-to-end report generation from Brave results
- Missing metadata fallback
- Contradictory sources handling
- Export integrity (JSON/Markdown)

### Adversarial tests
- Prompt injection in retrieved content
- Biased source concentration
- Fabricated citation attempts

---

## 12) Rollout Plan

### Phase 1: Shadow
- Generate report + framing metadata.
- No strict enforcement on user-facing label.

### Phase 2: Enforced trust
- Enforce verified/heuristic policy in UI and API.
- Block overclaim language.

### Phase 3: Strict governance
- Fail closed on missing critical provenance.
- Add confidence drift monitors + periodic audits.

---

## 13) Risks + Mitigations

1. **Source manipulation / bias**
- Mitigation: diversity scoring + source credibility weighting.
2. **Causal overclaim**
- Mitigation: hard policy + falsifier requirement.
3. **Latency**
- Mitigation: retrieval cache + staged rendering.
4. **Schema drift**
- Mitigation: additive contracts + minimal fallback persistence.
5. **User misinterpretation**
- Mitigation: visible unknowns/caveats and confidence semantics.

---

## 14) Definition of Done

- ✅ End-to-end report generated from Brave retrieval + SCM mapping
- ✅ Honest Framing contract included in every report
- ✅ Verified label impossible without gate pass
- ✅ Warnings human-readable
- ✅ Falsifier tests present for high-impact claims
- ✅ Export formats available
- ✅ Telemetry logs explain claim confidence decisions

---

## 15) First PR Slice Recommendation (smallest high-value)
1. Build **Honest Framing contract + policy evaluator**.
2. Wire into existing report output path.
3. Add UI badge/warning rendering.
4. Add tests proving no false verified emission.

This gives immediate trust gains before full retrieval+SCM expansion.

---
