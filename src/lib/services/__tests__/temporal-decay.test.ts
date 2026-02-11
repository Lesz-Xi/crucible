/**
 * Unit Tests for Temporal Decay Service
 * 
 * Tests exponential decay calculations, publication year parsing,
 * and weighted similarity adjustments.
 */

import { describe, it, expect } from '@jest/globals';
import {
    calculateTemporalWeight,
    parsePublicationYear,
    applyTemporalDecay,
    sortByTemporalRelevance,
    explainTemporalImpact,
    type PriorArtWithAge,
    type WeightedPriorArt,
} from '../temporal-decay';

describe('Temporal Decay Service', () => {
    describe('calculateTemporalWeight', () => {
        it('should return 1.0 for current year (age 0)', () => {
            const weight = calculateTemporalWeight(0);
            expect(weight).toBeCloseTo(1.0, 2);
        });

        it('should apply exponential decay for older publications', () => {
            // With decay constant 0.1:
            // 1 year: exp(-0.1) ≈ 0.905
            // 5 years: exp(-0.5) ≈ 0.607
            // 10 years: exp(-1.0) ≈ 0.368
            expect(calculateTemporalWeight(1)).toBeCloseTo(0.905, 2);
            expect(calculateTemporalWeight(5)).toBeCloseTo(0.607, 2);
            expect(calculateTemporalWeight(10)).toBeCloseTo(0.368, 2);
        });

        it('should respect minimum weight floor', () => {
            // Even very old publications get minimum 10% weight
            const veryOld = calculateTemporalWeight(100);
            expect(veryOld).toBeGreaterThanOrEqual(0.1);
        });

        it('should handle custom decay constants', () => {
            // Faster decay (λ=0.2)
            const fastDecay = calculateTemporalWeight(5, { decayConstant: 0.2 });
            expect(fastDecay).toBeCloseTo(0.368, 2); // exp(-1.0)

            // Slower decay (λ=0.05)
            const slowDecay = calculateTemporalWeight(5, { decayConstant: 0.05 });
            expect(slowDecay).toBeCloseTo(0.779, 2); // exp(-0.25)
        });

        it('should return 1.0 for negative ages (future dates)', () => {
            const weight = calculateTemporalWeight(-5);
            expect(weight).toBe(1.0);
        });
    });

    describe('parsePublicationYear', () => {
        it('should parse 4-digit years', () => {
            expect(parsePublicationYear('2023')).toBe(2023);
            expect(parsePublicationYear('1995')).toBe(1995);
        });

        it('should extract year from ISO dates', () => {
            expect(parsePublicationYear('2023-01-15')).toBe(2023);
            expect(parsePublicationYear('2020-12-31')).toBe(2020);
        });

        it('should extract year from natural language dates', () => {
            expect(parsePublicationYear('Jan 2023')).toBe(2023);
            expect(parsePublicationYear('Published in 2021')).toBe(2021);
        });

        it('should return fallback for unparseable strings', () => {
            expect(parsePublicationYear('Unknown', 2020)).toBe(2020);
            expect(parsePublicationYear('TBD', 2022)).toBe(2022);
        });

        it('should return null for missing values without fallback', () => {
            expect(parsePublicationYear(null)).toBeNull();
            expect(parsePublicationYear(undefined)).toBeNull();
            expect(parsePublicationYear('')).toBeNull();
        });
    });

    describe('applyTemporalDecay', () => {
        const mockPriorArt: PriorArtWithAge[] = [
            { title: 'Recent Paper', publicationYear: 2024, similarity: 80 },
            { title: 'Older Paper', publicationYear: 2015, similarity: 80 },
            { title: 'Ancient Paper', publicationYear: 2000, similarity: 80 },
            { title: 'Unknown Year', publicationYear: null, similarity: 80 },
        ];

        it('should calculate temporal weights correctly', () => {
            const weighted = applyTemporalDecay(mockPriorArt, { referenceYear: 2025 });

            // Recent (1 year old)
            expect(weighted[0].temporalWeight).toBeCloseTo(0.905, 2);

            // Older (10 years old)
            expect(weighted[1].temporalWeight).toBeCloseTo(0.368, 2);

            // Ancient (25 years old)
            expect(weighted[2].temporalWeight).toBeGreaterThanOrEqual(0.1);

            // Unknown (no decay)
            expect(weighted[3].temporalWeight).toBe(1.0);
        });

        it('should adjust similarity scores by temporal weight', () => {
            const weighted = applyTemporalDecay(mockPriorArt, { referenceYear: 2025 });

            // Recent: 80 * 0.905 ≈ 72.4
            expect(weighted[0].adjustedSimilarity).toBeCloseTo(72.4, 1);

            // Older: 80 * 0.368 ≈ 29.4
            expect(weighted[1].adjustedSimilarity).toBeCloseTo(29.4, 1);

            // Unknown: 80 * 1.0 = 80
            expect(weighted[3].adjustedSimilarity).toBe(80);
        });

        it('should preserve original data', () => {
            const weighted = applyTemporalDecay(mockPriorArt);

            weighted.forEach((item, i) => {
                expect(item.title).toBe(mockPriorArt[i].title);
                expect(item.similarity).toBe(mockPriorArt[i].similarity);
            });
        });
    });

    describe('sortByTemporalRelevance', () => {
        it('should sort by adjusted similarity (highest first)', () => {
            const weighted: WeightedPriorArt[] = [
                {
                    title: 'Old but similar',
                    publicationYear: 2010,
                    similarity: 90,
                    temporalWeight: 0.2,
                    adjustedSimilarity: 18,
                    ageYears: 15,
                },
                {
                    title: 'Recent and similar',
                    publicationYear: 2024,
                    similarity: 70,
                    temporalWeight: 0.9,
                    adjustedSimilarity: 63,
                    ageYears: 1,
                },
            ];

            const sorted = sortByTemporalRelevance(weighted);
            expect(sorted[0].title).toBe('Recent and similar');
            expect(sorted[1].title).toBe('Old but similar');
        });
    });

    describe('explainTemporalImpact', () => {
        it('should explain recent publications', () => {
            const item: WeightedPriorArt = {
                title: 'Recent',
                publicationYear: 2025,
                similarity: 80,
                temporalWeight: 1.0,
                adjustedSimilarity: 80,
                ageYears: 0,
            };

            const explanation = explainTemporalImpact(item);
            expect(explanation).toContain('Recent publication');
            expect(explanation).toContain('2025');
        });

        it('should explain older publications with decay percentage', () => {
            const item: WeightedPriorArt = {
                title: 'Older',
                publicationYear: 2015,
                similarity: 80,
                temporalWeight: 0.368, // ~63% reduction
                adjustedSimilarity: 29.4,
                ageYears: 10,
            };

            const explanation = explainTemporalImpact(item);
            expect(explanation).toContain('10 years ago');
            expect(explanation).toContain('2015');
            expect(explanation).toContain('63%');
        });

        it('should handle missing publication years', () => {
            const item: WeightedPriorArt = {
                title: 'Unknown',
                publicationYear: null,
                similarity: 80,
                temporalWeight: 1.0,
                adjustedSimilarity: 80,
                ageYears: 0,
            };

            const explanation = explainTemporalImpact(item);
            expect(explanation).toContain('Publication year unknown');
        });
    });
});
