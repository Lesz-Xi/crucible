// =============================================================
// Automated Scientist: Scientific Compute Engine
// Phase C — Deterministic Compute Engine
// All computations use mathjs (synchronous, native, deterministic).
// SHA-256 hashing for reproducibility audit trail.
// =============================================================

import {
    mean as mathjsMean,
    std as mathjsStd,
    multiply,
    inv,
    transpose,
    matrix,
    Matrix,
} from "mathjs";

import type {
    ScientificDataPoint,
    RegressionResult,
    TrendAnalysisResult,
    AnomalyResult,
} from "../../types/scientific-data";

// ── Constants ────────────────────────────────────────────────

const ENGINE_VERSION = "1.0.0";
const METHOD_LINEAR_REGRESSION = "linear_regression";
const METHOD_POLYNOMIAL_REGRESSION = "polynomial_regression";
const METHOD_TREND_ANALYSIS = "trend_analysis";
const METHOD_ANOMALY_DETECTION = "anomaly_detection";

// ── Deterministic Hashing ────────────────────────────────────

/**
 * Generate a deterministic SHA-256 hash for given input data + method + params.
 * Used to uniquely identify a compute run for caching and reproducibility.
 */
export async function computeDeterministicHash(
    method: string,
    methodVersion: string,
    params: Record<string, unknown>,
    inputData: number[][]
): Promise<string> {
    const payload = JSON.stringify({
        method,
        methodVersion,
        params,
        inputData,
    });

    // Use Web Crypto API (available in Node 18+ and all modern browsers)
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Linear Regression (OLS) ──────────────────────────────────

/**
 * Ordinary Least Squares linear regression: y = mx + b
 * Uses normal equation: β = (X^T X)^(-1) X^T y
 *
 * Pure mathjs — fully deterministic.
 */
export function linearRegression(
    xValues: number[],
    yValues: number[]
): RegressionResult {
    if (xValues.length !== yValues.length || xValues.length < 2) {
        throw new Error(
            `linearRegression: need ≥2 matched pairs, got x=${xValues.length}, y=${yValues.length}`
        );
    }

    const n = xValues.length;

    // Build design matrix [1, x] for intercept + slope
    const X = matrix(xValues.map((x) => [1, x]));
    const Y = matrix(yValues.map((y) => [y]));

    // Normal equation: β = (X^T X)^(-1) X^T y
    const Xt = transpose(X) as Matrix;
    const XtX = multiply(Xt, X) as Matrix;
    const XtXinv = inv(XtX) as Matrix;
    const XtY = multiply(Xt, Y) as Matrix;
    const beta = multiply(XtXinv, XtY) as Matrix;

    const intercept = beta.get([0, 0]) as number;
    const slope = beta.get([1, 0]) as number;

    // Calculate R² (coefficient of determination)
    const yMean = mathjsMean(yValues) as number;
    let ssTot = 0;
    let ssRes = 0;

    for (let i = 0; i < n; i++) {
        const predicted = slope * xValues[i] + intercept;
        ssRes += (yValues[i] - predicted) ** 2;
        ssTot += (yValues[i] - yMean) ** 2;
    }

    const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

    // Standard error of the slope
    const mse = ssRes / (n - 2);
    const xMean = mathjsMean(xValues) as number;
    const sxx = xValues.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
    const slopeStdError = Math.sqrt(mse / sxx);

    return {
        method: METHOD_LINEAR_REGRESSION,
        methodVersion: ENGINE_VERSION,
        slope,
        intercept,
        rSquared,
        standardError: slopeStdError,
        pValue: undefined, // t-distribution CDF not in mathjs; flagged for Phase D
        n,
        equation: `y = ${slope.toFixed(6)}x + ${intercept.toFixed(6)}`,
    };
}

// ── Polynomial Regression ────────────────────────────────────

/**
 * Polynomial regression of degree `degree`.
 * Uses normal equation with Vandermonde matrix.
 */
export function polynomialRegression(
    xValues: number[],
    yValues: number[],
    degree = 2
): RegressionResult & { coefficients: number[] } {
    if (xValues.length !== yValues.length || xValues.length < degree + 1) {
        throw new Error(
            `polynomialRegression: need ≥${degree + 1} points for degree ${degree}`
        );
    }

    const n = xValues.length;

    // Build Vandermonde matrix
    const X = matrix(
        xValues.map((x) => {
            const row = [];
            for (let d = 0; d <= degree; d++) {
                row.push(x ** d);
            }
            return row;
        })
    );
    const Y = matrix(yValues.map((y) => [y]));

    const Xt = transpose(X) as Matrix;
    const XtX = multiply(Xt, X) as Matrix;
    const XtXinv = inv(XtX) as Matrix;
    const XtY = multiply(Xt, Y) as Matrix;
    const beta = multiply(XtXinv, XtY) as Matrix;

    // Extract coefficients [c0, c1, c2, ...]
    const coefficients: number[] = [];
    for (let d = 0; d <= degree; d++) {
        coefficients.push(beta.get([d, 0]) as number);
    }

    // Calculate R²
    const yMean = mathjsMean(yValues) as number;
    let ssTot = 0;
    let ssRes = 0;

    for (let i = 0; i < n; i++) {
        let predicted = 0;
        for (let d = 0; d <= degree; d++) {
            predicted += coefficients[d] * xValues[i] ** d;
        }
        ssRes += (yValues[i] - predicted) ** 2;
        ssTot += (yValues[i] - yMean) ** 2;
    }

    const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

    // Build equation string
    const terms = coefficients.map((c, d) => {
        if (d === 0) return c.toFixed(6);
        if (d === 1) return `${c.toFixed(6)}x`;
        return `${c.toFixed(6)}x^${d}`;
    });

    return {
        method: METHOD_POLYNOMIAL_REGRESSION,
        methodVersion: ENGINE_VERSION,
        slope: coefficients[1] ?? 0,
        intercept: coefficients[0],
        rSquared,
        standardError: undefined,
        pValue: undefined,
        n,
        equation: `y = ${terms.reverse().join(" + ")}`,
        coefficients,
    };
}

// ── Trend Analysis ───────────────────────────────────────────

/**
 * Analyse trend of data points: classify as increasing, decreasing,
 * non-monotonic, or flat based on linear regression slope.
 */
export function trendAnalysis(
    points: ScientificDataPoint[]
): TrendAnalysisResult {
    if (points.length < 2) {
        return {
            trend: "flat",
            slope: 0,
            rSquared: 0,
            changePercent: 0,
            description: "Insufficient data points for trend analysis.",
        };
    }

    const xVals = points.map((p) => p.xValue);
    const yVals = points.map((p) => p.yValue);

    const reg = linearRegression(xVals, yVals);

    // Determine trend direction
    const slopeThreshold = 0.001; // near-zero slope → flat
    let trend: TrendAnalysisResult["trend"];

    if (Math.abs(reg.slope) < slopeThreshold) {
        trend = "flat";
    } else if (reg.rSquared < 0.3) {
        trend = "non-monotonic";
    } else {
        trend = reg.slope > 0 ? "increasing" : "decreasing";
    }

    // Calculate overall change percentage
    const yFirst = yVals[0];
    const yLast = yVals[yVals.length - 1];
    const changePercent =
        yFirst !== 0 ? ((yLast - yFirst) / Math.abs(yFirst)) * 100 : 0;

    // Build description
    const direction =
        trend === "flat"
            ? "remained stable"
            : trend === "non-monotonic"
                ? "showed non-monotonic behavior"
                : trend === "increasing"
                    ? `increased (slope=${reg.slope.toFixed(4)})`
                    : `decreased (slope=${reg.slope.toFixed(4)})`;

    return {
        trend,
        slope: reg.slope,
        rSquared: reg.rSquared,
        changePercent,
        description: `${points[0].variableYName} ${direction} over ${points.length} observations (R²=${reg.rSquared.toFixed(4)}, Δ=${changePercent.toFixed(1)}%).`,
    };
}

// ── Anomaly Detection ────────────────────────────────────────

/**
 * Simple Z-score anomaly detection.
 * Points beyond `threshold` standard deviations from mean are flagged.
 */
export function anomalyDetection(
    points: ScientificDataPoint[],
    threshold = 2.0
): AnomalyResult[] {
    if (points.length < 3) return [];

    const yValues = points.map((p) => p.yValue);
    const yMean = mathjsMean(yValues) as number;
    const yStd = mathjsStd(yValues, "uncorrected") as number;

    if (yStd === 0) return []; // No variance → no anomalies

    const anomalies: AnomalyResult[] = [];

    for (let i = 0; i < points.length; i++) {
        const zScore = (points[i].yValue - yMean) / yStd;

        if (Math.abs(zScore) >= threshold) {
            anomalies.push({
                pointIndex: i,
                dataPoint: points[i],
                zScore,
                reason:
                    Math.abs(zScore) >= 3
                        ? `Extreme outlier (z=${zScore.toFixed(2)})`
                        : `Outlier (z=${zScore.toFixed(2)})`,
            });
        }
    }

    return anomalies;
}

// ── Orchestrator ─────────────────────────────────────────────

/**
 * Run full statistical analysis on a set of data points.
 * Returns regression, trend, anomalies, and deterministic hash.
 */
export async function runFullAnalysis(points: ScientificDataPoint[]): Promise<{
    regression: RegressionResult;
    trend: TrendAnalysisResult;
    anomalies: AnomalyResult[];
    deterministicHash: string;
}> {
    const xVals = points.map((p) => p.xValue);
    const yVals = points.map((p) => p.yValue);

    const regression = linearRegression(xVals, yVals);
    const trend = trendAnalysis(points);
    const anomalies = anomalyDetection(points);

    const deterministicHash = await computeDeterministicHash(
        "full_analysis",
        ENGINE_VERSION,
        { threshold: 2.0 },
        points.map((p) => [p.xValue, p.yValue])
    );

    return { regression, trend, anomalies, deterministicHash };
}
