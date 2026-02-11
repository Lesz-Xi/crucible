/**
 * POST /api/openclaw/search
 * 
 * Triggers an OpenClaw search and returns scored results
 * 
 * Flow:
 * 1. Validate auth and query
 * 2. Send search command to OpenClaw via bridge
 * 3. Wait for response with timeout
 * 4. Score results via adapter
 * 5. Persist to database
 * 6. Return scored results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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
            resultsCount: scoredResults.length,
            results: scoredResults,
            persistedCount: persistedRecords.length,
            timestamp: new Date().toISOString(),
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
