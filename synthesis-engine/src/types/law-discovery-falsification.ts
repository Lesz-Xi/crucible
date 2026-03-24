/**
 * Law Discovery & Falsification Types — per-stream types for the law-candidate lifecycle stream.
 * Spec: LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md
 *
 * These types extend GovernanceResultEnvelope for the law-falsification governance stream.
 */

import { GovernanceResultEnvelope } from './governance-envelope';

// ─── Law Lifecycle ─────────────────────────────────────────────────

/** Valid states in the law-candidate lifecycle */
export type LawLifecycleState = 'proposed' | 'tested' | 'falsified' | 'confirmed' | 'retracted';

// ─── Evidence ──────────────────────────────────────────────────────

/** Evidence basis for a law candidate */
export interface EvidenceBasis {
    /** Reference to original data/experiment */
    sourceId: string;
    /** Type of evidence source */
    sourceType: 'experiment' | 'observation' | 'cross-domain-transfer';
    /** Brief description of the evidence */
    summary: string;
    /** Evidence strength assessment */
    strength: 'strong' | 'moderate' | 'weak';
    /** ISO-8601 timestamp of evidence collection */
    timestamp: string;
}

/** Counter-evidence produced by falsification methods */
export interface FalsificationEvidence {
    /** Which falsification method produced this */
    method: 'counterfactual' | 'boundary-condition' | 'cross-domain' | 'contradiction' | 'replication';
    /** Description of the counter-evidence */
    description: string;
    /** Severity: how damaging is this to the candidate */
    severity: 'critical' | 'significant' | 'minor';
    /** ISO-8601 timestamp */
    timestamp: string;
}

// ─── Law Candidate ─────────────────────────────────────────────────

/** A candidate scientific law under lifecycle governance */
export interface LawCandidate {
    /** UUIDv7 identifier */
    id: string;
    /** Human-readable law statement */
    hypothesis: string;
    /** Optional symbolic / mathematical form */
    formalExpression?: string;
    /** Domain classifier key from domain-profiles */
    domain: string;
    /** Supporting evidence */
    evidenceBasis: EvidenceBasis[];
    /** Counter-evidence from falsification attempts */
    falsificationEvidence: FalsificationEvidence[];
    /** Current lifecycle state */
    status: LawLifecycleState;
    /** ISO-8601 proposal timestamp */
    proposedAt: string;
    /** ISO-8601 last state transition timestamp */
    lastTransitionAt: string;
    /** What would disprove this law */
    falsificationCriteria: string;
    /** 0–1 calibrated confidence */
    confidenceScore: number;
    /** Whether the candidate has been disqualified */
    disqualified: boolean;
    /** Reasons for disqualification (empty if not disqualified) */
    disqualifyReasons: string[];
}

// ─── Evaluation Result ─────────────────────────────────────────────

/** Law evaluation result extending the shared governance envelope */
export interface LawEvaluationResult extends GovernanceResultEnvelope {
    /** ID of the candidate being evaluated */
    candidateId: string;
    /** State before this evaluation */
    previousState: LawLifecycleState;
    /** State after this evaluation */
    newState: LawLifecycleState;
    /** Whether the state transition was valid */
    transitionValid: boolean;
    /** Falsification methods applied during this evaluation */
    falsificationMethodsApplied: string[];
    /** Evidence summary counts */
    evidenceSummary: {
        supporting: number;
        contradicting: number;
        replications: number;
    };
    /** Active disqualifiers (empty if eligible) */
    disqualifiers: string[];
    /** Whether a terminal state was reached */
    lifecycleComplete: boolean;
}

// ─── Scenarios ─────────────────────────────────────────────────────

/** A single evaluation scenario for law falsification */
export interface LawFalsificationScenario {
    scenarioId: string;
    label: string;
    /** The candidate to evaluate */
    candidate: LawCandidate;
    /** Requested state transition */
    requestedTransition: {
        from: LawLifecycleState;
        to: LawLifecycleState;
    };
    /** Additional evidence to apply (if any) */
    additionalEvidence?: EvidenceBasis[];
    /** Additional falsification evidence to apply (if any) */
    additionalFalsificationEvidence?: FalsificationEvidence[];
    expectedHardGates: string[];
    expectedDecision: string;
}

/** Top-level scenario pack schema */
export interface LawFalsificationScenarioPack {
    version: string;
    scenarios: LawFalsificationScenario[];
}
