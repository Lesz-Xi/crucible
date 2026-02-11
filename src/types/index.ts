// TypeScript Type Definitions for Sovereign Synthesis Engine

// Source Types
export type SourceType = "pdf" | "company";

export interface Source {
  id: string;
  synthesisId: string;
  sourceType: SourceType;
  name: string;
  rawContent: string;
  extractedConcepts: ExtractedConcepts;
  embedding?: number[];
  createdAt: Date;
}

export interface ExtractedConcepts {
  mainThesis: string;
  keyArguments: string[];
  entities: Entity[];
  methodology?: string;
  evidenceQuality?: "strong" | "moderate" | "weak" | "anecdotal";
  researchGaps?: string[];
  contradictions?: Contradiction[];
}

export interface Entity {
  name: string;
  type: "person" | "concept" | "organization" | "technology" | "method";
  description: string;
  sourceId: string;
}

export interface Contradiction {
  concept: string;
  sourceA: string;
  claimA: string;
  sourceB: string;
  claimB: string;
  resolution?: string;
}

// Synthesis Types
export type SynthesisType = "pdf_synthesis" | "company_analysis";

export interface Synthesis {
  id: string;
  userId?: string;
  synthesisType: SynthesisType;
  sources: string[];
  novelIdeas: NovelIdea[];
  structuredApproach?: StructuredApproach;
  noveltyScore: number;
  priorArt: PriorArt[];
  visuals?: VisualAsset[];
  createdAt: Date;
}

export interface NovelIdea {
  id: string;
  thesis: string;
  description: string;
  bridgedConcepts: string[];
  confidence: number;
  noveltyAssessment: string;
  mechanism?: string; // Explain HOW it works
  prediction?: string; // Testable prediction

  // Tier 1 Improvements: Calibrated Confidence
  confidenceFactors?: ConfidenceFactors;
  confidenceExplanation?: string;
  statisticalMetrics?: StatisticalMetrics;
  evidenceSnippets?: EvidenceSnippet[];
  // Refinement tracking
  refinementIteration?: number;
  refinedFrom?: string; // ID of original idea if this was refined

  // Validation
  criticalAnalysis?: CriticalAnalysis;
  structuredHypothesis?: StructuredHypothesis;

  // MASA causal/governance extensions
  doPlan?: string;
  falsifier?: string;
  confounderSet?: string[];
  explanatoryMechanism?: string;
  identifiabilityScore?: number; // 0-1 or 0-100 depending on source scaling
  interventionValueScore?: number; // 0-1
  falsifiabilityScore?: number; // 0-1
  noveltyScore?: number; // 0-100
  explanationDepth?: number; // 0-100
  isExplainedByPriorArt?: boolean;
  validationResult?: ValidationResult;
  hypothesisState?: HypothesisState;
  hypothesisAuditEvents?: HypothesisAuditEvent[];
  scientificArtifacts?: ScientificArtifacts;
  scientificProse?: string;
  masaAudit?: MasaAudit;
  causalOutput?: CausalOutputContract;
}

// Tier 1: Calibrated Confidence Factors
export interface ConfidenceFactors {
  sourceAgreement: number;      // 0-1: How many sources support this synthesis?
  priorArtDistance: number;     // 0-1: 1 = very novel, 0 = already exists
  contradictionResolved: number; // 0-1: Were tensions addressed in the synthesis?
  evidenceDepth: number;        // 0-1: Direct evidence vs inference
  conceptBridgeStrength: number; // 0-1: How well do concepts actually connect?
  temporalDecayApplied?: boolean; // true when temporal weighting affected prior-art penalty
}

// Tier 1: Refinement tracking for evaluate-and-refine loop
export interface RefinementResult {
  originalIdea: NovelIdea;
  refinedIdea: NovelIdea;
  reason: string;
  priorArtAvoided: string[];
  iteration: number;
}

export interface StructuredApproach {
  title: string;
  problemStatement: string;
  proposedSolution: string;
  keySteps: Step[];
  risks: Risk[];
  successMetrics: string[];
}

export interface Step {
  order: number;
  title: string;
  description: string;
  dependencies?: string[];
}

export interface Risk {
  description: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
}

export interface PriorArt {
  source: string;
  title: string;
  url?: string;
  similarity: number;
  differentiator: string;
  publicationYear?: number;
  year?: number;
  venue?: string;
  authors?: string[];
  temporalWeight?: number;
  adjustedSimilarity?: number;
  snippet?: string;
}

export interface ValidationResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  metrics?: {
    pValue?: number;
    bayesFactor?: number;
    conclusionValid?: boolean;
    sampleSize?: number;
    physicalAlignmentScore?: number;
  };
  executionTimeMs?: number;
  error?: string;
  feasibilityScore?: number;
}

export interface StatisticalMetrics {
  pValue: number;
  bayesFactor: number;
  effectSize: number;
  interpretation: string;
}

export interface EvidenceSnippet {
  snippet: string;
  page: number | null;
  offset: number | null;
  confidence: number;
  sourceName?: string;
}

export interface ScholarPriorArt {
  paperId: string;
  title: string;
  abstract: string;
  url: string;
  citationCount: number;
  influenceScore: number;
  year: number;
  similarity: number;
  authors?: string[];
  venue?: string;
}

export interface VisualAsset {
  type: "graph" | "knowledge_graph" | "design_mockup" | "chart";
  title: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Feedback Types
export interface SynthesisFeedback {
  id: string;
  synthesisId: string;
  userRating: number;
  isNovel: boolean;
  feedbackText?: string;
  createdAt: Date;
}

// API Request/Response Types
export interface PDFSynthesisRequest {
  files: File[];
  synthesisGoal?: string;
}

export interface CompanyAnalysisRequest {
  companyNames: string[];
  focusAreas?: string[];
}

export interface SynthesisResponse {
  success: boolean;
  synthesis?: Synthesis;
  error?: string;
}

export interface CriticalAnalysis {
  biasDetected: string[];
  logicalFallacies: string[];
  validityScore: number; // 0-100
  critique: string;
}

// Scientific Rigor Types (K-Dense/Hong Framework) - Hypothesis Generation
export interface Prediction {
  description: string;
  expectedOutcome: string;
  falsificationCriteria: string;
}

export interface ExperimentalDesign {
  methodology: string;
  variables: {
    independent: string;
    dependent: string;
    controlled: string[];
  };
  sampleSize?: string;
  duration?: string;
}

export interface CompetingHypothesis {
  id: string;
  title: string;
  mechanism: string;
  evidenceSupport: string[];
  weaknesses: string[];
  confidenceScore: number;
}

export interface StructuredHypothesis {
  observation: string;
  competingHypotheses: CompetingHypothesis[];
  selectedHypothesisId: string;
  predictions: Prediction[];
  experimentalDesign: ExperimentalDesign;
}

export interface ScientificArtifacts {
  protocolCode?: string;
  labManual?: string;
  labJob?: LabJob | string;
}

export type HypothesisState = "proposed" | "tested" | "falsified" | "retracted";
export type HypothesisAuditTrigger =
  | "generation"
  | "intervention_result"
  | "counterfactual_failure"
  | "manual_review";

export interface HypothesisAuditEvent {
  hypothesisId: string;
  state: HypothesisState;
  trigger: HypothesisAuditTrigger;
  rationale: string;
  evidenceRef: string[];
  timestamp: string;
}

export type CausalStatus =
  | "Exploratory (Association-Level)"
  | "Partially Identified (Intervention-Inferred)"
  | "Identified (Intervention-Supported)"
  | "Falsified / Inconclusive";

export type InterventionEvidenceClass =
  | "Structural (Graph-Inferred Only)"
  | "Simulated (Assumption-Bound)"
  | "Empirical (Data-Grounded)";

export interface CausalOutputContract {
  statusBanner: {
    status: CausalStatus;
    justification: string;
    downgradedByMissingFalsifier: boolean;
  };
  causalClaim: string;
  supportingStructure: {
    modelRef: string;
    variables: string[];
    directedEdges: Array<{ from: string; to: string }>;
    confounders: string[];
    mechanismSummary: string;
  };
  interventionLayer: {
    class: InterventionEvidenceClass;
    notes: string[];
    assumptionsForSimulation?: string[];
  };
  counterfactualLayer: {
    necessity: string;
    sufficiency: string;
    evaluable: {
      necessity: boolean;
      sufficiency: boolean;
    };
  };
  assumptionsAndConfounders: Array<{
    assumption: string;
    type: "empirical" | "theoretical" | "convenience-based";
    failureImpact: string;
  }>;
  stressTestInterpretation?: {
    challengedAssumption: string;
    result: "collapsed" | "weakened" | "survived";
    statusDowngraded: boolean;
  };
  unresolvedGaps: string[];
  nextScientificAction: string;
}

export interface HypothesisNode {
  id: string;
  thesis: string;
  confidence: number;
  label?: string;
  mechanism?: string;
}

export interface SynthesisResult {
  sources: Array<{ name: string; concepts: ExtractedConcepts }>;
  contradictions: Contradiction[];
  novelIdeas: NovelIdea[];
  selectedIdea?: NovelIdea;
  structuredApproach?: StructuredApproach;
  metadata?: {
    refinementIterations?: number;
    calibrationApplied?: boolean;
  };
}

// ===== MASA (Multi-Agent Scientific Audit) Types =====

export type GradeQuality = "High" | "Moderate" | "Low" | "Very Low";

export interface RoleBasedCritique {
  score: number; // 0-100
  critique: string;
}

export interface MethodologyCritique extends RoleBasedCritique {
  grade: GradeQuality;
  constructValidityIssues: string[];
  causalityIssues: string[];
}

export interface SkepticCritique extends RoleBasedCritique {
  biasesDetected: string[]; // Maps to common_biases.md
  fallaciesDetected: string[]; // Maps to logical_fallacies.md
  devilAdvocacy: string; // The "steel-manned" counter-argument
}

export interface MasaAudit {
  methodologist: MethodologyCritique;
  skeptic: SkepticCritique;
  finalSynthesis: {
    architectVerdict?: string;
    validityScore: number;
    remediationPlan: string[]; // Specific actionable fixes
    remediationConstraints?: string[]; // Mandatory constraints for re-generation
    isApproved: boolean; // Veto system
  };
  causal_credit?: {
    mechanism_fault: number;
    evidence_fault: number;
    novelty_fault: number;
    formulation_fault: number;
  };
  timestamp: Date;
}

// ===== Consciousness State Types =====

export interface ConsciousnessState {
  current_mode: 'strict' | 'balanced' | 'exploratory';
  ceiling: number;
  friction_alert: boolean;
  history?: {
    scores: number[];
    avg_score: number;
    rejection_rate: number;
    variance: number;
  };
  causal_evidence?: {
    PN_mode_caused_failure?: number;
    PS_switch_to_exploratory?: number;
    RR_mode_risk_ratio?: number;
  };
  mode_history?: { mode: string; score: number; timestamp: string }[];
}

// ===== Robotic Interface Layer (Laboratory Automation) =====

export interface LabJob {
  job_id: string;
  experiment_name: string;
  safety_level: 'BSL-1' | 'BSL-2';
  resources: LabResources;
  steps: LabStep[];
}

export interface LabResources {
  reagents: Reagent[];
  labware: Labware[];
}

export interface Reagent {
  id: string;
  name: string;
  initial_structure?: string;
  volume_ml: number;
}

export interface Labware {
  id: string;
  type: '96-well-plate' | 'trough-12row' | 'tube-rack';
}

export interface LabStep {
  step_id: number;
  action: 'aspirate' | 'dispense' | 'mix' | 'incubate' | 'thermocycle' | 'measure_absorbance';
  parameters: ActionParams;
}

export type ActionParams = TransferParams | IncubateParams | MeasureParams;

export interface TransferParams {
  source_labware?: string;
  target_labware?: string;
  source_well?: string;
  target_well?: string;
  volume_ul: number;
  flow_rate_ul_per_sec?: number;
}

export interface IncubateParams {
  duration_seconds: number;
  temperature_celsius: number;
  shaking_rpm?: number;
}

export interface MeasureParams {
  target_labware: string;
  wavelength_nm: number;
  metric_name: string;
}

// ─── Governance Contracts (S1) ─────────────────────────────────────

export type {
  GovernanceResultEnvelope,
  GovernanceOverride,
  GovernancePromotionRecord,
} from './governance-envelope';

export type {
  PolicyFamily,
  PolicyFamilyDescriptor,
  PolicyEvalScenario,
  PolicyEvalScenarioPack,
  ScenarioResult,
  PolicyDecision,
  PolicyPromotionRecord,
} from './policy-evaluation';

export type {
  DataRegime,
  CausalMethodId,
  MethodCard,
  EligibilityResult,
  SelectionOutput,
  CausalMethodScenario,
  CausalMethodScenarioPack,
} from './causal-method-policy';

export type {
  CalibrationLevel,
  CalibrationMetric,
  GateResult,
  ConfidenceReport,
  UncertaintyCalibrationScenario,
  UncertaintyCalibrationScenarioPack,
} from './uncertainty-calibration';

export type {
  LawLifecycleState,
  EvidenceBasis,
  FalsificationEvidence,
  LawCandidate,
  LawEvaluationResult,
  LawFalsificationScenario,
  LawFalsificationScenarioPack,
} from './law-discovery-falsification';

export type {
  AppAuthUser,
  AuthState,
} from './auth';

export type {
  ImportDomain,
  ImportRecordEnvelope,
  ChatSessionImportPayload,
  HybridRunImportPayload,
  LegalImportPayload,
  LocalHistoryExport,
  ImportDomainSummary,
  HistoryImportSummary,
  LegacyAdoptionSummary,
  HistorySyncStatus,
} from './history-import';
