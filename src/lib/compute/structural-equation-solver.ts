import type {
  SolverError as SolverErrorShape,
  SolverResult,
  StructuralEquation,
  TypedSCM,
} from "@/types/scm";

type DagEdge = TypedSCM["dag"]["edges"][number];

const CONDITION_TOLERANCE = 1e-10;

function normalizeDeterministicValue(value: number): number {
  return Number.parseFloat(value.toPrecision(15));
}

export type GraphValidationErrorCode = "CYCLE_DETECTED" | "UNKNOWN_NODE_REFERENCE";
export type MutilationErrorCode = "VARIABLE_NOT_IN_DAG" | "EQUATION_NOT_FOUND";

export class GraphValidationError extends Error {
  readonly code: GraphValidationErrorCode;

  constructor(code: GraphValidationErrorCode, message: string) {
    super(message);
    this.name = "GraphValidationError";
    this.code = code;
  }
}

export class MutilationError extends Error {
  readonly code: MutilationErrorCode;
  readonly variable: string;

  constructor(code: MutilationErrorCode, message: string, variable: string) {
    super(message);
    this.name = "MutilationError";
    this.code = code;
    this.variable = variable;
  }
}

export interface MutilatedGraphResult {
  scm: TypedSCM;
  removedEdges: DagEdge[];
}

export class SolverError extends Error implements SolverErrorShape {
  readonly code: SolverErrorShape["code"];
  readonly variable?: string;
  readonly missingParent?: string;
  readonly computedValue?: number;
  readonly requiredValue?: number;

  constructor(input: SolverErrorShape) {
    super(input.message);
    this.name = "SolverError";
    this.code = input.code;
    this.variable = input.variable;
    this.missingParent = input.missingParent;
    this.computedValue = input.computedValue;
    this.requiredValue = input.requiredValue;
  }
}

/**
 * Return a deterministic topological order for a DAG.
 * Ties are resolved alphabetically.
 */
export function topologicalSort(dag: TypedSCM["dag"]): string[] {
  const { nodes, edges } = dag;
  const inDegree = new Map(nodes.map((node) => [node, 0]));
  const outgoing = new Map(nodes.map((node) => [node, [] as string[]]));

  for (const edge of edges) {
    if (!inDegree.has(edge.from)) {
      throw new GraphValidationError(
        "UNKNOWN_NODE_REFERENCE",
        `Edge source '${edge.from}' does not exist in DAG nodes.`
      );
    }

    if (!inDegree.has(edge.to)) {
      throw new GraphValidationError(
        "UNKNOWN_NODE_REFERENCE",
        `Edge target '${edge.to}' does not exist in DAG nodes.`
      );
    }

    outgoing.get(edge.from)!.push(edge.to);
    inDegree.set(edge.to, inDegree.get(edge.to)! + 1);
  }

  for (const children of outgoing.values()) {
    children.sort((left, right) => left.localeCompare(right));
  }

  const ready = nodes.filter((node) => inDegree.get(node) === 0).sort((left, right) => left.localeCompare(right));
  const evaluationOrder: string[] = [];

  while (ready.length > 0) {
    const current = ready.shift()!;
    evaluationOrder.push(current);

    for (const child of outgoing.get(current)!) {
      const nextInDegree = inDegree.get(child)! - 1;
      inDegree.set(child, nextInDegree);

      if (nextInDegree === 0) {
        ready.push(child);
        ready.sort((left, right) => left.localeCompare(right));
      }
    }
  }

  if (evaluationOrder.length !== nodes.length) {
    throw new GraphValidationError(
      "CYCLE_DETECTED",
      "Cycle detected in DAG. Acyclic graphs are required for v1.0."
    );
  }

  return evaluationOrder;
}

/**
 * Validate the DAG shape by attempting a deterministic topological sort.
 * Returns the topological order when validation succeeds.
 */
export function validateAcyclicScm(scm: TypedSCM): string[] {
  return topologicalSort(scm.dag);
}

/**
 * Apply graph mutilation for do(X=x) style interventions without mutating the
 * original SCM. All intervention variables are validated before any mutation begins.
 */
export function mutilateGraph(
  scm: TypedSCM,
  interventions: Record<string, number>
): MutilatedGraphResult {
  const interventionVariables = Object.keys(interventions);

  for (const variable of interventionVariables) {
    if (!scm.dag.nodes.includes(variable)) {
      throw new MutilationError(
        "VARIABLE_NOT_IN_DAG",
        `Intervention variable '${variable}' does not exist in DAG nodes.`,
        variable
      );
    }

    if (!scm.equations.some((equation) => equation.variable === variable)) {
      throw new MutilationError(
        "EQUATION_NOT_FOUND",
        `No structural equation found for variable '${variable}'.`,
        variable
      );
    }
  }

  const clonedScm = structuredClone(scm) as TypedSCM;
  const nodeIndex = new Map(clonedScm.dag.nodes.map((node, index) => [node, index]));
  const orderedInterventions = [...interventionVariables].sort(
    (left, right) => nodeIndex.get(left)! - nodeIndex.get(right)!
  );
  const removedEdges: DagEdge[] = [];

  for (const variable of orderedInterventions) {
    const keptEdges: DagEdge[] = [];

    for (const edge of clonedScm.dag.edges) {
      if (edge.to === variable) {
        removedEdges.push(edge);
        continue;
      }

      keptEdges.push(edge);
    }

    clonedScm.dag.edges = keptEdges;

    const equationIndex = clonedScm.equations.findIndex(
      (equation) => equation.variable === variable
    );

    clonedScm.equations[equationIndex] = {
      variable,
      parents: [],
      coefficients: {},
      intercept: interventions[variable],
    };
  }

  return {
    scm: clonedScm,
    removedEdges,
  };
}

export function forwardSolve(
  mutilatedScm: TypedSCM,
  outcomeVariable: string,
  conditions: Record<string, number> = {}
): SolverResult {
  if (!mutilatedScm.dag.nodes.includes(outcomeVariable)) {
    throw new SolverError({
      code: "OUTCOME_NOT_IN_DAG",
      message: `Outcome variable '${outcomeVariable}' does not exist in the mutilated DAG nodes.`,
      variable: outcomeVariable,
    });
  }

  const equationIndex: Record<string, StructuralEquation> = {};
  for (const equation of mutilatedScm.equations) {
    equationIndex[equation.variable] = equation;
  }

  const evaluationOrder = (() => {
    try {
      return topologicalSort(mutilatedScm.dag);
    } catch (error) {
      if (error instanceof GraphValidationError && error.code === "CYCLE_DETECTED") {
        throw new SolverError({
          code: "CYCLE_DETECTED",
          message:
            `Topological sort processed fewer than ${mutilatedScm.dag.nodes.length} nodes. ` +
            "A cycle exists in the DAG. This violates the v1.0 acyclicity assumption. " +
            "Model completeness validation should have rejected this model.",
        });
      }

      throw error;
    }
  })();

  const valueMap: Record<string, number> = {};

  for (const variable of evaluationOrder) {
    const equation = equationIndex[variable];

    if (!equation) {
      throw new SolverError({
        code: "EQUATION_MISSING",
        message:
          `No structural equation found for variable '${variable}'. ` +
          "Every node in the DAG must have exactly one equation. " +
          "Model completeness validation should have caught this.",
        variable,
      });
    }

    for (const parent of equation.parents) {
      if (!Object.prototype.hasOwnProperty.call(valueMap, parent)) {
        throw new SolverError({
          code: "PARENT_VALUE_MISSING",
          message:
            `Cannot evaluate variable '${variable}': parent '${parent}' has no computed value. ` +
            "This indicates either a topological sort failure or a parent reference that exists in the equation " +
            "but not in the DAG edges.",
          variable,
          missingParent: parent,
        });
      }
    }

    let computedValue = equation.intercept;
    for (const parent of equation.parents) {
      computedValue += equation.coefficients[parent] * valueMap[parent];
    }

    valueMap[variable] = normalizeDeterministicValue(computedValue);
  }

  for (const [condVar, requiredValue] of Object.entries(conditions)) {
    if (!Object.prototype.hasOwnProperty.call(valueMap, condVar)) {
      throw new SolverError({
        code: "CONDITION_VARIABLE_NOT_COMPUTED",
        message:
          `Conditioned variable '${condVar}' was not found in computed values. ` +
          "Verify it is a node in the mutilated DAG.",
        variable: condVar,
      });
    }

    const actualValue = valueMap[condVar];
    if (Math.abs(actualValue - requiredValue) > CONDITION_TOLERANCE) {
      throw new SolverError({
        code: "CONDITION_NOT_SATISFIED",
        message:
          `Conditioning on '${condVar}' = ${requiredValue} is not satisfiable. ` +
          `The deterministic model computes ${condVar} = ${actualValue}. ` +
          "In v1.0 (U_i=0), there is no distributional support to condition on. " +
          "The condition is either wrong or requires v2+ stochastic SCMs.",
        variable: condVar,
        computedValue: actualValue,
        requiredValue,
      });
    }
  }

  return {
    outcomeValue: valueMap[outcomeVariable],
    valueMap,
    evaluationOrder,
  };
}
