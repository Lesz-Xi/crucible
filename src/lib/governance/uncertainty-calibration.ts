/**
 * Uncertainty Calibration — shared evaluation logic for the uncertainty calibration stream.
 *
 * This module contains the domain logic for evaluating confidence calibration quality
 * and enforcing calibration gates. CLI scripts are thin wrappers around this.
 *
 * Spec: UNCERTAINTY_CALIBRATION_GATES.md
 */

import { createHash } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import type { GovernanceOverride } from '../../types/governance-envelope';
import type {
    CalibrationLevel,
    CalibrationMetric,
    GateResult,
    ConfidenceReport,
    UncertaintyCalibrationScenario,
    UncertaintyCalibrationScenarioPack,
} from '../../types/uncertainty-calibration';

// ─── Deterministic Hashing ────────────────────────────────────────

export function computeInputHash(input: unknown): string {
    const canonical = JSON.stringify(input, Object.keys(input as object).sort());
    return createHash('sha256').update(canonical).digest('hex');
}

// ─── Calibration Metrics ──────────────────────────────────────────

/**
 * Compute Expected Calibration Error (ECE) from prediction-confidence pairs.
 * Bins predictions by confidence and measures gap between confidence and accuracy.
 */
export function computeECE(
    predictions: Array<{ predicted: number; confidence: number; actual: number }>,
    bins: number = 10
): number {
    if (predictions.length === 0) return 0;

    const binEdges = Array.from({ length: bins + 1 }, (_, i) => i / bins);
    let ece = 0;
    const n = predictions.length;

    for (let i = 0; i < bins; i++) {
        const lo = binEdges[i];
        const hi = binEdges[i + 1];
        const binPreds = predictions.filter(
            (p) => p.confidence >= lo && p.confidence < (i === bins - 1 ? hi + 0.001 : hi)
        );

        if (binPreds.length === 0) continue;

        const avgConfidence = binPreds.reduce((s, p) => s + p.confidence, 0) / binPreds.length;
        const accuracy =
            binPreds.filter((p) => Math.abs(p.predicted - p.actual) < 0.5).length / binPreds.length;

        ece += (binPreds.length / n) * Math.abs(avgConfidence - accuracy);
    }

    return ece;
}

/**
 * Compute Maximum Calibration Error (MCE) — the maximum bin-level calibration gap.
 */
export function computeMCE(
    predictions: Array<{ predicted: number; confidence: number; actual: number }>,
    bins: number = 10
): number {
    if (predictions.length === 0) return 0;

    const binEdges = Array.from({ length: bins + 1 }, (_, i) => i / bins);
    let mce = 0;

    for (let i = 0; i < bins; i++) {
        const lo = binEdges[i];
        const hi = binEdges[i + 1];
        const binPreds = predictions.filter(
            (p) => p.confidence >= lo && p.confidence < (i === bins - 1 ? hi + 0.001 : hi)
        );

        if (binPreds.length === 0) continue;

        const avgConfidence = binPreds.reduce((s, p) => s + p.confidence, 0) / binPreds.length;
        const accuracy =
            binPreds.filter((p) => Math.abs(p.predicted - p.actual) < 0.5).length / binPreds.length;

        mce = Math.max(mce, Math.abs(avgConfidence - accuracy));
    }

    return mce;
}

/**
 * Compute Brier score (lower is better).
 */
export function computeBrierScore(
    predictions: Array<{ predicted: number; confidence: number; actual: number }>
): number {
    if (predictions.length === 0) return 0;
    const n = predictions.length;
    return (
        predictions.reduce((sum, p) => {
            const outcome = Math.abs(p.predicted - p.actual) < 0.5 ? 1 : 0;
            return sum + (p.confidence - outcome) ** 2;
        }, 0) / n
    );
}

/**
 * Classify calibration quality level.
 */
export function classifyCalibration(ece: number): CalibrationLevel {
    if (ece < 0.02) return 'excellent';
    if (ece < 0.05) return 'good';
    if (ece < 0.10) return 'fair';
    if (ece < 0.20) return 'poor';
    return 'uncalibrated';
}

/**
 * Compute full calibration metrics for a set of predictions.
 */
export function computeCalibrationMetrics(
    predictions: Array<{ predicted: number; confidence: number; actual: number }>,
    bins: number = 10
): CalibrationMetric {
    const ece = computeECE(predictions, bins);
    const mce = computeMCE(predictions, bins);
    const brierScore = computeBrierScore(predictions);
    const level = classifyCalibration(ece);

    return { ece, mce, brierScore, reliabilityBins: bins, level };
}

// ─── Gate Evaluation ──────────────────────────────────────────────

/** Default gate configuration */
interface GateConfig {
    gateId: string;
    gateName: string;
    type: 'hard' | 'soft';
    threshold: number;
    direction: 'below' | 'above';
    getValue: (metrics: CalibrationMetric) => number;
}

const DEFAULT_GATES: GateConfig[] = [
    {
        gateId: 'ece-threshold',
        gateName: 'Expected Calibration Error',
        type: 'hard',
        threshold: 0.10,
        direction: 'below',
        getValue: (m) => m.ece,
    },
    {
        gateId: 'mce-threshold',
        gateName: 'Maximum Calibration Error',
        type: 'hard',
        threshold: 0.25,
        direction: 'below',
        getValue: (m) => m.mce,
    },
    {
        gateId: 'brier-threshold',
        gateName: 'Brier Score',
        type: 'soft',
        threshold: 0.15,
        direction: 'below',
        getValue: (m) => m.brierScore,
    },
];

// ─── Override Logic ───────────────────────────────────────────────

export function isGateOverridden(
    gate: string,
    overrides: GovernanceOverride[],
    now: Date = new Date()
): boolean {
    return overrides.some(
        (o) => o.gate === gate && new Date(o.expiresAt) > now
    );
}

/**
 * Evaluate all calibration gates.
 */
export function evaluateGates(
    metrics: CalibrationMetric,
    overrides: GovernanceOverride[],
    now: Date = new Date()
): GateResult[] {
    return DEFAULT_GATES.map((gate) => {
        const observedValue = gate.getValue(metrics);
        let passed: boolean;
        if (gate.direction === 'below') {
            passed = observedValue < gate.threshold;
        } else {
            passed = observedValue > gate.threshold;
        }

        const overridden = !passed && isGateOverridden(gate.gateId, overrides, now);
        if (overridden) {
            passed = true; // Override suppresses the failure
        }

        return {
            gateId: gate.gateId,
            gateName: gate.gateName,
            type: gate.type,
            passed,
            observedValue,
            threshold: gate.threshold,
            direction: gate.direction,
            overridden,
        };
    });
}

// ─── Full Evaluation Run ──────────────────────────────────────────

/**
 * Run a complete uncertainty calibration evaluation against a scenario pack.
 */
export function runUncertaintyCalibration(
    scenarioPack: UncertaintyCalibrationScenarioPack,
    seed: number,
    mode: 'report' | 'enforce',
    overrides: GovernanceOverride[] = []
): ConfidenceReport[] {
    const inputHash = computeInputHash(scenarioPack);

    return scenarioPack.scenarios.map((scenario) => {
        const calibration = computeCalibrationMetrics(scenario.predictions);
        const gateResults = evaluateGates(calibration, overrides);

        const hardFailures = gateResults
            .filter((g) => g.type === 'hard' && !g.passed)
            .map((g) => `${g.gateId}: ${g.observedValue.toFixed(4)} ${g.direction === 'below' ? '>=' : '<='} ${g.threshold}`);

        const softWarnings = gateResults
            .filter((g) => g.type === 'soft' && !g.passed)
            .map((g) => `${g.gateId}: ${g.observedValue.toFixed(4)} ${g.direction === 'below' ? '>=' : '<='} ${g.threshold}`);

        const overriddenWarnings = gateResults
            .filter((g) => g.overridden)
            .map((g) => `[OVERRIDDEN] ${g.gateId}`);

        return {
            runId: uuidv7(),
            inputHash,
            seed,
            mode,
            timestamp: new Date().toISOString(),
            decision: calibration.level,
            hardGateFailures: hardFailures,
            warnings: [...softWarnings, ...overriddenWarnings],
            calibration,
            gateResults,
            predictionCount: scenario.predictions.length,
            hardGateFailureCount: hardFailures.length,
            softGateWarningCount: softWarnings.length,
        };
    });
}
