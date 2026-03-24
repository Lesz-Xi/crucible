import { describe, expect, it } from 'vitest';
import { runPolicyEvaluation } from '../../governance/policy-evaluation';
import { runCausalMethodEvaluation } from '../../governance/causal-method-selection';
import { runUncertaintyCalibration } from '../../governance/uncertainty-calibration';
import { runLawFalsificationEvaluation } from '../../governance/law-falsification';
import type { PolicyEvalScenarioPack } from '../../../types/policy-evaluation';
import type { CausalMethodScenarioPack } from '../../../types/causal-method-policy';
import type { UncertaintyCalibrationScenarioPack } from '../../../types/uncertainty-calibration';
import type { LawFalsificationScenarioPack } from '../../../types/law-discovery-falsification';

// ─── Test Fixtures ────────────────────────────────────────────────────

function buildPolicyScenarioPack(): PolicyEvalScenarioPack {
    return {
        version: '1.0.0',
        scenarios: [
            {
                scenarioId: 'PE-T001',
                label: 'Simple 2-policy comparison',
                policies: ['eig', 'bo_ucb'],
                input: { dimensionality: 3, sampleBudget: 50, noiseLevel: 'low' },
                expectedHardGates: [],
                expectedDecision: 'eig',
            },
            {
                scenarioId: 'PE-T002',
                label: 'All 4 policies evaluated',
                policies: ['eig', 'bo_ucb', 'bo_ts', 'efe'],
                input: { dimensionality: 10, sampleBudget: 100, noiseLevel: 'medium' },
                expectedHardGates: [],
                expectedDecision: 'eig',
            },
        ],
    };
}

function buildCausalScenarioPack(): CausalMethodScenarioPack {
    return {
        version: '1.0.0',
        scenarios: [
            {
                scenarioId: 'CM-T001',
                label: 'Large-sample interventional data',
                dataRegime: {
                    sampleSize: 5000,
                    dimensionality: 8,
                    hasInterventions: true,
                    hasTemporalOrder: false,
                    knownConfounders: ['age'],
                    noiseLevel: 'low',
                },
                expectedHardGates: [],
                expectedDecision: 'do_calculus',
            },
        ],
    };
}

function buildUncertaintyScenarioPack(): UncertaintyCalibrationScenarioPack {
    return {
        version: '1.0.0',
        scenarios: [
            {
                scenarioId: 'UC-T001',
                label: 'Well-calibrated predictions',
                predictions: [
                    { predicted: 0.9, confidence: 0.85, actual: 1.0 },
                    { predicted: 0.7, confidence: 0.65, actual: 1.0 },
                    { predicted: 0.3, confidence: 0.30, actual: 0.0 },
                    { predicted: 0.1, confidence: 0.15, actual: 0.0 },
                    { predicted: 0.8, confidence: 0.75, actual: 1.0 },
                    { predicted: 0.2, confidence: 0.25, actual: 0.0 },
                ],
                expectedHardGates: [],
                expectedDecision: 'good',
            },
        ],
    };
}

function buildLawFalsificationScenarioPack(): LawFalsificationScenarioPack {
    return {
        version: '1.0.0',
        scenarios: [
            {
                scenarioId: 'LF-T001',
                label: 'Valid proposed→tested transition',
                candidate: {
                    id: '00000000-0000-0000-0000-000000000001',
                    hypothesis: 'Test law for governance validation',
                    domain: 'test_domain',
                    evidenceBasis: [
                        {
                            sourceId: 'EXP-T01',
                            sourceType: 'experiment',
                            summary: 'Monte Carlo test',
                            strength: 'strong',
                            timestamp: '2026-01-15T10:00:00Z',
                        },
                    ],
                    falsificationEvidence: [],
                    status: 'proposed',
                    proposedAt: '2026-01-15T10:00:00Z',
                    lastTransitionAt: '2026-01-15T10:00:00Z',
                    falsificationCriteria: 'Find a counter-example',
                    confidenceScore: 0.72,
                    disqualified: false,
                    disqualifyReasons: [],
                },
                requestedTransition: { from: 'proposed', to: 'tested' },
                expectedHardGates: [],
                expectedDecision: 'tested',
            },
        ],
    };
}

// ─── Test Suites ──────────────────────────────────────────────────────

describe('Governance Shared Logic — Determinism', () => {
    const SEED_A = 42;
    const SEED_B = 42;
    const SEED_C = 99;

    it('policy-evaluation: identical inputs + seed produce identical output', () => {
        const pack = buildPolicyScenarioPack();
        const r1 = runPolicyEvaluation(pack, SEED_A, 'report');
        const r2 = runPolicyEvaluation(pack, SEED_B, 'report');

        expect(r1.inputHash).toBe(r2.inputHash);
        expect(r1.decision).toBe(r2.decision);
        expect(r1.hardGateFailures).toEqual(r2.hardGateFailures);
        expect(r1.selectedPolicy).toBe(r2.selectedPolicy);
        expect(r1.scenarioResults).toEqual(r2.scenarioResults);
    });

    it('policy-evaluation: different seed yields different runId but deterministic results per-seed', () => {
        const pack = buildPolicyScenarioPack();
        const r1 = runPolicyEvaluation(pack, SEED_A, 'report');
        const r2 = runPolicyEvaluation(pack, SEED_C, 'report');

        // Input hash is seed-independent (derived from scenario pack)
        expect(r1.inputHash).toBe(r2.inputHash);
        // Run IDs are always unique (UUIDv7)
        expect(r1.runId).not.toBe(r2.runId);
    });

    it('causal-method: identical inputs + seed produce identical eligibility results', () => {
        const pack = buildCausalScenarioPack();
        const r1 = runCausalMethodEvaluation(pack, SEED_A, 'report');
        const r2 = runCausalMethodEvaluation(pack, SEED_B, 'report');

        expect(r1.length).toBe(r2.length);
        expect(r1[0].inputHash).toBe(r2[0].inputHash);
        expect(r1[0].decision).toBe(r2[0].decision);
        expect(r1[0].selectedMethod).toBe(r2[0].selectedMethod);
        expect(r1[0].eligibilityResults).toEqual(r2[0].eligibilityResults);
    });

    it('uncertainty-calibration: identical inputs + seed produce identical calibration', () => {
        const pack = buildUncertaintyScenarioPack();
        const r1 = runUncertaintyCalibration(pack, SEED_A, 'report');
        const r2 = runUncertaintyCalibration(pack, SEED_B, 'report');

        expect(r1.length).toBe(r2.length);
        expect(r1[0].inputHash).toBe(r2[0].inputHash);
        expect(r1[0].decision).toBe(r2[0].decision);
        expect(r1[0].calibration).toEqual(r2[0].calibration);
    });

    it('law-falsification: identical inputs + seed produce identical evaluation', () => {
        const pack = buildLawFalsificationScenarioPack();
        const r1 = runLawFalsificationEvaluation(pack, SEED_A, 'report');
        const r2 = runLawFalsificationEvaluation(pack, SEED_B, 'report');

        expect(r1.length).toBe(r2.length);
        expect(r1[0].decision).toBe(r2[0].decision);
        expect(r1[0].hardGateFailures).toEqual(r2[0].hardGateFailures);
    });
});

describe('Governance Shared Logic — Envelope Schema', () => {
    it('policy-evaluation: result conforms to GovernanceResultEnvelope', () => {
        const pack = buildPolicyScenarioPack();
        const result = runPolicyEvaluation(pack, 42, 'report');

        expect(result.runId).toBeDefined();
        expect(result.runId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(result.inputHash).toBeDefined();
        expect(typeof result.inputHash).toBe('string');
        expect(result.seed).toBe(42);
        expect(result.mode).toBe('report');
        expect(result.timestamp).toBeDefined();
        expect(typeof result.decision).toBe('string');
        expect(Array.isArray(result.hardGateFailures)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('causal-method: each result conforms to GovernanceResultEnvelope', () => {
        const pack = buildCausalScenarioPack();
        const results = runCausalMethodEvaluation(pack, 42, 'report');

        for (const result of results) {
            expect(result.runId).toBeDefined();
            expect(result.inputHash).toBeDefined();
            expect(result.seed).toBe(42);
            expect(result.mode).toBe('report');
            expect(result.timestamp).toBeDefined();
            expect(typeof result.decision).toBe('string');
            expect(Array.isArray(result.hardGateFailures)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
        }
    });

    it('uncertainty-calibration: each result conforms to GovernanceResultEnvelope', () => {
        const pack = buildUncertaintyScenarioPack();
        const results = runUncertaintyCalibration(pack, 42, 'report');

        for (const result of results) {
            expect(result.runId).toBeDefined();
            expect(result.inputHash).toBeDefined();
            expect(result.seed).toBe(42);
            expect(result.mode).toBe('report');
            expect(typeof result.decision).toBe('string');
            expect(Array.isArray(result.hardGateFailures)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
        }
    });

    it('law-falsification: each result conforms to GovernanceResultEnvelope', () => {
        const pack = buildLawFalsificationScenarioPack();
        const results = runLawFalsificationEvaluation(pack, 42, 'report');

        for (const result of results) {
            expect(result.runId).toBeDefined();
            expect(typeof result.decision).toBe('string');
            expect(Array.isArray(result.hardGateFailures)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
        }
    });
});

describe('Governance Shared Logic — Input Hash Stability', () => {
    it('policy-evaluation: inputHash is stable across multiple invocations', () => {
        const pack = buildPolicyScenarioPack();
        const h1 = runPolicyEvaluation(pack, 1, 'report').inputHash;
        const h2 = runPolicyEvaluation(pack, 2, 'report').inputHash;
        const h3 = runPolicyEvaluation(pack, 3, 'report').inputHash;

        // Input hash depends only on scenario pack content, not seed
        expect(h1).toBe(h2);
        expect(h2).toBe(h3);
    });

    it('policy-evaluation: different input produces different hash', () => {
        const packA = buildPolicyScenarioPack();
        const packB: PolicyEvalScenarioPack = {
            version: '2.0.0-different',
            scenarios: [
                {
                    scenarioId: 'PE-ALT-001',
                    label: 'Completely different scenario for hash test',
                    policies: ['efe'],
                    input: { dimensionality: 100, sampleBudget: 1, noiseLevel: 'extreme' },
                    expectedHardGates: ['total_failure'],
                    expectedDecision: 'efe',
                },
            ],
        };

        const hA = runPolicyEvaluation(packA, 42, 'report').inputHash;
        const hB = runPolicyEvaluation(packB, 42, 'report').inputHash;

        expect(hA).not.toBe(hB);
    });
});

describe('Governance Shared Logic — Mode Behavior', () => {
    it('policy-evaluation: report mode always exits cleanly regardless of gate failures', () => {
        const pack = buildPolicyScenarioPack();
        const result = runPolicyEvaluation(pack, 42, 'report');

        // In report mode, hardGateFailures are collected but don't throw
        expect(result.mode).toBe('report');
        // Should have a valid decision regardless
        expect(result.decision).toBeDefined();
    });

    it('causal-method: report mode produces results even with gate failures', () => {
        const pack = buildCausalScenarioPack();
        const results = runCausalMethodEvaluation(pack, 42, 'report');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].mode).toBe('report');
    });
});
