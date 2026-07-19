import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ClaimLedgerService } from '@/lib/services/claim-ledger-service';
import type {
  AssessmentScope,
  EpistemicKind,
  EvidenceRelation,
  SourceIndependence,
} from '@/types/claim-ledger';

const ASSESSMENT_SCOPES: AssessmentScope[] = ['source_statement', 'world_claim', 'personal_experience'];
const EPISTEMIC_KINDS: EpistemicKind[] = ['observation', 'source_claim', 'inference', 'hypothesis', 'felt_state'];
const RELATIONS: EvidenceRelation[] = ['supports', 'contradicts', 'contextualizes'];
const INDEPENDENCE_LEVELS: SourceIndependence[] = ['primary', 'independent', 'related_party', 'unknown'];
const DISPOSITIONS = ['accept_limited', 'hold', 'investigate', 'reject', 'unknown', 'archive'] as const;
type Disposition = (typeof DISPOSITIONS)[number];

interface CompanionEvidenceInput {
  evidenceRef: string;
  snippet?: string;
  relation: EvidenceRelation;
  independence: SourceIndependence;
  sourceEpistemicKind?: EpistemicKind;
}

interface CompanionCaseInput {
  claimText: string;
  sourceSays?: string;
  assessmentScope: AssessmentScope;
  epistemicKind: EpistemicKind;
  evidence: CompanionEvidenceInput[];
  missingOrConflicting?: string;
  wouldChange: string;
  strongestReading: string;
  inferenceBoundary?: string;
  disposition: Disposition;
  sessionId?: string;
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

function validateCase(body: unknown): { ok: true; value: CompanionCaseInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Request body must be an object' };
  const b = body as Record<string, unknown>;

  const claimText = typeof b.claimText === 'string' ? b.claimText.trim() : '';
  if (!claimText) return { ok: false, error: 'claimText is required' };

  const assessmentScope = b.assessmentScope as AssessmentScope;
  if (!ASSESSMENT_SCOPES.includes(assessmentScope)) {
    return { ok: false, error: `assessmentScope must be one of: ${ASSESSMENT_SCOPES.join(', ')}` };
  }

  const epistemicKind = b.epistemicKind as EpistemicKind;
  if (!EPISTEMIC_KINDS.includes(epistemicKind)) {
    return { ok: false, error: `epistemicKind must be one of: ${EPISTEMIC_KINDS.join(', ')}` };
  }

  const wouldChange = typeof b.wouldChange === 'string' ? b.wouldChange.trim() : '';
  if (!wouldChange) return { ok: false, error: 'wouldChange (the disconfirming condition) is required' };

  const strongestReading = typeof b.strongestReading === 'string' ? b.strongestReading.trim() : '';
  if (!strongestReading) return { ok: false, error: 'strongestReading is required' };

  const disposition = b.disposition as Disposition;
  if (!DISPOSITIONS.includes(disposition)) {
    return { ok: false, error: `disposition must be one of: ${DISPOSITIONS.join(', ')}` };
  }

  const rawEvidence = Array.isArray(b.evidence) ? b.evidence : [];
  const evidence: CompanionEvidenceInput[] = [];
  for (const item of rawEvidence) {
    if (typeof item !== 'object' || item === null) return { ok: false, error: 'Each evidence item must be an object' };
    const e = item as Record<string, unknown>;
    const evidenceRef = typeof e.evidenceRef === 'string' ? e.evidenceRef.trim() : '';
    if (!evidenceRef) continue;
    const relation = e.relation as EvidenceRelation;
    if (!RELATIONS.includes(relation)) return { ok: false, error: `Evidence relation must be one of: ${RELATIONS.join(', ')}` };
    const independence = e.independence as SourceIndependence;
    if (!INDEPENDENCE_LEVELS.includes(independence)) {
      return { ok: false, error: `Evidence independence must be one of: ${INDEPENDENCE_LEVELS.join(', ')}` };
    }
    const sourceEpistemicKind = EPISTEMIC_KINDS.includes(e.sourceEpistemicKind as EpistemicKind)
      ? (e.sourceEpistemicKind as EpistemicKind)
      : undefined;
    evidence.push({
      evidenceRef,
      snippet: typeof e.snippet === 'string' && e.snippet.trim() ? e.snippet.trim() : undefined,
      relation,
      independence,
      sourceEpistemicKind,
    });
  }

  return {
    ok: true,
    value: {
      claimText,
      sourceSays: typeof b.sourceSays === 'string' && b.sourceSays.trim() ? b.sourceSays.trim() : undefined,
      assessmentScope,
      epistemicKind,
      evidence,
      missingOrConflicting:
        typeof b.missingOrConflicting === 'string' && b.missingOrConflicting.trim()
          ? b.missingOrConflicting.trim()
          : undefined,
      wouldChange,
      strongestReading,
      inferenceBoundary:
        typeof b.inferenceBoundary === 'string' && b.inferenceBoundary.trim() ? b.inferenceBoundary.trim() : undefined,
      disposition,
      sessionId: typeof b.sessionId === 'string' && b.sessionId.trim() ? b.sessionId.trim() : undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Request body must be valid JSON');
    }

    const validated = validateCase(body);
    if (!validated.ok) return badRequest(validated.error);
    const input = validated.value;

    // Reasoning card (Spec §7) — a read projection stored on the emission receipt.
    // "Source says" defaults to the claim text itself only when the user is examining
    // a source statement; for a world_claim/personal_experience assessment it must be
    // supplied explicitly (or left absent) so it is never conflated with the claim.
    const card = {
      claimExamined: input.claimText,
      sourceSays: input.sourceSays ?? (input.assessmentScope === 'source_statement' ? input.claimText : null),
      availableSupport: input.evidence
        .filter((e) => e.relation === 'supports')
        .map((e) => ({ ref: e.evidenceRef, snippet: e.snippet ?? null, independence: e.independence })),
      conflictingOrContradicting: input.evidence
        .filter((e) => e.relation === 'contradicts')
        .map((e) => ({ ref: e.evidenceRef, snippet: e.snippet ?? null, independence: e.independence })),
      inferenceBoundary: input.inferenceBoundary ?? null,
      missingOrConflicting: input.missingOrConflicting ?? null,
      strongestDefensibleReading: input.strongestReading,
      wouldChangeThisReading: input.wouldChange,
      privateDisposition: input.disposition,
    };

    const claimLedger = new ClaimLedgerService(supabase);
    let claimId: string | null;
    try {
      claimId = await claimLedger.recordClaim({
        userId: user.id,
        sessionId: input.sessionId,
        sourceFeature: 'companion',
        claimText: input.claimText,
        claimKind: 'assertion',
        status: 'emitted',
        epistemicKind: input.epistemicKind,
        assessmentScope: input.assessmentScope,
        evidenceLinks: input.evidence.map((e) => ({
          evidenceType: 'source',
          evidenceRef: e.evidenceRef,
          snippet: e.snippet,
          relation: e.relation,
          independence: e.independence,
          sourceEpistemicKind: e.sourceEpistemicKind,
        })),
        counterfactualTests: [
          {
            method: input.wouldChange,
            resultLabel: 'inconclusive',
          },
        ],
        receipts: [{ receiptType: 'emission', actor: 'user', receiptJson: { card } }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record case';
      if (message.startsWith('Claim violates epistemic invariants')) {
        return NextResponse.json({ success: false, error: message }, { status: 422 });
      }
      throw error;
    }

    if (!claimId) return badRequest('claimText could not be recorded');

    return NextResponse.json({ success: true, claimId });
  } catch (error) {
    console.error('[Companion API] Record case error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record case' }, { status: 500 });
  }
}
