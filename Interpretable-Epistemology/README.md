# Interpretable Epistemology: Causal Graph + Audit

This folder contains a Structural Causal Model (SCM) artifact for the IML formalism:

- Interpretability system: `I_ML = <H, O, M, Delta>`
- Core regimes: `H_stat` (bounded complexity, intrinsic interpretability) vs `H_ml` (prediction-optimized, opaque)
- Core error channels: `Delta_causal`, `sigma2_E`, extrapolation outside manifold

## Files

- `iml_causal_graph.json`: machine-readable SCM (nodes, edges, equations, constraints, interventions)
- `iml_audit.py`: deterministic audit tool for theorem-level checks and diagnostics
- `sample_models.csv`: demo dataset for opacity/divergence/operator tests
- `v1_draft.tex`: source formalism used for graph construction

## Graph Structure

`iml_causal_graph.json` encodes:

- Regime variables: `H_stat`, `H_ml`, membership indicators, `Complexity_f`, `Interp_f`
- Model variables: `f_pred`, `f_cause`, `theta`, `X`, `X_causal`, `X_confound`, `Y`
- Operator variables: `O_comp_applicable`, `O_sens_reliable`, `O_surr_fidelity`
- Challenge variables: `Delta_causal`, `sigma2_E`, `P_manifold`, `x_prime_extrapolated`, `L_interp`

Key encoded relationships include:

- Opacity transition: `Complexity_f -> Interp_f` (negative)
- Regime split by complexity threshold `epsilon`
- Causal divergence from confounders: `X_confound -> f_pred -> Delta_causal`
- Extrapolation artifact: `Feature_correlation -> x_prime_extrapolated -> O_sens_reliable`
- Lagrangian objective: `L_interp := Delta_causal + lambda * Complexity_f`

## Quick Start

Run the full audit:

```bash
python3 Interpretable-Epistemology/iml_audit.py \
  --spec Interpretable-Epistemology/iml_causal_graph.json \
  --model-dataset Interpretable-Epistemology/sample_models.csv \
  --validate-opacity \
  --validate-regime-separation \
  --validate-causal-divergence \
  --detect-extrapolation \
  --validate-operators \
  --optimize-lagrangian
```

Verification command from request:

```bash
python3 Interpretable-Epistemology/iml_audit.py \
  --spec Interpretable-Epistemology/iml_causal_graph.json \
  --model-dataset Interpretable-Epistemology/sample_models.csv \
  --validate-opacity \
  --validate-causal-divergence
```

## Expected Audit Output

The script prints a deterministic report with these sections:

1. Graph validation (node/edge integrity, DAG check)
2. Opacity theorem validation (`Corr(Complexity, Interp)` + high/low complexity means)
3. Regime separation test (`H_stat`/`H_ml` threshold compliance + overlap edge cases)
4. Causal divergence analysis (with/without confounders)
5. Extrapolation artifact detection (outside-manifold ratio and `O_sens` reliability)
6. Operator applicability rates (`O_comp`, `O_sens`, `O_surr`)
7. Interpretation lagrangian optimization (`lambda*` from sweep)

## Visualization Outputs

Generate all plots:

```bash
python3 Interpretable-Epistemology/iml_audit.py \
  --spec Interpretable-Epistemology/iml_causal_graph.json \
  --model-dataset Interpretable-Epistemology/sample_models.csv \
  --validate-opacity \
  --validate-causal-divergence \
  --detect-extrapolation \
  --optimize-lagrangian \
  --plot-all
```

Outputs are saved under `Interpretable-Epistemology/figures/`:

- `opacity_phase_transition.png`
- `causal_divergence_distribution.png`
- `manifold_support_heatmap.png`
- `lagrangian_curve.png`

If `matplotlib` is not installed, the audit still completes and records plot-skip reasons in JSON output.

## Interpretation Lagrangian Example

Run a denser lambda sweep:

```bash
python3 Interpretable-Epistemology/iml_audit.py \
  --spec Interpretable-Epistemology/iml_causal_graph.json \
  --model-dataset Interpretable-Epistemology/sample_models.csv \
  --optimize-lagrangian \
  --lambda-min 0.00 \
  --lambda-max 0.40 \
  --lambda-step 0.005 \
  --plot-lagrangian
```

This reports the `lambda` that minimizes mean `L_interp` over the dataset and saves the trade-off curve.

## Database Integration

The IML graph is now integrated into MASA's Supabase Truth Store via:

- `synthesis-engine/supabase/migrations/20260210_iml_epistemology_integration.sql`

### USER ACTION REQUIRED

Apply the migration in your `synthesis-engine` environment so MASA can retrieve the model from DB:

```bash
cd synthesis-engine
supabase db push
```

After migration:

- canonical registry model key: `iml_epistemology_v1`
- canonical domain lookup: `iml`
- legacy fallback domain: `iml`
