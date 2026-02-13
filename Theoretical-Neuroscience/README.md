# Theoretical Neuroscience: Neural Dynamics SCM

This folder implements a structural causal model (SCM) for the neural tuple:

- `N = <B, D, I, L>`
- `B`: biophysical substrate (cable equation, Hodgkin-Huxley, LIF)
- `D`: network dynamics (Wilson-Cowan, eigenvalue stability, Boltzmann energy)
- `I`: information metrics (encoding/decoding, Fisher information, Cramer-Rao bound)
- `L`: learning operators (Hebbian/Oja/BCM, TD error, EM free-energy optimization)

## Files

- `neural_dynamics_causal_graph.json`: full SCM (nodes, edges, equations, constraints, interventions).
- `neural_dynamics_audit.py`: deterministic audit script with simulation-backed validation.
- `sample_neural_data.csv`: demo dataset for stability, information, and learning checks.

## Graph Structure

The causal graph encodes:

- 4 domain blocks (`B`, `D`, `I`, `L`) plus a unifying `L_neural` variational node.
- Intra-domain mechanisms:
  - Cable + Hodgkin-Huxley voltage/gating feedback.
  - Wilson-Cowan E/I population dynamics and `M -> eigenvalue_M -> network_state` determinism.
  - Encoding/decoding and `Fisher_I -> var_s_hat` inequality channel.
  - Oja, BCM, TD, and EM operators over synaptic weights.
- Cross-domain couplings:
  - `B -> D`: `firing_rate -> {v_E, v_I}`
  - `D -> I`: `{v_E, v_I, network_state} -> {r, coding_efficiency}`
  - `I -> L`: `Fisher_I -> eta_learn`
  - `L -> D/B`: `w -> {W_**, M, eigenvalue_M, g_Na, g_K}`

## Key Theorems and Constraints

- Cramer-Rao bound: `var(s_hat) >= 1 / I(s)`.
- Oja convergence theorem: `w` converges to principal eigenvector of `C_input`.
- TD convergence objective: value estimates approach Bellman fixed point.
- Network stability criterion: all `Re(lambda_nu) < 1` for stable regime.

## Quick Start

```bash
python3 Theoretical-Neuroscience/neural_dynamics_audit.py \
  --spec Theoretical-Neuroscience/neural_dynamics_causal_graph.json \
  --validate-biophysics \
  --validate-network-stability \
  --validate-information-bounds \
  --validate-learning-convergence
```

Optional:

```bash
python3 Theoretical-Neuroscience/neural_dynamics_audit.py \
  --spec Theoretical-Neuroscience/neural_dynamics_causal_graph.json \
  --validate-biophysics \
  --validate-network-stability \
  --validate-information-bounds \
  --validate-learning-convergence \
  --plot-all \
  --out Theoretical-Neuroscience/neural_dynamics_audit_report.json
```

## Audit Output Sections

The script prints a deterministic report with:

1. Graph validation (schema integrity, DAG causal slice, domain coverage).
2. Biophysical checks (cable constants, HH waveform dynamics, LIF f-I slope).
3. Network checks (stable/oscillatory/unstable regimes, line attractor persistence, eigenvalue-state consistency).
4. Information checks (Fisher information, Cramer-Rao saturation, mutual information).
5. Learning checks (Oja convergence, TD error decay, EM free-energy/log-likelihood monotonicity).
6. Cross-domain link audit (`B -> D -> I -> L` and feedback pathways).

## Expected Plot Artifacts

When `--plot-all` is enabled and `matplotlib` is available, figures are saved to `Theoretical-Neuroscience/figures/`:

- `hodgkin_huxley_waveform.png`
- `wilson_cowan_phase_plane.png`
- `fisher_vs_variance.png`
- `oja_convergence.png`
- `td_error_decay.png`
