import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  ClaimCounterfactualTest,
  ClaimEvidenceLink,
  ClaimGateDecision,
  ClaimReceipt,
  ClaimRecord,
  ClaimReconstruction,
} from '@/types/claim-ledger';

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mapClaimRow(row: Record<string, unknown>): ClaimRecord {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    sessionId: row.session_id ? String(row.session_id) : null,
    traceId: row.trace_id ? String(row.trace_id) : null,
    sourceFeature: String(row.source_feature) as ClaimRecord['sourceFeature'],
    claimText: String(row.claim_text || ''),
    claimKind: String(row.claim_kind || 'assertion') as ClaimRecord['claimKind'],
    confidenceScore: typeof row.confidence_score === 'number' ? row.confidence_score : null,
    uncertaintyLabel: row.uncertainty_label ? String(row.uncertainty_label) as ClaimRecord['uncertaintyLabel'] : null,
    modelKey: row.model_key ? String(row.model_key) : null,
    modelVersion: row.model_version ? String(row.model_version) : null,
    status: String(row.status || 'draft') as ClaimRecord['status'],
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapEvidenceRow(row: Record<string, unknown>): ClaimEvidenceLink {
  return {
    id: String(row.id),
    claimId: String(row.claim_id),
    evidenceType: String(row.evidence_type) as ClaimEvidenceLink['evidenceType'],
    evidenceRef: String(row.evidence_ref || ''),
    snippet: row.snippet ? String(row.snippet) : null,
    reliabilityScore: typeof row.reliability_score === 'number' ? row.reliability_score : null,
    metadata: asObject(row.metadata),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapGateDecisionRow(row: Record<string, unknown>): ClaimGateDecision {
  return {
    id: String(row.id),
    claimId: String(row.claim_id),
    gateName: String(row.gate_name || ''),
    decision: String(row.decision || 'warn') as ClaimGateDecision['decision'],
    rationale: String(row.rationale || ''),
    score: typeof row.score === 'number' ? row.score : null,
    metadata: asObject(row.metadata),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapCounterfactualRow(row: Record<string, unknown>): ClaimCounterfactualTest {
  return {
    id: String(row.id),
    claimId: String(row.claim_id),
    counterfactualTraceId: row.counterfactual_trace_id ? String(row.counterfactual_trace_id) : null,
    necessitySupported: typeof row.necessity_supported === 'boolean' ? row.necessity_supported : null,
    sufficiencySupported: typeof row.sufficiency_supported === 'boolean' ? row.sufficiency_supported : null,
    method: row.method ? String(row.method) : null,
    assumptionsJson: asArray(row.assumptions_json),
    outcomeDelta: typeof row.outcome_delta === 'number' ? row.outcome_delta : null,
    resultLabel: String(row.result_label || 'inconclusive') as ClaimCounterfactualTest['resultLabel'],
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapReceiptRow(row: Record<string, unknown>): ClaimReceipt {
  return {
    id: String(row.id),
    claimId: String(row.claim_id),
    receiptType: String(row.receipt_type || 'emission') as ClaimReceipt['receiptType'],
    actor: String(row.actor || 'system'),
    receiptJson: asObject(row.receipt_json),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> },
) {
  try {
    const { claimId } = await params;

    if (!isLikelyUuid(claimId)) {
      return NextResponse.json({ success: false, error: 'Invalid claim id format' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const claimResult = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .maybeSingle();

    if (claimResult.error) {
      return NextResponse.json({ success: false, error: claimResult.error.message }, { status: 500 });
    }

    if (!claimResult.data) {
      return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });
    }

    const claim = mapClaimRow(claimResult.data as Record<string, unknown>);

    const [evidenceRes, gateRes, counterfactualRes, receiptRes] = await Promise.all([
      supabase
        .from('claim_evidence_links')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true }),
      supabase
        .from('claim_gate_decisions')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true }),
      supabase
        .from('claim_counterfactual_tests')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true }),
      supabase
        .from('claim_receipts')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true }),
    ]);

    const anyError = [evidenceRes.error, gateRes.error, counterfactualRes.error, receiptRes.error]
      .find((error) => Boolean(error));

    if (anyError) {
      return NextResponse.json({ success: false, error: anyError?.message || 'Failed to load claim artifacts' }, { status: 500 });
    }

    const reconstruction: ClaimReconstruction = {
      claim,
      evidenceLinks: (evidenceRes.data || []).map((row) => mapEvidenceRow(row as Record<string, unknown>)),
      gateDecisions: (gateRes.data || []).map((row) => mapGateDecisionRow(row as Record<string, unknown>)),
      counterfactualTests: (counterfactualRes.data || []).map((row) => mapCounterfactualRow(row as Record<string, unknown>)),
      receipts: (receiptRes.data || []).map((row) => mapReceiptRow(row as Record<string, unknown>)),
    };

    return NextResponse.json({ success: true, reconstruction });
  } catch (error) {
    console.error('[Claims API] Reconstruction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reconstruct claim' }, { status: 500 });
  }
}
