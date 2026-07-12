import type { AssessmentScope, EpistemicKind, SourceIndependence } from '@/types/claim-ledger';

/**
 * Defense-layer-1 (service layer) enforcement of the three CSL epistemic
 * invariants named in docs/CSL-Reasoning-Companion-Architecture.md §6.
 * This is the product-soul guard: it stops the companion from letting a
 * source statement pass as independent proof of a world claim, and from
 * synthesizing an actor-attribution verdict without sufficient evidence.
 *
 * Additive by design: callers only invoke this when a claim opts into the
 * CSL fields (epistemicKind/assessmentScope/relation/independence). Claims
 * that never set these fields are unaffected.
 */

export interface EpistemicEvidenceLinkInput {
  relation?: 'supports' | 'contradicts' | 'contextualizes';
  independence?: SourceIndependence;
  /** Epistemic kind of the thing being cited as evidence, when known
   * (e.g. a felt_state item should never independently support a world claim). */
  sourceEpistemicKind?: EpistemicKind;
}

export interface EpistemicGateDecisionInput {
  gateName: string;
  decision: 'pass' | 'fail' | 'warn';
}

export interface EpistemicClaimInput {
  claimKind?: 'assertion' | 'hypothesis' | 'decision' | 'verdict';
  claimText: string;
  epistemicKind?: EpistemicKind;
  assessmentScope?: AssessmentScope;
  evidenceLinks?: EpistemicEvidenceLinkInput[];
  gateDecisions?: EpistemicGateDecisionInput[];
}

export interface EpistemicViolation {
  rule: 'felt_state_as_world_claim_support' | 'world_claim_without_independent_evidence' | 'unguarded_attribution_verdict';
  message: string;
}

export type EpistemicValidationResult =
  | { ok: true }
  | { ok: false; violations: EpistemicViolation[] };

// Language that asserts coordination, foreign nexus, intent, or a FIMI
// classification — the boundary CSL forbids crossing without a passing
// non_attribution gate backed by independent evidence.
const ATTRIBUTION_PATTERN =
  /\b(coordinated|foreign[- ]?linked|foreign nexus|state[- ]?sponsored|intentional(ly)?|proxy[- ]?controlled|fimi|guilty|culpable)\b/i;

function hasFeltStateSupportingWorldClaim(input: EpistemicClaimInput): boolean {
  if (input.assessmentScope !== 'world_claim') return false;
  return (input.evidenceLinks ?? []).some(
    (link) => link.sourceEpistemicKind === 'felt_state' && link.relation === 'supports'
  );
}

function hasWorldClaimWithoutIndependentEvidence(input: EpistemicClaimInput): boolean {
  if (input.assessmentScope !== 'world_claim') return false;
  const links = input.evidenceLinks ?? [];
  if (links.length === 0) return false; // no evidence at all is a different failure mode (unsupported), not overclaim
  return links.every((link) => link.independence === 'primary' || link.independence === 'related_party');
}

function hasUnguardedAttributionVerdict(input: EpistemicClaimInput): boolean {
  if (input.claimKind !== 'verdict') return false;
  if (!ATTRIBUTION_PATTERN.test(input.claimText)) return false;
  const gates = input.gateDecisions ?? [];
  const passedNonAttribution = gates.some((g) => g.gateName === 'non_attribution' && g.decision === 'pass');
  return !passedNonAttribution;
}

export function validateEpistemicInvariants(input: EpistemicClaimInput): EpistemicValidationResult {
  const violations: EpistemicViolation[] = [];

  if (hasFeltStateSupportingWorldClaim(input)) {
    violations.push({
      rule: 'felt_state_as_world_claim_support',
      message: 'A felt_state item cannot support a world_claim assessment — felt state is evidence of personal experience only.',
    });
  }

  if (hasWorldClaimWithoutIndependentEvidence(input)) {
    violations.push({
      rule: 'world_claim_without_independent_evidence',
      message: 'A world_claim assessment cannot rest solely on primary/related_party evidence — at least one independent link is required.',
    });
  }

  if (hasUnguardedAttributionVerdict(input)) {
    violations.push({
      rule: 'unguarded_attribution_verdict',
      message: 'A verdict asserting coordination, foreign nexus, intent, or FIMI requires a passing "non_attribution" gate decision.',
    });
  }

  return violations.length > 0 ? { ok: false, violations } : { ok: true };
}
