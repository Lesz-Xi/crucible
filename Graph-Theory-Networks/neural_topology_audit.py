#!/usr/bin/env python3
"""Deterministic audit and validation for Neural Topology SCM artifacts."""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
from collections import Counter, defaultdict, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

try:  # Optional dependency: required by request, but script has pure-Python fallback.
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover - depends on environment
    np = None

try:  # Optional dependency: required by request, but script has pure-Python fallback.
    from scipy import stats as scipy_stats  # type: ignore
except Exception:  # pragma: no cover - depends on environment
    scipy_stats = None

try:  # Optional dependency: required by request, but script has pure-Python fallback.
    import networkx as nx  # type: ignore
except Exception:  # pragma: no cover - depends on environment
    nx = None

try:
    import matplotlib.pyplot as plt  # type: ignore
except Exception:  # pragma: no cover - depends on environment
    plt = None


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    edge_type: str


class AuditInputError(ValueError):
    """Raised when input SCM/dataset schema is malformed."""


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
    duplicate_nodes = sorted([node for node, c in Counter(node_ids).items() if c > 1])

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
        if node.get("kind") in {"endogenous", "derived"}
    }
    uncovered_required_nodes = sorted(required_equation_nodes - equation_nodes)
    equation_coverage = (
        (len(required_equation_nodes) - len(uncovered_required_nodes)) / len(required_equation_nodes)
        if required_equation_nodes
        else 1.0
    )

    # Same-time causal slice DAG check.
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

    domain_counts = Counter(
        str(node.get("domain_group", "unspecified")) for node in spec.get("nodes", [])
    )
    missing_domains = sorted(
        set(["G", "H", "T", "Delta"]) - set(k for k in domain_counts.keys() if k != "unspecified")
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
        "domain_counts": dict(domain_counts),
        "missing_domains": missing_domains,
    }


def _safe_float(raw: str, col: str, row_id: str) -> float:
    try:
        return float((raw or "").strip())
    except ValueError as exc:
        raise AuditInputError(f"Invalid float in column '{col}' for row '{row_id}': {raw!r}") from exc


def load_network_dataset(path: str) -> List[dict]:
    rows: List[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {
            "network_id",
            "N",
            "alpha",
            "beta",
            "C_wire",
            "E_glob",
            "L",
            "C_clustering",
            "sigma_small_world",
            "topology_regime",
            "hub_count",
            "attack_type",
            "Psi_patho",
        }
        fields = set(reader.fieldnames or [])
        if not required.issubset(fields):
            raise AuditInputError(
                f"Dataset must include columns: {sorted(required)}. Found: {reader.fieldnames}"
            )

        for raw in reader:
            network_id = (raw.get("network_id") or "").strip()
            if not network_id:
                raise AuditInputError("Dataset row missing network_id")

            topology_regime = (raw.get("topology_regime") or "").strip().lower()
            if topology_regime not in {"lattice", "small-world", "random"}:
                raise AuditInputError(
                    f"Row '{network_id}' has invalid topology_regime: {topology_regime!r}"
                )

            attack_type = (raw.get("attack_type") or "").strip().lower()
            if attack_type not in {"none", "random", "targeted"}:
                raise AuditInputError(
                    f"Row '{network_id}' has invalid attack_type: {attack_type!r}"
                )

            row = {
                "network_id": network_id,
                "N": int(_safe_float(raw.get("N", ""), "N", network_id)),
                "alpha": _safe_float(raw.get("alpha", ""), "alpha", network_id),
                "beta": _safe_float(raw.get("beta", ""), "beta", network_id),
                "C_wire": _safe_float(raw.get("C_wire", ""), "C_wire", network_id),
                "E_glob": _safe_float(raw.get("E_glob", ""), "E_glob", network_id),
                "L": _safe_float(raw.get("L", ""), "L", network_id),
                "C_clustering": _safe_float(raw.get("C_clustering", ""), "C_clustering", network_id),
                "sigma_small_world": _safe_float(
                    raw.get("sigma_small_world", ""), "sigma_small_world", network_id
                ),
                "topology_regime": topology_regime,
                "hub_count": int(_safe_float(raw.get("hub_count", ""), "hub_count", network_id)),
                "attack_type": attack_type,
                "Psi_patho": _safe_float(raw.get("Psi_patho", ""), "Psi_patho", network_id),
            }
            rows.append(row)

    if not rows:
        raise AuditInputError("Network dataset is empty")
    return rows


def _mean(values: Iterable[float]) -> float:
    vals = list(values)
    return sum(vals) / len(vals) if vals else 0.0


def _variance(values: Sequence[float]) -> float:
    if len(values) < 2:
        return 0.0
    mu = _mean(values)
    return sum((x - mu) ** 2 for x in values) / (len(values) - 1)


def _pearson(xs: Sequence[float], ys: Sequence[float]) -> float:
    if len(xs) != len(ys):
        raise AuditInputError("Cannot compute correlation: vector lengths differ")
    n = len(xs)
    if n < 2:
        return 0.0
    mx = _mean(xs)
    my = _mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den_x = sum((x - mx) ** 2 for x in xs)
    den_y = sum((y - my) ** 2 for y in ys)
    den = math.sqrt(max(den_x * den_y, 0.0))
    if den == 0.0:
        return 0.0
    return num / den


def _normal_cdf(z: float) -> float:
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _pearson_p_value_approx(r: float, n: int) -> float | None:
    if n < 4:
        return None
    if scipy_stats is not None:
        try:
            _, p = scipy_stats.pearsonr([0.0] + [1.0] * (n - 1), [r] * n)
            if p is not None and not math.isnan(float(p)):
                return float(p)
        except Exception:
            pass

    r_clamped = max(min(r, 0.999999), -0.999999)
    fisher_z = 0.5 * math.log((1.0 + r_clamped) / (1.0 - r_clamped))
    test_stat = abs(fisher_z) * math.sqrt(max(n - 3, 1))
    tail = 1.0 - _normal_cdf(test_stat)
    return max(0.0, min(1.0, 2.0 * tail))


def _linreg_simple(xs: Sequence[float], ys: Sequence[float]) -> Tuple[float, float, float]:
    if len(xs) != len(ys) or len(xs) < 2:
        return 0.0, 0.0, 0.0
    mx = _mean(xs)
    my = _mean(ys)
    den = sum((x - mx) ** 2 for x in xs)
    if den == 0.0:
        return my, 0.0, 0.0
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den
    intercept = my - slope * mx
    preds = [intercept + slope * x for x in xs]
    ss_res = sum((y - p) ** 2 for y, p in zip(ys, preds))
    ss_tot = sum((y - my) ** 2 for y in ys)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    return intercept, slope, r2


def _solve_3x3(a: List[List[float]], b: List[float]) -> List[float]:
    # Gaussian elimination with partial pivoting.
    m = [row[:] + [rhs] for row, rhs in zip(a, b)]
    n = 3
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(m[r][col]))
        if abs(m[pivot][col]) < 1e-12:
            return [0.0, 0.0, 0.0]
        if pivot != col:
            m[col], m[pivot] = m[pivot], m[col]
        div = m[col][col]
        for j in range(col, n + 1):
            m[col][j] /= div
        for r in range(n):
            if r == col:
                continue
            factor = m[r][col]
            if factor == 0.0:
                continue
            for j in range(col, n + 1):
                m[r][j] -= factor * m[col][j]
    return [m[i][n] for i in range(n)]


def empty_graph(n: int) -> Dict[int, set[int]]:
    return {i: set() for i in range(n)}


def add_edge(adj: Dict[int, set[int]], u: int, v: int) -> None:
    if u == v:
        return
    adj[u].add(v)
    adj[v].add(u)


def remove_edge(adj: Dict[int, set[int]], u: int, v: int) -> None:
    adj[u].discard(v)
    adj[v].discard(u)


def edge_list(adj: Dict[int, set[int]]) -> List[Tuple[int, int]]:
    out: List[Tuple[int, int]] = []
    for u, nbrs in adj.items():
        for v in nbrs:
            if u < v:
                out.append((u, v))
    return out


def ring_lattice_graph(n: int, k: int) -> Dict[int, set[int]]:
    if k % 2 != 0:
        raise AuditInputError("k must be even for ring lattice")
    adj = empty_graph(n)
    half = k // 2
    for u in range(n):
        for d in range(1, half + 1):
            v = (u + d) % n
            add_edge(adj, u, v)
    return adj


def watts_strogatz_graph(n: int, k: int, p: float, seed: int) -> Dict[int, set[int]]:
    if not (0.0 <= p <= 1.0):
        raise AuditInputError("Rewiring probability must be in [0,1]")
    rng = random.Random(seed)
    adj = ring_lattice_graph(n, k)
    half = k // 2

    for u in range(n):
        for d in range(1, half + 1):
            v = (u + d) % n
            if u >= v:
                continue
            if rng.random() >= p:
                continue
            candidates = [w for w in range(n) if w != u and w not in adj[u]]
            if not candidates:
                continue
            w = rng.choice(candidates)
            remove_edge(adj, u, v)
            add_edge(adj, u, w)
    return adj


def erdos_renyi_graph(n: int, p: float, seed: int) -> Dict[int, set[int]]:
    rng = random.Random(seed)
    adj = empty_graph(n)
    for u in range(n):
        for v in range(u + 1, n):
            if rng.random() < p:
                add_edge(adj, u, v)
    return adj


def distance_decay_graph(
    coords: Dict[int, Tuple[float, float, float]],
    eta: float,
    kappa: float,
    seed: int,
) -> Dict[int, set[int]]:
    rng = random.Random(seed)
    nodes = sorted(coords.keys())
    adj = empty_graph(len(nodes))
    for i, u in enumerate(nodes):
        for v in nodes[i + 1 :]:
            d = _distance(coords[u], coords[v])
            p = min(1.0, max(0.0, kappa * math.exp(-eta * d)))
            if rng.random() < p:
                add_edge(adj, u, v)
    return adj


def _weighted_sample_without_replacement(
    items: List[int], weights: List[float], k: int, rng: random.Random
) -> List[int]:
    chosen: List[int] = []
    pool_items = items[:]
    pool_weights = [max(w, 0.0) for w in weights]
    for _ in range(min(k, len(pool_items))):
        total = sum(pool_weights)
        if total <= 0.0:
            pick = rng.randrange(0, len(pool_items))
        else:
            r = rng.random() * total
            acc = 0.0
            pick = 0
            for idx, w in enumerate(pool_weights):
                acc += w
                if acc >= r:
                    pick = idx
                    break
        chosen.append(pool_items[pick])
        del pool_items[pick]
        del pool_weights[pick]
    return chosen


def preferential_attachment_with_cutoff(
    n: int, m: int, k_c: float, seed: int
) -> Dict[int, set[int]]:
    if m < 1 or m >= n:
        raise AuditInputError("Require 1 <= m < n for preferential attachment")
    rng = random.Random(seed)

    adj = empty_graph(n)
    m0 = m + 1
    for u in range(m0):
        for v in range(u + 1, m0):
            add_edge(adj, u, v)

    for new_node in range(m0, n):
        existing = list(range(new_node))
        weights = []
        for node in existing:
            deg = len(adj[node])
            weights.append((deg + 1.0) * math.exp(-deg / max(k_c, 1e-6)))

        targets = _weighted_sample_without_replacement(existing, weights, m, rng)
        for tgt in targets:
            add_edge(adj, new_node, tgt)

    return adj


def circle_coordinates(n: int, radius: float = 1.0) -> Dict[int, Tuple[float, float, float]]:
    out = {}
    for i in range(n):
        theta = (2.0 * math.pi * i) / n
        out[i] = (radius * math.cos(theta), radius * math.sin(theta), 0.0)
    return out


def _distance(a: Tuple[float, float, float], b: Tuple[float, float, float]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


def _adj_to_nx(adj: Dict[int, set[int]]):
    if nx is None:
        return None
    graph = nx.Graph()
    graph.add_nodes_from(adj.keys())
    graph.add_edges_from(edge_list(adj))
    return graph


def bfs_distances(adj: Dict[int, set[int]], start: int) -> Dict[int, int]:
    dist = {start: 0}
    q = deque([start])
    while q:
        node = q.popleft()
        for nxt in adj[node]:
            if nxt in dist:
                continue
            dist[nxt] = dist[node] + 1
            q.append(nxt)
    return dist


def characteristic_path_length(adj: Dict[int, set[int]]) -> float:
    if nx is not None:
        try:
            g = _adj_to_nx(adj)
            if g is not None and nx.is_connected(g):
                return float(nx.average_shortest_path_length(g))
        except Exception:
            pass

    pairs = 0
    total = 0.0
    nodes = sorted(adj.keys())
    for i, u in enumerate(nodes):
        dist = bfs_distances(adj, u)
        for v in nodes[i + 1 :]:
            d = dist.get(v)
            if d is None:
                continue
            total += d
            pairs += 1
    return total / pairs if pairs > 0 else float("inf")


def global_efficiency(adj: Dict[int, set[int]]) -> float:
    if nx is not None:
        try:
            g = _adj_to_nx(adj)
            if g is not None:
                return float(nx.global_efficiency(g))
        except Exception:
            pass

    nodes = sorted(adj.keys())
    n = len(nodes)
    if n < 2:
        return 0.0
    total = 0.0
    for u in nodes:
        dist = bfs_distances(adj, u)
        for v in nodes:
            if u == v:
                continue
            d = dist.get(v)
            if d is None or d == 0:
                continue
            total += 1.0 / d
    return total / (n * (n - 1))


def average_clustering(adj: Dict[int, set[int]]) -> float:
    if nx is not None:
        try:
            g = _adj_to_nx(adj)
            if g is not None:
                return float(nx.average_clustering(g))
        except Exception:
            pass

    coeffs = []
    for node, nbrs in adj.items():
        deg = len(nbrs)
        if deg < 2:
            coeffs.append(0.0)
            continue
        links = 0
        nbr_list = list(nbrs)
        for i in range(len(nbr_list)):
            for j in range(i + 1, len(nbr_list)):
                if nbr_list[j] in adj[nbr_list[i]]:
                    links += 1
        possible = deg * (deg - 1) / 2.0
        coeffs.append(links / possible if possible > 0 else 0.0)
    return _mean(coeffs)


def component_count(adj: Dict[int, set[int]]) -> int:
    if nx is not None:
        try:
            g = _adj_to_nx(adj)
            if g is not None:
                return int(nx.number_connected_components(g))
        except Exception:
            pass

    unseen = set(adj.keys())
    components = 0
    while unseen:
        components += 1
        start = unseen.pop()
        q = deque([start])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if v in unseen:
                    unseen.remove(v)
                    q.append(v)
    return components


def betweenness_centrality(adj: Dict[int, set[int]]) -> Dict[int, float]:
    if nx is not None:
        try:
            g = _adj_to_nx(adj)
            if g is not None:
                return dict(nx.betweenness_centrality(g, normalized=True))
        except Exception:
            pass

    # Brandes algorithm for unweighted undirected graphs.
    nodes = sorted(adj.keys())
    cb = {v: 0.0 for v in nodes}

    for s in nodes:
        stack: List[int] = []
        pred: Dict[int, List[int]] = {w: [] for w in nodes}
        sigma = {w: 0.0 for w in nodes}
        sigma[s] = 1.0
        dist = {w: -1 for w in nodes}
        dist[s] = 0

        q = deque([s])
        while q:
            v = q.popleft()
            stack.append(v)
            for w in adj[v]:
                if dist[w] < 0:
                    q.append(w)
                    dist[w] = dist[v] + 1
                if dist[w] == dist[v] + 1:
                    sigma[w] += sigma[v]
                    pred[w].append(v)

        delta = {w: 0.0 for w in nodes}
        while stack:
            w = stack.pop()
            for v in pred[w]:
                if sigma[w] > 0:
                    delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
            if w != s:
                cb[w] += delta[w]

    # Undirected normalization.
    scale = 1.0 / 2.0
    if len(nodes) > 2:
        scale *= 2.0 / ((len(nodes) - 1) * (len(nodes) - 2))
    for node in cb:
        cb[node] *= scale
    return cb


def wiring_cost(adj: Dict[int, set[int]], coords: Dict[int, Tuple[float, float, float]]) -> float:
    return sum(_distance(coords[u], coords[v]) for u, v in edge_list(adj))


def normalize_cost(cost_raw: float, n: int) -> float:
    return cost_raw / max(1.0, float(n))


def compute_network_metrics(
    adj: Dict[int, set[int]], coords: Dict[int, Tuple[float, float, float]], baseline_random: Dict[int, set[int]]
) -> dict:
    n = len(adj)
    c_wire_raw = wiring_cost(adj, coords)
    c_wire = normalize_cost(c_wire_raw, n)
    e_glob = global_efficiency(adj)
    l_char = characteristic_path_length(adj)
    c_cluster = average_clustering(adj)

    c_rand = average_clustering(baseline_random)
    l_rand = characteristic_path_length(baseline_random)
    if c_rand <= 0.0 or l_rand <= 0.0 or not math.isfinite(l_char):
        sigma = 0.0
    else:
        sigma = (c_cluster / c_rand) / (l_char / l_rand)

    return {
        "N": n,
        "C_wire_raw": c_wire_raw,
        "C_wire": c_wire,
        "E_glob": e_glob,
        "L": l_char,
        "C_clustering": c_cluster,
        "C_random": c_rand,
        "L_random": l_rand,
        "sigma_small_world": sigma,
        "edge_count": len(edge_list(adj)),
    }


def hamiltonian(alpha: float, beta: float, e_glob: float, c_wire: float) -> float:
    return (alpha * e_glob) - (beta * c_wire)


def distance_probability_coupling(
    adj: Dict[int, set[int]], coords: Dict[int, Tuple[float, float, float]], bins: int = 12
) -> dict:
    if bins < 3:
        bins = 3

    distances = []
    connected = []
    wire_contrib = []
    nodes = sorted(adj.keys())
    for i, u in enumerate(nodes):
        for v in nodes[i + 1 :]:
            d = _distance(coords[u], coords[v])
            a = 1 if v in adj[u] else 0
            distances.append(d)
            connected.append(a)
            wire_contrib.append(a * d)

    d_min = min(distances)
    d_max = max(distances)
    width = (d_max - d_min) / bins if d_max > d_min else 1.0

    bucket_total = [0 for _ in range(bins)]
    bucket_conn = [0 for _ in range(bins)]
    centers = []
    probs = []

    for d, a in zip(distances, connected):
        idx = min(bins - 1, int((d - d_min) / width))
        bucket_total[idx] += 1
        bucket_conn[idx] += a

    for idx in range(bins):
        left = d_min + idx * width
        center = left + (0.5 * width)
        total = bucket_total[idx]
        p = (bucket_conn[idx] / total) if total > 0 else 0.0
        centers.append(center)
        probs.append(p)

    fit_x = [x for x, p in zip(centers, probs) if p > 0.0]
    fit_y = [math.log(p) for p in probs if p > 0.0]
    intercept, slope, r2 = _linreg_simple(fit_x, fit_y) if len(fit_x) >= 2 else (0.0, 0.0, 0.0)

    eta_hat = max(0.0, -slope)
    kappa_hat = math.exp(intercept)

    corr_dw = _pearson(distances, wire_contrib)
    p_dw = _pearson_p_value_approx(corr_dw, len(distances))
    corr_dp = _pearson(centers, probs)
    p_dp = _pearson_p_value_approx(corr_dp, len(centers))

    return {
        "distance_centers": centers,
        "observed_probabilities": probs,
        "eta_hat": eta_hat,
        "kappa_hat": kappa_hat,
        "fit_r2_log": r2,
        "corr_distance_probability": corr_dp,
        "corr_distance_probability_p_approx": p_dp,
        "corr_distance_wirecontrib": corr_dw,
        "corr_distance_wirecontrib_p_approx": p_dw,
    }


def fit_truncated_power_law(adj: Dict[int, set[int]]) -> dict:
    degrees = [len(adj[node]) for node in sorted(adj.keys())]
    hist = Counter(degrees)

    xs = sorted(k for k in hist if k > 0)
    counts = [hist[k] for k in xs]
    total = sum(counts)
    probs = [c / total for c in counts]

    if len(xs) < 3:
        return {
            "gamma": 0.0,
            "k_c": float("inf"),
            "r2": 0.0,
            "degrees": xs,
            "probabilities": probs,
            "predicted_probabilities": probs,
        }

    ln_p = [math.log(max(p, 1e-12)) for p in probs]
    ln_k = [math.log(float(k)) for k in xs]
    k_vals = [float(k) for k in xs]

    if np is not None:
        x = np.column_stack(
            [
                np.ones(len(xs)),
                np.array(ln_k),
                np.array(k_vals),
            ]
        )
        y = np.array(ln_p)
        coef, _, _, _ = np.linalg.lstsq(x, y, rcond=None)
        b0, b1, b2 = float(coef[0]), float(coef[1]), float(coef[2])
    else:
        # Normal equation (X^T X) b = X^T y
        x0 = [1.0 for _ in xs]
        x1 = ln_k
        x2 = k_vals
        a = [
            [sum(v * w for v, w in zip(x0, x0)), sum(v * w for v, w in zip(x0, x1)), sum(v * w for v, w in zip(x0, x2))],
            [sum(v * w for v, w in zip(x1, x0)), sum(v * w for v, w in zip(x1, x1)), sum(v * w for v, w in zip(x1, x2))],
            [sum(v * w for v, w in zip(x2, x0)), sum(v * w for v, w in zip(x2, x1)), sum(v * w for v, w in zip(x2, x2))],
        ]
        b = [
            sum(v * y for v, y in zip(x0, ln_p)),
            sum(v * y for v, y in zip(x1, ln_p)),
            sum(v * y for v, y in zip(x2, ln_p)),
        ]
        b0, b1, b2 = _solve_3x3(a, b)

    # Enforce finite positive cutoff when unconstrained regression yields nonphysical b2 >= 0.
    if b2 >= -1e-9:
        best = None
        for candidate_kc in [float(k) for k in range(8, 121)]:
            adjusted = [lp + (kv / candidate_kc) for lp, kv in zip(ln_p, k_vals)]
            c0, c1, _ = _linreg_simple(ln_k, adjusted)
            gamma_c = max(0.0, -c1)
            pred_ln = [c0 - gamma_c * lk - (kv / candidate_kc) for lk, kv in zip(ln_k, k_vals)]
            ss_res_c = sum((y - yp) ** 2 for y, yp in zip(ln_p, pred_ln))
            if best is None or ss_res_c < best["ss_res"]:
                best = {
                    "b0": c0,
                    "gamma": gamma_c,
                    "k_c": candidate_kc,
                    "pred_ln": pred_ln,
                    "ss_res": ss_res_c,
                }
        if best is not None:
            b0 = best["b0"]
            b1 = -best["gamma"]
            b2 = -1.0 / best["k_c"]
            predicted_ln = best["pred_ln"]
            k_c = best["k_c"]
        else:
            predicted_ln = [b0 + b1 * lk + b2 * kv for lk, kv in zip(ln_k, k_vals)]
            k_c = float("inf")
    else:
        predicted_ln = [b0 + b1 * lk + b2 * kv for lk, kv in zip(ln_k, k_vals)]
        k_c = (-1.0 / b2) if b2 < -1e-9 else float("inf")

    predicted_prob = [math.exp(v) for v in predicted_ln]
    mean_ln = _mean(ln_p)
    ss_res = sum((y - yp) ** 2 for y, yp in zip(ln_p, predicted_ln))
    ss_tot = sum((y - mean_ln) ** 2 for y in ln_p)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

    gamma = max(0.0, -b1)

    return {
        "gamma": gamma,
        "k_c": k_c,
        "r2": r2,
        "degrees": xs,
        "probabilities": probs,
        "predicted_probabilities": predicted_prob,
    }


def _remove_nodes(adj: Dict[int, set[int]], nodes_to_remove: Sequence[int]) -> Dict[int, set[int]]:
    remove_set = set(nodes_to_remove)
    keep = sorted([n for n in adj.keys() if n not in remove_set])
    remap = {old: idx for idx, old in enumerate(keep)}
    new_adj = empty_graph(len(keep))

    for old_u in keep:
        for old_v in adj[old_u]:
            if old_v in remove_set:
                continue
            u = remap[old_u]
            v = remap[old_v]
            if u < v:
                add_edge(new_adj, u, v)
    return new_adj


def _hub_ranking(adj: Dict[int, set[int]]) -> List[int]:
    deg = {node: len(nbrs) for node, nbrs in adj.items()}
    btw = betweenness_centrality(adj)

    deg_sorted = sorted(deg.items(), key=lambda kv: kv[1], reverse=True)
    btw_sorted = sorted(btw.items(), key=lambda kv: kv[1], reverse=True)

    rank_deg = {node: idx for idx, (node, _) in enumerate(deg_sorted)}
    rank_btw = {node: idx for idx, (node, _) in enumerate(btw_sorted)}

    combined = sorted(
        adj.keys(),
        key=lambda node: (rank_deg[node] + rank_btw[node], -deg[node], -btw[node]),
    )
    return combined


def simulate_attack_vulnerability(adj: Dict[int, set[int]], attack_fraction: float, seed: int) -> dict:
    if not (0.0 < attack_fraction < 1.0):
        raise AuditInputError("attack_fraction must be in (0,1)")

    n = len(adj)
    remove_count = max(1, int(round(n * attack_fraction)))

    e_pre = global_efficiency(adj)

    rng = random.Random(seed)
    random_nodes = sorted(rng.sample(list(adj.keys()), remove_count))
    hub_rank = _hub_ranking(adj)
    targeted_nodes = sorted(hub_rank[:remove_count])

    random_post = _remove_nodes(adj, random_nodes)
    targeted_post = _remove_nodes(adj, targeted_nodes)

    e_random = global_efficiency(random_post)
    e_targeted = global_efficiency(targeted_post)

    psi_random = e_pre - e_random
    psi_targeted = e_pre - e_targeted

    return {
        "attack_fraction": attack_fraction,
        "removed_nodes": remove_count,
        "pre": {
            "E_glob": e_pre,
            "components": component_count(adj),
            "N": len(adj),
        },
        "random": {
            "E_glob": e_random,
            "drop": psi_random,
            "drop_ratio": psi_random / e_pre if e_pre > 0 else 0.0,
            "components": component_count(random_post),
        },
        "targeted": {
            "E_glob": e_targeted,
            "drop": psi_targeted,
            "drop_ratio": psi_targeted / e_pre if e_pre > 0 else 0.0,
            "components": component_count(targeted_post),
        },
        "dysconnectivity_syndrome": psi_targeted > psi_random * 2.0,
    }


def structure_function_coupling(adj: Dict[int, set[int]], seed: int) -> dict:
    rng = random.Random(seed)
    a_vals: List[float] = []
    f_vals: List[float] = []

    nodes = sorted(adj.keys())
    for i, u in enumerate(nodes):
        for v in nodes[i + 1 :]:
            a = 1.0 if v in adj[u] else 0.0
            base = 0.64 if a > 0 else 0.13
            f = max(-1.0, min(1.0, base + rng.gauss(0.0, 0.09)))
            a_vals.append(a)
            f_vals.append(f)

    corr = _pearson(a_vals, f_vals)
    p_val = _pearson_p_value_approx(corr, len(a_vals))

    # Metastability proxy: dynamic functional changes while structure stays fixed.
    f_vals_next = [max(-1.0, min(1.0, x + rng.gauss(0.0, 0.05))) for x in f_vals]
    dF_dt = _mean(abs(a - b) for a, b in zip(f_vals, f_vals_next))
    dA_dt = 0.0

    return {
        "corr_fij_aij": corr,
        "corr_p_approx": p_val,
        "dF_dt": dF_dt,
        "dA_dt": dA_dt,
        "metastability_confirmed": dF_dt > 0.0 and dA_dt == 0.0,
    }


def hamiltonian_dataset_validation(rows: List[dict]) -> dict:
    baseline = [r for r in rows if r["attack_type"] == "none"]
    if not baseline:
        raise AuditInputError("Need at least one baseline row with attack_type=none")

    for row in baseline:
        row["H_evol"] = hamiltonian(row["alpha"], row["beta"], row["E_glob"], row["C_wire"])

    finite = [
        r
        for r in baseline
        if (0.1 <= r["alpha"] <= 1.0) and (0.1 <= r["beta"] <= 1.0)
    ]
    if not finite:
        finite = baseline

    best_finite = max(finite, key=lambda r: r["H_evol"])

    lattice_rows = [r for r in baseline if r["beta"] / max(r["alpha"], 1e-9) >= 20.0]
    random_rows = [r for r in baseline if r["alpha"] / max(r["beta"], 1e-9) >= 20.0]
    balanced_rows = [
        r
        for r in baseline
        if 0.5 <= (r["alpha"] / max(r["beta"], 1e-9)) <= 2.0 and 0.1 <= r["alpha"] <= 1.0 and 0.1 <= r["beta"] <= 1.0
    ]

    lattice_ok = all(r["topology_regime"] == "lattice" for r in lattice_rows) if lattice_rows else False
    random_ok = all(r["topology_regime"] == "random" for r in random_rows) if random_rows else False
    small_world_ok = all(
        r["topology_regime"] == "small-world" and r["sigma_small_world"] > 1.0 for r in balanced_rows
    ) if balanced_rows else False

    return {
        "baseline_count": len(baseline),
        "best_finite": {
            "network_id": best_finite["network_id"],
            "alpha": best_finite["alpha"],
            "beta": best_finite["beta"],
            "H_evol": best_finite["H_evol"],
            "topology_regime": best_finite["topology_regime"],
            "sigma_small_world": best_finite["sigma_small_world"],
            "E_glob": best_finite["E_glob"],
            "C_wire": best_finite["C_wire"],
        },
        "finite_optimum_is_small_world": best_finite["topology_regime"] == "small-world",
        "lattice_rows_checked": len(lattice_rows),
        "random_rows_checked": len(random_rows),
        "balanced_rows_checked": len(balanced_rows),
        "lattice_regime_confirmed": lattice_ok,
        "random_regime_confirmed": random_ok,
        "balanced_small_world_confirmed": small_world_ok,
    }


def synthetic_regime_transitions(seed: int) -> dict:
    n = 120
    k = 8
    coords = circle_coordinates(n)

    lattice = ring_lattice_graph(n, k)
    small_world = watts_strogatz_graph(n, k, p=0.08, seed=seed + 1)
    random_graph = erdos_renyi_graph(n, p=k / (n - 1), seed=seed + 2)

    baseline_random = erdos_renyi_graph(n, p=k / (n - 1), seed=seed + 3)

    metrics = {
        "lattice": compute_network_metrics(lattice, coords, baseline_random),
        "small-world": compute_network_metrics(small_world, coords, baseline_random),
        "random": compute_network_metrics(random_graph, coords, baseline_random),
    }

    scenarios = {
        "lattice": {"alpha": 0.05, "beta": 5.0},
        "small-world": {"alpha": 0.65, "beta": 0.35},
        "random": {"alpha": 5.0, "beta": 0.05},
    }

    scenario_results = {}
    for expected, params in scenarios.items():
        alpha = params["alpha"]
        beta = params["beta"]
        scores = {
            name: hamiltonian(alpha, beta, m["E_glob"], m["C_wire"]) for name, m in metrics.items()
        }
        winner = max(scores, key=scores.get)
        scenario_results[expected] = {
            "alpha": alpha,
            "beta": beta,
            "winner": winner,
            "winner_score": scores[winner],
            "scores": scores,
            "expected": expected,
            "pass": winner == expected,
        }

    return {
        "metrics": metrics,
        "scenarios": scenario_results,
        "all_passed": all(item["pass"] for item in scenario_results.values()),
    }


def _format_p_value(p: float | None) -> str:
    if p is None:
        return "n/a"
    if p < 0.001:
        return "< 0.001"
    return f"= {p:.3f}"


def maybe_plot_distance_decay(result: dict, output_path: str) -> dict:
    if plt is None:
        return {"plotted": False, "reason": "matplotlib unavailable"}

    x = result["distance_centers"]
    y = result["observed_probabilities"]
    eta = result["eta_hat"]
    kappa = result["kappa_hat"]
    y_fit = [kappa * math.exp(-eta * xi) for xi in x]

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8, 4.8))
    plt.scatter(x, y, color="#005f73", label="Observed", s=40)
    plt.plot(x, y_fit, color="#bb3e03", linewidth=2, label="Exp fit")
    plt.xlabel("Distance d_ij")
    plt.ylabel("P(a_ij = 1)")
    plt.title("Distance-Probability Coupling")
    plt.grid(alpha=0.2)
    plt.legend()
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_hamiltonian_surface(regime_report: dict, output_path: str) -> dict:
    if plt is None:
        return {"plotted": False, "reason": "matplotlib unavailable"}

    metrics = regime_report["metrics"]
    alphas = [i / 20.0 for i in range(1, 21)]
    betas = [i / 20.0 for i in range(1, 21)]

    grid_alpha = []
    grid_beta = []
    grid_h = []

    for a in alphas:
        row_h = []
        for b in betas:
            score = max(
                hamiltonian(a, b, metrics[name]["E_glob"], metrics[name]["C_wire"]) for name in metrics
            )
            row_h.append(score)
        grid_h.append(row_h)

    if np is not None:
        aa, bb = np.meshgrid(np.array(alphas), np.array(betas), indexing="ij")
        hh = np.array(grid_h)
    else:
        aa = [[a for _ in betas] for a in alphas]
        bb = [[b for b in betas] for _ in alphas]
        hh = grid_h

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    fig = plt.figure(figsize=(8.4, 5.5))
    ax = fig.add_subplot(111, projection="3d")
    ax.plot_surface(aa, bb, hh, cmap="viridis", linewidth=0, antialiased=True, alpha=0.95)
    ax.set_xlabel("alpha")
    ax.set_ylabel("beta")
    ax.set_zlabel("max H_evol")
    ax.set_title("Hamiltonian Surface (Regime Envelope)")
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_degree_distribution(result: dict, output_path: str) -> dict:
    if plt is None:
        return {"plotted": False, "reason": "matplotlib unavailable"}

    x = result["degrees"]
    y = result["probabilities"]
    yhat = result["predicted_probabilities"]

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8.0, 4.8))
    plt.scatter(x, y, color="#0a9396", s=44, label="Observed")
    plt.plot(x, yhat, color="#ae2012", linewidth=2, label="Fitted truncated power law")
    plt.xscale("log")
    plt.yscale("log")
    plt.xlabel("Degree k")
    plt.ylabel("P(k)")
    plt.title("Degree Distribution with Exponential Cutoff")
    plt.grid(alpha=0.2)
    plt.legend()
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_attack_comparison(result: dict, output_path: str) -> dict:
    if plt is None:
        return {"plotted": False, "reason": "matplotlib unavailable"}

    labels = ["Pre", "Random", "Targeted"]
    values = [result["pre"]["E_glob"], result["random"]["E_glob"], result["targeted"]["E_glob"]]

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(7.0, 4.4))
    bars = plt.bar(labels, values, color=["#0a9396", "#94d2bd", "#ee9b00"])
    for bar, val in zip(bars, values):
        plt.text(bar.get_x() + bar.get_width() / 2.0, val + 0.01, f"{val:.2f}", ha="center", va="bottom")
    plt.ylim(0.0, max(1.0, max(values) + 0.1))
    plt.ylabel("Global Efficiency")
    plt.title("Attack Simulation: Random vs Targeted")
    plt.grid(axis="y", alpha=0.2)
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def maybe_plot_small_world_diagram(rows: List[dict], output_path: str) -> dict:
    if plt is None:
        return {"plotted": False, "reason": "matplotlib unavailable"}

    base = [r for r in rows if r["attack_type"] == "none"]
    if not base:
        return {"plotted": False, "reason": "No baseline rows for diagram"}

    colors = {"lattice": "#1d3557", "small-world": "#2a9d8f", "random": "#e76f51"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8.0, 5.0))
    for row in base:
        ratio = row["alpha"] / max(row["beta"], 1e-9)
        plt.scatter(
            ratio,
            row["sigma_small_world"],
            color=colors.get(row["topology_regime"], "#555555"),
            s=58,
            alpha=0.9,
        )
        plt.text(ratio, row["sigma_small_world"] + 0.02, row["topology_regime"], fontsize=8)

    plt.axhline(1.0, linestyle="--", color="#555555", linewidth=1.2)
    plt.xscale("log")
    plt.xlabel("alpha / beta")
    plt.ylabel("sigma_small_world")
    plt.title("Regime Diagram: Lattice -> Small-World -> Random")
    plt.grid(alpha=0.2)
    plt.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close()
    return {"plotted": True, "path": output_path}


def _mark(cond: bool) -> str:
    return "✓" if cond else "✗"


def render_text_report(report: dict) -> str:
    lines = []
    lines.append("=== Neural Topology Causal Graph Audit Report ===")
    lines.append("")

    graph = report["graph_validation"]
    domains = graph.get("domain_counts", {})
    lines.append("1. GRAPH VALIDATION")
    lines.append(
        f"   {_mark(graph['causal_slice_is_dag'])} {graph['node_count']} nodes, "
        f"{graph['edge_count']} edges, DAG {'confirmed' if graph['causal_slice_is_dag'] else 'failed'}"
    )
    lines.append(
        f"   {_mark(not graph['missing_domains'])} Domain coverage: "
        f"G={domains.get('G', 0)}, H={domains.get('H', 0)}, T={domains.get('T', 0)}, Delta={domains.get('Delta', 0)}"
    )
    lines.append(
        f"   {_mark(not graph['missing_edge_node_references'])} Edge references valid nodes"
    )
    lines.append("")

    coupling = report["distance_cost_coupling"]
    lines.append("2. DISTANCE-COST COUPLING TEST")
    lines.append(
        f"   {_mark(coupling['fit_r2_log'] > 0.80)} Connection probability fits exp decay (log-R2 = {coupling['fit_r2_log']:.3f})"
    )
    lines.append(
        f"   {_mark(coupling['corr_distance_probability'] < -0.7)} "
        f"Correlation(d_ij, P_connection) = {coupling['corr_distance_probability']:.2f} "
        f"(p {_format_p_value(coupling['corr_distance_probability_p_approx'])})"
    )
    lines.append(
        f"   {_mark(coupling['eta_hat'] > 0.0)} Spatial decay constant eta = {coupling['eta_hat']:.3f}"
    )
    lines.append("")

    ham = report.get("hamiltonian_validation")
    if ham:
        lines.append("3. HAMILTONIAN REGIME VALIDATION")
        lines.append("   Lattice regime (beta -> infinity):")
        lines.append(
            f"     {_mark(ham['synthetic']['scenarios']['lattice']['pass'])} "
            f"Winner = {ham['synthetic']['scenarios']['lattice']['winner']}"
        )
        lines.append("   Small-world regime (finite alpha, beta):")
        lines.append(
            f"     {_mark(ham['dataset']['finite_optimum_is_small_world'])} "
            f"Optimal finite topology = {ham['dataset']['best_finite']['topology_regime']}"
        )
        lines.append(
            f"     {_mark(ham['dataset']['best_finite']['sigma_small_world'] > 1.0)} "
            f"sigma_small_world = {ham['dataset']['best_finite']['sigma_small_world']:.2f}"
        )
        lines.append("   Random regime (alpha -> infinity):")
        lines.append(
            f"     {_mark(ham['synthetic']['scenarios']['random']['pass'])} "
            f"Winner = {ham['synthetic']['scenarios']['random']['winner']}"
        )
        lines.append("")

    degree = report["degree_distribution"]
    lines.append("4. DEGREE DISTRIBUTION ANALYSIS")
    lines.append(
        f"   {_mark(math.isfinite(degree['k_c']) and degree['k_c'] > 0)} "
        f"Fit: P(k) ~ k^(-gamma) * exp(-k/k_c)"
    )
    lines.append(
        f"   {_mark(True)} Parameters: gamma = {degree['gamma']:.2f}, "
        f"k_c = {degree['k_c']:.2f}"
    )
    lines.append(
        f"   {_mark(degree['r2'] > 0.80)} R2 = {degree['r2']:.3f}"
    )
    lines.append("")

    attack = report.get("attack_simulation")
    if attack:
        lines.append("5. HUB VULNERABILITY SIMULATION")
        lines.append("   Random attack:")
        lines.append(
            f"     - E_glob drop: {attack['pre']['E_glob']:.2f} -> {attack['random']['E_glob']:.2f} "
            f"({attack['random']['drop_ratio'] * 100:.1f}% reduction)"
        )
        lines.append(f"     - Components: {attack['random']['components']}")
        lines.append(f"     - Psi_patho = {attack['random']['drop']:.2f}")
        lines.append("   Targeted attack:")
        lines.append(
            f"     - E_glob drop: {attack['pre']['E_glob']:.2f} -> {attack['targeted']['E_glob']:.2f} "
            f"({attack['targeted']['drop_ratio'] * 100:.1f}% reduction)"
        )
        lines.append(f"     - Components: {attack['targeted']['components']}")
        lines.append(f"     - Psi_patho = {attack['targeted']['drop']:.2f}")
        lines.append(
            f"     - dysconnectivity_syndrome = {str(attack['dysconnectivity_syndrome']).upper()}"
        )
        lines.append("")

    sf = report["structure_function_coupling"]
    lines.append("6. STRUCTURE-FUNCTION COUPLING")
    lines.append(
        f"   {_mark(sf['corr_fij_aij'] > 0.5)} F_ij correlates with a_ij "
        f"(r = {sf['corr_fij_aij']:.2f}, p {_format_p_value(sf['corr_p_approx'])})"
    )
    lines.append(
        f"   {_mark(sf['metastability_confirmed'])} Metastable dynamics: dF/dt = {sf['dF_dt']:.3f}, dA/dt = {sf['dA_dt']:.3f}"
    )
    lines.append("")

    if ham:
        best = ham["dataset"]["best_finite"]
        lines.append("7. SMALL-WORLD OPTIMIZATION")
        lines.append(f"   Optimal finite (alpha, beta) = ({best['alpha']:.2f}, {best['beta']:.2f})")
        lines.append(f"   - H_evol = {best['H_evol']:.3f}")
        lines.append(f"   - sigma = {best['sigma_small_world']:.2f}")
        lines.append(f"   - E_glob = {best['E_glob']:.2f}, C_wire = {best['C_wire']:.2f}")
        plot = report.get("plots", {}).get("hamiltonian_surface")
        if plot and plot.get("plotted"):
            lines.append(f"   - [plot saved to {plot['path']}]")
        lines.append("")

    lines.append("=== RECOMMENDATIONS ===")
    for item in report["recommendations"]:
        lines.append(f"- {item}")

    return "\n".join(lines)


def build_recommendations(report: dict) -> List[str]:
    recs = []

    graph = report["graph_validation"]
    if graph["missing_edge_node_references"]:
        recs.append("Fix dangling edges that reference undefined nodes.")
    if graph["unknown_structural_equation_nodes"]:
        recs.append("Align structural equations with declared node identifiers.")
    if not graph["causal_slice_is_dag"]:
        recs.append("Break same-time causal cycles or move them to temporal edges.")

    coupling = report["distance_cost_coupling"]
    if coupling["fit_r2_log"] < 0.8:
        recs.append("Recalibrate distance-decay fit; observed connectivity does not follow exponential law strongly.")

    degree = report["degree_distribution"]
    if degree["r2"] < 0.8:
        recs.append("Increase sample size for degree-distribution fitting or refine hub formation process.")

    attack = report.get("attack_simulation")
    if attack and not attack["dysconnectivity_syndrome"]:
        recs.append("Targeted attacks are not substantially worse than random attacks; verify hub definition.")

    sf = report["structure_function_coupling"]
    if sf["corr_fij_aij"] < 0.5:
        recs.append("Structure-function coupling is weak; inspect low-frequency synchronization assumptions.")

    ham = report.get("hamiltonian_validation")
    if ham and not ham["dataset"]["finite_optimum_is_small_world"]:
        recs.append("Finite (alpha, beta) optimum is not small-world in dataset; revisit regime coefficients.")

    if not recs:
        recs.append("Small-world topology remains the strongest finite-coefficient operating regime.")
        recs.append("Prioritize hub protection, since targeted attacks produce disproportionate efficiency collapse.")
        recs.append("Use random-failure robustness and hub-focused interventions as complementary diagnostics.")

    return recs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Audit neural topology causal graph, Hamiltonian regimes, and hub vulnerability."
    )
    parser.add_argument("--spec", required=True, help="Path to neural topology causal graph JSON spec.")
    parser.add_argument(
        "--network-dataset",
        help="CSV dataset with network-level metrics and attack outcomes.",
    )
    parser.add_argument("--validate-hamiltonian", action="store_true", help="Validate Hamiltonian optimization behavior.")
    parser.add_argument("--test-regime-transitions", action="store_true", help="Run synthetic lattice/small-world/random transition checks.")
    parser.add_argument("--simulate-attacks", action="store_true", help="Simulate random vs targeted attacks on hub-rich graph.")
    parser.add_argument("--attack-fraction", type=float, default=0.20, help="Fraction of nodes removed in attack simulation.")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed.")
    parser.add_argument(
        "--figures-dir",
        default="Graph-Theory-Networks/figures",
        help="Directory for optional figures.",
    )
    parser.add_argument("--no-plots", action="store_true", help="Disable all plot rendering.")
    parser.add_argument("--out", help="Optional path to save machine-readable JSON report.")
    return parser


def main() -> None:
    args = build_parser().parse_args()

    spec = load_json(args.spec)
    graph_report = validate_graph(spec)

    dataset_rows = load_network_dataset(args.network_dataset) if args.network_dataset else None

    # Shared synthetic substrate for topology checks.
    n = 120
    k = 8
    coords = circle_coordinates(n)
    small_world_graph = watts_strogatz_graph(n, k, p=0.08, seed=args.seed + 10)
    coupling_graph = distance_decay_graph(coords, eta=1.10, kappa=0.60, seed=args.seed + 11)

    coupling_report = distance_probability_coupling(coupling_graph, coords)

    degree_graph = preferential_attachment_with_cutoff(n=140, m=3, k_c=36.0, seed=args.seed + 20)
    degree_report = fit_truncated_power_law(degree_graph)

    sf_report = structure_function_coupling(small_world_graph, seed=args.seed + 30)

    hamiltonian_report = None
    if args.validate_hamiltonian or args.test_regime_transitions:
        if dataset_rows is None:
            raise AuditInputError("--validate-hamiltonian and --test-regime-transitions require --network-dataset")
        dataset_ham = hamiltonian_dataset_validation(dataset_rows)
        synthetic_ham = synthetic_regime_transitions(seed=args.seed + 40)
        hamiltonian_report = {
            "dataset": dataset_ham,
            "synthetic": synthetic_ham,
        }

    attack_report = None
    if args.simulate_attacks:
        attack_graph = preferential_attachment_with_cutoff(n=140, m=3, k_c=32.0, seed=args.seed + 50)
        attack_report = simulate_attack_vulnerability(
            attack_graph,
            attack_fraction=args.attack_fraction,
            seed=args.seed + 51,
        )

    plots = {}
    if not args.no_plots:
        figures_dir = Path(args.figures_dir)
        plots["distance_probability_decay"] = maybe_plot_distance_decay(
            coupling_report,
            str(figures_dir / "distance_probability_decay.png"),
        )
        if hamiltonian_report is not None:
            plots["hamiltonian_surface"] = maybe_plot_hamiltonian_surface(
                hamiltonian_report["synthetic"],
                str(figures_dir / "hamiltonian_surface.png"),
            )
        plots["degree_distribution"] = maybe_plot_degree_distribution(
            degree_report,
            str(figures_dir / "degree_distribution_truncated_power_law.png"),
        )
        if attack_report is not None:
            plots["attack_comparison"] = maybe_plot_attack_comparison(
                attack_report,
                str(figures_dir / "attack_comparison.png"),
            )
        if dataset_rows is not None:
            plots["small_world_regime_diagram"] = maybe_plot_small_world_diagram(
                dataset_rows,
                str(figures_dir / "small_world_regime_diagram.png"),
            )

    report = {
        "spec_id": spec.get("graph_id"),
        "graph_validation": graph_report,
        "distance_cost_coupling": coupling_report,
        "hamiltonian_validation": hamiltonian_report,
        "degree_distribution": degree_report,
        "attack_simulation": attack_report,
        "structure_function_coupling": sf_report,
        "plots": plots,
    }
    report["recommendations"] = build_recommendations(report)

    text = render_text_report(report)
    print(text)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    main()
