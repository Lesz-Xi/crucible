import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { SCMReportOrchestrator } from "@/lib/services/scm-report-orchestrator";
import { StreamingEventEmitter } from "@/lib/streaming-event-emitter";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 500;
const REPORT_RATE_LIMIT = new RateLimiter({
    maxRequests: 3,
    windowMs: 60_000,
    keyPrefix: "report-analyze:",
});
const inFlightAnalyses = new Map<string, number>();

function clampInteger(
    value: unknown,
    fallback: number,
    min: number,
    max: number
): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function buildRequestFingerprint(
    userId: string,
    query: string,
    options?: { k?: number | null; maxSourcesForExtraction?: number | null }
): string {
    return createHash("sha256")
        .update(
            JSON.stringify({
                userId,
                query: query.trim().toLowerCase(),
                k: options?.k ?? null,
                maxSourcesForExtraction: options?.maxSourcesForExtraction ?? null,
            })
        )
        .digest("hex");
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
            return new Response(JSON.stringify({ error: "Authentication required." }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const rateLimit = REPORT_RATE_LIMIT.isAllowed(user.id);
        if (!rateLimit.allowed) {
            return new Response(
                JSON.stringify({
                    error: "Too many report analysis requests. Please wait before retrying.",
                    resetInMs: rateLimit.resetIn,
                }),
                {
                    status: 429,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // 1. Validate request
        const body = await req.json();
        const { query, options } = body;

        if (!query || typeof query !== "string") {
            return new Response(JSON.stringify({ error: "Missing or invalid 'query' parameter." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (query.trim().length > MAX_QUERY_LENGTH) {
            return new Response(
                JSON.stringify({ error: `Query exceeds ${MAX_QUERY_LENGTH} characters.` }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const safeOptions = {
            ...options,
            k: clampInteger(options?.k, 6, 1, 8),
            maxSourcesForExtraction: clampInteger(
                options?.maxSourcesForExtraction,
                8,
                1,
                8
            ),
            timeoutMs: clampInteger(options?.timeoutMs, 55_000, 1_000, 55_000),
        };

        const requestFingerprint = buildRequestFingerprint(user.id, query, safeOptions);
        if (inFlightAnalyses.has(requestFingerprint)) {
            return new Response(
                JSON.stringify({
                    error: "An identical report analysis is already running for this user.",
                }),
                {
                    status: 409,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        inFlightAnalyses.set(requestFingerprint, Date.now());

        // 2. Setup Streaming Response
        const stream = new ReadableStream({
            async start(controller) {
                const streamEmitter = new StreamingEventEmitter(controller);

                try {
                    const orchestrator = new SCMReportOrchestrator();
                    const finalReport = await orchestrator.generateReport(
                        query.trim(),
                        safeOptions,
                        streamEmitter
                    );

                    streamEmitter.emit({
                        event: 'report_complete',
                        reportId: finalReport.meta.reportId,
                        report: finalReport,
                    } as any);
                } catch (error) {
                    console.error("[SCM Analyze Route] Error:", error);
                    const errMessage = error instanceof Error ? error.message : "Unknown error in SCM report pipeline.";
                    streamEmitter.emit({
                        event: 'report_pipeline_error',
                        stage: 0,
                        error: errMessage,
                        warningCode: 'VERIFIED_NOT_EVALUATED',
                    });
                } finally {
                    inFlightAnalyses.delete(requestFingerprint);
                    controller.close();
                }
            },
        });

        // 3. Return streaming response
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
            status: 200,
        });
    } catch (error) {
        console.error("[SCM Analyze POST] Top-level error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
