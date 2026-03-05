import { NextRequest } from "next/server";
import { SCMReportOrchestrator } from "@/lib/services/scm-report-orchestrator";
import { StreamingEventEmitter } from "@/lib/streaming-event-emitter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        // 1. Validate request
        const body = await req.json();
        const { query, options } = body;

        if (!query || typeof query !== "string") {
            return new Response(JSON.stringify({ error: "Missing or invalid 'query' parameter." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2. Setup Streaming Response
        const stream = new ReadableStream({
            async start(controller) {
                const streamEmitter = new StreamingEventEmitter(controller);

                try {
                    const orchestrator = new SCMReportOrchestrator();
                    const finalReport = await orchestrator.generateReport(query, options, streamEmitter);

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
