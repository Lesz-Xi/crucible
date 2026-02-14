// =============================================================
// Phase E: Scientific Analysis Service (Contract §1–§5)
// Shared cross-cutting service boundary for Automated Scientist
// Features: hybrid (now), chat/epistemic (Option C ready)
// =============================================================

import { runIngestionPipeline, type PipelineResult } from "../pipeline/ingestion-pipeline";
import type { ReasoningGraph } from "../compute/graph-reasoning-engine";

// ── Contract §1: Interfaces ─────────────────────────────────

export interface ScientificAnalysisRequest {
    userId: string;
    pdfBuffer: ArrayBuffer;
    fileName: string;
    context?: {
        feature: "hybrid" | "chat" | "epistemic";
        sessionId?: string;
    };
    options?: {
        minTableConfidence?: number;
        runAnalysis?: boolean;
        skipMarkdown?: boolean;
        /** Per-file timeout in ms (default: 30_000) */
        timeoutMs?: number;
    };
}

export interface ScientificAnalysisSummary {
    tableCount: number;
    trustedTableCount: number;
    dataPointCount: number;
}

export interface ScientificNumericEvidenceItem {
    value: number;
    variableXName?: string;
    variableYName?: string;
    source: "table" | "prose" | "unknown";
    contextSnippet?: string;
}

export interface ScientificAnalysisResponse {
    ingestionId: string;
    status: "completed" | "partial" | "failed";
    summary: ScientificAnalysisSummary;
    computeRunId?: string;
    reasoningGraph?: ReasoningGraph;
    warnings: string[];
    numericEvidence: ScientificNumericEvidenceItem[];
    /** Contract §5: provenance reference for downstream consumers */
    provenance?: ProvenanceReference;
    /** Contract §E: observability metadata */
    observability: {
        fileName: string;
        durationMs: number;
        status: "completed" | "partial" | "failed";
        warningsCount: number;
    };
}

// ── Contract §5: Provenance Reference ────────────────────────

export interface ProvenanceReference {
    ingestionId: string;
    sourceTableIds: string[];
    dataPointIds: string[];
    computeRunId?: string;
    methodVersion: string;
}

// ── Contract §3: Transport Envelope ──────────────────────────

export interface ScientificAnalysisEnvelope {
    scientificAnalysis: ScientificAnalysisResponse[];
    featureContext: "hybrid" | "chat" | "epistemic";
    requestSummary: {
        pdfCount: number;
        completedCount: number;
        partialCount: number;
        failedCount: number;
    };
}

// ── Service Interface ────────────────────────────────────────

export interface ScientificAnalysisService {
    run(request: ScientificAnalysisRequest): Promise<ScientificAnalysisResponse>;
    runBatch(
        requests: ScientificAnalysisRequest[],
        concurrencyLimit?: number,
    ): Promise<ScientificAnalysisEnvelope>;
}

// ── Timeout Helper ───────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)),
            ms,
        );
        promise
            .then((result) => { clearTimeout(timer); resolve(result); })
            .catch((err) => { clearTimeout(timer); reject(err); });
    });
}

// ── Default Implementation ───────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30_000;
const METHOD_VERSION = "1.0.0";

export class DefaultScientificAnalysisService implements ScientificAnalysisService {
    /**
     * Contract §1: Run analysis for a single PDF.
     * Contract §B: Failures → status: 'failed' + actionable warning.
     * Contract §E: Structured observability log per file.
     */
    async run(request: ScientificAnalysisRequest): Promise<ScientificAnalysisResponse> {
        const startTime = performance.now();
        const timeoutMs = request.options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

        try {
            const result: PipelineResult = await withTimeout(
                runIngestionPipeline(
                    request.pdfBuffer,
                    request.fileName,
                    request.userId,
                    {
                        minTableConfidence: request.options?.minTableConfidence,
                        runAnalysis: request.options?.runAnalysis,
                        skipMarkdown: request.options?.skipMarkdown,
                    },
                ),
                timeoutMs,
                request.fileName,
            );

            return this.mapSuccess(result, request.fileName, startTime);
        } catch (err) {
            return this.mapFailure(err, request.fileName, startTime);
        }
    }

    /**
     * Contract §C: Batch with concurrency cap.
     * Contract §3: Returns transport envelope for feature route.
     * Contract §E: Request-level summary log.
     */
    async runBatch(
        requests: ScientificAnalysisRequest[],
        concurrencyLimit = 2,
    ): Promise<ScientificAnalysisEnvelope> {
        const results: ScientificAnalysisResponse[] = [];
        const featureContext = requests[0]?.context?.feature ?? "hybrid";

        // Process in chunks of concurrencyLimit
        for (let i = 0; i < requests.length; i += concurrencyLimit) {
            const chunk = requests.slice(i, i + concurrencyLimit);
            const chunkResults = await Promise.all(chunk.map((req) => this.run(req)));
            results.push(...chunkResults);
        }

        const completedCount = results.filter((r) => r.status === "completed").length;
        const partialCount = results.filter((r) => r.status === "partial").length;
        const failedCount = results.filter((r) => r.status === "failed").length;

        // Contract §E: Request-level summary log
        console.log(
            `[ScientificAnalysis] Batch complete: pdfCount=${requests.length} completed=${completedCount} partial=${partialCount} failed=${failedCount}`,
        );

        return {
            scientificAnalysis: results,
            featureContext,
            requestSummary: {
                pdfCount: requests.length,
                completedCount,
                partialCount,
                failedCount,
            },
        };
    }

    // ── Private Mappers ──────────────────────────────────────

    private mapSuccess(
        result: PipelineResult,
        fileName: string,
        startTime: number,
    ): ScientificAnalysisResponse {
        const durationMs = Math.round(performance.now() - startTime);
        const trustedCount = result.tables.trusted.length;
        const flaggedCount = result.tables.flagged.length;
        const dataPointCount = result.dataPoints.length;

        // Determine status: completed if analysis ran, partial if skipped
        const hasAnalysis = result.computeRun !== null;
        const status: ScientificAnalysisResponse["status"] =
            hasAnalysis ? "completed" : dataPointCount > 0 ? "partial" : "completed";

        // Contract §5: Build provenance reference
        const provenance: ProvenanceReference = {
            ingestionId: result.ingestion.id,
            sourceTableIds: result.tables.trusted.map((t) => t.id),
            dataPointIds: result.dataPoints.map((dp) => dp.id),
            computeRunId: result.computeRun?.id,
            methodVersion: METHOD_VERSION,
        };

        // Contract §E: Structured log per file
        console.log(
            `[ScientificAnalysis] file=${fileName} status=${status} durationMs=${durationMs} warnings=${result.warnings.length}`,
        );

        const numericEvidence: ScientificNumericEvidenceItem[] = result.dataPoints
            .slice(0, 15)
            .map((dp) => ({
                value: dp.yValue,
                variableXName: dp.variableXName,
                variableYName: dp.variableYName,
                source:
                    dp.metadata?.source === "prose_numeric_extraction"
                        ? "prose"
                        : dp.sourceTableId
                            ? "table"
                            : "unknown",
                contextSnippet:
                    typeof dp.metadata?.contextSnippet === "string"
                        ? dp.metadata.contextSnippet
                        : undefined,
            }));

        return {
            ingestionId: result.ingestion.id,
            status,
            summary: {
                tableCount: trustedCount + flaggedCount,
                trustedTableCount: trustedCount,
                dataPointCount,
            },
            computeRunId: result.computeRun?.id,
            reasoningGraph: result.reasoningGraph,
            warnings: result.warnings,
            numericEvidence,
            provenance,
            observability: {
                fileName,
                durationMs,
                status,
                warningsCount: result.warnings.length,
            },
        };
    }

    private mapFailure(
        err: unknown,
        fileName: string,
        startTime: number,
    ): ScientificAnalysisResponse {
        const durationMs = Math.round(performance.now() - startTime);
        const message = err instanceof Error ? err.message : String(err);

        // Contract §B: Actionable warning
        const warning = `Scientific analysis failed for "${fileName}": ${message}`;
        console.warn(`[ScientificAnalysis] ${warning} durationMs=${durationMs}`);

        return {
            ingestionId: "",
            status: "failed",
            summary: { tableCount: 0, trustedTableCount: 0, dataPointCount: 0 },
            warnings: [warning],
            numericEvidence: [],
            observability: {
                fileName,
                durationMs,
                status: "failed",
                warningsCount: 1,
            },
        };
    }
}
