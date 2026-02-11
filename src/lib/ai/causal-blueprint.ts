/**
 * Pearl's "Innate Blueprint" - Structural Causal Model (SCM)
 * 
 * Implements Tier 1 universal causal constraints that CANNOT be violated.
 * Based on Judea Pearl's insight: "We must give machines this blueprint or
 * framework (the Structural Causal Model) that allows them to fill in the
 * blanks of their environment." [Pearl Podcast, 40:05]
 * 
 * Phase 28: Pearl's Causal Blueprint Integration
 */

export interface CausalNode {
  name: string;
  type: 'observable' | 'latent' | 'exogenous' | 'intervention';
  domain: 'physics' | 'chemistry' | 'biology' | 'abstract';
  description?: string;
  domain_range?: string;
  measurement_method?: string;
}

export interface CausalEdge {
  from: string;
  to: string;
  constraint: 'conservation' | 'entropy' | 'causality' | 'locality';
  reversible: boolean;
  sign?: '+' | '-' | 'unknown';
  strength?: number;
  mechanism_description?: string;
  evidence_type?: string;
}

export interface AssociationQueryResult {
  estimand: string;
  value: number;
  path: string[];
  note: string;
}

export interface InterventionQueryResult {
  estimand: string;
  baselineOutcome: number;
  intervenedOutcome: number;
  delta: number;
  affectedNodes: string[];
}

export interface CounterfactualQueryResult {
  estimand: string;
  actualOutcome: number;
  counterfactualOutcome: number;
  difference: number;
  explanation: string;
}

export interface DSeparationResult {
  dSeparated: boolean;
  activePaths: string[][];
  note: string;
}

export interface IdentifiabilityResult {
  identifiable: boolean;
  requiredConfounders: string[];
  adjustmentSet: string[];
  missingConfounders: string[];
  note: string;
}

export interface ConfounderCompletenessResult {
  complete: boolean;
  coverage: number;
  missing: string[];
  extras: string[];
}

// Phase 28: Pearl's Causal Blueprint (Tier 1: Universal Physics)
export type ConstraintType = 
  | 'conservation' 
  | 'entropy' 
  | 'causality' 
  | 'locality'
  | 'network_cooperation'       // Tier 2: Ecology
  | 'empirical_contradiction'   // Tier 2: Ecology
  | 'kin_selection'             // Tier 2: Selfish Gene (Phase 29)
  | 'reference_point'           // Tier 2: Cognitive Psych (Phase 30)
  | 'loss_aversion'             // Tier 2: Cognitive Psych (Phase 30)
  | 'beta_regime'               // Tier 2: Scaling Laws (Phase 31)
  | 'singularity_risk'          // Tier 2: Scaling Laws (Phase 31)
  | 'interventional_contradiction'; // Layer 2: do-Calculus

export type ViolationSeverity = 'fatal' | 'warning';

export interface SCMViolation {
  constraint: ConstraintType;
  description: string;
  severity: ViolationSeverity;
  evidence?: string; // Phase 28.5: Empirical evidence citation
}

// Backwards compatibility alias
export type ConstraintViolation = SCMViolation;

export interface DAGValidationResult {
  valid: boolean;
  violations: SCMViolation[];
  passedConstraints: string[];
}

/**
 * Structural Causal Model - Pearl's Innate Causal Blueprint
 * 
 * This class implements TIER 1 constraints: universal physical laws that
 * are ALWAYS true, regardless of domain. These are hard-coded, not learned.
 * 
 * Tier 1 Constraints:
 * 1. Conservation of Energy (1st Law of Thermodynamics)
 * 2. Entropy Increase (2nd Law of Thermodynamics)
 * 3. Causality (Arrow of Time - effect cannot precede cause)
 * 
 * Future Tiers (not implemented):
 * - Tier 2: Domain-specific templates (e.g., Arrhenius equation for chemistry)
 * - Tier 3: Learned causal relationships (requires RCT validation)
 */
export class StructuralCausalModel {
  // Unique identifier for this SCM instance (for phenomenal state tracking)
  public id: string;
  public description?: string;
  
  // Tier 1: Universal nodes (immutable, domain-agnostic)
  private readonly INNATE_NODES: CausalNode[] = [
    { name: 'Energy', type: 'observable', domain: 'physics' },
    { name: 'Mass', type: 'observable', domain: 'physics' },
    { name: 'Time', type: 'exogenous', domain: 'physics' },
    { name: 'Entropy', type: 'latent', domain: 'physics' },
  ];

  // Tier 1: Universal edges (hard constraints from physics)
  private readonly INNATE_EDGES: CausalEdge[] = [
    {
      from: 'Energy_in',
      to: 'Energy_out',
      constraint: 'conservation',
      reversible: false,
    },
    {
      from: 'Time',
      to: 'Entropy',
      constraint: 'entropy',
      reversible: false,
    },
  ];
  
  constructor(id?: string, description?: string) {
    // Generate unique ID for phenomenal state tracking
    this.id = id || crypto.randomUUID();
    this.description = description;
  }

  /**
   * Validate a proposed mechanism against universal physical constraints
   * @param mechanismText - LLM-generated mechanism description
   * @returns Validation result with specific violations
   */
  async validateMechanism(mechanismText: string): Promise<DAGValidationResult> {
    const violations: ConstraintViolation[] = [];
    const passedConstraints: string[] = [];

    // Constraint 1: Conservation of Energy
    const conservationTest = await this.checkConservation(mechanismText);
    if (conservationTest.violated) {
      violations.push({
        constraint: 'conservation',
        description: conservationTest.reason,
        severity: 'fatal',
        evidence: conservationTest.evidence,
      });
    } else {
      passedConstraints.push('conservation');
    }

    // Constraint 2: Entropy Increase (2nd Law)
    const entropyTest = this.checkEntropy(mechanismText);
    if (entropyTest.violated) {
      violations.push({
        constraint: 'entropy',
        description: entropyTest.reason,
        severity: 'fatal',
        evidence: entropyTest.evidence,
      });
    } else {
      passedConstraints.push('entropy');
    }

    // Constraint 3: Causality (Arrow of Time)
    const causalityTest = this.checkCausality(mechanismText);
    if (causalityTest.violated) {
      violations.push({
        constraint: 'causality',
        description: causalityTest.reason,
        severity: 'fatal',
        evidence: causalityTest.evidence,
      });
    } else {
      passedConstraints.push('causality');
    }

    return {
      valid: violations.filter((v) => v.severity === 'fatal').length === 0,
      violations,
      passedConstraints,
    };
  }

  /**
   * Check Conservation of Energy (1st Law of Thermodynamics)
   * 
   * Violation criteria:
   * - Output energy > Input energy WITHOUT external source
   * - Keywords: "perpetual motion", "energy from nothing", "free energy"
   * - Missing energy accounting in chemical reactions
   */
  private async checkConservation(
    mechanismText: string
  ): Promise<{ violated: boolean; reason: string; evidence?: string }> {
    // Pattern 1: Explicit perpetual motion claims
    const perpetualMotionPattern = /perpetual\s+motion|energy\s+from\s+nothing|free\s+energy|over[-\s]?unity/i;
    if (perpetualMotionPattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Mechanism implies perpetual motion or energy creation (violates 1st law)',
        evidence: mechanismText.match(perpetualMotionPattern)?.[0],
      };
    }

    // Pattern 2: Energy increase without source
    const energyIncreasePattern = /(generate|create|produce)\s+.*energy/i;
    const energySourcePattern = /(input|external|source|supplied|provided)\s+.*energy/i;
    
    if (energyIncreasePattern.test(mechanismText) && !energySourcePattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Energy output claimed without identified input source',
        evidence: mechanismText.match(energyIncreasePattern)?.[0],
      };
    }

    // Pattern 3: Closed-loop energy recycling (100% efficiency impossible)
    const closedLoopPattern = /recycle.*energy|feedback.*loop.*energy|self[-\s]sustaining/i;
    const efficiencyPattern = /100%|perfect|complete/i;
    
    if (closedLoopPattern.test(mechanismText) && efficiencyPattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Claims 100% energy recycling (no real process is 100% efficient)',
        evidence: mechanismText.match(closedLoopPattern)?.[0],
      };
    }

    return { violated: false, reason: 'Conservation of energy maintained' };
  }

  /**
   * Check Entropy Increase (2nd Law of Thermodynamics)
   * 
   * Violation criteria:
   * - Disorder decrease WITHOUT work input
   * - Spontaneous ordering at constant temperature
   * - Keywords: "perfect crystal", "complete organization", "reverse entropy"
   */
  private checkEntropy(
    mechanismText: string
  ): { violated: boolean; reason: string; evidence?: string } {
    // Pattern 1: Explicit entropy decrease claims
    const entropyDecreasePattern = /decreas(e|ing)\s+entropy|reverse\s+entropy|negative\s+entropy/i;
    const workInputPattern = /(work|energy)\s+input|external\s+field|cooling|refrigeration/i;

    if (entropyDecreasePattern.test(mechanismText) && !workInputPattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Entropy decrease without work input (violates 2nd law)',
        evidence: mechanismText.match(entropyDecreasePattern)?.[0],
      };
    }

    // Pattern 2: Spontaneous ordering at equilibrium
    const spontaneousOrderingPattern = /spontaneous.*order|self[-\s]organiz(e|ing).*equilibrium|perfect.*crystal.*form/i;
    const temperaturePattern = /room\s+temperature|ambient|constant\s+temperature/i;

    if (spontaneousOrderingPattern.test(mechanismText) && temperaturePattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Spontaneous ordering at constant temperature violates 2nd law',
        evidence: mechanismText.match(spontaneousOrderingPattern)?.[0],
      };
    }

    // Pattern 3: Maxwell's demon scenarios
    const demonPattern = /selective.*filter|intelligent.*sorting|perfect.*separation/i;
    
    if (demonPattern.test(mechanismText) && !workInputPattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Implies Maxwell demon-like separation without energy cost',
        evidence: mechanismText.match(demonPattern)?.[0],
      };
    }

    return { violated: false, reason: 'Entropy constraint satisfied' };
  }

  /**
   * Check Causality / Arrow of Time
   * 
   * Violation criteria:
   * - Effect occurring before cause
   * - Retrocausation claims
   * - Time-reversed processes without quantum context
   */
  private checkCausality(
    mechanismText: string
  ): { violated: boolean; reason: string; evidence?: string } {
    // Pattern 1: Explicit retrocausation
    const retrocausalPattern = /retrocaus(e|al|ation)|backward.*time|effect.*before.*cause/i;
    
    if (retrocausalPattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Mechanism implies retrocausation (effect precedes cause)',
        evidence: mechanismText.match(retrocausalPattern)?.[0],
      };
    }

    // Pattern 2: Time travel or temporal paradoxes
    const temporalPattern = /time\s+travel|temporal\s+paradox|future\s+cause.*past/i;
    
    if (temporalPattern.test(mechanismText)) {
      return {
        violated: true,
        reason: 'Mechanism involves time travel or temporal paradoxes',
        evidence: mechanismText.match(temporalPattern)?.[0],
      };
    }

    // Pattern 3: Prediction-based causation (common LLM error)
    const predictionCausationPattern = /predict(ion)?\s+cause|forecast\s+lead|anticipation\s+trigger/i;
    
    if (predictionCausationPattern.test(mechanismText)) {
      return {
        violated: false, // Warning, not fatal
        reason: 'Warning: Prediction does not imply causation',
        evidence: mechanismText.match(predictionCausationPattern)?.[0],
      };
    }

    return { violated: false, reason: 'Causality preserved (time arrow respected)' };
  }

  /**
   * Get natural language descriptions of Tier 1 constraints for LLM grounding
   */
  getConstraints(): string[] {
    return [
      "Conservation of Energy: Energy cannot be created or destroyed; output energy must have an identified input source.",
      "Entropy Increase: Entropy/disorder must increase in any spontaneous process; work input is required to reverse entropy.",
      "Causality (Arrow of Time): Effect cannot precede cause; retrocausation is forbidden."
    ];
  }

  // Tier 2+: Custom/Learned nodes and edges (injected from Truth Store)
  protected customNodes: CausalNode[] = [];
  protected customEdges: CausalEdge[] = [];

  /**
   * Hydrate the model with structure from the Truth Store (Database)
   * @param nodes - Nodes from the DB
   * @param edges - Edges from the DB
   */
  hydrate(nodes: CausalNode[], edges: CausalEdge[]) {
    this.customNodes = nodes;
    this.customEdges = edges;
  }

  /**
   * Get the innate causal graph structure
   * @returns The hard-coded universal nodes and edges
   */
  getInnateStructure(): { nodes: CausalNode[]; edges: CausalEdge[] } {
    return {
      nodes: [...this.INNATE_NODES],
      edges: [...this.INNATE_EDGES],
    };
  }

  /**
   * Get the full causal graph structure (Innate + Custom)
   * @returns Combined nodes and edges
   */
  getFullStructure(): { nodes: CausalNode[]; edges: CausalEdge[] } {
    return {
      nodes: [...this.INNATE_NODES, ...this.customNodes],
      edges: [...this.INNATE_EDGES, ...this.customEdges],
    };
  }

  /**
   * Serialize the model to JSON for AI processing or storage
   */
  toJSON() {
    return {
      id: this.id,
      description: this.description,
      nodes: [...this.INNATE_NODES, ...this.customNodes],
      edges: [...this.INNATE_EDGES, ...this.customEdges],
    };
  }

  /**
   * Association operator: estimate observational relationship P(Y | X).
   * This is intentionally conservative and does not imply intervention semantics.
   */
  queryAssociation(
    cause: string,
    effect: string,
    observed: Record<string, number> = {}
  ): AssociationQueryResult {
    const path = this.findDirectedPath(cause, effect);
    const pathWeight = this.pathWeight(path);
    const causeValue = observed[cause] ?? 0;
    const value = Number((causeValue * pathWeight).toFixed(4));

    return {
      estimand: `P(${effect} | ${cause})`,
      value,
      path,
      note: "Observational estimate only. Use do() operator for causal intervention claims.",
    };
  }

  /**
   * Intervention operator: estimate P(Y | do(X = x)).
   * Propagates an exogenous change through directed edges with depth decay.
   */
  queryIntervention(params: {
    interventionVariable: string;
    interventionValue: number;
    outcome: string;
    baseline?: Record<string, number>;
  }): InterventionQueryResult {
    const { interventionVariable, interventionValue, outcome, baseline = {} } = params;
    const deltaByNode = this.propagateIntervention(interventionVariable, interventionValue);
    const baselineOutcome = baseline[outcome] ?? 0;
    const delta = deltaByNode.get(outcome) ?? 0;

    return {
      estimand: `P(${outcome} | do(${interventionVariable}=${interventionValue}))`,
      baselineOutcome,
      intervenedOutcome: Number((baselineOutcome + delta).toFixed(4)),
      delta: Number(delta.toFixed(4)),
      affectedNodes: Array.from(deltaByNode.keys()),
    };
  }

  /**
   * Counterfactual operator: estimate Y_x(u) given observed world and a hypothetical action.
   */
  queryCounterfactual(params: {
    interventionVariable: string;
    interventionValue: number;
    outcome: string;
    observed: Record<string, number>;
  }): CounterfactualQueryResult {
    const { interventionVariable, interventionValue, outcome, observed } = params;
    const intervention = this.queryIntervention({
      interventionVariable,
      interventionValue,
      outcome,
      baseline: observed,
    });
    const actualOutcome = observed[outcome] ?? 0;
    const counterfactualOutcome = intervention.intervenedOutcome;
    const difference = Number((counterfactualOutcome - actualOutcome).toFixed(4));

    return {
      estimand: `${outcome}_${interventionVariable}(${interventionValue})`,
      actualOutcome: Number(actualOutcome.toFixed(4)),
      counterfactualOutcome: Number(counterfactualOutcome.toFixed(4)),
      difference,
      explanation:
        difference === 0
          ? "Counterfactual change is negligible under current structure."
          : `Under do(${interventionVariable}=${interventionValue}), ${outcome} shifts by ${difference}.`,
    };
  }

  /**
   * Lightweight d-separation approximation:
   * returns active undirected paths that remain after conditioning.
   */
  checkDSeparation(x: string, y: string, conditionedOn: string[] = []): DSeparationResult {
    const conditioned = new Set(conditionedOn.map((item) => this.normalize(item)));
    const allPaths = this.findUndirectedPaths(x, y, 6);
    const activePaths = allPaths.filter((path) =>
      path.slice(1, -1).every((node) => !conditioned.has(this.normalize(node)))
    );

    return {
      dSeparated: activePaths.length === 0,
      activePaths,
      note:
        activePaths.length === 0
          ? "No active paths remain after conditioning."
          : "At least one active path remains; variables are not d-separated under this conditioning set.",
    };
  }

  /**
   * Backdoor-style identifiability check against known/structural confounders.
   */
  checkIdentifiability(params: {
    treatment: string;
    outcome: string;
    adjustmentSet?: string[];
    knownConfounders?: string[];
  }): IdentifiabilityResult {
    const { treatment, outcome, adjustmentSet = [], knownConfounders = [] } = params;
    const structuralConfounders = this.getStructuralConfounders(treatment, outcome);
    const required = Array.from(new Set([...structuralConfounders, ...knownConfounders]));
    const normalizedAdjustment = new Set(adjustmentSet.map((item) => this.normalize(item)));
    const missingConfounders = required.filter((item) => !normalizedAdjustment.has(this.normalize(item)));

    return {
      identifiable: missingConfounders.length === 0,
      requiredConfounders: required,
      adjustmentSet,
      missingConfounders,
      note:
        missingConfounders.length === 0
          ? "Backdoor confounders are controlled; effect is identifiable under provided assumptions."
          : "Effect is not identifiable until missing confounders are controlled.",
    };
  }

  checkConfounderCompleteness(required: string[], provided: string[]): ConfounderCompletenessResult {
    const normalizedProvided = new Set(provided.map((item) => this.normalize(item)));
    const missing = required.filter((item) => !normalizedProvided.has(this.normalize(item)));
    const normalizedRequired = new Set(required.map((item) => this.normalize(item)));
    const extras = provided.filter((item) => !normalizedRequired.has(this.normalize(item)));
    const coverage = required.length === 0 ? 1 : (required.length - missing.length) / required.length;

    return {
      complete: missing.length === 0,
      coverage: Number(coverage.toFixed(4)),
      missing,
      extras,
    };
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private edgeSign(edge: CausalEdge): number {
    if (edge.sign === "-") return -1;
    return 1;
  }

  private edgeStrength(edge: CausalEdge): number {
    if (typeof edge.strength === "number") {
      return Math.max(0.1, Math.min(2, edge.strength));
    }
    return 1;
  }

  private buildAdjacency(): Map<string, CausalEdge[]> {
    const map = new Map<string, CausalEdge[]>();
    for (const edge of this.getFullStructure().edges) {
      const list = map.get(edge.from) ?? [];
      list.push(edge);
      map.set(edge.from, list);
    }
    return map;
  }

  private findDirectedPath(start: string, end: string): string[] {
    const adjacency = this.buildAdjacency();
    const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (this.normalize(current.node) === this.normalize(end)) {
        return current.path;
      }

      const marker = `${this.normalize(current.node)}:${current.path.length}`;
      if (visited.has(marker)) continue;
      visited.add(marker);

      for (const edge of adjacency.get(current.node) ?? []) {
        queue.push({ node: edge.to, path: [...current.path, edge.to] });
      }
    }

    return [start, end];
  }

  private pathWeight(path: string[]): number {
    if (path.length < 2) return 0;
    const edges = this.getFullStructure().edges;
    let weight = 1;

    for (let i = 0; i < path.length - 1; i += 1) {
      const from = path[i];
      const to = path[i + 1];
      const edge = edges.find((item) => this.normalize(item.from) === this.normalize(from) && this.normalize(item.to) === this.normalize(to));
      if (!edge) {
        weight *= 0.5;
        continue;
      }
      weight *= this.edgeSign(edge) * this.edgeStrength(edge) * 0.85;
    }

    return Number(weight.toFixed(4));
  }

  private propagateIntervention(variable: string, value: number): Map<string, number> {
    const adjacency = this.buildAdjacency();
    const deltas = new Map<string, number>();
    const queue: Array<{ node: string; delta: number; depth: number }> = [{ node: variable, delta: value, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth > 6) continue;

      const existing = deltas.get(current.node) ?? 0;
      deltas.set(current.node, existing + current.delta);

      for (const edge of adjacency.get(current.node) ?? []) {
        const propagated = current.delta * this.edgeSign(edge) * this.edgeStrength(edge) * 0.7;
        if (Math.abs(propagated) < 0.0001) continue;
        queue.push({ node: edge.to, delta: propagated, depth: current.depth + 1 });
      }
    }

    return deltas;
  }

  private findUndirectedPaths(start: string, end: string, maxDepth: number): string[][] {
    const edges = this.getFullStructure().edges;
    const neighbors = new Map<string, Set<string>>();

    for (const edge of edges) {
      const left = neighbors.get(edge.from) ?? new Set<string>();
      left.add(edge.to);
      neighbors.set(edge.from, left);

      const right = neighbors.get(edge.to) ?? new Set<string>();
      right.add(edge.from);
      neighbors.set(edge.to, right);
    }

    const paths: string[][] = [];
    const stack: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current.path.length > maxDepth) continue;
      if (this.normalize(current.node) === this.normalize(end)) {
        paths.push(current.path);
        continue;
      }

      for (const neighbor of neighbors.get(current.node) ?? []) {
        if (current.path.some((item) => this.normalize(item) === this.normalize(neighbor))) continue;
        stack.push({ node: neighbor, path: [...current.path, neighbor] });
      }
    }

    return paths;
  }

  private getStructuralConfounders(treatment: string, outcome: string): string[] {
    const edges = this.getFullStructure().edges;
    const treatmentParents = new Set(
      edges.filter((edge) => this.normalize(edge.to) === this.normalize(treatment)).map((edge) => edge.from)
    );
    const outcomeParents = new Set(
      edges.filter((edge) => this.normalize(edge.to) === this.normalize(outcome)).map((edge) => edge.from)
    );

    return Array.from(treatmentParents).filter((node) =>
      Array.from(outcomeParents).some((candidate) => this.normalize(candidate) === this.normalize(node))
    );
  }
}
