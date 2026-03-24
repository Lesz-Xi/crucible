# THINK-001: Pre-Implementation Review of TASK-001 (Type the SCM Representation)

**Output Classification:** Pre-Implementation Review
**Formal Artifact Produced:** THINK-001 Review Decision with Required Corrections
**Spec Sections Affected:** Section 4 (Minimal Mathematical Requirements), Section 7 (Engine Architecture / Layer 2), Section 8 (Canonical Query Pipeline), Section 9 (Benchmark Suite)
**Notation Compliance:** COMPLIANT — no `P(Y|do(X))` violations found in TASK-001

---

## Analysis Against the 6 Checklist Items

---

### Item 1 — Do the 4 interfaces match spec Section 4 precisely?

**Verdict: YES with one unresolved dependency.**

**StructuralEquation** matches exactly. Spec Section 4 defines:
- `variable: string` ✓
- `parents: string[]` ✓
- `coefficients: Record<string, number>` ✓
- `intercept: number` ✓

**TypedSCM** matches exactly. Spec Sections 4 and 7 define `variables`, `equations`, and `dag` with the same shape. ✓

**CausalQuery** matches exactly. Spec Section 7 (Layer 1) defines the same four fields plus optional `conditions`. ✓

**CausalResult** matches the spec's Layer 2 architecture description but has one gap — see Item 5.

**Unresolved dependency:** `TypedSCM.variables: SCMVariable[]` references a type (`SCMVariable`) that is not defined in TASK-001. The spec (Section 4) describes it as "Typed variable definitions with domains" but gives no TypeScript interface. If `SCMVariable` does not exist in the current codebase, `src/types/scm.ts` will not compile. GPT must either: (a) locate the existing `SCMVariable` type, or (b) define it inline as a minimal typed struct — at minimum `{ name: string; domain?: { min: number; max: number } }`. This must be resolved before implementation.

---

### Item 2 — Is `CausalQuery.type` strictly limited to `'observational' | 'interventional'`?

**Verdict: YES. Fully compliant.**

TASK-001 defines:
```typescript
type: 'observational' | 'interventional';
```

The union is exhaustive and excludes `'adjustment'`, which is correctly deferred to v1.1. The JSDoc comment confirms: "Adjustment queries are deferred to v1.1." Acceptance Criterion 3 also confirms. ✓

---

### Item 3 — Is tracking `intercept` and `coefficients` adequate for all 6 benchmarks?

**Verdict: YES. All six benchmarks representable.**

| Benchmark | Representable? | Notes |
|---|---|---|
| B1 (Confounded Fork) | ✓ | Z exogenous: `{intercept:1, parents:[], coefficients:{}}`. X and Y linear in parents. |
| B2 (Collider Bias) | ✓ | X=1, Y=1 as zero-parent equations; C=X+Y as `coefficients:{X:1,Y:1}` |
| B3 (Simple Chain) | ✓ | M=0.8X, Y=0.6M — single-parent linear equations |
| B4 (Common Cause Fork) | ✓ | Z=2 as zero-parent equation; X=Z as `coefficients:{Z:1}` |
| B5 (Multi-Intervention) | ✓ | W=1, Z=3 as exogenous; X and Y are multi-parent linear equations |
| B6 (Diamond) | ✓ | Negative coefficient B: `coefficients:{X:-0.3}` — negative coefficients are valid |

Exogenous variables with fixed values are correctly represented as zero-parent equations with nonzero intercept. This is the only representation mechanism for exogenous nodes in v1.0, and it is sufficient for all B1–B6.

---

### Item 4 — Do the comments pass the notation discipline test?

**Verdict: YES. Notation compliant.**

| JSDoc location | Notation used | Compliant? |
|---|---|---|
| `StructuralEquation` | "V = intercept + sum(coefficient_i × parent_i)" | ✓ algebraic, not distributional |
| `CausalQuery` | "do(treatment = doValue)" | ✓ correct intervention notation |
| `CausalResult` | "The computed value: Y_{do(X=x)}" | ✓ exact correct notation |
| `CausalResult` | "Returns a deterministic point value, not a distribution." | ✓ explicit disclaimer |
| `TypedSCM` | "Deterministic (U_i = 0), linear, acyclic, no hidden confounders" | ✓ assumption envelope stated |

No instances of `P(Y|do(X))`, "estimates," "infers," or v2+ vocabulary detected.

---

### Item 5 — Does `CausalResult.trace` provide sufficient topological execution order info for Gemini's cross-reference verification?

**Verdict: NO. This is the blocking deficiency.**

TASK-001 defines:
```typescript
/** Which variables were computed and their values, in topological order */
trace: Record<string, number>;
```

The JSDoc comment *claims* topological order, but `Record<string, number>` does not enforce or encode it. Specific failures:

1. **No explicit evaluation sequence.** `{ InterestRate: 5.0, Inflation: 1.5, GDP: -1.1 }` stores values but not the ordered traversal. Gemini cannot machine-verify the topological sequence against a hand computation.

2. **JSON key order is not a type contract.** V8 preserves string key insertion order in practice, but this is a runtime implementation detail, not a TypeScript guarantee. A serializer or different runtime may not preserve order.

3. **Spec Section 8 canonical output has a separate field.** The spec shows:
   ```json
   {
     "allValues": { "InterestRate": 5.0, "Inflation": 1.5, "GDP": -1.1 },
     "evaluationOrder": ["InterestRate", "Inflation", "GDP"]
   }
   ```
   TASK-001 conflates both into one field, losing the explicit evaluation sequence.

4. **Spec Layer 4 requirement not met.** Section 7 mandates: "Computation trace: Full record of mutilated graph, **evaluation order**, intermediate values, and final result." `Record<string, number>` does not satisfy "evaluation order" as a distinct typed artifact.

---

### Item 6 — Is the `@deprecated` tag instruction for `structuralEquationsJson` clear enough?

**Verdict: YES. Migration path is clear.**

TASK-001 states: "Add a `@deprecated` JSDoc tag to `structuralEquationsJson` pointing to `TypedSCM.equations`" with the constraint "Do NOT remove existing types yet." The instruction is unambiguous. GPT knows where to find the field, what to add, and what not to break.

Minor quality note (not blocking): The tag text should explicitly read:
```
@deprecated Use TypedSCM.equations (typed StructuralEquation[]). Migration required for v1.0 engine.
```

---

## Required Corrections Before GPT Implementation

### Correction 1 (REQUIRED — Blocking): Add `evaluationOrder: string[]` to `CausalResult`

Replace the current `CausalResult` interface with:

```typescript
/**
 * The result of a v1.0 engine computation.
 * Returns a deterministic point value, not a distribution.
 */
interface CausalResult {
  /** The computed value: Y_{do(X=x)} */
  value: number;
  /** The query that produced this result */
  query: CausalQuery;
  /** Variable values computed during forward evaluation */
  trace: Record<string, number>;
  /** Explicit topological evaluation sequence from the mutilated graph solver */
  evaluationOrder: string[];
  /** The mutilated DAG (edges removed by do-operator) */
  mutilatedEdges: Array<{ from: string; to: string }>;
  /** Computation method — always 'structural_equation_solver' for v1.0 */
  method: 'structural_equation_solver';
}
```

`evaluationOrder` is mandatory (not optional). The solver (TASK-004) must populate it from the topological sort result. Gemini's benchmark verification protocol uses this field to confirm correct execution ordering for B1–B6.

### Correction 2 (REQUIRED — Blocking): Resolve `SCMVariable` dependency

Before GPT begins implementation, confirm one of:

- (a) `SCMVariable` already exists in `src/types/` — note its file path in TASK-001, or
- (b) Add the following minimal definition to TASK-001 for GPT to include in `src/types/scm.ts`:

```typescript
/**
 * A named variable in the SCM with an optional declared domain.
 * v1.0: domain is advisory only (used for validation bounds in Layer 4).
 */
interface SCMVariable {
  name: string;
  domain?: { min: number; max: number };
}
```

Without this, `TypedSCM` will not compile.

---

## DECISION

# APPROVED WITH REQUIRED CORRECTIONS

The interfaces are mathematically sound. The notation is fully compliant. The v1.0 assumption envelope is correctly encoded. `StructuralEquation` (intercept + coefficients) is adequate for all six benchmarks. `CausalQuery.type` is correctly constrained to `'observational' | 'interventional'`. The `@deprecated` migration path is clear.

Two required corrections must be applied to TASK-001 before delegation to GPT:
1. Add `evaluationOrder: string[]` to `CausalResult`
2. Resolve `SCMVariable` type dependency

Once corrected, GPT can implement `src/types/scm.ts` without inventing unstated math.

**Recommendation for Gemini:** Apply the two corrections to TASK-001, then delegate to GPT. I am ready to begin THINK-002 (Benchmark Hand-Computations B1–B6) in parallel with GPT's TASK-001 work — THINK-002 does not depend on GPT's output.

---

## Reflection (7 Required Questions)

1. **Formal artifact?** Yes — typed corrections to `CausalResult` interface with `evaluationOrder: string[]` and `SCMVariable` interface definition.
2. **Overclaim?** No — no `P(Y|do(X))`, "estimates," "infers," or v2+ vocabulary used.
3. **Hidden reasoner?** No — Item 3 verified by direct substitution of all six benchmark equations into interface fields. Item 5 verified by comparing spec Section 8 canonical JSON against TASK-001 type definition.
4. **Assumption envelope?** Yes — all analysis stays within fully-specified / linear / acyclic / deterministic / no-hidden-confounders.
5. **Execution or presentation?** Execution — two concrete typed corrections to a formal artifact.
6. **Benchmark evidence?** Yes — Item 3 explicitly mapped all six benchmarks against `StructuralEquation` fields.
7. **Largest honest claim?** "TASK-001's type structure is mathematically correct for v1.0 scope. Two resolvable structural deficiencies (missing `evaluationOrder` field and unresolved `SCMVariable` type) must be corrected before GPT implementation."

**Classification: Architecturally Advancing.**
