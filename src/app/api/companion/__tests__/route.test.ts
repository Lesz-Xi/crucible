import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserMock = vi.fn();
const recordClaimMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
}));

vi.mock('@/lib/services/claim-ledger-service', () => ({
  ClaimLedgerService: class {
    async recordClaim(input: unknown) {
      return recordClaimMock(input);
    }
  },
}));

import { POST } from '../route';

function request(body: unknown) {
  return new Request('http://localhost/api/companion', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

const validCase = {
  claimText: 'The report states inflation fell 2% last quarter.',
  assessmentScope: 'source_statement',
  epistemicKind: 'source_claim',
  evidence: [
    { evidenceRef: 'https://example.com/report', relation: 'supports', independence: 'primary' },
  ],
  wouldChange: 'If the underlying dataset were revised downward.',
  strongestReading: 'The source made this claim; independent confirmation is still pending.',
  disposition: 'hold',
};

describe('POST /api/companion', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    recordClaimMock.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const response = await POST(request(validCase));
    expect(response.status).toBe(401);
  });

  it('returns 400 when claimText is missing', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const response = await POST(request({ ...validCase, claimText: '' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when wouldChange (falsifier) is missing', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const response = await POST(request({ ...validCase, wouldChange: '' }));
    expect(response.status).toBe(400);
  });

  it('returns 422 when the service rejects an epistemic invariant violation', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    recordClaimMock.mockRejectedValue(
      new Error('Claim violates epistemic invariants: A felt_state item cannot support a world_claim assessment')
    );
    const response = await POST(request(validCase));
    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload.success).toBe(false);
  });

  it('records the case and returns the claim id on success', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    recordClaimMock.mockResolvedValue('claim-123');
    const response = await POST(request(validCase));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.claimId).toBe('claim-123');

    const call = recordClaimMock.mock.calls[0][0];
    expect(call.sourceFeature).toBe('companion');
    expect(call.assessmentScope).toBe('source_statement');
    expect(call.evidenceLinks[0].relation).toBe('supports');
    expect(call.counterfactualTests[0].method).toBe(validCase.wouldChange);
    expect(call.receipts[0].receiptJson.card.privateDisposition).toBe('hold');
  });
});
