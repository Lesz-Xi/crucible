import { describe, expect, it } from 'vitest';
import { buildContradictionMatrix, hasHighConfidenceContradictions } from '../contradiction-matrix';

describe('contradiction recall benchmark', () => {
  it('builds matrix rows with deterministic IDs and confidence flags', () => {
    const matrix = buildContradictionMatrix(
      [
        {
          concept: 'dose-response',
          sourceA: 'study-a',
          claimA: 'Higher dosage increases efficacy.',
          sourceB: 'study-b',
          claimB: 'Higher dosage causes no efficacy gain.',
          resolution: 'requires targeted subgrouping',
        },
      ],
      [
        {
          name: 'study-a',
          concepts: {
            mainThesis: 'Dose improves efficacy under constrained conditions.',
            keyArguments: ['dose-response appears only with proper controls'],
            entities: [],
          },
        },
        {
          name: 'study-b',
          concepts: {
            mainThesis: 'Dose fails to increase efficacy in heterogeneous populations.',
            keyArguments: ['heterogeneity masks response improvements'],
            entities: [],
          },
        },
      ],
    );

    expect(matrix).toHaveLength(1);
    expect(matrix[0].id).toBe('CMX-1');
    expect(matrix[0].semanticConflictScore).toBeGreaterThan(0);
    expect(hasHighConfidenceContradictions(matrix)).toBeTypeOf('boolean');
  });

  it('returns false when no contradiction rows are high confidence', () => {
    const matrix = buildContradictionMatrix(
      [
        {
          concept: 'same claim',
          sourceA: 'a',
          claimA: 'Outcome increases under treatment.',
          sourceB: 'b',
          claimB: 'Outcome increases under treatment.',
        },
      ],
      [
        {
          name: 'a',
          concepts: {
            mainThesis: 'Outcome increases under treatment.',
            keyArguments: ['Outcome increases under treatment.'],
            entities: [],
          },
        },
      ],
    );

    expect(hasHighConfidenceContradictions(matrix)).toBe(false);
  });
});
