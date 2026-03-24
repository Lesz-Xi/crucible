import { describe, expect, it } from "vitest";

import type { SCMVariable, TypedSCM } from "@/types/scm";

import { EngineQueryError, runCausalQuery } from "../causal-engine-bridge";

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

function makeChainScm(): TypedSCM {
  return {
    variables: [makeVariable("Z"), makeVariable("X"), makeVariable("M"), makeVariable("Y")],
    equations: [
      { variable: "Z", parents: [], coefficients: {}, intercept: 3 },
      { variable: "X", parents: ["Z"], coefficients: { Z: 0.5 }, intercept: 0 },
      { variable: "M", parents: ["X"], coefficients: { X: 0.5 }, intercept: 0 },
      { variable: "Y", parents: ["M"], coefficients: { M: 2 }, intercept: 0 },
    ],
    dag: {
      nodes: ["Z", "X", "M", "Y"],
      edges: [
        { from: "Z", to: "X" },
        { from: "X", to: "M" },
        { from: "M", to: "Y" },
      ],
    },
  };
}

describe("runCausalQuery", () => {
  it("routes observational queries through the unmutilated solver", () => {
    const result = runCausalQuery(makeChainScm(), {
      type: "observational",
      treatment: "X",
      doValue: 99,
      outcome: "Y",
    });

    expect(result.method).toBe("structural_equation_solver");
    expect(result.mutilatedEdges).toEqual([]);
    expect(result.evaluationOrder).toEqual(["Z", "X", "M", "Y"]);
    expect(result.trace).toEqual({ Z: 3, X: 1.5, M: 0.75, Y: 1.5 });
    expect(result.value).toBe(1.5);
  });

  it("routes interventional queries through mutilation before solving", () => {
    const result = runCausalQuery(makeChainScm(), {
      type: "interventional",
      treatment: "X",
      doValue: 4,
      outcome: "Y",
    });

    expect(result.method).toBe("structural_equation_solver");
    expect(result.mutilatedEdges).toEqual([{ from: "Z", to: "X" }]);
    expect(result.evaluationOrder).toEqual(["X", "M", "Y", "Z"]);
    expect(result.trace).toEqual({ Z: 3, X: 4, M: 2, Y: 4 });
    expect(result.value).toBe(4);
  });

  it("throws a typed error for unsupported query types", () => {
    expect(() =>
      runCausalQuery(makeChainScm(), {
        type: "counterfactual" as never,
        treatment: "X",
        doValue: 1,
        outcome: "Y",
      })
    ).toThrow(EngineQueryError);
  });
});
