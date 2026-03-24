import type { AlignmentValidationMetadata } from "@/types/alignment";

export interface SCMModel {
  id: string;
  modelKey: string;
  domain: string;
  name: string;
  description?: string | null;
  status: 'active' | 'deprecated' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface SCMModelVersion {
  id: string;
  modelId: string;
  version: string;
  isCurrent: boolean;
  dagJson: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  /**
   * @deprecated Use TypedSCM.equations (typed StructuralEquation[]). Migration required for v1.0 engine.
   */
  structuralEquationsJson: Array<Record<string, unknown>>;
  assumptionsJson: Array<Record<string, unknown> | string>;
  confoundersJson: Array<Record<string, unknown> | string>;
  constraintsJson: Array<Record<string, unknown> | string>;
  provenanceJson: Record<string, unknown>;
  validationJson: SCMValidationJson;
  createdAt: string;
  updatedAt: string;
}

export interface SCMValidationJson extends Record<string, unknown> {
  bias_sensitive_paths?: AlignmentValidationMetadata["bias_sensitive_paths"];
  do_interventions?: AlignmentValidationMetadata["do_interventions"];
  alignment_formula?: AlignmentValidationMetadata["alignment_formula"];
}

export interface SCMVariable {
  id: string;
  canonicalName: string;
  aliases: string[];
  unit?: string | null;
  description?: string | null;
  domain?: {
    min: number;
    max: number;
  } | null;
  datatype: 'number' | 'integer' | 'boolean' | 'string' | 'categorical' | 'json';
  createdAt: string;
  updatedAt: string;
}

export interface SCMVariableMap {
  id: string;
  versionId: string;
  variableId: string;
  role: 'outcome' | 'treatment' | 'confounder' | 'mediator' | 'exogenous' | 'observable' | 'latent';
  required: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A linear structural equation: V = intercept + sum(coefficient_i * parent_i)
 * v1.0 scope: linear only. Nonlinear deferred to v1.1.
 */
export interface StructuralEquation {
  /** The variable this equation defines. */
  variable: string;
  /** Parent variables (direct causes) in the DAG. */
  parents: string[];
  /** Coefficient for each parent: { parentName: coefficient }. */
  coefficients: Record<string, number>;
  /** Constant term (intercept). Includes absorbed exogenous effect (U_i = 0). */
  intercept: number;
}

/**
 * A fully specified Structural Causal Model for v1.0.
 * Deterministic (U_i = 0), linear, acyclic, no hidden confounders.
 */
export interface TypedSCM {
  /** All variables in the model with metadata. */
  variables: SCMVariable[];
  /** One structural equation per endogenous variable. */
  equations: StructuralEquation[];
  /** The causal DAG. */
  dag: {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
  };
}

/**
 * A formal causal query for the v1.0 engine.
 * v1.0 supports: observational and interventional.
 * Adjustment queries are deferred to v1.1.
 */
export interface CausalQuery {
  type: 'observational' | 'interventional';
  /** The intervention variable (for interventional queries). */
  treatment: string;
  /** The outcome variable to compute. */
  outcome: string;
  /** The value to set the treatment to: do(treatment = doValue). */
  doValue: number;
  /** Optional conditioning: compute Y_{do(X=x)} given Z=z. */
  conditions?: Record<string, number>;
}

/**
 * The result of a v1.0 engine computation.
 * Returns a deterministic point value, not a distribution.
 */
export interface CausalResult {
  /** The computed value: Y_{do(X=x)}. */
  value: number;
  /** The query that produced this result. */
  query: CausalQuery;
  /** Variable values computed during forward evaluation. */
  trace: Record<string, number>;
  /** Explicit topological evaluation sequence from the mutilated graph solver. */
  evaluationOrder: string[];
  /** The mutilated DAG (edges removed by do-operator). */
  mutilatedEdges: Array<{ from: string; to: string }>;
  /** Computation method, always 'structural_equation_solver' for v1.0. */
  method: 'structural_equation_solver';
}

/**
 * The raw output of forwardSolve.
 * Caller maps this to CausalResult.
 */
export interface SolverResult {
  /** The computed value of the queried outcome variable. */
  outcomeValue: number;
  /** All computed values, keyed by variable name. */
  valueMap: Record<string, number>;
  /** The topological evaluation sequence used by the solver. */
  evaluationOrder: string[];
}

export interface SolverError {
  code:
    | 'OUTCOME_NOT_IN_DAG'
    | 'EQUATION_MISSING'
    | 'PARENT_VALUE_MISSING'
    | 'CYCLE_DETECTED'
    | 'CONDITION_VARIABLE_NOT_COMPUTED'
    | 'CONDITION_NOT_SATISFIED';
  message: string;
  variable?: string;
  missingParent?: string;
  computedValue?: number;
  requiredValue?: number;
}

export interface VariableAlignment {
  input: string;
  canonical?: string;
  variableId?: string;
  confidence: number;
  matchedBy: 'canonical' | 'alias' | 'normalized' | 'none';
}

export interface VariableAlignmentResult {
  aligned: VariableAlignment[];
  unknown: string[];
}

export type CausalUserLevel = 'novice' | 'intermediate' | 'expert';
export type TeachBackMode = 'quick_estimate' | 'full_recompute';

export interface TeachBackEdit {
  type: 'add_edge' | 'remove_edge' | 'remove_variable' | 'challenge_assumption';
  from?: string;
  to?: string;
  variable?: string;
  assumption?: string;
  note?: string;
}

export interface CausalLiteracyRequest {
  runId?: string;
  ideaId?: string;
  modelKey: string;
  version?: string;
  userLevel: CausalUserLevel;
  hypothesis?: {
    thesis?: string;
    description?: string;
    mechanism?: string;
    doQuery?: string;
    doPlan?: string;
    falsifier?: string;
    confounderSet?: string[];
  };
  audit?: {
    validityScore?: number;
    critique?: string;
  };
  teachBackEdits?: TeachBackEdit[];
  sandboxMode?: TeachBackMode;
}

export interface CausalLiteracyLayer {
  title: string;
  summary: string;
  bullets: string[];
}

export interface CausalLiteracyResponse {
  success: boolean;
  modelRef: {
    modelKey: string;
    version: string;
  };
  userLevel: CausalUserLevel;
  modelLayer: CausalLiteracyLayer;
  interventionLayer: CausalLiteracyLayer;
  counterfactualLayer: CausalLiteracyLayer;
  assumptionLayer: CausalLiteracyLayer;
  teachBack?: {
    mode: TeachBackMode;
    operation: TeachBackEdit["type"];
    persisted: false;
    method: 'heuristic_graph_propagation' | 'structural_reachability_recompute';
    uncertainty: 'high' | 'medium';
    limitations: string[];
    affectedNodes: string[];
    confidenceDelta: number;
    consequenceSummary: string;
    delta?: {
      addedEdges: number;
      removedEdges: number;
      affectedPaths: number;
      newlyReachable: string[];
      noLongerReachable: string[];
    };
  };
}

export interface SCMHypothesisSkeleton {
  cause: string;
  effect: string;
  mechanismClaim: string;
  doQuery: string;
  falsifier: string;
  confounders: string[];
  expectedSign: 'positive' | 'negative' | 'nonlinear';
}

export interface EpistemicWeightBreakdown {
  dataGrounded: number;
  mechanismGrounded: number;
  assumptionGrounded: number;
}

export interface DisagreementAtom {
  type: 'edge_presence' | 'edge_direction' | 'edge_sign' | 'assumption' | 'confounder' | 'intervention' | 'counterfactual';
  severity: 'low' | 'medium' | 'high';
  leftModelValue: string;
  rightModelValue: string;
  variable?: string;
  edge?: { from: string; to: string };
  reason: string;
  epistemicWeight: EpistemicWeightBreakdown;
}

export interface DisagreementReport {
  success: boolean;
  score: number;
  summary: string;
  atoms: DisagreementAtom[];
  alignedVariables: VariableAlignment[];
  alignmentQuality?: {
    coverage: number;
    threshold: number;
    unknownVariables: string[];
    crossDomain: boolean;
  };
}

export interface SCMModelReference {
  modelKey: string;
  version?: string;
}

export interface SCMInlineSpec {
  modelKey?: string;
  version?: string;
  dagJson: {
    nodes: Array<Record<string, unknown> | string>;
    edges: Array<Record<string, unknown>>;
  };
  assumptionsJson?: Array<Record<string, unknown> | string>;
  confoundersJson?: Array<Record<string, unknown> | string>;
  validationJson?: Record<string, unknown>;
}

export interface DisagreementCompareRequest {
  leftModelRef?: SCMModelReference;
  rightModelRef?: SCMModelReference;
  leftSpec?: SCMInlineSpec;
  rightSpec?: SCMInlineSpec;
  outcomeVar: string;
  interventions?: string[];
}

export interface SCMPromotionOverride {
  approvedBy?: string;
  rationale: string;
}

export interface SCMPromotionRequest {
  candidateVersion: string;
  baselineVersion?: string;
  outcomeVar: string;
  interventions?: string[];
  override?: SCMPromotionOverride;
}

export interface SCMPromotionGate {
  allowed: boolean;
  blocked: boolean;
  reason: string;
  requiresManualOverride: boolean;
  overrideUsed: boolean;
  highSeverityAtoms: number;
  mediumSeverityAtoms: number;
  lowSeverityAtoms: number;
  unresolvedHighSeverityAtoms: number;
  alignmentCoverage: number;
  requiredAlignmentCoverage: number;
  unknownVariables: string[];
}

export interface SCMPromotionResponse {
  success: boolean;
  promoted?: boolean;
  modelKey?: string;
  baselineVersion?: string;
  candidateVersion?: string;
  reportId?: string | null;
  auditId?: string | null;
  gate?: SCMPromotionGate;
  report?: DisagreementReport;
  integrityStatus?: ScientificIntegrityStatus;
  error?: string;
}

export interface ScientificIntegrityChecklistItem {
  id: "benchmark_sustained" | "hypothesis_lifecycle_auditable" | "deterministic_trace_provenance";
  title: string;
  required: boolean;
  pass: boolean;
  reason: string;
}

export interface ScientificIntegrityStatus {
  generatedAt: string;
  overallPass: boolean;
  freezePromotion: boolean;
  checks: {
    benchmarkSustained: {
      pass: boolean;
      requiredRuns: number;
      observedRuns: number;
      passedRuns: number;
    };
    hypothesisLifecycleAuditable: {
      pass: boolean;
      proposed: number;
      tested: number;
      falsified: number;
      retracted: number;
      malformedEvents: number;
    };
    deterministicTraceProvenance: {
      pass: boolean;
      totalRecentTraces: number;
      deterministicTraces: number;
      deterministicCoverage: number;
      requiredCoverage: number;
      minimumDeterministicTraces: number;
    };
  };
  checklist: ScientificIntegrityChecklistItem[];
}

export interface ScientificIntegritySignoffRequest {
  decision: "approved" | "rejected";
  rationale: string;
  override?: boolean;
}

export interface ScientificIntegritySignoffResponse {
  success: boolean;
  signoffId?: string;
  status?: ScientificIntegrityStatus;
  error?: string;
}

export interface CausalAutopsyRequest {
  runId?: string;
  modelKey?: string;
  domain?: string;
  version?: string;
  failureEvent?: {
    title?: string;
    observedOutcome?: string;
    observedActions?: string[];
    timeline?: string[];
  };
}

export interface CausalAutopsyResponse {
  success: boolean;
  modelRef: {
    modelKey: string;
    version: string;
    domain?: string;
    name?: string;
    status?: 'active' | 'deprecated' | 'draft';
    provenance?: Record<string, unknown>;
  };
  rootCauses: string[];
  symptoms: string[];
  failedAssumptions: string[];
  necessityScores: Array<{ factor: string; score: number }>;
  preventionPlan: string[];
}

export type InterventionAllowedOutputClass =
  | "association_only"
  | "intervention_inferred"
  | "intervention_supported";

export type CounterfactualComputationMethod =
  | "heuristic_bfs_propagation"
  | "structural_equation_solver"
  | "deterministic_graph_diff";

export type CounterfactualUncertainty = "none" | "high" | "medium" | "low";

export interface CounterfactualTrace {
  traceId: string;
  modelRef: {
    modelKey: string;
    version: string;
  };
  query: {
    intervention: {
      variable: string;
      value: number;
    };
    outcome: string;
    observedWorld: Record<string, number>;
  };
  assumptions: string[];
  adjustmentSet: string[];
  computation: {
    method: CounterfactualComputationMethod;
    affectedNodes: string[];
    evaluationOrder?: string[];
    traceValues?: Record<string, number>;
    note?: string;
    uncertainty: CounterfactualUncertainty;
  };
  result: {
    actualOutcome: number;
    counterfactualOutcome: number;
    delta: number;
  };
}

export interface CounterfactualTraceRef {
  traceId: string;
  method: CounterfactualComputationMethod;
  uncertainty: CounterfactualUncertainty;
  retrievalPath: string;
  persisted: boolean;
}

export interface CounterfactualTraceResponse {
  success: boolean;
  trace?: CounterfactualTrace;
  error?: string;
}

export interface InterventionValidateRequest {
  modelRef: SCMModelReference;
  treatment: string;
  outcome: string;
  adjustmentSet?: string[];
  knownConfounders?: string[];
}

export interface InterventionValidateResponse {
  success: boolean;
  allowed: boolean;
  allowedOutputClass: InterventionAllowedOutputClass;
  rationale: string;
  modelRef?: {
    modelKey: string;
    version: string;
  };
  identifiability?: {
    identifiable: boolean;
    requiredConfounders: string[];
    adjustmentSet: string[];
    missingConfounders: string[];
    note: string;
  };
  error?: string;
}
