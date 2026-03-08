/**
 * POST /api/openclaw/search
 *
 * Triggers an OpenClaw search and returns scored results.
 *
 * Flow:
 * 1. Validate auth and query
 * 2. Sentinel: inspect input (injection, PII)
 * 3. Send search command to OpenClaw via bridge
 * 4. Wait for response with timeout
 * 5. Score results via adapter
 * 6. Sentinel: inspect output (leakage, causal grounding)
 * 7. Persist to database
 * 8. Return scored results with sentinel metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    InferenceSentinelService,
    DEFAULT_POLICY,
    type SentinelContext,
} from '@/lib/services/inference-sentinel';

export const runtime = 'nodejs';

const sentinel = new InferenceSentinelService();

interface SearchRequestBody {
    query: string;
    numResults?: number;
}

export async function POST(req: NextRequest) {
    try {
        // Validate authentication
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json() as SearchRequestBody;
        const { query, numResults = 10 } = body;

        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Query is required' },
                { status: 400 }
            );
        }

        console.log(`[OpenClaw Search API] User ${user.id} searching for: "${query}"`);

        // ── Sentinel: input gate ──────────────────────────────────────────────
        const sentinelCtx: SentinelContext = {
            user_id: user.id,
            source:  'openclaw',
        };
        const inputDecision = await sentinel.inspectInput(query, sentinelCtx, DEFAULT_POLICY);

        if (inputDecision.verdict === 'block') {
            console.warn(`[OpenClaw Search API] Sentinel blocked input (trace=${inputDecision.trace_id}): ${inputDecision.blocked_reason}`);
            return NextResponse.json(
                {
                    success: false,
                    error:   'Request blocked by security policy',
                    reason:  inputDecision.blocked_reason,
                    sentinel: { trace_id: inputDecision.trace_id, verdict: inputDecision.verdict },
                },
                { status: 422 }
            );
        }

        // Import services dynamically (server-side only)
        const { OpenClawBridgeService } = await import('@/lib/services/openclaw-bridge');
        const { OpenClawAdapter } = await import('@/lib/services/openclaw-adapter');

        const bridge = OpenClawBridgeService.getInstance();
        const adapter = new OpenClawAdapter();

        // Ensure bridge is connected
        try {
            await bridge.connect();
        } catch (err) {
            console.error('[OpenClaw Search API] Bridge connection failed:', err);
            return NextResponse.json(
                { success: false, error: 'OpenClaw Gateway unavailable' },
                { status: 503 }
            );
        }

        // Create promise to wait for search response
        const responsePromise = new Promise<any>((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Search timeout'));
                }
            }, 30000); // 30 second timeout

            const responseHandler = (message: any) => {
                // Check if this response is for our query
                const payload = message.payload as any;
                if (payload?.query === query && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve(message);
                }
            };

            bridge.on('response', responseHandler);
        });

        // Send search command
        await bridge.sendCommand('search', {
            query,
            numResults,
        });

        // Wait for response
        const responseMessage = await responsePromise;

        // Score and transform results
        const scoredResults = await adapter.handleSearchResponse(responseMessage);

        // ── Sentinel: output gate ─────────────────────────────────────────────
        // Inspect the raw response payload (not the scored results) for leakage.
        const rawResponseText = JSON.stringify(responseMessage.payload ?? {});
        const outputDecision = await sentinel.inspectOutput(
            rawResponseText,
            inputDecision,
            sentinelCtx,
            DEFAULT_POLICY
        );

        if (outputDecision.verdict === 'block') {
            console.error(`[OpenClaw Search API] Sentinel blocked output (trace=${outputDecision.trace_id}): ${outputDecision.blocked_reason}`);
            return NextResponse.json(
                {
                    success: false,
                    error:   'Response withheld by security policy',
                    reason:  outputDecision.blocked_reason,
                    sentinel: { trace_id: outputDecision.trace_id, verdict: outputDecision.verdict },
                },
                { status: 502 }
            );
        }

        // Persist to database
        let persistedRecords = [];
        if (scoredResults.length > 0) {
            try {
                persistedRecords = await adapter.persistResults(scoredResults);
            } catch (persistError) {
                console.error('[OpenClaw Search API] Persistence failed:', persistError);
                // Continue even if persistence fails - return results anyway
            }
        }

        return NextResponse.json({
            success: true,
            query,
            resultsCount:   scoredResults.length,
            results:        scoredResults,
            persistedCount: persistedRecords.length,
            timestamp:      new Date().toISOString(),
            sentinel: {
                input:  { trace_id: inputDecision.trace_id,  verdict: inputDecision.verdict,  warnings: inputDecision.warnings  },
                output: { trace_id: outputDecision.trace_id, verdict: outputDecision.verdict, warnings: outputDecision.warnings },
            },
        });

    } catch (error: any) {
        console.error('[OpenClaw Search API] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Search failed',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/openclaw/search
 * 
 * Retrieve search history for the authenticated user
 */
export async function GET(req: NextRequest) {
    try {
        // Validate authentication
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const limit = parseInt(searchParams.get('limit') || '50');
        const densityLevel = searchParams.get('density') as '1' | '2' | '3' | null;

        // Import adapter
        const { OpenClawAdapter } = await import('@/lib/services/openclaw-adapter');
        const adapter = new OpenClawAdapter();

        let results;
        if (densityLevel) {
            results = await adapter.getResultsByDensity(
                parseInt(densityLevel) as 1 | 2 | 3,
                limit
            );
        } else if (query) {
            results = await adapter.getSearchHistory(query, limit);
        } else {
            results = await adapter.getSearchHistory(undefined, limit);
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[OpenClaw Search API] History retrieval error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to retrieve search history',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
