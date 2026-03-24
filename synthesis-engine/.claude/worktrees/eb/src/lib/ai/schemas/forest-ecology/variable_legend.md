# Legend of Variables: Forest Network Biophysics

This document provides a comprehensive legend of mathematical symbols used to model
the biophysics of forest networks, based on principles from *The Hidden Life of Trees*.

---

## Table of Contents

1. [Variable Categories](#variable-categories)
   - [1. Network Coupling](#network-coupling)
   - [2. Structural Density](#structural-density)
   - [3. Hydrodynamics](#hydrodynamics)
   - [4. Signal Processing](#signal-processing)
   - [5. Thermodynamics](#thermodynamics)
   - [6. Entropic Forces](#entropic-forces)
   - [7. Human Interference](#human-interference)
2. [Constitutive Equations](#constitutive-equations)
3. [Summary Statistics](#summary-statistics)

---

## Variable Categories

### Network Coupling

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $K_{net}$ | Network coupling strength | dimensionless | Measures the degree of interconnection and support between trees |
| $N_{nodes}$ | Number of tree nodes | count | Total trees functioning as nodes in the network |
| $N_{edges}$ | Number of connections | count | Root and fungal connections between trees |
| $L_{root}$ | Root network length | meters | Total length of interconnected root systems |
| $A_{fungal}$ | Fungal network surface area | m^2 | Area of fungal mycelium (Wood Wide Web) |
| $k_{avg}$ | Average node degree | dimensionless | Mean connections per tree |
| $C_{cluster}$ | Clustering coefficient | dimensionless | Probability that neighbors are connected |
| $\lambda_{path}$ | Average path length | hops | Mean number of steps between any two trees |
| $J_{nutrient}$ | Nutrient flux | mol/s | Rate of nutrient transfer between connected trees |
| $\phi_{sugar}$ | Sugar transfer rate | g/day | Rate of carbohydrate redistribution |

### Structural Density

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $D_{wood}$ | Wood density | kg/m^3 | Mass per unit volume of wood tissue |
| $v_{growth}$ | Growth velocity | m/year | Rate of radial or height increase |
| $\sigma_{tensile}$ | Tensile strength | MPa | Maximum stress before structural failure |
| $H_{tree}$ | Tree height | m | Vertical extent from ground to crown |
| $r_{trunk}$ | Trunk radius | m | Cross-sectional radius of main stem |
| $F_{wind}$ | Wind force | N | Lateral force from wind loading |
| $F_{snow}$ | Snow load | N | Vertical force from accumulated snow |
| $\tau_{shear}$ | Shear stress | MPa | Stress from deformation parallel to surface |
| $M_{bending}$ | Bending moment | N*m | Torque causing trunk curvature |
| $\theta_{branch}$ | Branch angle | radians | Angle of branch departure from trunk |
| $A_{crown}$ | Crown projected area | m^2 | Horizontal projection of canopy area |

### Hydrodynamics

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $P_{hydro}$ | Hydrostatic pressure | MPa | Water pressure in xylem vessels |
| $Q_{water}$ | Water flow rate | L/day | Volume of water transported per unit time |
| $\psi_{soil}$ | Soil water potential | MPa | Free energy of water in soil matrix |
| $\psi_{leaf}$ | Leaf water potential | MPa | Free energy of water in leaf tissue |
| $r_{xylem}$ | Xylem vessel radius | um | Internal radius of water-conducting vessels |
| $L_{xylem}$ | Xylem pathway length | m | Distance from roots to leaves |
| $\eta_{water}$ | Water viscosity | Pa*s | Dynamic viscosity of sap/water |
| $\kappa_{cond}$ | Hydraulic conductance | m^3/(MPa*s) | Ease of water flow through tissue |
| $E_{trans}$ | Transpiration rate | mmol/(m^2*s) | Rate of water vapor loss from leaves |
| $g_{stomata}$ | Stomatal conductance | mol/(m^2*s) | Permeability of stomata to gas exchange |
| $VPD$ | Vapor pressure deficit | kPa | Atmospheric drying power |

### Signal Processing

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $C_{VOC}$ | VOC concentration | ppb | Volatile organic compound concentration in air |
| $k_{signal}$ | Signal transmission rate | 1/s | Rate of chemical signal propagation |
| $\tau_{response}$ | Response time | s | Time delay between stimulus and response |
| $V_{action}$ | Action potential | mV | Electrical signal amplitude in phloem |
| $f_{signal}$ | Signal frequency | Hz | Oscillation frequency of signals (e.g., 220 Hz acoustic) |
| $\lambda_{wave}$ | Signal wavelength | m | Spatial period of propagating signal |
| $I_{mutual}$ | Mutual information | bits | Shared information between connected trees |
| $H_{entropy}$ | Information entropy | bits | Uncertainty in signal content |
| $R_{info}$ | Information rate | bits/s | Rate of information transfer through network |

### Thermodynamics

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $E_{photo}$ | Photosynthetic energy | J/day | Energy captured through photosynthesis |
| $E_{resp}$ | Respiration energy | J/day | Energy consumed by cellular respiration |
| $E_{growth}$ | Growth energy | J/day | Energy allocated to biomass production |
| $E_{defense}$ | Defense energy | J/day | Energy invested in chemical/structural defense |
| $M_{carbon}$ | Stored carbon mass | kg | Total carbon sequestered in biomass |
| $dM_{dt}$ | Carbon sequestration rate | kg/year | Net rate of carbon storage |
| $\chi_{CO2}$ | CO2 concentration | ppm | Atmospheric carbon dioxide level |
| $T_{ambient}$ | Ambient temperature | K | Air temperature in forest environment |
| $T_{leaf}$ | Leaf temperature | K | Surface temperature of foliage |
| $\Delta_{T}$ | Temperature reduction | K | Cooling effect from transpiration |
| $Q_{latent}$ | Latent heat flux | W/m^2 | Energy removed via evaporative cooling |

### Entropic Forces

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $S_{entropy}$ | System entropy | J/K | Thermodynamic disorder of forest system |
| $dS_{dt}$ | Entropy production rate | J/(K*s) | Rate of disorder increase |
| $\tau_{decay}$ | Decay time constant | years | Characteristic time for decomposition |
| $P_{fungal}$ | Fungal decay activity | dimensionless | Intensity of fungal decomposition |
| $\alpha_{degrade}$ | Degradation rate | 1/year | Rate of structural deterioration |
| $f_{integrity}$ | Structural integrity | dimensionless | Fraction of original structural strength |
| $t_{lifespan}$ | Tree lifespan | years | Expected operational lifetime |
| $k_{decomp}$ | Decomposition rate constant | 1/year | First-order decay constant for dead wood |
| $M_{dead}$ | Dead biomass | kg | Mass of non-living organic matter |
| $R_{recycle}$ | Nutrient recycling rate | kg/year | Rate of nutrient return to soil |

### Human Interference

| Symbol | Name | Units | Biophysical Definition |
|--------|------|-------|------------------------|
| $I_{human}$ | Human interference index | dimensionless | Aggregate measure of anthropogenic impact |
| $D_{disturb}$ | Disturbance intensity | dimensionless | Severity of management/harvesting activities |
| $f_{managed}$ | Managed fraction | dimensionless | Proportion of forest under active management |
| $\beta_{isolation}$ | Isolation factor | dimensionless | Degree of disconnection from natural network |
| $\rho_{soil compact}$ | Soil compaction | kg/m^3 | Increased soil density from human activity |
| $v_{urban}$ | Urban tree growth rate | m/year | Accelerated, unregulated growth in urban trees |
| $G_{biodiversity}$ | Biodiversity index | dimensionless | Species richness and evenness measure |
| $S_{stability}$ | System stability | dimensionless | Resistance to perturbation |
| $K_{carrying}$ | Carrying capacity | trees/ha | Maximum sustainable population density |

---

## Constitutive Equations

The following equations define the functional relationships between variables:

### Equation 1: Wood density inversely proportional to growth velocity

$$
D_{wood} = \frac{\alpha_{1}}{v_{growth}}
$$

**Source**: Chapter 6: "Slowly Does It"

**Biophysical Meaning**: Slow-growing trees develop denser, stronger wood due to tighter cell packing

### Equation 2: System stability as function of network coupling

$$
S_{stability} = K_{net} \alpha_{2} \left(1 - e^{- C_{cluster}}\right)
$$

**Source**: Chapter 1: "Friendships" & Chapter 9: "United We Stand"

**Biophysical Meaning**: Well-connected forests (high K_net and clustering) exhibit greater stability

### Equation 3: Energy allocation balance in trees

$$
E_{photo} - E_{resp} = E_{defense} + E_{growth} + E_{maint}
$$

**Source**: Chapter 25: "The Sick Tree"

**Biophysical Meaning**: Trees partition net photosynthetic energy among growth, defense, and maintenance

### Equation 4: Water flow through xylem (Hagen-Poiseuille adaptation)

$$
Q_{water} = \frac{\pi \Delta_{P} r_{xylem}^{4}}{8 L_{xylem} \eta_{water}}
$$

**Source**: Chapter 10: "The Mysteries of Moving Water"

**Biophysical Meaning**: Water flux scales with r^4; small vessel changes dramatically affect flow

### Equation 5: Temperature reduction from evaporative cooling

$$
\Delta_{T} = E_{trans} \beta \lambda_{evap}
$$

**Source**: Chapter 17: "Woody Climate Control"

**Biophysical Meaning**: Transpiration removes latent heat, cooling local environment by several degrees

### Equation 6: Entropy increase from fungal decay activity

$$
dS_{dt} = P_{fungal} \gamma \left(1 - f_{integrity}\right)
$$

**Source**: Chapter 11: "Trees Aging Gracefully" & Chapter 20: "Community Housing"

**Biophysical Meaning**: Structural degradation accelerates entropy production

### Equation 7: Net carbon sequestration rate

$$
dM_{dt} = E_{photo} \eta_{conv} - M_{dead} k_{decomp}
$$

**Source**: Chapter 16: "Carbon Dioxide Vacuums"

**Biophysical Meaning**: Net storage = photosynthetic input minus decomposition losses

### Equation 8: Information transfer capacity in forest network

$$
I_{mutual} = \frac{K_{net} \log{\left(N_{nodes} \right)}}{\lambda_{path}}
$$

**Source**: Chapter 2: "The Language of Trees"

**Biophysical Meaning**: Information sharing scales with coupling and network size, inversely with path length

### Equation 9: Accelerated growth rate in isolated urban trees

$$
v_{urban} = v_{growth} \left(\beta_{isolation} + 1\right)
$$

**Source**: Chapter 27: "Street Kids"

**Biophysical Meaning**: Isolated trees grow faster without network dampening, but with structural weakness

### Equation 10: Biodiversity as function of stability and human interference

$$
G_{biodiversity} = S_{stability} \left(- \frac{I_{human}}{I_{max}} + 1\right)
$$

**Source**: Chapter 35: "Set Free"

**Biophysical Meaning**: Biodiversity increases with stability and decreases with human disturbance

---

## Summary Statistics

- **Total Variable Categories**: 7
- **Total Variables Defined**: 71
- **Total Constitutive Equations**: 10

### Variables per Category

| Category | Count |
|----------|-------|
| Network Coupling | 10 |
| Structural Density | 11 |
| Hydrodynamics | 11 |
| Signal Processing | 9 |
| Thermodynamics | 11 |
| Entropic Forces | 10 |
| Human Interference | 9 |

### Key Functional Relationships

1. **Inverse Proportionality**: $D_{wood} \propto 1/v_{growth}$ (slow growth = dense wood)
2. **Network Stability**: $S_{stability} \propto K_{net} \cdot (1 - e^{-C_{cluster}})$
3. **Energy Conservation**: $E_{photo} - E_{resp} = E_{growth} + E_{defense} + E_{maint}$
4. **Hydraulic Scaling**: $Q_{water} \propto r_{xylem}^4$ (fourth-power dependence)
5. **Carbon Balance**: $dM_{carbon}/dt = E_{photo} \cdot \eta - k_{decomp} \cdot M_{dead}$

---

*Generated by K-Dense Variable Formalization Script*
*Date: 2026-01-24*