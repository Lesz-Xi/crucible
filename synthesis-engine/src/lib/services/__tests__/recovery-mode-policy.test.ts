import { describe, expect, it } from 'vitest';
import { buildNoveltyRecoveryPlan } from '../novelty-recovery-planner';
import { computeNoveltyGate } from '../novelty-proof-engine';

describe('recovery mode policy', () => {
  it('returns recovery decision when all candidates are blocked', () => {
    const proofs = [
      {
        ideaId: 'idea-1',
        ideaThesis: 'test thesis',
        contradictionIds: [],
        closestPriorArt: [],
        priorArtDistance: 0.1,
        contradictionResolvedScore: 0,
        mechanismDifferentiationScore: 0.4,
        interventionValueScore: 0.2,
        falsifiabilityScore: 0.2,
        assumptions: [],
        confounders: [],
        proofStatus: 'blocked' as const,
        blockedReasons: ['prior_art_overlap_above_threshold', 'contradiction_bridge_missing'],
        falsificationPlan: {
          disconfirmingExperiment: 'run test',
          expectedFailureSignal: 'metric collapse',
          requiredAssumptions: ['assumption-a'],
          confoundersToControl: ['conf-a'],
        },
      },
    ];

    const gate = computeNoveltyGate(proofs, { noveltyThreshold: 0.3 });
    expect(gate.decision).toBe('recover');

    const recovery = buildNoveltyRecoveryPlan({
      gate,
      proofs,
      contradictionMatrix: [],
    });

    expect(recovery.message).toContain('Novelty blocked');
    expect(recovery.diagnosis.length).toBeGreaterThan(0);
    expect(recovery.rerunRecipe.inputDelta.length).toBeGreaterThan(0);
  });
});
