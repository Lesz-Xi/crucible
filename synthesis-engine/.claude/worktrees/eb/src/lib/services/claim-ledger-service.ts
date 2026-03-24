import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ClaimCounterfactualResultLabel,
  ClaimKind,
  ClaimSourceFeature,
  ClaimUncertaintyLabel,
} from '@/types/claim-ledger';

export interface ClaimLedgerEvidenceInput {
  evidenceType: 'source' | 'tool_output' | 'citation' | 'memory' | 'counterfactual_trace' | 'scientific_provenance';
  evidenceRef: string;
  snippet?: string;
  reliabilityScore?: number;
  metadata?: Record<string, unknown>;
}

export interface ClaimLedgerGateDecisionInput {
  gateName: string;
  decision: 'pass' | 'fail' | 'warn';
  rationale: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface ClaimLedgerCounterfactualInput {
  counterfactualTraceId?: string;
  necessitySupported?: boolean;
  sufficiencySupported?: boolean;
  method?: string;
  assumptionsJson?: unknown[];
  outcomeDelta?: number;
  resultLabel?: ClaimCounterfactualResultLabel;
}

export interface ClaimLedgerReceiptInput {
  receiptType: 'emission' | 'revision' | 'retraction';
  actor: string;
  receiptJson?: Record<string, unknown>;
}

export interface RecordClaimInput {
  userId?: string;
  sessionId?: string;
  traceId?: string;
  sourceFeature: ClaimSourceFeature;
  claimText: string;
  claimKind?: ClaimKind;
  confidenceScore?: number;
  uncertaintyLabel?: ClaimUncertaintyLabel;
  modelKey?: string;
  modelVersion?: string;
  status?: 'draft' | 'emitted' | 'retracted';
  evidenceLinks?: ClaimLedgerEvidenceInput[];
  gateDecisions?: ClaimLedgerGateDecisionInput[];
  counterfactualTests?: ClaimLedgerCounterfactualInput[];
  receipts?: ClaimLedgerReceiptInput[];
}

export class ClaimLedgerService {
  constructor(private readonly supabase: SupabaseClient) { }

  async recordClaim(input: RecordClaimInput): Promise<string | null> {
    const claimText = input.claimText?.trim();
    if (!claimText) return null;

    const claimInsert = await this.supabase
      .from('claims')
      .insert({
        user_id: input.userId || null,
        session_id: input.sessionId || null,
        trace_id: input.traceId || null,
        source_feature: input.sourceFeature,
        claim_text: claimText,
        claim_kind: input.claimKind || 'assertion',
        confidence_score: typeof input.confidenceScore === 'number' ? input.confidenceScore : null,
        uncertainty_label: input.uncertaintyLabel || 'unknown',
        model_key: input.modelKey || null,
        model_version: input.modelVersion || null,
        status: input.status || 'emitted',
      })
      .select('id')
      .single();

    if (claimInsert.error || !claimInsert.data?.id) {
      throw new Error(`Failed to insert claim: ${claimInsert.error?.message || 'unknown error'}`);
    }

    const claimId = String(claimInsert.data.id);

    if (Array.isArray(input.evidenceLinks) && input.evidenceLinks.length > 0) {
      const rows = input.evidenceLinks
        .filter((item) => item.evidenceRef && item.evidenceRef.trim().length > 0)
        .map((item) => ({
          claim_id: claimId,
          evidence_type: item.evidenceType,
          evidence_ref: item.evidenceRef,
          snippet: item.snippet || null,
          reliability_score: typeof item.reliabilityScore === 'number' ? item.reliabilityScore : null,
          metadata: item.metadata || {},
        }));
      if (rows.length > 0) {
        const { error } = await this.supabase.from('claim_evidence_links').insert(rows);
        if (error) throw new Error(`Failed to insert claim evidence links: ${error.message}`);
      }
    }

    if (Array.isArray(input.gateDecisions) && input.gateDecisions.length > 0) {
      const rows = input.gateDecisions.map((item) => ({
        claim_id: claimId,
        gate_name: item.gateName,
        decision: item.decision,
        rationale: item.rationale,
        score: typeof item.score === 'number' ? item.score : null,
        metadata: item.metadata || {},
      }));
      const { error } = await this.supabase.from('claim_gate_decisions').insert(rows);
      if (error) throw new Error(`Failed to insert claim gate decisions: ${error.message}`);
    }

    if (Array.isArray(input.counterfactualTests) && input.counterfactualTests.length > 0) {
      const rows = input.counterfactualTests.map((item) => ({
        claim_id: claimId,
        counterfactual_trace_id: item.counterfactualTraceId || null,
        necessity_supported: typeof item.necessitySupported === 'boolean' ? item.necessitySupported : null,
        sufficiency_supported: typeof item.sufficiencySupported === 'boolean' ? item.sufficiencySupported : null,
        method: item.method || null,
        assumptions_json: Array.isArray(item.assumptionsJson) ? item.assumptionsJson : [],
        outcome_delta: typeof item.outcomeDelta === 'number' ? item.outcomeDelta : null,
        result_label: item.resultLabel || 'inconclusive',
      }));
      const { error } = await this.supabase.from('claim_counterfactual_tests').insert(rows);
      if (error) throw new Error(`Failed to insert claim counterfactual tests: ${error.message}`);
    }

    if (Array.isArray(input.receipts) && input.receipts.length > 0) {
      const rows = input.receipts.map((item) => ({
        claim_id: claimId,
        receipt_type: item.receiptType,
        actor: item.actor,
        receipt_json: item.receiptJson || {},
      }));
      const { error } = await this.supabase.from('claim_receipts').insert(rows);
      if (error) throw new Error(`Failed to insert claim receipts: ${error.message}`);
    }

    return claimId;
  }
}
