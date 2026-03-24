/**
 * Policy Evaluation Types — per-stream types for the experiment policy evaluation stream.
 * Spec: POLICY_EVALUATION_SPEC.md
 *
 * These types extend GovernanceResultEnvelope for the policy-eval governance stream.
 */

import { GovernanceResultEnvelope } from './governance-envelope';

// ─── Policy Families ───────────────────────────────────────────────

/** Supported experiment-selection policy identifiers */
export type PolicyFamily = 'eig' | 'bo_ucb' | 'bo_ts' | 'efe';

/** Descriptor for a single policy family */
export interface PolicyFamilyDescriptor {
    id: PolicyFamily;
    displayName: string;
    description: string;
    /** Whether this policy is enabled for evaluation */
    enabled: boolean;
}

// ─── Scenarios ─────────────────────────────────────────────────────

/** A single evaluation scenario for policy comparison */
export interface PolicyEvalScenario {
    /** Stable scenario identifier */
    scenarioId: string;
    /** Human-readable label */
    label: string;
    /** Policy families to evaluate in this scenario */
    policies: PolicyFamily[];
    /** Scenario input parameters (domain-specific) */
    input: Record<string, unknown>;
    /** Expected hard gates that should trigger */
    expectedHardGates: string[];
    /** Expected winning policy decision */
    expectedDecision: string;
}

/** Top-level scenario pack schema */
export interface PolicyEvalScenarioPack {
    version: string;
    scenarios: PolicyEvalScenario[];
}

// ─── Results ───────────────────────────────────────────────────────

/** Result of evaluating a single scenario */
export interface ScenarioResult {
    scenarioId: string;
    /** Per-policy scores in this scenario */
    policyScores: Record<PolicyFamily, number>;
    /** Which policy was selected */
    selectedPolicy: PolicyFamily;
    /** Whether selection matched expectedDecision */
    matchedExpectation: boolean;
}

/** Policy decision — top-level evaluation result extending the shared envelope */
export interface PolicyDecision extends GovernanceResultEnvelope {
    /** The policy family selected as best */
    selectedPolicy: PolicyFamily;
    /** Total number of scenarios evaluated */
    scenariosEvaluated: number;
    /** Per-scenario result details */
    scenarioResults: ScenarioResult[];
    /** Aggregate win rates per policy */
    winRates: Record<PolicyFamily, number>;
}

// ─── Promotion ─────────────────────────────────────────────────────

/** Promotion record specific to the policy-eval stream */
export interface PolicyPromotionRecord {
    promotedAt: string;
    qualifyingRunId: string;
    seedsVerified: number[];
    policyId: PolicyFamily;
    winRate: number;
    approvedBy: string;
}
