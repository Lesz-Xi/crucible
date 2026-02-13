# Codex Task: Neural Topology Causal Graph Implementation

## Context

I have a **formal mathematical framework for Brain Network Topology** documented in `Graph-Theory-Networks/v1_draft.tex`. This 156-line LaTeX paper formalizes the structural and dynamical principles of complex brain networks through the Neural Network System:

$$N_{\text{brain}} = \langle G, H, T, \Delta \rangle$$

## Source Material

**Core Formalism:**
- **File**: `Graph-Theory-Networks/v1_draft.tex`
- **Key Components**:
  - Graph Geometry ($G$): Structural probability space $(V, E)$ embedded in $\mathbb{R}^3$
  - Evolutionary Hamiltonian ($H$): Cost-efficiency trade-off $H_{\text{evol}} = \alpha E_{\text{glob}} - \beta C_{\text{wire}}$
  - Topological Dynamics ($T$): Functional connectivity, degree distributions, small-world metrics
  - Pathological Operator ($\Delta$): Hub vulnerability, dysconnectivity syndromes

**Supporting Materials:**
- `graphical_abstract.png` - Visual overview of the $N_{\text{brain}}$ tuple
- `SUMMARY.md` - Project overview
- Source PDF: "The Architecture of Complexity: Graph Theory in Neural Networks"

## Task: Create Neural Topology Causal Graph

Following the pattern from the Alignment, HOT, and IML causal graphs, create:

### 1. Causal Graph JSON Schema

**File:** `Graph-Theory-Networks/neural_topology_causal_graph.json`

**Required Structure:**

```json
{
  "graph_id": "neural_topology_v1",
  "version": "1.0.0",
  "graph_type": "structural_causal_model",
  "source": {
    "title": "The Hamiltonians of Neural Topology",
    "path": "Graph-Theory-Networks/v1_draft.tex",
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

**Structural Geometry (G Domain):**
- `G`: Graph representation $(V, E)$
- `a_ij`: Adjacency matrix elements (binary connectivity)
- `d_ij`: Physical Euclidean distance between nodes $i$ and $j$
- `P_connection`: Connection probability as function of distance
- `eta`: Spatial decay constant (metabolic penalty for distance)
- `C_wire`: Wiring cost functional (axonal volume)
- `N`: Number of nodes (brain regions)

**Evolutionary Hamiltonian (H Domain):**
- `alpha`: Prize coefficient for communication efficiency
- `beta`: Penalty coefficient for physical material cost
- `E_glob`: Global efficiency (inverse path length)
- `L`: Characteristic path length (average shortest path)
- `H_evol`: Evolutionary Hamiltonian (fitness function)
- `topology_regime`: {lattice, small-world, random}

**Topological Dynamics (T Domain):**
- `F_ij`: Functional connectivity (time-averaged correlation)
- `x_i_t`: State of node $i$ at time $t$
- `P_k`: Degree distribution (truncated power-law)
- `k`: Node degree
- `gamma`: Power-law exponent
- `k_c`: Cutoff parameter (spatial volume constraint)
- `C_clustering`: Local clustering coefficient
- `sigma_small_world`: Small-world index

**Pathological Operator (Δ Domain):**
- `H_hubs`: Set of hub nodes (high degree, high betweenness)
- `Psi_patho`: Pathological operator (hub deletion impact)
- `attack_type`: {random, targeted}
- `dysconnectivity_syndrome`: Boolean indicator
- `E_glob_post_perturbation`: Global efficiency after attack

### Edge Specifications

Key causal relationships to encode:

**Distance-Probability Coupling (Eq. 1, Line 78):**
```
d_ij → P_connection  (exponential decay: P ∝ exp(-η * d_ij))
eta → P_connection   (decay modulation)
```

**Wiring Cost Accumulation (Eq. 2, Line 85):**
```
a_ij → C_wire  (sum of all connection distances)
d_ij → C_wire
```

**Hamiltonian Trade-off (Eq. 4, Line 102):**
```
E_glob → H_evol  (positive: α coefficient)
C_wire → H_evol  (negative: -β coefficient)
alpha → H_evol
beta → H_evol
```

**Efficiency Computation (Eq. 3, Line 95):**
```
L → E_glob  (inverse relationship: E_glob = 1 / avg(L_ij))
G → L       (shortest paths determined by graph structure)
```

**Small-World Emergence (Eq. 5, Line 114):**
```
C_clustering → sigma_small_world  (numerator component)
L → sigma_small_world             (denominator component)
H_evol → topology_regime          (optimization determines regime)
```

**Degree Distribution (Eq. 7, Line 131):**
```
k → P_k           (power-law base)
k_c → P_k         (exponential cutoff)
gamma → P_k       (exponent)
C_wire → k_c      (metabolic saturation limits hubs)
```

**Functional-Structural Coupling (Eq. 6, Line 124):**
```
x_i_t → F_ij      (state correlations)
x_j_t → F_ij
a_ij → F_ij       (structure constrains function: F ≈ f(A))
```

**Hub Vulnerability (Eq. 8, Line 144):**
```
H_hubs → Psi_patho            (targeted deletion of hubs)
attack_type → Psi_patho       (random vs targeted)
Psi_patho → dysconnectivity_syndrome
E_glob → Psi_patho            (pre-attack efficiency)
E_glob_post_perturbation → Psi_patho
```

### Structural Equations

Formalize key theorems and equations:

**1. Connection Probability (Eq. 1, Line 78):**
```json
{
  "node": "P_connection",
  "equation": "P(a_ij = 1) = κ * exp(-η * d_ij)",
  "description": "Distance-dependent connectivity with spatial decay constant η"
}
```

**2. Wiring Cost (Eq. 2, Line 85):**
```json
{
  "node": "C_wire",
  "equation": "C_wire = Σ_{i,j} a_ij * d_ij",
  "description": "Total axonal volume as sum of connection distances"
}
```

**3. Global Efficiency (Eq. 3, Line 95):**
```json
{
  "node": "E_glob",
  "equation": "E_glob = (1 / (N(N-1))) * Σ_{i≠j} (1 / L_ij)",
  "description": "Average inverse shortest path length, well-defined for disconnected graphs"
}
```

**4. Evolutionary Hamiltonian (Eq. 4, Line 102):**
```json
{
  "node": "H_evol",
  "equation": "max H_evol = α * E_glob - β * C_wire",
  "description": "Fitness function balancing communication efficiency vs metabolic cost"
}
```

**5. Small-World Index (Eq. 5, Line 114):**
```json
{
  "node": "sigma_small_world",
  "equation": "σ = (C_actual / C_random) / (L_actual / L_random)",
  "description": "Small-world state satisfies σ > 1 (high clustering, short paths)"
}
```

**6. Functional Connectivity (Eq. 6, Line 124):**
```json
{
  "node": "F_ij",
  "equation": "F_ij = (⟨x_i(t) x_j(t)⟩ - ⟨x_i(t)⟩⟨x_j(t)⟩) / (σ_i σ_j)",
  "description": "Time-averaged Pearson correlation, coupled to structure: F_ij ≈ f(a_ij)"
}
```

**7. Truncated Power Law (Eq. 7, Line 131):**
```json
{
  "node": "P_k",
  "equation": "P(k) ∝ k^(-γ) * exp(-k / k_c)",
  "description": "Degree distribution with exponential cutoff due to spatial/metabolic constraints"
}
```

**8. Pathological Operator (Eq. 8, Line 144):**
```json
{
  "node": "Psi_patho",
  "equation": "Ψ_patho = E_glob(G) - E_glob(G \\ {v ∈ H})",
  "description": "Drop in global efficiency from hub deletion (dysconnectivity syndrome)"
}
```

### Constraints

Encode key propositions and principles:

**1. Distance-Cost Coupling (Section 2.1, Line 76):**
```json
{
  "id": "distance_cost_coupling",
  "expression": "P(a_ij = 1) ∝ exp(-η * d_ij), where η > 0 represents metabolic penalty",
  "type": "biological_constraint"
}
```

**2. Hamiltonian Regime Limits (Section 3.3, Lines 108-111):**
```json
{
  "id": "lattice_regime",
  "expression": "if β → ∞, then topology_regime = 'lattice' and C_wire → min, E_glob → 0",
  "type": "optimization_limit"
},
{
  "id": "random_regime",
  "expression": "if α → ∞, then topology_regime = 'random' and E_glob → max, C_wire → max",
  "type": "optimization_limit"
}
```

**3. Small-World Archetype (Section 3.3, Line 112):**
```json
{
  "id": "small_world_archetype",
  "expression": "for finite (α, β), topology_regime = 'small-world' with σ > 1",
  "description": "Critical state: high clustering (local) + short paths (global)",
  "type": "emergent_property"
}
```

**4. Structure-Function Coupling (Section 4.1, Line 126):**
```json
{
  "id": "structure_function_coupling",
  "expression": "F_ij ≈ f(a_ij) at low frequencies; dF/dt ≠ 0 while dA/dt ≈ 0 (metastability)",
  "type": "dynamical_constraint"
}
```

**5. Truncation from Physical Constraints (Section 4.2, Line 129):**
```json
{
  "id": "truncated_power_law",
  "expression": "P(k) has exponential cutoff k_c due to spatial volume + metabolic saturation",
  "description": "Prevents infinite-capacity hubs unlike pure scale-free networks",
  "type": "physical_constraint"
}
```

**6. Hub Vulnerability (Section 5.2, Line 142):**
```json
{
  "id": "hub_vulnerability",
  "expression": "H_hubs = {v | k_v >> ⟨k⟩ ∧ betweenness_v >> ⟨betweenness⟩}",
  "description": "Hubs are high-cost, high-efficiency bottlenecks vulnerable to targeted attack",
  "type": "topological_property"
}
```

**7. Dysconnectivity Syndrome (Section 5.2, Line 146):**
```json
{
  "id": "dysconnectivity_syndrome",
  "expression": "targeted deletion of H_hubs → catastrophic collapse of E_glob",
  "description": "Alzheimer's, Schizophrenia: robust to random error, vulnerable to hub attacks",
  "type": "pathological_mechanism"
}
```

### Interventions

Define do-calculus operations:

**1. Minimize Wiring Cost**
```json
{
  "id": "do_minimize_wiring",
  "do": ["set β → ∞"],
  "effect": "forces topology_regime → 'lattice', minimizes C_wire, reduces E_glob",
  "biological_analog": "developmental pressure for local connectivity"
}
```

**2. Maximize Efficiency**
```json
{
  "id": "do_maximize_efficiency",
  "do": ["set α → ∞"],
  "effect": "forces topology_regime → 'random', maximizes E_glob, increases C_wire",
  "biological_analog": "evolutionary pressure for rapid communication"
}
```

**3. Balance to Small-World**
```json
{
  "id": "do_balance_small_world",
  "do": ["optimize α, β to maximize H_evol"],
  "effect": "topology_regime → 'small-world', achieves σ > 1",
  "biological_analog": "evolutionary optimization for brain architecture"
}
```

**4. Random Attack (Robustness)**
```json
{
  "id": "do_random_attack",
  "do": ["set attack_type = 'random'", "remove random nodes from V"],
  "effect": "E_glob degrades gracefully, dysconnectivity_syndrome = false",
  "biological_analog": "normal aging, random cell death"
}
```

**5. Targeted Attack (Vulnerability)**
```json
{
  "id": "do_targeted_attack",
  "do": ["set attack_type = 'targeted'", "remove nodes in H_hubs"],
  "effect": "Ψ_patho → large, E_glob → catastrophic collapse, dysconnectivity_syndrome = true",
  "biological_analog": "Alzheimer's disease, schizophrenia pathology"
}
```

**6. Increase Spatial Decay**
```json
{
  "id": "do_increase_decay",
  "do": ["increase η"],
  "effect": "reduces P_connection for distant nodes, increases local clustering, reduces C_wire",
  "biological_analog": "metabolic constraint tightening"
}
```

### 2. Audit Script

**File:** `Graph-Theory-Networks/neural_topology_audit.py`

Validate:
- **Hamiltonian optimization**: Test that small-world topology maximizes $H_{\text{evol}}$ for finite $(\alpha, \beta)$
- **Regime transitions**: Verify lattice ($\beta \to \infty$), small-world (balanced), and random ($\alpha \to \infty$) regimes
- **Distance-cost coupling**: Confirm $P(a_{ij}=1) \propto e^{-\eta d_{ij}}$
- **Small-world index**: Compute $\sigma = (C/C_{\text{rand}}) / (L/L_{\text{rand}}) > 1$
- **Truncated power law**: Fit $P(k) \propto k^{-\gamma} e^{-k/k_c}$ to degree distribution
- **Hub vulnerability**: Simulate targeted vs random attacks, measure $\Psi_{\text{patho}}$

**CLI Example:**
```bash
python3 Graph-Theory-Networks/neural_topology_audit.py \
  --spec Graph-Theory-Networks/neural_topology_causal_graph.json \
  --network-dataset sample_brain_networks.csv \
  --validate-hamiltonian \
  --test-regime-transitions \
  --simulate-attacks
```

### 3. Sample Dataset

**File:** `Graph-Theory-Networks/sample_brain_networks.csv`

Columns:
- `network_id`: Identifier
- `N`: Number of nodes
- `alpha`: Efficiency prize coefficient
- `beta`: Cost penalty coefficient
- `C_wire`: Wiring cost
- `E_glob`: Global efficiency
- `L`: Characteristic path length
- `C_clustering`: Clustering coefficient
- `sigma_small_world`: Small-world index
- `topology_regime`: {lattice, small-world, random}
- `hub_count`: Number of high-degree hubs
- `attack_type`: {none, random, targeted}
- `Psi_patho`: Pathological impact (efficiency drop)

### 4. README Update

**File:** `Graph-Theory-Networks/README.md`

Document:
- Graph structure (nodes, edges, constraints)
- Hamiltonian optimization framework
- Regime transitions (lattice → small-world → random)
- Hub vulnerability and attack simulations
- Quick start command
- Expected audit output (regime validation, attack analysis, small-world metrics)

## Expected Output Structure

The audit should produce:

```
=== Neural Topology Causal Graph Audit Report ===

1. GRAPH VALIDATION
   ✓ 23 nodes, 31 edges, DAG confirmed
   ✓ 4 domains: G (geometry), H (hamiltonian), T (topology), Δ (pathology)

2. DISTANCE-COST COUPLING TEST
   ✓ Connection probability fits P(a_ij = 1) = κ * exp(-η * d_ij)
   ✓ Correlation(d_ij, C_wire) = 0.89 (p < 0.001)
   ✓ Spatial decay constant η = 0.42 ± 0.03

3. HAMILTONIAN REGIME VALIDATION
   Lattice regime (β → ∞):
     ✓ C_wire → min (0.85 normalized units)
     ✓ E_glob → low (0.12)
     ✓ L → max (5.8 hops)
   
   Small-world regime (balanced α, β):
     ✓ σ_small_world = 1.47 > 1 ✓
     ✓ C_actual / C_random = 3.2
     ✓ L_actual / L_random = 1.1
     ✓ H_evol = 0.74 (optimal)
   
   Random regime (α → ∞):
     ✓ E_glob → max (0.91)
     ✓ C_wire → max (4.2 normalized units)
     ✓ L → min (2.3 hops)

4. DEGREE DISTRIBUTION ANALYSIS
   ✓ Fit: P(k) ∝ k^(-γ) * exp(-k / k_c)
   ✓ Parameters: γ = 2.1, k_c = 37.5
   ✓ Truncation confirmed at k ≈ 40 (spatial/metabolic limit)
   ✓ R² = 0.94

5. HUB VULNERABILITY SIMULATION
   Random attack (20% nodes):
     - E_glob drop: 0.78 → 0.61 (22% reduction)
     - Network remains connected
     - Ψ_patho = 0.17 (graceful degradation)
   
   Targeted attack (20% hubs):
     - E_glob drop: 0.78 → 0.21 (73% reduction) ✗
     - Network fragments into 12 components
     - Ψ_patho = 0.57 (catastrophic collapse)
     - dysconnectivity_syndrome = TRUE

6. STRUCTURE-FUNCTION COUPLING
   ✓ F_ij correlates with a_ij (ρ = 0.67, p < 0.001)
   ✓ Metastable dynamics: dF/dt ≠ 0 while dA/dt ≈ 0
   ✓ Low-frequency coupling confirmed

7. SMALL-WORLD OPTIMIZATION
   Optimal (α, β) = (0.65, 0.35)
   - Maximizes H_evol = 0.74
   - Produces σ = 1.47 (small-world)
   - Balances efficiency (E_glob = 0.78) vs cost (C_wire = 1.2)
   [plot saved to figures/hamiltonian_surface.png]

=== RECOMMENDATIONS ===
- Small-world topology is evolutionarily optimal for finite (α, β)
- Hub protection critical: targeted attacks cause dysconnectivity
- Brain networks: robust to random errors, vulnerable to hub deletion
- Alzheimer's/Schizophrenia: model as targeted attack on H_hubs
```

## Implementation Notes

- Use the same code quality and structure as previous causal graph audit scripts
- Include matplotlib visualizations for:
  - Distance-probability scatter (exponential decay fit)
  - Hamiltonian surface plot (α vs β vs H_evol)
  - Degree distribution with truncated power-law fit
  - Attack simulation comparison (random vs targeted)
  - Small-world regime diagram
- Ensure JSON schema is valid and follows existing conventions
- Include network analysis libraries: `networkx`, `scipy`, `numpy`

---

**Deliverables:**
1. ✅ `neural_topology_causal_graph.json` - Complete SCM specification
2. ✅ `neural_topology_audit.py` - Validation and audit script
3. ✅ `sample_brain_networks.csv` - Demo dataset
4. ✅ `README.md` - Documentation and usage

**Verification Command:**
```bash
python3 Graph-Theory-Networks/neural_topology_audit.py \
  --spec Graph-Theory-Networks/neural_topology_causal_graph.json \
  --network-dataset Graph-Theory-Networks/sample_brain_networks.csv \
  --validate-hamiltonian \
  --test-regime-transitions \
  --simulate-attacks
```

## Citations (from v1_draft.tex)

[1] Bullmore & Sporns (2009). Complex brain networks. *Nature Reviews Neuroscience*.
[2] Watts & Strogatz (1998). Small-world networks. *Nature*.
[3] Achard et al. (2006). Resilient brain functional network. *J. Neuroscience*.
[4] Honey et al. (2007). Network structure shapes functional connectivity. *PNAS*.
[5] Bassett et al. (2006). Adaptive reconfiguration. *PNAS*.
