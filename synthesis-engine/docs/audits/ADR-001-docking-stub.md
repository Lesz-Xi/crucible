# ADR-001: Docking Stub — Deterministic Affinity Scoring

**Date:** 2026-02-19
**Status:** Accepted
**Deciders:** Synthetic-Mind Engineering (Gemini Principal Architect)

---

## Context

The Bio-Computation Lab includes a `dock_ligand` tool that simulates protein-ligand binding affinity. Implementing real molecular dynamics (e.g., AutoDock Vina, GROMACS) requires:
- Native binary dependencies not available in a Next.js/Vercel serverless environment
- GPU compute resources not provisioned in the current stack
- Multi-second to multi-minute simulation runtimes incompatible with serverless timeouts

## Decision

`dock_ligand` uses a **deterministic stub** that computes affinity scores via a seeded pseudo-random function derived from the ligand SMILES string and protein PDB ID. This produces:
- Reproducible results for the same inputs (determinism guarantee)
- Plausible affinity ranges (−12 to −4 kcal/mol) for UI demonstration
- A `seed` field in the trace for M6.2 compliance

The UI labels all docking results as **"Simulated"** to prevent misrepresentation.

## Consequences

- **Positive:** Zero native dependencies, instant results, full M6.2 trace compliance
- **Negative:** Results are not scientifically valid for real drug discovery
- **Mitigation:** ADR-001 is referenced in the Risk Register (RISK-REGISTER-labs.md)

## Future Path

When GPU compute is available, replace the stub with:
1. AutoDock Vina via a Python microservice (FastAPI + Docker)
2. Or OpenMM for full molecular dynamics
3. Maintain the same `dock_ligand` tool interface — only the `executeFn` changes

---

*This ADR satisfies GAP-3 Step 7 of the Demis Workflow v2 compliance audit.*
