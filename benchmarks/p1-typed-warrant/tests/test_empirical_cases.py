from __future__ import annotations

import json
import math
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CASE_DIR = ROOT / "cases" / "pilot" / "empirical"
GOLD_DIR = ROOT / "gold"
FROZEN_ERROR_LABELS = {
    "timeout_to_independence",
    "probability_to_proof",
    "theory_relative_to_unconditional",
    "proof_erases_grounding",
    "hidden_source_conflict",
    "calibration_scope_extrapolation",
}
FORBIDDEN_INPUT_KEYS = {
    "gold_option",
    "option_labels",
    "primary_eligible",
    "claim_answerable",
    "action_authorizable",
}


def load_json(path: Path) -> dict[str, object]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise TypeError(f"expected JSON object in {path}")
    return value


class EmpiricalCaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.case_paths = sorted(CASE_DIR.glob("E*.json"))
        cls.gold_cases = {
            path.stem.removesuffix(".gold"): load_json(path)
            for path in sorted(GOLD_DIR.glob("E*.gold.json"))
        }

    def test_exactly_ten_empirical_inputs_exist(self) -> None:
        self.assertEqual(len(self.case_paths), 10)
        self.assertEqual([path.stem for path in self.case_paths], [f"E{i:02d}" for i in range(1, 11)])

    def test_case_inputs_contain_no_gold_fields(self) -> None:
        for path in self.case_paths:
            case = load_json(path)
            leaked = FORBIDDEN_INPUT_KEYS.intersection(case)
            self.assertEqual(leaked, set(), f"gold leakage in {path.name}")

    def test_gold_map_is_total_and_has_one_correct_option(self) -> None:
        for path in self.case_paths:
            case = load_json(path)
            case_id = case["case_id"]
            self.assertIn(case_id, self.gold_cases)
            gold = self.gold_cases[case_id]
            self.assertIsInstance(gold, dict)

            option_menu = case["option_menu"]
            self.assertIsInstance(option_menu, dict)
            labels = gold["option_kinds"]
            self.assertEqual(set(option_menu), set(labels))

            correct = [option_id for option_id, label in labels.items() if label["kind"] == "correct"]
            self.assertEqual(correct, [gold["gold_option"]])

    def test_category_errors_use_only_frozen_labels(self) -> None:
        for case_id, gold in self.gold_cases.items():
            for option_id, label in gold["option_kinds"].items():
                if label["kind"] == "category_error":
                    self.assertIn(label["label"], FROZEN_ERROR_LABELS, f"{case_id}:{option_id}")
                else:
                    self.assertNotIn("label", label, f"unexpected error label on {case_id}:{option_id}")

    def test_required_sources_exist_in_inputs(self) -> None:
        for path in self.case_paths:
            case = load_json(path)
            gold = self.gold_cases[case["case_id"]]
            self.assertTrue(set(gold["required_source_ids"]).issubset(set(case["source_records"])))

    def test_published_bayesian_arithmetic(self) -> None:
        screening = (0.01 * 0.90) / ((0.01 * 0.90) + (0.99 * 0.05))
        self.assertTrue(math.isclose(screening, 0.15384615384615385, rel_tol=1e-12))

        bayes_factor = ((0.75**8) * (0.25**2)) / (0.5**10)
        posterior_equal_priors = bayes_factor / (1 + bayes_factor)
        self.assertTrue(math.isclose(bayes_factor, 6.4072265625, rel_tol=1e-12))
        self.assertTrue(math.isclose(posterior_equal_priors, 0.8649967040210943, rel_tol=1e-12))

        low_prior_odds = 0.01 / 0.99
        low_prior_posterior = (low_prior_odds * 20) / (1 + (low_prior_odds * 20))
        self.assertTrue(math.isclose(low_prior_posterior, 0.16806722689075632, rel_tol=1e-12))
        self.assertTrue(math.isclose(20 / 21, 0.9523809523809523, rel_tol=1e-12))

    def test_action_contract_case_is_secondary_only(self) -> None:
        self.assertFalse(self.gold_cases["E08"]["primary_eligible"])


if __name__ == "__main__":
    unittest.main()
