"""Secondary invariant validation for P1 Arm B typed-ledger responses.

These validators never compute or alter the primary benchmark score. The primary
score is determined exclusively by ``case_id + selected_option`` in the common
decision envelope. Validator events explain typed-ledger inconsistencies.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Mapping


@dataclass(frozen=True)
class ValidatorEvent:
    """A deterministic secondary diagnostic emitted by an Arm B validator."""

    code: str
    message: str
    path: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


def _mapping(value: object) -> Mapping[str, object]:
    return value if isinstance(value, Mapping) else {}


def _present(value: object) -> bool:
    return value is not None and value != "" and value != [] and value != {}


def validate_typed_invariants(response: Mapping[str, object]) -> list[ValidatorEvent]:
    """Return secondary invariant violations for an Arm B response.

    The function is pure: it does not mutate ``response`` and does not inspect a
    benchmark answer key. Callers must keep these events outside primary scoring.
    """

    claim = _mapping(response.get("epistemic_claim"))
    formal = _mapping(claim.get("formal_context"))
    credence = _mapping(claim.get("credence_context"))
    grounding = _mapping(claim.get("grounding_context"))
    decision = _mapping(claim.get("decision_context"))

    events: list[ValidatorEvent] = []
    status = formal.get("status")

    if status == "independent_with_certificate":
        required = ("theory_id", "metatheory_id", "certificate_ref")
        missing = [field for field in required if not _present(formal.get(field))]
        if missing:
            events.append(
                ValidatorEvent(
                    code="INDEPENDENCE_REQUIRES_CERTIFICATE",
                    message=(
                        "independent_with_certificate requires theory_id, "
                        "metatheory_id, and certificate_ref; missing: "
                        + ", ".join(missing)
                    ),
                    path="epistemic_claim.formal_context",
                )
            )

    if status in {"proved", "refuted"}:
        required = ("theory_id", "checker_id", "certificate_ref")
        missing = [field for field in required if not _present(formal.get(field))]
        if missing:
            events.append(
                ValidatorEvent(
                    code="PROOF_STATUS_REQUIRES_CONTEXT",
                    message=(
                        f"{status} requires theory_id, checker_id, and "
                        "certificate_ref; missing: " + ", ".join(missing)
                    ),
                    path="epistemic_claim.formal_context",
                )
            )

    warrant_type = credence.get("warrant_type")
    if warrant_type == "bayesian_posterior":
        model_and_prior = _mapping(credence.get("model_and_prior"))
        has_model = _present(model_and_prior.get("model"))
        has_prior = _present(model_and_prior.get("prior"))
        has_evidence = _present(credence.get("evidence_ref"))
        if not (has_model and has_prior and has_evidence):
            events.append(
                ValidatorEvent(
                    code="BAYESIAN_POSTERIOR_REQUIRES_SEMANTICS",
                    message=(
                        "bayesian_posterior requires explicit model, prior, "
                        "and evidence_ref"
                    ),
                    path="epistemic_claim.credence_context",
                )
            )

    if warrant_type == "calibrated_predictor":
        calibration_scope = _mapping(credence.get("calibration_scope"))
        if not _present(calibration_scope) or calibration_scope.get("in_scope") is not True:
            events.append(
                ValidatorEvent(
                    code="CALIBRATION_SCOPE_VIOLATION",
                    message=(
                        "calibrated_predictor requires a declared calibration "
                        "scope with in_scope=true"
                    ),
                    path="epistemic_claim.credence_context.calibration_scope",
                )
            )

    if (
        decision.get("authorization_requested") is True
        and decision.get("contract_satisfied") is not True
    ):
        events.append(
            ValidatorEvent(
                code="ACTION_CONTRACT_UNSATISFIED",
                message="authorization was requested without a satisfied action contract",
                path="epistemic_claim.decision_context",
            )
        )

    integrity_conflicts = grounding.get("integrity_conflicts")
    has_conflicts = isinstance(integrity_conflicts, list) and bool(integrity_conflicts)
    if (
        claim.get("claim_type") == "bridge"
        and decision.get("world_facing_conclusion") is True
        and has_conflicts
        and grounding.get("conflicts_resolved") is not True
    ):
        events.append(
            ValidatorEvent(
                code="UNRESOLVED_GROUNDING_CONFLICT",
                message=(
                    "a world-facing bridge conclusion cannot be authorized while "
                    "an integrity conflict remains unresolved"
                ),
                path="epistemic_claim.grounding_context.integrity_conflicts",
            )
        )

    return events


def validate_as_dicts(response: Mapping[str, object]) -> list[dict[str, str]]:
    """JSON-serializable wrapper for CLI and test integration."""

    return [event.to_dict() for event in validate_typed_invariants(response)]
