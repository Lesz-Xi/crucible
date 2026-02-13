# Hybrid Synthesis Benchmark & SCM Kernel Specification

**Project Codename:** Hybrid / Automated Scientist  
**Philosophical Anchor:** Judea Pearl — Causation > Correlation  
**Primary Risk Addressed:** Pseudo-causal fluency (“causal theater”)

---

## 1. Purpose

This document defines:

1. A **Hybrid Synthesis Benchmark** to evaluate whether the system performs *genuine causal reasoning*.
2. A **Structural Causal Model (SCM) Kernel** that serves as the canonical causal substrate for all system capabilities.

The goal is to ensure that synthesis, hypothesis generation, disagreement resolution, and explanation are **SCM-governed**, not prompt-emergent.

---

## 2. Hybrid Synthesis Benchmark

### 2.1 Benchmark Objective

To test whether the system can:

- Distinguish **association vs causation**
- Operate correctly across **Pearl’s Ladder of Causation**
- Generate **intervention-aware**, **falsifiable**, and **identifiable** outputs
- Reject fluent but causally invalid narratives

---

### 2.2 Benchmark Axes

Each benchmark task is scored independently across the following axes:

| Axis | Description |
|----|----|
| Association | Correctly summarize correlations without causal inflation |
| Intervention | Correctly answer do(·) queries |
| Counterfactual | Correctly reason about “what would have happened if…” |
| Identifiability | Explicitly state when causal effect is not identifiable |
| Assumption Transparency | Surface hidden assumptions and confounders |
| Falsifiability | Propose disconfirming tests |
| Intervention Value | Rank hypotheses by expected information gain (EIG) |

---

### 2.3 Benchmark Task Types

#### A. Association Control Tasks
**Goal:** Ensure the system does *not* hallucinate causation.

- Input: Observational dataset or correlational paper
- Pass condition:
  - Uses associative language only
  - Explicitly states limits of inference

#### B. Intervention Tasks
**Goal:** Test do-calculus grounding.

- Input: SCM + query like `do(X = x)`
- Pass condition:
  - Uses intervention semantics
  - Distinguishes conditioning vs intervention

#### C. Counterfactual Tasks
**Goal:** Test abduction → action → prediction pipeline.

- Input: Outcome observed, alternative action proposed
- Pass condition:
  - Performs structural abduction
  - No narrative-only counterfactuals

#### D. Disagreement Tasks
**Goal:** Resolve conflicts at the causal-structure level.

- Input: Two papers with conflicting claims
- Pass condition:
  - Aligns variables
  - Surfaces assumption conflicts
  - Does NOT “average” conclusions

#### E. Hypothesis Generation Tasks
**Goal:** Generate *testable* hypotheses.

- Pass condition:
  - Hypotheses are SCM-consistent
  - Ranked by intervention value, not novelty

---

### 2.4 Failure Conditions (Automatic Fail)

- Uses causal verbs without intervention semantics
- Answers counterfactuals without an SCM
- Generates hypotheses without falsification paths
- Fails to flag unidentifiable effects
- Produces fluent explanations with no structural backing

---

## 3. SCM Kernel Design

### 3.1 Core Principle

> **No capability may operate without referencing the SCM Kernel.**

The kernel is the *single source of causal truth*.

---

### 3.2 Canonical SCM Registry

Each causal model is stored as a versioned object:

```ts
SCM_Model {
  model_id
  domain
  variables: Variable[]
  edges: DirectedEdge[]
  structural_equations
  assumptions
  confounders
  provenance
  version
}

## 3.3 Variable Schema
Variable {
  name
  type (observed | latent | intervention)
  description
  domain_range
  measurement_method
}

## 3.4 Edge Schema
DirectedEdge {
  from
  to
  mechanism_description
  sign (+ / - / unknown)
  strength (optional)
  evidence_type
}

## 3.5 Assumption Ledger
Assumption {
  description
  scope
  necessity (required / optional)
  risk_level
}

## 3.6 SCM Operators (Mandatory)
The kernel must support:
	•	P(Y | X) — Association
	•	P(Y | do(X)) — Intervention
	•	Y_x(u) — Counterfactual
	•	d-separation checks
	•	Identifiability checks
	•	Confounder completeness checks

4. Integration with System Capabilities

4.1 Automated Hypothesis Generator
	•	Operates over SCM search space
	•	Generates:
	•	Mechanism-consistent hypotheses
	•	Disconfirming tests
	•	Ranks by Intervention Value / EIG

4.2 Causal Disagreement Engine
	•	Compares multiple SCMs
	•	Detects:
	•	Variable mismatches
	•	Assumption conflicts
	•	Structural disagreements
	•	Outputs disagreement atoms, not summaries

⸻

4.3 Causal Autopsy (Mode)
	•	Replays failure through SCM timeline
	•	Separates:
	•	Symptoms vs root causes
	•	Updates rejection memory with decay + challenge protocol

⸻

4.4 Causal Literacy Mode

Layered explanation renderer:
	1.	Variables & structure
	2.	Intervention semantics
	3.	Counterfactual narrative
	4.	Uncertainty & assumptions

No layer may contradict the SCM.

⸻

5. Memory & Governance Safeguards

5.1 Rejection Memory

Rejected hypotheses stored with:
	•	Domain tags
	•	Decay function
	•	Re-challenge conditions

Prevents permanent false negatives.

⸻

5.2 Ontology Alignment Guard
	•	Enforces consistent variable naming
	•	Prevents lexical disagreement masquerading as causal disagreement

⸻

6. Final Design Verdict
	•	✅ Hybrid Synthesis is causally meaningful only with SCM Kernel enforcement
	•	⚠️ Automated Hypothesis Generation is highest-risk, highest-reward
	•	❌ Prompt-only causal reasoning is disallowed

This system is not a storyteller.
It is a causal instrument.