# Node-Level Stability Derivation

## Overview

This document presents the mathematical derivation of the differential equation
governing the stability of a single tree node ($S_i$) in a forest network system.
The equation integrates internal biological factors and external forces.

---

## The Node Stability Differential Equation

The stability of node $i$ evolves according to:

$$
\frac{dS_i}{dt} = \underbrace{\text{Stabilizing Terms}}_{(+)} - \underbrace{\text{Destabilizing Terms}}_{(-)}
$$

### Complete Equation

$$
\frac{dS_i}{dt} = \underbrace{\alpha_{\text{struct}} \frac{D_{\text{wood}}}{D_{\text{ref}}} f_{\text{int}} + \alpha_{\text{plastic}} \sigma_g G_{\text{adapt}} + \alpha_{\text{energy}} \frac{E_{\text{photo}} - E_{\text{resp}} + E_{\text{res}}}{E_{\text{avail}} + E_{\text{def}}} + \alpha_{\text{net}} K_{\text{net}}(1 - e^{-C_{\text{cluster}}})}_{\text{Stabilizing (+)}}
$$

$$
- \underbrace{\beta_{\text{entropy}} \frac{dS_{\text{entropy}}/dt}{\tau_{\text{decay}}} + \beta_{\text{disturb}} \frac{E_{\text{dist}}}{\sigma_{\text{tensile}} r_{\text{trunk}}^2} + \beta_{\text{human}} I_{\text{human}}(1 + \beta_{\text{isolation}})}_{\text{Destabilizing (-)}}
$$

---

## Stabilizing Terms (+)

These terms increase node stability and represent internal biological resilience mechanisms.

### S1: Structural Integrity

$$
T_{\text{S1}} = \alpha_{\text{struct}} \cdot \frac{D_{\text{wood}}}{D_{\text{ref}}} \cdot f_{\text{integrity}}
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Wood Density | $D_{\text{wood}}$ | kg/m³ | Current wood density |
| Reference Density | $D_{\text{ref}}$ | kg/m³ | Baseline density for normalization |
| Structural Integrity | $f_{\text{integrity}}$ | [0,1] | Fraction of intact structural capacity |
| Coupling Coefficient | $\alpha_{\text{struct}}$ | 1/time | Rate constant for structural contribution |

**Physical Interpretation**: Denser wood provides greater mechanical stability. Slow-growing trees
develop tighter cell packing, resulting in higher resistance to mechanical failure.

### S2: Genetic Plasticity

$$
T_{\text{S2}} = \alpha_{\text{plastic}} \cdot \sigma_g \cdot G_{\text{adapt}}
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Plasticity Coefficient | $\sigma_g$ | dimensionless | Intrinsic genetic flexibility |
| Adaptive Response | $G_{\text{adapt}}$ | [0,1] | Current level of adaptive gene expression |
| Coupling Coefficient | $\alpha_{\text{plastic}}$ | 1/time | Rate constant for plasticity contribution |

**Physical Interpretation**: Trees with greater genetic plasticity can adapt their physiology
and morphology in response to environmental changes, enhancing long-term stability.

### S3: Energy Reserves

$$
T_{\text{S3}} = \alpha_{\text{energy}} \cdot \frac{E_{\text{photo}} - E_{\text{resp}} + E_{\text{reserve}}}{E_{\text{available}} + E_{\text{defense}}}
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Photosynthetic Energy | $E_{\text{photo}}$ | J/day | Energy captured via photosynthesis |
| Respiration Energy | $E_{\text{resp}}$ | J/day | Energy consumed by respiration |
| Energy Reserves | $E_{\text{reserve}}$ | J | Stored energy (sugars, starches) |
| Defense Energy | $E_{\text{defense}}$ | J/day | Energy allocated to defense mechanisms |
| Coupling Coefficient | $\alpha_{\text{energy}}$ | 1/time | Rate constant for energy contribution |

**Physical Interpretation**: Positive energy balance provides metabolic resources for repair,
defense, and growth. The denominator normalizes by total energy commitment, ensuring bounded output.

### S4: Network Support

$$
T_{\text{S4}} = \alpha_{\text{network}} \cdot K_{\text{net}} \cdot \left(1 - e^{-C_{\text{cluster}}}\right)
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Network Coupling | $K_{\text{net}}$ | dimensionless | Strength of mycorrhizal network connections |
| Clustering Coefficient | $C_{\text{cluster}}$ | dimensionless | Local connectivity density |
| Coupling Coefficient | $\alpha_{\text{network}}$ | 1/time | Rate constant for network contribution |

**Physical Interpretation**: Trees connected through the "Wood Wide Web" share resources and
information. The exponential saturating form ensures bounded support even with high clustering.

---

## Destabilizing Terms (-)

These terms decrease node stability and represent external threats and natural decay processes.

### D1: Entropic Decay

$$
T_{\text{D1}} = \beta_{\text{entropy}} \cdot \frac{dS_{\text{entropy}}/dt}{\tau_{\text{decay}}}
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Entropy Production Rate | $dS_{\text{entropy}}/dt$ | J/(K·s) | Rate of disorder increase |
| Decay Time Constant | $\tau_{\text{decay}}$ | years | Characteristic decomposition time |
| Coupling Coefficient | $\beta_{\text{entropy}}$ | K·s/J | Sensitivity to entropy production |

**Physical Interpretation**: According to the second law of thermodynamics, all systems tend
toward increased disorder. Fungal activity and natural aging drive entropy production.

### D2: Disturbance Energy

$$
T_{\text{D2}} = \beta_{\text{disturb}} \cdot \frac{E_{\text{dist}}}{\sigma_{\text{tensile}} \cdot r_{\text{trunk}}^2}
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Disturbance Energy | $E_{\text{dist}}$ | J | Total mechanical disturbance energy |
| Tensile Strength | $\sigma_{\text{tensile}}$ | MPa | Maximum stress before failure |
| Trunk Radius | $r_{\text{trunk}}$ | m | Cross-sectional trunk radius |
| Coupling Coefficient | $\beta_{\text{disturb}}$ | m²/MPa | Sensitivity to disturbance |

**Physical Interpretation**: External forces from wind, snow, and other disturbances stress
the tree structure. The denominator represents the structural capacity to resist deformation.

### D3: Human Interference

$$
T_{\text{D3}} = \beta_{\text{human}} \cdot I_{\text{human}} \cdot \left(1 + \beta_{\text{isolation}}\right)
$$

| Variable | Symbol | Units | Description |
|----------|--------|-------|-------------|
| Human Interference | $I_{\text{human}}$ | dimensionless | Aggregate anthropogenic impact index |
| Isolation Factor | $\beta_{\text{isolation}}$ | dimensionless | Network disconnection penalty |
| Coupling Coefficient | $\beta_{\text{human}}$ | 1/time | Sensitivity to human activities |

**Physical Interpretation**: Human activities (harvesting, pollution, urbanization) directly
destabilize trees. Isolated trees (urban "street kids") experience amplified effects due to
lack of network support and altered growth patterns.

---

## Compact Canonical Form

The equation can be written compactly as:

$$
\boxed{\frac{dS_i}{dt} = \sum_{j=1}^{4} T_{\text{S}j} - \sum_{k=1}^{3} T_{\text{D}k}}
$$

Or in explicit form:

$$
\frac{dS_i}{dt} = \left[\alpha_{\text{struct}} \frac{D_{\text{wood}}}{D_{\text{ref}}} f_{\text{int}} + \alpha_{\text{plastic}} \sigma_g G_{\text{adapt}} + \alpha_{\text{energy}} \frac{E_{\text{net}} + E_{\text{res}}}{E_{\text{tot}} + E_{\text{def}}} + \alpha_{\text{net}} K_{\text{net}}(1-e^{-C_{\text{cl}}})\right]
$$

$$
- \left[\beta_{\text{ent}} \frac{\dot{S}_{\text{ent}}}{\tau_{\text{dec}}} + \beta_{\text{dist}} \frac{E_{\text{dist}}}{\sigma_t r_t^2} + \beta_{\text{hum}} I_{\text{hum}}(1+\beta_{\text{iso}})\right]
$$

---

## Equilibrium Analysis

At equilibrium, $dS_i/dt = 0$, which implies:

$$
\sum_{j=1}^{4} T_{\text{S}j} = \sum_{k=1}^{3} T_{\text{D}k}
$$

This defines a **stability manifold** in parameter space where the tree node maintains
constant stability. Perturbations away from equilibrium lead to either:

- **Positive deviation** ($dS_i/dt > 0$): Recovery toward higher stability
- **Negative deviation** ($dS_i/dt < 0$): Decline toward instability/death

The long-term fate of the tree depends on whether stabilizing or destabilizing forces dominate.

---

## Dimensional Consistency

All terms must have dimensions of $[\text{stability}]/[\text{time}]$ or equivalently
$[\text{dimensionless}]/[\text{time}]$ if stability is normalized.

| Term | Expression | Dimensions |
|------|------------|------------|
| $T_{\text{S1}}$ | $\alpha_{\text{struct}} \cdot (D/D_{\text{ref}}) \cdot f$ | $[T^{-1}] \cdot [1] \cdot [1] = [T^{-1}]$ |
| $T_{\text{S2}}$ | $\alpha_{\text{plastic}} \cdot \sigma_g \cdot G$ | $[T^{-1}] \cdot [1] \cdot [1] = [T^{-1}]$ |
| $T_{\text{S3}}$ | $\alpha_{\text{energy}} \cdot E/E$ | $[T^{-1}] \cdot [1] = [T^{-1}]$ |
| $T_{\text{S4}}$ | $\alpha_{\text{network}} \cdot K \cdot (1-e^{-C})$ | $[T^{-1}] \cdot [1] \cdot [1] = [T^{-1}]$ |
| $T_{\text{D1}}$ | $\beta_{\text{entropy}} \cdot \dot{S}/\tau$ | $[\text{K·s/J}] \cdot [\text{J/(K·s)}]/[T] = [T^{-1}]$ |
| $T_{\text{D2}}$ | $\beta_{\text{disturb}} \cdot E/(\sigma r^2)$ | $[\text{m}^2/\text{MPa}] \cdot [\text{J}]/([\text{MPa}][\text{m}^2]) = [T^{-1}]$ |
| $T_{\text{D3}}$ | $\beta_{\text{human}} \cdot I \cdot (1+\beta)$ | $[T^{-1}] \cdot [1] \cdot [1] = [T^{-1}]$ |

All terms are dimensionally consistent with rate of stability change $[T^{-1}]$.

---

## Summary

### Stabilizing Terms (4 terms)

| # | Name | Physical Basis |
|---|------|----------------|
| S1 | Structural Integrity | Dense wood resists mechanical failure |
| S2 | Genetic Plasticity | Adaptive capacity to environmental change |
| S3 | Energy Reserves | Metabolic resources for repair and defense |
| S4 | Network Support | Resource sharing through mycorrhizal network |

### Destabilizing Terms (3 terms)

| # | Name | Physical Basis |
|---|------|----------------|
| D1 | Entropic Decay | Thermodynamic tendency toward disorder |
| D2 | Disturbance Energy | Mechanical stress from wind, snow, fire |
| D3 | Human Interference | Anthropogenic impacts amplified by isolation |

---

*Generated by K-Dense Node Stability Derivation Script*

*Date: 2026-01-24*

*Step 2 of Forest Network Biophysics Implementation*