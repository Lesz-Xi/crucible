# Codex Task: Theoretical Neuroscience Causal Graph Implementation

## Context

I have a **comprehensive mathematical framework for Neural Dynamics** spanning biophysics to learning. The system is formalized as the **Neural Tuple**:

$$N = \langle B, D, I, L \rangle$$

This framework unifies microscale voltage dynamics, mesoscale network dynamics, information theory, and plasticity rules into a single coherent structure.

## Source Material

**Core Formalism:**
- **Source**: "Principles of Theoretical Neuroscience: Models and Mechanisms.pdf"
- **Summary**: `SUMMARY.md` (116 lines)
- **Key Components**:
  - **B (Biophysical Substrate)**: Cable equation, Hodgkin-Huxley, integrate-and-fire
  - **D (Dynamical Network)**: Wilson-Cowan equations, stability analysis, Boltzmann machines
  - **I (Information Metric)**: Fisher information, Cramér-Rao bound, encoding/decoding
  - **L (Learning Operator)**: Hebbian learning, Oja rule, TD learning, EM algorithm

**Key Equations (from SUMMARY.md):**
- Eq. 4: Cable Equation
- Eq. 6: Cable-Conductance Equation
- Eq. 11: Integrate-and-Fire dynamics
- Eq. 24: Wilson-Cowan dynamics
- Eq. 26: Stability Criterion (Re(λ) < 1)
- Eq. 33: Boltzmann Machine Energy
- Eq. 44: Fisher Information
- Eq. 45: **Cramér-Rao Bound**
- Eq. 67: **Oja Learning Rule**
- Eq. 75: TD Error
- Eq. 82: EM Free Energy Bound
- Eq. 95: **Complete Neural Lagrangian**

**Figures Available:**
- `graphical_abstract.png` - N = ⟨B, D, I, L⟩ framework
- `hodgkin_huxley.png` - Ion channel dynamics
- `wilson_cowan.png` - Network dynamics
- `information_coding.png` - Information theory
- `learning_operators.png` - Plasticity rules

## Image Audit Analysis

### Figure 1: Graphical Abstract (graphical_abstract.png)

**Visual Structure:**
The framework is organized as a **four-quadrant diagram** with a central "NEURAL SYSTEM (N=⟨B, D, I, L⟩)" hub connecting:

**Top-Left (B: Biophysical Substrate):**
- Neuron illustration with soma, dendrites, axon
- Conductance channels: Na⁺ (blue), K⁺ (green) voltage-gated channels
- **Key Equations Visible**:
  - Cable equation: `τ_m ∂V/∂t = λ² ∂²V/∂x² - V + I_inj`
  - Hodgkin-Huxley framework: `I_ion = g_Na m³h(V - E_Na) + g_K n⁴(V - E_K) + g_L(V - E_L)`

**Top-Right (D: Dynamical Network):**
- Network connectivity diagram: E (excitatory) and I (inhibitory) populations
- Connection matrix: W_EE, W_EI, W_IE, W_II
- **Stability Analysis Box**: Eigenvalue diagram showing stable/unstable regions, fixed points
- **Wilson-Cowan Equations**: 
  - `τ_E dv_E/dt = -v_E + F(W_EE v_E + W_EI v_I + I_E)`
  - `τ_I dv_I/dt = -v_I + F(W_IE v_E + W_II v_I + I_I)`
- **Energy Landscape**: Shows attractor basins, trajectory flow

**Bottom-Left (I: Information Metric):**
- Shannon information formula: `H(X) = -Σ p(x) log p(x)`
- Fisher information: `I_F(s) = E[(∂/∂s log P(r|s))²]`
- **Spike Train Encoding/Decoding Diagram**: Timeline → Linear Filter → Estimated Stimulus/Rate
- **Mutual Information Venn Diagram**: H(X), H(Y), H(X,Y) overlap
- Formula: `I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X)`

**Bottom-Right (L: Learning Operator):**
- **Hebbian/Oja Diagram**: Pre-synaptic (u) and post-synaptic (v) neuron with correlation learning
- **Simplified Cycle**: Pre-synaptic → Post-synaptic → Weight increase (Δw = v_pre × v_post)
- **TD Error Signal**: Timeline showing r(t), v(t), v(t+1), and δ(t) = r(t) + v(t+1) - v(t)
- **EM Algorithm Cycle**: E-step (infer hidden causes) → M-step (optimize parameters) → iteration
- **Equations Visible**:
  - Oja rule: `dw/dt = vu - αv²w`
  - TD: `δ_t = r_t+1 + γv(s_t+1) - v(s_t)`

**Critical Insight**: The graphical abstract shows **bidirectional arrows** between all four domains, indicating they are not independent layers but a **tightly coupled system**.

### Figure 2: Hodgkin-Huxley Dynamics (hodgkin_huxley.png)

**Left Panel: Circuit Diagram**
- Parallel conductance model with capacitor (C_m)
- Three ion channels in parallel:
  - **Na⁺ channel** (blue): g_Na with reversal potential E_Na
  - **K⁺ channel** (red): g_K with reversal potential E_K
  - **Leak channel** (green): g_L with reversal potential E_L
- External current I_m injected at top

**Middle Panel: Action Potential Waveform**
- **Black curve**: V(t) - membrane voltage
- **Red curve**: m(t) - Na⁺ activation (fast, rises before spike)
- **Blue curve**: h(t) - Na⁺ inactivation (slow, falls during spike)
- **Dashed curve**: n(t) - K⁺ activation (delayed, rises after spike peak)
- **Key Features**:
  - Depolarization phase: V rises from -70mV to +30mV (driven by Na⁺ influx)
  - Repolarization: V falls back to -70mV (driven by K⁺ efflux)
  - Hyperpolarization undershoot visible at ~20ms
- **Time scale**: 0-30 ms (millisecond-scale dynamics)

**Right Panel: Gating Variable States**
- **g_Na channel**: Showsm³h structure (three activation gates, one inactivation gate)
  - Closed state (all gates closed)
  - Open state (m gates open, h gate open) → Na⁺ current flows
  - Inactivated state (m gates open, h gate closed) → blocks current
- **g_K channel**: Shows n⁴ structure (four activation gates)
  - Closed state (K⁺ blocked)
  - Open state (n gates open) → K⁺ current flows

**Bottom Equation**:
```
dn/dt = α_n(1-n) - β_n n
```
**Potassium channel (n) gating kinetics equation** - voltage-dependent opening/closing rates

**Causal Implication**: The gating variables (m, h, n) are **voltage-dependent AND time-dependent**, creating a feedback loop where V → (m,h,n) → conductances → V.

### Figure 3: Wilson-Cowan Network Dynamics (wilson_cowan.png)

**Top-Left: Network Architecture**
- Two-population model: **E (excitatory)** and **I (inhibitory)**
- Four synaptic connections:
  - M_EE: E → E (recurrent excitation)
  - M_EI: I → E (inhibition to excitation)
  - M_IE: E → I (excitation to inhibition)
  - M_II: I → I (recurrent inhibition)
- External input W*u feeds into both populations

**Top-Right: Phase Plane Analysis**
- **Axes**: Inhibitory activity (I) vs Excitatory activity (E)
- **Nullclines**: dE/dt = 0 and dI/dt = 0 curves
- **Fixed points**:
  - Stable fixed point (attractor basin visible)
  - Unstable fixed point (saddle)
- **Vector field**: Flow arrows showing trajectory evolution
- **Stability regions** clearly demarcated

**Bottom-Left: Eigenvalue Stability Analysis**
- **Complex plane**: Real(λ) vs Imaginary(λ)
- **Unit circle** (|λ| = 1) marks stability boundary
- **Stable region**: Re(λ) < 1 (green shaded area)
- **Critical condition**: det(M - λI) = 0
- Eigenvalues plotted as points:
  - Inside unit circle → stable
  - On unit circle → marginal (oscillations or line attractor)
  - Outside unit circle → unstable (divergence)

**Bottom-Right: Energy Landscape E(v)**
- **3D surface plot**: Energy as function of (I, E) coordinates
- **Valleys** represent stable attractor basins
- **Saddle points** visible as peaks/ridges
- **Boltzmann machine energy**: E(v) = -½v^T M v - u^T v + ∑v_i ln v_i
- Dynamics flow "downhill" toward energy minima

**Critical Causal Link**: Eigenvalues of M **directly determine** network stability. If learning modifies M (via Hebbian rules), it can push the network from stable → unstable regimes.

### Figure 4: Information Coding (information_coding.png)

**Top Panel: Encoding Pathway**
- **Input**: Stimulus s(t) (continuous waveform)
- **Linear Filter**: Kernel D(τ) performs convolution: r_est(t) = ∫D(τ)s(t-τ)dτ
- **Poisson Spike Generator**: Rate = P(n spikes in Δt) = r_est(t)Δt
- **Output**: Spike train ρ(t) (discrete events)
- **Arrow labeled "Encoding"** shows forward pathway

**Middle Panel: Decoding Pathway**
- **Input**: Spike train ρ(t) (discrete)
- **Optimal Decoding Filter**: K(τ) (e.g., Wiener filter using correlation)
- **Output**: Estimated stimulus ŝ(t) (reconstructed waveform)
- **Bayes Theorem box**: P[s|r] ∝ P[r|s]P[s]
  - Posterior ∝ Likelihood × Prior
- **Arrow labeled "Decoding"** shows inverse pathway

**Bottom-Left: Fisher Information Geometry**
- **Two probability distributions**: P(r|s) and P(r|s+δs)
- **Overlap region** shows sensitivity to stimulus change
- **σ² ≥ 1/I_F(s)** - **Cramér-Rao bound** (variance lower bound)
- **Annotation**: "Variance lower bound, Cramér-Rao"
- **Implication**: Sharper tuning curves (less overlap) → higher Fisher information → lower estimation variance

**Bottom-Right: Mutual Information & Entropy**
- **Venn diagram** with three circles:
  - H(R): Noise entropy (response variability)
  - H(R|S): Noise given stimulus
  - H(R,S): Joint entropy
  - **Mutual Information (orange overlap)**: I_m = H[response] - H[noise] = H(R) - H(R|S)
- **Formula**: I_m = H[response] - H[response|stimulus]
- **Interpretation**: Mutual information quantifies how much the response "tells you" about the stimulus

**Critical Relationship**: Fisher information sets the **precision limit** (Cramér-Rao), while mutual information measures **total information transfer**. Both are complementary metrics in the I domain.

### Figure 5: Learning Operators (learning_operators.png)

**Top-Left: Hebbian/Oja Learning (PCA Extraction)**
- **Visual**: Two neurons (u, v) with synaptic weight w connecting them
- **Data cloud**: Scatter of input vectors u (showing principal component direction)
- **Orange arrow**: "Principal eigenvector" (direction of maximum variance)
- **Weight vector w**: Aligns with principal eigenvector after learning
- **Equation**: `dw/dt = vu - αv²w`
  - First term (vu): Hebbian correlation (unstable without constraint)
  - Second term (-αv²w): Multiplicative normalization (stabilizes magnitude)
- **Outcome**: w converges to the **first principal component** of input covariance matrix

**Top-Right: Temporal Difference Learning (Prediction Error Signal)**
- **Timeline diagram**: Shows t, t+1, t+2 time steps
- **Reward signal r(t)**: Red spike at specific time (reward delivery)
- **Value functions**:
  - v(t): Current value estimate (blue)
  - v(t+1): Next-step value estimate (blue dashed)
- **TD Error**: `δ(t) = r(t) + v(t+1) - v(t)`
  - Positive δ: Reward exceeds expectation
  - Negative δ: Reward below expectation
- **Neuron illustration**: Spike train output modulated by δ
- **Annotation**: "Dopamine neuron in VTA system" (biological correlate of TD error)

**Bottom: EM Algorithm/Generative Models (Two-Layer Network)**
- **Left side: Generative model P[u|v]**
  - Hidden units (v): V₁, V₂, ..., V_n (green circles)
  - Visible units (u): U₁, U₂, ..., U_m (blue circles)
  - **Downward arrows** (orange): Generation from causes to observations
  - Represents the "forward model" (how hidden states produce data)
- **Right side: Recognition model P[v|u]**
  - **Upward arrows** (blue dashed): Inference from observations to causes
  - Represents the "inverse model" (how to infer hidden states from data)
- **Circular flow diagram**:
  - **E-step** (green): Infer P(v|u) given current parameters
  - **M-step** (orange): Optimize P[u,v] parameters to maximize likelihood
  - **Iteration**: Alternates E-step ↔ M-step until convergence
- **Update boxes**:
  - "Update Recognition Model" (after E-step)
  - "Update Generative Model" (after M-step)

**Critical Causal Insight**: EM algorithm implements **bidirectional inference**:
- **Generative**: v → u (hidden causes produce observations)
- **Recognition**: u → v (observations constrain hidden causes)

---

## Causal Graph Construction Implications from Images

Based on systematic image audit, the causal graph MUST include:

1. **Bidirectional Coupling** (from graphical abstract):
   - B ↔ D: firing_rate aggregates to v_E/v_I; network drives single-neuron input
   - D ↔ I: network state determines coding efficiency; information bottleneck constrains dynamics
   - I ↔ L: Fisher information guides learning rate; learning optimizes information transfer
   - L ↔ B: plasticity modifies conductances; biophysics constrains learning timescales

2. **Voltage-Gating Feedback Loop** (from hodgkin_huxley.png):
   - V → m, h, n (voltage-dependent gating)
   - m, h, n → g_Na, g_K (gating controls conductances)
   - g_Na, g_K → V (conductances drive voltage)
   - This is a **closed causal loop** requiring special SCM handling

3. **Eigenvalue-Stability Determinism** (from wilson_cowan.png):
   - M (recurrent matrix) → eigenvalue_M (eigendecomposition)
   - eigenvalue_M → network_state (deterministic: Re(λ)<1 → stable, Re(λ)>1 → unstable)
   - This is a **hard constraint**, not a probabilistic relationship

4. **Cramér-Rao Bound Inequality** (from information_coding.png):
   - Fisher_I → var(s_hat) via inequality: var ≥ 1/I
   - This is a **lower bound constraint**, not an equation
   - The bound can be **saturated** (equality holds) for optimal estimators

5. **EM Bidirectional Inference** (from learning_operators.png):
   - E-step: u → v (recognition)
   - M-step: v → u (generation)
   - Graph must represent both **forward generative model** and **backward inference**

6. **Dopamine-TD Coupling** (from learning_operators.png):
   - delta_TD → dopamine_signal (biological implementation)
   - This links the L domain to **neurotransmitter systems** (potential B-L bridge)

## Task: Create Theoretical Neuroscience Causal Graph

Following the pattern from previous causal graphs (Alignment, HOT, IML, Neural Topology), create:

### 1. Causal Graph JSON Schema

**File:** `Theoretical-Neuroscience/neural_dynamics_causal_graph.json`

**Required Structure:**

```json
{
  "graph_id": "neural_dynamics_v1",
  "version": "1.0.0",
  "graph_type": "structural_causal_model",
  "source": {
    "title": "The Grand Unification of Neural Dynamics",
    "subtitle": "N = ⟨B, D, I, L⟩ Framework",
    "reference": "Dayan & Abbott, Theoretical Neuroscience",
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

**Biophysical Substrate (B Domain):**
- `V`: Membrane potential (mV)
- `tau_m`: Membrane time constant (ms)
- `lambda`: Space constant (mm)
- `r_m`: Membrane resistance
- `i_e`: External current injection
- `g_Na`, `g_K`, `g_L`: Ion channel conductances (Hodgkin-Huxley)
- `m`, `h`, `n`: Gating variables (activation/inactivation)
- `V_thresh`: Spike threshold (integrate-and-fire)
- `firing_rate`: Output spike rate (Hz)

**Dynamical Network (D Domain):**
- `v_E`: Excitatory population rate
- `v_I`: Inhibitory population rate
- `tau_E`, `tau_I`: Population time constants
- `W_EE`, `W_EI`, `W_IE`, `W_II`: Synaptic weight matrix elements
- `M`: Recurrent connection matrix
- `eigenvalue_M`: Eigenvalues of M (stability)
- `network_state`: {stable, unstable, oscillatory, line_attractor}
- `E_boltzmann`: Energy function for Boltzmann machine

**Information Metric (I Domain):**
- `s`: Stimulus value
- `r`: Neural response (spike count)
- `f_r_s`: Response function (tuning curve)
- `K_encoding`: Encoding kernel
- `s_hat`: Decoded stimulus estimate
- `Fisher_I`: Fisher information
- `var_s_hat`: Variance of stimulus estimate (Cramér-Rao bound)
- `P_r_s`: Conditional probability P(r|s)
- `coding_efficiency`: Mutual information / entropy

**Learning Operator (L Domain):**
- `w`: Synaptic weight vector
- `u`: Presynaptic activity vector
- `C_input`: Input covariance matrix
- `eta_learn`: Learning rate
- `theta_BCM`: BCM sliding threshold
- `delta_TD`: Temporal difference error
- `reward`: Reward signal r(t)
- `value_function`: Predicted value v(t)
- `free_energy`: EM free energy bound
- `log_likelihood`: Data log-likelihood

### Edge Specifications

Key causal relationships to encode:

**Biophysical Dynamics (B Domain):**

**Cable Equation (Eq. 4):**
```
i_e → V          (external current drives voltage)
V → V            (spatial diffusion: λ² ∂²V/∂x²)
tau_m → V        (temporal dynamics: τ_m ∂V/∂t)
```

**Hodgkin-Huxley (Eq. 6):**
```
g_Na → V         (sodium conductance)
g_K → V          (potassium conductance)
m, h, n → g_Na   (gating variables control conductances)
m, h, n → g_K
V → m, h, n      (voltage-dependent gating)
```

**Integrate-and-Fire (Eq. 11):**
```
V → firing_rate  (threshold crossing triggers spike)
V_thresh → firing_rate
i_e → firing_rate
```

**Network Dynamics (D Domain):**

**Wilson-Cowan (Eq. 24):**
```
v_E → v_E        (recurrent excitation: W_EE)
v_I → v_E        (inhibition to excitation: W_IE)
v_E → v_I        (excitation to inhibition: W_EI)
v_I → v_I        (recurrent inhibition: W_II)
tau_E → v_E
tau_I → v_I
```

**Stability (Eq. 26):**
```
M → eigenvalue_M              (recurrent matrix determines eigenvalues)
eigenvalue_M → network_state  (Re(λ) < 1 → stable; λ = 1 → line attractor; Re(λ) > 1 → unstable)
```

**Boltzmann Machine (Eq. 33):**
```
v_E, v_I → E_boltzmann  (energy = -h·v - 0.5 v·M·v)
M → E_boltzmann
```

**Information Theory (I Domain):**

**Encoding (Eq. 40):**
```
s → r           (stimulus drives response via tuning curve f(s))
f_r_s → r
K_encoding → r  (encoding kernel)
```

**Decoding:**
```
r → s_hat       (neural response decoded to estimate stimulus)
P_r_s → s_hat   (Bayesian inference)
```

**Fisher Information (Eq. 44):**
```
f_r_s → Fisher_I   (curvature of log-likelihood)
P_r_s → Fisher_I
```

**Cramér-Rao Bound (Eq. 45):**
```
Fisher_I → var_s_hat   (inverse relationship: var ≥ 1/I)
```

**Learning Dynamics (L Domain):**

**Hebbian/Covariance Rule (Ch. 8):**
```
u → w            (presynaptic activity)
v → w            (postsynaptic activity: Hebbian correlation)
C_input → w      (covariance rule: dw/dt = C·w)
```

**Oja Rule (Eq. 67):**
```
u → w
v → w
w → w            (self-normalization: -α v² w)
C_input → w      (converges to principal eigenvector)
```

**BCM Rule:**
```
v → theta_BCM    (sliding threshold θ = ⟨v²⟩)
theta_BCM → w    (weight update depends on v - θ)
```

**TD Learning (Eq. 75):**
```
reward → delta_TD
value_function → delta_TD   (δ(t) = r(t) + v(t+1) - v(t))
delta_TD → w                (weight update proportional to TD error)
```

**EM Algorithm (Eq. 82):**
```
log_likelihood → free_energy   (free energy bounds log-likelihood)
free_energy → w                (maximize free energy → update weights)
```

**Cross-Domain Edges (Critical Causal Links):**

**B → D (Biophysics to Network):**
```
firing_rate → v_E, v_I   (single-neuron rates aggregate to population rates)
```

**D → I (Network to Information):**
```
v_E, v_I → r             (network state determines neural response)
network_state → coding_efficiency
```

**I → L (Information to Learning):**
```
Fisher_I → eta_learn     (optimal learning rate scales with Fisher information)
r → w                    (neural response drives plasticity)
```

**L → B (Learning to Biophysics):**
```
w → W_EE, W_EI, W_IE, W_II   (learned synaptic weights determine network connectivity)
```

**L → D (Learning to Network):**
```
w → M                    (learned weights form recurrent matrix)
w → eigenvalue_M         (plasticity shapes stability)
```

### Structural Equations

Formalize key equations:

**1. Cable Equation (Eq. 4):**
```json
{
  "node": "V",
  "equation": "τ_m ∂V/∂t = λ² ∂²V/∂x² - V + r_m i_e",
  "description": "Passive cable equation from Kirchhoff's laws",
  "domain": "B"
}
```

**2. Cable-Conductance Equation (Eq. 6, Hodgkin-Huxley):**
```json
{
  "node": "V",
  "equation": "τ_m ∂V/∂t = λ² ∂²V/∂x² - V - g_Na m³h(V - E_Na) - g_K n⁴(V - E_K)",
  "description": "Cable equation + active Hodgkin-Huxley conductances",
  "domain": "B"
}
```

**3. Integrate-and-Fire Firing Rate (Eq. 11):**
```json
{
  "node": "firing_rate",
  "equation": "ν = 1 / (τ_ref + τ_m ln((V_rest - V_thresh + r_m i_e) / (V_reset - V_thresh + r_m i_e)))",
  "description": "f-I curve for leaky integrate-and-fire neuron",
  "domain": "B"
}
```

**4. Wilson-Cowan Dynamics (Eq. 24):**
```json
{
  "node": "v_E",
  "equation": "τ_E dv_E/dt = -v_E + F(W_EE v_E + W_EI v_I + I_E)",
  "description": "Excitatory population rate equation",
  "domain": "D"
},
{
  "node": "v_I",
  "equation": "τ_I dv_I/dt = -v_I + F(W_IE v_E + W_II v_I + I_I)",
  "description": "Inhibitory population rate equation",
  "domain": "D"
}
```

**5. Stability Criterion (Eq. 26):**
```json
{
  "node": "network_state",
  "equation": "stable ⟺ Re(eigenvalue_M) < 1; line_attractor ⟺ eigenvalue_M = 1; unstable ⟺ Re(eigenvalue_M) > 1",
  "description": "Network stability determined by eigenvalues of recurrent matrix M",
  "domain": "D"
}
```

**6. Boltzmann Machine Energy (Eq. 33):**
```json
{
  "node": "E_boltzmann",
  "equation": "E = -h·v - (1/2) v·M·v",
  "description": "Energy function for stochastic units; dynamics minimize E",
  "domain": "D"
}
```

**7. Linear Encoding Model (Eq. 40):**
```json
{
  "node": "r",
  "equation": "r(t) = ∫ K(τ) s(t - τ) dτ + noise",
  "description": "Neural response as convolution of stimulus with encoding kernel",
  "domain": "I"
}
```

**8. Fisher Information (Eq. 44):**
```json
{
  "node": "Fisher_I",
  "equation": "I(s) = ∫ (1 / P(r|s)) (∂P(r|s) / ∂s)² dr",
  "description": "Curvature of log-likelihood; measures sensitivity of response to stimulus",
  "domain": "I"
}
```

**9. Cramér-Rao Bound (Eq. 45):**
```json
{
  "node": "var_s_hat",
  "equation": "var(s_hat) ≥ 1 / I(s)",
  "description": "Fundamental lower bound on estimation variance",
  "domain": "I"
}
```

**10. Oja Learning Rule (Eq. 67):**
```json
{
  "node": "w",
  "equation": "τ_w dw/dt = v u - α v² w",
  "description": "Hebbian term + multiplicative normalization; converges to principal eigenvector of C_input",
  "domain": "L"
}
```

**11. TD Error (Eq. 75):**
```json
{
  "node": "delta_TD",
  "equation": "δ(t) = r(t) + v(t+1) - v(t)",
  "description": "Temporal difference error for reinforcement learning",
  "domain": "L"
}
```

**12. EM Free Energy Bound (Eq. 82):**
```json
{
  "node": "free_energy",
  "equation": "F = ∑_v P(v|u) ln P(u, v) + H(P(v|u))",
  "description": "Free energy bounds log-likelihood; maximize F to learn generative model",
  "domain": "L"
}
```

**13. Neural Lagrangian (Eq. 95, Complete Unification):**
```json
{
  "node": "L_neural",
  "equation": "L = ∫ [B(V, g) + D(v_E, v_I, M) + I(Fisher_I, var) + L(w, δ)] dt",
  "description": "Unified variational principle synthesizing biophysics, dynamics, information, and learning",
  "domain": "ALL"
}
```

### Constraints

Encode key principles and theorems:

**1. Cable Properties (Ch. 6):**
```json
{
  "id": "cable_constants",
  "expression": "τ_m = r_m c_m; λ = sqrt(r_m / r_a)",
  "description": "Time constant and space constant from membrane/axial resistance",
  "domain": "B"
}
```

**2. Rall 3/2 Power Law (Ch. 6):**
```json
{
  "id": "rall_power_law",
  "expression": "d_parent^(3/2) = sum(d_daughter^(3/2))",
  "description": "Dendritic tree collapses to equivalent cylinder if branches obey 3/2 law",
  "domain": "B"
}
```

**3. Voltage-Gating (Hodgkin-Huxley, Ch. 5):**
```json
{
  "id": "voltage_gating",
  "expression": "dm/dt = (m_∞(V) - m) / τ_m(V)",
  "description": "Gating variables approach steady-state m_∞(V) with voltage-dependent time constant",
  "domain": "B"
}
```

**4. Network Stability (Ch. 7, Eq. 26):**
```json
{
  "id": "network_stability",
  "expression": "Re(λ_ν) < 1 for all eigenvalues λ_ν of M",
  "description": "Stability requires all eigenvalues of recurrent matrix have real part < 1",
  "domain": "D"
}
```

**5. Line Attractor (Ch. 7):**
```json
{
  "id": "line_attractor",
  "expression": "if λ_ν = 1, network integrates input (persistent activity)",
  "description": "Eigenvalue = 1 → memory of integrated input (e.g., oculomotor integrator)",
  "domain": "D"
}
```

**6. Associative Memory (Ch. 7):**
```json
{
  "id": "associative_memory",
  "expression": "M_ij ∝ sum_μ (v_i^μ v_j^μ)",
  "description": "Covariance rule creates fixed points matching memory patterns",
  "domain": "D"
}
```

**7. Cramér-Rao Bound (Ch. 4, Eq. 45):**
```json
{
  "id": "cramer_rao",
  "expression": "var(s_hat) ≥ 1 / I(s) for any unbiased estimator",
  "description": "Fisher information sets fundamental limit on estimation accuracy",
  "domain": "I"
}
```

**8. Histogram Equalization (Ch. 4):**
```json
{
  "id": "histogram_equalization",
  "expression": "f(s) = f_max ∫_0^s P(s') ds'",
  "description": "Optimal encoding: tuning curve proportional to cumulative distribution",
  "domain": "I"
}
```

**9. Oja Convergence (Ch. 8, Proven Theorem):**
```json
{
  "id": "oja_convergence",
  "expression": "w → principal eigenvector of C_input as t → ∞",
  "description": "Oja rule implements online PCA",
  "domain": "L"
}
```

**10. BCM Stability (Ch. 8):**
```json
{
  "id": "bcm_stability",
  "expression": "θ_v = ⟨v²⟩; sliding threshold prevents runaway excitation",
  "description": "BCM rule stabilizes via activity-dependent threshold",
  "domain": "L"
}
```

**11. TD Convergence (Ch. 9):**
```json
{
  "id": "td_convergence",
  "expression": "v(t) → sum_τ γ^τ r(t+τ) (Bellman equation)",
  "description": "TD learning converges to correct value function",
  "domain": "L"
}
```

**12. Sparse Coding (Ch. 10):**
```json
{
  "id": "sparse_coding",
  "expression": "Prior P(v) is sparse (e.g., Cauchy) → generative model produces Gabor-like receptive fields",
  "description": "Sparse coding explains V1 simple cell selectivity (Olshausen & Field)",
  "domain": "L"
}
```

### Interventions

Define do-calculus operations:

**1. Inject Current (B Domain)**
```json
{
  "id": "do_inject_current",
  "do": ["set i_e = constant"],
  "effect": "drives V above V_thresh → firing_rate increases",
  "experimental_analog": "Intracellular current injection"
}
```

**2. Block Ion Channels (B Domain)**
```json
{
  "id": "do_block_channels",
  "do": ["set g_Na = 0 or g_K = 0"],
  "effect": "abolishes action potentials (TTX blocks Na+)",
  "experimental_analog": "Pharmacological channel blockers"
}
```

**3. Perturb Recurrent Weights (D Domain)**
```json
{
  "id": "do_perturb_recurrence",
  "do": ["increase W_EE or W_IE"],
  "effect": "changes eigenvalue_M → may destabilize network or create oscillations",
  "experimental_analog": "Optogenetic manipulation of E/I balance"
}
```

**4. Create Line Attractor (D Domain)**
```json
{
  "id": "do_create_line_attractor",
  "do": ["tune M such that eigenvalue_M = 1"],
  "effect": "network integrates input → persistent activity",
  "experimental_analog": "Oculomotor integrator"
}
```

**5. Increase Fisher Information (I Domain)**
```json
{
  "id": "do_increase_fisher",
  "do": ["increase ∂f(s)/∂s (steeper tuning curve)"],
  "effect": "reduces var(s_hat) via Cramér-Rao bound → better decoding",
  "experimental_analog": "Attention sharpens tuning curves"
}
```

**6. Apply Hebbian Learning (L Domain)**
```json
{
  "id": "do_hebbian",
  "do": ["set dw/dt = v u"],
  "effect": "weights grow without bound unless constrained",
  "experimental_analog": "LTP induction"
}
```

**7. Apply Oja Rule (L Domain)**
```json
{
  "id": "do_oja",
  "do": ["set dw/dt = v u - α v² w"],
  "effect": "w converges to principal eigenvector of C_input",
  "experimental_analog": "Synaptic scaling + Hebbian plasticity"
}
```

**8. Provide Reward Signal (L Domain)**
```json
{
  "id": "do_reward",
  "do": ["set r(t) > 0"],
  "effect": "generates positive δ_TD → strengthens preceding weights",
  "experimental_analog": "Dopamine release (VTA)"
}
```

**9. Optimize Free Energy (L Domain)**
```json
{
  "id": "do_em_learning",
  "do": ["maximize free_energy via EM"],
  "effect": "learns generative model P(u, v) → sparse coding, ICA",
  "experimental_analog": "Sleep/wake cycle (Helmholtz machine hypothesis)"
}
```

### 2. Audit Script

**File:** `Theoretical-Neuroscience/neural_dynamics_audit.py`

Validate:
- **Cable equation**: Simulate passive voltage spread, verify space/time constants
- **Hodgkin-Huxley**: Reproduce action potential waveform, check Na+/K+ dynamics
- **Integrate-and-fire**: Compute f-I curve, compare to theoretical prediction
- **Wilson-Cowan**: Test stability transitions (E/I parameter sweep)
- **Eigenvalue analysis**: Confirm stability criterion (Re(λ) < 1)
- **Fisher information**: Compute from Poisson tuning curves, verify Cramér-Rao bound
- **Oja rule**: Simulate convergence to principal component
- **TD learning**: Verify convergence to Bellman equation
- **EM algorithm**: Test free energy bound on log-likelihood

**CLI Example:**
```bash
python3 Theoretical-Neuroscience/neural_dynamics_audit.py \
  --spec Theoretical-Neuroscience/neural_dynamics_causal_graph.json \
  --validate-biophysics \
  --validate-network-stability \
  --validate-information-bounds \
  --validate-learning-convergence
```

### 3. Sample Dataset

**File:** `Theoretical-Neuroscience/sample_neural_data.csv`

Columns:
- `neuron_id`: Identifier
- `V_rest`, `V_thresh`, `V_reset`: Voltage parameters (mV)
- `tau_m`, `lambda`: Time/space constants
- `g_Na`, `g_K`: Conductances
- `firing_rate`: Observed spike rate (Hz)
- `W_EE`, `W_IE`: Synaptic weights
- `eigenvalue_real`, `eigenvalue_imag`: Eigenvalues of M
- `network_state`: {stable, unstable, oscillatory}
- `Fisher_I`: Measured Fisher information
- `var_s_hat`: Stimulus estimation variance
- `learning_rule`: {hebbian, oja, td, em}
- `convergence_achieved`: Boolean

### 4. README Update

**File:** `Theoretical-Neuroscience/README.md`

Document:
- N = ⟨B, D, I, L⟩ framework overview
- Graph structure (4 domains, nodes, edges, constraints)
- Key theorems (Cramér-Rao, Oja convergence, TD convergence)
- Cross-domain causal links (B → D → I → L)
- Quick start command
- Expected audit output (biophysics validation, stability analysis, information bounds, learning convergence)

## Expected Output Structure

```
=== Neural Dynamics Causal Graph Audit Report ===

1. GRAPH VALIDATION
   ✓ 35 nodes across 4 domains (B, D, I, L)
   ✓ 48 edges (including cross-domain links)
   ✓ DAG confirmed

2. BIOPHYSICAL SUBSTRATE (B) VALIDATION
   Cable Equation:
     ✓ V(x,t) matches analytical solution
     ✓ τ_m = 20 ms, λ = 1.5 mm (verified)
   
   Hodgkin-Huxley:
     ✓ Action potential amplitude: 110 mV
     ✓ Na+ activation, K+ delayed activation confirmed
     ✓ Refractory period: 2 ms
   
   Integrate-and-Fire:
     ✓ f-I curve: ν = 1/(τ_ref + τ_m ln(...))
     ✓ Linear regime at low current: slope = 0.14 Hz/pA

3. NETWORK DYNAMICS (D) VALIDATION
   Wilson-Cowan Stability:
     ✓ Stable regime: Re(λ) = 0.73 < 1
     ✓ Oscillatory regime: λ = 0.95 ± 0.31i
     ✓ Unstable regime: Re(λ) = 1.12 > 1 (diverges)
   
   Line Attractor:
     ✓ λ = 1.00 → persistent activity
     ✓ Network integrates input over 500 ms
   
   Associative Memory:
     ✓ 12 memory patterns stored
     ✓ Retrieval accuracy: 94%

4. INFORMATION METRIC (I) VALIDATION
   Fisher Information:
     ✓ I(s) = 120 spikes/deg² (Poisson neuron)
     ✓ var(s_hat) = 0.0084 deg²
     ✓ Cramér-Rao bound: var ≥ 1/I = 0.0083 ✓ (saturated!)
   
   Optimal Encoding:
     ✓ Histogram equalization: tuning curve ∝ CDF(stimulus)
     ✓ Maximizes mutual information: 2.3 bits

5. LEARNING OPERATOR (L) VALIDATION
   Oja Rule Convergence:
     ✓ w(t) → eigenvector_1 of C_input
     ✓ Captures 78% of variance (principal component)
     ✓ Converges in 450 iterations
   
   TD Learning:
     ✓ δ(t) = r(t) + v(t+1) - v(t)
     ✓ v(t) converges to Bellman equation
     ✓ Prediction error → 0 after 120 episodes
   
   EM Algorithm:
     ✓ Free energy bounds log-likelihood
     ✓ Sparse coding: Gabor-like receptive fields emerge
     ✓ Log-likelihood increases monotonically

6. CROSS-DOMAIN LINKS
   ✓ B → D: firing_rate aggregates to population v_E, v_I
   ✓ D → I: network_state determines coding_efficiency
   ✓ I → L: Fisher_I scales optimal learning rate
   ✓ L → D: learned weights w shape eigenvalue_M
   ✓ L → B: plasticity modifies synaptic conductances

=== RECOMMENDATIONS ===
- Cramér-Rao bound is saturated → optimal encoding achieved
- Oja rule converges to PCA → unsupervised feature extraction
- TD learning implements reinforcement learning (dopamine = δ)
- EM algorithm explains V1 receptive field structure
- All four domains are causally integrated in N = ⟨B, D, I, L⟩
```

## Implementation Notes

- Use `numpy`, `scipy`, `matplotlib`, `brian2` (for biophysical simulations)
- Include visualizations:
  - Hodgkin-Huxley action potential waveform
  - Wilson-Cowan phase plane (v_E vs v_I)
  - Fisher information vs variance (Cramér-Rao saturation)
  - Oja rule convergence to principal component
  - TD error decay over episodes
- Ensure JSON schema follows existing conventions

---

**Deliverables:**
1. ✅ `neural_dynamics_causal_graph.json` - Complete SCM specification
2. ✅ `neural_dynamics_audit.py` - Validation and audit script
3. ✅ `sample_neural_data.csv` - Demo dataset
4. ✅ `README.md` - Documentation and usage

**Verification Command:**
```bash
python3 Theoretical-Neuroscience/neural_dynamics_audit.py \
  --spec Theoretical-Neuroscience/neural_dynamics_causal_graph.json \
  --validate-biophysics \
  --validate-network-stability \
  --validate-information-bounds \
  --validate-learning-convergence
```

## Reference Proofs (from source)

- **Cramér-Rao Bound**: Complete 4-step proof (SUMMARY.md line 39)
- **Oja Convergence**: Proof that w → principal eigenvector (SUMMARY.md line 42)
- **Cable Equation**: Derived from Kirchhoff's laws (SUMMARY.md line 35)
- **TD Convergence**: Proof of convergence to Bellman equation (SUMMARY.md line 43)
