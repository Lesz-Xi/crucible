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

function snippetAt(text: string, index: number, radius = 90): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function extractExplicitNumericsFromMarkdown(markdown: string): ScientificNumericEvidenceItem[] {
    if (!markdown || typeof markdown !== "string") return [];

    const out: ScientificNumericEvidenceItem[] = [];
    const seen = new Set<string>();

    const wordMap: Record<string, number> = {
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
        seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
        thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
        eighteen: 18, nineteen: 19, twenty: 20,
    };

    const parseNumberToken = (token: string): number | null => {
        const normalized = token.toLowerCase().trim();
        if (/^\d+(?:\.\d+)?$/.test(normalized)) {
            const n = Number(normalized);
            return Number.isFinite(n) ? n : null;
        }
        if (Object.prototype.hasOwnProperty.call(wordMap, normalized)) {
            return wordMap[normalized];
        }
        return null;
    };

    const push = (value: number, snippet: string) => {
        if (!Number.isFinite(value)) return;
        const key = `${value.toFixed(6)}|${snippet.slice(0, 120)}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({
            value,
            source: "prose",
            contextSnippet: snippet,
        });
    };

    // Strong pattern: before→after duration improvements (e.g., three hours to fifteen minutes)
    const numberToken = "(?:\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)";
    const durationPattern = new RegExp(`\\b(${numberToken})\\s+(seconds?|minutes?|hours?|days?)\\s+(?:to|->|→)\\s+(${numberToken})\\s+(seconds?|minutes?|hours?|days?)\\b`, "gi");
    for (const match of markdown.matchAll(durationPattern)) {
        const idx = match.index || 0;
        const snippet = snippetAt(markdown, idx);
        const fromValue = parseNumberToken(String(match[1]));
        const toValue = parseNumberToken(String(match[3]));
        if (fromValue !== null) push(fromValue, snippet);
        if (toValue !== null) push(toValue, snippet);
    }

    // Strong pattern: scale quantifiers (e.g., billions of events)
    const scalePattern = new RegExp(`\\b(${numberToken})?\\s*(thousand|thousands|million|millions|billion|billions|trillion|trillions|petabyte|petabytes)\\s+(?:of\\s+)?(events?|records?|requests?|transactions?|data)?\\b`, "gi");
    const scaleMultiplier: Record<string, number> = {
        thousand: 1_000,
        thousands: 1_000,
        million: 1_000_000,
        millions: 1_000_000,
        billion: 1_000_000_000,
        billions: 1_000_000_000,
        trillion: 1_000_000_000_000,
        trillions: 1_000_000_000_000,
        petabyte: 1_000_000_000_000_000,
        petabytes: 1_000_000_000_000_000,
    };
    for (const match of markdown.matchAll(scalePattern)) {
        const idx = match.index || 0;
        const snippet = snippetAt(markdown, idx);
        const base = parseNumberToken(String(match[1] || "one")) ?? 1;
        const scale = String(match[2]).toLowerCase();
        const multiplier = scaleMultiplier[scale];
        if (multiplier) {
            push(base * multiplier, snippet);
        }
    }

    // Digit-form numerics
    for (const match of markdown.matchAll(/\d+(?:\.\d+)?/g)) {
        const raw = match[0];
        const value = Number(raw);
        const idx = match.index || 0;
        const end = idx + raw.length;
        const prev = idx > 0 ? markdown[idx - 1] : "";
        const next = end < markdown.length ? markdown[end] : "";
        const snippet = snippetAt(markdown, idx);

        // Skip alphanumeric entity tokens like M3, EC2, S3, v2 unless there is explicit metric-unit context.
        const embeddedAlphaNumeric = /[a-z]/i.test(prev) || /[a-z]/i.test(next);
        const metricUnitContext = /%|\bms\b|\bseconds?\b|\bminutes?\b|\bhours?\b|\brate\b|\bcount\b|\bn=\s*\d+|\baccuracy\b|\bprecision\b|\brecall\b|\bf1\b|\bauc\b|\blatency\b/i.test(snippet);
        if (embeddedAlphaNumeric && !metricUnitContext) {
            continue;
        }

        // Skip DOI decimal fragments like ".2.1521" tokenized as "2.1521".
        const looksDoiContext = /doi\.org|\bdoi\b/i.test(snippet);
        const isEmbeddedInDotChain = prev === "." || next === ".";
        if (looksDoiContext && isEmbeddedInDotChain) {
            continue;
        }

        push(value, snippet);
        if (out.length >= 140) break;
    }

    // Word-form numerics (single tokens)
    const wordPattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi;
    for (const match of markdown.matchAll(wordPattern)) {
        const word = String(match[0]).toLowerCase();
        const value = wordMap[word];
        if (typeof value !== "number") continue;
        const idx = match.index || 0;
        const snippet = snippetAt(markdown, idx);

        // Keep only likely quantitative contexts to avoid narrative noise.
        if (!/(hour|minute|second|day|week|month|year|team|areas?|references?|sections?|page|count|times?|reduced|increase|decrease|latency|accuracy|precision|recall|f1|auc|metric|events?|petabytes?)/i.test(snippet)) {
            continue;
        }

        push(value, snippet);
        if (out.length >= 180) break;
    }

    return out;
}

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

        const dataPointEvidence: ScientificNumericEvidenceItem[] = result.dataPoints
            .slice(0, 40)
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

        const markdownEvidence = extractExplicitNumericsFromMarkdown(result.markdown).slice(0, 120);

        const seenEvidence = new Set<string>();
        const numericEvidence: ScientificNumericEvidenceItem[] = [];
        for (const item of [...dataPointEvidence, ...markdownEvidence]) {
            if (typeof item.value !== "number" || !Number.isFinite(item.value)) continue;
            const key = `${item.value.toFixed(6)}|${(item.contextSnippet || "").slice(0, 100)}`;
            if (seenEvidence.has(key)) continue;
            seenEvidence.add(key);
            numericEvidence.push(item);
            if (numericEvidence.length >= 120) break;
        }

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
