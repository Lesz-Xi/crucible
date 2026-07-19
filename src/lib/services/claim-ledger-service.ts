import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AssessmentScope,
  ClaimCounterfactualResultLabel,
  ClaimKind,
  ClaimSourceFeature,
  ClaimUncertaintyLabel,
  EpistemicKind,
  EvidenceRelation,
  SourceIndependence,
} from '@/types/claim-ledger';
import { validateEpistemicInvariants } from '@/lib/validators/epistemic-invariants';

export interface ClaimLedgerEvidenceInput {
  evidenceType: 'source' | 'tool_output' | 'citation' | 'memory' | 'counterfactual_trace' | 'scientific_provenance';
  evidenceRef: string;
  snippet?: string;
  reliabilityScore?: number;
  metadata?: Record<string, unknown>;
  /** CSL: how this evidence relates to the target claim, claim-relative. Stage-1: carried in `metadata`. */
  relation?: EvidenceRelation;
  /** CSL: source independence relative to the target claim. Stage-1: carried in `metadata`. */
  independence?: SourceIndependence;
  /** CSL: epistemic kind of the thing being cited (e.g. a felt_state item cannot independently support a world_claim). */
  sourceEpistemicKind?: EpistemicKind;
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
  /** CSL: what kind of epistemic item this claim represents. Stage-1: carried in the emission receipt. */
  epistemicKind?: EpistemicKind;
  /** CSL: what the claim's evidence is claimed to establish (source-statement vs world-claim vs personal-experience). */
  assessmentScope?: AssessmentScope;
}

export class ClaimLedgerService {
  constructor(private readonly supabase: SupabaseClient) { }

  async recordClaim(input: RecordClaimInput): Promise<string | null> {
    const claimText = input.claimText?.trim();
    if (!claimText) return null;

    const usesEpistemicInvariants =
      input.epistemicKind !== undefined ||
      input.assessmentScope !== undefined ||
      (input.evidenceLinks ?? []).some((link) => link.relation || link.independence || link.sourceEpistemicKind);

    if (usesEpistemicInvariants) {
      const result = validateEpistemicInvariants({
        claimKind: input.claimKind,
        claimText,
        epistemicKind: input.epistemicKind,
        assessmentScope: input.assessmentScope,
        evidenceLinks: (input.evidenceLinks ?? []).map((link) => ({
          relation: link.relation,
          independence: link.independence,
          sourceEpistemicKind: link.sourceEpistemicKind,
        })),
        gateDecisions: (input.gateDecisions ?? []).map((g) => ({ gateName: g.gateName, decision: g.decision })),
      });
      if (!result.ok) {
        throw new Error(
          `Claim violates epistemic invariants: ${result.violations.map((v) => v.message).join(' | ')}`
        );
      }
    }

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
        .map((item) => {
          // CSL Stage-1: relation/independence/sourceEpistemicKind ride in metadata
          // until promoted to typed columns (see docs/CSL-Reasoning-Companion-Architecture.md §4).
          const csl: Record<string, unknown> = {};
          if (item.relation) csl.relation = item.relation;
          if (item.independence) csl.independence = item.independence;
          if (item.sourceEpistemicKind) csl.sourceEpistemicKind = item.sourceEpistemicKind;
          const metadata = Object.keys(csl).length > 0 ? { ...(item.metadata || {}), csl } : item.metadata || {};
          return {
            claim_id: claimId,
            evidence_type: item.evidenceType,
            evidence_ref: item.evidenceRef,
            snippet: item.snippet || null,
            reliability_score: typeof item.reliabilityScore === 'number' ? item.reliabilityScore : null,
            metadata,
          };
        });
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

    // CSL Stage-1: epistemicKind/assessmentScope ride in the emission receipt's
    // receipt_json until promoted to typed columns on `claims`. Merge into an
    // existing emission receipt if the caller supplied one, else synthesize a
    // minimal one — but only when a CSL field is actually set, so callers that
    // never touch these fields get exactly the prior behavior.
    const csl: Record<string, unknown> = {};
    if (input.epistemicKind) csl.epistemicKind = input.epistemicKind;
    if (input.assessmentScope) csl.assessmentScope = input.assessmentScope;
    const hasClaimLevelCsl = Object.keys(csl).length > 0;

    const receipts = input.receipts ?? [];
    let receiptRows = receipts.map((item) => ({
      claim_id: claimId,
      receipt_type: item.receiptType,
      actor: item.actor,
      receipt_json: item.receiptJson || {},
    }));

    if (hasClaimLevelCsl) {
      const emissionIndex = receiptRows.findIndex((r) => r.receipt_type === 'emission');
      if (emissionIndex >= 0) {
        receiptRows[emissionIndex] = {
          ...receiptRows[emissionIndex],
          receipt_json: { ...receiptRows[emissionIndex].receipt_json, csl },
        };
      } else {
        receiptRows = [
          ...receiptRows,
          { claim_id: claimId, receipt_type: 'emission' as const, actor: 'system', receipt_json: { csl } },
        ];
      }
    }

    if (receiptRows.length > 0) {
      const { error } = await this.supabase.from('claim_receipts').insert(receiptRows);
      if (error) throw new Error(`Failed to insert claim receipts: ${error.message}`);
    }

    return claimId;
  }
}
