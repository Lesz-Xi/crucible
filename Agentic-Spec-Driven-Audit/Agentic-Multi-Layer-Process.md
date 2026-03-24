## Real Causal Engine Guardrails

### Purpose

This section defines the non-negotiable rules that prevent the multi-agent workflow from producing **causal theater** instead of a **real causal engine**.

The Observe → Think → Act process is allowed to accelerate research, specification, implementation, and validation. It is **not** allowed to replace formal causal computation with persuasive language, prompt choreography, or architectural aesthetics.

The central rule is simple:

> A component only counts as part of the causal engine core if it creates, executes, validates, or audits **formal causal structure**.

Everything else is support infrastructure.

---

### Guardrail 1 — No Causal Claim Without Formal Artifact

No task output may be labeled as:
- causal inference
- intervention engine
- counterfactual reasoning
- identifiability logic
- SCM execution

unless it produces or operates on at least one explicit formal artifact such as:

- variable schema
- typed node representation
- directed causal graph / DAG
- structural equation representation
- exogenous / endogenous variable distinction
- intervention operator semantics
- graph mutilation logic
- adjustment / identification rule
- benchmarked solver output

If an output only contains:
- prompts
- heuristics
- summaries
- graph-like metaphors
- LLM-generated explanations
- narrative reasoning

then it must be labeled as one of the following instead:

- causal reasoning assistance
- architecture concept
- research synthesis
- explanation layer
- orchestration layer
- speculative design

#### Enforcement Test

Before marking a task as “causal-engine progress,” ask:

> What formal artifact exists now that did not exist before?

If no formal artifact exists, the task is not core causal-engine work.

---

### Guardrail 2 — The LLM Cannot Be the Hidden Reasoner

The LLM may assist with:
- translating user intent into formal query form
- explaining engine outputs in natural language
- summarizing research papers
- drafting specifications
- identifying inconsistencies for human review

The LLM may **not** be treated as the causal engine itself.

The LLM must not be the final authority for:
- causal graph construction from assumptions without explicit representation
- intervention computation
- counterfactual evaluation
- identifiability determination
- causal effect calculation
- structural equation execution

The required test is:

> If the LLM disappeared tomorrow, would the core causal computation still work?

If the answer is **no**, then that component is not part of the true causal engine.

#### Allowed Pattern

```text
User question
→ LLM translates into formal causal query
→ Causal engine computes
→ LLM explains result

Forbidden Pattern

User question
→ LLM “reasons causally”
→ output is treated as causal inference


⸻

Guardrail 3 — Every Task Must Map to the Causal Engine v1 Spec

Every agent task that claims relevance to the real engine must declare, explicitly, which v1 component it advances.

Each task must map to one of the following:

Core Engine Categories
	•	variable/model representation
	•	graph representation
	•	structural equation representation
	•	intervention semantics
	•	graph mutilation execution
	•	forward solver / execution engine
	•	benchmark suite
	•	validation harness
	•	query parser / formal query layer

Non-Core but Necessary Categories
	•	explanation layer
	•	orchestration layer
	•	logging / traceability
	•	research synthesis
	•	UI / UX
	•	developer tooling
	•	documentation

If a task cannot map cleanly to one of these categories, it must not be described as causal-engine work.

Required Task Header
Every agent task should include:
	•	Task Type
	•	Category
	•	Spec Mapping
	•	Core or Non-Core
	•	Formal Artifact Expected
	•	Benchmark Impact
	•	Claim Boundary

Example:

Task Type: Implementation
Category: Intervention Semantics
Spec Mapping: Causal Engine v1 / Section 7
Core or Non-Core: Core
Formal Artifact Expected: graph mutilation operator
Benchmark Impact: B1, B4
Claim Boundary: deterministic intervention execution only

This forces discipline and prevents vague “engine progress” claims.

⸻

Guardrail 4 — Benchmark Before Consolidation

No component may be consolidated by the Observe agent as “real engine progress” unless one of the following is true:

Condition A — It passed a benchmark
The component has been tested against a named benchmark case.

Examples:
	•	confounding case
	•	collider case
	•	mediation case
	•	simple intervention case
	•	fork/chain graph semantics case
	•	deterministic SCM execution case

Condition B — It is explicitly labeled as scaffolding
The component is not causal computation itself and is clearly labeled as:
	•	infrastructure
	•	orchestration
	•	explanation
	•	research support
	•	interface support

Forbidden Consolidation Behavior
The system must not mark a module as causal-engine progress merely because:
	•	it sounds causal
	•	it uses DAG terminology
	•	it produces plausible outputs
	•	it is wrapped in an elegant UI
	•	it improves workflow efficiency

Required Consolidation Statement
When Gemini/Observer consolidates progress, it must state one of:
	•	Validated Core Progress
	•	Unvalidated Core Prototype
	•	Non-Core Support Progress
	•	Research / Conceptual Progress
	•	Speculative / Unverified

This ensures the project state remains scientifically legible.

⸻

Guardrail 5 — Reflections Must Audit Mathematical Legitimacy

Reflection is not just a productivity ritual. In this project, reflection must explicitly test whether work moved the system toward formal causal computation or merely toward better causal language.

Each reflection must answer:
	1.	Did this task create or improve a formal causal artifact?
	2.	Did any causal claim exceed the implemented mathematics?
	3.	Was the LLM used as an explainer or as a hidden reasoner?
	4.	Did the task preserve the assumption envelope of Causal Engine v1?
	5.	Did the task advance execution, identification, validation, or only presentation?
	6.	What benchmark evidence exists?
	7.	What should not be claimed yet?

Reflection Output Tags
Every reflection should classify the task as:
	•	Mathematically Advancing
	•	Architecturally Advancing
	•	Operationally Advancing
	•	Presentation-Only
	•	Overclaim Risk
	•	Needs Benchmarking

This turns reflection into epistemic control, not mood journaling for machines.

⸻

Guardrail 6 — Distinguish Engine Progress From Product Progress

The project has two legitimate but distinct tracks:

Track A — Real Causal Engine
This includes:
	•	formal representations
	•	computation
	•	validation
	•	benchmarks
	•	mathematically constrained execution

Track B — Product / Agentic Support System
This includes:
	•	task routing
	•	multi-agent governance
	•	documentation
	•	UI
	•	explanation
	•	orchestration
	•	synthesis pipelines

Both tracks matter. But they must never be conflated.

A fast improvement in Track B does not imply progress in Track A.

The system must therefore maintain separate progress labels:
	•	Engine Progress
	•	Governance Progress
	•	Research Progress
	•	Interface Progress

This prevents the common failure mode where the team becomes more organized without becoming more scientific.

⸻

Guardrail 7 — Claim Discipline Is Mandatory

The system must always use the smallest honest description of current capability.

Allowed Claims (Only When True)
	•	deterministic SCM execution
	•	graph-based intervention simulation
	•	benchmarked DAG semantics
	•	causal reasoning assistance
	•	formal query translation
	•	LLM-based explanation over formal outputs

Restricted Claims (Only After Implementation + Validation)
	•	causal inference engine
	•	interventional query engine
	•	identifiable causal effect computation
	•	counterfactual reasoning
	•	do-calculus support
	•	treatment effect estimation

Forbidden Claims Unless Formally Earned
	•	genuine counterfactual intelligence
	•	do-calculus engine
	•	full Pearl Layer 3 support
	•	autonomous scientist performing formal causality
	•	mathematically grounded causal engine

If a claim is ahead of the implemented math, it must be downgraded immediately.

⸻

Guardrail 8 — Default to Narrow Truth Over Broad Ambition

Whenever ambiguity arises, the system must choose the narrower true statement over the broader impressive one.

Examples:
	•	Prefer “deterministic intervention executor” over “causal inference engine”
	•	Prefer “SCM-like task representation” over “structural causal model”
	•	Prefer “counterfactual-style simulation” over “counterfactual inference”
	•	Prefer “research hypothesis” over “engine capability”

This guardrail exists because overclaiming is easier than modeling, and modeling is the actual work.

⸻

Operational Rule for All Three Agents

Agent-01-Act-GPT
Must not implement a causal module unless:
	•	spec mapping is declared
	•	expected formal artifact is named
	•	claim boundary is stated

Agent-02-Think-Claude
Must distinguish:
	•	mathematical necessity
	•	engineering convenience
	•	rhetorical overreach

Claude’s job is to reduce ambiguity, not decorate ambition.

Agent-03-Gemini-Observe
Must not consolidate outputs into “engine progress” unless:
	•	benchmark evidence exists, or
	•	the output is clearly tagged non-core

Gemini’s job is to protect epistemic integrity at the workflow level.

⸻

Final Principle

The multi-agent system exists to help build a real causal engine. It must never become a machine for manufacturing the appearance of one.

The standing question for every task is:

Did we create more formal causal machinery, or did we merely create better language around the absence of it?

If the answer is the latter, the task may still be useful — but it is not engine progress.

