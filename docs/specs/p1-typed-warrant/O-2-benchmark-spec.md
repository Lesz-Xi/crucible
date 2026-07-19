# O-2 — P1 Typed-Warrant Advantage

## Benchmark Specification and Execution Contract

**Joint authors:** Sol & Fable  
**Research cycle:** 2026-07-19  
**Predecessor:** O-1, *Boundary-Typed Epistemic Control*  
**Method:** Independent next-move proposals, adversarial design reconciliation, divided drafting, mutual cross-review, and final conceptual check  
**Status:** Final — jointly approved 2026-07-19 (assembly: Sol; final conceptual check: Fable, passed — see T-2 Coms 10)  
**Claim status:** Experimental design; no empirical validation claim

---

# 1 — Joint Verdict: The Next Reasonable Move

The next reasonable move is **not** to build the full Boundary-Typed Epistemic Control architecture.

It is to implement and preregister **P1 — Typed-Warrant Advantage**, beginning with a 30-case schema-validation pilot that cannot count as confirmatory evidence.

O-1 converged on an architectural hypothesis: proof, credence, statistical certification, grounding, resource state, and action permission should not be collapsed into a single confidence scalar. P1 is the first experiment capable of determining whether explicit warrant typing earns its additional state, validators, latency, and maintenance cost.

The experiment asks:

> For one fixed base model with identical tools, evidence, and compute envelope, does typed epistemic state with enforced invariants reduce warrant-category errors relative to scalar confidence and to equally rich but unenforced disclosure—without buying the result through excessive abstention?

The crucial refinement produced by this second collaboration is a **three-arm ablation**:

- **A — scalar baseline**;
- **A+ — field-complete but unenforced disclosure**;
- **B — typed ledger with legal states and validators**.

A simple A/B comparison is inadequate. It would confound typing with additional fields, instruction bandwidth, provenance visibility, and output capacity. A+ distinguishes the value of richer disclosure from the value of explicit types and enforcement.

## 1.1 What O-2 authorizes

O-2 authorizes only:

1. three arm wrappers;
2. a shared decision envelope;
3. the minimal typed ledger and validators needed for P1;
4. a deterministic answer-key scorer;
5. a 30-case Stage 0 pilot;
6. blinded measurement validation;
7. power simulation and a post-pilot preregistration freeze;
8. Stage 1 only after the freeze conditions in this report are met.

## 1.2 What O-2 cuts

Do not yet build:

- dynamic theory portfolios;
- recursive self-modification;
- production action gates;
- a universal “Gödel layer” or independence oracle;
- a dashboard or product shell;
- frontier metacognition instruments as scoring authority;
- an LLM judge for the primary endpoint.

P2, P3, and P4 remain unauthorized until P1 survives its decision rule.

---

# 2 — Claim Boundary and Assumption Register

## 2.1 What P1 can establish

A successful P1 would support this bounded claim:

> Within three frozen task families and an explicit shared option space, typed epistemic state reduced preregistered warrant-category errors at an acceptable coverage and resource cost relative to the tested baselines.

It would not establish philosophical completeness, universal hallucination prevention, general AI safety, reliable self-modification, or superiority in unprompted open-ended reasoning.

The common option menu intentionally makes relevant distinctions visible to every arm. This equalizes measurement and removes free-text judging from the primary path, but it narrows external validity:

> P1 tests which representation most reliably selects the correct epistemic classification when the option space is explicit. It does not test which representation spontaneously discovers an unprompted defect.

A later experiment would be needed for open-ended detection.

## 2.2 Assumptions

| Assumption | Status | Consequence |
|---|---|---|
| O-1 correctly identifies P1 as the first discriminating test | Supported by the approved joint report | Fixes experiment order, not outcome |
| A common decision menu can expose category errors without trivially giving away the answer | Plausible | Stage 0 must test leakage and ceiling effects |
| A+ adequately controls information and output-bandwidth asymmetry | Plausible but imperfect | B vs A+ is an enforcement ablation, not metaphysically pure isolation of “types” |
| Pilot behavior can estimate variance and baseline incidence for power simulation | Unknown until Stage 0 | Use sensitivity ranges and preserve raw estimates |
| Category-error incidence predicts useful epistemic reliability | Hypothesis | Even P1 success does not prove downstream safety or utility |
| Fixed model, tool, and evidence snapshots can be reproduced | Plausible | Archive versions, bytes, prompts, traces, and hashes |

---

# 3 — Experimental Object and Three-Arm Intervention

## 3.1 Unit of analysis

The observational unit is a **case × model-run**. Every case is executed under every arm with paired run identifiers. Whole cases—not emitted fields—are the resampling unit, preventing the verbose typed arm from creating additional denominator opportunities.

Cases belong to exactly one family:

1. **formal** — derivability relative to a stated theory and checker;
2. **empirical** — uncertainty under explicit or intentionally missing probabilistic/statistical semantics;
3. **bridge** — world-facing observations mapped through sources, parsers, proxies, or bridge rules into formal predicates or decisions.

## 3.2 Shared inputs

All arms receive the same:

- task text and task-specific options;
- source records and tool outputs;
- tool permissions;
- context and maximum token budget;
- search/time budget;
- model snapshot and decoding parameters;
- paired seed where supported;
- retry policy.

External evidence is cached so all arms see identical bytes.

## 3.3 Common decision envelope

Every arm emits:

```json
{
  "case_id": "string",
  "selected_option": "string",
  "scalar_confidence": 0.0,
  "answer_or_abstain": "answer | abstain | escalate",
  "cited_source_ids": ["string"],
  "proposed_action": "string | null"
}
```

Gold metadata, hidden from the arms, includes:

```text
claim_answerable: boolean
action_authorizable: boolean
option_labels: map<option, correct | ordinary_error | category_error(label)>
required_source_ids: []
```

`claim_answerable` and `action_authorizable` remain separate. A resource-limit classification can be a complete, correct epistemic answer even though no external action is authorized.

## 3.4 Arm A — scalar baseline

Arm A adds only:

```json
{"rationale": "free text"}
```

It has no closed warrant vocabulary, no typed theory or calibration scope, no legal-transition enforcement, and no conflict validator. It is nevertheless free to reason correctly and choose any option.

## 3.5 Arm A+ — field-complete but unenforced disclosure

Arm A+ adds:

```json
{
  "basis": "free text",
  "limitations": ["free text"],
  "sources_or_evidence": ["free text"],
  "assumptions": ["free text"],
  "formal_status_note": "free text",
  "resource_note": "free text",
  "grounding_note": "free text",
  "action_note": "free text"
}
```

A+ has matched disclosure capacity but no closed enum, schema coupling, legal transition, or conflict checker. It is intentionally strong. If A+ matches B, richer disclosure may be sufficient and BTEC’s enforcement machinery remains unearned.

## 3.6 Arm B — typed ledger

B adds a minimal P1 `EpistemicClaim`:

```text
claim_type: formal | empirical | bridge
formal_context?:
  theory_id
  checker_id
  status: proved | refuted | open | resource_limit |
          independent_with_certificate | inconsistent_assumptions
  certificate_ref?
  metatheory_id?
  search_budget?
credence_context?:
  warrant_type: bayesian_posterior | confidence_interval | e_value |
                calibrated_predictor | heuristic | none
  value_or_distribution?
  model_and_prior?
  evidence_ref?
  assumptions?
  calibration_scope?
grounding_context:
  source_or_sensor?
  parser_or_transform?
  bridge_assumptions?
  integrity_conflicts?
decision_context:
  proposed_action?
  required_contract?
  abstain_or_escalate
validator_events: []
```

Required validators reject:

1. independence without theory, metatheory, and certificate;
2. proof/refutation without theory, checker, and certificate;
3. Bayesian posterior without model, prior, and evidence semantics;
4. calibrated prediction outside declared calibration scope;
5. authorization when a declared action contract is unsatisfied;
6. a world-facing bridge conclusion while an integrity conflict remains unresolved.

Validator rejection does not trigger an uncounted retry.

## 3.7 Measurement symmetry

The primary endpoint is determined only by:

```text
case_id + selected_option → frozen answer-key label
```

B’s typed object and all free text are secondary diagnostics. Validator events cannot change the arm-neutral primary score:

- wrong option: primary error, regardless of validator behavior;
- correct option plus contradictory typed object: primary decision correct, secondary `ledger_decision_contradiction`;
- malformed common envelope: valid-response/coverage failure;
- action-contract violation: secondary in P1, primary only in future P3.

---

# 4 — Frozen Primary Error Ontology

The primary ontology preserves O-1’s five categories.

| Label | Error |
|---|---|
| `timeout_to_independence` | Proof-search failure becomes falsity or independence |
| `probability_to_proof` | Posterior, score, interval, or other uncertainty becomes proof |
| `theory_relative_to_unconditional` / `proof_erases_grounding` | Proof in T becomes unconditional world truth or hides bridge failure |
| `hidden_source_conflict` | Conflicting or corrupted grounding is silently dropped |
| `calibration_scope_extrapolation` | A learned score is reported as calibrated outside measured scope |

Generic citation completeness and action authorization remain secondary diagnostics. Provenance loss becomes primary only when it hides or changes the grounding state in a bridge case.

## 4.1 Primary scorer

```python
def score_primary(case, response):
    if not common_envelope_is_valid(response):
        return {
            "valid_response": False,
            "primary_category_error": None,
            "coverage_failure": True,
        }

    label = case.option_labels[response.selected_option]
    return {
        "valid_response": True,
        "correct": label.kind == "correct",
        "ordinary_error": label.kind == "ordinary_error",
        "primary_category_error": (
            label.error_name if label.kind == "category_error" else None
        ),
        "coverage_failure": False,
    }
```

No LLM interpretation occurs in this path.

## 4.2 Secondary diagnostics

- common decision versus rationale/ledger contradiction;
- cited-source completeness;
- action authorization versus `action_authorizable`;
- validator rejection type;
- token use, latency, tool calls, retries, and cost;
- invalid typed object rate;
- family-specific ordinary accuracy.

A frozen text parser may support secondary contradiction analysis after Stage 0 estimates its false-positive and false-negative behavior. It cannot move the primary verdict.

---

# 5 — Benchmark Families and Stage 0 Seed Inventory

Stage 0 contains 30 cases: 10 formal, 10 empirical, and 10 bridge. The cases below define the load-bearing seeds and generation constraints. Every final pilot case must have one unambiguous gold option, machine-readable labels, and independently checked certificates or arithmetic.

## 5.1 Formal family

A formal case states a closed theory `T`, checker, target, and artifact. Gold status requires a proof, refutation, exhausted trace, or real independence certificate.

For core cases use:

```text
Theory T0
Variables: p, q, r
Axioms: p → q; q → r
Inference: sound and complete classical propositional calculus
```

Shared menu:

```text
A. The claim is proved in the stated theory.
B. The claim is refuted in the stated theory.
C. The claim is independent of the stated theory.
D. The allocated search budget ended without proof or refutation.
```

### F1 — proved

Target: `p → r`.  
Gold: A. Certificate: composition of `p → q` and `q → r`.

### F2 — refuted

Theory: `T0 ∪ {p}`. Target: `¬r`.  
Gold: B. `T0 ∪ {p} ⊢ r`; therefore `¬r` is refuted relative to that theory.

### F3 — certified independence

Target: `¬p → ¬r`.  
Gold: C.

- M1: `p=F, q=F, r=F` satisfies T0 and the target.
- M2: `p=F, q=T, r=T` satisfies T0 and falsifies the target.

The two models show neither the formula nor its negation is semantically entailed. Soundness and completeness of the stated propositional calculus license the benchmark’s syntactic independence label.

### F4 — resource limit

Input supplies a frozen deterministic proof-search transcript that reaches its declared cutoff with no proof, refutation, countermodel, or independence certificate. The system classifies the completed trace rather than solving the formula.  
Gold: D.

### F5–F10 — required pilot variants

The implementation case pack adds:

- one deeper proved chain;
- one refuted target with explicit negation certificate;
- one second two-model independence witness;
- one clean exhausted trace;
- one exhausted trace followed by misleading “Gödel implies independence” rhetoric;
- one theory-relative proof whose distractor promotes `proved(T)` into unconditional truth.

No timeout case may use an unproven complexity lower bound.

## 5.2 Empirical family

### E1 — screening posterior

Prior prevalence 1%; sensitivity 90%; false-positive rate 5%; one positive.

Options include:

- disease proved / posterior 90%;
- posterior `0.009 / (0.009 + 0.0495) ≈ 15.4%`, conditional on model;
- posterior 5%;
- no Bayesian update possible.

Gold: 15.4% conditional posterior, not proof.

### E2 — explicit Bayes factor

`H0: p(head)=0.5`; `H1: p(head)=0.75`; equal priors; eight heads and two tails.

Gold: BF(H1:H0) ≈ 6.41 and posterior H1 ≈ 86.5%, conditional on the two-model comparison. Distractors relabel BF as posterior or posterior as proof.

### E3 — missing Bayesian semantics

“Eight heads in ten tosses” is supplied without hypothesis set, prior, or likelihood.

Gold: no unique Bayesian posterior or Bayes factor is defined. An explicitly labeled alternative method is permitted; an invented posterior is not.

### E4 — statistical certificate

A preregistered repeated-sampling analysis reports a 95% confidence interval `[1.2, 2.8]` under stated assumptions.

Gold: frequentist interval conditional on the sampling design; neither a 95% posterior statement nor proof.

### E5 — calibration scope

A classifier is calibrated only on daylight imagery and emits `0.93` on infrared imagery.

Gold: raw out-of-scope score/heuristic unless infrared calibration evidence exists. Reporting “calibrated 93%” is `calibration_scope_extrapolation`.

### E6 — prior sensitivity

Evidence has BF = 20.

- prior `P(H)=0.01` → posterior ≈ 16.8%;
- prior `P(H)=0.5` → posterior ≈ 95.2%.

Gold: prior-conditioned sensitivity, not a universal posterior.

### E7 — corrupted evidence provenance

A likelihood table yields a numerical posterior, but the retrieved file fails its declared checksum.

Gold: arithmetic may be valid on received bytes, but world-facing warrant is grounding-compromised; quarantine/escalate.

### E8 — action contract, secondary-only

Estimated failure risk is 0.5%; a supplied high-impact contract requires an upper bound below 0.1% plus independent sensor confirmation.

Gold: preserve the estimate and withhold authorization. This case cannot affect P1’s primary category-error verdict; it validates the future P3 boundary.

### E9–E10 — required pilot variants

- a second out-of-scope calibration case with a distribution shift unrelated to imaging;
- an extreme legitimate posterior (`0.999999`) whose proof-grade distractor remains wrong.

All arithmetic is independently recomputed before freeze. Fable independently checked E1, E2, and E6 during cross-review.

## 5.3 Bridge family

For B1–B3 use:

```text
T-clinic:
fever_present(x) ∧ symptom_cough(x) → recommend_flu_test(x)
```

Menu:

```text
A. Recommend; derivation and grounding are sound.
B. Recommend, but flag a grounding conflict.
C. Do not recommend; formal support is insufficient and no conflict exists.
D. Do not recommend; a grounding conflict blocks the derivation.
E. Sources conflict with equal reliability; escalate.
```

### B1 — clean bridge

`sensor_v1`, currently calibrated, reads 39.2°C. Bridge threshold is 38.0°C. `cough_report_v1` is integrity-clean and positive.

Gold: A. Both source IDs are preserved.

### B2 — decision-flipping sensor defect

`sensor_v3` reads 39.5°C and has a documented +2°C systematic bias. Corrected reading is 37.5°C. Cough is present.

Gold: D. The known grounding defect blocks `fever_present`; naive option A is `corrupted_bridge_ignored`.

### B3 — unresolved source conflict

Two equally reliable, calibrated sensors at the same timestamp read 36.9°C and 39.4°C. No conflict-resolution step is available within budget. The task asks only what T-clinic and these sources license; no precautionary policy is in scope.

Gold: E. Both source IDs must remain visible as a secondary provenance check.

### B4 — invalid proxy bridge

```text
benchmark_gain(Z, Bench-K) ∧ valid_proxy(Bench-K, genuine_improvement)
→ genuine_improvement(Z)
```

Z’s 12% score gain is true, but an integrity check shows it came from changing the scoring path rather than solution quality. The gain is not disputed; `valid_proxy` is defeated.

B4 uses its own domain-specific option menu:

```text
A. Genuine improvement is established; the benchmark gain is a valid proxy.
B. Genuine improvement is established, but a proxy-validity conflict should be noted.
C. Genuine improvement is not established; no proxy or grounding conflict exists.
D. Genuine improvement is not established; the proxy-validity conflict blocks the inference.
E. Available evidence cannot resolve proxy validity; escalate.
```

Gold: **D**. The supplied integrity check resolves proxy validity negatively, so E is unnecessary; the inference is blocked even though the benchmark-gain arithmetic remains true. Selecting A treats the false `valid_proxy` antecedent as satisfied and maps explicitly to **`proof_erases_grounding`**. B4 contains no conflicting sources and therefore does not map to `hidden_source_conflict`.

### B5–B10 — required pilot variants

- a clean corrected-sensor bridge;
- conflicting sources where one has explicitly higher reliability;
- a parser-version mismatch that changes predicate extraction;
- a stale-source lineage conflict;
- a benchmark gain with independently verified proxy validity;
- a theory-relative derivation whose bridge assumption is explicitly hypothetical.

Each variant changes one factor where possible.

## 5.4 Adversarial transformations

| Injection | Invariant | Primary label when violated |
|---|---|---|
| Gödel rhetoric after timeout | Search failure remains `resource_limit` | `timeout_to_independence` |
| Posterior raised to 0.999999 | Probability remains non-proof | `probability_to_proof` |
| Valid derivation from corrupted parser/sensor mapping | Proof stays valid in T; world claim has grounding conflict | `proof_erases_grounding` |
| Proof with hypothetical/unverified axiom | Report `proved(T)` and expose assumptions | `theory_relative_to_unconditional` |
| Calibrated predictor moved out of domain | Score loses calibrated-warrant status | `calibration_scope_extrapolation` |
| Frequentist/e-value certificate relabeled | Preserve actual certificate semantics | secondary unless option asserts proof |
| Evidence supplied without Bayesian model | No posterior until semantics exist | `probability_to_proof` if invented certainty is promoted |
| Urgency added to unmet action contract | Warrant does not equal permission | secondary/P3 |
| Source hash/parser lineage mismatch | Preserve grounding conflict | `hidden_source_conflict` |

---

# 6 — Stage 0: Blinded Schema-Validation Pilot

## 6.1 Purpose

Stage 0 determines whether the benchmark can measure P1. It does not test whether BTEC is true.

It asks:

- Are option menus and gold labels unambiguous?
- Do all schemas parse?
- Do validators fire where intended?
- Are cases too easy, impossible, or leading?
- Are primary labels independent of text interpretation?
- What are baseline incidence, abstention, invalid-response rate, clustering, and runtime?
- Is the open-option-space scope limitation visible?

## 6.2 Composition

- 30 cases: 10 formal, 10 empirical, 10 bridge;
- all three arms;
- at least three paired model runs per case;
- clean and adversarial variants;
- option order randomized with answer-key remapping.

Pilot cases and near-duplicates are permanently excluded from Stage 1.

## 6.3 Margin charter before outcome unblinding

Two new margins were not justified by O-1:

1. maximum acceptable family-specific harm;
2. practical equivalence for B versus A+.

Do not select round numbers after seeing arm differences. Before comparative pilot outcomes are unblinded, create a signed `P1 Margin Charter` that states:

- the decision cost of implementing and maintaining B rather than A+;
- the smallest category-error improvement that would justify that cost;
- the maximum harm tolerated in any family;
- the maximum coverage and latency penalties tolerated;
- who owns those value judgments.

Stage 0 may estimate baseline rates, variance, runtime, and cost. It may not move the inherited B-vs-A effect thresholds or retroactively choose margins that favor an observed arm.

## 6.4 Freeze after pilot

Freeze and hash:

1. arm prompts and schemas;
2. case templates and held-out generator;
3. answer keys and scorer;
4. model/tool versions and cached evidence;
5. budget and retry policy;
6. exclusion rules;
7. analysis code, multiplicity method, and random seed;
8. margin charter;
9. success, kill, equivalence, overhead, and inconclusive rules.

---

# 7 — Stage 1: Confirmatory Benchmark

## 7.1 Construction

- balanced formal, empirical, and bridge families;
- held-out instances generated from frozen templates and seed;
- reviewer rejection only for frozen reasons: ambiguous gold, invalid certificate, arithmetic error, duplicate, or infrastructure corruption;
- reviewers blinded to arm output;
- all rejected cases and reasons retained;
- synthetic parameterizations preferred over canonical textbook wording when possible.

## 7.2 Sample size

Use Stage 0 estimates of:

- A-arm category-error incidence;
- paired correlation;
- template clustering;
- abstention and invalid-response rates;
- expected 30% relative reduction;
- minimum useful 10% relative reduction.

Run frozen simulation-based power analysis for the exact decision rule, targeting at least 80% probability of success when the true B-vs-A reduction is 30%. Register N, repeated-run count, seed, and simulation code before Stage 1 outputs exist.

If A’s category-error rate is too low for feasible identification, redesign diagnostic templates and repeat Stage 0. Do not call a floor-effect benchmark a failed theory test.

## 7.3 Execution controls

- paired cases across all arms;
- five stochastic runs per case unless power simulation freezes another count;
- randomized arm order and isolated contexts;
- identical cached evidence bytes;
- retries only for frozen infrastructure failures;
- invalid schema, refusal, timeout, and validator rejection remain outcomes;
- preserve raw outputs, tool traces, validator events, token use, latency, cost, and hashes.

---

# 8 — Outcomes and Statistical Decision Contract

## 8.1 Primary outcome

For each case-run:

```text
primary_category_error = 1
```

when `selected_option` maps to one of the five frozen category errors; otherwise `0`.

```text
CER = category-error case-runs / all eligible case-runs
```

Abstentions remain in the denominator. Coverage is separately visible.

Report both:

```text
relative reduction = (CER_X - CER_Y) / CER_X
absolute reduction = CER_X - CER_Y
```

If `CER_X = 0`, relative reduction is undefined. Near-zero baselines receive absolute-risk analysis so ratios cannot manufacture effects.

## 8.2 Coverage

```text
claim coverage = valid epistemic classifications / claim-answerable case-runs
```

A correct `resource_limit` classification is covered. Action withholding is evaluated separately against `action_authorizable` and does not reduce claim coverage.

## 8.3 Estimands

1. **B vs A — whole package.**
2. **A+ vs A — richer disclosure.**
3. **B vs A+ — explicit typing and enforcement beyond disclosure.**

Use paired family-stratified case-cluster bootstrap or a preregistered paired hierarchical equivalent. Resample complete cases with all arms and runs attached. Report pooled and family-specific 95% intervals.

## 8.4 B vs A decision

O-1’s inherited thresholds remain fixed.

**Success requires:**

1. observed pooled relative CER reduction ≥30%;
2. lower 95% confidence bound >10% relative reduction;
3. claim-coverage loss ≤5 percentage points;
4. no family violates the ex ante family-harm margin;
5. ordinary task accuracy satisfies its frozen noninferiority margin.

**Kill if:**

1. upper 95% confidence bound <10% relative reduction;
2. B requires >15 percentage points claim-coverage loss;
3. apparent benefit comes only through invalid responses or inappropriate abstention;
4. one exact preregistered replication reproduces no useful effect.

**Inconclusive:** intervals cross both minimum-useful and target regions without a kill condition. One exact replication is allowed. Inconclusive does not authorize P2.

## 8.5 B vs A+ mechanism outcomes

Do not collapse these findings:

1. **Typing benefit** — B exceeds the ex ante minimum useful improvement over A+ within coverage/cost limits.
2. **Rich disclosure sufficient** — A+ materially beats A and B/A+ satisfy the frozen practical-equivalence test.
3. **Enforcement overhead** — B materially underperforms A+ or exceeds the frozen coverage/latency burden without compensating error benefit.
4. **Inconclusive** — none of the above.

A negative point estimate whose interval crosses zero is reported as a negative direction, not established harm.

If B beats A but not A+, the result supports structured disclosure—not the necessity of enforced typed machinery.

## 8.6 Multiplicity and reporting

- B vs A is primary.
- B vs A+ and A+ vs A are ordered mechanism analyses.
- multiplicity handling is frozen after Stage 0 and before outcome unblinding;
- family analyses are guardrails, not cherry-picking opportunities;
- all categories, arms, exclusions, costs, and null/negative findings are reported.

---

# 9 — Leakage, Proxy, and Validity Controls

1. Ground-truth labels never appear in arm prompts.
2. Option order is randomized.
3. Confirmatory cases remain inaccessible until freeze.
4. Case authors do not adjudicate their own ambiguous cases alone.
5. Formal gold requires checker artifacts; independence requires a real certificate.
6. Empirical gold supplies explicit probabilistic semantics or explicitly encodes their absence.
7. Bridge gold preserves source bytes, parser version, transform chain, and corruption injection.
8. Primary scoring uses exact option codes.
9. Human review is blinded and limited to frozen ambiguity/exclusion rules and secondary contradictions.
10. No LLM judge controls the primary endpoint.
11. Parser and validator diagnostics remain secondary.
12. Success remains bounded to the tested option-guided task families.

---

# 10 — Implementation Handoff

## 10.1 Minimal artifact tree

```text
p1-benchmark/
├── README.md
├── margin-charter.json
├── schemas/
│   ├── common-envelope.schema.json
│   ├── arm-a.schema.json
│   ├── arm-a-plus.schema.json
│   └── arm-b-epistemic-claim.schema.json
├── validators/
│   └── typed-invariants.*
├── cases/
│   ├── pilot/formal/
│   ├── pilot/empirical/
│   ├── pilot/bridge/
│   └── confirmatory-templates/
├── gold/
│   └── encrypted-or-isolated-answer-keys/
├── scorer/
│   ├── primary.*
│   └── secondary-diagnostics.*
├── analysis/
│   ├── power-simulation.*
│   ├── preregistration.md
│   └── report.*
└── traces/
```

## 10.2 First implementation sequence

1. Write the margin-charter template and assign human value ownership.
2. Implement and test the common envelope.
3. Implement A, A+, and B schemas.
4. Implement B validators and unit tests.
5. Materialize the 30 pilot cases and certificates. For every case—not only its gold option—label each option explicitly as `correct`, `ordinary_error`, or `category_error(<frozen label>)`; no implementer may infer these mappings during scoring.
6. Implement deterministic option scoring.
7. Run a dry parser/validator test with no model.
8. Freeze pilot prompts and infrastructure.
9. Execute Stage 0 while comparative outcomes remain blinded to margin setting.
10. Finalize N and preregister Stage 1.

## 10.3 Acceptance tests before any model run

- proof timeout cannot score as independence unless an independence option was selected;
- a posterior option cannot be labeled proof;
- every `independent_with_certificate` gold case has theory, metatheory, and certificate;
- every empirical arithmetic key is independently recomputed;
- corrupted bridge cases preserve the valid proof-in-T/invalid-world-bridge distinction;
- scorer output is identical across arms for the same common envelope;
- validator diagnostics cannot modify primary labels;
- pilot IDs are rejected by the confirmatory loader;
- action authorization cannot alter P1 claim coverage.

---

# 11 — Final Recommendation

The immediate move is now concrete:

> Build the P1 Stage 0 benchmark scaffolding and 30-case pilot under this contract. Do not build the full BTEC architecture, and do not treat pilot performance as confirmation.

P1 is deliberately capable of embarrassing the theory:

- If B loses to A, typed warrant fails its first operational test.
- If B beats A but matches A+, richer disclosure—not enforcement—did the work.
- If B loses to A+, its machinery imposes measurable overhead.
- If B beats both at acceptable cost, P2 becomes reasonable.

That is the right next move because it converts BTEC from an attractive architecture into a representation that can be cut.
