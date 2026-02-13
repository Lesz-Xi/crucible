# Summary: Derivation of the Chalmers Ansatz

## Document Overview

**Title:** Derivation of the Chalmers Ansatz: A Formal Mathematical Framework for Naturalistic Dualism

**Author:** K-Dense Web
**Contact:** contact@k-dense.ai
**Date:** February 2026

## Deliverables

| File | Location | Description |
|------|----------|-------------|
| `chalmers_ansatz.tex` | `final/` | Complete LaTeX source (ready for compilation) |
| `v1_chalmers_ansatz.tex` | `drafts/` | Version-controlled draft |
| `graphical_abstract.png` | `figures/` | Publication-quality graphical abstract |

## Document Structure

### 1. Legend of Variables
Comprehensive symbol definitions organized by category:
- **Primary Domains**: P, M, E, L, U
- **Modal Operators**: W_log, W_nat, ⊨_log, ⊨_nat
- **Mapping Functions**: Ψ, F_org, S(·), A
- **Information Operators**: I, Φ_P, Φ_E
- **Quantum Notation**: |Ψ_univ⟩, |P_i⟩, c_i, E_i

### 2. Derivation of the Chalmers Ansatz

#### §2.1 Fundamental Domains (Ch 1 & 4)
- Definition of Universe Tuple: U = ⟨P, M, E, L⟩
- Axiom: Causal Closure of P
- Theorem: P ⊨_log M (Psychological supervenes logically)
- Axiom: E is fundamental (ontologically primitive)

#### §2.2 The Hard Problem (Ch 3)
- Kripke Frame definition for modal analysis
- **Zombie Theorem**: ∃w ∈ W_log : (P(w) = P_actual) ∧ (E(w) = ∅)
- **Corollary**: P ⊭_log E (Logical supervenience fails)
- **Corollary**: Materialism is false

#### §2.3 Psychophysical Laws (Ch 4 & 6)
- Axiom: P ⊨_nat E (Natural supervenience)
- Definition: Bridging function Ψ: P → E
- **Principle of Structural Coherence**: S(E) ≅ S(A)

#### §2.4 Invariance & Information (Ch 7 & 8)
- Definition: Fine-grained functional organization F_org(x)
- **Principle of Organizational Invariance**: F_org(x) = F_org(y) ⇒ E(x) ≡ E(y)
- Definition: Information Space I
- **Double-Aspect Principle**: ∀s ∈ I: ∃Φ_P(s) ∧ ∃Φ_E(s)

#### §2.5 Quantum Integration (Ch 10)
- Universal State: |Ψ_univ⟩ = Σ c_i |P_i⟩
- **Superposition of Minds Theorem**: E(|Ψ_univ⟩) → {E_i}
- Resolution of measurement problem via phenomenal discreteness

### 3. Summary Box
Complete Chalmers Ansatz in condensed form with all key equations.

## Compilation Instructions

To compile the LaTeX document:

```bash
cd writing_outputs/final/
pdflatex chalmers_ansatz.tex
pdflatex chalmers_ansatz.tex  # Run twice for references
```

**Required LaTeX packages:**
- amsmath, amssymb, amsthm
- mathtools, physics
- graphicx, geometry
- fancyhdr, hyperref
- xcolor, tcolorbox
- enumitem, booktabs

## Notation Conventions

- **Set-theoretic notation** (no category theory as specified)
- **Kripke semantics** for modal logic
- **Standard quantum bra-ket notation**
- All variables defined before use

## Source Material Adherence

All derivations strictly follow Chalmers' *The Conscious Mind* chapter summaries:
- No external models (IIT, Orch-OR) introduced
- Every theorem traced to specific chapter content
- Modal arguments use standard Kripke semantics as requested

---

*Generated using K-Dense Web ([k-dense.ai](https://k-dense.ai))*
