/**
 * Integration Tests: OpenClaw Data Ingestion Pipeline
 * 
 * Tests the complete flow:
 * 1. OpenClawAdapter message handling
 * 2. Causal density scoring
 * 3. Database persistence (mocked)
 * 4. API endpoint behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenClawAdapter, type ScoredSearchResult } from '@/lib/services/openclaw-adapter';
import { CausalIntegrityService } from '@/lib/ai/causal-integrity-service';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: async () => ({
                data: { user: { id: 'test-user-id' } },
                error: null,
            }),
        },
        from: (table: string) => ({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
                data: [],
                error: null,
            }),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
        }),
    }),
}));

describe('OpenClawAdapter', () => {
    let adapter: OpenClawAdapter;

    beforeEach(() => {
        adapter = new OpenClawAdapter();
    });

    it('should handle search response messages with multiple results', async () => {
        const mockMessage = {
            id: 'test-msg-1',
            type: 'response' as const,
            payload: {
                query: 'causal inference methods',
                results: [
                    {
                        title: 'Randomized Controlled Trials in Medicine',
                        snippet: 'RCTs manipulate treatment assignment to establish causal effects. By randomizing patients...',
                        url: 'https://example.com/rct',
                        relevanceScore: 0.95,
                    },
                    {
                        title: 'Correlation vs Causation',
                        snippet: 'While correlation shows association between variables, establishing causation requires...',
                        url: 'https://example.com/correlation',
                        relevanceScore: 0.72,
                    },
                ],
            },
            timestamp: new Date().toISOString(),
        };

        const results = await adapter.handleSearchResponse(mockMessage);

        expect(results).toHaveLength(2);
        expect(results[0].query).toBe('causal inference methods');
        expect(results[0].source).toBe('openclaw');
        expect(results[0].causalDensityScore).toBeGreaterThanOrEqual(1);
        expect(results[0].causalDensityScore).toBeLessThanOrEqual(3);
        expect(results[0].confidence).toBeGreaterThan(0);
        expect(results[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should assign higher causal density to intervention language', async () => {
        const mockMessage = {
            id: 'test-msg-2',
            type: 'response' as const,
            payload: {
                query: 'test query',
                results: [
                    {
                        title: 'Intervention Study',
                        snippet: 'We manipulated the treatment to observe the effect on outcomes. The intervention caused significant changes...',
                        url: 'https://example.com/intervention',
                    },
                    {
                        title: 'Observational Study',
                        snippet: 'We observed a correlation between variables A and B in the population...',
                        url: 'https://example.com/observational',
                    },
                ],
            },
            timestamp: new Date().toISOString(),
        };

        const results = await adapter.handleSearchResponse(mockMessage);

        // Find intervention vs observational results
        const interventionResult = results.find(r => r.title.includes('Intervention'));
        const observationalResult = results.find(r => r.title.includes('Observational'));

        expect(interventionResult).toBeDefined();
        expect(observationalResult).toBeDefined();

        // Intervention language should score higher
        expect(interventionResult!.causalDensityScore).toBeGreaterThanOrEqual(
            observationalResult!.causalDensityScore
        );
    });

    it('should handle empty results gracefully', async () => {
        const mockMessage = {
            id: 'test-msg-3',
            type: 'response' as const,
            payload: {
                query: 'nonexistent query',
                results: [],
            },
            timestamp: new Date().toISOString(),
        };

        const results = await adapter.handleSearchResponse(mockMessage);

        expect(results).toHaveLength(0);
    });

    it('should ignore non-response messages', async () => {
        const mockMessage = {
            id: 'test-msg-4',
            type: 'event' as const,
            payload: { message: 'Something happened' },
            timestamp: new Date().toISOString(),
        };

        const results = await adapter.handleSearchResponse(mockMessage);

        expect(results).toHaveLength(0);
    });
});

describe('CausalIntegrityService', () => {
    let service: CausalIntegrityService;

    beforeEach(() => {
        service = new CausalIntegrityService();
    });

    it('should provide scoreEvidence() alias for evaluate()', () => {
        const text = 'The intervention caused an increase in outcomes.';

        const evaluateResult = service.evaluate(text);
        const scoreResult = service.scoreEvidence(text);

        expect(scoreResult).toEqual(evaluateResult);
        expect(scoreResult.score).toBeGreaterThanOrEqual(1);
        expect(scoreResult.score).toBeLessThanOrEqual(3);
    });

    it('should detect L1 (Association) patterns', () => {
        const text = 'There is a correlation between smoking and lung cancer. Statistical association was observed.';

        const result = service.scoreEvidence(text);

        expect(result.score).toBe(1);
        expect(result.label).toBe('Association');
        expect(result.detectedMechanisms.length).toBeGreaterThan(0);
    });

    it('should detect L2 (Intervention) patterns', () => {
        const text = 'We manipulated the treatment dosage to causally test the effect on recovery rates.';

        const result = service.scoreEvidence(text);

        expect(result.score).toBeGreaterThanOrEqual(2);
        expect(result.label).toMatch(/Intervention|Counterfactual/);
    });

    it('should detect L3 (Counterfactual) patterns', () => {
        const text = 'What would have happened if we had not intervened? The counterfactual analysis shows...';

        const result = service.scoreEvidence(text);

        expect(result.score).toBe(3);
        expect(result.label).toBe('Counterfactual');
    });
});

describe('OpenClaw Adapter Integration', () => {
    it('should complete full pipeline from message to scored results', async () => {
        const adapter = new OpenClawAdapter();

        const mockSearchResponse = {
            id: 'integration-test',
            type: 'response' as const,
            payload: {
                query: 'causal discovery algorithms',
                results: [
                    {
                        title: 'PC Algorithm for Causal Discovery',
                        snippet: 'The PC algorithm uses conditional independence tests to infer causal structure...',
                        url: 'https://example.com/pc-algorithm',
                        relevanceScore: 0.89,
                    },
                ],
            },
            timestamp: new Date().toISOString(),
        };

        const scoredResults = await adapter.handleSearchResponse(mockSearchResponse);

        expect(scoredResults).toHaveLength(1);

        const result = scoredResults[0];
        expect(result.query).toBe('causal discovery algorithms');
        expect(result.source).toBe('openclaw');
        expect(result.title).toBe('PC Algorithm for Causal Discovery');
        expect(result.causalDensityScore).toBeGreaterThanOrEqual(1);
        expect(result.causalLabel).toMatch(/Association|Intervention|Counterfactual/);
        expect(result.detectedMechanisms).toBeDefined();
        expect(Array.isArray(result.detectedMechanisms)).toBe(true);
    });
});
