import type { NovelIdea, PriorArt } from '@/types';
import type { ContradictionEvidence, NoveltyGateResult, NoveltyProof } from '@/types/hybrid-novelty';

interface NoveltyProofConfig {
  noveltyThreshold: number;
  falsifiabilityThreshold: number;
  contradictionThreshold: number;
  priorArtSearchFn?: (thesis: string, description: string) => Promise<PriorArt[]>;
}

interface ScoreEnvelope {
  priorArtDistance: number;
  contradictionResolvedScore: number;
  mechanismDifferentiationScore: number;
  interventionValueScore: number;
  falsifiabilityScore: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function containsAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function scoreFalsifiability(idea: NovelIdea): number {
  const prediction = idea.prediction || '';
  const falsifier = idea.falsifier || '';

  let score = 0.2;
  if (prediction.length >= 40) score += 0.25;
  if (containsAny(prediction, ['if', 'then', 'expect', 'observe'])) score += 0.2;
  if (falsifier.length >= 20) score += 0.25;
  if (containsAny(falsifier, ['fail', 'reject', 'disconfirm', 'null'])) score += 0.1;
  return clamp01(score);
}

function scoreMechanismDifferentiation(idea: NovelIdea): number {
  const mechanism = idea.mechanism || idea.explanatoryMechanism || '';
  const bridged = idea.bridgedConcepts || [];

  let score = 0.2;
  if (mechanism.length >= 80) score += 0.35;
  if (bridged.length >= 2) score += 0.25;
  if (containsAny(mechanism, ['because', 'therefore', 'mediates', 'causes'])) score += 0.2;
  return clamp01(score);
}

function scoreInterventionValue(idea: NovelIdea): number {
  if (typeof idea.interventionValueScore === 'number') {
    return clamp01(idea.interventionValueScore);
  }

  const mechanism = idea.mechanism || '';
  const doPlan = idea.doPlan || '';

  let score = 0.2;
  if (doPlan.length > 25) score += 0.35;
  if (containsAny(mechanism, ['intervene', 'control', 'counterfactual', 'policy'])) score += 0.25;
  if (containsAny(doPlan, ['do(', 'intervention', 'ablation', 'treatment'])) score += 0.2;
  return clamp01(score);
}

function scoreContradictionResolution(
  idea: NovelIdea,
  contradictionMatrix: ContradictionEvidence[],
): { contradictionResolvedScore: number; contradictionIds: string[] } {
  const thesis = `${idea.thesis} ${idea.description}`.toLowerCase();
  const hits: string[] = [];

  for (const row of contradictionMatrix) {
    const concept = row.concept.toLowerCase();
    if (thesis.includes(concept) || (idea.bridgedConcepts || []).some((item) => item.toLowerCase().includes(concept))) {
      hits.push(row.id);
    }
  }

  const denominator = Math.max(1, contradictionMatrix.filter((row) => row.highConfidence).length);
  const contradictionResolvedScore = clamp01(hits.length / denominator);
  return { contradictionResolvedScore, contradictionIds: hits };
}

function scorePriorArtDistance(priorArt: PriorArt[]): number {
  if (priorArt.length === 0) return 1;

  const topSimilarity = Math.max(
    ...priorArt.map((entry) => {
      const similarity = entry.adjustedSimilarity ?? entry.similarity;
      return similarity > 1 ? similarity / 100 : similarity;
    }),
  );

  return clamp01(1 - topSimilarity);
}

function blockedReasons(
  scores: ScoreEnvelope,
  contradictionIds: string[],
  thresholds: Pick<NoveltyProofConfig, 'noveltyThreshold' | 'falsifiabilityThreshold' | 'contradictionThreshold'>,
): string[] {
  const reasons: string[] = [];
  if (scores.priorArtDistance < thresholds.noveltyThreshold) {
    reasons.push('prior_art_overlap_above_threshold');
  }
  if (scores.falsifiabilityScore < thresholds.falsifiabilityThreshold) {
    reasons.push('falsifiability_signal_insufficient');
  }
  if (scores.contradictionResolvedScore < thresholds.contradictionThreshold || contradictionIds.length === 0) {
    reasons.push('contradiction_bridge_missing');
  }
  if (scores.interventionValueScore < 0.4) {
    reasons.push('intervention_value_too_low');
  }
  return reasons;
}

export async function computeNoveltyProofs(
  ideas: NovelIdea[],
  contradictionMatrix: ContradictionEvidence[],
  config: NoveltyProofConfig,
): Promise<NoveltyProof[]> {
  const proofs: NoveltyProof[] = [];

  for (const idea of ideas) {
    const closestPriorArt = config.priorArtSearchFn
      ? await config.priorArtSearchFn(idea.thesis, idea.description)
      : [];

    const priorArtDistance = scorePriorArtDistance(closestPriorArt);
    const { contradictionResolvedScore, contradictionIds } = scoreContradictionResolution(idea, contradictionMatrix);
    const mechanismDifferentiationScore = scoreMechanismDifferentiation(idea);
    const interventionValueScore = scoreInterventionValue(idea);
    const falsifiabilityScore = scoreFalsifiability(idea);

    const scoreBundle: ScoreEnvelope = {
      priorArtDistance,
      contradictionResolvedScore,
      mechanismDifferentiationScore,
      interventionValueScore,
      falsifiabilityScore,
    };

    const reasons = blockedReasons(scoreBundle, contradictionIds, {
      noveltyThreshold: config.noveltyThreshold,
      falsifiabilityThreshold: config.falsifiabilityThreshold,
      contradictionThreshold: config.contradictionThreshold,
    });

    proofs.push({
      ideaId: idea.id,
      ideaThesis: idea.thesis,
      contradictionIds,
      closestPriorArt,
      priorArtDistance,
      contradictionResolvedScore,
      mechanismDifferentiationScore,
      interventionValueScore,
      falsifiabilityScore,
      assumptions: idea.confounderSet || [],
      confounders: idea.confounderSet || [],
      proofStatus: reasons.length > 0 ? 'blocked' : 'pass',
      blockedReasons: reasons,
      falsificationPlan: {
        disconfirmingExperiment:
          idea.falsifier ||
          'Run an ablation that removes the proposed mechanism and compare outcome deltas against baseline.',
        expectedFailureSignal:
          idea.prediction || 'If core mechanism is invalid, predicted effect size collapses under intervention.',
        requiredAssumptions: idea.confounderSet || ['measurement_validity', 'stable_context'],
        confoundersToControl: idea.confounderSet || ['selection_bias', 'temporal_shift'],
      },
    });
  }

  return proofs;
}

export function computeNoveltyGate(
  proofs: NoveltyProof[],
  thresholds: Pick<NoveltyProofConfig, 'noveltyThreshold'>,
): NoveltyGateResult {
  const passing = proofs.filter((proof) => proof.proofStatus === 'pass');
  const blocked = proofs.filter((proof) => proof.proofStatus === 'blocked');

  if (proofs.length === 0) {
    return {
      decision: 'recover',
      threshold: thresholds.noveltyThreshold,
      passingIdeas: 0,
      blockedIdeas: 0,
      reasons: ['no_candidate_ideas'],
    };
  }

  if (passing.length === 0) {
    return {
      decision: 'recover',
      threshold: thresholds.noveltyThreshold,
      passingIdeas: 0,
      blockedIdeas: blocked.length,
      reasons: [...new Set(blocked.flatMap((item) => item.blockedReasons))],
    };
  }

  return {
    decision: 'pass',
    threshold: thresholds.noveltyThreshold,
    passingIdeas: passing.length,
    blockedIdeas: blocked.length,
    reasons: blocked.length > 0 ? ['some_candidates_blocked'] : ['all_candidates_passed'],
  };
}
