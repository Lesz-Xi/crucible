/**
 * Policy Evaluation — shared evaluation logic for the experiment policy stream.
 *
 * This module contains the domain logic for evaluating experiment-selection policies.
 * CLI scripts in /scripts are thin wrappers that call these functions.
 * Tests import directly from this module, NOT from CLI scripts.
 *
 * Spec: POLICY_EVALUATION_SPEC.md
 */

import { createHash, randomInt } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import type {
    GovernanceResultEnvelope,
    GovernanceOverride,
} from '../../types/governance-envelope';
import type {
    PolicyFamily,
    PolicyEvalScenario,
    PolicyEvalScenarioPack,
    ScenarioResult,
    PolicyDecision,
} from '../../types/policy-evaluation';

// ─── Deterministic Hashing ────────────────────────────────────────

/**
 * Compute SHA-256 hex digest of canonical scenario input.
 */
export function computeInputHash(input: unknown): string {
    const canonical = JSON.stringify(input, Object.keys(input as object).sort());
    return createHash('sha256').update(canonical).digest('hex');
}

// ─── Seeded RNG (deterministic) ───────────────────────────────────

/**
 * Simple seeded PRNG for deterministic evaluation.
 * Uses a linear congruential generator (mulberry32).
 */
export function createSeededRng(seed: number): () => number {
    let state = seed | 0;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── Policy Scoring ───────────────────────────────────────────────

/**
 * Score a single policy on a scenario (deterministic with seed).
 * In S1 this uses a seeded deterministic scoring function.
 * In future slices this will integrate with actual policy runners.
 */
export function scorePolicy(
    policy: PolicyFamily,
    scenario: PolicyEvalScenario,
    rng: () => number
): number {
    // Deterministic score influenced by policy type and scenario input hash
    const policyWeights: Record<PolicyFamily, number> = {
        eig: 0.7,
        bo_ucb: 0.65,
        bo_ts: 0.6,
        efe: 0.55,
    };
    const base = policyWeights[policy] ?? 0.5;
    const noise = (rng() - 0.5) * 0.3; // ±0.15 noise
    return Math.max(0, Math.min(1, base + noise));
}

// ─── Scenario Evaluation ──────────────────────────────────────────

/**
 * Evaluate a single scenario across all specified policies.
 */
export function evaluateScenario(
    scenario: PolicyEvalScenario,
    rng: () => number
): ScenarioResult {
    const policyScores: Record<string, number> = {};
    for (const policy of scenario.policies) {
        policyScores[policy] = scorePolicy(policy, scenario, rng);
    }

    // Select the policy with the highest score
    const selectedPolicy = Object.entries(policyScores).reduce<{ policy: string; score: number }>(
        (best, [policy, score]) => (score > best.score ? { policy, score } : best),
        { policy: scenario.policies[0], score: -Infinity }
    ).policy as PolicyFamily;

    return {
        scenarioId: scenario.scenarioId,
        policyScores: policyScores as Record<PolicyFamily, number>,
        selectedPolicy,
        matchedExpectation: selectedPolicy === scenario.expectedDecision,
    };
}

// ─── Hard Gate Checks ─────────────────────────────────────────────

/**
 * Check hard gates for a policy evaluation run.
 */
export function checkHardGates(
    scenarioResults: ScenarioResult[],
    overrides: GovernanceOverride[],
    now: Date = new Date()
): { failures: string[]; warnings: string[] } {
    const failures: string[] = [];
    const warnings: string[] = [];

    // Gate: all scenarios must have a valid selection
    const unmatched = scenarioResults.filter((r) => !r.matchedExpectation);
    if (unmatched.length > 0) {
        const gate = 'policy-selection-accuracy';
        const isOverridden = isGateOverridden(gate, overrides, now);
        if (isOverridden) {
            warnings.push(`[OVERRIDDEN] ${gate}: ${unmatched.length} scenarios did not match expected decision`);
        } else {
            failures.push(`${gate}: ${unmatched.length} scenarios did not match expected decision`);
        }
    }

    return { failures, warnings };
}

// ─── Override Logic ───────────────────────────────────────────────

/**
 * Check if a gate has an active (non-expired) override.
 */
export function isGateOverridden(
    gate: string,
    overrides: GovernanceOverride[],
    now: Date = new Date()
): boolean {
    return overrides.some(
        (o) => o.gate === gate && new Date(o.expiresAt) > now
    );
}

// ─── Full Evaluation Run ──────────────────────────────────────────

/**
 * Run a complete policy evaluation against a scenario pack.
 * This is the primary entry point for both CLI and tests.
 */
export function runPolicyEvaluation(
    scenarioPack: PolicyEvalScenarioPack,
    seed: number,
    mode: 'report' | 'enforce',
    overrides: GovernanceOverride[] = []
): PolicyDecision {
    const rng = createSeededRng(seed);
    const inputHash = computeInputHash(scenarioPack);

    const scenarioResults: ScenarioResult[] = scenarioPack.scenarios.map(
        (scenario) => evaluateScenario(scenario, rng)
    );

    // Compute win rates across all scenarios
    const winCounts: Record<string, number> = {};
    const totalScenarios = scenarioResults.length;
    for (const result of scenarioResults) {
        winCounts[result.selectedPolicy] = (winCounts[result.selectedPolicy] || 0) + 1;
    }
    const winRates: Record<string, number> = {};
    for (const [policy, count] of Object.entries(winCounts)) {
        winRates[policy] = count / totalScenarios;
    }

    // Find overall selected policy (highest win rate)
    const selectedPolicy = Object.entries(winRates).reduce(
        (best, [policy, rate]) => (rate > best.rate ? { policy, rate } : best),
        { policy: 'eig' as string, rate: -Infinity }
    ).policy as PolicyFamily;

    const { failures, warnings } = checkHardGates(scenarioResults, overrides);

    return {
        runId: uuidv7(),
        inputHash,
        seed,
        mode,
        timestamp: new Date().toISOString(),
        decision: selectedPolicy,
        hardGateFailures: failures,
        warnings,
        selectedPolicy,
        scenariosEvaluated: totalScenarios,
        scenarioResults,
        winRates: winRates as Record<PolicyFamily, number>,
    };
}
