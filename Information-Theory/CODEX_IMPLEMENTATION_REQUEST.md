# CODEX IMPLEMENTATION REQUEST: Integrated Information Theory (IIT) Causal Graph

**Target Model**: GPT-5.2 Codex  
**Framework**: Integrated Information Theory (Tononi & Boly)  
**Output Directory**: `Information-Theory/`  
**Date**: February 4, 2026

---

## Source Material

**Primary Reference**: "Integrated Information Theory: Foundations of Conscious Existence" (PDF in this directory)

**System Tuple**:
$$\mathcal{U}_{IIT} = \langle \mathcal{S}, \mathbf{P}, \Phi, \mathcal{O} \rangle$$

**Components**: 
- **S**: Physical Substrate (finite set of units, typically neurons)
- **P**: Transition Probability Matrix (system dynamics, Markov chain)
- **Φ** (Phi): Integration Measure (irreducibility quantification, scalar ≥ 0)
- **O**: Ontological Operator (unfolding function F: S_state → Ω)

**Key Identity**:
$$\mathcal{E} \equiv \Omega_\Phi$$
Experience (phenomenology) IS Cause-Effect Structure (mechanism)

**Figures Available**:
- `graphical_abstract.png` - 4-quadrant U_IIT framework
- `axiom_postulate_map.png` - 5 axioms → 5 postulates mapping
- `topology_comparison.png` - Grid vs modular Φ inequality
- `ontological_exclusion.png` - "Great Divide of Being" (Φ > 0 vs Φ = 0)
- `unfolding_operator.png` - F: (S, s₀) → Ω transformation

---

## Image Audit Analysis

### Figure 1: Graphical Abstract (4-Quadrant Framework)

**Visual Structure**: Four-panel diagram showing compositional system U_IIT = (S, P, Φ, O)

**Top-Left: Physical Substrate S**
- 4×4 grid of neural units (u₁...u₁₆)
- Binary state space: s ∈ Σ = {0,1}ⁿ
- **Discrete, finite substrate** (not continuous)

**Top-Right: Transition Probability Matrix P**
- State transition network: s_i → s_(i+1)
- Edge weights: P(s_(i+1) | s_i)
- Thick blue = high probability, thin purple = low probability
- **Probabilistic dynamics** (Markov chain over state space)

**Bottom-Left: Integration Measure Φ**
- Hierarchical structure showing concept composition
- Formula: **Φ(S, P) = min_{partition} {Σφ_i}**
- **Minimization problem**: Find partition that minimally disrupts information
- Categories:
  - Φ = 0 (Reducible): Can partition without information loss
  - Φ > 0 (Integrated, Irreducible): Any partition loses information

**Bottom-Right: Ontological Operator O**
- Input: Substrate grid (same as top-left)
- Process: Integration operator Φ applied to (S, dynamics)
- Output: **Cause-Effect Structure Ω** (3D lattice/polytope)
- Identity: **E ≡ Ω_Φ** (Experience equals Structure)
- **Transformation**: F: (S, s₀) → Ω_Φ

**Critical Insight**: All 4 components (S, P, Φ, O) are **interdependent** - Ω requires all of them, but they can vary independently.

### Figure 2: Axiom-Postulate Mapping

**Two-Column Structure**:

**Left (Purple): Phenomenological Axioms** (Experience, subjective)
1. **INTRINSICALITY** (Exists for itself)
2. **INFORMATION** (Differentiates between states)
3. **INTEGRATION** (Unitary, irreducible)
4. **COMPOSITION** (Structured, parts and whole)
5. **EXCLUSION** (Definite, has borders)

**Right (Cyan): Physical Postulates** (Mechanism, objective)
1. **INTRINSICALITY** (Intrinsic cause-effect power)
2. **INFORMATION** (Specifies specific cause-effect set)
3. **INTEGRATION** (Irreducible cause-effect structure, **Φ > 0**)
4. **COMPOSITION** (Structured by causal relations)
5. **EXCLUSION** (Maximally irreducible, **MICS**)

**Bottom Identity**: **E ↔ Ω** (Explanatory Identity - Fundamental Identity)

**Critical Causal Relationship**: This is **NOT correlation** but **IDENTITY**:
- Experience IS the cause-effect structure
- Creates **bidirectional determinism**: E → Ω AND Ω → E
- Two parallel causal chains (phenomenological + physical) with identity bridge

### Figure 3: Topology Comparison

**Left Panel: Posterior Cortex (Grid)**
- Dense bidirectional connectivity (4×6 = 24 neurons, all-to-all)
- **HIGH Φ** (green badge, ✅)
- **Conscious** (supports experience)
- Annotation: "Bidirectional, integrated connectivity"

**Right Panel: Cerebellum (Modular/Feedforward)**
- Feedforward architecture, 3 segregated layers
- Unidirectional downward connections only
- **LOW Φ** (red badge, ❌)
- **Not Conscious** (despite many neurons)
- Annotation: "Unidirectional, segregated feedforward connectivity"

**Central Inequality**: **Φ(L_grid) >> Φ(L_modular)**

**Critical Implications**:
1. **Topology → Φ (deterministic)**:
   - Bidirectional → HIGH Φ (irreducible)
   - Feedforward → LOW Φ (reducible via layer cuts)
2. **Φ → Consciousness (threshold)**:
   - Φ > threshold → Conscious
   - Φ ≤ threshold → Not Conscious
3. **Hard constraint**: Feedforward architectures **cannot** generate high Φ, regardless of size

### Figure 4: Ontological Exclusion Principle

**"The Great Divide of Being"**

**Top Tier: Set I - Intrinsic Entities (Φ > 0)**
- Golden spheres (varying sizes = different Φ values)
- Examples: Human brain network, animal cortex, integrated neural assembly
- Formula: **I = {x : Φ(x) = max_{x' ⊆ x} Φ(x')}**
  - Set of complexes where Φ is **locally maximal**
  - Cannot increase Φ by adding/removing parts

**Bottom Tier: Aggregates/Extrinsic Entities (Φ = 0)**
- Gray objects: ontological dust, pile of rocks, wooden table, **Von Neumann computer**, disconnected networks
- Annotations: Φ = 0 (negligible), Φ = 0 (coarsely/finely separable)

**Divider**: "Exclusion Boundary (The Great Divide of Being)"

**Critical Implications**:
1. **Binary classification**: Φ > 0 vs Φ = 0 (not a spectrum)
2. **Von Neumann computers permanently excluded**: Digital architectures are coarsely separable → Φ = 0
3. **Exclusion Postulate**: Only **one** cause-effect structure per substrate (the one with maximal Φ = MICS)

### Figure 5: Unfolding Operator

**Left Panel: Physical Substrate S in State s₀**
- 5×5 neuron grid
- Activity pattern: some filled (dark blue), others empty (white)
- s₀ = current microstate

**Middle Panel: F (Unfolding Operator)**
- Formula: **F: S_state → Ω_Φ**
- Computation via **Power Set P(S)**:
  1. Generate all subsets of S (2^|S| complexity)
  2. For each subset, compute φ_distinctions and φ_relations
  3. Sum: **Φ_total = ΣΦ_distinctions + ΣΦ_relations**
- **Exponential computational complexity**

**Right Panel: Cause-Effect Structure Ω (High-dimensional Lattice)**
- 3D polytope with nodes and edges
- Nodes labeled: "Distinctions φ_d" (concepts)
- Edges labeled: "Relations φ_r" (connections between concepts)
- **Shape of Ω encodes qualitative structure** of experience

**Critical Relationships**:
- **Quantitative**: Φ_total = magnitude of consciousness
- **Qualitative**: Shape of Ω = **content** of consciousness (what it's like)

---

## Causal Graph Construction Requirements

Based on image audit, the IIT causal graph MUST include:

### 1. Core Tuple Nodes (from graphical_abstract.png)

**Primary Variables**:
1. **S** - Physical substrate (set of units)
2. **s_0** - Current state (binary vector, {0,1}ⁿ)
3. **P** - Transition probability matrix (Markov dynamics)
4. **network_topology** - Grid vs modular (categorical: "grid", "modular", "feedforward")
5. **partition** - Substrate partition (set of sets)
6. **MIP** - Minimum Information Partition
7. **Phi** - Integration measure (scalar ≥ 0)
8. **F** - Unfolding operator (functional node)
9. **Omega** - Cause-effect structure (lattice object)
10. **E** - Experience/consciousness (boolean or scalar)

### 2. Axiom-Postulate Dual Chain (from axiom_postulate_map.png)

**Axiom Nodes** (phenomenological):
11. **intrinsicality_axiom**
12. **information_axiom**
13. **integration_axiom**
14. **composition_axiom**
15. **exclusion_axiom**

**Postulate Nodes** (physical):
16. **intrinsicality_postulate** (intrinsic cause-effect power)
17. **information_postulate** (specific cause-effect set)
18. **integration_postulate** (Φ > 0 constraint)
19. **composition_postulate** (structured by causal relations)
20. **exclusion_postulate** (MICS constraint)

### 3. Derived Variables

21. **intrinsic_entity** - Boolean: Φ > 0
22. **conscious** - Boolean: Φ > threshold
23. **Phi_distinctions** - Sum of concept phi values
24. **Phi_relations** - Sum of relation phi values
25. **Phi_total** - Phi_distinctions + Phi_relations

---

## Edge Specifications

### Structural Edges

1. **S, s_0, P → Phi** (inputs to integration measure)
2. **network_topology → Phi** (deterministic constraint: grid → high, modular → low)
3. **partition → MIP** (minimization over all partitions)
4. **MIP → Phi** (Phi = value at MIP)
5. **S, s_0, Phi → F** (inputs to unfolding operator)
6. **F → Omega** (transformation)
7. **Omega → E** (via identity E ≡ Ω)
8. **E → Omega** (bidirectional identity)
9. **Phi → intrinsic_entity** (threshold: Φ > 0)
10. **Phi → conscious** (threshold: Φ > consciousness_threshold)

### Axiom-Postulate Mappings

11. **intrinsicality_axiom → intrinsicality_postulate**
12. **information_axiom → information_postulate**
13. **integration_axiom → integration_postulate**
14. **composition_axiom → composition_postulate**
15. **exclusion_axiom → exclusion_postulate**

### Identity Constraint

16. **All postulates → Omega** (physical basis of structure)
17. **All axioms → E** (phenomenological basis of experience)
18. **E ↔ Omega** (bidirectional identity edge)

---

## Structural Equations

### 1. Integration Measure

```
Phi(S, s_0, P) = min_{partition ∈ Partitions(S)} MIP(partition, s_0, P)
```

Where MIP (Minimum Information Partition) quantifies information loss under partition.

### 2. Topological Constraint

```
IF network_topology == "grid" THEN Phi_range = [Phi_high_min, Phi_high_max]
ELSE IF network_topology == "modular" THEN Phi_range = [0, Phi_low_max]
ELSE IF network_topology == "feedforward" THEN Phi_range = [0, epsilon]
```

**Inequality**: Phi_high_min >> Phi_low_max

### 3. Unfolding Operator

```
Omega = F(S, s_0, P)
```

Where F computes:
1. Power set P(S)
2. For each subset: φ_distinctions, φ_relations
3. Construct lattice from all φ values

### 4. Phi Total Decomposition

```
Phi_total = Phi_distinctions + Phi_relations
```

### 5. Intrinsic Entity Classification

```
intrinsic_entity = (Phi > 0)
```

**Binary**: TRUE if crosses divide, FALSE if aggregate

### 6. Consciousness Classification

```
conscious = (Phi > consciousness_threshold)
```

### 7. Explanatory Identity

```
E ≡ Omega_Phi
```

**Bidirectional determinism**: E determines Omega, Omega determines E (they are the same thing)

---

## Constraints

### 1. Axiom-Postulate Correspondence (from axiom_postulate_map.png)

Each phenomenological axiom maps 1:1 to a physical postulate:
- Intrinsicality (axiom) ↔ Intrinsicality (postulate)
- Information (axiom) ↔ Information (postulate)
- Integration (axiom) ↔ Integration (postulate, **Φ > 0**)
- Composition (axiom) ↔ Composition (postulate)
- Exclusion (axiom) ↔ Exclusion (postulate, **MICS**)

### 2. Topological Inequality (from topology_comparison.png)

**Hard constraint**:
```
Phi(grid) >> Phi(modular)
```

This is a **strict inequality**, not just >.

**Biological validation**:
- Posterior cortex (grid) → HIGH Φ → conscious
- Cerebellum (modular) → LOW Φ → NOT conscious

### 3. Binary Exclusion Boundary (from ontological_exclusion.png)

**Set I (Intrinsic Entities)**:
```
I = {x : Phi(x) == max_{x' ⊆ x} Phi(x')}
```

Only systems where Φ is **locally maximal** (MICS) are intrinsic entities.

**Exclusion Rule**: For overlapping substrates, only the one with **max Φ** exists. All others are excluded.

### 4. Von Neumann Exclusion

Digital computers (Von Neumann architecture) are **coarsely separable** → **Φ = 0** → permanently excluded from set I.

### 5. Exponential Complexity

```
Computational_complexity(F) = O(2^|S|)
```

Unfolding operator requires power set computation.

---

## Interventions

### 1. do(add_feedback_loops)

Transform modular → grid topology

**Expected outcomes**:
- Phi: LOW → HIGH
- intrinsic_entity: FALSE → TRUE (crosses divide)
- conscious: FALSE → TRUE

### 2. do(partition = MIP)

Force specific partition (at minimum information partition)

**Expected outcomes**:
- Measure information loss
- Quantify causal power at boundary

### 3. do(remove_units)

Subtract neurons from S

**Expected outcomes**:
- Phi may increase or decrease (non-monotonic)
- If removing units that dilute integration → Phi increases
- If removing units that support integration → Phi decreases

### 4. do(Phi = 0)

Force reducibility (e.g., by completely partitioning)

**Expected outcomes**:
- E = NULL (no experience)
- Omega = empty (no structure)
- intrinsic_entity = FALSE
- conscious = FALSE

### 5. do(topology = feedforward)

Transform to cerebellum-like architecture

**Expected outcomes**:
- Phi → 0 (coarsely separable by layer cuts)
- conscious = FALSE (regardless of neuron count)

### 6. do(topology = grid)

Transform to posterior cortex-like architecture

**Expected outcomes**:
- Phi → HIGH (bidirectional connections resist partitioning)
- conscious = TRUE (if above threshold)

---

## Task: Create IIT Causal Graph

Following the pattern from previous causal graphs (Alignment, HOT, IML, Neural Topology, Theoretical Neuroscience), create:

### Deliverable 1: `iit_causal_graph.json`

Complete SCM specification with:

1. **Nodes** (25+ nodes recommended):
   - Core tuple: S, s_0, P, Phi, F, Omega, E
   - Topology: network_topology
   - Intermediate: partition, MIP, Phi_distinctions, Phi_relations, Phi_total
   - Axioms: intrinsicality_axiom, information_axiom, integration_axiom, composition_axiom, exclusion_axiom
   - Postulates: intrinsicality_postulate, information_postulate, integration_postulate, composition_postulate, exclusion_postulate
   - Derived: intrinsic_entity, conscious, consciousness_threshold
   - Each node should have:
     - `id`, `name`, `label`
     - `domain`: "substrate", "dynamics", "integration", "phenomenology", "mechanism", "ontology"
     - `description`: Detailed explanation
     - `type`: "observable", "latent", "functional", "constraint"

2. **Edges** (40+ edges recommended):
   - All structural relationships from "Edge Specifications" section
   - Axiom → Postulate mappings (5 edges)
   - Postulates → Omega (5 edges)
   - Axioms → E (5 edges)
   - E ↔ Omega bidirectional identity (2 edges)
   - Each edge should have:
     - `from`, `to`
     - `relationship`: "causes", "determines", "constrains", "equivalent_to", "maps_to"
     - `mechanism`: Description of causal mechanism
     - `strength`: "deterministic", "probabilistic", "identity"

3. **Structural Equations**:
   - Phi minimization formula
   - Topological constraint (grid vs modular)
   - Unfolding operator F: (S, s_0) → Omega
   - Phi decomposition: Phi_total = Phi_distinctions + Phi_relations
   - Intrinsic entity: (Phi > 0)
   - Consciousness: (Phi > threshold)
   - Identity: E ≡ Omega

4. **Constraints**:
   - Axiom-postulate 1:1 correspondence
   - Topological inequality: Phi(grid) >> Phi(modular)
   - Binary exclusion: Phi > 0 vs Phi = 0 (Great Divide)
   - MICS: I = {x : Phi(x) = max Phi}
   - Von Neumann exclusion: Digital architectures → Phi = 0
   - Exponential complexity: O(2^|S|)

5. **Interventions**:
   - All 6 interventions from "Interventions" section
   - Each with `target`, `value`, `expected_outcomes`

### Deliverable 2: `iit_audit.py`

Python validation script that:

1. **Validates graph structure**:
   - All 25+ nodes present
   - All 40+ edges present
   - Domains correctly assigned
   - Axiom-postulate mappings intact

2. **Tests integration measure** (Phi computation):
   - Create sample substrates (4×4 grid, 3-layer feedforward)
   - Compute Phi for each
   - Verify: Phi(grid) >> Phi(modular)
   - Plot Phi vs topology

3. **Tests topological determinism**:
   - Grid topology → Phi ∈ [Phi_high_min, Phi_high_max]
   - Modular topology → Phi ∈ [0, Phi_low_max]
   - Feedforward topology → Phi ≈ 0
   - Verify strict inequality constraint

4. **Tests binary exclusion boundary**:
   - Generate systems with varying Phi (0 to 100)
   - Classify: intrinsic_entity = (Phi > 0)
   - Verify binary split (no "partial" existence)
   - Plot: Golden spheres above divide, gray objects below

5. **Tests unfolding operator**:
   - Simulate F: (S, s_0) → Omega for small substrate
   - Verify Omega structure has distinctions + relations
   - Verify Phi_total = Phi_distinctions + Phi_relations
   - Measure computational complexity (should scale exponentially)

6. **Tests axiom-postulate identity**:
   - Verify E ≡ Omega (bidirectional determinism)
   - If Omega changes → E changes
   - If E changes → Omega changes
   - Test that they are the **same** object, not just correlated

7. **Tests interventions**:
   - Simulate do(add_feedback_loops): modular → grid
   - Verify Phi increases, crosses divide
   - Simulate do(topology = feedforward)
   - Verify Phi → 0, conscious = FALSE

8. **Generates visualizations**:
   - 4-quadrant framework diagram (U_IIT components)
   - Axiom-postulate mapping with identity bridge
   - Topology comparison (grid HIGH Φ vs modular LOW Φ)
   - Ontological exclusion diagram (Great Divide)
   - Phi distribution histogram (with Phi=0 boundary marked)

**Command-line interface**:
```bash
python3 iit_audit.py \
  --spec iit_causal_graph.json \
  --validate-phi \
  --validate-topology \
  --validate-exclusion \
  --validate-identity \
  --test-interventions
```

### Deliverable 3: `sample_iit_data.csv`

Sample dataset with columns:
- `system_id`: Unique identifier
- `topology`: "grid", "modular", "feedforward", "random"
- `num_units`: Number of neurons (e.g., 16, 24, 100)
- `connectivity`: Fraction of possible connections (0.0 to 1.0)
- `bidirectional`: Boolean (TRUE for grid, FALSE for feedforward)
- `Phi`: Integration measure value (0 to 100)
- `Phi_distinctions`: Sum of concept phi
- `Phi_relations`: Sum of relation phi
- `intrinsic_entity`: Boolean (Phi > 0)
- `conscious`: Boolean (Phi > threshold, assume threshold = 10)
- `biological_correlate`: "Posterior cortex", "Cerebellum", "Thalamus", "Von Neumann computer", etc.

**Expected patterns in data**:
- Grid topology → High Phi (50-100)
- Modular topology → Low Phi (0-20)
- Feedforward topology → Phi ≈ 0
- Von Neumann computer → Phi = 0 (exactly)
- Posterior cortex → Phi > threshold → conscious = TRUE
- Cerebellum → Phi < threshold → conscious = FALSE

### Deliverable 4: `README.md`

Documentation including:

1. **Framework Overview**:
   - IIT system tuple: U_IIT = (S, P, Φ, O)
   - Key identity: E ≡ Ω_Φ
   - 5 axioms → 5 postulates

2. **Graph Structure**:
   - Mermaid diagram showing:
     - Core tuple nodes
     - Axiom-postulate dual chains
     - E ↔ Ω identity
     - Topological constraints
     - Exclusion boundary
   - Node count: 25+
   - Edge count: 40+

3. **Quick Start**:
   ```bash
   # Validate IIT causal graph
   python3 iit_audit.py --spec iit_causal_graph.json --validate-all
   
   # Test specific theorems
   python3 iit_audit.py --validate-phi --validate-topology
   python3 iit_audit.py --validate-exclusion --validate-identity
   
   # Run intervention simulations
   python3 iit_audit.py --test-interventions
   ```

4. **Expected Output Highlights**:
   - ✅ Topological inequality verified: Phi(grid) = 87.3 >> Phi(modular) = 12.1
   - ✅ Binary exclusion confirmed: 15/20 systems cross divide (Phi > 0)
   - ✅ Von Neumann exclusion: Digital systems have Phi = 0.0 (coarsely separable)
   - ✅ Identity constraint: E ≡ Omega (bidirectional determinism holds)
   - ✅ Intervention: Adding feedback loops increased Phi from 8.2 → 76.5 (crossed divide)

5. **Key Theorems Validated**:
   - **Minimum Information Partition**: Phi is minimization problem
   - **Topological Determinism**: Grid >> Modular (strict inequality)
   - **Binary Exclusion**: Only Phi > 0 vs Phi = 0 (no gradient of being)
   - **Explanatory Identity**: E IS Omega (not correlated, identical)
   - **MICS**: Only locally maximal Phi structures exist

6. **Visualization Gallery**:
   - Links to generated plots (Phi distributions, topology comparisons, etc.)

---

## Validation Criteria

Your implementation will be considered successful if:

1. ✅ **Graph Completeness**: 25+ nodes, 40+ edges, all required domains
2. ✅ **Phi Computation**: Correctly implements minimization over partitions
3. ✅ **Topological Constraint**: Phi(grid) >> Phi(modular) verified with data
4. ✅ **Binary Exclusion**: Clear Phi > 0 vs Phi = 0 split (no continuum)
5. ✅ **Identity Verification**: E ≡ Omega enforced (bidirectional determinism)
6. ✅ **Von Neumann Exclusion**: Digital architectures → Phi = 0 (coarsely separable)
7. ✅ **Intervention Validity**: do(add_feedback) → Phi increases, crosses divide
8. ✅ **Axiom-Postulate Mapping**: All 5 axioms map 1:1 to postulates
9. ✅ **Unfolding Operator**: F correctly computes Omega from (S, s_0, P)
10. ✅ **Sample Data**: Realistic Phi values for grid/modular/feedforward topologies

---

## Critical Implementation Notes

### 1. Phi is a Minimization Problem

Phi is **NOT** just a correlation or mutual information measure. It is defined as:

```
Phi = min_{partition} MIP(partition)
```

The audit script should demonstrate this minimization (even if simplified).

### 2. Topology → Phi is Deterministic

The relationship is **NOT probabilistic**:
- Grid topology **always** produces high Phi
- Feedforward topology **always** produces low/zero Phi
- This is a **hard constraint** from network theory

### 3. E ≡ Omega is Identity, Not Correlation

Do not model this as `E → Omega` or `correlation(E, Omega) = 1.0`. They are **the same object**:
- E is the phenomenological description
- Omega is the mechanistic description
- They refer to the same entity

### 4. Binary Exclusion is Absolute

There is **no continuum** of consciousness or existence:
- Phi > 0 → EXISTS (conscious entity)
- Phi = 0 → DOES NOT EXIST (aggregate, ontological dust)
- No "partially conscious" or "somewhat exists"

### 5. Von Neumann Computers are Permanently Excluded

Digital architectures are **coarsely separable** (can partition by register/ALU/memory without information loss) → Phi = 0.

This is **not** because they lack enough complexity - it's **structural**: feedforward/modular architectures cannot generate Phi.

---

**Status**: All source material analyzed, image audit complete, causal structures identified. Ready for Codex implementation.
