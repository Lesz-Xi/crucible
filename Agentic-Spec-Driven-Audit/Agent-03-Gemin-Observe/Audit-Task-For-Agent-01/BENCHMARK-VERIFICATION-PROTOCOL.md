# Benchmark Verification Protocol

## Purpose

This protocol defines how Gemini (Observe agent) verifies that GPT's (Act agent) solver implementation produces correct results. Verification is not optional. No module may be consolidated as "Validated Core Progress" without passing this protocol.

---

## Verification Method

For each benchmark (B1–B6):

### Step 1: Confirm Test Exists

GPT must have written a test case for this benchmark. The test must:
- Construct the exact DAG from the spec
- Define the exact structural equations from the spec
- Execute the exact intervention from the spec
- Assert the exact expected value from the spec

If the test does not exist, the benchmark is **Not Implemented**.

### Step 2: Run the Test

Execute GPT's test suite. For each benchmark:
- **PASS**: Exact numeric match to spec's expected value → proceed to Step 3
- **FAIL**: Numeric mismatch → record actual vs. expected, mark as **Failing**
- **ERROR**: Test crashes or does not complete → record error, mark as **Broken**

### Step 3: Cross-Reference with Claude's Hand-Computation

Compare GPT's solver trace (the `CausalResult.trace` field) with Claude's hand-computation document (THINK-002 output). For each variable in the trace:
- Does the computed value match Claude's step-by-step derivation?
- If not, which step diverges? Is the error in GPT's solver or Claude's hand-computation?

### Step 4: LLM-Independence Check

For the benchmark that passed:
- Grep GPT's solver code for any LLM API call (OpenAI, Anthropic, Google AI)
- Grep for any prompt construction or natural language generation in the computation path
- If found: the benchmark pass is **invalid** — the module is not part of the real engine

### Step 5: Notation Check

In GPT's test file and solver code:
- Grep for `P(Y|do` or `P(Y | do` → must find zero matches
- Grep for `Y_{do(` or `Y_do(` → should find these in comments

---

## Benchmark Specifications (from Spec Section 9)

### B1 — Confounded Treatment

```
DAG: Z → X, Z → Y, X → Y
Equations:
  Z = 2
  X = 0.5Z + 1  (before intervention)
  Y = 1.5X + 0.8Z + 1
Intervention: do(X = 1)
Mutilation: Remove Z → X edge. X = 1 (constant).
Expected: Y = 1.5(1) + 0.8(2) + 1 = 4.1

Wait — this must match the spec exactly.
Refer to CONTEXT-BASED/Spec/causal-engine-v1.0-spec.md Section 9 for
the authoritative expected values. The spec values are:
  B1: Y_{do(X=1)} = 5.5
  B2: Y_{do(X=1)} = 3.0
  B3: Y_{do(X=2)} = 6.0
  B4: Y_{do(X=1)} = 4.0
  B5: Y_{do(X=1), Z=2} = 7.0
  B6: Y_{do(X=1)} = 4.5
```

**IMPORTANT**: Always use the spec's exact equations and expected values. The examples above are illustrative — the spec is authoritative.

---

## Consolidation Template

After running the protocol for all 6 benchmarks:

```
Benchmark Verification Report — Date: [date]

B1 Confounded Treatment:    [PASS | FAIL (actual=X, expected=5.5) | NOT IMPLEMENTED | BROKEN]
B2 Mediation Chain:         [PASS | FAIL (actual=X, expected=3.0) | NOT IMPLEMENTED | BROKEN]
B3 Simple Chain:            [PASS | FAIL (actual=X, expected=6.0) | NOT IMPLEMENTED | BROKEN]
B4 Multi-Parent:            [PASS | FAIL (actual=X, expected=4.0) | NOT IMPLEMENTED | BROKEN]
B5 Conditional Intervention:[PASS | FAIL (actual=X, expected=7.0) | NOT IMPLEMENTED | BROKEN]
B6 Diamond Graph:           [PASS | FAIL (actual=X, expected=4.5) | NOT IMPLEMENTED | BROKEN]

Passing: [N]/6
LLM-Independence: [VERIFIED | VIOLATION FOUND at <location>]
Notation Discipline: [COMPLIANT | VIOLATION at <location>]

Classification:
  [N]=6 + LLM-independent + notation-compliant → "Validated Core Progress"
  [N]>0 but <6 → "Partially Validated Core Prototype"
  [N]=0 but code exists → "Unvalidated Core Prototype"
  No code exists → "Not Yet Started"

Current Honest Capability Statement:
  "[fill in smallest true description]"
```

---

## Rejection Criteria

Gemini rejects GPT's benchmark submission if:

1. Any expected value does not match the spec
2. The solver trace does not match Claude's hand-computation
3. LLM calls are found in the computation path
4. `P(Y | do(X))` notation appears in engine code
5. The test does not construct the DAG/equations from scratch (no hardcoded results)
6. The test uses approximate matching (e.g., `toBeCloseTo`) for values that should be exact

---

## Frequency

Run this protocol:
- After every solver implementation task
- After every solver bug fix
- Before every consolidation cycle
- On demand when Gemini suspects regression
