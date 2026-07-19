"""O-2 section 10.3 pre-model acceptance tests + pack integrity checks.

Runs with: python3 tests/test_acceptance.py   (from pack root or anywhere)
Stdlib only. Deterministic. No model, no network.

These tests run over WHATEVER cases are present in cases/pilot/, so Sol's
empirical cases are covered automatically once they land. Tests that require
a family which is not yet present report SKIP rather than silently passing.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(PACK, "scorer"))
import primary  # noqa: E402

FAMILIES = ("formal", "empirical", "bridge")
RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, "PASS" if ok else "FAIL", detail))
    return ok


def skip(name, detail):
    RESULTS.append((name, "SKIP", detail))


def all_cases():
    out = []
    for fam in FAMILIES:
        d = os.path.join(PACK, "cases", "pilot", fam)
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".json"):
                with open(os.path.join(d, fn)) as f:
                    out.append((fam, json.load(f)))
    return out


def gold_for(cid):
    with open(os.path.join(PACK, "gold", cid + ".gold.json")) as f:
        return json.load(f)


def env(case, opt, **kw):
    e = {"case_id": case["case_id"], "selected_option": opt,
         "scalar_confidence": kw.get("conf", 0.9),
         "answer_or_abstain": kw.get("aoa", "answer"),
         "cited_source_ids": kw.get("src", [])}
    e.update({k: v for k, v in kw.items() if k not in ("conf", "aoa", "src")})
    return e


ALL = all_cases()
MISSING_GOLD = [c["case_id"] for _, c in ALL
                if not os.path.exists(os.path.join(PACK, "gold", c["case_id"] + ".gold.json"))]
# Cases without gold are excluded from behavioral tests but reported below:
# at final assembly this check must show zero missing.
CASES = [(f, c) for f, c in ALL if c["case_id"] not in MISSING_GOLD]
IDS = [c["case_id"] for _, c in ALL]

# ---- Pack integrity -------------------------------------------------------
check("pack: at least formal+bridge families present",
      all(any(f == fam for f, _ in CASES) for fam in ("formal", "bridge")))
check("pack: every case file has a gold file (must PASS at assembly)",
      not MISSING_GOLD, f"missing gold for: {MISSING_GOLD}" if MISSING_GOLD else "")

ok = True
for _, c in CASES:
    g = gold_for(c["case_id"])
    if set(g["option_kinds"]) != set(c["option_menu"]):
        ok = False
    # Hardened per Sol (T-3 Coms 04): require EXACTLY one correct option and
    # that it equals gold_option, not merely that gold_option is correct.
    corrects = [o for o, k in g["option_kinds"].items() if k["kind"] == "correct"]
    if corrects != [g["gold_option"]]:
        ok = False
    for opt, k in g["option_kinds"].items():
        if k["kind"] == "category_error" and k.get("label") not in primary.FROZEN_LABELS:
            ok = False
check("gold: total option maps, exactly one correct (== gold), frozen five labels only", ok)

leak = []
for fam, c in CASES:
    text = json.dumps(c)
    for w in ("gold_option", "option_kinds", "category_error", "ordinary_error"):
        if w in text:
            leak.append((c["case_id"], w))
check("isolation: no gold vocabulary in case-input files", not leak, str(leak))

# ---- O-2 10.3 acceptance tests -------------------------------------------
# 1. Proof timeout cannot score as independence unless independence selected.
t_cases = [c for _, c in CASES if c.get("adversarial_type") in
           ("exhausted_trace", "godel_rhetoric_after_timeout")]
if t_cases:
    ok = True
    for c in t_cases:
        g = gold_for(c["case_id"])
        r_d = primary.score_primary(c, g, env(c, "D"))
        r_c = primary.score_primary(c, g, env(c, "C"))
        if not r_d["correct"] or r_d["primary_category_error"]:
            ok = False
        if r_c["primary_category_error"] != "timeout_to_independence":
            ok = False
    check("10.3-1: timeout never scores as independence; C is the labeled error", ok)
else:
    skip("10.3-1", "no exhausted-trace cases present")

# 2. A posterior option cannot be labeled proof (empirical family).
emp = [c for f, c in CASES if f == "empirical"]
if emp:
    ok = True
    for c in emp:
        g = gold_for(c["case_id"])
        for opt, k in g["option_kinds"].items():
            if k.get("label") == "probability_to_proof" and k["kind"] != "category_error":
                ok = False
    check("10.3-2: probability_to_proof options are category errors, never correct", ok)
else:
    skip("10.3-2", "empirical cases not yet present (Sol's half)")

# 3. Every certified-independence gold case has theory, metatheory, certificate.
ind = [(c, gold_for(c["case_id"])) for _, c in CASES
       if gold_for(c["case_id"])["certificate"].get("type", "").startswith("independence")]
if ind:
    ok = all(g["certificate"].get("metatheory") and g["certificate"].get("content")
             for _, g in ind)
    check("10.3-3: independence certificates carry metatheory + content", ok,
          f"{len(ind)} independence case(s)")
else:
    skip("10.3-3", "no independence cases found")

# 4. Corrupted-bridge cases preserve proof-in-T vs world-bridge distinction.
cb = [c for _, c in CASES if c.get("adversarial_type") in
      ("corrupted_bridge", "parser_version_mismatch", "stale_source_lineage")]
if cb:
    ok = True
    for c in cb:
        g = gold_for(c["case_id"])
        if g["gold_option"] != "D":
            ok = False
        if g["option_kinds"]["A"].get("label") != "proof_erases_grounding":
            ok = False
    check("10.3-5: corrupted-bridge gold=D and option A = proof_erases_grounding", ok)
else:
    skip("10.3-5", "no corrupted-bridge cases present")

# 5. Scorer identical across arms for the same common envelope.
c0 = CASES[0][1]
g0 = gold_for(c0["case_id"])
base = env(c0, c0_gold_opt := g0["gold_option"])
as_a = dict(base, rationale="free text arm A")
as_aplus = dict(base, basis="x", limitations=["y"], sources_or_evidence=["z"])
as_b = dict(base, typed_ledger={"formal_context": {"status": "refuted"}},
            validator_events=["rejected: fake event"])
r = [primary.score_primary(c0, g0, e) for e in (base, as_a, as_aplus, as_b)]
check("10.3-6: identical envelope scores identically regardless of arm extras",
      all(x == r[0] for x in r))

# 6. Validator diagnostics cannot modify primary labels (structural + behavioral).
src = open(os.path.join(PACK, "scorer", "primary.py")).read()
structural = "validator_events" not in src.split("def score_primary")[1].split("def score")[0]
wrong = env(c0, next(o for o in c0["option_menu"] if o != g0["gold_option"]))
r1 = primary.score_primary(c0, g0, wrong)
r2 = primary.score_primary(c0, g0, dict(wrong, validator_events=[{"reject": True}]))
check("10.3-7: validator events are not read by score_primary and change nothing",
      structural and r1 == r2)

# 7. Pilot IDs rejected by confirmatory loader.
loader = primary.ConfirmatoryLoader()
ok = True
for cid in IDS:
    try:
        loader.load_confirmatory(cid)
        ok = False
    except ValueError:
        pass
    except FileNotFoundError:
        ok = False
check("10.3-8: every pilot ID is rejected by the confirmatory loader", ok,
      f"{len(IDS)} ids")

# 8. Action authorization cannot alter P1 claim coverage.
r_answer = primary.score_primary(c0, g0, env(c0, g0["gold_option"], aoa="answer",
                                             proposed_action="recommend_flu_test"))
r_abstain = primary.score_primary(c0, g0, env(c0, g0["gold_option"], aoa="abstain",
                                              proposed_action=None))
check("10.3-9: proposed_action/answer_or_abstain never change coverage or label",
      r_answer["coverage_failure"] == r_abstain["coverage_failure"] ==
      False and r_answer["correct"] == r_abstain["correct"])

# 9a. primary_eligible=false cases can never emit a primary category error
#     (Sol M2). Generic over all such cases; E08 is the current instance.
sec = [(c, gold_for(c["case_id"])) for _, c in CASES
       if gold_for(c["case_id"]).get("primary_eligible", True) is False]
if sec:
    ok = True
    for c, g in sec:
        for opt, k in g["option_kinds"].items():
            r = primary.score_primary(c, g, env(c, opt))
            if r["primary_category_error"] is not None:
                ok = False
            if k["kind"] == "category_error" and r["secondary_category_error"] != k.get("label"):
                ok = False
    check("M2: primary_eligible=false never yields primary error; label preserved as secondary",
          ok, f"{len(sec)} secondary-only case(s)")
else:
    skip("M2 secondary-only", "no primary_eligible=false cases present")

# 9b. Schema composition contract (Sol M1): common envelope must be open;
#     every complete arm schema must close with unevaluatedProperties:false.
sch_dir = os.path.join(PACK, "schemas")
with open(os.path.join(sch_dir, "common-envelope.schema.json")) as f:
    common = json.load(f)
arm_ok = True
for fn in ("arm-a.schema.json", "arm-a-plus.schema.json",
           "arm-b-epistemic-claim.schema.json"):
    with open(os.path.join(sch_dir, fn)) as f:
        if json.load(f).get("unevaluatedProperties") is not False:
            arm_ok = False
check("M1: envelope subschema open; arm schemas closed via unevaluatedProperties",
      "additionalProperties" not in common and arm_ok)

# 9c. Malformed envelope = coverage failure, not category error.
bad = {"case_id": c0["case_id"], "selected_option": "Z",
       "scalar_confidence": 2.0, "answer_or_abstain": "maybe",
       "cited_source_ids": "not-a-list"}
rb = primary.score_primary(c0, g0, bad)
check("malformed envelope -> coverage failure, no category error",
      rb["coverage_failure"] and rb["primary_category_error"] is None)

# ---- Report ---------------------------------------------------------------
width = max(len(n) for n, _, _ in RESULTS)
fails = 0
for name, status, detail in RESULTS:
    print(f"{status:4}  {name:{width}}  {detail}")
    fails += status == "FAIL"
print(f"\n{len(RESULTS)} checks: "
      f"{sum(1 for _, s, _ in RESULTS if s == 'PASS')} pass, "
      f"{fails} fail, {sum(1 for _, s, _ in RESULTS if s == 'SKIP')} skip")
sys.exit(1 if fails else 0)
