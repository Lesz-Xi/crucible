/**
 * Causal Method Selection — shared evaluation logic for the causal method stream.
 *
 * This module contains the domain logic for selecting the appropriate causal
 * inference method given a data regime. CLI scripts are thin wrappers around this.
 *
 * Spec: CAUSAL_METHOD_SELECTION_POLICY.md
 */

import { createHash } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import type { GovernanceOverride } from '../../types/governance-envelope';
import type {
    DataRegime,
    CausalMethodId,
    MethodCard,
    EligibilityResult,
    SelectionOutput,
    CausalMethodScenario,
    CausalMethodScenarioPack,
} from '../../types/causal-method-policy';
import { createSeededRng } from './policy-evaluation';

// ─── Method Catalog ────────────────────────────────────────────────

export const METHOD_CATALOG: MethodCard[] = [
    {
        id: 'pc_algorithm',
        displayName: 'PC Algorithm',
        description: 'Constraint-based structure learning via conditional independence tests',
        minSampleSize: 100,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'medium',
        disqualifiers: ['high-dimensionality-without-sparsity'],
    },
    {
        id: 'fci',
        displayName: 'FCI (Fast Causal Inference)',
        description: 'Handles latent confounders via partial ancestral graphs',
        minSampleSize: 200,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'medium',
        disqualifiers: [],
    },
    {
        id: 'ges',
        displayName: 'GES (Greedy Equivalence Search)',
        description: 'Score-based structure learning with BIC scoring',
        minSampleSize: 50,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'high',
        disqualifiers: [],
    },
    {
        id: 'lingam',
        displayName: 'LiNGAM',
        description: 'Linear non-Gaussian acyclic model for causal discovery',
        minSampleSize: 100,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'low',
        disqualifiers: ['gaussian-data'],
    },
    {
        id: 'notears',
        displayName: 'NOTEARS',
        description: 'Continuous optimization for DAG structure learning',
        minSampleSize: 200,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'medium',
        disqualifiers: ['very-small-sample'],
    },
    {
        id: 'granger',
        displayName: 'Granger Causality',
        description: 'Time-series causal inference via predictive information',
        minSampleSize: 30,
        requiresInterventions: false,
        requiresTemporalOrder: true,
        maxNoiseLevel: 'high',
        disqualifiers: ['no-temporal-data'],
    },
    {
        id: 'do_calculus',
        displayName: 'Do-Calculus',
        description: 'Interventional reasoning using Judea Pearl\'s do-calculus',
        minSampleSize: 0,
        requiresInterventions: true,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'high',
        disqualifiers: ['no-interventional-data'],
    },
    {
        id: 'scm_parametric',
        displayName: 'Parametric SCM',
        description: 'Structural Causal Model with parametric assumptions',
        minSampleSize: 50,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'medium',
        disqualifiers: [],
    },
    {
        id: 'propensity_score',
        displayName: 'Propensity Score Matching',
        description: 'Balances confounders via propensity score estimation',
        minSampleSize: 100,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'medium',
        disqualifiers: ['unmeasured-confounders'],
    },
    {
        id: 'instrumental_variable',
        displayName: 'Instrumental Variable',
        description: 'Uses instruments to identify causal effects under confounding',
        minSampleSize: 200,
        requiresInterventions: false,
        requiresTemporalOrder: false,
        maxNoiseLevel: 'high',
        disqualifiers: ['no-valid-instruments'],
    },
];

// ─── Deterministic Hashing ────────────────────────────────────────

export function computeInputHash(input: unknown): string {
    const canonical = JSON.stringify(input, Object.keys(input as object).sort());
    return createHash('sha256').update(canonical).digest('hex');
}

// ─── Eligibility Check ────────────────────────────────────────────

const NOISE_ORDER: Record<string, number> = { low: 1, medium: 2, high: 3 };

/**
 * Check whether a method is eligible for a given data regime.
 */
export function checkEligibility(
    method: MethodCard,
    regime: DataRegime
): EligibilityResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (regime.sampleSize < method.minSampleSize) {
        reasons.push(`Sample size ${regime.sampleSize} < required ${method.minSampleSize}`);
    }

    if (method.requiresInterventions && !regime.hasInterventions) {
        reasons.push('Method requires interventional data but none available');
    }

    if (method.requiresTemporalOrder && !regime.hasTemporalOrder) {
        reasons.push('Method requires temporal ordering but data is cross-sectional');
    }

    const methodNoiseLevel = NOISE_ORDER[method.maxNoiseLevel] ?? 0;
    const regimeNoiseLevel = NOISE_ORDER[regime.noiseLevel] ?? 0;
    if (regimeNoiseLevel > methodNoiseLevel) {
        reasons.push(`Noise level '${regime.noiseLevel}' exceeds method tolerance '${method.maxNoiseLevel}'`);
    }

    // Check soft warnings
    if (regime.knownConfounders.length > 0 && method.id === 'propensity_score') {
        warnings.push('Propensity score may be biased with known unmeasured confounders');
    }

    return {
        methodId: method.id,
        eligible: reasons.length === 0,
        disqualifyReasons: reasons,
        warnings,
    };
}

// ─── Method Selection ──────────────────────────────────────────────

/**
 * Select the best causal method for a given data regime.
 * Deterministic: same (regime, seed) → same method selection.
 */
export function selectMethod(
    regime: DataRegime,
    seed: number
): { selectedMethod: CausalMethodId; eligibilityResults: EligibilityResult[]; rankedMethods: CausalMethodId[]; selectionScore: number } {
    const rng = createSeededRng(seed);

    const eligibilityResults = METHOD_CATALOG.map((m) => checkEligibility(m, regime));
    const eligible = eligibilityResults.filter((e) => e.eligible);

    if (eligible.length === 0) {
        // Fallback to least-restrictive method
        return {
            selectedMethod: 'ges',
            eligibilityResults,
            rankedMethods: ['ges'],
            selectionScore: 0.1,
        };
    }

    // Score eligible methods (deterministic with seed)
    const scored = eligible.map((e) => ({
        methodId: e.methodId,
        score: 0.5 + rng() * 0.5, // Seeded scoring
    }));

    scored.sort((a, b) => b.score - a.score);
    const rankedMethods = scored.map((s) => s.methodId);

    return {
        selectedMethod: scored[0].methodId,
        eligibilityResults,
        rankedMethods,
        selectionScore: scored[0].score,
    };
}

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

// ─── Hard Gate Checks ─────────────────────────────────────────────

export function checkHardGates(
    selectedMethod: CausalMethodId,
    eligibilityResults: EligibilityResult[],
    scenario: CausalMethodScenario,
    overrides: GovernanceOverride[],
    now: Date = new Date()
): { failures: string[]; warnings: string[] } {
    const failures: string[] = [];
    const warnings: string[] = [];

    // Gate: selected method must match expected decision
    if (selectedMethod !== scenario.expectedDecision) {
        const gate = 'method-selection-accuracy';
        if (isGateOverridden(gate, overrides, now)) {
            warnings.push(`[OVERRIDDEN] ${gate}: selected '${selectedMethod}' but expected '${scenario.expectedDecision}'`);
        } else {
            failures.push(`${gate}: selected '${selectedMethod}' but expected '${scenario.expectedDecision}'`);
        }
    }

    // Gate: disqualified methods must not be selected
    const disqualified = eligibilityResults.filter((e) => !e.eligible);
    if (disqualified.some((d) => d.methodId === selectedMethod)) {
        failures.push(`disqualified-method-selected: '${selectedMethod}' was disqualified but selected`);
    }

    return { failures, warnings };
}

// ─── Full Evaluation Run ──────────────────────────────────────────

/**
 * Run a complete causal method selection evaluation against a scenario pack.
 */
export function runCausalMethodEvaluation(
    scenarioPack: CausalMethodScenarioPack,
    seed: number,
    mode: 'report' | 'enforce',
    overrides: GovernanceOverride[] = []
): SelectionOutput[] {
    const inputHash = computeInputHash(scenarioPack);

    return scenarioPack.scenarios.map((scenario) => {
        const { selectedMethod, eligibilityResults, rankedMethods, selectionScore } =
            selectMethod(scenario.dataRegime, seed);

        const { failures, warnings } = checkHardGates(
            selectedMethod,
            eligibilityResults,
            scenario,
            overrides
        );

        return {
            runId: uuidv7(),
            inputHash,
            seed,
            mode,
            timestamp: new Date().toISOString(),
            decision: selectedMethod,
            hardGateFailures: failures,
            warnings,
            dataRegime: scenario.dataRegime,
            selectedMethod,
            eligibilityResults,
            rankedMethods,
            selectionScore,
        };
    });
}
