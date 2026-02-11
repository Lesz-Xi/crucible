/**
 * Causal Method Policy Types — per-stream types for the causal method selection stream.
 * Spec: CAUSAL_METHOD_SELECTION_POLICY.md
 *
 * These types extend GovernanceResultEnvelope for the causal-method governance stream.
 */

import { GovernanceResultEnvelope } from './governance-envelope';

// ─── Data Regime ───────────────────────────────────────────────────

/** Classification of observational data characteristics */
export interface DataRegime {
    /** Number of observations */
    sampleSize: number;
    /** Number of variables */
    dimensionality: number;
    /** Whether interventional data is available */
    hasInterventions: boolean;
    /** Whether temporal ordering is present */
    hasTemporalOrder: boolean;
    /** Presence of known confounders */
    knownConfounders: string[];
    /** Estimated noise level: low | medium | high */
    noiseLevel: 'low' | 'medium' | 'high';
}

// ─── Method Catalog ────────────────────────────────────────────────

/** Supported causal inference methods */
export type CausalMethodId =
    | 'pc_algorithm'
    | 'fci'
    | 'ges'
    | 'lingam'
    | 'notears'
    | 'granger'
    | 'do_calculus'
    | 'scm_parametric'
    | 'propensity_score'
    | 'instrumental_variable';

/** Descriptor for a single causal method */
export interface MethodCard {
    id: CausalMethodId;
    displayName: string;
    description: string;
    /** Minimum sample size for this method */
    minSampleSize: number;
    /** Whether this method requires interventional data */
    requiresInterventions: boolean;
    /** Whether this method requires temporal ordering */
    requiresTemporalOrder: boolean;
    /** Maximum noise level this method tolerates */
    maxNoiseLevel: 'low' | 'medium' | 'high';
    /** Known disqualifying conditions */
    disqualifiers: string[];
}

// ─── Eligibility ───────────────────────────────────────────────────

/** Result of checking a method's eligibility against a data regime */
export interface EligibilityResult {
    methodId: CausalMethodId;
    eligible: boolean;
    /** Reasons for disqualification (empty if eligible) */
    disqualifyReasons: string[];
    /** Soft warnings about marginal suitability */
    warnings: string[];
}

// ─── Selection Output ──────────────────────────────────────────────

/** Result of the deterministic method selection process */
export interface SelectionOutput extends GovernanceResultEnvelope {
    /** The data regime analyzed */
    dataRegime: DataRegime;
    /** Selected method */
    selectedMethod: CausalMethodId;
    /** All methods evaluated with eligibility results */
    eligibilityResults: EligibilityResult[];
    /** Ranked list of eligible methods (best first) */
    rankedMethods: CausalMethodId[];
    /** Score assigned to selected method */
    selectionScore: number;
}

// ─── Scenarios ─────────────────────────────────────────────────────

/** A single evaluation scenario for method selection */
export interface CausalMethodScenario {
    scenarioId: string;
    label: string;
    dataRegime: DataRegime;
    expectedHardGates: string[];
    expectedDecision: string;
}

/** Top-level scenario pack schema */
export interface CausalMethodScenarioPack {
    version: string;
    scenarios: CausalMethodScenario[];
}
