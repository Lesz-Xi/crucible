# Risk Register — Bio-Computation Labs

**Version:** 1.0 | **Date:** 2026-02-19 | **Owner:** Synthetic-Mind Engineering

---

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | Pyodide WASM load failure (network/browser restriction) | Medium | High | Graceful degradation to server-side Python fallback; `isOffline` banner shown |
| R-02 | RCSB PDB API rate limit (429) | Low | Medium | Cache PDB data in `lab_experiments.result_json`; exponential backoff in `retry.ts` |
| R-03 | LLM API key exposure via client state | Low | Critical | Server-side header extraction only; no key stored in React state or localStorage |
| R-04 | Docking stub misrepresented as real molecular dynamics | Low | High | ADR-001 documents stub; UI labels all results as "Simulated"; Risk Register entry |
| R-05 | Supabase RLS bypass via crafted experiment ID | Low | Critical | RLS policy on `lab_experiments` enforces `user_id = auth.uid()`; no admin bypass |
| R-06 | Offline queue grows unbounded | Low | Medium | Queue capped at 50 items; oldest items dropped; user notified via error state |

---

*This Risk Register satisfies GAP-3 Step 12 of the Demis Workflow v2 compliance audit.*
