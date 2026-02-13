# Mathematical Model: Grand Unified Scaling Equation (Phi_scale)

## Overview

This document provides the complete mathematical formulation for the "Grand Unified Scaling Equation" governing the dynamics of complex systems under both sublinear (Regime A) and superlinear (Regime B) scaling regimes. The model synthesizes principles from West's scaling theory to describe growth, equilibrium, and singularity phenomena across biological organisms, companies, and cities.

---

## 1. Fundamental Scaling Law

All complex systems exhibit a power-law relationship between a metabolic/throughput quantity Y and system size N:

$$
Y = Y_0 N^\beta
$$

**Where:**
- `Y` = Output rate (metabolic rate, revenue, GDP, patents, etc.)
- `N` = System size (mass, number of employees, population)
- `Y_0` = Normalization constant (system-specific)
- `beta` = Scaling exponent (determines regime behavior)

### Extracted Parameter Values (from Step 1)

| System Type | Symbol | beta Value | Regime |
|-------------|--------|------------|--------|
| Biological (Metabolic) | beta_bio | 0.75 (3/4) | Sublinear (A) |
| Corporate | beta_corp | 0.9 | Sublinear (A) |
| Urban Infrastructure | beta_infra | 0.85 | Sublinear (A) |
| Urban Socioeconomic | beta_socio | 1.15 | Superlinear (B) |

---

## 2. The Fundamental Growth Equation

Growth dynamics follow the "Input minus Maintenance" principle:

$$
\frac{dN}{dt} = a \cdot N^\beta - b \cdot N
$$

**Where:**
- `dN/dt` = Rate of change in system size
- `a` = Input rate coefficient (energy acquisition efficiency)
- `N^beta` = Metabolic/throughput scaling with system size
- `b` = Maintenance cost coefficient (per-unit operational cost)
- `N` = System size (linear maintenance scaling)

### Physical Interpretation

The first term `a * N^beta` represents energy/resource **input** that scales with the metabolic power law. The second term `b * N` represents **maintenance costs** that scale linearly with size (e.g., each cell requires maintenance energy, each employee has salary costs).

---

## 3. Regime A: Sublinear Scaling (beta < 1)

### 3.1 Governing Differential Equation

For sublinear systems (beta < 1), the growth equation is:

$$
\frac{dN}{dt} = a N^\beta - b N, \quad \text{where } \beta < 1
$$

### 3.2 Equilibrium Analysis

At equilibrium (steady state), `dN/dt = 0`:

$$
a N^\beta = b N
$$

$$
a N^\beta = b N^1
$$

$$
\frac{a}{b} = N^{1-\beta}
$$

$$
N^* = \left(\frac{a}{b}\right)^{\frac{1}{1-\beta}}
$$

**This is the Carrying Capacity / Asymptotic Size** for sublinear systems.

### 3.3 Stability Analysis

To verify stability, examine the sign of `dN/dt` around `N^*`:

- **For N < N^*:** Input dominates maintenance -> `dN/dt > 0` (growth)
- **For N > N^*:** Maintenance dominates input -> `dN/dt < 0` (contraction)

The equilibrium `N^*` is **stable** - systems approach this asymptotic limit.

### 3.4 Solution Trajectory

Rewriting the growth equation:

$$
\frac{dN}{dt} = a N^\beta \left(1 - \frac{b}{a} N^{1-\beta}\right)
$$

Let `K = (a/b)^{1/(1-beta)} = N^*`. Then:

$$
\frac{dN}{dt} = a N^\beta \left(1 - \left(\frac{N}{K}\right)^{1-\beta}\right)
$$

This is a **generalized logistic-type equation** that approaches the carrying capacity K asymptotically.

### 3.5 Approximate Analytical Solution (Sigmoidal Growth)

For beta = 3/4 (biological metabolic scaling), the solution takes the form:

$$
N(t)^{1-\beta} = K^{1-\beta} \left(1 - \left(1 - \left(\frac{N_0}{K}\right)^{1-\beta}\right) e^{-\frac{(1-\beta)b t}{1}}\right)
$$

Simplifying with m = 1 - beta = 0.25 (for biology):

$$
N(t)^m = K^m - (K^m - N_0^m) e^{-m \cdot b \cdot t}
$$

$$
N(t) = \left[ K^m - (K^m - N_0^m) e^{-m \cdot b \cdot t} \right]^{1/m}
$$

**Key Feature:** As `t -> infinity`, `N(t) -> K = N^*` (asymptotic stasis).

### 3.6 Physical Parameters for Regime A

| Parameter | Biological (beta=0.75) | Corporate (beta=0.9) |
|-----------|------------------------|----------------------|
| m = 1-beta | 0.25 | 0.10 |
| Approach rate | Faster | Slower |
| Carrying capacity | Fixed by a/b | Fixed by a/b |
| Half-life (companies) | - | ~10 years |

---

## 4. Regime B: Superlinear Scaling (beta > 1)

### 4.1 Governing Differential Equation

For superlinear systems (beta > 1), the growth equation is:

$$
\frac{dN}{dt} = a N^\beta - b N, \quad \text{where } \beta > 1
$$

### 4.2 Finite Time Singularity Derivation

For superlinear scaling, input grows faster than maintenance, leading to **unbounded growth**. Unlike Regime A, there is no stable equilibrium.

Neglecting the maintenance term for large N (since `N^beta >> N` when `beta > 1`):

$$
\frac{dN}{dt} \approx a N^\beta
$$

Separating variables:

$$
N^{-\beta} dN = a \, dt
$$

Integrating from initial conditions `(N_0, t_0)`:

$$
\int_{N_0}^{N} N'^{-\beta} dN' = a \int_{t_0}^{t} dt'
$$

$$
\left[ \frac{N'^{1-\beta}}{1-\beta} \right]_{N_0}^{N} = a(t - t_0)
$$

Since `beta > 1`, we have `1 - beta < 0`, let `gamma = beta - 1 > 0`:

$$
\frac{N^{-\gamma} - N_0^{-\gamma}}{-\gamma} = a(t - t_0)
$$

$$
N_0^{-\gamma} - N^{-\gamma} = a \gamma (t - t_0)
$$

$$
N^{-\gamma} = N_0^{-\gamma} - a \gamma (t - t_0)
$$

### 4.3 The Singularity Condition

**The singularity occurs when `N -> infinity`**, which happens when:

$$
N^{-\gamma} \to 0
$$

$$
N_0^{-\gamma} - a \gamma (t_{sing} - t_0) = 0
$$

$$
\boxed{t_{sing} = t_0 + \frac{N_0^{-(\beta-1)}}{a(\beta - 1)}}
$$

**This is the Finite Time Singularity** - the system demands infinite resources at time `t_sing`.

### 4.4 Solution Trajectory

The trajectory equation for superlinear growth:

$$
\boxed{N(t) = \frac{N_0}{\left[1 - \frac{t - t_0}{t_{sing} - t_0}\right]^{1/(\beta-1)}}}
$$

Or equivalently:

$$
N(t) = N_0 \left(1 - \frac{t - t_0}{\tau}\right)^{-1/(\beta-1)}
$$

Where `tau = (t_sing - t_0) = N_0^{-(beta-1)} / (a(beta-1))` is the time to singularity.

**Key Feature:** As `t -> t_sing`:
- The denominator `(1 - (t-t_0)/tau) -> 0`
- Therefore `N(t) -> infinity` (singularity)

### 4.5 Physical Parameters for Regime B

| Parameter | Urban Socioeconomic (beta=1.15) |
|-----------|--------------------------------|
| gamma = beta - 1 | 0.15 |
| 1/gamma | 6.67 |
| Pace of life scaling | t ~ N^{-0.15} |
| Singularity behavior | Unbounded growth requiring reset |

---

## 5. Unified Formulation: Phi_scale

The Grand Unified Scaling Equation can be written as a piecewise system:

$$
\Phi_{scale}: \quad \frac{dN}{dt} = a N^\beta - b N
$$

**With regime-dependent behavior:**

$$
\Phi_{scale}(N, t; \beta) =
\begin{cases}
N(t) \to N^* = \left(\frac{a}{b}\right)^{\frac{1}{1-\beta}} & \text{if } \beta < 1 \quad \text{(Stasis)} \\
N(t) \to \infty \text{ at } t_{sing} & \text{if } \beta > 1 \quad \text{(Singularity)}
\end{cases}
$$

---

## 6. Innovation Reset Mechanism (R_inn)

### 6.1 Purpose

For superlinear systems (Regime B), the singularity at `t_sing` represents system collapse. To avoid this, the system requires periodic **innovation resets** that effectively restart the trajectory with new parameters.

### 6.2 Mathematical Definition

The Innovation Reset `R_inn` is a **discrete state update** applied when the system approaches criticality:

$$
R_{inn}: \quad (N, a, t_{sing}) \mapsto (N', a', t'_{sing})
$$

**Trigger Condition:**
$$
\text{Apply } R_{inn} \text{ when } t \to t_{crit} = t_{sing} - \epsilon
$$

Where `epsilon > 0` is a safety margin before singularity.

### 6.3 Reset Dynamics

Upon reset at time `t_k`:

1. **Size continuation:** `N' = N(t_k^-)` (population/size preserved)

2. **Parameter update:** The input coefficient increases:
   $$a' = \alpha \cdot a, \quad \alpha > 1$$
   (representing technological/organizational innovation)

3. **New singularity time:**
   $$t'_{sing} = t_k + \frac{N'^{-(\beta-1)}}{a'(\beta - 1)}$$

### 6.4 Accelerating Innovation Requirement

**Critical Prediction:** The interval between successive resets must **decrease**:

$$
\Delta t_k = t_{sing,k} - t_k \to 0 \quad \text{as } k \to \infty
$$

This follows because:
- Each reset maintains or increases N
- Larger N means shorter time to next singularity
- Innovation rate must accelerate to compensate

### 6.5 Formal Reset Sequence

Let `{t_0, t_1, t_2, ...}` be the sequence of reset times. The dynamics are:

**Between resets (t_k <= t < t_{k+1}):**
$$
\frac{dN}{dt} = a_k N^{\beta} - b N
$$

**At reset (t = t_{k+1}):**
$$
\begin{aligned}
a_{k+1} &= \alpha_k \cdot a_k \\
N(t_{k+1}^+) &= N(t_{k+1}^-) \\
t_{sing,k+1} &= t_{k+1} + \frac{N(t_{k+1})^{-(\beta-1)}}{a_{k+1}(\beta-1)}
\end{aligned}
$$

### 6.6 Long-term Sustainability Warning

The requirement `Delta_t -> 0` implies:

$$
\lim_{k \to \infty} (t_{k+1} - t_k) = 0
$$

**This dynamic is fundamentally unsustainable** - infinite innovations are required in finite time, representing a "meta-singularity" in the innovation process itself.

---

## 7. Summary of Key Equations

### Fundamental Growth Equation
$$
\frac{dN}{dt} = a N^\beta - b N
$$

### Regime A: Sublinear (beta < 1)
- **Carrying capacity:** $N^* = \left(\frac{a}{b}\right)^{\frac{1}{1-\beta}}$
- **Trajectory:** $N(t) = \left[ K^m - (K^m - N_0^m) e^{-m \cdot b \cdot t} \right]^{1/m}$, where $m = 1 - \beta$

### Regime B: Superlinear (beta > 1)
- **Singularity time:** $t_{sing} = t_0 + \frac{N_0^{-(\beta-1)}}{a(\beta - 1)}$
- **Trajectory:** $N(t) = N_0 \left(1 - \frac{t - t_0}{\tau}\right)^{-1/(\beta-1)}$

### Innovation Reset
- **Trigger:** $t \to t_{crit} = t_{sing} - \epsilon$
- **Update:** $(a, t_{sing}) \mapsto (\alpha a, t'_{sing})$
- **Constraint:** $\Delta t_k \to 0$ (accelerating treadmill)

---

## 8. Variable-Parameter Mapping

| Symbol | Physical Meaning | Extracted Value |
|--------|------------------|-----------------|
| beta_bio | Biological metabolic exponent | 0.75 |
| beta_corp | Corporate scaling exponent | 0.9 |
| beta_infra | Urban infrastructure exponent | 0.85 |
| beta_socio | Urban socioeconomic exponent | 1.15 |
| a | Input/acquisition efficiency | System-specific |
| b | Maintenance cost per unit | System-specific |
| N | System size | Mass/employees/population |
| N* | Carrying capacity (Regime A) | (a/b)^{1/(1-beta)} |
| t_sing | Singularity time (Regime B) | Depends on N_0, a, beta |
| R_inn | Innovation reset operator | Discrete update |
| C_mar | Marchetti's constant | 1 hour/day |
| T_pace | Pace of life scaling | N^{-0.15} |

---

## 9. Implementation Notes for Simulation

The next step (Python simulation) should implement:

1. **Numerical ODE solver** for: `dN/dt = a*N^beta - b*N`
2. **Event detection** for singularity approach (N exceeds threshold or denominator approaches 0)
3. **Reset callback** implementing R_inn when near singularity
4. **Parameter sweeps** across different beta values
5. **Visualization** of:
   - Regime A: Asymptotic approach to N*
   - Regime B: Hyperbolic blow-up and reset cycles
   - Interval contraction between successive resets

---

*Document generated: 2026-01-24*
*Source: West's Universal Scaling Laws framework*
