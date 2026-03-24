import { StructuralCausalModel } from "../ai/causal-blueprint";

export interface Intervention {
  nodeName: string;
  value: string;
}

export interface CausalState {
  nodes: Map<string, string>; // Node Name -> Current Value
  interventions: Set<string>; // Set of intervened node names
}

/**
 * Legacy intervention-state helper for fallback causal flows.
 *
 * This service records intervention state and discovers downstream nodes for
 * heuristic/LLM-assisted handling. Formal deterministic computation lives in
 * the TypedSCM solver bridge, not in this class.
 */
export class CausalSolver {
  /**
   * Applies interventions to the causal state.
   * Downstream propagation is handled elsewhere: deterministic engine path via
   * TypedSCM, fallback narrative path via generateDoPrompt().
   */
  solve(
    scm: StructuralCausalModel, 
    interventions: Intervention[], 
    currentState?: Map<string, string>
  ): CausalState {
    // 1. Initialize State
    const state: CausalState = {
      nodes: new Map(currentState),
      interventions: new Set()
    };

    // 2. Apply Interventions (The Surgery)
    for (const intervention of interventions) {
      state.nodes.set(intervention.nodeName, intervention.value);
      state.interventions.add(intervention.nodeName);
    }

    // 3. Propagate Effects (The flow of Causality)
    // In a real SCM engine, this would solve the structural equations f_i(pa_i, u_i).
    // For MASA v3.1, since we don't have the equation definitions f_i in the TS class yet,
    // we perform a "Graph Traversal" to identify which nodes are AFFECTED,
    // and we generate a "Constraint Prompt" for the LLM to solve the specific value.
    // 
    // Future Work: Move equations from LLM prompt text into explicitly defined TS Functions.
    
    return state;
  }

  /**
   * Identifies which nodes are downstream of the intervention set.
   * This is a reachability helper for downstream nodes, not a formal intervention solver.
   */
  getAffectedNodes(scm: StructuralCausalModel, interventionRoot: string): string[] {
    const { edges } = scm.getFullStructure(); // Get full graph structure (Tier 1 + Tier 2)
    // Assuming we pass a full graph structure in future.
    
    const affected = new Set<string>();
    const queue = [interventionRoot];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Find children
      const children = edges
        .filter(e => e.from === current)
        .map(e => e.to);

      for (const child of children) {
        if (!affected.has(child)) {
          affected.add(child);
          queue.push(child);
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * @deprecated Direct LLM fallback path. Use the structural equation solver
   * bridge when a TypedSCM is available.
   */
  generateDoPrompt(interventions: Intervention[]): string {
    if (interventions.length === 0) return "";

    return `
### CAUSAL SURGERY CONTEXT (FALLBACK NARRATIVE ONLY):
The user has performed a Structural Intervention:
${interventions.map(i => `- do(${i.nodeName} = ${i.value})`).join('\n')}

**CRITICAL INSTRUCTION:**
1.  **Graph Mutilation**: You must IGNORE any prior causes of [${interventions.map(i => i.nodeName).join(', ')}]. Their values are now fixed by FIAT, not by their parents.
2.  **Approximate Narrative Only**: Describe likely downstream consequences using domain understanding. Formal structural equations are not loaded in this path.
3.  **Honest Framing**: Do not present the result as exact do-calculus, structural-equation output, or a proven causal effect. Label uncertainty clearly.
4.  **Counterfactual Logic**: If this contradicts observing reality (e.g. "The sun is cold"), accept the intervention and describe the counterfactual world rather than reverting to the likely world.
`;
  }
}
