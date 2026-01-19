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
