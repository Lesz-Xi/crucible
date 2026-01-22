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
  // Refinement tracking
  refinementIteration?: number;
  refinedFrom?: string; // ID of original idea if this was refined
  
  // Validation
  criticalAnalysis?: CriticalAnalysis;
  structuredHypothesis?: StructuredHypothesis;
  
  // Deutschian Epistemology
  explanationDepth: number; // 0-100: How hard it is to vary?
  isExplainedByPriorArt: boolean;
  explanatoryMechanism: string;

  // Sovereign Mastermind Fields
  masaAudit?: MasaAudit;
  scientificProse?: string;
  crucialExperiment?: string;
  evidenceSnippets?: string[];
  experimentalDesign?: ExperimentalDesign;
  scientificArtifacts?: {
    protocolCode: string; // Python/Julia simulation code
    labManual: string; // Markdown lab guide
  };
  // Physical Ground Truth Validation
  validationResult?: {
    success: boolean;
    metrics?: {
      pValue?: number;
      bayesFactor?: number;
      conclusionValid?: boolean;
    };
    error?: string;
  };
  priorArt?: PriorArt[];
  // Hong Theoretical Alignment
  isLogConcave?: boolean; // True if confidence follows log-concave distribution
}

export interface SynthesisResult {
  sources: { 
    name: string; 
    type: 'pdf' | 'company';
    mainThesis: string;
    keyArguments: string[];
    concepts: ExtractedConcepts;
  }[];
  contradictions: Contradiction[];
  novelIdeas: NovelIdea[];
  selectedIdea?: NovelIdea;
  structuredApproach?: StructuredApproach;
  metadata?: {
    refinementIterations: number;
    calibrationApplied: boolean; // Did we run the check loop?
    // Hong Pop-Stack-Sorting Metrics (t-Pop-sortability tracking)
    tPopSortable?: boolean; // true if convergence achieved before maxIterations
    convergenceStep?: number; // Which iteration step reached approval (0̂)
    pdfCount?: number;
    companyCount?: number;
    totalSources?: number;
  };
}

// Tier 1: Calibrated Confidence Factors
export interface ConfidenceFactors {
  sourceAgreement: number;      // 0-1: How many sources support this synthesis?
  priorArtDistance: number;     // 0-1: 1 = very novel, 0 = already exists
  contradictionResolved: number; // 0-1: Were tensions addressed in the synthesis?
  evidenceDepth: number;        // 0-1: Direct evidence vs inference
  conceptBridgeStrength: number; // 0-1: How well do concepts actually connect?
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
  authors?: string[];
  venue?: string;
  year?: number;
  openAccessPdf?: string;
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
  remediationConstraints?: string[];
}

// Scientific Rigor Types (Epistemic/Hong Framework) - Hypothesis Generation
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
  // Deutschian Field
  crucialExperiment: string; // The specific test that could disprove this theory
  falsificationStatus?: "Falsifiable" | "Unfalsifiable" | "Vague";
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
  masaAudit?: MasaAudit;
}


export interface HypothesisNode {
  id: string;
  label: string;
  status: 'generated' | 'testing' | 'refuted' | 'surviving';
  refutationReason?: string;
  children?: HypothesisNode[];
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
  timestamp: Date;
}

// ===== Scholar API Types =====

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
  openAccessPdf?: string;
}
