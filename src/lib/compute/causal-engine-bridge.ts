import type { CausalQuery, CausalResult, TypedSCM } from "@/types/scm";

import { forwardSolve, mutilateGraph } from "./structural-equation-solver";

export type EngineQueryErrorCode = "UNSUPPORTED_QUERY_TYPE";

export class EngineQueryError extends Error {
  readonly code: EngineQueryErrorCode;

  constructor(code: EngineQueryErrorCode, message: string) {
    super(message);
    this.name = "EngineQueryError";
    this.code = code;
  }
}

/**
 * Route a formal causal query through the v1.0 deterministic solver.
 * This path performs no LLM calls.
 */
export function runCausalQuery(typedScm: TypedSCM, query: CausalQuery): CausalResult {
  switch (query.type) {
    case "observational": {
      const result = forwardSolve(typedScm, query.outcome, query.conditions);
      return {
        value: result.outcomeValue,
        query,
        trace: result.valueMap,
        evaluationOrder: result.evaluationOrder,
        mutilatedEdges: [],
        method: "structural_equation_solver",
      };
    }
    case "interventional": {
      const { scm: mutilatedScm, removedEdges } = mutilateGraph(typedScm, {
        [query.treatment]: query.doValue,
      });
      const result = forwardSolve(mutilatedScm, query.outcome, query.conditions);
      return {
        value: result.outcomeValue,
        query,
        trace: result.valueMap,
        evaluationOrder: result.evaluationOrder,
        mutilatedEdges: removedEdges,
        method: "structural_equation_solver",
      };
    }
    default:
      throw new EngineQueryError(
        "UNSUPPORTED_QUERY_TYPE",
        `Query type '${String(query.type)}' is not supported in v1.0. Supported types: observational, interventional.`
      );
  }
}
