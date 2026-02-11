/**
 * OpenClaw Adapter Service
 * 
 * Transforms OpenClaw WebSocket messages into SCM-compatible Evidence objects.
 * 
 * Architecture:
 * - Listens to OpenClawBridgeService 'response' events
 * - Parses search result payloads
 * - Scores each result using CausalIntegrityService
 * - Persists to database via Supabase client
 * 
 * Separation of Concerns:
 * - OpenClawBridgeService: Pure WebSocket handler (no SCM knowledge)
 * - OpenClawAdapter: Translation layer (OpenClaw → SCM)
 * - CausalIntegrityService: Pure causal scoring (no OpenClaw knowledge)
 */

import { createClient } from '@/lib/supabase/client';
import { CausalIntegrityService } from '@/lib/ai/causal-integrity-service';
import type { OpenClawMessage, OpenClawSearchResult } from './openclaw-bridge';

export interface ScoredSearchResult {
    query: string;
    source: string;
    title: string;
    snippet: string;
    url: string;
    relevanceScore?: number;
    causalDensityScore: 1 | 2 | 3;
    causalLabel: 'Association' | 'Intervention' | 'Counterfactual';
    confidence: number;
    detectedMechanisms: string[];
    evidenceDetails?: Record<string, unknown>;
}

export interface SearchResultRecord {
    id: string;
    user_id: string;
    query: string;
    source: string;
    title: string;
    snippet: string;
    url: string;
    relevance_score?: number;
    causal_density_score: 1 | 2 | 3;
    causal_label: 'Association' | 'Intervention' | 'Counterfactual';
    confidence: number;
    detected_mechanisms: string[];
    evidence_details?: Record<string, unknown>;
    created_at: string;
    metadata: Record<string, unknown>;
}

export class OpenClawAdapter {
    private causalService: CausalIntegrityService;
    private supabase: ReturnType<typeof createClient>;

    constructor() {
        this.causalService = new CausalIntegrityService();
        this.supabase = createClient();
    }

    /**
     * Handle OpenClaw search response message
     * Parses results and scores each one for causal density
     */
    async handleSearchResponse(message: OpenClawMessage): Promise<ScoredSearchResult[]> {
        if (message.type !== 'response') {
            console.warn('[OpenClawAdapter] Ignoring non-response message:', message.type);
            return [];
        }

        const payload = message.payload as any;

        // Extract search results from payload
        const searchData = payload.results as OpenClawSearchResult;
        if (!searchData || !searchData.results || searchData.results.length === 0) {
            console.log('[OpenClawAdapter] No results in response');
            return [];
        }

        console.log(`[OpenClawAdapter] Processing ${searchData.results.length} search results for query: "${searchData.query}"`);

        // Score and transform each result
        const scoredResults: ScoredSearchResult[] = [];
        for (const result of searchData.results) {
            const scored = await this.scoreResult(searchData.query, result);
            scoredResults.push(scored);
        }

        return scoredResults;
    }

    /**
     * Score a single search result using CausalIntegrityService
     */
    private async scoreResult(
        query: string,
        result: { title: string; snippet: string; url: string; relevanceScore?: number }
    ): Promise<ScoredSearchResult> {
        // Combine title and snippet for causal density analysis
        const evidenceText = `${result.title}\n\n${result.snippet}`;

        // Score using CausalIntegrityService
        const densityResult = this.causalService.evaluate(evidenceText);

        return {
            query,
            source: 'openclaw',
            title: result.title,
            snippet: result.snippet,
            url: result.url,
            relevanceScore: result.relevanceScore,
            causalDensityScore: densityResult.score,
            causalLabel: densityResult.label,
            confidence: densityResult.confidence,
            detectedMechanisms: densityResult.detectedMechanisms,
            evidenceDetails: densityResult.evidence,
        };
    }

    /**
     * Persist scored results to database
     * Returns array of created records
     */
    async persistResults(results: ScoredSearchResult[]): Promise<SearchResultRecord[]> {
        if (results.length === 0) {
            return [];
        }

        const { data: { user }, error: userError } = await this.supabase.auth.getUser();
        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Transform to database format
        const records = results.map(result => ({
            user_id: user.id,
            query: result.query,
            source: result.source,
            title: result.title,
            snippet: result.snippet,
            url: result.url,
            relevance_score: result.relevanceScore,
            causal_density_score: result.causalDensityScore,
            causal_label: result.causalLabel,
            confidence: result.confidence,
            detected_mechanisms: result.detectedMechanisms,
            evidence_details: result.evidenceDetails || {},
            metadata: {},
        }));

        // Batch insert
        const { data, error } = await this.supabase
            .from('search_results')
            .insert(records)
            .select();

        if (error) {
            console.error('[OpenClawAdapter] Error persisting results:', error);
            throw new Error(`Failed to persist search results: ${error.message}`);
        }

        console.log(`[OpenClawAdapter] Persisted ${data.length} search results to database`);
        return data as SearchResultRecord[];
    }

    /**
     * Fetch recent search results for a query
     */
    async getSearchHistory(query?: string, limit: number = 50): Promise<SearchResultRecord[]> {
        let queryBuilder = this.supabase
            .from('search_results')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (query) {
            queryBuilder = queryBuilder.eq('query', query);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            console.error('[OpenClawAdapter] Error fetching search history:', error);
            throw new Error(`Failed to fetch search history: ${error.message}`);
        }

        return (data as SearchResultRecord[]) || [];
    }

    /**
     * Get results grouped by causal density level
     */
    async getResultsByDensity(
        densityLevel: 1 | 2 | 3,
        limit: number = 20
    ): Promise<SearchResultRecord[]> {
        const { data, error } = await this.supabase
            .from('search_results')
            .select('*')
            .eq('causal_density_score', densityLevel)
            .order('confidence', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[OpenClawAdapter] Error fetching results by density:', error);
            throw new Error(`Failed to fetch results: ${error.message}`);
        }

        return (data as SearchResultRecord[]) || [];
    }
}
