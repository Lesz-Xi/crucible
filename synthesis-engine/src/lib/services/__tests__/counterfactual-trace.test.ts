import { describe, expect, it, vi } from "vitest";

import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import type { SCMVariable, TypedSCM } from "@/types/scm";

import { buildCounterfactualTrace } from "../counterfactual-trace";

function makeVariable(name: string): SCMVariable {
  return {
    id: name.toLowerCase(),
    canonicalName: name,
    aliases: [],
    datatype: "number",
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
  };
}

function makeTypedChainScm(): TypedSCM {
  return {
    variables: [makeVariable("X"), makeVariable("M"), makeVariable("Y")],
    equations: [
      { variable: "X", parents: [], coefficients: {}, intercept: 1 },
      { variable: "M", parents: ["X"], coefficients: { X: 0.5 }, intercept: 0 },
      { variable: "Y", parents: ["M"], coefficients: { M: 2 }, intercept: 0 },
    ],
    dag: {
      nodes: ["X", "M", "Y"],
      edges: [
        { from: "X", to: "M" },
        { from: "M", to: "Y" },
      ],
    },
  };
}

describe("buildCounterfactualTrace", () => {
  it("uses the heuristic fallback path when TypedSCM is absent", () => {
    const scm = new StructuralCausalModel("fallback-test");

    vi.spyOn(scm, "queryCounterfactual").mockReturnValue({
      estimand: "[HEURISTIC] intervention_comparison(Y, X=2)",
      actualOutcome: 1.2,
      counterfactualOutcome: 1.7,
      difference: 0.5,
      explanation: "heuristic",
    });
    vi.spyOn(scm, "queryIntervention").mockReturnValue({
      estimand: "[HEURISTIC] delta(Y | X=2, bfs_decay)",
      baselineOutcome: 1.2,
      intervenedOutcome: 1.7,
      delta: 0.5,
      affectedNodes: ["X", "M", "Y"],
    });

    const trace = buildCounterfactualTrace(scm, {
      modelRef: { modelKey: "test", version: "v1" },
      intervention: { variable: "X", value: 2 },
      outcome: "Y",
      observedWorld: { Y: 1.2 },
    });

    expect(trace.computation.method).toBe("heuristic_bfs_propagation");
    expect(trace.computation.affectedNodes).toEqual(["M", "Y"]);
    expect(trace.computation.note).toContain("BFS-visited nodes");
    expect(trace.computation.uncertainty).toBe("medium");
    expect(trace.result).toEqual({
      actualOutcome: 1.2,
      counterfactualOutcome: 1.7,
      delta: 0.5,
    });
  });

  it("uses the engine path and exposes deterministic trace metadata when TypedSCM is available", () => {
    const scm = new StructuralCausalModel("engine-test");
    const counterfactualSpy = vi.spyOn(scm, "queryCounterfactual");
    const interventionSpy = vi.spyOn(scm, "queryIntervention");

    const trace = buildCounterfactualTrace(
      scm,
      {
        modelRef: { modelKey: "test", version: "v1" },
        intervention: { variable: "X", value: 4 },
        outcome: "Y",
        observedWorld: { Y: 1 },
      },
      makeTypedChainScm()
    );

    expect(counterfactualSpy).not.toHaveBeenCalled();
    expect(interventionSpy).not.toHaveBeenCalled();
    expect(trace.computation.method).toBe("structural_equation_solver");
    expect(trace.computation.affectedNodes).toEqual(["M", "Y"]);
    expect(trace.computation.evaluationOrder).toEqual(["X", "M", "Y"]);
    expect(trace.computation.traceValues).toEqual({ X: 4, M: 2, Y: 4 });
    expect(trace.computation.uncertainty).toBe("none");
    expect(trace.result).toEqual({
      actualOutcome: 1,
      counterfactualOutcome: 4,
      delta: 3,
    });
  });

  it("computes the actual outcome from the observational model when observedWorld omits it", () => {
    const trace = buildCounterfactualTrace(
      new StructuralCausalModel("engine-no-observed"),
      {
        modelRef: { modelKey: "test", version: "v1" },
        intervention: { variable: "X", value: 4 },
        outcome: "Y",
      },
      makeTypedChainScm()
    );

    expect(trace.result.actualOutcome).toBe(1);
    expect(trace.result.counterfactualOutcome).toBe(4);
    expect(trace.result.delta).toBe(3);
  });
});
