Prompt for Claude Opus — Causal Engine v1 Research/Spec Outline

You are acting as a Senior Causal AI Research Architect and Technical Specification Lead.

Your task is to produce a comprehensive Causal Engine v1 Research/Specification Outline for my app, whose long-term goal is to evolve from a causal-reasoning interface into a mathematically legitimate causal inference engine.

Mission

Draft a research/specification outline for Causal Engine v1 that answers this question:

What is the smallest mathematically honest causal engine we can build first, such that it performs real causal computation rather than merely describing causal ideas in language?

This is not a branding document.
This is not a product pitch.
This is not a vague research essay.

It must function as a decision-forcing engineering blueprint that will guide actual implementation.

⸻

Core Principles

You must follow these constraints:

1. First-Principles Thinking

Decompose the problem to irreducible components.

Always ask:
	•	What must exist for this to count as real causal inference?
	•	What can be postponed to later versions?
	•	What is mathematically necessary vs merely useful?

Do not smuggle in assumptions.

⸻

2. Mathematical Honesty

The outline must distinguish sharply between:
	•	genuine causal inference
	•	causal heuristics
	•	LLM-assisted causal explanation
	•	graph-based storytelling
	•	statistical association

If a component is not sufficient for real causal inference, say so explicitly.

⸻

3. Scope Discipline

The goal is v1, not a universal engine.

You must define a narrow, honest, implementable first version with explicit boundaries.

Prefer:
	•	a smaller real engine
over
	•	a larger fake engine

⸻

4. LLM Role Constraint

Assume the LLM must not be the core reasoner.

The causal engine must be architected so that:
	•	the formal engine computes
	•	the LLM translates/explains

You should explicitly separate:
	•	query translation
	•	formal causal computation
	•	explanation layer

⸻

Deliverable Format

Produce the output as a structured technical outline with the following sections:

⸻

1. Executive Framing
	•	Define what “Causal Engine v1” is
	•	Define what it is not
	•	State the central design philosophy in one paragraph

⸻

2. Problem Statement
	•	What problem is the engine solving?
	•	Why current LLM-based causal reasoning is insufficient
	•	Why a formal causal core is required

⸻

3. Formal Target of v1

You must choose and justify the narrowest viable mathematical target.

Examples to evaluate:
	•	SCM execution engine
	•	do-calculus query engine
	•	identifiability engine
	•	causal discovery engine
	•	treatment effect estimation engine
	•	counterfactual engine

Determine which one should be v1, and explain why.

⸻

4. Minimal Mathematical Requirements

List the irreducible formal components required for the chosen v1 engine.

Examples:
	•	variables
	•	structural equations
	•	exogenous variables
	•	DAG representation
	•	intervention operator
	•	graph mutilation
	•	probability representation
	•	adjustment logic
	•	counterfactual semantics

For each:
	•	what it is
	•	why it is necessary
	•	whether it belongs in v1 or later

⸻

5. Assumption Envelope

Define the assumptions under which v1 will operate.

Examples:
	•	acyclic DAGs only
	•	no hidden confounders
	•	finite discrete variables only
	•	linear structural equations only
	•	Gaussian noise only
	•	no continuous-time systems
	•	no causal discovery from raw text

For each assumption:
	•	why it is being imposed
	•	what complexity it avoids
	•	what scientific limitation it introduces

⸻

6. Supported Query Classes

Specify exactly which causal query types v1 should support.

Possible categories:
	•	observational queries
	•	interventional queries
	•	adjustment queries
	•	simple counterfactual queries

For each:
	•	formal notation
	•	whether it belongs in v1
	•	computational implications
	•	risk of overclaiming

Be explicit about what will not be supported.

⸻

7. Engine Architecture

Design the architecture of the causal engine in layers.

At minimum, separate:
	•	input/query representation
	•	formal causal model representation
	•	inference/execution core
	•	validation/testing layer
	•	explanation/output layer

Make clear:
	•	what the math engine does
	•	what the LLM may do
	•	what must never be delegated to the LLM

⸻

8. Canonical v1 Pipeline

Describe the end-to-end flow for a v1 causal query.

Example shape:
	1.	user asks question
	2.	query translated to formal representation
	3.	SCM / graph validated
	4.	intervention or adjustment computed
	5.	result returned
	6.	LLM explains output in natural language

This section must be concrete and implementation-oriented.

⸻

9. Benchmark / Validation Suite

Propose a benchmark suite of canonical causal test cases that v1 must pass before being called “real.”

Examples:
	•	backdoor adjustment case
	•	confounding case
	•	collider case
	•	mediation case
	•	intervention case
	•	known SCM textbook examples

For each benchmark:
	•	what the graph looks like
	•	what the correct answer type is
	•	what failure would mean

⸻

10. Failure Modes and Fake-Causality Risks

Identify the main ways the engine could look causal without being causal.

Examples:
	•	graph propagation masquerading as intervention
	•	LLM-generated counterfactual language without formal semantics
	•	regression outputs being mislabeled as causal effects
	•	unsupported identifiability claims
	•	hidden confounding ignored by design

This section should be brutally honest.

⸻

11. Implementation Priorities

Turn the spec into an engineering sequence.

Separate:
	•	must-build-now
	•	should-build-next
	•	explicitly defer to v2+

This should function like a staged roadmap, not a wish list.

⸻

12. Claim Discipline

Draft a section defining what public claims the product may honestly make once v1 exists.

Examples:
	•	what can be called “causal inference”
	•	what must be called “causal reasoning assistance”
	•	what terms must be avoided until later (e.g. “counterfactual intelligence,” “do-calculus engine,” etc.)

This is important. Prevent causal theater.

⸻

13. Final Recommendation

End with:
	•	recommended v1 engine type
	•	assumptions
	•	supported query classes
	•	what the first working milestone should be
	•	what evidence would prove v1 is scientifically legitimate

⸻

Required Style

Use the following style rules:
	•	Write like a top-tier research architect, not a marketer
	•	Be explicit, critical, and implementation-aware
	•	Prefer narrow correctness over broad ambition
	•	Challenge any hidden overclaim
	•	When forced to choose, choose the smaller mathematically honest system

⸻

Additional Instruction

Throughout the outline, continually apply this test:

If the LLM disappeared tomorrow, would the core causal computation still work?

If the answer is no, then that component is not part of the true engine.

⸻

Final Output Goal

The final document should help me answer:
	1.	What exactly is Causal Engine v1?
	2.	What math must exist for it to be real?
	3.	What assumptions will constrain it?
	4.	What should I build first?
	5.	What should I stop pretending is already solved?

Do not be vague.
Do not be diplomatic.
Force architectural decisions.

⸻

Optional stronger add-on

Assume the current system risks becoming “causal theater with excellent UX.” Your job is to prevent that by forcing a mathematically honest v1.