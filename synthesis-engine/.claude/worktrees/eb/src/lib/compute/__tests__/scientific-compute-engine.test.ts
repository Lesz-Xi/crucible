// =============================================================
// Automated Scientist: Compute Engine Unit Tests
// Verifies deterministic, reproducible outputs from mathjs.
// =============================================================

import { describe, it, expect } from "vitest";
import {
    linearRegression,
    polynomialRegression,
    trendAnalysis,
    anomalyDetection,
    computeDeterministicHash,
    runFullAnalysis,
} from "../scientific-compute-engine";
import type { ScientificDataPoint } from "../../../types/scientific-data";

// ── Helper ───────────────────────────────────────────────────

function makePoints(
    xVals: number[],
    yVals: number[],
    xName = "x",
    yName = "y"
): ScientificDataPoint[] {
    return xVals.map((x, i) => ({
        id: `pt-${i}`,
        variableXName: xName,
        variableYName: yName,
        xValue: x,
        yValue: yVals[i],
        createdAt: new Date().toISOString(),
    }));
}

// ── Linear Regression ────────────────────────────────────────

describe("linearRegression", () => {
    it("returns perfect fit for y = 2x + 1", () => {
        const x = [1, 2, 3, 4, 5];
        const y = x.map((v) => 2 * v + 1);
        const result = linearRegression(x, y);

        expect(result.slope).toBeCloseTo(2, 6);
        expect(result.intercept).toBeCloseTo(1, 6);
        expect(result.rSquared).toBeCloseTo(1, 6);
        expect(result.n).toBe(5);
        expect(result.method).toBe("linear_regression");
        expect(result.methodVersion).toBe("1.0.0");
    });

    it("handles noisy data with reasonable R²", () => {
        const x = [1, 2, 3, 4, 5, 6, 7, 8];
        const y = [2.1, 4.3, 5.8, 8.1, 10.3, 11.9, 14.2, 16.1];
        const result = linearRegression(x, y);

        expect(result.slope).toBeGreaterThan(1.5);
        expect(result.rSquared).toBeGreaterThan(0.95);
        expect(result.n).toBe(8);
    });

    it("throws for fewer than 2 points", () => {
        expect(() => linearRegression([1], [2])).toThrow();
    });

    it("is deterministic (same input → same output)", () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2.3, 4.1, 6.2, 7.9, 10.1];

        const r1 = linearRegression(x, y);
        const r2 = linearRegression(x, y);

        expect(r1.slope).toBe(r2.slope);
        expect(r1.intercept).toBe(r2.intercept);
        expect(r1.rSquared).toBe(r2.rSquared);
    });
});

// ── Polynomial Regression ────────────────────────────────────

describe("polynomialRegression", () => {
    it("fits a quadratic y = x²", () => {
        const x = [1, 2, 3, 4, 5];
        const y = x.map((v) => v * v);
        const result = polynomialRegression(x, y, 2);

        expect(result.coefficients[2]).toBeCloseTo(1, 4);
        expect(result.rSquared).toBeCloseTo(1, 4);
    });

    it("gives better fit than linear for quadratic data", () => {
        const x = [1, 2, 3, 4, 5];
        const y = x.map((v) => v * v + 0.5 * v);

        const lin = linearRegression(x, y);
        const poly = polynomialRegression(x, y, 2);

        expect(poly.rSquared).toBeGreaterThan(lin.rSquared);
    });
});

// ── Trend Analysis ───────────────────────────────────────────

describe("trendAnalysis", () => {
    it("detects increasing trend", () => {
        const points = makePoints([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
        const result = trendAnalysis(points);

        expect(result.trend).toBe("increasing");
        expect(result.slope).toBeGreaterThan(0);
        expect(result.changePercent).toBeGreaterThan(0);
    });

    it("detects decreasing trend", () => {
        const points = makePoints([1, 2, 3, 4, 5], [50, 40, 30, 20, 10]);
        const result = trendAnalysis(points);

        expect(result.trend).toBe("decreasing");
        expect(result.slope).toBeLessThan(0);
    });

    it("returns flat for insufficient data", () => {
        const points = makePoints([1], [10]);
        const result = trendAnalysis(points);

        expect(result.trend).toBe("flat");
    });
});

// ── Anomaly Detection ────────────────────────────────────────

describe("anomalyDetection", () => {
    it("detects obvious outlier", () => {
        const points = makePoints(
            [1, 2, 3, 4, 5, 6, 7],
            [10, 11, 10, 10, 11, 10, 100] // 100 is anomalous
        );
        const anomalies = anomalyDetection(points, 2.0);

        expect(anomalies.length).toBeGreaterThan(0);
        expect(anomalies[0].pointIndex).toBe(6);
        expect(anomalies[0].zScore).toBeGreaterThan(2);
    });

    it("returns empty for uniform data", () => {
        const points = makePoints([1, 2, 3, 4, 5], [10, 10, 10, 10, 10]);
        const anomalies = anomalyDetection(points);

        expect(anomalies.length).toBe(0);
    });

    it("returns empty for fewer than 3 points", () => {
        const points = makePoints([1, 2], [10, 100]);
        const anomalies = anomalyDetection(points);

        expect(anomalies.length).toBe(0);
    });
});

// ── Deterministic Hash ───────────────────────────────────────

describe("computeDeterministicHash", () => {
    it("produces consistent hash for same inputs", async () => {
        const h1 = await computeDeterministicHash(
            "test", "1.0.0", { a: 1 }, [[1, 2], [3, 4]]
        );
        const h2 = await computeDeterministicHash(
            "test", "1.0.0", { a: 1 }, [[1, 2], [3, 4]]
        );

        expect(h1).toBe(h2);
        expect(h1).toHaveLength(64); // SHA-256 hex
    });

    it("produces different hash for different inputs", async () => {
        const h1 = await computeDeterministicHash(
            "test", "1.0.0", { a: 1 }, [[1, 2]]
        );
        const h2 = await computeDeterministicHash(
            "test", "1.0.0", { a: 2 }, [[1, 2]]
        );

        expect(h1).not.toBe(h2);
    });
});

// ── Full Analysis Orchestrator ───────────────────────────────

describe("runFullAnalysis", () => {
    it("runs complete pipeline and returns all components", async () => {
        const points = makePoints(
            [1, 2, 3, 4, 5, 6, 7, 8],
            [2, 4, 6, 8, 10, 12, 14, 16]
        );

        const result = await runFullAnalysis(points);

        expect(result.regression.slope).toBeCloseTo(2, 4);
        expect(result.regression.rSquared).toBeCloseTo(1, 4);
        expect(result.trend.trend).toBe("increasing");
        expect(result.anomalies).toHaveLength(0);
        expect(result.deterministicHash).toHaveLength(64);
    });

    it("is reproducible (same hash for same data)", async () => {
        const points = makePoints([1, 2, 3, 4], [3, 5, 7, 9]);

        const r1 = await runFullAnalysis(points);
        const r2 = await runFullAnalysis(points);

        expect(r1.deterministicHash).toBe(r2.deterministicHash);
        expect(r1.regression.slope).toBe(r2.regression.slope);
    });
});
