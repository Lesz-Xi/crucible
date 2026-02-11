/**
 * Uncertainty Calibration Types — per-stream types for the uncertainty calibration stream.
 * Spec: UNCERTAINTY_CALIBRATION_GATES.md
 *
 * These types extend GovernanceResultEnvelope for the uncertainty-calibration governance stream.
 */

import { GovernanceResultEnvelope } from './governance-envelope';

// ─── Calibration Levels ────────────────────────────────────────────

/** Calibration quality level */
export type CalibrationLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'uncalibrated';

// ─── Calibration Metrics ───────────────────────────────────────────

/** Metrics measuring calibration quality */
export interface CalibrationMetric {
    /** Expected Calibration Error */
    ece: number;
    /** Maximum Calibration Error */
    mce: number;
    /** Brier score (lower is better) */
    brierScore: number;
    /** Reliability diagram bin count */
    reliabilityBins: number;
    /** Calibration level classification */
    level: CalibrationLevel;
}

// ─── Gate Results ──────────────────────────────────────────────────

/** Result of a single calibration gate check */
export interface GateResult {
    /** Gate identifier */
    gateId: string;
    /** Human-readable gate name */
    gateName: string;
    /** Whether this is a hard or soft gate */
    type: 'hard' | 'soft';
    /** Whether the gate passed */
    passed: boolean;
    /** Observed metric value */
    observedValue: number;
    /** Threshold for passing */
    threshold: number;
    /** Direction: 'below' means observedValue must be below threshold */
    direction: 'below' | 'above';
    /** Whether an active override suppressed this failure */
    overridden: boolean;
}

// ─── Confidence Report ─────────────────────────────────────────────

/** Top-level evaluation result extending the shared envelope */
export interface ConfidenceReport extends GovernanceResultEnvelope {
    /** Overall calibration metrics */
    calibration: CalibrationMetric;
    /** Individual gate results */
    gateResults: GateResult[];
    /** Number of predictions evaluated */
    predictionCount: number;
    /** Number of hard gates that failed */
    hardGateFailureCount: number;
    /** Number of soft gates that warned */
    softGateWarningCount: number;
}

// ─── Scenarios ─────────────────────────────────────────────────────

/** A single evaluation scenario for uncertainty calibration */
export interface UncertaintyCalibrationScenario {
    scenarioId: string;
    label: string;
    /** Simulated prediction-confidence pairs */
    predictions: Array<{
        predicted: number;
        confidence: number;
        actual: number;
    }>;
    expectedHardGates: string[];
    expectedDecision: string;
}

/** Top-level scenario pack schema */
export interface UncertaintyCalibrationScenarioPack {
    version: string;
    scenarios: UncertaintyCalibrationScenario[];
}
