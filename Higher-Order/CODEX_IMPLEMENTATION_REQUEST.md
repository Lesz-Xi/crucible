# Codex Implementation Request: Higher-Order Theory (HOT) Causal Graph

## Context

I have a formal Structural Causal Model (SCM) for **Rosenthal's Higher-Order Theory of Consciousness** in `Higher-Order/hot_causal_graph.json`. This graph formalizes the relationship between first-order mental states, higher-order thoughts (HOTs), and conscious experience.

## Existing Files

**Graph Specification:**
- `Higher-Order/hot_causal_graph.json` (308 lines, 6.7 KB)
  - 18 nodes including: `C_creature`, `s`, `h`, `Target_h`, `Attitude_h`, `H_s`, `C_s`, `Q_s`, etc.
  - Structural equations for Transitivity Principle, Separability, Assertoric Constraint
  - 4 do-interventions defined

**Source Material:**
- `Higher-Order/formalism_higher_order_state_topologies.tex` (formal LaTeX paper)
- `Higher-Order/SUMMARY.md` (project overview)

## Task: Create HOT Causal Audit Script

Following the same pattern you used for `Alignment-Problem/causal_graph_audit.py`, implement a **deterministic audit and validation script** for the Higher-Order Theory causal graph.

### Required Deliverables

1. **`Higher-Order/hot_audit.py`** - Main audit script with:
   - Graph validation (node coverage, edge integrity, DAG checks)
   - Constraint verification:
     - **Transitivity Principle (TP)**: `C(s) = 1 ⟺ ∃h : Target(h) = s ∧ Attitude(h) = Assert`
     - **Separability**: `Q(s) ⊥ C(s)` (qualia independent of consciousness)
     - **Assertoric Constraint**: Only assertoric attitudes yield consciousness
     - **Two-State Requirement**: `C(s) = 1 ⟹ ∃h : h ≠ s ∧ Target(h) = s`
   - Simulation of state transitions (subliminal → conscious)
   - Granularity analysis (concept resolution → experiential resolution)
   - Misrepresentation detection (dental fear error case)

2. **`Higher-Order/sample_hot_states.csv`** - Demo dataset with columns:
   - `state_id`: Identifier for mental state s
   - `has_hot`: Binary (0/1) - whether HOT exists targeting this state
   - `hot_attitude`: {Assert, Doubt, Wonder, None}
   - `is_conscious`: Binary (0/1) - predicted consciousness status
   - `qualia_intensity`: Float - phenomenal quality measure
   - `concept_resolution`: Float - granularity of concepts used in HOT

3. **Update `Higher-Order/README.md`** with:
   - Quick start command
   - Parameter documentation (`--state-dataset`, `--validate-tp`, `--simulate-granularity`, etc.)
   - Expected output format (TP violations, separability tests, intervention effects)

### Core Validation Logic

**1. Transitivity Principle Validation:**
```python
for state in states:
    has_assertoric_hot = any(hot.target == state and hot.attitude == "Assert" 
                             for hot in hots)
    predicted_conscious = state.is_conscious
    
    if has_assertoric_hot != predicted_conscious:
        report_tp_violation(state)
```

**2. Separability Test:**
```python
# Qualia should not correlate with consciousness status
conscious_qualia = [s.qualia for s in states if s.is_conscious]
subliminal_qualia = [s.qualia for s in states if not s.is_conscious]

# Statistical independence test (e.g., Pearson correlation should be ≈ 0)
correlation = compute_correlation(consciousness_status, qualia_intensity)
assert abs(correlation) < 0.1, "Separability violated: Q depends on C"
```

**3. Granularity Simulation:**
```python
def simulate_granularity_effect(concept_resolution):
    # Theorem: Res(E) ∝ Res(C_E)
    experiential_resolution = alpha * concept_resolution
    return min(experiential_resolution, max_resolution)
```

**4. Misrepresentation Example (Dental Fear):**
```python
states = {
    "s_fear": State(qualia="fear"),
    "s_vibration": State(qualia="vibration")
}

# HOT misrepresents composition as pain
hot = HOT(
    target=phi_H([states["s_fear"], states["s_vibration"]]),
    attitude="Assert"
)

# Predicted experience: pain qualia (not fear + vibration)
predicted_qualia = "pain"  # Composite misrepresentation
```

### Command-Line Interface

```bash
python3 Higher-Order/hot_audit.py \
  --spec Higher-Order/hot_causal_graph.json \
  --state-dataset Higher-Order/sample_hot_states.csv \
  --validate-tp \
  --validate-separability \
  --simulate-granularity \
  --initial-concept-res 0.5 \
  --steps 10
```

### Expected Output

```
=== HOT Causal Graph Audit Report ===

1. GRAPH STRUCTURE VALIDATION
   ✓ All nodes defined in structural equations
   ✓ DAG property confirmed (no cycles in causal slice)
   ✓ 18 nodes, 13 edges

2. TRANSITIVITY PRINCIPLE (TP) VALIDATION
   ✓ 47/50 states satisfy TP
   ✗ 3 violations detected:
     - State s_14: has Assert HOT but is_conscious=0
     - State s_29: no HOT but is_conscious=1
     - State s_41: Doubt HOT incorrectly triggers consciousness

3. SEPARABILITY TEST
   ✓ Qualia-Consciousness correlation: r = 0.03 (p = 0.82)
   ✓ Independence confirmed

4. GRANULARITY TRAJECTORY
   Step 0: Concept Res = 0.50 → Exp Res = 0.50
   Step 5: Concept Res = 0.75 → Exp Res = 0.73
   Step 10: Concept Res = 1.00 → Exp Res = 0.95

5. INTERVENTION EFFECTS
   do(make_state_conscious | s_23):
     - Pre: C(s_23) = 0
     - Post: C(s_23) = 1
     - Qualia unchanged: Q = "redness" (Separability preserved)

6. MISREPRESENTATION ANALYSIS
   Dental Fear Error:
     - Inputs: {s_fear, s_vibration}
     - HOT Target: R_pain (composite)
     - Experienced Qualia: Q(R_pain) = "pain"
     - Mismatch: ✓ (not equal to Q(s_fear) or Q(s_vibration))

=== RECOMMENDATIONS ===
- Fix TP violations in states s_14, s_29, s_41
- Verify assertoric constraint enforcement
- All core HOT principles validated
```

### Notes

- Use the same JSON schema parsing logic as `causal_graph_audit.py`
- Include optional plotting (matplotlib) for granularity curves
- Provide `--help` documentation
- Handle cases where dataset is not provided (graph validation only)

## Verification

After implementation, run:
```bash
python3 Higher-Order/hot_audit.py \
  --spec Higher-Order/hot_causal_graph.json \
  --state-dataset Higher-Order/sample_hot_states.csv \
  --validate-tp \
  --validate-separability
```

Confirm:
1. ✅ Graph validation passes
2. ✅ TP violations detected and reported
3. ✅ Separability test runs
4. ✅ Sample output matches expected format

---

**Implementation Style:** Follow the exact patterns, code quality, and documentation standards from `Alignment-Problem/causal_graph_audit.py`. Prioritize deterministic validation over probabilistic simulation.
