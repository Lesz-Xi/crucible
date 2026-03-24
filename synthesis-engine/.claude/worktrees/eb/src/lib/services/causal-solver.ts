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
 * The Obsidian Causal Solver
 * 
 * "We don't predict the future; we derive it." - The Obsidian Protocol
 * 
 * This service implements the Do-Calculus (Rung 2/3) logic.
 * It takes a Structural Causal Model (SCM) and a set of Interventions (do(X=x))
 * and calculates the mandatory state of the downstream nodes.
 */
export class CausalSolver {
  /**
   * Solves the graph for a given set of interventions.
   * Applying do(X=x) effectively "mutilates" the graph by removing all incoming edges to X.
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
   * These are the nodes whose values MUST change according to the 3rd Rule of Do-Calculus.
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
   * Generates the "Surgery Prompt" for the LLM.
   * This tells the Constraint Injector: "X is fixed to x. Ignore all previous correlations for X."
   */
  generateDoPrompt(interventions: Intervention[]): string {
    if (interventions.length === 0) return "";

    return `
### CAUSAL SURGERY (DO-OPERATOR ACTIVE):
The user has performed a Structural Intervention:
${interventions.map(i => `- do(${i.nodeName} = ${i.value})`).join('\n')}

**CRITICAL INSTRUCTION:**
1.  **Graph Mutilation**: You must IGNORE any prior causes of [${interventions.map(i => i.nodeName).join(', ')}]. Their values are now fixed by FIAT, not by their parents.
2.  **Forward Propagation**: You must strictly derive the consequences on downstream nodes based on the structural equations.
3.  **Counterfactual Logic**: If this contradicts observing reality (e.g. "The sun is cold"), you MUST accept the intervention and describe the counterfactual world. Do not revert to the "likely" world.
`;
  }
}
