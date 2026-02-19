// =============================================================
// POST /api/lab/copilot/chat
// Spec: Labs-CoPilot_specv2.md §6, §FR-2, §FR-4
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CopilotChatRequestSchema } from '@/lib/validations/lab-copilot';
import { buildLabContext } from '@/lib/services/lab-context-builder';
import { labCopilotChat, CopilotServiceError } from '@/lib/services/lab-copilot-service';

// Rate limiting: simple in-memory store (per-process)
// For production, use Redis or Upstash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    return true;
}

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

    // ── Rate Limit ────────────────────────────────────────────
    if (!checkRateLimit(user.id)) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please wait a moment before asking again.',
                    retryable: true,
                },
            },
            { status: 429 }
        );
    }

    // ── Parse + Validate Body ─────────────────────────────────
    const rawBody = await request.json().catch(() => null);
    const parsed = CopilotChatRequestSchema.safeParse(rawBody);

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

    const chatRequest = parsed.data;

    // ── Build Lab Context ─────────────────────────────────────
    // The client sends labContext; we use it directly (already validated by zod).
    // We also compute a context hash for provenance.
    const { contextString, contextHash } = buildLabContext({
        // Reconstruct minimal LabState from the request's labContext
        isOffline: false,
        isLoading: false,
        activeTool: null,
        activePanel: null,
        currentStructure: chatRequest.labContext.activeStructure
            ? {
                pdbId: chatRequest.labContext.activeStructure.id,
                content: '',
                metadata: chatRequest.labContext.activeStructure.metadata ?? {},
                loadedAt: new Date().toISOString(),
            }
            : null,
        experimentHistory: chatRequest.labContext.recentExperiments.map((exp) => ({
            id: exp.id,
            user_id: user.id,
            tool_name: exp.tool_name,
            causal_role: 'observation' as const,
            input_hash: '',
            input_json: {} as never,
            status: exp.status,
            created_at: new Date().toISOString(),
        })),
        isSidebarOpen: true,
        isNotebookExpanded: false,
        lastError: null,
        llmConfig: { provider: 'anthropic', model: 'claude-sonnet-4-5' },
        isModelSettingsOpen: false,
    });

    // ── LLM Call ──────────────────────────────────────────────
    let chatResult: Awaited<ReturnType<typeof labCopilotChat>>;
    try {
        chatResult = await labCopilotChat({
            request: chatRequest,
            contextString,
            contextHash,
            // BYOK: pass user's API key if available (from request header)
            apiKey: request.headers.get('x-anthropic-key') ?? undefined,
        });
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
                { status: err.code === 'PROVIDER_ERROR' ? 502 : 422 }
            );
        }
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred. Please try again.',
                    retryable: true,
                },
            },
            { status: 500 }
        );
    }

    // ── Persist to lab_copilot_messages ───────────────────────
    // Graceful degradation: persistence failure does NOT break the response
    let messageId: string | undefined;
    try {
        // Persist user message
        const { data: userMsg } = await supabase
            .from('lab_copilot_messages')
            .insert({
                user_id: user.id,
                role: 'user',
                content_json: {
                    prompt: chatRequest.prompt,
                    mode: chatRequest.mode,
                    learningLevel: chatRequest.learningLevel,
                },
                context_hash: contextHash,
                model_provider: chatResult.modelProvider,
                model_id: chatResult.modelId,
            })
            .select('id')
            .single();

        // Persist assistant message
        const { data: assistantMsg } = await supabase
            .from('lab_copilot_messages')
            .insert({
                user_id: user.id,
                role: 'assistant',
                content_json: chatResult.answer,
                context_hash: contextHash,
                model_provider: chatResult.modelProvider,
                model_id: chatResult.modelId,
            })
            .select('id')
            .single();

        messageId = assistantMsg?.id ?? userMsg?.id;
    } catch {
        // Persistence failure is non-fatal — log but continue
        console.warn('[lab/copilot/chat] Persistence failed (non-fatal)');
    }

    return NextResponse.json({
        success: true,
        answer: chatResult.answer,
        messageId,
    });
}
