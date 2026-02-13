#!/usr/bin/env python3
"""Deterministic alignment audit for causal graph data-representation and bias risk."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Dict, Iterable, List, Tuple


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    edge_type: str


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_graph(spec: dict) -> dict:
    nodes = {n["id"] for n in spec.get("nodes", [])}
    edges = [
        Edge(e["source"], e["target"], e.get("type", "causal"))
        for e in spec.get("edges", [])
    ]

    missing_refs = [
        {"source": e.source, "target": e.target}
        for e in edges
        if e.source not in nodes or e.target not in nodes
    ]

    # Validate acyclic structure for same-time causal slice only.
    causal_edges = [e for e in edges if e.edge_type == "causal"]
    indegree: Dict[str, int] = {n: 0 for n in nodes}
    outgoing: Dict[str, List[str]] = {n: [] for n in nodes}

    for edge in causal_edges:
        indegree[edge.target] += 1
        outgoing[edge.source].append(edge.target)

    queue = deque(sorted([n for n, degree in indegree.items() if degree == 0]))
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for nxt in outgoing[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    dag_valid = visited == len(nodes)

    return {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "missing_node_references": missing_refs,
        "causal_slice_is_dag": dag_valid,
    }


def load_decisions(
    path: str, protected_col: str, label_col: str, prediction_col: str
) -> List[dict]:
    rows: List[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {protected_col, label_col, prediction_col}
        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError(
                f"Dataset must include columns: {sorted(required)}. Found: {reader.fieldnames}"
            )
        for row in reader:
            parsed = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
            parsed[label_col] = int(parsed[label_col])
            parsed[prediction_col] = int(parsed[prediction_col])
            rows.append(parsed)
    return rows


def _rate(num: int, den: int) -> float:
    return float(num) / float(den) if den > 0 else 0.0


def _group_stats(
    rows: Iterable[dict], protected_col: str, label_col: str, prediction_col: str
) -> Dict[str, dict]:
    by_group: Dict[str, list] = defaultdict(list)
    for row in rows:
        by_group[row[protected_col]].append(row)

    stats: Dict[str, dict] = {}
    for group, items in by_group.items():
        tp = sum(1 for r in items if r[label_col] == 1 and r[prediction_col] == 1)
        fp = sum(1 for r in items if r[label_col] == 0 and r[prediction_col] == 1)
        tn = sum(1 for r in items if r[label_col] == 0 and r[prediction_col] == 0)
        fn = sum(1 for r in items if r[label_col] == 1 and r[prediction_col] == 0)

        positives = sum(1 for r in items if r[prediction_col] == 1)
        actual_pos = sum(1 for r in items if r[label_col] == 1)
        actual_neg = sum(1 for r in items if r[label_col] == 0)

        stats[group] = {
            "count": len(items),
            "demographic_parity": _rate(positives, len(items)),
            "true_positive_rate": _rate(tp, actual_pos),
            "false_positive_rate": _rate(fp, actual_neg),
            "confusion": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
        }
    return stats


def _gap(metric_by_group: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    vals = list(metric_by_group.values())
    if not vals:
        return 0.0, {}
    return max(vals) - min(vals), metric_by_group


def fairness_metrics(
    rows: List[dict], protected_col: str, label_col: str, prediction_col: str
) -> dict:
    stats = _group_stats(rows, protected_col, label_col, prediction_col)

    dp_gap, dp_detail = _gap({g: s["demographic_parity"] for g, s in stats.items()})
    eo_gap, eo_detail = _gap({g: s["true_positive_rate"] for g, s in stats.items()})
    fpr_gap, fpr_detail = _gap({g: s["false_positive_rate"] for g, s in stats.items()})

    fairness_gap_index = 0.4 * dp_gap + 0.4 * eo_gap + 0.2 * fpr_gap

    return {
        "groups": stats,
        "protected_attribute": protected_col,
        "label_column": label_col,
        "prediction_column": prediction_col,
        "demographic_parity_gap": dp_gap,
        "equal_opportunity_gap": eo_gap,
        "false_positive_rate_gap": fpr_gap,
        "fairness_gap_index": fairness_gap_index,
        "details": {
            "demographic_parity": dp_detail,
            "true_positive_rate": eo_detail,
            "false_positive_rate": fpr_detail,
        },
    }


def _mean(items: Iterable[dict], value_col: str) -> float:
    arr = list(items)
    if not arr:
        return 0.0
    return sum(float(r[value_col]) for r in arr) / float(len(arr))


def path_specific_decomposition(
    rows: List[dict],
    protected_col: str,
    outcome_col: str,
    mediators: List[str],
    reference_group: str | None = None,
    target_group: str | None = None,
) -> dict:
    if not mediators:
        return {"available": False, "reason": "No mediators provided."}
    if not rows:
        return {"available": False, "reason": "No rows available."}

    missing = [m for m in mediators if m not in rows[0]]
    if missing:
        return {
            "available": False,
            "reason": f"Mediator columns missing from dataset: {missing}",
        }

    groups = sorted({str(r[protected_col]) for r in rows})
    if len(groups) < 2:
        return {
            "available": False,
            "reason": "Need at least two protected groups for decomposition.",
        }

    ref = reference_group or groups[0]
    tgt = target_group or next((g for g in groups if g != ref), groups[0])
    if ref == tgt:
        return {"available": False, "reason": "reference_group and target_group must differ."}
    if ref not in groups or tgt not in groups:
        return {
            "available": False,
            "reason": f"Unknown group(s). Available groups: {groups}",
        }

    by_group: Dict[str, List[dict]] = defaultdict(list)
    for row in rows:
        by_group[str(row[protected_col])].append(row)

    ref_rows = by_group[ref]
    tgt_rows = by_group[tgt]
    mu_ref = _mean(ref_rows, outcome_col)
    mu_tgt = _mean(tgt_rows, outcome_col)
    total_gap = mu_tgt - mu_ref

    def mkey(row: dict) -> Tuple[str, ...]:
        return tuple(str(row[m]) for m in mediators)

    strata = sorted({mkey(r) for r in ref_rows + tgt_rows})
    if not strata:
        return {
            "available": False,
            "reason": "No mediator strata available to decompose.",
        }

    ref_dist: Dict[Tuple[str, ...], float] = {}
    for z in strata:
        count_z = sum(1 for r in ref_rows if mkey(r) == z)
        ref_dist[z] = _rate(count_z, len(ref_rows))

    cond_mu: Dict[Tuple[str, Tuple[str, ...]], float] = {}
    fallback_mu = {ref: mu_ref, tgt: mu_tgt}
    for group, group_rows in [(ref, ref_rows), (tgt, tgt_rows)]:
        for z in strata:
            match = [r for r in group_rows if mkey(r) == z]
            cond_mu[(group, z)] = _mean(match, outcome_col) if match else fallback_mu[group]

    # Block mediated paths by fixing mediator distribution to reference-group distribution.
    direct_gap_blocked = sum(
        (cond_mu[(tgt, z)] - cond_mu[(ref, z)]) * ref_dist[z] for z in strata
    )
    mediated_gap_removed = total_gap - direct_gap_blocked
    removed_ratio = (
        _rate(abs(mediated_gap_removed), abs(total_gap)) if abs(total_gap) > 0 else 0.0
    )
    sign_flip = (total_gap > 0 and direct_gap_blocked < 0) or (
        total_gap < 0 and direct_gap_blocked > 0
    )

    return {
        "available": True,
        "protected_attribute": protected_col,
        "outcome_column": outcome_col,
        "mediators": mediators,
        "reference_group": ref,
        "target_group": tgt,
        "total_gap_target_minus_reference": total_gap,
        "direct_gap_after_blocking_mediated_paths": direct_gap_blocked,
        "mediated_gap_removed": mediated_gap_removed,
        "mediated_gap_removed_ratio": removed_ratio,
        "sign_flip_after_blocking": sign_flip,
    }


def simulate_bias_cycle(
    initial_bias: float,
    feedback_strength: float,
    mitigation_strength: float,
    steps: int,
) -> List[float]:
    series = [max(0.0, min(1.0, initial_bias))]
    for _ in range(steps):
        nxt = feedback_strength * series[-1] - mitigation_strength
        series.append(max(0.0, min(1.0, nxt)))
    return series


def alignment_decision(
    execution_score: float,
    representation_score: float,
    bias_score: float,
    execution_threshold: float,
    representation_threshold: float,
    bias_threshold: float,
) -> dict:
    executes_ok = execution_score >= execution_threshold
    represents_ok = representation_score >= representation_threshold
    unbiased_ok = bias_score <= bias_threshold

    aligned = executes_ok and represents_ok and unbiased_ok
    failures = []
    if not executes_ok:
        failures.append("Execution Failure: EXECUTES(A,O) below threshold")
    if not represents_ok:
        failures.append("Specification Failure: REPRESENTS(O,H) below threshold")
    if not unbiased_ok:
        failures.append("Data Bias Failure: BIASED(D) exceeds threshold")

    interventions = []
    if not represents_ok:
        interventions.append("do_specification_upgrade on O_t")
    if not executes_ok:
        interventions.append("do_policy_constraint on A_t")
    if not unbiased_ok:
        interventions.append("do_data_reweighting on D_t")

    return {
        "aligned": aligned,
        "failures": failures,
        "recommended_interventions": interventions,
        "inputs": {
            "execution_score": execution_score,
            "representation_score": representation_score,
            "bias_score": bias_score,
        },
        "thresholds": {
            "execution_threshold": execution_threshold,
            "representation_threshold": representation_threshold,
            "bias_threshold": bias_threshold,
        },
    }


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Audit alignment causal graph and bias dynamics.")
    p.add_argument("--spec", required=True, help="Path to causal_graph.json")
    p.add_argument("--dataset", help="CSV with columns: group,label,prediction")
    p.add_argument("--protected-col", default="group")
    p.add_argument("--label-col", default="label")
    p.add_argument("--prediction-col", default="prediction")
    p.add_argument(
        "--mediators",
        help="Comma-separated mediator columns for path-specific decomposition (e.g. representation_bucket)",
    )
    p.add_argument("--reference-group", help="Optional reference protected group label")
    p.add_argument("--target-group", help="Optional target protected group label")
    p.add_argument("--execution-score", type=float, default=0.95)
    p.add_argument("--representation-score", type=float, default=0.90)
    p.add_argument("--initial-bias", type=float, default=0.25)
    p.add_argument("--feedback-strength", type=float, default=1.05)
    p.add_argument("--mitigation-strength", type=float, default=0.03)
    p.add_argument("--steps", type=int, default=8)
    p.add_argument("--execution-threshold", type=float, default=0.95)
    p.add_argument("--representation-threshold", type=float, default=0.90)
    p.add_argument("--bias-threshold", type=float, default=0.10)
    p.add_argument("--out", help="Optional output file for JSON report")
    return p


def main() -> None:
    args = build_parser().parse_args()

    spec = load_json(args.spec)
    graph_report = validate_graph(spec)

    fairness_report = None
    path_report = None
    measured_bias = None
    if args.dataset:
        rows = load_decisions(
            args.dataset,
            protected_col=args.protected_col,
            label_col=args.label_col,
            prediction_col=args.prediction_col,
        )
        fairness_report = fairness_metrics(
            rows,
            protected_col=args.protected_col,
            label_col=args.label_col,
            prediction_col=args.prediction_col,
        )
        measured_bias = fairness_report["fairness_gap_index"]

        mediators = [m.strip() for m in (args.mediators or "").split(",") if m.strip()]
        if mediators:
            path_report = path_specific_decomposition(
                rows,
                protected_col=args.protected_col,
                outcome_col=args.prediction_col,
                mediators=mediators,
                reference_group=args.reference_group,
                target_group=args.target_group,
            )

    bias_series = simulate_bias_cycle(
        initial_bias=args.initial_bias,
        feedback_strength=args.feedback_strength,
        mitigation_strength=args.mitigation_strength,
        steps=max(0, args.steps),
    )

    # Prefer measured bias if dataset is available; otherwise use final simulated value.
    bias_for_decision = measured_bias if measured_bias is not None else bias_series[-1]

    decision_report = alignment_decision(
        execution_score=args.execution_score,
        representation_score=args.representation_score,
        bias_score=bias_for_decision,
        execution_threshold=args.execution_threshold,
        representation_threshold=args.representation_threshold,
        bias_threshold=args.bias_threshold,
    )

    report = {
        "formula": spec.get("alignment_formula", {}).get("statement"),
        "graph_validation": graph_report,
        "fairness": fairness_report,
        "path_specific_fairness": path_report,
        "bias_dynamics": {
            "initial_bias": args.initial_bias,
            "feedback_strength": args.feedback_strength,
            "mitigation_strength": args.mitigation_strength,
            "series": bias_series,
        },
        "alignment_decision": decision_report,
    }

    text = json.dumps(report, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
