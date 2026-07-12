import { describe, expect, it } from 'vitest';
import { validateEpistemicInvariants } from '../epistemic-invariants';

describe('validateEpistemicInvariants', () => {
  it('passes a claim that sets none of the CSL fields (backward compatibility)', () => {
    const result = validateEpistemicInvariants({ claimText: 'The report was published in March.' });
    expect(result.ok).toBe(true);
  });

  it('passes a world_claim assessment backed by independent evidence', () => {
    const result = validateEpistemicInvariants({
      claimText: 'The event occurred as described.',
      assessmentScope: 'world_claim',
      evidenceLinks: [{ relation: 'supports', independence: 'independent' }],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a felt_state item supporting a world_claim', () => {
    const result = validateEpistemicInvariants({
      claimText: 'This is definitely true.',
      assessmentScope: 'world_claim',
      evidenceLinks: [{ relation: 'supports', sourceEpistemicKind: 'felt_state' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.map((v) => v.rule)).toContain('felt_state_as_world_claim_support');
    }
  });

  it('allows a felt_state item to support a personal_experience assessment', () => {
    const result = validateEpistemicInvariants({
      claimText: 'I felt anxious reading this.',
      assessmentScope: 'personal_experience',
      evidenceLinks: [{ relation: 'supports', sourceEpistemicKind: 'felt_state' }],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a world_claim assessment supported only by primary/related_party evidence', () => {
    const result = validateEpistemicInvariants({
      claimText: 'The source confirms the world claim.',
      assessmentScope: 'world_claim',
      evidenceLinks: [
        { relation: 'supports', independence: 'primary' },
        { relation: 'supports', independence: 'related_party' },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.map((v) => v.rule)).toContain('world_claim_without_independent_evidence');
    }
  });

  it('does not flag a world_claim assessment with no evidence links at all (unsupported, not overclaim)', () => {
    const result = validateEpistemicInvariants({
      claimText: 'Unclear whether this happened.',
      assessmentScope: 'world_claim',
      evidenceLinks: [],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects an unguarded attribution verdict', () => {
    const result = validateEpistemicInvariants({
      claimKind: 'verdict',
      claimText: 'This campaign was coordinated and foreign-linked.',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.map((v) => v.rule)).toContain('unguarded_attribution_verdict');
    }
  });

  it('allows an attribution verdict guarded by a passing non_attribution gate', () => {
    const result = validateEpistemicInvariants({
      claimKind: 'verdict',
      claimText: 'This campaign was coordinated and foreign-linked.',
      gateDecisions: [{ gateName: 'non_attribution', decision: 'pass' }],
    });
    expect(result.ok).toBe(true);
  });

  it('does not flag attribution language on a non-verdict claim', () => {
    const result = validateEpistemicInvariants({
      claimKind: 'hypothesis',
      claimText: 'It is possible this involved coordinated behavior; unconfirmed.',
    });
    expect(result.ok).toBe(true);
  });

  it('accumulates multiple violations on a single claim', () => {
    const result = validateEpistemicInvariants({
      claimKind: 'verdict',
      claimText: 'This was intentional and foreign-linked.',
      assessmentScope: 'world_claim',
      evidenceLinks: [{ relation: 'supports', sourceEpistemicKind: 'felt_state', independence: 'primary' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    }
  });
});
