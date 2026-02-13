export type ClaimSourceFeature = 'chat' | 'hybrid' | 'legal';

export type ClaimKind = 'assertion' | 'hypothesis' | 'decision' | 'verdict';

export type ClaimStatus = 'draft' | 'emitted' | 'retracted';

export type ClaimUncertaintyLabel = 'low' | 'medium' | 'high' | 'unknown';

export interface ClaimRecord {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  sourceFeature: ClaimSourceFeature;
  claimText: string;
  claimKind: ClaimKind;
  confidenceScore?: number | null;
  uncertaintyLabel?: ClaimUncertaintyLabel | null;
  modelKey?: string | null;
  modelVersion?: string | null;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export type ClaimEvidenceType =
  | 'source'
  | 'tool_output'
  | 'citation'
  | 'memory'
  | 'counterfactual_trace';

export interface ClaimEvidenceLink {
  id: string;
  claimId: string;
  evidenceType: ClaimEvidenceType;
  evidenceRef: string;
  snippet?: string | null;
  reliabilityScore?: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type ClaimGateDecisionLabel = 'pass' | 'fail' | 'warn';

export interface ClaimGateDecision {
  id: string;
  claimId: string;
  gateName: string;
  decision: ClaimGateDecisionLabel;
  rationale: string;
  score?: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type ClaimCounterfactualResultLabel = 'supported' | 'rejected' | 'inconclusive';

export interface ClaimCounterfactualTest {
  id: string;
  claimId: string;
  counterfactualTraceId?: string | null;
  necessitySupported?: boolean | null;
  sufficiencySupported?: boolean | null;
  method?: string | null;
  assumptionsJson: unknown[];
  outcomeDelta?: number | null;
  resultLabel: ClaimCounterfactualResultLabel;
  createdAt: string;
}

export type ClaimReceiptType = 'emission' | 'revision' | 'retraction';

export interface ClaimReceipt {
  id: string;
  claimId: string;
  receiptType: ClaimReceiptType;
  actor: string;
  receiptJson: Record<string, unknown>;
  createdAt: string;
}

export interface ClaimReconstruction {
  claim: ClaimRecord;
  evidenceLinks: ClaimEvidenceLink[];
  gateDecisions: ClaimGateDecision[];
  counterfactualTests: ClaimCounterfactualTest[];
  receipts: ClaimReceipt[];
}
