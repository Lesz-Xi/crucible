import { describe, expect, it } from "vitest";
import { evaluateScientificIntegrity } from "../scientific-integrity-service";

function buildPassingInput() {
  return {
    benchmarkRuns: [
      {
        created_at: "2026-02-06T00:00:00.000Z",
        suite_name: "full_suite",
        status: "completed",
        results: { passed: true, complianceGate: { passed: true } },
      },
      {
        created_at: "2026-02-05T00:00:00.000Z",
        suite_name: "full_suite",
        status: "completed",
        results: { passed: true, complianceGate: { passed: true } },
      },
      {
        created_at: "2026-02-04T00:00:00.000Z",
        suite_name: "full_suite",
        status: "completed",
        results: { passed: true, complianceGate: { passed: true } },
      },
    ],
    hypothesisEvents: [
      { hypothesis_id: "h-1", state: "proposed", rationale: "Generated from source contradiction." },
      { hypothesis_id: "h-1", state: "tested", rationale: "Intervention result supports effect estimate." },
      { hypothesis_id: "h-1", state: "falsified", rationale: "Failed falsifier threshold under repeated runs." },
      { hypothesis_id: "h-2", state: "proposed", rationale: "Alternative mechanism proposal." },
      { hypothesis_id: "h-2", state: "retracted", rationale: "Missing confounder controls." },
    ],
    counterfactualTraces: [
      { computation_method: "deterministic_graph_diff" },
      { computation_method: "deterministic_graph_diff" },
      { computation_method: "deterministic_graph_diff" },
      { computation_method: "deterministic_graph_diff" },
    ],
    requiredFullSuitePasses: 3,
    minimumDeterministicTraces: 3,
    minimumDeterministicCoverage: 0.95,
  };
}

describe("evaluateScientificIntegrity", () => {
  it("passes when benchmark, lifecycle, and trace checks all satisfy thresholds", () => {
    const status = evaluateScientificIntegrity(buildPassingInput());

    expect(status.overallPass).toBe(true);
    expect(status.freezePromotion).toBe(false);
    expect(status.checks.benchmarkSustained.pass).toBe(true);
    expect(status.checks.hypothesisLifecycleAuditable.pass).toBe(true);
    expect(status.checks.deterministicTraceProvenance.pass).toBe(true);
  });

  it("freezes promotion when benchmark compliance drifts", () => {
    const input = buildPassingInput();
    input.benchmarkRuns[1].results = { passed: false, complianceGate: { passed: false } };

    const status = evaluateScientificIntegrity(input);

    expect(status.overallPass).toBe(false);
    expect(status.freezePromotion).toBe(true);
    expect(status.checks.benchmarkSustained.pass).toBe(false);
  });

  it("counts full-suite compliance passes even when suite-level passed flag is false", () => {
    const input = buildPassingInput();
    input.benchmarkRuns = input.benchmarkRuns.map((run) => ({
      ...run,
      results: { passed: false, complianceGate: { passed: true } },
    }));

    const status = evaluateScientificIntegrity(input);

    expect(status.checks.benchmarkSustained.pass).toBe(true);
    expect(status.overallPass).toBe(true);
  });

  it("freezes promotion when lifecycle evidence is missing falsified/retracted outcomes", () => {
    const input = buildPassingInput();
    input.hypothesisEvents = [
      { hypothesis_id: "h-1", state: "proposed", rationale: "Generated from source contradiction." },
      { hypothesis_id: "h-1", state: "tested", rationale: "Intervention result supports effect estimate." },
    ];

    const status = evaluateScientificIntegrity(input);

    expect(status.overallPass).toBe(false);
    expect(status.checks.hypothesisLifecycleAuditable.pass).toBe(false);
  });

  it("freezes promotion when deterministic trace coverage falls below threshold", () => {
    const input = buildPassingInput();
    input.counterfactualTraces = [
      { computation_method: "deterministic_graph_diff" },
      { computation_method: "structural_equation_solver" },
      { computation_method: "deterministic_graph_diff" },
    ];

    const status = evaluateScientificIntegrity(input);

    expect(status.overallPass).toBe(false);
    expect(status.checks.deterministicTraceProvenance.pass).toBe(false);
    expect(status.checks.deterministicTraceProvenance.deterministicCoverage).toBeLessThan(0.95);
  });
});
