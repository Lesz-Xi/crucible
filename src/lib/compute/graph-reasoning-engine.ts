// =============================================================
// Automated Scientist: Graph Reasoning Engine
// Phase D — Graph Reasoning & Causal Bridge
// Builds a causal-style variable relationship graph from data,
// computes edge strengths from regression, and generates
// provenance-traced narratives.
// =============================================================

import type {
    ScientificDataPoint,
    RegressionResult,
    TrendAnalysisResult,
} from "../../types/scientific-data";
import { linearRegression, trendAnalysis } from "../compute/scientific-compute-engine";

// ── Types ────────────────────────────────────────────────────

export interface VariableNode {
    name: string;
    unit: string | undefined;
    observationCount: number;
    valueRange: { min: number; max: number };
}

export interface DirectedEdge {
    from: string;        // variable name (X)
    to: string;          // variable name (Y)
    relationship: "positive" | "negative" | "weak" | "unknown";
    strength: number;    // |R²|, 0–1
    regression: RegressionResult;
    trend: TrendAnalysisResult;
    confidence: number;  // composite trustworthiness score
}

export interface ProvenanceClaim {
    claim: string;
    evidenceType: "regression" | "trend" | "anomaly" | "observation";
    sourceMethod: string;
    sourceMethodVersion: string;
    rSquared: number | undefined;
    dataPointCount: number;
    ingestionIds: string[];
}

export interface ReasoningGraph {
    nodes: VariableNode[];
    edges: DirectedEdge[];
    claims: ProvenanceClaim[];
    summary: string;
}

// ── Core Logic ───────────────────────────────────────────────

/**
 * Group data points by their variable pair (X→Y).
 */
function groupByVariablePair(
    points: ScientificDataPoint[]
): Map<string, ScientificDataPoint[]> {
    const groups = new Map<string, ScientificDataPoint[]>();

    for (const point of points) {
        const key = `${point.variableXName}::${point.variableYName}`;
        const existing = groups.get(key) || [];
        existing.push(point);
        groups.set(key, existing);
    }

    return groups;
}

/**
 * Build a VariableNode from a set of values.
 */
function buildNode(
    name: string,
    values: number[],
    unit: string | undefined
): VariableNode {
    return {
        name,
        unit,
        observationCount: values.length,
        valueRange: {
            min: Math.min(...values),
            max: Math.max(...values),
        },
    };
}

/**
 * Classify a directed relationship based on regression results.
 */
function classifyRelationship(
    reg: RegressionResult
): DirectedEdge["relationship"] {
    if (reg.rSquared < 0.1) return "weak";
    if (reg.slope > 0) return "positive";
    if (reg.slope < 0) return "negative";
    return "unknown";
}

/**
 * Calculate composite confidence score for an edge.
 * Factors: R², sample size, data spread.
 */
function computeEdgeConfidence(reg: RegressionResult): number {
    let score = reg.rSquared; // Base is R²

    // Sample size bonus (diminishing returns)
    if (reg.n >= 30) score = Math.min(1, score + 0.1);
    else if (reg.n >= 10) score = Math.min(1, score + 0.05);
    else if (reg.n < 5) score = Math.max(0, score - 0.15);

    return Math.max(0, Math.min(1, score));
}

/**
 * Generate a provenance-traced claim from a directed edge.
 */
function generateClaim(
    edge: DirectedEdge,
    ingestionIds: string[]
): ProvenanceClaim {
    const direction =
        edge.relationship === "positive"
            ? "positively correlates with"
            : edge.relationship === "negative"
                ? "negatively correlates with"
                : edge.relationship === "weak"
                    ? "shows weak association with"
                    : "has an undetermined relationship with";

    return {
        claim: `${edge.from} ${direction} ${edge.to} (R²=${edge.strength.toFixed(4)}, slope=${edge.regression.slope.toFixed(4)}, n=${edge.regression.n}).`,
        evidenceType: "regression",
        sourceMethod: edge.regression.method,
        sourceMethodVersion: edge.regression.methodVersion,
        rSquared: edge.strength,
        dataPointCount: edge.regression.n,
        ingestionIds,
    };
}

// ── Public API ───────────────────────────────────────────────

/**
 * Build a reasoning graph from scientific data points.
 * For each unique variable pair, computes regression and trend,
 * then classifies the directed relationship.
 *
 * @param points - All scientific data points (may span multiple variable pairs)
 * @returns ReasoningGraph with nodes, edges, and provenance-traced claims
 */
export function buildReasoningGraph(
    points: ScientificDataPoint[]
): ReasoningGraph {
    if (points.length === 0) {
        return { nodes: [], edges: [], claims: [], summary: "No data points provided." };
    }

    const groups = groupByVariablePair(points);
    const nodesMap = new Map<string, VariableNode>();
    const edges: DirectedEdge[] = [];
    const claims: ProvenanceClaim[] = [];

    for (const [_key, groupPoints] of groups) {
        if (groupPoints.length < 2) continue;

        const xName = groupPoints[0].variableXName;
        const yName = groupPoints[0].variableYName;
        const xVals = groupPoints.map((p) => p.xValue);
        const yVals = groupPoints.map((p) => p.yValue);

        // Build nodes
        if (!nodesMap.has(xName)) {
            nodesMap.set(xName, buildNode(xName, xVals, groupPoints[0].unitX));
        }
        if (!nodesMap.has(yName)) {
            nodesMap.set(yName, buildNode(yName, yVals, groupPoints[0].unitY));
        }

        // Compute regression and trend
        try {
            const reg = linearRegression(xVals, yVals);
            const trend = trendAnalysis(groupPoints);

            const relationship = classifyRelationship(reg);
            const confidence = computeEdgeConfidence(reg);

            const edge: DirectedEdge = {
                from: xName,
                to: yName,
                relationship,
                strength: reg.rSquared,
                regression: reg,
                trend,
                confidence,
            };

            edges.push(edge);

            // Collect unique ingestion IDs for provenance
            const ingestionIds = [
                ...new Set(
                    groupPoints
                        .map((p) => p.ingestionId)
                        .filter((id): id is string => id !== undefined)
                ),
            ];

            claims.push(generateClaim(edge, ingestionIds));
        } catch {
            // Not enough data for regression — skip this pair
            continue;
        }
    }

    // Generate summary narrative
    const strongEdges = edges.filter((e) => e.strength >= 0.5);
    const weakEdges = edges.filter((e) => e.strength < 0.5);

    const summaryParts: string[] = [
        `Analyzed ${points.length} data points across ${groups.size} variable pair(s).`,
    ];

    if (strongEdges.length > 0) {
        summaryParts.push(
            `Found ${strongEdges.length} strong relationship(s) (R² ≥ 0.5).`
        );
    }
    if (weakEdges.length > 0) {
        summaryParts.push(
            `Found ${weakEdges.length} weak or insignificant relationship(s).`
        );
    }

    return {
        nodes: Array.from(nodesMap.values()),
        edges,
        claims,
        summary: summaryParts.join(" "),
    };
}
