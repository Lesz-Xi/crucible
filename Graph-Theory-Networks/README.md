# Graph-Theory Networks: Neural Topology SCM

This folder contains a causal implementation of the formalism in `v1_draft.tex` for:

- `N_brain = <G, H, T, Delta>`
- Evolutionary Hamiltonian optimization (`H_evol = alpha * E_glob - beta * C_wire`)
- Small-world regime emergence
- Hub vulnerability and dysconnectivity under targeted attack

## Files

- `neural_topology_causal_graph.json`: Structural Causal Model (nodes, edges, equations, constraints, interventions).
- `neural_topology_audit.py`: Deterministic audit pipeline (graph validation, regime tests, attack simulation, fitted laws, plots).
- `sample_brain_networks.csv`: Demo dataset for Hamiltonian and attack checks.
- `../synthesis-engine/supabase/migrations/20260210_neural_topology_scm_integration.sql`: Supabase migration for MASA canonical SCM registry + legacy fallback + audit report table.
- `v1_draft.tex`: Source mathematical formalization.

## Graph Structure

The SCM is split into four domains:

1. `G` (Geometry): distance-dependent wiring and connection formation.
2. `H` (Hamiltonian): efficiency-cost objective and regime selection.
3. `T` (Topology): clustering, small-world index, degree scaling, structure-function coupling.
4. `Delta` (Pathology): hub deletion, post-perturbation efficiency, dysconnectivity trigger.

## Hamiltonian Optimization and Regimes

The audit validates:

- `beta -> infinity` regime drives lattice-like low-cost topology.
- finite `(alpha, beta)` supports small-world (`sigma > 1`) as balanced optimum.
- `alpha -> infinity` regime drives random high-efficiency, high-cost topology.

## Hub Vulnerability

Attack simulation compares:

- Random deletion (graceful degradation).
- Targeted hub deletion (large `Psi_patho`, fragmentation, dysconnectivity risk).

## Quick Start

```bash
python3 Graph-Theory-Networks/neural_topology_audit.py \
  --spec Graph-Theory-Networks/neural_topology_causal_graph.json \
  --network-dataset Graph-Theory-Networks/sample_brain_networks.csv \
  --validate-hamiltonian \
  --test-regime-transitions \
  --simulate-attacks
```

## Database Integration (MASA Truth Store)

Run migration `synthesis-engine/supabase/migrations/20260210_neural_topology_scm_integration.sql` in your Supabase SQL Editor to register:

- canonical model key: `neural_topology_v1` in `scm_models/scm_model_versions`
- legacy fallback domain: `neuroscience` in `causal_models`
- persisted audit table: `neural_topology_audit_reports`

## Optional Visualizations

When `matplotlib` is available, the audit saves figures under `Graph-Theory-Networks/figures/`:

- `distance_probability_decay.png`
- `hamiltonian_surface.png`
- `degree_distribution_truncated_power_law.png`
- `attack_comparison.png`
- `small_world_regime_diagram.png`

## Expected Audit Output

The report prints:

1. Graph validation (`nodes`, `edges`, DAG status, domain coverage).
2. Distance-cost coupling (`P(a_ij=1) ~ exp(-eta*d_ij)`).
3. Hamiltonian regime validation (lattice / small-world / random).
4. Degree-distribution fit (`P(k) ~ k^-gamma * exp(-k/k_c)`).
5. Attack simulation (`Psi_patho` random vs targeted).
6. Structure-function coupling check (`corr(F_ij, a_ij)`).
7. Small-world optimization summary with best finite `(alpha, beta)` from dataset.
