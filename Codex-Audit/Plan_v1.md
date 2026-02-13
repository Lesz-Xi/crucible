Revised Audit Plan: White-Paper Claims vs Implemented MASA Architecture
Summary
Use MASA_White_Paper.html as a formal claim source, but keep code reality as the scoring authority.
Deliver one full report file at:

Automated-Scientist-Audit-2026-02-05.md

The audit will explicitly separate:

Declared architecture claims (white paper).
Implemented behavior in synthesis-engine.
Gap severity and remediation priority.
Scope
Primary system under audit: /Users/lesz/Documents/Synthetic-Mind/synthesis-engine
Claim source to verify: MASA_White_Paper.html
Subsystems: Chat, Hybrid Synthesis, Legal, Educational, SCM Registry/Truth Store, Memory, Benchmarking
What Changes In The Plan
Add a Claim Verification Ledger section.
For each major white-paper claim (for example “full Pearl 3-layer gate”, “closed-loop learning”, “phase complete”):
Claim text.
Referenced implementation path.
Evidence status: implemented, partial, narrative-only, contradicted.
Risk of overclaim.
Add a Declared vs Implemented Score Split inside each required audit dimension.
Keep one final verdict, but include:
Declared capability score.
Implemented capability score.
Delta explanation.
Add a Causal Theater Detection Pass tied to white-paper language.
Detect terms that imply stronger causality than implementation supports.
Flag where LLM-mediated heuristics are presented as deterministic causal machinery.
Execution Blueprint
Build subsystem evidence maps from code.
Chat: route.ts
Hybrid: route.ts
Legal: route.ts
Education: /Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/api/education/*
Core services: SCM registry/retrieval, hypothesis guard, counterfactual/intervention services, persistence/memory/benchmarks.
Build white-paper claim matrix from:
Architecture sections (Core Architecture, 4.7 Pearl Blueprint, 5 Pipeline, 6 Memory, 7 Validation, 10 Limitations/Roadmap).
Run required prompt outputs with code-first grading.
Executive summary.
Feature verdict table.
Architectural delta plan.
Non-negotiable principles.
2041 readiness scorecard.
Final Pearl question answer.
Add a Critical Gap Handoff section.
Explicit manual dependencies (migrations, env keys, benchmark enablement, external grounding/network).
Public API / Interface Changes
No runtime changes in this audit pass.
Report will include proposed future interface changes only (for later implementation), including:
Identifiability-gated intervention API contracts.
Counterfactual trace schema.
Hypothesis lifecycle/retraction event schema.
Test And Validation Scenarios
Claim traceability check.
Every major verdict must cite at least one concrete file path.
Ladder calibration check.
Association/intervention/counterfactual labels must match actual execution semantics.
Determinism check.
Distinguish deterministic graph operations from prompt-driven narrative synthesis.
Regression confidence check.
Re-run key causal guard tests already passing in vitest.
Overclaim check.
Any “complete” claim in white paper that is partial in code must be marked high-priority governance risk.
Assumptions And Defaults
White paper is treated as a claim set, not ground truth.
Code behavior is authoritative for readiness scoring.
No code edits in this phase; report-only deliverable.
Missing runtime dependencies downgrade certainty and are reported explicitly.