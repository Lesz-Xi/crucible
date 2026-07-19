from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

PACK_ROOT = Path(__file__).resolve().parents[1]
if str(PACK_ROOT) not in sys.path:
    sys.path.insert(0, str(PACK_ROOT))

from validators.typed_invariants import validate_typed_invariants


def base_response() -> dict[str, object]:
    return {
        "case_id": "TEST",
        "selected_option": "A",
        "scalar_confidence": 0.8,
        "answer_or_abstain": "answer",
        "cited_source_ids": [],
        "proposed_action": None,
        "epistemic_claim": {
            "claim_type": "formal",
            "formal_context": {
                "theory_id": "T0",
                "checker_id": "checker-v1",
                "status": "proved",
                "certificate_ref": "proof-1",
                "metatheory_id": None,
                "search_budget": None,
            },
            "credence_context": {
                "warrant_type": "none",
                "model_and_prior": None,
                "evidence_ref": None,
                "assumptions": [],
                "calibration_scope": None,
            },
            "grounding_context": {
                "source_or_sensor": None,
                "parser_or_transform": None,
                "bridge_assumptions": [],
                "integrity_conflicts": [],
                "conflicts_resolved": True,
            },
            "decision_context": {
                "proposed_action": None,
                "authorization_requested": False,
                "required_contract": None,
                "contract_satisfied": None,
                "abstain_or_escalate": False,
                "world_facing_conclusion": False,
            },
        },
        "validator_events": [],
    }


class TypedInvariantTests(unittest.TestCase):
    def event_codes(self, response: dict[str, object]) -> set[str]:
        return {event.code for event in validate_typed_invariants(response)}

    def test_valid_proof_has_no_events(self) -> None:
        self.assertEqual(validate_typed_invariants(base_response()), [])

    def test_independence_requires_theory_metatheory_and_certificate(self) -> None:
        response = base_response()
        formal = response["epistemic_claim"]["formal_context"]  # type: ignore[index]
        formal.update(  # type: ignore[union-attr]
            {
                "status": "independent_with_certificate",
                "metatheory_id": None,
                "certificate_ref": None,
            }
        )
        self.assertIn("INDEPENDENCE_REQUIRES_CERTIFICATE", self.event_codes(response))

    def test_proof_status_requires_context(self) -> None:
        response = base_response()
        formal = response["epistemic_claim"]["formal_context"]  # type: ignore[index]
        formal["checker_id"] = None  # type: ignore[index]
        self.assertIn("PROOF_STATUS_REQUIRES_CONTEXT", self.event_codes(response))

    def test_bayesian_posterior_requires_model_prior_and_evidence(self) -> None:
        response = base_response()
        claim = response["epistemic_claim"]  # type: ignore[assignment]
        claim["claim_type"] = "empirical"  # type: ignore[index]
        claim["credence_context"] = {  # type: ignore[index]
            "warrant_type": "bayesian_posterior",
            "model_and_prior": {"model": "H0/H1", "prior": None},
            "evidence_ref": None,
        }
        self.assertIn("BAYESIAN_POSTERIOR_REQUIRES_SEMANTICS", self.event_codes(response))

    def test_calibrated_predictor_rejects_out_of_scope_claim(self) -> None:
        response = base_response()
        claim = response["epistemic_claim"]  # type: ignore[assignment]
        claim["claim_type"] = "empirical"  # type: ignore[index]
        claim["credence_context"] = {  # type: ignore[index]
            "warrant_type": "calibrated_predictor",
            "calibration_scope": {"domain": "infrared", "in_scope": False},
        }
        self.assertIn("CALIBRATION_SCOPE_VIOLATION", self.event_codes(response))

    def test_unsatisfied_action_contract_is_secondary_event(self) -> None:
        response = base_response()
        decision = response["epistemic_claim"]["decision_context"]  # type: ignore[index]
        decision.update(  # type: ignore[union-attr]
            {"authorization_requested": True, "contract_satisfied": False}
        )
        self.assertIn("ACTION_CONTRACT_UNSATISFIED", self.event_codes(response))
        self.assertEqual(response["selected_option"], "A")

    def test_unresolved_bridge_conflict_is_rejected(self) -> None:
        response = base_response()
        claim = response["epistemic_claim"]  # type: ignore[assignment]
        claim["claim_type"] = "bridge"  # type: ignore[index]
        claim["grounding_context"] = {  # type: ignore[index]
            "integrity_conflicts": ["checksum mismatch"],
            "conflicts_resolved": False,
        }
        claim["decision_context"] = {  # type: ignore[index]
            "authorization_requested": False,
            "contract_satisfied": None,
            "world_facing_conclusion": True,
        }
        self.assertIn("UNRESOLVED_GROUNDING_CONFLICT", self.event_codes(response))

    def test_validation_is_pure_and_cannot_change_primary_fields(self) -> None:
        response = base_response()
        before = copy.deepcopy(response)
        validate_typed_invariants(response)
        self.assertEqual(response, before)
        self.assertEqual(response["selected_option"], before["selected_option"])


if __name__ == "__main__":
    unittest.main()
