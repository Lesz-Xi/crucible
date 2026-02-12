import type { Contradiction, ExtractedConcepts } from '@/types';
import type { ContradictionEvidence } from '@/types/hybrid-novelty';

interface SourceSnapshot {
  name: string;
  concepts: ExtractedConcepts;
}

const TAG_KEYWORDS: Array<{ tag: ContradictionEvidence['mechanismConflictTag']; words: string[] }> = [
  { tag: 'mechanism', words: ['mechanism', 'causal', 'pathway', 'driver'] },
  { tag: 'assumption', words: ['assume', 'assumption', 'premise', 'prior'] },
  { tag: 'outcome', words: ['result', 'outcome', 'impact', 'effect'] },
  { tag: 'method', words: ['method', 'protocol', 'experiment', 'measurement'] },
];

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function overlapScore(left: string, right: string): number {
  const leftSet = new Set(tokenize(left));
  const rightSet = new Set(tokenize(right));
  if (leftSet.size === 0 && rightSet.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function classifyTag(claimA: string, claimB: string): ContradictionEvidence['mechanismConflictTag'] {
  const combined = `${claimA} ${claimB}`.toLowerCase();
  for (const candidate of TAG_KEYWORDS) {
    if (candidate.words.some((word) => combined.includes(word))) {
      return candidate.tag;
    }
  }

  return 'outcome';
}

function claimEvidenceRefs(source: SourceSnapshot | undefined, concept: string): string[] {
  if (!source) {
    return [];
  }

  const refs: string[] = [];
  const thesis = source.concepts.mainThesis || '';
  const args = source.concepts.keyArguments || [];

  if (thesis.toLowerCase().includes(concept.toLowerCase())) {
    refs.push(`${source.name}:thesis`);
  }

  args.forEach((argument, index) => {
    if (argument.toLowerCase().includes(concept.toLowerCase())) {
      refs.push(`${source.name}:arg-${index + 1}`);
    }
  });

  return refs.slice(0, 4);
}

export function buildContradictionMatrix(
  contradictions: Contradiction[],
  sources: SourceSnapshot[],
): ContradictionEvidence[] {
  return contradictions.map((item, index) => {
    const sourceA = sources.find((source) => source.name === item.sourceA);
    const sourceB = sources.find((source) => source.name === item.sourceB);

    const semanticDistance = 1 - overlapScore(item.claimA, item.claimB);
    const semanticConflictScore = Number(Math.max(0, Math.min(1, semanticDistance)).toFixed(3));
    const mechanismConflictTag = classifyTag(item.claimA, item.claimB);
    const evidenceRefs = [
      ...claimEvidenceRefs(sourceA, item.concept),
      ...claimEvidenceRefs(sourceB, item.concept),
    ];

    const highConfidence = semanticConflictScore >= 0.55;

    return {
      id: `CMX-${index + 1}`,
      concept: item.concept,
      claimA: item.claimA,
      claimB: item.claimB,
      sourceA: item.sourceA,
      sourceB: item.sourceB,
      semanticConflictScore,
      mechanismConflictTag,
      evidenceRefs,
      highConfidence,
    } satisfies ContradictionEvidence;
  });
}

export function hasHighConfidenceContradictions(matrix: ContradictionEvidence[]): boolean {
  return matrix.some((row) => row.highConfidence);
}
