import { describe, expect, it } from 'vitest';
import type { NovelIdea } from '../../../types';
import { computeNoveltyGate, computeNoveltyProofs } from '../novelty-proof-engine';
import type { ContradictionEvidence } from '../../../types/hybrid-novelty';

const baseIdea: NovelIdea = {
  id: 'idea-1',
  thesis: 'Intervention channel anomaly separation improves detection under domain shifts.',
  description: 'Introduce an intervention channel that isolates confounded pathways before ranking anomalies.',
  mechanism: 'Because the intervention channel removes confounded signals, the remaining residual captures causal anomaly effects.',
  prediction: 'If intervention channel is removed, precision-at-k drops by at least 12%.',
  falsifier: 'Run ablation with intervention channel disabled and compare precision-at-k under the same dataset split.',
  bridgedConcepts: ['anomaly detection', 'domain adaptation', 'intervention channel'],
  confidence: 82,
  noveltyAssessment: 'Bridges contradiction between robust adaptation and anomaly precision.',
  doPlan: 'do(remove_intervention_channel) and compare causal density against baseline',
};

const contradictionMatrix: ContradictionEvidence[] = [
  {
    id: 'CMX-1',
    concept: 'intervention channel',
    claimA: 'Intervention channels reduce confounding noise.',
    claimB: 'Intervention channels overfit and reduce robustness.',
    sourceA: 'paper-a',
    sourceB: 'paper-b',
    semanticConflictScore: 0.71,
    mechanismConflictTag: 'mechanism',
    evidenceRefs: ['paper-a:thesis', 'paper-b:thesis'],
    highConfidence: true,
  },
];

describe('novelty-proof benchmark', () => {
  it('returns deterministic proof and pass gate for strong candidate', async () => {
    const search = async () => [
      {
        source: 'web',
        title: 'Prior Work Baseline',
        similarity: 0.22,
        differentiator: 'lacks intervention-aware channel',
      },
    ];

    const runA = await computeNoveltyProofs([baseIdea], contradictionMatrix, {
      noveltyThreshold: 0.3,
      falsifiabilityThreshold: 0.55,
      contradictionThreshold: 0.45,
      priorArtSearchFn: search,
    });

    const runB = await computeNoveltyProofs([baseIdea], contradictionMatrix, {
      noveltyThreshold: 0.3,
      falsifiabilityThreshold: 0.55,
      contradictionThreshold: 0.45,
      priorArtSearchFn: search,
    });

    expect(runA).toEqual(runB);
    expect(runA[0].proofStatus).toBe('pass');

    const gate = computeNoveltyGate(runA, { noveltyThreshold: 0.3 });
    expect(gate.decision).toBe('pass');
    expect(gate.passingIdeas).toBe(1);
    expect(gate.blockedIdeas).toBe(0);
  });

  it('blocks idea when overlap and falsifiability are weak', async () => {
    const weakIdea: NovelIdea = {
      ...baseIdea,
      id: 'idea-2',
      prediction: 'Maybe it helps.',
      falsifier: 'None.',
      doPlan: undefined,
    };

    const proofs = await computeNoveltyProofs([weakIdea], contradictionMatrix, {
      noveltyThreshold: 0.5,
      falsifiabilityThreshold: 0.8,
      contradictionThreshold: 0.45,
      priorArtSearchFn: async () => [
        {
          source: 'web',
          title: 'Very Similar Prior Work',
          similarity: 0.9,
          differentiator: 'minimal',
        },
      ],
    });

    expect(proofs[0].proofStatus).toBe('blocked');
    expect(proofs[0].blockedReasons).toContain('prior_art_overlap_above_threshold');
    expect(proofs[0].blockedReasons).toContain('falsifiability_signal_insufficient');
  });
});
