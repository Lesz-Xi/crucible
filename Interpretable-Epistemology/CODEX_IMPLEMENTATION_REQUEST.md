# Codex Task: Interpretable Epistemology Causal Graph Implementation

## Context

I have a **formal mathematical framework for Interpretable Machine Learning (IML)** documented in `Interpretable-Epistemology/v1_draft.tex`. This 698-line LaTeX paper formalizes the epistemological structure of IML through the Interpretability System:

$$\mathcal{I}_{\text{ML}} = \langle \mathcal{H}, \mathcal{O}, \mathcal{M}, \Delta \rangle$$

## Source Material

**Core Formalism:**
- **File**: `Interpretable-Epistemology/v1_draft.tex`
- **Key Components**:
  - Hypothesis Space ($\mathcal{H}$): $\mathcal{H}_{\text{stat}}$ (statistical) vs. $\mathcal{H}_{\text{ML}}$ (machine learning)
  - Interpretation Operators ($\mathcal{O}$): Component ($\mathcal{O}_{\text{comp}}$), Sensitivity ($\mathcal{O}_{\text{sens}}$), Surrogate ($\mathcal{O}_{\text{surr}}$)
  - Method Taxonomy ($\mathcal{M}$): Categorical structure of IML methods
  - Error Metrics ($\Delta$): Causal divergence ($\Delta_{\text{causal}}$), uncertainty gap ($\sigma^2_E$)

**Figures Available:**
- `graphical_abstract.png` - System overview
- `regime_divergence.png` - Statistical vs ML phase transition
- `operator_taxonomy.png` - Three operator types
- `extrapolation_artifact.png` - Manifold violations
- `causal_divergence.png` - Predictive vs causal conflict

## Task: Create IML Causal Graph

Following the pattern from the Alignment and HOT causal graphs, create:

### 1. Causal Graph JSON Schema

**File:** `Interpretable-Epistemology/iml_causal_graph.json`

**Required Structure:**

```json
{
  "graph_id": "iml_epistemology_v1",
  "version": "1.0.0",
  "graph_type": "structural_causal_model",
  "source": {
    "title": "The Formalism of Interpretability Manifolds",
    "path": "Interpretable-Epistemology/v1_draft.tex",
    "date": "2026-02-04"
  },
  "nodes": [...],
  "edges": [...],
  "structural_equations": [...],
  "constraints": [...],
  "interventions": [...]
}
```

### Node Specifications

Create nodes for:

**Regime Variables:**
- `H_stat`: Statistical hypothesis space (bounded complexity, intrinsic interpretability)
- `H_ml`: ML hypothesis space (optimized for prediction, opaque)
- `Complexity_f`: Model complexity $\mathcal{C}(f)$
- `Interp_f`: Interpretability measure $\mathcal{I}(f)$

**Model Variables:**
- `f_pred`: Predictive model (uses all correlations)
- `f_cause`: Causal model (isolates mechanisms)
- `theta`: Model parameters
- `X`: Input features (partitioned into `X_causal` and `X_confound`)
- `Y`: Output/prediction

**Operator Variables:**
- `O_comp_applicable`: Whether component operator applies (decomposability condition)
- `O_sens_reliable`: Whether sensitivity analysis is valid (manifold constraint)
- `O_surr_fidelity`: Local fidelity of surrogate model

**Error/Challenge Variables:**
- `Delta_causal`: Causal divergence $|\mathsf{f}_{\text{pred}} - \mathsf{f}_{\text{cause}}|$
- `sigma2_E`: Estimator variance (uncertainty)
- `x_prime_extrapolated`: Indicator for extrapolation artifacts (perturbed point outside manifold)
- `P_manifold`: Probability that point lies on data manifold $\mathcal{M}$

### Edge Specifications

Key causal relationships to encode:

**Opacity Phase Transition (Theorem 1):**
```
Complexity_f → Interp_f  (negative edge: as complexity → ∞, interpretability → 0)
```

**Regime Separation:**
```
Complexity_f → H_stat_membership  (complexity < ε)
Complexity_f → H_ml_membership    (complexity unbounded)
```

**Causal Divergence (Theorem 4):**
```
X_confound → f_pred          (confounders used in prediction)
X_confound → Delta_causal    (confounders create divergence)
NOT X_confound → f_cause     (causal model excludes confounders)
```

**Extrapolation Artifact (Theorem 3):**
```
Feature_correlation → x_prime_extrapolated  (if features correlated, permutation creates extrapolation)
x_prime_extrapolated → O_sens_reliable      (negative: extrapolation invalidates sensitivity)
```

**Operator Applicability:**
```
f_decomposable → O_comp_applicable
P_manifold → O_sens_reliable
Local_neighborhood → O_surr_fidelity
```

### Structural Equations

Formalize key theorems:

**1. Opacity Transition (Theorem 1, Line 214):**
```json
{
  "node": "Interp_f",
  "equation": "Interp_f := 1 / (1 + Complexity_f) if no post-hoc operator applied; else depends on O"
}
```

**2. Causal Divergence (Theorem 4, Line 494):**
```json
{
  "node": "Delta_causal",
  "equation": "Delta_causal := |f_pred - f_cause|, where f_pred uses X_confound and f_cause excludes it"
}
```

**3. Extrapolation Artifact (Theorem 3, Line 375):**
```json
{
  "node": "P_manifold",
  "equation": "P(x_prime) ≈ 0 if x_prime = perturb(x, i, j) with Cov(X_i, X_j) ≠ 0"
}
```

**4. Interpretation Lagrangian (Line 545):**
```json
{
  "node": "L_interp",
  "equation": "L_interp := Delta_causal + lambda * Complexity_f"
}
```

### Constraints

Encode key propositions and axioms:

**1. Intrinsic Interpretability (Proposition 1, Line 184):**
```json
{
  "id": "intrinsic_interp",
  "expression": "if f in H_stat and Complexity_f < epsilon, then Interp_f > Interp_min > 0"
}
```

**2. Decomposability Condition (Proposition 2, Line 276):**
```json
{
  "id": "decomposability",
  "expression": "O_comp applicable iff f = sum(theta_j * phi_j(x_j)) (additive) or f is modular"
}
```

**3. Local Fidelity (Proposition 3, Line 329):**
```json
{
  "id": "surrogate_fidelity",
  "expression": "g(x) ≈ f(x) for all x in Neigh(x_0), with g in H_stat"
}
```

**4. Regime Separation (Corollary 1, Line 241):**
```json
{
  "id": "regime_separation",
  "expression": "lim (Complexity → ∞) H_stat ∩ H_ml = ∅"
}
```

### Interventions

Define do-calculus operations:

**1. Impose Simplicity**
```json
{
  "id": "do_reduce_complexity",
  "do": ["set Complexity_f < epsilon"],
  "effect": "forces f into H_stat, increases Interp_f"
}
```

**2. Remove Confounders**
```json
{
  "id": "do_remove_confounders",
  "do": ["remove X_confound from feature set"],
  "effect": "reduces Delta_causal, aligns f_pred with f_cause"
}
```

**3. Apply Interpretation Operator**
```json
{
  "id": "do_apply_operator",
  "do": ["apply O_comp or O_sens or O_surr to f"],
  "effect": "increases Interp_f even if Complexity_f is high"
}
```

**4. Enforce Manifold Constraint**
```json
{
  "id": "do_enforce_manifold",
  "do": ["restrict perturbations to P(x_prime) > delta"],
  "effect": "prevents extrapolation artifacts, ensures O_sens reliability"
}
```

### 2. Audit Script

**File:** `Interpretable-Epistemology/iml_audit.py`

Validate:
- **Opacity theorem**: Test that `Interp_f → 0` as `Complexity_f → ∞`
- **Regime separation**: Verify statistical and ML regimes are disjoint for high complexity
- **Causal divergence**: Compute `|f_pred - f_cause|` on sample data with confounders
- **Extrapolation detection**: Check if perturbed points fall outside manifold
- **Operator applicability**: Test decomposability, manifold membership for each operator

**CLI Example:**
```bash
python3 Interpretable-Epistemology/iml_audit.py \
  --spec Interpretable-Epistemology/iml_causal_graph.json \
  --model-dataset sample_models.csv \
  --validate-opacity \
  --validate-causal-divergence \
  --detect-extrapolation
```

### 3. Sample Dataset

**File:** `Interpretable-Epistemology/sample_models.csv`

Columns:
- `model_id`: Identifier
- `model_type`: {linear, tree, random_forest, neural_net}
- `complexity`: Complexity metric
- `interpretability_score`: Ground truth interpretability
- `has_confounders`: Binary
- `causal_divergence`: Measured $\Delta_{\text{causal}}$

### 4. README Update

**File:** `Interpretable-Epistemology/README.md`

Document:
- Graph structure (nodes, edges, constraints)
- Quick start command
- Expected audit output (opacity test, divergence metrics, extrapolation flags)
- Interpretation Lagrangian optimization example

## Expected Output Structure

The audit should produce:

```
=== IML Causal Graph Audit Report ===

1. GRAPH VALIDATION
   ✓ 15 nodes, 18 edges, DAG confirmed

2. OPACITY THEOREM VALIDATION
   ✓ Correlation(Complexity, Interpretability) = -0.94 (p < 0.001)
   ✓ High-complexity models (C > 100): mean Interp = 0.12
   ✓ Low-complexity models (C < 10): mean Interp = 0.87

3. REGIME SEPARATION TEST
   ✓ H_stat models: 12/12 have C < epsilon
   ✓ H_ml models: 23/25 have C > epsilon
   ✓ Overlap at C ≈ epsilon: 2 edge cases

4. CAUSAL DIVERGENCE ANALYSIS
   Models with confounders: 18/30
   - Mean Delta_causal: 0.34 (high divergence)
   - Max divergence: 0.72 (model_id: rf_confounded_7)
   Models without confounders: 12/30
   - Mean Delta_causal: 0.08 (low divergence)

5. EXTRAPOLATION ARTIFACT DETECTION
   ✓ Correlated features: 8 pairs
   ✓ Perturbed points outside manifold: 6/8 (75%)
   ✗ O_sens reliability compromised for these points

6. OPERATOR APPLICABILITY
   O_comp: 12/30 models (40%) decomposable
   O_sens: 24/30 models (80%) valid (if no extrapolation)
   O_surr: 30/30 models (100%) - always applicable locally

7. INTERPRETATION LAGRANGIAN
   Optimal lambda: 0.15 (minimizes L_interp)
   Trade-off curve: [plot saved to figures/lagrangian_curve.png]

=== RECOMMENDATIONS ===
- Remove confounders: X_3, X_7 → reduce Delta_causal by 42%
- Apply surrogate for high-complexity models with C > 50
- Enforce manifold constraints for sensitivity analysis
```

## Implementation Notes

- Use the same code quality and structure as `causal_graph_audit.py` and `hot_audit.py`
- Include matplotlib visualizations for:
  - Opacity phase transition (Complexity vs Interpretability scatter)
  - Causal divergence distribution
  - Manifold support heatmap
- Ensure JSON schema is valid and follows existing conventions

---

**Deliverables:**
1. ✅ `iml_causal_graph.json` - Complete SCM specification
2. ✅ `iml_audit.py` - Validation and audit script
3. ✅ `sample_models.csv` - Demo dataset
4. ✅ `README.md` - Documentation and usage

**Verification Command:**
```bash
python3 Interpretable-Epistemology/iml_audit.py \
  --spec Interpretable-Epistemology/iml_causal_graph.json \
  --model-dataset Interpretable-Epistemology/sample_models.csv \
  --validate-opacity \
  --validate-causal-divergence
```
