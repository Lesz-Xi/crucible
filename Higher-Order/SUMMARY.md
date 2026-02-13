# The Formalism of Higher-Order State Topologies

## Document Overview
A rigorous set-theoretic and modal-logical formalization of David Rosenthal's Higher-Order Theory (HOT) of consciousness.

## Generated Files

### Final Output
| File | Description |
|------|-------------|
| `final/formalism_higher_order_state_topologies.pdf` | Main document (9 pages) |
| `final/formalism_higher_order_state_topologies.tex` | LaTeX source |

### Figures
| File | Description |
|------|-------------|
| `figures/graphical_abstract.png` | Graphical abstract showing HOT topology |

### Working Files
| File | Description |
|------|-------------|
| `drafts/v1_draft.tex` | Draft LaTeX source |
| `progress.md` | Project progress log |

## Document Structure

### 1. Legend of Variables
- **Primary Structure**: $\mathcal{M} = \langle \mathcal{S}, \mathcal{Q}, \mathcal{H}, \mathcal{A} \rangle$
- **Sets**: Mental State Space ($\mathcal{S}$), Conscious/Subliminal partitions ($S_{\text{con}}, S_{\text{sub}}$), Qualia Space ($\mathcal{Q}$), HOT Space ($\mathcal{H}$)
- **Operators**: Awareness Operator ($\mathcal{A}$), HOT Operator ($H$), Target Function, Attitude Function, Resolution Function
- **Parameters**: Creature Consciousness ($C_{\text{creature}}$)

### 2. Derivations

#### 2.1 State Categories and Transitivity Principle
- Axiom: Creature Consciousness as boundary condition
- Definition: Partition of mental states into $S_{\text{con}} \sqcup S_{\text{sub}}$
- Axiom: Transitivity Principle (TP): $s \in S_{\text{con}} \iff \exists R : \mathcal{A}(R, s) = 1$

#### 2.2 HOT Mechanism
- Definition: HOT Operator $H: \mathcal{S} \to \{0,1\}$
- Theorem: **Separability** - Qualia independent of consciousness status
- Axiom: **Assertoric Constraint** - Only assertoric attitudes create consciousness

#### 2.3 Granularity Function
- Theorem: $\text{Res}(E) \propto \text{Res}(\mathcal{C}_E)$
- Corollary: Coarse concepts → Coarse experience

#### 2.4 Dental Fear Error (Misrepresentation)
- Theorem: HOT can create composite representation $R_{\text{pain}} \neq s_{\text{fear}} + s_{\text{vibration}}$
- Formalization of misrepresentation via functional mapping $\phi_H$

#### 2.5 Rejection of Alternative Topologies
1. **Inner Sense**: Proof that if H is perceptual, it must introduce qualia $Q_h \neq \emptyset$ → Contradiction → H is conceptual
2. **Dispositionalism**: Proof that $h_{\text{actual}} \neq h_{\text{potential}}$ violates TP
3. **Intrinsic Theory**: Conflicting Attitude proof - cannot have Doubt and Assert simultaneously in single state

### 3. Summary of the Rosenthal Ansatz
Complete formalization in boxed equations with all key results.

## Key Mathematical Results

| Result | Formalization |
|--------|---------------|
| Transitivity Principle | $s \in S_{\text{con}} \iff \exists h \in \mathcal{H} : \text{Target}(h) = s \land \text{Attitude}(h) = \text{Assert}$ |
| Separability | $\mathcal{Q}(s) \perp\!\!\!\perp C(s)$ |
| Granularity | $\text{Res}(E) \propto \text{Res}(\mathcal{C}_E)$ |
| Two-State Requirement | $C(s) = 1 \implies \exists h \in \mathcal{H} : h \neq s \land \text{Target}(h) = s$ |

## Source Adherence
All derivations strictly follow the source material:
- *Architectures of Higher-Order Theories of Consciousness* (Rosenthal)
- No external theories introduced (GWT, IIT) except as explicitly rejected alternatives

## Usage Instructions

### Viewing the PDF
```bash
open final/formalism_higher_order_state_topologies.pdf
```

### Recompiling LaTeX
```bash
cd final/
pdflatex formalism_higher_order_state_topologies.tex
pdflatex formalism_higher_order_state_topologies.tex
```

---
**Generated using K-Dense Web** ([k-dense.ai](https://k-dense.ai))
