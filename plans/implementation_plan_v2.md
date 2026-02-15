# Automated Scientist — Implementation Plan v2 (Execution-Ready)

Date: 2026-02-14  
Owner: Chief + Engineering  
Objective: Build a production-trustworthy Automated Scientist pipeline with deterministic computation, full provenance, and governance-grade reliability.

---

## North Star Outcomes

1. **Deterministic scientific computation** (same input => same output).
2. **End-to-end provenance** from PDF → extracted table → normalized datapoint → compute run → UI claim.
3. **Idempotent ingestion** with file fingerprinting and version-safe reprocessing.
4. **Human trust controls** (confidence thresholds + review workflow + uncertainty states).
5. **Hard CI gates** for integrity and reproducibility.

---

## Phase A — Data Foundations (2–3 days)

### Scope
- Add schema for ingestion lifecycle and scientific data primitives.
- Establish idempotency + ownership + auditability.

### Deliverables
- Migration: `document_ingestions`
  - `id`, `user_id`, `file_name`, `file_hash_sha256`, `status`, `ingestion_version`, `created_at`, `updated_at`
- Migration: `extracted_tables`
  - `id`, `ingestion_id`, `page_number`, `table_index`, `headers_jsonb`, `rows_jsonb`, `confidence`, `parse_status`, `qa_flags_jsonb`, `created_at`
- Migration: `scientific_data_points`
  - `id`, `ingestion_id`, `source_table_id`, `variable_x_name`, `variable_y_name`, `x_value`, `y_value`, `unit_x`, `unit_y`, `metadata_jsonb`, `created_at`
- Migration: `compute_runs`
  - `id`, `ingestion_id`, `method`, `method_version`, `params_jsonb`, `result_jsonb`, `deterministic_hash`, `created_by`, `created_at`

### Rules
- `file_hash_sha256` unique per user + ingestion versioning strategy.
- RLS enabled on all tables with authenticated-user ownership policy.

### Acceptance Criteria
- Re-uploading same file does not duplicate records unintentionally.
- RLS blocks cross-user data access.

---

## Phase B — Extraction Pipeline (4–6 days)

### Scope
- Implement resilient extraction with explicit failure states.

### Deliverables
- `src/lib/extractors/table-extractor.ts`
  - Heuristic extraction from positioned text (`pdfjs-dist`).
  - Confidence + parse status: `parsed | partial | failed`.
- `src/lib/extractors/metadata-extractor.ts`
  - PDF metadata + regex enrichment (DOI, abstract, authors block).
- `src/lib/extractors/pdf-to-markdown.ts`
  - Best-effort readability artifact only (non-canonical).
- Repository methods for persisting extraction outputs.

### Trust Guardrails
- Do not pass low-confidence tables (<0.6) to normalized datapoints by default.
- Record QA flags for borderline parses.

### Acceptance Criteria
- 20-PDF test corpus run with extraction report:
  - Success/partial/fail counts
  - Common failure reasons
  - Confidence distribution

---

## Phase C — Deterministic Compute Engine (2–3 days)

### Scope
- Add reproducible numerical analysis without LLM dependence.

### Deliverables
- `src/lib/services/scientific-compute-engine.ts`
  - `linearRegression()`
  - `trendAnalysis()`
  - `anomalyDetection()`
- Use Node-native deterministic libs (e.g., `mathjs`), not Pyodide as core runtime.
- Standardize rounding/precision policy.
- Persist outputs to `compute_runs` with method version + deterministic hash.

### Acceptance Criteria
- Snapshot tests prove same outputs across repeated runs.
- No random seed dependence.

---

## Phase D — Graph Reasoning + Causal Bridge (3–4 days)

### Scope
- Turn computed outputs into interpretable causal artifacts with provenance links.

### Deliverables
- `src/lib/services/graph-reasoning-engine.ts`
  - Variable mapping from extracted headers
  - Directed relationship candidates
  - Trend + anomaly narrative
- Integrate with existing causal scoring services as annotation layer.
- Every derived claim references source table/datapoint IDs.

### Acceptance Criteria
- For each output claim, provenance trace is queryable end-to-end.

---

## Phase E — UI Review Workflow (3–5 days)

### Scope
- Expose pipeline states and review controls in product surfaces.

### Deliverables
- Evidence Rail sections:
  - Extracted Tables
  - Compute Metrics
  - Provenance Chain
- Human review actions:
  - Approve/reject table extraction
  - Exclude low-confidence data from compute
- Status badges:
  - Parsed / Partial / Failed
  - Deterministic Compute / Review Required

### Acceptance Criteria
- User can inspect and validate origin of each computed insight.

---

## Phase F — Governance + CI Hard Gates (2–3 days)

### Scope
- Enforce integrity and reproducibility as deploy blockers.

### Deliverables
- CI pipeline gates:
  - Vitest pass
  - Typecheck pass
  - Migration drift check
  - Deterministic compute snapshot check
- Operational metrics:
  - Extraction failure rate
  - Confidence distributions
  - Compute latency p50/p95

### Acceptance Criteria
- Production deploy fails on reproducibility or integrity regressions.

---

## P0 Task Checklist (Immediate)

- [ ] Create and apply migrations (A)
- [ ] Add ingestion hash + dedupe logic (A)
- [ ] Implement repository layer for new tables (A)
- [ ] Implement table + metadata extractors with parse status (B)
- [ ] Add 20-PDF extraction benchmark script/report (B)
- [ ] Implement deterministic compute engine with versioned methods (C)
- [ ] Add snapshot tests for deterministic outputs (C)

---

## Risks & Mitigations

1. **Extraction quality variance across PDFs**
   - Mitigation: parse states + QA flags + threshold gating.
2. **Schema drift / migration mismatch**
   - Mitigation: migration-state report in CI.
3. **Performance regressions**
   - Mitigation: async job boundaries + profiling budget.
4. **Trust erosion from opaque claims**
   - Mitigation: mandatory provenance display.

---

## Definition of Done (Automated Scientist v1)

- Deterministic compute is stable and tested.
- Scientific claims are traceable to raw evidence.
- Ingestion is idempotent and secure.
- Human review can override uncertain extraction paths.
- CI prevents integrity regressions from shipping.

---

## Recommended Execution Sequence (Days 1–14)

- **Days 1–3:** Phase A
- **Days 4–7:** Phase B
- **Days 8–9:** Phase C
- **Days 10–11:** Phase D
- **Days 12–13:** Phase E
- **Day 14:** Phase F + release readiness review
