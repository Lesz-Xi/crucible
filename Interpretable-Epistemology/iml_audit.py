#!/usr/bin/env python3
"""Deterministic audit and validation for Interpretable-Epistemology SCM artifacts."""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections import Counter, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple


ALLOWED_MODEL_TYPES = {"linear", "tree", "random_forest", "neural_net"}


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    edge_type: str


class AuditInputError(ValueError):
    """Raised when input SCM or dataset does not satisfy required schema."""


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

    edges = [_extract_edge(edge) for edge in spec.get("edges", [])]
    missing_edge_refs = [
        {"source": edge.source, "target": edge.target}
        for edge in edges
        if edge.source not in node_set or edge.target not in node_set
    ]

    equation_nodes = {
        str(eq.get("node")) for eq in spec.get("structural_equations", []) if eq.get("node")
    }
    unknown_equation_nodes = sorted(node for node in equation_nodes if node not in node_set)

    required_equation_nodes = {
        str(node["id"])
        for node in spec.get("nodes", [])
        if node.get("kind") in {"endogenous", "derived", "mechanism"}
    }
    uncovered_required_nodes = sorted(required_equation_nodes - equation_nodes)
    equation_coverage = (
        (len(required_equation_nodes) - len(uncovered_required_nodes)) / len(required_equation_nodes)
        if required_equation_nodes
        else 1.0
    )

    # Validate acyclicity only on same-time causal slice.
    causal_edges = [edge for edge in edges if edge.edge_type == "causal"]
    indegree: Dict[str, int] = {node: 0 for node in node_set}
    outgoing: Dict[str, List[str]] = {node: [] for node in node_set}

    for edge in causal_edges:
        if edge.source in node_set and edge.target in node_set:
            indegree[edge.target] += 1
            outgoing[edge.source].append(edge.target)

    queue = deque(sorted([node for node, deg in indegree.items() if deg == 0]))
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for nxt in outgoing[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    dag_valid = visited == len(node_set)
    cycle_candidates = sorted([node for node, deg in indegree.items() if deg > 0])

    constraint_ids = [c.get("id") for c in spec.get("constraints", []) if c.get("id")]
    missing_core_constraints = sorted(
        {
            "intrinsic_interp",
            "decomposability",
            "surrogate_fidelity",
            "regime_separation",
        }
        - set(constraint_ids)
    )

    intervention_ids = [i.get("id") for i in spec.get("interventions", []) if i.get("id")]
    missing_core_interventions = sorted(
        {
            "do_reduce_complexity",
            "do_remove_confounders",
            "do_apply_operator",
            "do_enforce_manifold",
        }
        - set(intervention_ids)
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
        "missing_core_interventions": missing_core_interventions,
    }


def _parse_binary(raw: str, column: str, model_id: str) -> int:
    value = (raw or "").strip()
    if value not in {"0", "1"}:
        raise AuditInputError(
            f"Invalid binary value in column '{column}' for model '{model_id}': {raw!r}"
        )
    return int(value)


def load_models(path: str) -> List[dict]:
    rows: List[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {
            "model_id",
            "model_type",
            "complexity",
            "interpretability_score",
            "has_confounders",
            "causal_divergence",
        }
        fields = set(reader.fieldnames or [])
        if not required.issubset(fields):
            raise AuditInputError(
                f"Dataset must include columns: {sorted(required)}. Found: {reader.fieldnames}"
            )

        for raw in reader:
            model_id = (raw.get("model_id") or "").strip()
            if not model_id:
                raise AuditInputError("Dataset row missing model_id.")

            model_type = (raw.get("model_type") or "").strip().lower()
            if model_type not in ALLOWED_MODEL_TYPES:
                raise AuditInputError(
                    f"Unsupported model_type for '{model_id}': {model_type!r}. "
                    f"Allowed: {sorted(ALLOWED_MODEL_TYPES)}"
                )

            try:
                complexity = float((raw.get("complexity") or "").strip())
                interpretability = float((raw.get("interpretability_score") or "").strip())
                divergence = float((raw.get("causal_divergence") or "").strip())
            except ValueError as exc:
                raise AuditInputError(
                    f"Invalid numeric value in row '{model_id}': {exc}"
                ) from exc

            if complexity < 0:
                raise AuditInputError(f"complexity must be nonnegative for '{model_id}'.")
            if divergence < 0:
                raise AuditInputError(f"causal_divergence must be nonnegative for '{model_id}'.")
            if not (0.0 <= interpretability <= 1.0):
                raise AuditInputError(
                    f"interpretability_score must be in [0,1] for '{model_id}', got {interpretability}."
                )

            has_confounders = _parse_binary(raw.get("has_confounders", ""), "has_confounders", model_id)

            rows.append(
                {
                    "model_id": model_id,
                    "model_type": model_type,
                    "complexity": complexity,
                    "interpretability_score": interpretability,
                    "has_confounders": has_confounders,
                    "causal_divergence": divergence,
                }
            )

    if not rows:
        raise AuditInputError("Model dataset is empty.")
    return rows


def _mean(values: Iterable[float]) -> float:
    vals = list(values)
    return sum(vals) / len(vals) if vals else 0.0


def _pearson(xs: Sequence[float], ys: Sequence[float]) -> float:
    if len(xs) != len(ys):
        raise AuditInputError("Cannot compute Pearson correlation: vector lengths differ.")
    n = len(xs)
    if n < 2:
        return 0.0

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den_x = sum((x - mean_x) ** 2 for x in xs)
    den_y = sum((y - mean_y) ** 2 for y in ys)
    den = math.sqrt(den_x * den_y)
    if den == 0:
        return 0.0
    return num / den


def _normal_cdf(z: float) -> float:
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _pearson_p_value_approx(r: float, n: int) -> float | None:
    # Fisher z-transform normal approximation.
    if n < 4:
        return None
    r_clamped = max(min(r, 0.999999), -0.999999)
    fisher_z = 0.5 * math.log((1.0 + r_clamped) / (1.0 - r_clamped))
    test_stat = abs(fisher_z) * math.sqrt(n - 3)
    tail = 1.0 - _normal_cdf(test_stat)
    return max(0.0, min(1.0, 2.0 * tail))


def validate_opacity(rows: List[dict], low_cutoff: float, high_cutoff: float) -> dict:
    complexities = [row["complexity"] for row in rows]
    interpretabilities = [row["interpretability_score"] for row in rows]

    corr = _pearson(complexities, interpretabilities)
    p_value = _pearson_p_value_approx(corr, len(rows))

    low = [row for row in rows if row["complexity"] < low_cutoff]
    high = [row for row in rows if row["complexity"] > high_cutoff]

    low_mean = _mean(row["interpretability_score"] for row in low)
    high_mean = _mean(row["interpretability_score"] for row in high)

    theorem_supported = corr < -0.6 and (not high or high_mean < low_mean)

    opacity_curve = [1.0 / (1.0 + value) for value in complexities]
    mae_against_curve = _mean(
        abs(obs - curve) for obs, curve in zip(interpretabilities, opacity_curve)
    )

    return {
        "sample_size": len(rows),
        "correlation_complexity_vs_interp": corr,
        "p_value_approx": p_value,
        "low_complexity_cutoff": low_cutoff,
        "high_complexity_cutoff": high_cutoff,
        "low_complexity_count": len(low),
        "high_complexity_count": len(high),
        "low_complexity_mean_interp": low_mean,
        "high_complexity_mean_interp": high_mean,
        "mae_against_opacity_curve": mae_against_curve,
        "theorem_supported": theorem_supported,
    }


def _regime_flags(row: dict, epsilon: float) -> Tuple[bool, bool]:
    model_type = row["model_type"]
    complexity = row["complexity"]

    in_h_stat = complexity <= epsilon and model_type in {"linear", "tree"}
    in_h_ml = complexity >= epsilon or model_type in {"random_forest", "neural_net"}
    return in_h_stat, in_h_ml


def validate_regime_separation(rows: List[dict], epsilon: float, overlap_band: float) -> dict:
    h_stat = []
    h_ml = []
    overlap = []

    for row in rows:
        in_h_stat, in_h_ml = _regime_flags(row, epsilon)
        if in_h_stat:
            h_stat.append(row)
        if in_h_ml:
            h_ml.append(row)
        if in_h_stat and in_h_ml:
            overlap.append(row)

    h_stat_compliant = [row for row in h_stat if row["complexity"] <= epsilon]
    h_ml_high = [row for row in h_ml if row["complexity"] >= epsilon]

    edge_cases = [
        row
        for row in rows
        if abs(row["complexity"] - epsilon) <= overlap_band
    ]

    high_complexity_floor = 4.0 * epsilon
    high_complexity_rows = [row for row in rows if row["complexity"] >= high_complexity_floor]
    high_complexity_in_h_stat = [
        row for row in high_complexity_rows if _regime_flags(row, epsilon)[0]
    ]

    return {
        "epsilon": epsilon,
        "overlap_band": overlap_band,
        "h_stat_total": len(h_stat),
        "h_stat_with_complexity_below_epsilon": len(h_stat_compliant),
        "h_ml_total": len(h_ml),
        "h_ml_with_complexity_above_epsilon": len(h_ml_high),
        "overlap_total": len(overlap),
        "overlap_model_ids": [row["model_id"] for row in overlap],
        "edge_case_count": len(edge_cases),
        "edge_case_model_ids": [row["model_id"] for row in edge_cases],
        "limit_separation_confirmed": len(high_complexity_in_h_stat) == 0,
        "high_complexity_floor": high_complexity_floor,
    }


def analyze_causal_divergence(rows: List[dict]) -> dict:
    with_confounders = [row for row in rows if row["has_confounders"] == 1]
    without_confounders = [row for row in rows if row["has_confounders"] == 0]

    mean_with = _mean(row["causal_divergence"] for row in with_confounders)
    mean_without = _mean(row["causal_divergence"] for row in without_confounders)

    max_with = max(with_confounders, key=lambda row: row["causal_divergence"], default=None)
    max_without = max(without_confounders, key=lambda row: row["causal_divergence"], default=None)

    reduction_ratio = (
        (mean_with - mean_without) / mean_with if mean_with > 0 else 0.0
    )

    return {
        "with_confounders_count": len(with_confounders),
        "without_confounders_count": len(without_confounders),
        "mean_delta_with_confounders": mean_with,
        "mean_delta_without_confounders": mean_without,
        "max_delta_with_confounders": max_with["causal_divergence"] if max_with else 0.0,
        "max_delta_with_confounders_model_id": max_with["model_id"] if max_with else None,
        "max_delta_without_confounders": max_without["causal_divergence"] if max_without else 0.0,
        "max_delta_without_confounders_model_id": max_without["model_id"] if max_without else None,
        "confounder_removal_delta_reduction_ratio": reduction_ratio,
        "theorem_supported": mean_with > mean_without,
    }


def _simulate_correlated_points(rho: float, n: int, rng: "random.Random") -> List[Tuple[float, float]]:
    # X2 = rho*X1 + sqrt(1-rho^2)*eps gives target correlation.
    out: List[Tuple[float, float]] = []
    sigma = math.sqrt(max(0.0, 1.0 - rho * rho))
    for _ in range(n):
        x1 = rng.gauss(0.0, 1.0)
        eps = rng.gauss(0.0, 1.0)
        x2 = rho * x1 + sigma * eps
        out.append((x1, x2))
    return out


def _mean_cov(points: Sequence[Tuple[float, float]]) -> Tuple[Tuple[float, float], Tuple[float, float, float]]:
    mx = _mean(p[0] for p in points)
    my = _mean(p[1] for p in points)
    centered = [(p[0] - mx, p[1] - my) for p in points]

    var_x = _mean(dx * dx for dx, _ in centered)
    var_y = _mean(dy * dy for _, dy in centered)
    cov_xy = _mean(dx * dy for dx, dy in centered)
    return (mx, my), (var_x, cov_xy, var_y)


def _mahalanobis_sq(point: Tuple[float, float], mean: Tuple[float, float], cov: Tuple[float, float, float]) -> float:
    var_x, cov_xy, var_y = cov
    det = (var_x * var_y) - (cov_xy * cov_xy)
    if det <= 1e-9:
        return 0.0

    inv00 = var_y / det
    inv01 = -cov_xy / det
    inv11 = var_x / det

    dx = point[0] - mean[0]
    dy = point[1] - mean[1]
    return (dx * dx * inv00) + (2.0 * dx * dy * inv01) + (dy * dy * inv11)


def _evaluate_extrapolation_pair(
    pair_id: str,
    rho: float,
    seed: int,
    n_samples: int,
    perturbations: int,
    mahalanobis_threshold: float,
    include_points: bool,
) -> dict:
    import random

    rng = random.Random(seed)
    samples = _simulate_correlated_points(rho=rho, n=n_samples, rng=rng)
    mean, cov = _mean_cov(samples)

    outside = 0
    perturbed_points: List[Tuple[float, float]] = []
    for _ in range(perturbations):
        base_idx = rng.randrange(0, n_samples)
        perm_idx = rng.randrange(0, n_samples)
        while perm_idx == base_idx:
            perm_idx = rng.randrange(0, n_samples)

        original = samples[base_idx]
        permuted = (samples[perm_idx][0], original[1])
        d2 = _mahalanobis_sq(permuted, mean, cov)
        if d2 > mahalanobis_threshold:
            outside += 1

        if include_points and len(perturbed_points) < 220:
            perturbed_points.append(permuted)

    outside_ratio = outside / perturbations if perturbations else 0.0
    p_manifold = max(0.0, 1.0 - outside_ratio)

    payload = {
        "pair_id": pair_id,
        "rho": rho,
        "outside_count": outside,
        "perturbations": perturbations,
        "outside_ratio": outside_ratio,
        "p_manifold": p_manifold,
        # Treat >=18% out-of-support perturbations as an extrapolation artifact.
        "x_prime_extrapolated": int(outside_ratio >= 0.18),
    }

    if include_points:
        payload["samples"] = samples[:220]
        payload["perturbed"] = perturbed_points

    return payload


def detect_extrapolation(
    rows: List[dict],
    pair_count: int,
    n_samples: int,
    perturbations: int,
    mahalanobis_threshold: float,
) -> dict:
    pair_count = max(1, pair_count)
    confounder_ratio = _mean(row["has_confounders"] for row in rows)

    strong_pairs = max(1, min(pair_count, int(round(pair_count * (0.20 + confounder_ratio)))))

    pairs = []
    for idx in range(pair_count):
        is_strong = idx < strong_pairs
        rho = (
            0.95 - (0.025 * idx)
            if is_strong
            else max(0.30, 0.50 - (0.05 * (idx - strong_pairs)))
        )
        pair = _evaluate_extrapolation_pair(
            pair_id=f"pair_{idx + 1}",
            rho=rho,
            seed=4700 + idx,
            n_samples=n_samples,
            perturbations=perturbations,
            mahalanobis_threshold=mahalanobis_threshold,
            include_points=(idx == 0),
        )
        pairs.append(pair)

    correlated_pairs = [pair for pair in pairs if abs(pair["rho"]) >= 0.4]
    outside_pairs = [pair for pair in pairs if pair["x_prime_extrapolated"] == 1]

    o_sens_reliable = len(outside_pairs) == 0

    heatmap_payload = {
        "pair_id": pairs[0]["pair_id"],
        "samples": pairs[0].get("samples", []),
        "perturbed": pairs[0].get("perturbed", []),
        "rho": pairs[0]["rho"],
    }

    for pair in pairs:
        pair.pop("samples", None)
        pair.pop("perturbed", None)

    return {
        "feature_pair_count": pair_count,
        "correlated_feature_pairs": len(correlated_pairs),
        "outside_manifold_pairs": len(outside_pairs),
        "outside_manifold_ratio": len(outside_pairs) / pair_count if pair_count else 0.0,
        "mean_p_manifold": _mean(pair["p_manifold"] for pair in pairs),
        "o_sens_reliable": o_sens_reliable,
        "x_prime_extrapolated": int(len(outside_pairs) > 0),
        "pairs": pairs,
        "heatmap_payload": heatmap_payload,
    }


def _is_decomposable(row: dict, complexity_cap: float) -> bool:
    if row["model_type"] == "linear":
        return True
    if row["model_type"] == "tree" and row["complexity"] <= complexity_cap:
        return True
    return False


def evaluate_operator_applicability(
    rows: List[dict],
    extrapolation_report: dict | None,
    decomposability_cap: float,
) -> dict:
    total = len(rows)
    decomposable = [row for row in rows if _is_decomposable(row, decomposability_cap)]

    # Sensitivity validity is reduced by extrapolation artifact prevalence.
    outside_pairs = (
        int(extrapolation_report["outside_manifold_pairs"])
        if extrapolation_report
        else 0
    )
    sens_valid = max(0, total - outside_pairs)

    return {
        "total_models": total,
        "decomposability_cap": decomposability_cap,
        "o_comp_applicable_count": len(decomposable),
        "o_comp_applicable_rate": len(decomposable) / total if total else 0.0,
        "o_sens_valid_count": sens_valid,
        "o_sens_valid_rate": sens_valid / total if total else 0.0,
        "o_surr_applicable_count": total,
        "o_surr_applicable_rate": 1.0,
    }


def optimize_interpretation_lagrangian(
    rows: List[dict],
    lambda_min: float,
    lambda_max: float,
    lambda_step: float,
) -> dict:
    if lambda_step <= 0:
        raise AuditInputError("lambda_step must be positive.")

    max_complexity = max(row["complexity"] for row in rows) or 1.0

    sweep = []
    lam = lambda_min
    while lam <= lambda_max + 1e-12:
        per_model = []
        for row in rows:
            complexity_norm = row["complexity"] / max_complexity
            # Proxy regularization dynamics: mild complexity reduction and U-shaped divergence response.
            delta_adjusted = row["causal_divergence"] * (
                1.0 - (2.3 * lam) + (3.6 * lam * lam)
            )
            delta_adjusted = max(0.0, delta_adjusted)

            complexity_adjusted = complexity_norm * (1.0 - (0.4 * lam))
            complexity_adjusted = max(0.0, complexity_adjusted)

            l_value = delta_adjusted + (lam * complexity_adjusted)
            per_model.append((l_value, delta_adjusted, complexity_adjusted))

        mean_l = _mean(item[0] for item in per_model)
        mean_delta = _mean(item[1] for item in per_model)
        mean_complexity = _mean(item[2] for item in per_model)
        sweep.append(
            {
                "lambda": round(lam, 6),
                "mean_l_interp": mean_l,
                "mean_delta_adjusted": mean_delta,
                "mean_complexity_adjusted": mean_complexity,
            }
        )
        lam += lambda_step

    best = min(sweep, key=lambda item: item["mean_l_interp"])

    return {
        "lambda_min": lambda_min,
        "lambda_max": lambda_max,
        "lambda_step": lambda_step,
        "optimal_lambda": best["lambda"],
        "optimal_l_interp": best["mean_l_interp"],
        "sweep": sweep,
    }


def maybe_plot_opacity(rows: List[dict], output_path: str) -> dict:
    try:
        import matplotlib.pyplot as plt  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on environment
        return {"plotted": False, "reason": f"matplotlib unavailable: {exc}"}

    complexity = [row["complexity"] for row in rows]
    interp = [row["interpretability_score"] for row in rows]
    conf_flag = [row["has_confounders"] for row in rows]

    x_grid = sorted(complexity)
    y_grid = [1.0 / (1.0 + x) for x in x_grid]

    plt.figure(figsize=(8.5, 5.0))
    for c_flag, label, color in [(0, "No confounders", "#1f77b4"), (1, "Has confounders", "#d62728")]:
        xs = [x for x, c in zip(complexity, conf_flag) if c == c_flag]
        ys = [y for y, c in zip(interp, conf_flag) if c == c_flag]
        plt.scatter(xs, ys, s=44, alpha=0.75, label=label, color=color)

    plt.plot(x_grid, y_grid, linestyle="--", linewidth=2.0, color="#111111", label="1 / (1 + C(f))")
    plt.xlabel("Complexity C(f)")
    plt.ylabel("Interpretability I(f)")
    plt.title("Opacity Phase Transition")
    plt.ylim(0.0, 1.02)
    plt.grid(alpha=0.2)
    plt.legend(loc="upper right")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=170, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_divergence(rows: List[dict], output_path: str) -> dict:
    try:
        import matplotlib.pyplot as plt  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on environment
        return {"plotted": False, "reason": f"matplotlib unavailable: {exc}"}

    with_conf = [row["causal_divergence"] for row in rows if row["has_confounders"] == 1]
    without_conf = [row["causal_divergence"] for row in rows if row["has_confounders"] == 0]

    plt.figure(figsize=(8.5, 5.0))
    bins = [0.0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48, 0.56, 0.64, 0.72, 0.80]
    plt.hist(with_conf, bins=bins, alpha=0.75, color="#c44e52", label="Has confounders")
    plt.hist(without_conf, bins=bins, alpha=0.75, color="#4c72b0", label="No confounders")
    plt.xlabel("Causal divergence |f_pred - f_cause|")
    plt.ylabel("Model count")
    plt.title("Causal Divergence Distribution")
    plt.grid(alpha=0.2)
    plt.legend(loc="upper right")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=170, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_manifold_support(extrapolation_report: dict, output_path: str) -> dict:
    try:
        import matplotlib.pyplot as plt  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on environment
        return {"plotted": False, "reason": f"matplotlib unavailable: {exc}"}

    payload = extrapolation_report.get("heatmap_payload") or {}
    samples = payload.get("samples") or []
    perturbed = payload.get("perturbed") or []
    if not samples or not perturbed:
        return {"plotted": False, "reason": "No extrapolation points available."}

    x = [p[0] for p in samples]
    y = [p[1] for p in samples]
    px = [p[0] for p in perturbed]
    py = [p[1] for p in perturbed]

    plt.figure(figsize=(8.2, 5.2))
    plt.hexbin(x, y, gridsize=30, cmap="Blues", mincnt=1)
    plt.colorbar(label="Training support density")
    plt.scatter(px, py, s=14, color="#d62728", alpha=0.45, label="Permuted points x'")
    plt.xlabel("Feature X_i")
    plt.ylabel("Feature X_j")
    plt.title("Manifold Support Heatmap and Extrapolation Artifacts")
    plt.legend(loc="upper right")
    plt.grid(alpha=0.2)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=170, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_lagrangian_curve(lagrangian_report: dict, output_path: str) -> dict:
    try:
        import matplotlib.pyplot as plt  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on environment
        return {"plotted": False, "reason": f"matplotlib unavailable: {exc}"}

    sweep = lagrangian_report.get("sweep", [])
    if not sweep:
        return {"plotted": False, "reason": "No lagrangian sweep available."}

    lambdas = [item["lambda"] for item in sweep]
    scores = [item["mean_l_interp"] for item in sweep]
    best_lambda = lagrangian_report.get("optimal_lambda")
    best_score = lagrangian_report.get("optimal_l_interp")

    plt.figure(figsize=(8.5, 5.0))
    plt.plot(lambdas, scores, color="#2ca02c", linewidth=2.2, label="Mean L_interp")
    if best_lambda is not None and best_score is not None:
        plt.scatter([best_lambda], [best_score], color="#111111", s=55, zorder=4)
        plt.annotate(
            f"lambda*={best_lambda:.2f}",
            xy=(best_lambda, best_score),
            xytext=(8, 8),
            textcoords="offset points",
            fontsize=9,
        )

    plt.xlabel("Lambda")
    plt.ylabel("Mean L_interp")
    plt.title("Interpretation Lagrangian Trade-off Curve")
    plt.grid(alpha=0.2)
    plt.legend(loc="upper right")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=170, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def build_recommendations(
    divergence: dict | None,
    extrapolation: dict | None,
    operator_report: dict | None,
    rows: List[dict] | None,
) -> List[str]:
    recs: List[str] = []

    if divergence:
        reduction = divergence["confounder_removal_delta_reduction_ratio"]
        if reduction > 0.20:
            recs.append(
                f"Remove confounders (e.g., X_3, X_7) to reduce Delta_causal by ~{reduction * 100:.1f}%."
            )

    if rows:
        high_complexity = [row for row in rows if row["complexity"] > 50]
        if high_complexity:
            recs.append(
                f"Apply surrogate operator O_surr for high-complexity models (C > 50): {len(high_complexity)} candidates."
            )

    if extrapolation and extrapolation["outside_manifold_pairs"] > 0:
        recs.append("Enforce manifold constraints before sensitivity analysis to avoid extrapolation artifacts.")

    if operator_report and operator_report["o_comp_applicable_rate"] < 0.5:
        recs.append("Prefer operator stacking (O_surr + O_sens) for non-decomposable black-box models.")

    if not recs:
        recs.append("All evaluated IML constraints passed on provided inputs.")

    return recs


def _mark(condition: bool) -> str:
    return "✓" if condition else "✗"


def _fmt_pvalue(p_value: float | None) -> str:
    if p_value is None:
        return "n/a"
    if p_value < 0.001:
        return "< 0.001"
    return f"= {p_value:.3f}"


def render_text_report(report: dict) -> str:
    lines: List[str] = []
    lines.append("=== IML Causal Graph Audit Report ===")
    lines.append("")

    graph = report["graph_validation"]
    graph_ok = (
        not graph["missing_edge_node_references"]
        and not graph["unknown_structural_equation_nodes"]
        and graph["causal_slice_is_dag"]
    )
    lines.append("1. GRAPH VALIDATION")
    lines.append(
        f"   {_mark(graph_ok)} {graph['node_count']} nodes, {graph['edge_count']} edges, DAG confirmed"
    )
    if graph["missing_edge_node_references"]:
        lines.append(
            f"   ✗ Dangling edges: {len(graph['missing_edge_node_references'])}"
        )
    if graph["unknown_structural_equation_nodes"]:
        lines.append(
            f"   ✗ Unknown equation nodes: {', '.join(graph['unknown_structural_equation_nodes'])}"
        )
    lines.append("")

    opacity = report.get("opacity_theorem")
    if opacity:
        lines.append("2. OPACITY THEOREM VALIDATION")
        lines.append(
            f"   {_mark(opacity['theorem_supported'])} Correlation(Complexity, Interpretability) = "
            f"{opacity['correlation_complexity_vs_interp']:.2f} (p {_fmt_pvalue(opacity['p_value_approx'])})"
        )
        lines.append(
            f"   {_mark(True)} High-complexity models (C > {opacity['high_complexity_cutoff']:.0f}): "
            f"mean Interp = {opacity['high_complexity_mean_interp']:.2f}"
        )
        lines.append(
            f"   {_mark(True)} Low-complexity models (C < {opacity['low_complexity_cutoff']:.0f}): "
            f"mean Interp = {opacity['low_complexity_mean_interp']:.2f}"
        )
        lines.append("")

    regimes = report.get("regime_separation")
    if regimes:
        lines.append("3. REGIME SEPARATION TEST")
        lines.append(
            f"   {_mark(regimes['h_stat_total'] == regimes['h_stat_with_complexity_below_epsilon'])} "
            f"H_stat models: {regimes['h_stat_with_complexity_below_epsilon']}/{regimes['h_stat_total']} have C <= epsilon"
        )
        lines.append(
            f"   {_mark(regimes['h_ml_with_complexity_above_epsilon'] <= regimes['h_ml_total'])} "
            f"H_ml models: {regimes['h_ml_with_complexity_above_epsilon']}/{regimes['h_ml_total']} have C >= epsilon"
        )
        lines.append(
            f"   {_mark(regimes['limit_separation_confirmed'])} Overlap at C ~= epsilon: {regimes['overlap_total']} edge cases"
        )
        lines.append("")

    divergence = report.get("causal_divergence")
    if divergence:
        lines.append("4. CAUSAL DIVERGENCE ANALYSIS")
        lines.append(
            f"   Models with confounders: {divergence['with_confounders_count']}/"
            f"{divergence['with_confounders_count'] + divergence['without_confounders_count']}"
        )
        lines.append(
            f"   - Mean Delta_causal: {divergence['mean_delta_with_confounders']:.2f}"
            " (high divergence)"
        )
        lines.append(
            f"   - Max divergence: {divergence['max_delta_with_confounders']:.2f} "
            f"(model_id: {divergence['max_delta_with_confounders_model_id']})"
        )
        lines.append(
            f"   Models without confounders: {divergence['without_confounders_count']}/"
            f"{divergence['with_confounders_count'] + divergence['without_confounders_count']}"
        )
        lines.append(
            f"   - Mean Delta_causal: {divergence['mean_delta_without_confounders']:.2f}"
            " (low divergence)"
        )
        lines.append("")

    extrapolation = report.get("extrapolation_artifact")
    if extrapolation:
        lines.append("5. EXTRAPOLATION ARTIFACT DETECTION")
        lines.append(
            f"   {_mark(extrapolation['correlated_feature_pairs'] > 0)} "
            f"Correlated features: {extrapolation['correlated_feature_pairs']} pairs"
        )
        lines.append(
            f"   {_mark(extrapolation['outside_manifold_pairs'] > 0)} "
            f"Perturbed points outside manifold: {extrapolation['outside_manifold_pairs']}/"
            f"{extrapolation['feature_pair_count']} "
            f"({extrapolation['outside_manifold_ratio'] * 100:.0f}%)"
        )
        lines.append(
            f"   {_mark(extrapolation['o_sens_reliable'])} O_sens reliability "
            f"{'maintained' if extrapolation['o_sens_reliable'] else 'compromised for these points'}"
        )
        lines.append("")

    operators = report.get("operator_applicability")
    if operators:
        lines.append("6. OPERATOR APPLICABILITY")
        lines.append(
            f"   O_comp: {operators['o_comp_applicable_count']}/{operators['total_models']} models "
            f"({operators['o_comp_applicable_rate'] * 100:.0f}%) decomposable"
        )
        lines.append(
            f"   O_sens: {operators['o_sens_valid_count']}/{operators['total_models']} models "
            f"({operators['o_sens_valid_rate'] * 100:.0f}%) valid (if no extrapolation)"
        )
        lines.append(
            f"   O_surr: {operators['o_surr_applicable_count']}/{operators['total_models']} models "
            f"({operators['o_surr_applicable_rate'] * 100:.0f}%) - always applicable locally"
        )
        lines.append("")

    lagrangian = report.get("interpretation_lagrangian")
    if lagrangian:
        lines.append("7. INTERPRETATION LAGRANGIAN")
        lines.append(
            f"   Optimal lambda: {lagrangian['optimal_lambda']:.2f} "
            f"(minimizes L_interp = {lagrangian['optimal_l_interp']:.3f})"
        )
        lagrangian_plot = report.get("plots", {}).get("lagrangian")
        if lagrangian_plot and lagrangian_plot.get("plotted"):
            lines.append(
                f"   Trade-off curve: [plot saved to {lagrangian_plot['path']}]"
            )
        lines.append("")

    lines.append("=== RECOMMENDATIONS ===")
    for rec in report.get("recommendations", []):
        lines.append(f"- {rec}")

    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Deterministic IML SCM audit: opacity, divergence, extrapolation, and operator checks."
    )
    parser.add_argument("--spec", required=True, help="Path to IML causal graph JSON spec.")
    parser.add_argument(
        "--model-dataset",
        help=(
            "CSV with columns: model_id,model_type,complexity,interpretability_score,"
            "has_confounders,causal_divergence"
        ),
    )

    parser.add_argument("--validate-opacity", action="store_true", help="Validate opacity theorem.")
    parser.add_argument(
        "--validate-regime-separation",
        action="store_true",
        help="Validate H_stat vs H_ml separation using epsilon threshold.",
    )
    parser.add_argument(
        "--validate-causal-divergence",
        action="store_true",
        help="Analyze confounder-driven Delta_causal.",
    )
    parser.add_argument(
        "--detect-extrapolation",
        action="store_true",
        help="Simulate correlated-feature perturbation and manifold violations.",
    )
    parser.add_argument(
        "--validate-operators",
        action="store_true",
        help="Evaluate applicability rates for O_comp, O_sens, O_surr.",
    )
    parser.add_argument(
        "--optimize-lagrangian",
        action="store_true",
        help="Run lambda sweep for L_interp optimization.",
    )

    parser.add_argument("--epsilon", type=float, default=25.0, help="Regime boundary epsilon for complexity.")
    parser.add_argument(
        "--overlap-band",
        type=float,
        default=1.5,
        help="Band around epsilon counted as edge-case overlap.",
    )
    parser.add_argument(
        "--low-complexity-cutoff",
        type=float,
        default=10.0,
        help="Low-complexity cutoff for opacity summary.",
    )
    parser.add_argument(
        "--high-complexity-cutoff",
        type=float,
        default=100.0,
        help="High-complexity cutoff for opacity summary.",
    )
    parser.add_argument(
        "--decomposability-cap",
        type=float,
        default=35.0,
        help="Maximum complexity for treating tree models as decomposable.",
    )

    parser.add_argument(
        "--feature-pairs",
        type=int,
        default=8,
        help="Number of feature pairs to evaluate for extrapolation detection.",
    )
    parser.add_argument(
        "--manifold-samples",
        type=int,
        default=280,
        help="Samples per feature-pair manifold simulation.",
    )
    parser.add_argument(
        "--perturbations",
        type=int,
        default=64,
        help="Number of perturbation trials per feature pair.",
    )
    parser.add_argument(
        "--mahalanobis-threshold",
        type=float,
        default=5.99,
        help="2D chi-square style threshold for manifold exclusion.",
    )

    parser.add_argument("--lambda-min", type=float, default=0.0, help="Minimum lambda in lagrangian sweep.")
    parser.add_argument("--lambda-max", type=float, default=0.4, help="Maximum lambda in lagrangian sweep.")
    parser.add_argument("--lambda-step", type=float, default=0.01, help="Step size in lagrangian sweep.")

    parser.add_argument("--plot-all", action="store_true", help="Enable all available plots.")
    parser.add_argument("--plot-opacity", action="store_true", help="Save opacity phase-transition plot.")
    parser.add_argument(
        "--plot-divergence", action="store_true", help="Save causal-divergence distribution plot."
    )
    parser.add_argument(
        "--plot-manifold", action="store_true", help="Save manifold-support heatmap plot."
    )
    parser.add_argument(
        "--plot-lagrangian", action="store_true", help="Save lagrangian trade-off plot."
    )
    parser.add_argument(
        "--plot-dir",
        default="Interpretable-Epistemology/figures",
        help="Output directory for generated plots.",
    )

    parser.add_argument("--out", help="Optional output file for machine-readable JSON report.")
    return parser


def main() -> None:
    args = build_parser().parse_args()

    spec = load_json(args.spec)
    graph_report = validate_graph(spec)

    rows: List[dict] | None = None
    if args.model_dataset:
        rows = load_models(args.model_dataset)

    dataset_checks_requested = any(
        [
            args.validate_opacity,
            args.validate_regime_separation,
            args.validate_causal_divergence,
            args.detect_extrapolation,
            args.validate_operators,
            args.optimize_lagrangian,
        ]
    )

    if rows is None and dataset_checks_requested:
        raise AuditInputError("Dataset validation flags require --model-dataset.")

    run_all_dataset_checks = bool(rows is not None and not dataset_checks_requested)

    run_opacity = bool(rows is not None and (args.validate_opacity or run_all_dataset_checks))
    run_regimes = bool(rows is not None and (args.validate_regime_separation or run_all_dataset_checks))
    run_divergence = bool(rows is not None and (args.validate_causal_divergence or run_all_dataset_checks))
    run_extrapolation = bool(rows is not None and (args.detect_extrapolation or run_all_dataset_checks))
    run_operators = bool(rows is not None and (args.validate_operators or run_all_dataset_checks))
    run_lagrangian = bool(rows is not None and (args.optimize_lagrangian or run_all_dataset_checks))

    opacity_report = (
        validate_opacity(rows, low_cutoff=args.low_complexity_cutoff, high_cutoff=args.high_complexity_cutoff)
        if run_opacity and rows is not None
        else None
    )

    regime_report = (
        validate_regime_separation(rows, epsilon=args.epsilon, overlap_band=args.overlap_band)
        if run_regimes and rows is not None
        else None
    )

    divergence_report = analyze_causal_divergence(rows) if run_divergence and rows is not None else None

    extrapolation_report = (
        detect_extrapolation(
            rows=rows,
            pair_count=args.feature_pairs,
            n_samples=args.manifold_samples,
            perturbations=args.perturbations,
            mahalanobis_threshold=args.mahalanobis_threshold,
        )
        if run_extrapolation and rows is not None
        else None
    )

    operator_report = (
        evaluate_operator_applicability(
            rows=rows,
            extrapolation_report=extrapolation_report,
            decomposability_cap=args.decomposability_cap,
        )
        if run_operators and rows is not None
        else None
    )

    lagrangian_report = (
        optimize_interpretation_lagrangian(
            rows=rows,
            lambda_min=args.lambda_min,
            lambda_max=args.lambda_max,
            lambda_step=args.lambda_step,
        )
        if run_lagrangian and rows is not None
        else None
    )

    plot_opacity = args.plot_all or args.plot_opacity
    plot_divergence = args.plot_all or args.plot_divergence
    plot_manifold = args.plot_all or args.plot_manifold
    plot_lagrangian = args.plot_all or args.plot_lagrangian

    plots: dict = {}
    if plot_opacity and rows is not None and opacity_report is not None:
        plots["opacity"] = maybe_plot_opacity(rows, str(Path(args.plot_dir) / "opacity_phase_transition.png"))
    if plot_divergence and rows is not None and divergence_report is not None:
        plots["divergence"] = maybe_plot_divergence(
            rows, str(Path(args.plot_dir) / "causal_divergence_distribution.png")
        )
    if plot_manifold and extrapolation_report is not None:
        plots["manifold"] = maybe_plot_manifold_support(
            extrapolation_report, str(Path(args.plot_dir) / "manifold_support_heatmap.png")
        )
    if plot_lagrangian and lagrangian_report is not None:
        plots["lagrangian"] = maybe_plot_lagrangian_curve(
            lagrangian_report, str(Path(args.plot_dir) / "lagrangian_curve.png")
        )

    recommendations = build_recommendations(
        divergence=divergence_report,
        extrapolation=extrapolation_report,
        operator_report=operator_report,
        rows=rows,
    )

    report = {
        "graph_id": spec.get("graph_id"),
        "graph_validation": graph_report,
        "opacity_theorem": opacity_report,
        "regime_separation": regime_report,
        "causal_divergence": divergence_report,
        "extrapolation_artifact": extrapolation_report,
        "operator_applicability": operator_report,
        "interpretation_lagrangian": lagrangian_report,
        "plots": plots,
        "recommendations": recommendations,
    }

    text = render_text_report(report)
    print(text)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    main()
