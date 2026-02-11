/**
 * Law Falsification — shared evaluation logic for the law-candidate lifecycle stream.
 *
 * This module contains the domain logic for evaluating law-candidate state transitions,
 * falsification checks, and disqualification rules. CLI scripts are thin wrappers.
 *
 * Spec: LAW_DISCOVERY_FALSIFICATION_PROTOCOL.md
 */

import { createHash } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import type { GovernanceOverride } from '../../types/governance-envelope';
import type {
    LawLifecycleState,
    LawCandidate,
    LawEvaluationResult,
    LawFalsificationScenario,
    LawFalsificationScenarioPack,
    EvidenceBasis,
    FalsificationEvidence,
} from '../../types/law-discovery-falsification';

// ─── Deterministic Hashing ────────────────────────────────────────

export function computeInputHash(input: unknown): string {
    const canonical = JSON.stringify(input, Object.keys(input as object).sort());
    return createHash('sha256').update(canonical).digest('hex');
}

// ─── Valid Transitions Map ────────────────────────────────────────

const VALID_TRANSITIONS: Record<LawLifecycleState, LawLifecycleState[]> = {
    proposed: ['tested'],
    tested: ['falsified', 'confirmed'],
    falsified: ['retracted'],
    confirmed: ['retracted'],
    retracted: [],
};

/**
 * Check if a state transition is valid.
 */
export function isValidTransition(from: LawLifecycleState, to: LawLifecycleState): boolean {
    return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

// ─── Transition Requirements ──────────────────────────────────────

/**
 * Check if the transition requirements are met.
 * Returns reasons for rejection (empty if requirements met).
 */
export function checkTransitionRequirements(
    candidate: LawCandidate,
    from: LawLifecycleState,
    to: LawLifecycleState
): string[] {
    const reasons: string[] = [];

    if (from === 'proposed' && to === 'tested') {
        // Requires ≥ 1 evidence basis with strength ≥ moderate
        const hasModerateEvidence = candidate.evidenceBasis.some(
            (e) => e.strength === 'strong' || e.strength === 'moderate'
        );
        if (!hasModerateEvidence) {
            reasons.push('proposed→tested requires ≥ 1 evidence with strength ≥ moderate');
        }
    }

    if (from === 'tested' && to === 'falsified') {
        // Requires ≥ 1 counter-evidence
        if (candidate.falsificationEvidence.length === 0) {
            reasons.push('tested→falsified requires ≥ 1 counter-evidence entry');
        }
    }

    if (from === 'tested' && to === 'confirmed') {
        // Requires ≥ 2 independent replications AND zero active counter-evidence
        const replications = candidate.evidenceBasis.filter(
            (e) => e.sourceType === 'experiment' && e.strength === 'strong'
        );
        if (replications.length < 2) {
            reasons.push(`tested→confirmed requires ≥ 2 replications, found ${replications.length}`);
        }
        if (candidate.falsificationEvidence.length > 0) {
            reasons.push('tested→confirmed requires zero active counter-evidence');
        }
        if (candidate.confidenceScore < 0.3) {
            reasons.push(`tested→confirmed requires confidenceScore ≥ 0.3, found ${candidate.confidenceScore}`);
        }
    }

    return reasons;
}

// ─── Disqualifier Checks ──────────────────────────────────────────

/**
 * Check if a candidate is disqualified from progressing.
 */
export function checkDisqualifiers(candidate: LawCandidate): string[] {
    const reasons: string[] = [];

    // Unfalsifiable: no falsification criteria
    if (!candidate.falsificationCriteria || candidate.falsificationCriteria.trim().length === 0) {
        reasons.push('Unfalsifiable: no falsificationCriteria defined');
    }

    // Circular evidence: all evidence references the candidate itself
    if (candidate.evidenceBasis.length > 0) {
        const allSelfRef = candidate.evidenceBasis.every(
            (e) => e.sourceId === candidate.id
        );
        if (allSelfRef) {
            reasons.push('Circular evidence: all evidence basis entries reference the candidate itself');
        }
    }

    // Domain mismatch check would go here with domain-profiles.v1.json lookup
    // (deferred — requires file I/O)

    return reasons;
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
    candidate: LawCandidate,
    overrides: GovernanceOverride[],
    now: Date = new Date()
): { failures: string[]; warnings: string[] } {
    const failures: string[] = [];
    const warnings: string[] = [];

    // Gate: min evidence count (≥ 2 for progression past proposed)
    if (candidate.evidenceBasis.length < 2 && candidate.status === 'proposed') {
        const gate = 'min-evidence-count';
        if (isGateOverridden(gate, overrides, now)) {
            warnings.push(`[OVERRIDDEN] ${gate}: only ${candidate.evidenceBasis.length} evidence entries`);
        } else {
            failures.push(`${gate}: only ${candidate.evidenceBasis.length} evidence entries, need ≥ 2`);
        }
    }

    // Gate: falsification criteria present
    if (!candidate.falsificationCriteria || candidate.falsificationCriteria.trim().length === 0) {
        const gate = 'falsification-criteria-present';
        if (isGateOverridden(gate, overrides, now)) {
            warnings.push(`[OVERRIDDEN] ${gate}`);
        } else {
            failures.push(`${gate}: no falsification criteria defined`);
        }
    }

    // Gate: confidence floor for confirmation
    if (candidate.status === 'tested' && candidate.confidenceScore < 0.3) {
        const gate = 'confidence-floor';
        if (isGateOverridden(gate, overrides, now)) {
            warnings.push(`[OVERRIDDEN] ${gate}: confidence ${candidate.confidenceScore} < 0.3`);
        } else {
            failures.push(`${gate}: confidence ${candidate.confidenceScore} < 0.3`);
        }
    }

    return { failures, warnings };
}

// ─── Single Scenario Evaluation ───────────────────────────────────

/**
 * Evaluate a single law-falsification scenario.
 */
export function evaluateScenario(
    scenario: LawFalsificationScenario,
    seed: number,
    mode: 'report' | 'enforce',
    overrides: GovernanceOverride[] = []
): LawEvaluationResult {
    const inputHash = computeInputHash(scenario);
    const candidate = { ...scenario.candidate };

    // Apply additional evidence if provided
    if (scenario.additionalEvidence) {
        candidate.evidenceBasis = [...candidate.evidenceBasis, ...scenario.additionalEvidence];
    }
    if (scenario.additionalFalsificationEvidence) {
        candidate.falsificationEvidence = [
            ...candidate.falsificationEvidence,
            ...scenario.additionalFalsificationEvidence,
        ];
    }

    const { from, to } = scenario.requestedTransition;
    const validTransition = isValidTransition(from, to);
    const transitionReqs = validTransition ? checkTransitionRequirements(candidate, from, to) : [];
    const disqualifiers = checkDisqualifiers(candidate);
    const { failures: gateFailures, warnings: gateWarnings } = checkHardGates(candidate, overrides);

    // Determine the actual new state
    let newState: LawLifecycleState = from;
    let transitionValid = false;

    if (validTransition && transitionReqs.length === 0 && disqualifiers.length === 0) {
        newState = to;
        transitionValid = true;
    }

    const falsificationMethodsApplied = candidate.falsificationEvidence.map((e) => e.method);

    // Merge gate failures with transition rejection reasons
    const allFailures = [
        ...gateFailures,
        ...(validTransition ? [] : [`invalid-transition: ${from}→${to} is not a valid transition`]),
        ...transitionReqs.map((r) => `transition-requirement: ${r}`),
    ];

    return {
        runId: uuidv7(),
        inputHash,
        seed,
        mode,
        timestamp: new Date().toISOString(),
        decision: transitionValid ? `${from}→${to}` : `blocked:${from}`,
        hardGateFailures: allFailures,
        warnings: gateWarnings,
        candidateId: candidate.id,
        previousState: from,
        newState,
        transitionValid,
        falsificationMethodsApplied: [...new Set(falsificationMethodsApplied)],
        evidenceSummary: {
            supporting: candidate.evidenceBasis.length,
            contradicting: candidate.falsificationEvidence.length,
            replications: candidate.evidenceBasis.filter((e) => e.sourceType === 'experiment').length,
        },
        disqualifiers,
        lifecycleComplete: ['falsified', 'retracted', 'confirmed'].includes(newState),
    };
}

// ─── Full Evaluation Run ──────────────────────────────────────────

/**
 * Run a complete law-falsification evaluation against a scenario pack.
 */
export function runLawFalsificationEvaluation(
    scenarioPack: LawFalsificationScenarioPack,
    seed: number,
    mode: 'report' | 'enforce',
    overrides: GovernanceOverride[] = []
): LawEvaluationResult[] {
    return scenarioPack.scenarios.map((scenario) =>
        evaluateScenario(scenario, seed, mode, overrides)
    );
}
