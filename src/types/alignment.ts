export interface AlignmentNode {
  id: string;
  label: string;
  kind: string;
  time?: string;
  description?: string;
}

export interface AlignmentEdge {
  source: string;
  target: string;
  type: string;
  channel?: string;
  lag?: number;
}

export interface AlignmentDoIntervention {
  name: string;
  target: string;
  description?: string;
}

export interface AlignmentFormulaMetadata {
  statement: string;
  execution_metric?: string;
  representation_metric?: string;
  bias_metric?: string;
}

export interface AlignmentScmSpec {
  name: string;
  version: string;
  description?: string;
  nodes: AlignmentNode[];
  edges: AlignmentEdge[];
  alignment_formula?: AlignmentFormulaMetadata;
  bias_sensitive_paths?: string[][];
  do_interventions?: AlignmentDoIntervention[];
}

export interface AlignmentValidationMetadata {
  alignment_formula?: AlignmentFormulaMetadata;
  bias_sensitive_paths?: string[][];
  do_interventions?: AlignmentDoIntervention[];
}

export interface AlignmentGraphValidation {
  node_count?: number;
  edge_count?: number;
  missing_node_references?: Array<{ source: string; target: string }>;
  causal_slice_is_dag?: boolean;
}

export interface AlignmentFairnessMetrics {
  fairness_gap_index?: number;
  demographic_parity_gap?: number;
  equal_opportunity_gap?: number;
  false_positive_rate_gap?: number;
  groups?: Record<
    string,
    {
      count?: number;
      demographic_parity?: number;
      true_positive_rate?: number;
      false_positive_rate?: number;
      confusion?: { tp?: number; fp?: number; tn?: number; fn?: number };
    }
  >;
}

export interface AlignmentPathSpecificFairness {
  available?: boolean;
  protected_attribute?: string;
  outcome_column?: string;
  mediators?: string[];
  reference_group?: string;
  target_group?: string;
  total_gap_target_minus_reference?: number;
  direct_gap_after_blocking_mediated_paths?: number;
  mediated_gap_removed?: number;
  mediated_gap_removed_ratio?: number;
  sign_flip_after_blocking?: boolean;
  reason?: string;
}

export interface AlignmentBiasDynamics {
  initial_bias?: number;
  feedback_strength?: number;
  mitigation_strength?: number;
  series?: number[];
}

export interface AlignmentDecision {
  aligned?: boolean;
  failures?: string[];
  recommended_interventions?: string[];
  inputs?: {
    execution_score?: number;
    representation_score?: number;
    bias_score?: number;
  };
  thresholds?: {
    execution_threshold?: number;
    representation_threshold?: number;
    bias_threshold?: number;
  };
}

export interface AlignmentAuditReport {
  formula?: string;
  graph_validation?: AlignmentGraphValidation;
  fairness?: AlignmentFairnessMetrics | null;
  path_specific_fairness?: AlignmentPathSpecificFairness | null;
  bias_dynamics?: AlignmentBiasDynamics;
  alignment_decision?: AlignmentDecision;
  [key: string]: unknown;
}
