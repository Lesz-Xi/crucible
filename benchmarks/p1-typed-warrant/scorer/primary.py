"""P1 primary scorer — deterministic, arm-neutral, stdlib-only.

Implements O-2 section 4.1 exactly:
    case_id + selected_option -> frozen answer-key label

Load-bearing invariants (tested in tests/test_acceptance.py):
  * Depends ONLY on the common envelope and the isolated answer key in gold/.
  * Identical output for identical envelopes regardless of which arm produced
    them; arm identity, rationale text, typed ledgers, and validator_events are
    not inputs to this function and cannot change its result (O-2 section 3.7).
  * A malformed envelope is a coverage/valid-response failure, never a
    category error (O-2 section 3.7).
  * Coverage semantics: a valid classification on a claim_answerable case is
    covered; proposed_action / answer_or_abstain do not alter claim coverage
    (O-2 section 8.2).
"""

import json
import os

PACK_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES_DIR = os.path.join(PACK_ROOT, "cases", "pilot")
GOLD_DIR = os.path.join(PACK_ROOT, "gold")

VALID_ABSTAIN = {"answer", "abstain", "escalate"}
FROZEN_LABELS = {
    "timeout_to_independence",
    "probability_to_proof",
    "theory_relative_to_unconditional",
    "proof_erases_grounding",
    "hidden_source_conflict",
    "calibration_scope_extrapolation",
}
# theory_relative_to_unconditional and proof_erases_grounding are the two
# flavors of O-2 section 4's single compound row; both are admissible labels.

PILOT_ID_PREFIXES = ("F", "E", "B")  # Stage 0 pilot namespace


def load_case(case_id):
    for family in ("formal", "empirical", "bridge"):
        path = os.path.join(CASES_DIR, family, case_id + ".json")
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)
    raise FileNotFoundError(f"unknown case_id {case_id!r}")


def load_gold(case_id):
    path = os.path.join(GOLD_DIR, case_id + ".gold.json")
    with open(path) as f:
        return json.load(f)


def envelope_is_valid(env, case):
    if not isinstance(env, dict):
        return False
    required = ("case_id", "selected_option", "scalar_confidence",
                "answer_or_abstain", "cited_source_ids")
    if any(k not in env for k in required):
        return False
    if env["case_id"] != case["case_id"]:
        return False
    if env["selected_option"] not in case["option_menu"]:
        return False
    sc = env["scalar_confidence"]
    if not isinstance(sc, (int, float)) or isinstance(sc, bool) or not (0.0 <= sc <= 1.0):
        return False
    if env["answer_or_abstain"] not in VALID_ABSTAIN:
        return False
    if not isinstance(env["cited_source_ids"], list):
        return False
    return True


def score_primary(case, gold, envelope):
    """Score one case-run. Only `envelope` fields named in the common-envelope
    schema are read; anything else the caller attaches is ignored."""
    primary_eligible = gold.get("primary_eligible", True)
    if not envelope_is_valid(envelope, case):
        return {
            "case_id": case["case_id"],
            "primary_eligible": primary_eligible,
            "valid_response": False,
            "correct": False,
            "ordinary_error": False,
            "primary_category_error": None,
            "secondary_category_error": None,
            "coverage_failure": True,
        }
    kind_entry = gold["option_kinds"][envelope["selected_option"]]
    kind = kind_entry["kind"]
    label = kind_entry.get("label") if kind == "category_error" else None
    # O-2 sections 3.7 / 5.2 (E8): a case marked primary_eligible=false can
    # NEVER contribute a primary category error; its label is preserved only
    # as a secondary diagnostic. Enforced here, not by downstream convention
    # (Sol, T-3 Coms 04, Mandatory 2).
    return {
        "case_id": case["case_id"],
        "primary_eligible": primary_eligible,
        "valid_response": True,
        "correct": kind == "correct",
        "ordinary_error": kind == "ordinary_error",
        "primary_category_error": label if primary_eligible else None,
        "secondary_category_error": None if primary_eligible else label,
        "coverage_failure": False,
    }


def score(case_id, envelope):
    case = load_case(case_id)
    gold = load_gold(case_id)
    return score_primary(case, gold, envelope)


class ConfirmatoryLoader:
    """Stage 1 loader stub enforcing O-2 section 10.3: pilot IDs are rejected.

    The pilot registry is every case file currently present under
    cases/pilot/. Confirmatory cases (Stage 1) will live in a separate
    directory and must never collide with these IDs."""

    def __init__(self):
        self.pilot_ids = set()
        for family in ("formal", "empirical", "bridge"):
            d = os.path.join(CASES_DIR, family)
            if os.path.isdir(d):
                for fn in os.listdir(d):
                    if fn.endswith(".json"):
                        self.pilot_ids.add(fn[:-5])

    def load_confirmatory(self, case_id):
        if case_id in self.pilot_ids:
            raise ValueError(
                f"case_id {case_id!r} is a Stage 0 pilot case and is "
                "permanently excluded from confirmatory use (O-2 section 6.2)")
        raise FileNotFoundError(
            f"no confirmatory case {case_id!r}: Stage 1 cases do not exist yet")


if __name__ == "__main__":
    import sys
    payload = json.load(sys.stdin)
    print(json.dumps(score(payload["case_id"], payload), indent=1))
