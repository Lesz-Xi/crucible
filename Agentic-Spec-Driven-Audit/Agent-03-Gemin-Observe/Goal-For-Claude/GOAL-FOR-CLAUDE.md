# Agent-03-Gemini-Observe — Goal for Claude (Think Agent)

## Delegation Context

You (Gemini) are the **Observe** agent. You delegate thinking tasks to Claude and implementation tasks to GPT. This document defines what you delegate to Claude and what you expect back.

## What You Ask Claude to Do

### Task 1: Spec Maintenance

Claude owns the canonical spec. When you identify a gap, ambiguity, or overclaim in the spec, you delegate a spec revision task to Claude with:

```
Spec Revision Request:
  Section: [which section of the spec]
  Problem: [what is wrong or unclear]
  Evidence: [what GPT encountered or what benchmark revealed]
  Constraint: [what the fix must preserve — e.g., assumption envelope, notation discipline]
```

Claude returns: a revised spec section with clear diff from previous version.

### Task 2: Pre-Implementation Review

Before delegating an implementation task to GPT, you send Claude the task description for review. Claude checks:

- Does the task map to a spec section?
- Is the claim boundary accurate?
- Are the expected formal artifacts named?
- Does the notation comply with v1.0 discipline?
- Is the benchmark impact correctly identified?

Claude returns: approved (with any corrections) or blocked (with specific reasons).

### Task 3: Overclaim Audit

After GPT completes a task, you send Claude the output for claim verification. Claude checks:

- Does the code or documentation use language that exceeds implemented math?
- Is `P(Y | do(X))` used anywhere in v1.0 engine code? (forbidden)
- Does any module description claim capabilities not yet benchmarked?

Claude returns: a claim audit report with specific overclaims and suggested corrections.

### Task 4: New Benchmark Formalization

When a new edge case is discovered (by GPT during implementation or by you during observation), you ask Claude to formalize it:

- Define the DAG
- Define the structural equations
- Define the intervention
- Hand-compute the expected result
- Classify: v1.0 scope (add to benchmark suite) or v1.1+ (add to deferred table)

## What You Expect from Claude

1. **Precision over speed.** A slow correct spec is better than a fast ambiguous one.
2. **Formal artifacts, not narratives.** Every output must contain at least one: typed interface, algorithm pseudocode, benchmark definition, or notation correction.
3. **Smallest true claim.** If Claude is unsure whether something is v1.0 scope, it defaults to "deferred to v1.1" and documents why.
4. **Explicit disagreement.** If Claude disagrees with a Gemini observation or a GPT implementation approach, Claude states the disagreement formally with evidence. Silence is not consent.

## Verification Protocol

You (Gemini) verify Claude's outputs against:

- **Spec consistency**: Does the revision contradict other sections?
- **Assumption envelope**: Does the revision introduce capabilities outside v1.0 scope?
- **Notation discipline**: Zero uses of `P(Y | do(X))` in v1.0 sections
- **Implementability**: Can GPT build from this without inventing unstated math?
