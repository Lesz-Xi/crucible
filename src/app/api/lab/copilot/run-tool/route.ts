// =============================================================
// POST /api/lab/copilot/run-tool
// Spec: Labs-CoPilot_specv2.md §FR-3, §6
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CopilotRunToolRequestSchema } from '@/lib/validations/lab-copilot';
import { labCopilotRunTool, CopilotServiceError } from '@/lib/services/lab-copilot-service';

export async function POST(request: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
        return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required', retryable: false } },
            { status: 401 }
        );
    }

    // ── Parse + Validate Body ─────────────────────────────────
    const rawBody = await request.json().catch(() => null);
    const parsed = CopilotRunToolRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: `Invalid request: ${parsed.error.message}`,
                    retryable: false,
                },
            },
            { status: 400 }
        );
    }

    const { tool, params, sourceMessageId } = parsed.data;

    // ── Execute Tool ──────────────────────────────────────────
    let toolResult: Awaited<ReturnType<typeof labCopilotRunTool>>;
    try {
        toolResult = await labCopilotRunTool({ tool, params });
    } catch (err) {
        if (err instanceof CopilotServiceError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: err.code,
                        message: err.message,
                        retryable: err.retryable,
                    },
                },
                { status: 422 }
            );
        }
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'TOOL_EXECUTION_ERROR',
                    message: 'Tool execution failed. Please try again.',
                    retryable: true,
                },
            },
            { status: 500 }
        );
    }

    // ── Persist Tool Execution ────────────────────────────────
    // Graceful degradation: persistence failure does NOT block the response
    let persistedId: string | undefined;
    try {
        const { data: toolMsg } = await supabase
            .from('lab_copilot_messages')
            .insert({
                user_id: user.id,
                role: 'tool',
                content_json: {
                    tool,
                    params,
                    result: toolResult.result,
                    status: toolResult.status,
                    sourceMessageId,
                },
                model_provider: null,
                model_id: null,
            })
            .select('id')
            .single();

        persistedId = toolMsg?.id;
    } catch {
        console.warn('[lab/copilot/run-tool] Persistence failed (non-fatal)');
    }

    return NextResponse.json({
        success: true,
        jobId: toolResult.jobId ?? persistedId,
        status: toolResult.status,
        result: toolResult.result,
    });
}
