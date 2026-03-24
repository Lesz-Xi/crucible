import type { ContradictionEvidence, NoveltyGateResult, NoveltyProof, RecoveryPlan } from '@/types/hybrid-novelty';

const DOMAIN_SOURCE_HINTS: Record<string, string[]> = {
  biotech: ['clinical trial registry', 'wet-lab replication protocol', 'negative findings corpus'],
  legal: ['case law contradictions', 'jurisdiction split analysis', 'dissenting opinions'],
  finance: ['regulatory filings', 'earnings call transcripts', 'counter-cyclical datasets'],
  education: ['longitudinal outcomes studies', 'controlled intervention reports', 'curriculum variance datasets'],
  default: ['peer-reviewed replication studies', 'mechanistic benchmark datasets', 'counterexample corpora'],
};

function inferDomain(proofs: NoveltyProof[]): string {
  const text = proofs.map((proof) => proof.ideaThesis.toLowerCase()).join(' ');
  if (text.includes('court') || text.includes('liability') || text.includes('jurisdiction')) return 'legal';
  if (text.includes('drug') || text.includes('cell') || text.includes('biolog')) return 'biotech';
  if (text.includes('market') || text.includes('risk') || text.includes('portfolio')) return 'finance';
  if (text.includes('student') || text.includes('learning') || text.includes('curriculum')) return 'education';
  return 'default';
}

export function buildNoveltyRecoveryPlan(input: {
  gate: NoveltyGateResult;
  proofs: NoveltyProof[];
  contradictionMatrix: ContradictionEvidence[];
}): RecoveryPlan {
  const blockedReasons = [...new Set(input.proofs.flatMap((proof) => proof.blockedReasons))];
  const highConfidenceRows = input.contradictionMatrix.filter((row) => row.highConfidence);
  const domain = inferDomain(input.proofs);

  const diagnosis: string[] = [];
  if (blockedReasons.includes('prior_art_overlap_above_threshold')) {
    diagnosis.push('Closest prior-art overlap is above novelty threshold; differentiator is currently insufficient.');
  }
  if (blockedReasons.includes('falsifiability_signal_insufficient')) {
    diagnosis.push('Candidate hypotheses lack a concrete disconfirming experiment and measurable failure signal.');
  }
  if (blockedReasons.includes('contradiction_bridge_missing')) {
    diagnosis.push('Ideas are not explicitly anchored to high-confidence contradiction rows.');
  }
  if (highConfidenceRows.length === 0) {
    diagnosis.push('No high-confidence contradiction was found across supplied sources.');
  }

  const suggestedInterventions: string[] = [
    'Add one intervention scenario that changes a single mechanism variable while holding confounders constant.',
    'Attach one negative-control condition to force a falsifiable outcome boundary.',
  ];

  if (blockedReasons.includes('prior_art_overlap_above_threshold')) {
    suggestedInterventions.push('Force mechanism rewrite using a different causal mediator than top prior-art results.');
  }

  if (blockedReasons.includes('contradiction_bridge_missing')) {
    suggestedInterventions.push('Reframe hypothesis so each candidate references at least one contradiction row ID.');
  }

  return {
    message: 'Novelty blocked - recovery plan generated. Improve evidence quality, then rerun synthesis.',
    diagnosis,
    suggestedSources: DOMAIN_SOURCE_HINTS[domain],
    suggestedInterventions,
    rerunRecipe: {
      inputDelta: [
        'Add at least 2 sources containing explicit conflicting claims.',
        'Provide one mechanism-focused research prompt with target variable and expected direction.',
        'Include one disconfirming experiment statement per hypothesis candidate.',
      ],
      expectedEpistemicLift: 'Higher contradiction recall and stronger falsifiability should increase novelty gate pass probability.',
    },
  };
}
