import { describe, expect, it } from 'vitest';
import {
  assignFailureConditionOwnership,
  evaluateBenchmarkComplianceGate,
  evaluateCounterfactualStabilityBenchmark,
  evaluateHypothesisFalsificationBenchmark,
  evaluateIdentifiabilityGateComplianceBenchmark,
  evaluateInterventionValueRegressionBenchmark,
  evaluateOverclaimComplianceBenchmark,
} from '../benchmark-service';

describe('benchmark governance gates', () => {
  it('passes the CI gate when overclaim and identifiability metrics meet thresholds', () => {
    const gate = evaluateBenchmarkComplianceGate({
      overclaimComplianceRate: 0.97,
      identifiabilityGateComplianceRate: 1,
    });

    expect(gate.passed).toBe(true);
    expect(gate.blockingFailures).toHaveLength(0);
  });

  it('fails the CI gate when either metric is below threshold', () => {
    const gate = evaluateBenchmarkComplianceGate({
      overclaimComplianceRate: 0.82,
      identifiabilityGateComplianceRate: 0.75,
    });

    expect(gate.passed).toBe(false);
    expect(gate.blockingFailures.length).toBeGreaterThan(0);
    expect(gate.overclaim.passed).toBe(false);
    expect(gate.identifiability.passed).toBe(false);
  });

  it('assigns failure owners for benchmark report handoff', () => {
    const ownership = assignFailureConditionOwnership([
      'Identifiability gate mismatch for missing_required_confounder.',
      'Overclaim policy failed in scenario 2.',
      'Intervention-value ranking drift detected in scenario 1.',
    ]);

    expect(ownership.map((item) => item.owner)).toEqual([
      'Core causal platform',
      'Frontend + governance',
      'Hybrid + governance',
    ]);
  });
});

describe('phase m4 oracle suites', () => {
  it('returns passing deterministic results for all required M4 suites', () => {
    const falsification = evaluateHypothesisFalsificationBenchmark();
    const stability = evaluateCounterfactualStabilityBenchmark();
    const interventionValue = evaluateInterventionValueRegressionBenchmark();
    const identifiability = evaluateIdentifiabilityGateComplianceBenchmark();

    expect(falsification.passed).toBe(true);
    expect(stability.passed).toBe(true);
    expect(interventionValue.passed).toBe(true);
    expect(identifiability.passed).toBe(true);
  });

  it('passes overclaim compliance oracle used by the CI gate', () => {
    const overclaim = evaluateOverclaimComplianceBenchmark();

    expect(overclaim.passed).toBe(true);
    expect(overclaim.overclaimComplianceRate).toBeGreaterThanOrEqual(0.95);
  });
});
