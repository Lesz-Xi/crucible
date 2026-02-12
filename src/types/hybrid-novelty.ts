import type { PriorArt } from '@/types';

export type NoveltyGateDecision = 'pass' | 'recover' | 'fail';

export interface ContradictionEvidence {
  id: string;
  concept: string;
  claimA: string;
  claimB: string;
  sourceA: string;
  sourceB: string;
  semanticConflictScore: number;
  mechanismConflictTag: 'mechanism' | 'assumption' | 'outcome' | 'method';
  evidenceRefs: string[];
  highConfidence: boolean;
}

export interface FalsificationPlan {
  disconfirmingExperiment: string;
  expectedFailureSignal: string;
  requiredAssumptions: string[];
  confoundersToControl: string[];
}

export interface NoveltyProof {
  ideaId: string;
  ideaThesis: string;
  contradictionIds: string[];
  closestPriorArt: PriorArt[];
  priorArtDistance: number;
  contradictionResolvedScore: number;
  mechanismDifferentiationScore: number;
  interventionValueScore: number;
  falsifiabilityScore: number;
  assumptions: string[];
  confounders: string[];
  proofStatus: 'pass' | 'blocked';
  blockedReasons: string[];
  falsificationPlan: FalsificationPlan;
}

export interface RecoveryPlan {
  message: string;
  diagnosis: string[];
  suggestedSources: string[];
  suggestedInterventions: string[];
  rerunRecipe: {
    inputDelta: string[];
    expectedEpistemicLift: string;
  };
}

export interface NoveltyGateResult {
  decision: NoveltyGateDecision;
  threshold: number;
  passingIdeas: number;
  blockedIdeas: number;
  reasons: string[];
}
