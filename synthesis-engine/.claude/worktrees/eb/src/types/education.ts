/**
 * Educational Systems: Type Definitions
 * 
 * Defines TypeScript interfaces for causal educational reasoning.
 * Based on Structural Causal Models (SCM) for personalized learning interventions.
 * 
 * Causal Chain: Motivation → Study_Habits ← Family_Support → Performance
 */
import type { CounterfactualTraceRef } from "@/types/scm";

// ============================
// LEARNING PROFILES
// ============================

export type LearningStyle = 'Visual' | 'Auditory' | 'ReadWrite' | 'Kinesthetic' | 'Multimodal';

export type SubjectArea = 'Math' | 'Science' | 'Humanities' | 'Engineering' | 'Arts' | 'General';

export interface StudentDemographics {
  age: number;
  academicLevel: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  major?: string;
  priorGPA?: number;              // 0.0-4.0
  learningDisabilities?: string[]; // e.g., ['ADHD', 'Dyslexia']
  primaryLanguage: string;
  workHoursPerWeek?: number;      // Job commitments
}

export interface MotivationProfile {
  intrinsic: number;               // 0-10 (love of learning)
  extrinsic: number;               // 0-10 (grades, career)
  amotivation: number;             // 0-10 (lack of motivation)
  goals: string[];                 // Student's stated goals
  perceivedValueOfCourse: number;  // 0-10
}

export interface StudyEnvironment {
  familySupport: number;           // 0-10
  financialStress: number;         // 0-10
  housingStability: number;        // 0-10
  socialBelonging: number;         // 0-10 (sense of community)
  mentalHealth: number;            // 0-10 (self-reported)
}

export interface StudentIntakeData {
  demographics: StudentDemographics;
  motivationProfile: MotivationProfile;
  learningStyle: LearningStyle;
  studyEnvironment: StudyEnvironment;
  selfEfficacy: number;            // 0-10 (perceived competence)
  priorKnowledgeScore: number;     // 0-100 (prerequisite test)
  workingMemoryScore?: number;     // Optional cognitive assessment
}

// ============================
// BEHAVIORAL DATA
// ============================

export interface EngagementMetrics {
  lectureAttendance: number;       // 0-100%
  videoCompletion: number[];       // % per lesson
  videoInteractionRate: number;    // Pauses, rewinds, speed changes
  questionAsking: number;          // Questions in class/forum
  officeHoursAttendance: number;   // Visits per semester
  peerCollaboration: number;       // Study group participation
}

export interface StudyPatterns {
  totalStudyHours: number;         // Hours per week
  consistency: number;             // 0-1 (low variance = consistent)
  usesActiveRecall: boolean;       // Flashcards, practice tests
  usesSpacedRepetition: boolean;   // Distributed practice
  procrastinationIndex: number;    // 0-10 (deadline proximity)
  sleepQuality: number;            // 0-10 (self-reported)
}

export interface PerformanceData {
  homeworkScores: number[];        // 0-100
  quizScores: number[];            // 0-100
  examScores: number[];            // 0-100
  projectGrades: number[];         // 0-100
  participationScore?: number;     // 0-100
  masteryByTopic: Record<string, number>; // Topic → mastery %
}

// ============================
// CAUSAL STRUCTURES
// ============================

export interface EducationalCausalNode {
  name: string;
  type: 'exogenous' | 'observable' | 'latent' | 'intervention';
  value: number | string;
  unit?: string;
  confidence?: number;             // 0-1
  lastUpdated: Date;
  changeHistory?: Array<{ value: number; timestamp: Date }>;
}

export interface EducationalCausalEdge {
  from: string;
  to: string;
  mechanism: string;              // Learning science explanation
  strength: number;               // 0-1 (effect size)
  evidence: string;               // Research citation
  interventionPoints?: string[];  // Available interventions on this edge
  modifiable: boolean;            // Can we intervene here?
}

export interface StudentCausalGraph {
  studentId: string;              // De-identified UUID
  nodes: EducationalCausalNode[];
  edges: EducationalCausalEdge[];
  bottleneck?: string;            // Primary limiting factor
  leveragePoint?: string;         // Highest ROI intervention target
  timestamp: Date;
  version: number;
}

// ============================
// INTERVENTIONS
// ============================

export type InterventionCategory = 
  | 'motivation'                   // Interventions targeting motivation
  | 'study_habits'                 // Study technique training
  | 'content_format'               // Content modality changes
  | 'family_support'               // Family/social interventions
  | 'cognitive_strategies';        // Metacognitive skills

export interface Intervention {
  id: string;
  name: string;
  category: InterventionCategory;
  target: string;                  // Node name to intervene on
  targetValue: number | string;    // Desired value
  mechanism: string;               // How it works
  energyCost: number;              // 0-1 (effort required from student)
  duration: string;                // 'one-time', '1 week', '1 semester'
  resources: string[];             // Required resources
  evidenceBasis: string;           // Research citation
  successRate?: number;            // 0-1 (from prior uses)
}

export interface InterventionResult {
  intervention: Intervention;
  expectedGain: number;            // Predicted performance increase (points)
  effortCost: number;              // Normalized 0-1
  utility: number;                 // Gain per unit effort
  confidence: number;              // 0-1
  timeToEffect: string;            // 'immediate', '2 weeks', '1 semester'
  contraIndications?: string[];    // Reasons to avoid
  causalPath: string[];            // Node sequence showing how effect propagates
  counterfactualTrace?: CounterfactualTraceRef;
  interventionGate?: {
    allowed: boolean;
    allowedOutputClass: "association_only" | "intervention_inferred" | "intervention_supported";
    rationale: string;
    counterfactualTrace?: CounterfactualTraceRef;
    identifiability: {
      identifiable: boolean;
      requiredConfounders: string[];
      adjustmentSet: string[];
      missingConfounders: string[];
      note: string;
    };
  };
}

// ============================
// STUDENT PROFILES
// ============================

export interface StudentProfile {
  id: string;                      // De-identified UUID
  demographics: StudentDemographics;
  intakeData: StudentIntakeData;
  behaviorData?: {
    engagement: EngagementMetrics;
    studyPatterns: StudyPatterns;
    performance: PerformanceData;
  };
  causalGraph?: StudentCausalGraph;
  assignedInterventions?: InterventionAssignment[];
  lastUpdated: Date;
}

export interface InterventionAssignment {
  id: string;
  interventionId: string;
  intervention: Intervention;
  assignedAt: Date;
  assignedBy?: string;             // Educator/advisor ID
  expectedGain: number;
  actualGain?: number;             // Filled after completion
  status: 'pending' | 'active' | 'completed' | 'abandoned';
  studentFeedback?: string;
  completionDate?: Date;
}

// ============================
// API REQUEST/RESPONSE TYPES
// ============================

export interface AnalyzeStudentRequest {
  studentId: string;
  intakeData: StudentIntakeData;
  behaviorData?: {
    engagement: EngagementMetrics;
    studyPatterns: StudyPatterns;
    performance: PerformanceData;
  };
  options?: {
    includeInsights: boolean;
   includeLeverageAnalysis: boolean;
  };
}

export interface AnalyzeStudentResponse {
  success: boolean;
  causalGraph: StudentCausalGraph;
  insights?: {
    strongestLinks: EducationalCausalEdge[];
    weakestLinks: EducationalCausalEdge[];
    bottleneck: string;            // Primary limiting factor
    leveragePoint: string;         // Highest ROI intervention target
  };
  timestamp: Date;
}

export interface OptimizeInterventionRequest {
  studentId: string;
  optimizationGoal: 'performance' | 'engagement' | 'well_being';
  causalGraph?: StudentCausalGraph;
  constraints?: {
    maxEffort?: number;            // Max effort cost (0-1)
    maxDuration?: string;         // Max intervention duration
    excludeCategories?: InterventionCategory[];
  };
}

export interface OptimizeInterventionResponse {
  success: boolean;
  rankedInterventions: InterventionResult[];
  topRecommendation: InterventionResult;
  explanation: string;             // Natural language rationale
  alternativePathways?: InterventionResult[];
  counterfactuals?: CounterfactualScenario[];
  allowedOutputClass?: "association_only" | "intervention_inferred" | "intervention_supported";
  counterfactualTraceIds?: string[];
  interventionGateSummary?: {
    allowedInterventions: number;
    blockedInterventions: number;
    missingConfounders: string[];
    rationale: string;
  };
  blockedInterventions?: InterventionResult[];
  timestamp: Date;
}

// ============================
// APPRENTICESHIP MODE
// ============================

export type ApprenticeshipSessionStatus = 'pending' | 'completed' | 'skipped';
export type ApprenticeshipMood = 'low' | 'mid' | 'high';

export interface ApprenticeshipSession {
  id: string;
  planId: string;
  userId?: string;
  sessionNumber: 1 | 2;
  weekStart: string; // YYYY-MM-DD
  durationMinutes: number;
  status: ApprenticeshipSessionStatus;
  focusNode?: string | null;
  interventionName?: string | null;
  intentNote?: string | null;
  mood?: ApprenticeshipMood | null;
  reflectionNote?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprenticeshipWeekProgress {
  weekStart: string; // YYYY-MM-DD
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  completionRate: number; // 0-1
}

export interface StartApprenticeshipRequest {
  planId?: string;
  studentId?: string;
  interventionId?: string;
  focusNode?: string;
  interventionName?: string;
}

export interface StartApprenticeshipResponse {
  success: boolean;
  planId: string;
  sessions: ApprenticeshipSession[];
  progress: ApprenticeshipWeekProgress;
}

export interface ActiveApprenticeshipResponse {
  success: boolean;
  planId?: string;
  sessions: ApprenticeshipSession[];
  progress?: ApprenticeshipWeekProgress;
}

export interface CompleteApprenticeshipSessionRequest {
  intentNote?: string;
  mood: ApprenticeshipMood;
  reflectionNote?: string;
}

export interface CompleteApprenticeshipSessionResponse {
  success: boolean;
  session: ApprenticeshipSession;
  progress: ApprenticeshipWeekProgress;
}

// ============================
// COUNTERFACTUAL REASONING
// ============================

export interface CounterfactualScenario {
  type: 'boundary' | 'confounding' | 'reversed_causality' | 'alternative_intervention';
  condition: string;               // The "what-if" question
  expectedOutcome: string;
  testsPurpose: string;
  counterfactualTrace?: CounterfactualTraceRef;
  result?: {
    passed: boolean;
    actualOutcome: string;
    explanation: string;
  };
}

//============================
// EDUCATIONAL CONSTRAINTS
// ============================

export type EducationalConstraintType =
  | 'cognitive_overload'           // Exceeds working memory capacity
  | 'prerequisite_gap'             // Missing required prior knowledge
  | 'massed_practice'              // Cramming (violates spacing effect)
  | 'passive_learning'             // Re-reading without retrieval
  | 'fixed_mindset_language'       // Ability-based feedback (not effort-based)
  | 'reversed_causality'           // Effect claimed to precede cause
  | 'resource_unavailable';        // Required resources not accessible

export interface EducationalSCMViolation {
  constraint: EducationalConstraintType;
  description: string;
  severity: 'fatal' | 'warning';
  evidence?: string;               // Research citation
  suggestedFix?: string;
}

// ============================
// PRIVACY & COMPLIANCE  
// ============================

export interface FERPADeidentification {
  method: 'pseudonymization' | 'aggregation';
  identifiersRemoved: string[];    // List of FERPA identifiers removed
  deidentifiedAt: Date;
  processor: string;
}

export interface StudentConsent {
  studentId: string;
  dataCollectionConsent: boolean;
  researchConsent: boolean;
  thirdPartySharing: boolean;
  consentDate: Date;
  parentalConsent?: boolean;       // If under 18
  withdrawnAt?: Date;
}
