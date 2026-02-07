/**
 * Legal Domain Types for Autonomous Legal Reasoning Engine
 * 
 * Implements the Intent → Action → Harm causal chain model
 * with support for but-for analysis and proximate cause determination.
 * 
 * Phase 28.Legal: Pearl's Causal Blueprint applied to Legal Reasoning
 */
import type { CounterfactualTraceRef } from "@/types/scm";

// ============================
// CORE LEGAL ENTITIES
// ============================

export type LegalEntityType = 'defendant' | 'plaintiff' | 'witness' | 'victim' | 'third_party' | 'expert';

export interface LegalEntity {
  id: string;
  type: LegalEntityType;
  name: string;
  role: string;
  relevantActions: LegalAction[];
  metadata?: {
    aliases?: string[];
    jurisdiction?: string;
  };
}

// ============================
// INTENT (MENS REA)
// ============================

export type IntentType = 'purposeful' | 'knowing' | 'reckless' | 'negligent' | 'strict_liability';

export interface Intent {
  type: IntentType;
  description: string;
  evidenceSnippets: string[];
  confidence: number; // 0-1
  sourceDocuments?: string[]; // Reference IDs
}

/**
 * Intent hierarchy (from most culpable to least):
 * 1. Purposeful - Conscious objective to cause the result
 * 2. Knowing - Aware that conduct is practically certain to cause result
 * 3. Reckless - Conscious disregard of substantial and unjustifiable risk
 * 4. Negligent - Should have been aware of substantial and unjustifiable risk
 * 5. Strict Liability - No mental state required
 */

// ============================
// ACTION
// ============================

export interface LegalAction {
  id: string;
  actor: string; // LegalEntity.id
  timestamp: Date;
  description: string;
  intent?: Intent;
  causedHarm?: string[]; // IDs of Harm instances
  butForRelevance: number; // 0-1: but-for test preliminary score
  
  // Causal chain metadata
  isProximateCause?: boolean;
  interveningActions?: string[]; // Action IDs that intervened
  
  // Evidence
  evidenceSnippets?: string[];
  witnesses?: string[]; // LegalEntity.ids
}

// ============================
// HARM (DAMAGES)
// ============================

export type HarmType = 'physical' | 'economic' | 'emotional' | 'property' | 'reputational' | 'environmental';
export type HarmSeverity = 'minor' | 'moderate' | 'severe' | 'catastrophic';

export interface Harm {
  id: string;
  victim: string; // LegalEntity.id
  type: HarmType;
  description: string;
  severity: HarmSeverity;
  timestamp: Date;
  proximateCause?: string[]; // Action IDs that are proximate causes
  
  // Damages quantification (optional)
  quantifiedDamages?: {
    amount?: number;
    currency?: string;
    basis?: string; // How damages were calculated
  };
}

// ============================
// BUT-FOR ANALYSIS (COUNTERFACTUAL)
// ============================

export type ButForResult = 'necessary' | 'sufficient' | 'both' | 'neither';

export interface ButForAnalysis {
  question: string; // "Would harm H occur if action A was removed?"
  counterfactualScenario: string;
  result: ButForResult;
  confidence: number; // 0-1
  reasoning: string;
  counterfactualTrace?: CounterfactualTraceRef;
  
  // Pearl's Rung 3: Counterfactual metrics
  necessityScore?: number; // P(~Y | do(~X), X, Y) - probability of not harm if action removed
  sufficiencyScore?: number; // P(Y | do(X), ~X, ~Y) - probability of harm if action done
}

// ============================
// INTERVENING CAUSES
// ============================

export type InterveningCauseType = 'superseding' | 'concurrent' | 'contributing' | 'pre_existing';

export interface InterveningCause {
  id: string;
  description: string;
  type: InterveningCauseType;
  breaksChain: boolean; // Does this break proximate causation?
  foreseeable: boolean; // Was this foreseeable to the defendant?
  
  /**
   * Superseding causes break the chain of causation:
   * - Must be unforeseeable
   * - Must be independent of defendant's negligence
   * - Must be sufficient by itself to cause the harm
   */
  supersedingAnalysis?: {
    independentOfDefendant: boolean;
    sufficientAlone: boolean;
    precedents?: string[]; // Case citations supporting analysis
  };
}

// ============================
// CAUSAL CHAIN (CORE MODEL)
// ============================

export interface LegalCausalChain {
  id?: string;
  intent: Intent;
  action: LegalAction;
  harm: Harm;
  
  // Causal analysis
  causalStrength: number; // 0-1: overall strength of Intent → Action → Harm
  butForAnalysis: ButForAnalysis;
  interveningCauses?: InterveningCause[];
  
  // Proximate cause determination
  proximateCauseEstablished: boolean;
  foreseeability: number; // 0-1: was harm foreseeable?
  
  // Evidence quality
  evidenceQuality?: 'strong' | 'moderate' | 'weak' | 'circumstantial';
}

// ============================
// LEGAL PRECEDENTS
// ============================

export interface CausalPattern {
  intent: string;
  action: string;
  harm: string;
  ruling: 'liable' | 'not_liable' | 'partial_liability';
}

export interface LegalPrecedent {
  caseId: string;
  caseName: string;
  court: string;
  year: number;
  citation: string;
  jurisdiction: string;
  holdingText: string;
  relevantFacts: string[];
  causalPattern: CausalPattern;
  
  // Similarity to current case
  similarity: number; // 0-1
  relevantExcerpts?: string[];
  
  // Citation metadata
  citationCount?: number;
  overruled?: boolean;
  distinguishedBy?: string[]; // Case IDs that distinguished this precedent
}

// ============================
// LEGAL CASE (TOP-LEVEL)
// ============================

export interface LegalCase {
  id: string;
  title: string;
  parties: LegalEntity[];
  timeline: LegalAction[];
  harms: Harm[];
  causalChains: LegalCausalChain[];
  precedents: LegalPrecedent[];
  
  // Analysis metadata
  jurisdiction?: string;
  caseType?: 'tort' | 'criminal' | 'contract' | 'other';
  
  // Verdict (if analysis complete)
  verdict?: LegalVerdict;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================
// VERDICT
// ============================

export interface LegalVerdict {
  liable: boolean;
  causationEstablished: boolean;
  reasoning: string;
  
  // But-for and proximate cause
  butForSatisfied: boolean;
  proximateCauseSatisfied: boolean;
  
  // Confidence
  confidence: number; // 0-1
  
  // MASA audit reference (if applicable)
  masaAuditId?: string;
  
  // Damages (if liability established)
  recommendedDamages?: {
    compensatory?: number;
    punitive?: number;
    basis?: string;
  };
  
  // Alternative causation findings
  alternativeCauses?: string[];
  
  // Caveats and limitations
  caveats?: string[];
}

// ============================
// LEGAL SCM CONSTRAINTS
// ============================

export type LegalConstraintType = 
  | 'but_for'           // But-for causation required
  | 'proximate_cause'   // Foreseeable harm requirement
  | 'mens_rea'          // Intent requirement (except strict liability)
  | 'intervening_cause' // Superseding cause analysis
  | 'correlation_trap'  // Mere presence ≠ causation
  | 'joint_liability'   // Multiple defendants analysis
  | 'comparative_fault';// Plaintiff's own negligence

export interface LegalConstraintViolation {
  constraint: LegalConstraintType;
  description: string;
  severity: 'fatal' | 'warning';
  evidence?: string;
  remediation?: string;
}

// ============================
// LEGAL EXTRACTION RESULT
// ============================

export type LegalDocumentType = 'case_law' | 'statute' | 'complaint' | 'evidence' | 'witness_statement' | 'expert_report' | 'unknown';

export interface LegalExtractionResult {
  entities: LegalEntity[];
  timeline: LegalAction[];
  harms: Harm[];
  intents: Map<string, Intent>; // actor ID -> intent
  documentType: LegalDocumentType;
  
  // Extraction quality
  extractionConfidence: number; // 0-1
  rawTextLength: number;
  warnings?: string[];
}

// ============================
// API TYPES
// ============================

export interface LegalReasoningRequest {
  documents: string[]; // Raw text content
  caseTitle?: string;
  jurisdiction?: string;
  caseType?: 'tort' | 'criminal' | 'contract';
  focusEntities?: string[]; // Entity names to prioritize
}

export interface LegalReasoningResponse {
  success: boolean;
  case?: LegalCase;
  error?: string;
  allowedOutputClass?: "association_only" | "intervention_inferred" | "intervention_supported";
  counterfactualTraceIds?: string[];
  interventionGate?: {
    allowed: boolean;
    allowedChains: number;
    blockedChains: number;
    missingConfounders: string[];
    rationale: string;
  };
  
  // Processing metadata
  processingTimeMs?: number;
  tokensUsed?: number;
}

// ============================
// STREAMING EVENTS
// ============================

export type LegalStreamEvent = 
  | { event: 'legal_extraction_start'; documentCount: number }
  | { event: 'legal_entity_found'; entity: LegalEntity }
  | { event: 'legal_action_found'; action: LegalAction }
  | { event: 'legal_harm_identified'; harm: Harm }
  | { event: 'but_for_analysis_start'; actionId: string; harmId: string }
  | { event: 'but_for_result'; actionId: string; harmId: string; result: ButForResult }
  | { event: 'causal_chain_established'; chain: LegalCausalChain }
  | { event: 'precedent_found'; precedent: LegalPrecedent }
  | {
      event: 'intervention_gate';
      allowed: boolean;
      allowedOutputClass: "association_only" | "intervention_inferred" | "intervention_supported";
      allowedChains: number;
      blockedChains: number;
      missingConfounders: string[];
      rationale: string;
      counterfactualTraceIds?: string[];
    }
  | { event: 'legal_masa_audit_start'; agentCount: number }
  | { event: 'legal_verdict_ready'; verdict: LegalVerdict }
  | { event: 'legal_analysis_complete'; case: LegalCase }
  | { event: 'legal_error'; message: string };
