/**
 * Governance Result Envelope — shared base for all governance evaluation results.
 *
 * All per-stream result types (policy-eval, causal-method, uncertainty-calibration,
 * law-falsification) extend this envelope to ensure a consistent top-level shape.
 *
 * Determinism invariant: identical (inputHash + seed + mode) must produce
 * identical (decision + hardGateFailures).
 */

export interface GovernanceResultEnvelope {
    /** UUIDv7 identifying this evaluation run */
    runId: string;
    /** SHA-256 hex digest of the canonical scenario input */
    inputHash: string;
    /** Deterministic seed used for this run */
    seed: number;
    /** Execution mode — report (S1 default) or enforce (S2+) */
    mode: 'report' | 'enforce';
    /** ISO-8601 timestamp of evaluation completion */
    timestamp: string;
    /** Stream-specific decision value (e.g. policy name, method id, gate pass/fail) */
    decision: string;
    /** List of hard gates that failed; empty on success */
    hardGateFailures: string[];
    /** Non-blocking warnings for human review */
    warnings: string[];
}

/**
 * Override entry — used in per-stream override files to temporarily suppress gate failures.
 */
export interface GovernanceOverride {
    /** Unique override identifier */
    id: string;
    /** Name of the gate being overridden */
    gate: string;
    /** Tracking ticket reference (e.g. GOV-042) */
    ticket: string;
    /** Human-readable justification */
    reason: string;
    /** ISO-8601 expiration — override is ignored after this time */
    expiresAt: string;
}

/**
 * Promotion record — appended to per-stream ledger files when a configuration
 * is promoted from experimental to trusted.
 */
export interface GovernancePromotionRecord {
    /** ISO-8601 promotion timestamp */
    promotedAt: string;
    /** Run ID of the evaluation that qualified this promotion */
    qualifyingRunId: string;
    /** Seeds used to verify determinism */
    seedsVerified: number[];
    /** Hash of the configuration being promoted */
    configHash: string;
    /** Who approved (USER or CI bot) */
    approvedBy: string;
}
