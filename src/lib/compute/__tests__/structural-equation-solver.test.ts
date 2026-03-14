import { describe, expect, it } from "vitest";

import type { SCMVariable, TypedSCM } from "@/types/scm";

import {
  GraphValidationError,
  MutilationError,
  SolverError,
  forwardSolve,
  mutilateGraph,
  topologicalSort,
  validateAcyclicScm,
} from "../structural-equation-solver";

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

function makeForkScm(): TypedSCM {
  return {
    variables: [makeVariable("Z"), makeVariable("X"), makeVariable("Y")],
    equations: [
      {
        variable: "Z",
        parents: [],
        coefficients: {},
        intercept: 1,
      },
      {
        variable: "X",
        parents: ["Z"],
        coefficients: { Z: 0.5 },
        intercept: 0,
      },
      {
        variable: "Y",
        parents: ["X", "Z"],
        coefficients: { X: 0.3, Z: 0.7 },
        intercept: 0,
      },
    ],
    dag: {
      nodes: ["Z", "X", "Y"],
      edges: [
        { from: "Z", to: "X" },
        { from: "Z", to: "Y" },
        { from: "X", to: "Y" },
      ],
    },
  };
}

function solveIntervention(
  scm: TypedSCM,
  interventions: Record<string, number>,
  outcomeVariable: string,
  conditions?: Record<string, number>
) {
  const { scm: mutilatedScm, removedEdges } = mutilateGraph(scm, interventions);
  return {
    removedEdges,
    result: forwardSolve(mutilatedScm, outcomeVariable, conditions),
  };
}

describe("topologicalSort", () => {
  it("returns a deterministic alphabetical order for ties", () => {
    const dag = {
      nodes: ["Z", "X", "Y"],
      edges: [
      { from: "Z", to: "Y" },
      { from: "X", to: "Y" },
      ],
    };

    expect(topologicalSort(dag)).toEqual(["X", "Z", "Y"]);
  });

  it("throws when a cycle is detected", () => {
    expect(() =>
      topologicalSort(
        {
          nodes: ["X", "Y"],
          edges: [
          { from: "X", to: "Y" },
          { from: "Y", to: "X" },
          ],
        }
      )
    ).toThrow(GraphValidationError);

    expect(() =>
      topologicalSort(
        {
          nodes: ["X", "Y"],
          edges: [
          { from: "X", to: "Y" },
          { from: "Y", to: "X" },
          ],
        }
      )
    ).toThrow("Cycle detected in DAG");
  });

  it("throws when an edge references a node outside the DAG", () => {
    expect(() =>
      topologicalSort({ nodes: ["X"], edges: [{ from: "X", to: "Y" }] })
    ).toThrow(GraphValidationError);
  });
});

describe("validateAcyclicScm", () => {
  it("returns the same topological order for a valid SCM", () => {
    const scm = makeForkScm();

    expect(validateAcyclicScm(scm)).toEqual(["Z", "X", "Y"]);
  });
});

describe("mutilateGraph", () => {
  it("returns a deep-copied mutilated SCM and preserves the original input", () => {
    const scm = makeForkScm();

    const result = mutilateGraph(scm, { X: 1 });

    expect(result.removedEdges).toEqual([{ from: "Z", to: "X" }]);
    expect(result.scm.dag.edges).toEqual([
      { from: "Z", to: "Y" },
      { from: "X", to: "Y" },
    ]);
    expect(result.scm.equations.find((equation) => equation.variable === "X")).toEqual({
      variable: "X",
      parents: [],
      coefficients: {},
      intercept: 1,
    });

    expect(scm.dag.edges).toEqual([
      { from: "Z", to: "X" },
      { from: "Z", to: "Y" },
      { from: "X", to: "Y" },
    ]);
    expect(scm.equations.find((equation) => equation.variable === "X")).toEqual({
      variable: "X",
      parents: ["Z"],
      coefficients: { Z: 0.5 },
      intercept: 0,
    });

    expect(result.scm).not.toBe(scm);
    expect(result.scm.dag).not.toBe(scm.dag);
    expect(result.scm.dag.edges).not.toBe(scm.dag.edges);
    expect(result.scm.equations).not.toBe(scm.equations);
    expect(result.scm.variables).not.toBe(scm.variables);
  });

  it("applies multiple interventions without partial mutation", () => {
    const scm: TypedSCM = {
      variables: [
        makeVariable("W"),
        makeVariable("X"),
        makeVariable("Z"),
        makeVariable("Y"),
      ],
      equations: [
        { variable: "W", parents: [], coefficients: {}, intercept: 1 },
        { variable: "X", parents: ["W"], coefficients: { W: 0.5 }, intercept: 0 },
        { variable: "Z", parents: [], coefficients: {}, intercept: 3 },
        {
          variable: "Y",
          parents: ["X", "Z"],
          coefficients: { X: 0.4, Z: 0.6 },
          intercept: 0,
        },
      ],
      dag: {
        nodes: ["W", "X", "Z", "Y"],
        edges: [
          { from: "W", to: "X" },
          { from: "X", to: "Y" },
          { from: "Z", to: "Y" },
        ],
      },
    };

    const result = mutilateGraph(scm, { Z: 3, X: 2 });

    expect(result.removedEdges).toEqual([{ from: "W", to: "X" }]);
    expect(result.scm.dag.edges).toEqual([
      { from: "X", to: "Y" },
      { from: "Z", to: "Y" },
    ]);
    expect(result.scm.equations.find((equation) => equation.variable === "X")).toEqual({
      variable: "X",
      parents: [],
      coefficients: {},
      intercept: 2,
    });
    expect(result.scm.equations.find((equation) => equation.variable === "Z")).toEqual({
      variable: "Z",
      parents: [],
      coefficients: {},
      intercept: 3,
    });
  });

  it("throws a precise error when an intervention variable is not in the DAG", () => {
    const scm = makeForkScm();

    expect(() => mutilateGraph(scm, { Missing: 1 })).toThrow(MutilationError);
    expect(() => mutilateGraph(scm, { Missing: 1 })).toThrow(
      "Intervention variable 'Missing' does not exist in DAG nodes."
    );
  });

  it("throws a precise error when an intervention equation is missing", () => {
    const scm = makeForkScm();
    const malformedScm: TypedSCM = {
      ...scm,
      equations: scm.equations.filter((equation) => equation.variable !== "X"),
    };

    expect(() => mutilateGraph(malformedScm, { X: 1 })).toThrow(MutilationError);
    expect(() => mutilateGraph(malformedScm, { X: 1 })).toThrow(
      "No structural equation found for variable 'X'."
    );
  });

  it("returns an unchanged deep copy when interventions is empty", () => {
    const scm = makeForkScm();

    const result = mutilateGraph(scm, {});

    expect(result.removedEdges).toEqual([]);
    expect(result.scm).toEqual(scm);
    expect(result.scm).not.toBe(scm);
    expect(result.scm.dag).not.toBe(scm.dag);
    expect(result.scm.equations).not.toBe(scm.equations);
  });
});

describe("forwardSolve", () => {
  it("evaluates a mutilated diamond graph in alphabetical topological order", () => {
    const scm: TypedSCM = {
      variables: [
        makeVariable("X"),
        makeVariable("A"),
        makeVariable("B"),
        makeVariable("Y"),
      ],
      equations: [
        { variable: "X", parents: [], coefficients: {}, intercept: 0 },
        { variable: "A", parents: ["X"], coefficients: { X: 0.5 }, intercept: 0 },
        { variable: "B", parents: ["X"], coefficients: { X: -0.3 }, intercept: 0 },
        { variable: "Y", parents: ["A", "B"], coefficients: { A: 1, B: 1 }, intercept: 0 },
      ],
      dag: {
        nodes: ["X", "A", "B", "Y"],
        edges: [
          { from: "X", to: "A" },
          { from: "X", to: "B" },
          { from: "A", to: "Y" },
          { from: "B", to: "Y" },
        ],
      },
    };

    const { scm: mutilatedScm } = mutilateGraph(scm, { X: 2 });
    const result = forwardSolve(mutilatedScm, "Y");

    expect(result.evaluationOrder).toEqual(["X", "A", "B", "Y"]);
    expect(result.valueMap).toEqual({ X: 2, A: 1, B: -0.6, Y: 0.4 });
    expect(result.outcomeValue).toBe(0.4);
  });

  it("throws when the outcome variable is not in the DAG", () => {
    const { scm } = mutilateGraph(makeForkScm(), { X: 1 });

    expect(() => forwardSolve(scm, "Missing")).toThrow(SolverError);
    expect(() => forwardSolve(scm, "Missing")).toThrow(
      "Outcome variable 'Missing' does not exist in the mutilated DAG nodes."
    );
  });

  it("throws when a node has no structural equation", () => {
    const scm = makeForkScm();
    const malformedScm: TypedSCM = {
      ...scm,
      equations: scm.equations.filter((equation) => equation.variable !== "Y"),
    };

    expect(() => forwardSolve(malformedScm, "Y")).toThrow(SolverError);
    expect(() => forwardSolve(malformedScm, "Y")).toThrow(
      "No structural equation found for variable 'Y'."
    );
  });

  it("throws when an equation references a parent that has not been computed", () => {
    const malformedScm: TypedSCM = {
      variables: [makeVariable("Y"), makeVariable("Z")],
      equations: [
        { variable: "Y", parents: ["Z"], coefficients: { Z: 1 }, intercept: 0 },
        { variable: "Z", parents: [], coefficients: {}, intercept: 2 },
      ],
      dag: {
        nodes: ["Y", "Z"],
        edges: [],
      },
    };

    expect(() => forwardSolve(malformedScm, "Y")).toThrow(SolverError);
    expect(() => forwardSolve(malformedScm, "Y")).toThrow(
      "Cannot evaluate variable 'Y': parent 'Z' has no computed value."
    );
  });

  it("accepts conditions that match the deterministic model output", () => {
    const scm: TypedSCM = {
      variables: [makeVariable("X"), makeVariable("M"), makeVariable("Y")],
      equations: [
        { variable: "X", parents: [], coefficients: {}, intercept: 0 },
        { variable: "M", parents: ["X"], coefficients: { X: 0.8 }, intercept: 0 },
        { variable: "Y", parents: ["M"], coefficients: { M: 0.6 }, intercept: 0 },
      ],
      dag: {
        nodes: ["X", "M", "Y"],
        edges: [
          { from: "X", to: "M" },
          { from: "M", to: "Y" },
        ],
      },
    };

    const { scm: mutilatedScm } = mutilateGraph(scm, { X: 1 });

    expect(forwardSolve(mutilatedScm, "Y", { M: 0.8 }).outcomeValue).toBe(0.48);
  });

  it("throws when a condition variable was not computed", () => {
    const { scm } = mutilateGraph(makeForkScm(), { X: 1 });

    expect(() => forwardSolve(scm, "Y", { Missing: 1 })).toThrow(SolverError);
    expect(() => forwardSolve(scm, "Y", { Missing: 1 })).toThrow(
      "Conditioned variable 'Missing' was not found in computed values."
    );
  });

  it("throws when a condition is not satisfiable", () => {
    const { scm } = mutilateGraph(makeForkScm(), { X: 1 });

    expect(() => forwardSolve(scm, "Y", { Z: 2 })).toThrow(SolverError);
    expect(() => forwardSolve(scm, "Y", { Z: 2 })).toThrow(
      "Conditioning on 'Z' = 2 is not satisfiable."
    );
  });
});

describe("forwardSolve benchmarks", () => {
  it("B1 Confounded Fork: Y_{do(X=1)} = 1.0", () => {
    const { removedEdges, result } = solveIntervention(makeForkScm(), { X: 1 }, "Y");

    expect(removedEdges).toEqual([{ from: "Z", to: "X" }]);
    expect(result.outcomeValue).toBe(1);
    expect(result.valueMap).toEqual({ X: 1, Z: 1, Y: 1 });
  });

  it("B2 Collider Bias: Y_{do(X=2)} = 1", () => {
    const scm: TypedSCM = {
      variables: [makeVariable("X"), makeVariable("Y"), makeVariable("C")],
      equations: [
        { variable: "X", parents: [], coefficients: {}, intercept: 1 },
        { variable: "Y", parents: [], coefficients: {}, intercept: 1 },
        { variable: "C", parents: ["X", "Y"], coefficients: { X: 1, Y: 1 }, intercept: 0 },
      ],
      dag: {
        nodes: ["X", "Y", "C"],
        edges: [
          { from: "X", to: "C" },
          { from: "Y", to: "C" },
        ],
      },
    };

    const { result } = solveIntervention(scm, { X: 2 }, "Y");

    expect(result.outcomeValue).toBe(1);
    expect(result.valueMap).toEqual({ X: 2, Y: 1, C: 3 });
  });

  it("B3 Simple Chain: Y_{do(X=1)} = 0.48", () => {
    const scm: TypedSCM = {
      variables: [makeVariable("X"), makeVariable("M"), makeVariable("Y")],
      equations: [
        { variable: "X", parents: [], coefficients: {}, intercept: 0 },
        { variable: "M", parents: ["X"], coefficients: { X: 0.8 }, intercept: 0 },
        { variable: "Y", parents: ["M"], coefficients: { M: 0.6 }, intercept: 0 },
      ],
      dag: {
        nodes: ["X", "M", "Y"],
        edges: [
          { from: "X", to: "M" },
          { from: "M", to: "Y" },
        ],
      },
    };

    const { result } = solveIntervention(scm, { X: 1 }, "Y");

    expect(result.outcomeValue).toBe(0.48);
    expect(result.valueMap).toEqual({ X: 1, M: 0.8, Y: 0.48 });
  });

  it("B4 Common Cause: Y_{do(X=5)} = 1.0", () => {
    const scm: TypedSCM = {
      variables: [makeVariable("Z"), makeVariable("X"), makeVariable("Y")],
      equations: [
        { variable: "Z", parents: [], coefficients: {}, intercept: 2 },
        { variable: "X", parents: ["Z"], coefficients: { Z: 1 }, intercept: 0 },
        { variable: "Y", parents: ["Z"], coefficients: { Z: 0.5 }, intercept: 0 },
      ],
      dag: {
        nodes: ["Z", "X", "Y"],
        edges: [
          { from: "Z", to: "X" },
          { from: "Z", to: "Y" },
        ],
      },
    };

    const { removedEdges, result } = solveIntervention(scm, { X: 5 }, "Y");

    expect(removedEdges).toEqual([{ from: "Z", to: "X" }]);
    expect(result.outcomeValue).toBe(1);
    expect(result.valueMap).toEqual({ X: 5, Z: 2, Y: 1 });
  });

  it("B5 Multi-Intervention: Y_{do(X=2,Z=3)} = 2.6", () => {
    const scm: TypedSCM = {
      variables: [
        makeVariable("W"),
        makeVariable("X"),
        makeVariable("Z"),
        makeVariable("Y"),
      ],
      equations: [
        { variable: "W", parents: [], coefficients: {}, intercept: 1 },
        { variable: "X", parents: ["W"], coefficients: { W: 0.5 }, intercept: 0 },
        { variable: "Z", parents: [], coefficients: {}, intercept: 3 },
        { variable: "Y", parents: ["X", "Z"], coefficients: { X: 0.4, Z: 0.6 }, intercept: 0 },
      ],
      dag: {
        nodes: ["W", "X", "Z", "Y"],
        edges: [
          { from: "W", to: "X" },
          { from: "X", to: "Y" },
          { from: "Z", to: "Y" },
        ],
      },
    };

    const { removedEdges, result } = solveIntervention(scm, { X: 2, Z: 3 }, "Y");

    expect(removedEdges).toEqual([{ from: "W", to: "X" }]);
    expect(result.outcomeValue).toBe(2.6);
    expect(result.valueMap).toEqual({ W: 1, X: 2, Z: 3, Y: 2.6 });
  });

  it("B6 Diamond Graph: Y_{do(X=2)} = 0.4", () => {
    const scm: TypedSCM = {
      variables: [
        makeVariable("X"),
        makeVariable("A"),
        makeVariable("B"),
        makeVariable("Y"),
      ],
      equations: [
        { variable: "X", parents: [], coefficients: {}, intercept: 0 },
        { variable: "A", parents: ["X"], coefficients: { X: 0.5 }, intercept: 0 },
        { variable: "B", parents: ["X"], coefficients: { X: -0.3 }, intercept: 0 },
        { variable: "Y", parents: ["A", "B"], coefficients: { A: 1, B: 1 }, intercept: 0 },
      ],
      dag: {
        nodes: ["X", "A", "B", "Y"],
        edges: [
          { from: "X", to: "A" },
          { from: "X", to: "B" },
          { from: "A", to: "Y" },
          { from: "B", to: "Y" },
        ],
      },
    };

    const { result } = solveIntervention(scm, { X: 2 }, "Y");

    expect(result.outcomeValue).toBe(0.4);
    expect(result.valueMap).toEqual({ X: 2, A: 1, B: -0.6, Y: 0.4 });
    expect(result.evaluationOrder).toEqual(["X", "A", "B", "Y"]);
  });
});
