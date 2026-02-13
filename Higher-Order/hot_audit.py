#!/usr/bin/env python3
"""Deterministic audit and validation for HOT causal graph specifications."""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections import Counter, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


ALLOWED_ATTITUDES = {"Assert", "Doubt", "Wonder", "None"}


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    edge_type: str


class AuditInputError(ValueError):
    """Raised when the input spec/dataset is malformed."""


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _extract_edge(raw: dict) -> Edge:
    source = raw.get("source", raw.get("from"))
    target = raw.get("target", raw.get("to"))
    if not source or not target:
        raise AuditInputError(f"Edge missing endpoints: {raw}")
    return Edge(str(source), str(target), str(raw.get("type", "causal")))


def validate_graph(spec: dict) -> dict:
    node_ids = [str(node.get("id")) for node in spec.get("nodes", []) if node.get("id")]
    node_set = set(node_ids)
    node_counts = Counter(node_ids)
    duplicate_nodes = sorted([node for node, count in node_counts.items() if count > 1])

    edges = [_extract_edge(raw_edge) for raw_edge in spec.get("edges", [])]
    missing_edge_refs = [
        {"source": edge.source, "target": edge.target}
        for edge in edges
        if edge.source not in node_set or edge.target not in node_set
    ]

    equation_nodes = {
        str(eq.get("node")) for eq in spec.get("structural_equations", []) if eq.get("node")
    }
    unknown_equation_nodes = sorted(node for node in equation_nodes if node not in node_set)

    require_equations = {
        str(node["id"])
        for node in spec.get("nodes", [])
        if node.get("kind") in {"endogenous", "derived"}
    }
    uncovered_required_nodes = sorted(require_equations - equation_nodes)
    equation_coverage = (
        (len(require_equations) - len(uncovered_required_nodes)) / len(require_equations)
        if require_equations
        else 1.0
    )

    # DAG check on causal slice only.
    causal_edges = [edge for edge in edges if edge.edge_type == "causal"]
    indegree: Dict[str, int] = {node: 0 for node in node_set}
    outgoing: Dict[str, List[str]] = {node: [] for node in node_set}
    for edge in causal_edges:
        if edge.source in node_set and edge.target in node_set:
            indegree[edge.target] += 1
            outgoing[edge.source].append(edge.target)

    queue = deque(sorted([node for node, degree in indegree.items() if degree == 0]))
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for nxt in outgoing[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    dag_valid = visited == len(node_set)
    cycle_candidates = sorted([node for node, degree in indegree.items() if degree > 0])

    constraint_ids = [c.get("id") for c in spec.get("constraints", []) if c.get("id")]
    missing_core_constraints = sorted(
        set(
            [
                "transitivity_principle",
                "separability",
                "assertoric_constraint",
                "two_state_requirement",
            ]
        )
        - set(constraint_ids)
    )

    return {
        "node_count": len(node_set),
        "edge_count": len(edges),
        "causal_edge_count": len(causal_edges),
        "duplicate_nodes": duplicate_nodes,
        "missing_edge_node_references": missing_edge_refs,
        "unknown_structural_equation_nodes": unknown_equation_nodes,
        "uncovered_required_nodes": uncovered_required_nodes,
        "equation_coverage": equation_coverage,
        "causal_slice_is_dag": dag_valid,
        "cycle_candidates": cycle_candidates,
        "missing_core_constraints": missing_core_constraints,
    }


def _parse_binary(raw: str, column: str, state_id: str) -> int:
    value = raw.strip()
    if value not in {"0", "1"}:
        raise AuditInputError(
            f"Invalid binary value in column '{column}' for state '{state_id}': {raw!r}"
        )
    return int(value)


def load_states(path: str) -> Tuple[List[dict], List[str]]:
    rows: List[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = list(reader.fieldnames or [])
        required = {
            "state_id",
            "has_hot",
            "hot_attitude",
            "is_conscious",
            "qualia_intensity",
            "concept_resolution",
        }
        if not required.issubset(set(fields)):
            raise AuditInputError(
                f"Dataset must include columns: {sorted(required)}. Found: {fields}"
            )

        for raw in reader:
            state_id = (raw.get("state_id") or "").strip()
            if not state_id:
                raise AuditInputError("Dataset row missing state_id.")

            has_hot = _parse_binary(raw.get("has_hot", "0"), "has_hot", state_id)
            is_conscious = _parse_binary(
                raw.get("is_conscious", "0"), "is_conscious", state_id
            )
            attitude = (raw.get("hot_attitude") or "None").strip()
            if attitude not in ALLOWED_ATTITUDES:
                raise AuditInputError(
                    f"Invalid hot_attitude for state '{state_id}': {attitude!r}. "
                    f"Allowed: {sorted(ALLOWED_ATTITUDES)}"
                )
            if has_hot == 0 and attitude != "None":
                # Keep deterministic checks strict: no HOT should imply attitude None.
                raise AuditInputError(
                    f"State '{state_id}' has has_hot=0 but hot_attitude={attitude!r}."
                )

            try:
                qualia_intensity = float((raw.get("qualia_intensity") or "0").strip())
                concept_resolution = float((raw.get("concept_resolution") or "0").strip())
            except ValueError as exc:
                raise AuditInputError(
                    f"Invalid float in state '{state_id}': {exc}"
                ) from exc

            row = {
                "state_id": state_id,
                "has_hot": has_hot,
                "hot_attitude": attitude,
                "is_conscious": is_conscious,
                "qualia_intensity": qualia_intensity,
                "concept_resolution": concept_resolution,
                "hot_state_id": (raw.get("hot_state_id") or "").strip(),
                "qualia_label": (raw.get("qualia_label") or "").strip(),
            }
            rows.append(row)

    return rows, fields


def validate_transitivity(states: Iterable[dict]) -> dict:
    violations = []
    total = 0
    for row in states:
        total += 1
        has_assertoric_hot = row["has_hot"] == 1 and row["hot_attitude"] == "Assert"
        observed_conscious = row["is_conscious"] == 1
        if has_assertoric_hot != observed_conscious:
            if has_assertoric_hot and not observed_conscious:
                reason = "Assert HOT exists but is_conscious=0"
            elif not has_assertoric_hot and observed_conscious:
                if row["has_hot"] == 1:
                    reason = (
                        f"Non-assertoric HOT ({row['hot_attitude']}) incorrectly triggers consciousness"
                    )
                else:
                    reason = "No HOT but is_conscious=1"
            else:
                reason = "TP mismatch"
            violations.append({"state_id": row["state_id"], "reason": reason})
    return {
        "total_states": total,
        "satisfying_states": total - len(violations),
        "violations": violations,
    }


def validate_assertoric_constraint(states: Iterable[dict]) -> dict:
    violations = []
    total_assertoric_candidates = 0
    for row in states:
        if row["has_hot"] == 1:
            total_assertoric_candidates += 1
        if row["is_conscious"] == 1 and row["has_hot"] == 1 and row["hot_attitude"] != "Assert":
            violations.append(
                {
                    "state_id": row["state_id"],
                    "hot_attitude": row["hot_attitude"],
                    "reason": "Conscious state is supported by non-assertoric HOT",
                }
            )
    return {
        "hot_states_checked": total_assertoric_candidates,
        "violations": violations,
    }


def validate_two_state_requirement(states: Iterable[dict], has_hot_state_id: bool) -> dict:
    violations = []
    checked = 0
    for row in states:
        if row["is_conscious"] != 1:
            continue
        checked += 1
        if not (row["has_hot"] == 1 and row["hot_attitude"] == "Assert"):
            violations.append(
                {
                    "state_id": row["state_id"],
                    "reason": "Conscious state missing assertoric HOT",
                }
            )
            continue
        if has_hot_state_id:
            hot_state_id = row["hot_state_id"]
            if not hot_state_id:
                violations.append(
                    {
                        "state_id": row["state_id"],
                        "reason": "hot_state_id missing for conscious state",
                    }
                )
            elif hot_state_id == row["state_id"]:
                violations.append(
                    {
                        "state_id": row["state_id"],
                        "reason": "Two-state violation: h equals s",
                    }
                )

    return {
        "checked_conscious_states": checked,
        "mode": "full" if has_hot_state_id else "partial",
        "violations": violations,
    }


def _pearson(xs: List[float], ys: List[float]) -> float:
    if len(xs) != len(ys):
        raise AuditInputError("Cannot compute correlation: vector lengths differ.")
    n = len(xs)
    if n < 2:
        return 0.0
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den_x = sum((x - mean_x) ** 2 for x in xs)
    den_y = sum((y - mean_y) ** 2 for y in ys)
    den = math.sqrt(den_x * den_y)
    if den == 0.0:
        return 0.0
    return num / den


def validate_separability(states: List[dict], threshold: float) -> dict:
    consciousness = [float(row["is_conscious"]) for row in states]
    qualia = [float(row["qualia_intensity"]) for row in states]
    corr = _pearson(consciousness, qualia)

    conscious_vals = [row["qualia_intensity"] for row in states if row["is_conscious"] == 1]
    subliminal_vals = [row["qualia_intensity"] for row in states if row["is_conscious"] == 0]
    conscious_mean = sum(conscious_vals) / len(conscious_vals) if conscious_vals else 0.0
    subliminal_mean = sum(subliminal_vals) / len(subliminal_vals) if subliminal_vals else 0.0

    return {
        "correlation_r": corr,
        "threshold_abs_r": threshold,
        "independence_confirmed": abs(corr) < threshold,
        "mean_qualia_conscious": conscious_mean,
        "mean_qualia_subliminal": subliminal_mean,
    }


def simulate_state_transition(
    states: List[dict], target_state_id: str | None = None
) -> dict:
    chosen = None
    if target_state_id:
        for row in states:
            if row["state_id"] == target_state_id:
                chosen = row
                break
        if chosen is None:
            raise AuditInputError(f"Transition state '{target_state_id}' not found in dataset.")
    else:
        chosen = next((row for row in states if row["is_conscious"] == 0), states[0])

    pre = {
        "state_id": chosen["state_id"],
        "is_conscious": chosen["is_conscious"],
        "has_hot": chosen["has_hot"],
        "hot_attitude": chosen["hot_attitude"],
        "qualia_intensity": chosen["qualia_intensity"],
    }
    post = {
        "state_id": chosen["state_id"],
        "is_conscious": 1,
        "has_hot": 1,
        "hot_attitude": "Assert",
        "qualia_intensity": chosen["qualia_intensity"],
    }
    return {
        "intervention": "do_make_state_conscious",
        "pre": pre,
        "post": post,
        "qualia_unchanged": pre["qualia_intensity"] == post["qualia_intensity"],
    }


def simulate_granularity(
    initial_concept_res: float,
    steps: int,
    alpha: float,
    max_resolution: float,
    concept_step: float,
) -> List[dict]:
    trajectory = []
    for step in range(max(0, steps) + 1):
        concept = max(0.0, min(max_resolution, initial_concept_res + step * concept_step))
        experiential = max(0.0, min(max_resolution, alpha * concept))
        trajectory.append(
            {
                "step": step,
                "concept_resolution": concept,
                "experiential_resolution": experiential,
            }
        )
    return trajectory


def maybe_plot_granularity(trajectory: List[dict], output_path: str) -> dict:
    try:
        import matplotlib.pyplot as plt  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on environment
        return {"plotted": False, "reason": f"matplotlib unavailable: {exc}"}

    x = [point["step"] for point in trajectory]
    concept = [point["concept_resolution"] for point in trajectory]
    experiential = [point["experiential_resolution"] for point in trajectory]

    plt.figure(figsize=(8, 4.5))
    plt.plot(x, concept, label="Concept Resolution", linewidth=2)
    plt.plot(x, experiential, label="Experiential Resolution", linewidth=2)
    plt.xlabel("Step")
    plt.ylabel("Resolution")
    plt.title("Granularity Trajectory: Res(E) ∝ Res(C_E)")
    plt.ylim(0, 1.05)
    plt.grid(alpha=0.2)
    plt.legend()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def detect_misrepresentation(spec: dict, states: List[dict] | None) -> dict:
    node_ids = {node.get("id") for node in spec.get("nodes", [])}
    intervention_ids = {item.get("id") for item in spec.get("interventions", [])}
    structural_equations = " ".join(
        str(item.get("equation", "")) for item in spec.get("structural_equations", [])
    )

    qualia_lookup = {}
    if states:
        qualia_lookup = {
            row["state_id"]: row.get("qualia_label", "")
            for row in states
            if row.get("qualia_label")
        }

    fear_label = qualia_lookup.get("s_fear", "fear")
    vibration_label = qualia_lookup.get("s_vibration", "vibration")
    experienced_label = "pain"
    mismatch = experienced_label not in {fear_label, vibration_label}

    return {
        "inputs": ["s_fear", "s_vibration"],
        "required_nodes_present": all(
            node in node_ids for node in ("s_fear", "s_vibration", "phi_H", "R_pain")
        ),
        "misrepresentation_equation_present": "phi_H" in structural_equations
        and "R_pain" in structural_equations,
        "intervention_present": "do_induce_dental_misrepresentation" in intervention_ids,
        "input_qualia": [fear_label, vibration_label],
        "hot_target": "R_pain",
        "experienced_qualia": experienced_label,
        "mismatch_confirmed": mismatch,
    }


def build_recommendations(
    graph_report: dict,
    tp_report: dict | None,
    separability_report: dict | None,
    assertoric_report: dict | None,
    two_state_report: dict | None,
    misrep_report: dict,
) -> List[str]:
    recs = []
    if graph_report["missing_edge_node_references"]:
        recs.append("Fix dangling edges that reference undefined nodes.")
    if graph_report["unknown_structural_equation_nodes"]:
        recs.append("Align structural equations with declared node identifiers.")
    if not graph_report["causal_slice_is_dag"]:
        recs.append("Remove or time-index causal cycles in the same-time causal slice.")
    if graph_report["missing_core_constraints"]:
        recs.append(
            "Add missing core constraints: " + ", ".join(graph_report["missing_core_constraints"])
        )

    if tp_report and tp_report["violations"]:
        ids = ", ".join(item["state_id"] for item in tp_report["violations"][:6])
        recs.append(f"Fix TP violations for states: {ids}.")
    if assertoric_report and assertoric_report["violations"]:
        recs.append("Enforce assertoric gating so Doubt/Wonder do not produce C(s)=1.")
    if two_state_report and two_state_report["violations"]:
        recs.append("Ensure every conscious state has a distinct HOT token (h != s).")
    if separability_report and not separability_report["independence_confirmed"]:
        recs.append(
            "Recalibrate qualia assignment process; Q(s) should remain independent of C(s)."
        )
    if not misrep_report["required_nodes_present"]:
        recs.append("Add {s_fear, s_vibration, phi_H, R_pain} nodes to support error case audit.")

    if not recs:
        recs.append("All core HOT principles validated on provided inputs.")
    return recs


def _mark(condition: bool) -> str:
    return "✓" if condition else "✗"


def render_text_report(report: dict) -> str:
    lines = []
    lines.append("=== HOT Causal Graph Audit Report ===")
    lines.append("")

    graph = report["graph_validation"]
    lines.append("1. GRAPH STRUCTURE VALIDATION")
    lines.append(
        f"   {_mark(not graph['unknown_structural_equation_nodes'])} "
        "All nodes referenced by structural equations are defined"
    )
    lines.append(
        f"   {_mark(not graph['missing_edge_node_references'])} "
        "Edge endpoints reference valid nodes"
    )
    lines.append(
        f"   {_mark(graph['causal_slice_is_dag'])} "
        "DAG property confirmed (causal slice)"
    )
    lines.append(
        f"   {_mark(not graph['missing_core_constraints'])} "
        "Core HOT constraints present"
    )
    lines.append(
        f"   {_mark(True)} {graph['node_count']} nodes, {graph['edge_count']} edges "
        f"({graph['causal_edge_count']} causal)"
    )
    lines.append("")

    tp = report.get("transitivity")
    if tp:
        lines.append("2. TRANSITIVITY PRINCIPLE (TP) VALIDATION")
        tp_ok = len(tp["violations"]) == 0
        lines.append(
            f"   {_mark(tp_ok)} {tp['satisfying_states']}/{tp['total_states']} states satisfy TP"
        )
        if tp["violations"]:
            lines.append(f"   ✗ {len(tp['violations'])} violations detected:")
            for item in tp["violations"][:10]:
                lines.append(f"     - State {item['state_id']}: {item['reason']}")
        lines.append("")

    sep = report.get("separability")
    if sep:
        lines.append("3. SEPARABILITY TEST")
        lines.append(
            f"   {_mark(sep['independence_confirmed'])} "
            f"Qualia-Consciousness correlation: r = {sep['correlation_r']:.3f}"
        )
        lines.append(
            f"   {_mark(sep['independence_confirmed'])} "
            f"Threshold check: |r| < {sep['threshold_abs_r']:.3f}"
        )
        lines.append("")

    assertoric = report.get("assertoric_constraint")
    two_state = report.get("two_state_requirement")
    if assertoric or two_state:
        lines.append("4. CONSTRAINT CROSS-CHECKS")
        if assertoric:
            ok = len(assertoric["violations"]) == 0
            lines.append(
                f"   {_mark(ok)} Assertoric constraint: {assertoric['hot_states_checked']} HOT states checked"
            )
            for item in assertoric["violations"][:10]:
                lines.append(f"     - State {item['state_id']}: {item['reason']}")
        if two_state:
            ok = len(two_state["violations"]) == 0
            lines.append(
                f"   {_mark(ok)} Two-state requirement ({two_state['mode']} mode): "
                f"{two_state['checked_conscious_states']} conscious states checked"
            )
            for item in two_state["violations"][:10]:
                lines.append(f"     - State {item['state_id']}: {item['reason']}")
        lines.append("")

    transition = report.get("state_transition_simulation")
    if transition:
        lines.append("5. INTERVENTION EFFECTS")
        lines.append(f"   {transition['intervention']} | {transition['pre']['state_id']}:")
        lines.append(f"     - Pre: C(s) = {transition['pre']['is_conscious']}")
        lines.append(f"     - Post: C(s) = {transition['post']['is_conscious']}")
        lines.append(
            f"     - Qualia unchanged: {transition['qualia_unchanged']} "
            f"(Q = {transition['pre']['qualia_intensity']:.3f})"
        )
        lines.append("")

    granularity = report.get("granularity_trajectory")
    if granularity:
        lines.append("6. GRANULARITY TRAJECTORY")
        if len(granularity) <= 5:
            for point in granularity:
                lines.append(
                    f"   Step {point['step']}: Concept Res = {point['concept_resolution']:.2f} "
                    f"-> Exp Res = {point['experiential_resolution']:.2f}"
                )
        else:
            for point in granularity[:3]:
                lines.append(
                    f"   Step {point['step']}: Concept Res = {point['concept_resolution']:.2f} "
                    f"-> Exp Res = {point['experiential_resolution']:.2f}"
                )
            mid = granularity[len(granularity) // 2]
            end = granularity[-1]
            lines.append(
                f"   Step {mid['step']}: Concept Res = {mid['concept_resolution']:.2f} "
                f"-> Exp Res = {mid['experiential_resolution']:.2f}"
            )
            lines.append(
                f"   Step {end['step']}: Concept Res = {end['concept_resolution']:.2f} "
                f"-> Exp Res = {end['experiential_resolution']:.2f}"
            )
        lines.append("")

    misrep = report["misrepresentation_analysis"]
    lines.append("7. MISREPRESENTATION ANALYSIS")
    lines.append("   Dental Fear Error:")
    lines.append(f"     - Inputs: {{{', '.join(misrep['inputs'])}}}")
    lines.append(f"     - HOT Target: {misrep['hot_target']}")
    lines.append(f"     - Experienced Qualia: {misrep['experienced_qualia']}")
    lines.append(
        f"     - Mismatch: {_mark(misrep['mismatch_confirmed'])} "
        "(not equal to first-order input qualia)"
    )
    lines.append("")

    lines.append("=== RECOMMENDATIONS ===")
    for item in report["recommendations"]:
        lines.append(f"- {item}")

    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Deterministic HOT causal graph audit and constraint validator."
    )
    parser.add_argument("--spec", required=True, help="Path to HOT causal graph JSON spec.")
    parser.add_argument(
        "--state-dataset",
        help=(
            "Optional CSV with columns: state_id,has_hot,hot_attitude,is_conscious,"
            "qualia_intensity,concept_resolution"
        ),
    )
    parser.add_argument("--validate-tp", action="store_true", help="Validate Transitivity Principle.")
    parser.add_argument(
        "--validate-separability", action="store_true", help="Validate Q(s) independence from C(s)."
    )
    parser.add_argument(
        "--validate-assertoric",
        action="store_true",
        help="Validate that only assertoric HOTs produce consciousness.",
    )
    parser.add_argument(
        "--validate-two-state",
        action="store_true",
        help="Validate h != s for conscious states (uses hot_state_id when available).",
    )
    parser.add_argument(
        "--simulate-granularity",
        action="store_true",
        help="Simulate trajectory for Res(E) proportional to concept resolution.",
    )
    parser.add_argument(
        "--initial-concept-res",
        type=float,
        default=0.5,
        help="Initial concept resolution used in granularity simulation.",
    )
    parser.add_argument(
        "--granularity-alpha",
        type=float,
        default=0.95,
        help="Proportionality constant in Res(E)=alpha*Res(C_E).",
    )
    parser.add_argument(
        "--concept-step",
        type=float,
        default=0.05,
        help="Increment per step for concept resolution trajectory.",
    )
    parser.add_argument("--max-resolution", type=float, default=1.0, help="Upper bound for resolution.")
    parser.add_argument("--steps", type=int, default=10, help="Number of simulation steps.")
    parser.add_argument(
        "--transition-state-id",
        help="Optional state_id to use for deterministic subliminal->conscious intervention.",
    )
    parser.add_argument(
        "--separability-threshold",
        type=float,
        default=0.1,
        help="Pass threshold for absolute Pearson correlation |r|.",
    )
    parser.add_argument(
        "--plot-granularity",
        action="store_true",
        help="Render a PNG for granularity trajectory (requires matplotlib).",
    )
    parser.add_argument(
        "--plot-out",
        default="Higher-Order/granularity_trajectory.png",
        help="Output path for granularity plot.",
    )
    parser.add_argument("--out", help="Optional output file for JSON report.")
    return parser


def main() -> None:
    args = build_parser().parse_args()

    spec = load_json(args.spec)
    graph_report = validate_graph(spec)

    states: List[dict] | None = None
    fieldnames: List[str] = []
    if args.state_dataset:
        states, fieldnames = load_states(args.state_dataset)

    run_tp = args.validate_tp
    run_sep = args.validate_separability
    run_assertoric = args.validate_assertoric
    run_two_state = args.validate_two_state

    tp_report = None
    separability_report = None
    assertoric_report = None
    two_state_report = None
    transition_report = None

    if states:
        if run_tp:
            tp_report = validate_transitivity(states)
        if run_sep:
            separability_report = validate_separability(states, args.separability_threshold)
        if run_assertoric:
            assertoric_report = validate_assertoric_constraint(states)
        if run_two_state:
            two_state_report = validate_two_state_requirement(
                states, has_hot_state_id=("hot_state_id" in set(fieldnames))
            )

        # Always include one deterministic intervention simulation when dataset is available.
        transition_report = simulate_state_transition(states, args.transition_state_id)
    elif run_tp or run_sep or run_assertoric or run_two_state:
        raise AuditInputError(
            "Constraint validation flags require --state-dataset."
        )

    granularity_report = None
    granularity_plot = None
    if args.simulate_granularity:
        granularity_report = simulate_granularity(
            initial_concept_res=args.initial_concept_res,
            steps=args.steps,
            alpha=args.granularity_alpha,
            max_resolution=args.max_resolution,
            concept_step=args.concept_step,
        )
        if args.plot_granularity:
            granularity_plot = maybe_plot_granularity(granularity_report, args.plot_out)

    misrep_report = detect_misrepresentation(spec, states)
    recommendations = build_recommendations(
        graph_report=graph_report,
        tp_report=tp_report,
        separability_report=separability_report,
        assertoric_report=assertoric_report,
        two_state_report=two_state_report,
        misrep_report=misrep_report,
    )

    report = {
        "spec_id": spec.get("graph_id"),
        "graph_validation": graph_report,
        "transitivity": tp_report,
        "separability": separability_report,
        "assertoric_constraint": assertoric_report,
        "two_state_requirement": two_state_report,
        "state_transition_simulation": transition_report,
        "granularity_trajectory": granularity_report,
        "granularity_plot": granularity_plot,
        "misrepresentation_analysis": misrep_report,
        "recommendations": recommendations,
    }

    text = render_text_report(report)
    print(text)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    main()
