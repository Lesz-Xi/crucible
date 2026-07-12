export type ClaimSourceFeature = 'chat' | 'hybrid' | 'legal' | 'companion';

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

// --- CSL Reasoning Companion invariants (additive, Stage-1 JSONB-backed) ---
// See docs/CSL-Reasoning-Companion-Architecture.md. Optional fields; absent for
// existing chat/hybrid/legal claims. Stored in `metadata`/`receipt_json` until
// promoted to typed columns in a future migration.

/** What kind of epistemic item a claim represents. */
export type EpistemicKind = 'observation' | 'source_claim' | 'inference' | 'hypothesis' | 'felt_state';

/** What a claim's supporting evidence is claimed to establish. The product-soul
 * distinction: a source *saying* something never equals independent proof of a
 * world claim. */
export type AssessmentScope = 'source_statement' | 'world_claim' | 'personal_experience';

/** How an evidence link relates to its target claim. */
export type EvidenceRelation = 'supports' | 'contradicts' | 'contextualizes';

/** Source independence relative to the specific claim it is evidence for
 * (claim-relative, not a global property of the source). */
export type SourceIndependence = 'primary' | 'independent' | 'related_party' | 'unknown';
