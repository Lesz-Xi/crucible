// =============================================================
// Automated Scientist: Ingestion Pipeline Orchestrator
// Ties Phases A–D together into a single closed-loop pipeline:
//   PDF → Extract → Compute → Reason → Persist
// =============================================================

import { ScientificDataRepository } from "../db/scientific-data-repository";
import { extractTablesFromPDF, filterTrustedTables } from "../extractors/table-extractor";
import { extractMetadataFromPDF } from "../extractors/metadata-extractor";
import { convertPDFToMarkdown } from "../extractors/pdf-to-markdown";
import { runFullAnalysis } from "../compute/scientific-compute-engine";
import { buildReasoningGraph, type ReasoningGraph } from "../compute/graph-reasoning-engine";
import type {
    DocumentIngestion,
    ExtractedTable,
    ScientificDataPoint,
    ComputeRun,
    CreateDataPointInput,
    DocumentMetadata,
} from "../../types/scientific-data";
import type { RawTableResult } from "../extractors/table-extractor";

// ── Types ────────────────────────────────────────────────────

export interface PipelineResult {
    ingestion: DocumentIngestion;
    metadata: DocumentMetadata;
    markdown: string;
    tables: {
        trusted: ExtractedTable[];
        flagged: ExtractedTable[];
    };
    dataPoints: ScientificDataPoint[];
    computeRun: ComputeRun | null;
    reasoningGraph: ReasoningGraph;
    warnings: string[];
}

export interface PipelineOptions {
    /** Minimum confidence for table trust gating (default: 0.6) */
    minTableConfidence?: number;
    /** Whether to run compute + reasoning on extracted data (default: true) */
    runAnalysis?: boolean;
    /** Skip markdown conversion to save time (default: false) */
    skipMarkdown?: boolean;
}

interface ProseNumericHit {
    value: number;
    contextSnippet: string;
}

interface ProseNumericLanes {
    strong: ProseNumericHit[];
    weak: ProseNumericHit[];
}

const BIBLIOGRAPHIC_CONTEXT_PATTERN = /(journal|doi|issn|volume|issue|pages?|copyright|license|received|revised|accepted|publication history|creativecommons|author\(s\)|corresponding author)/i;
const METRIC_CONTEXT_PATTERN = /(accuracy|precision|recall|f1|auc|latency|ms|seconds?|error|loss|rmse|mae|mape|improv(e|ed|ement)|reduc(e|ed|tion)|increas(e|ed)|baseline|compared|outperform|performance)/i;
const SECTION_ORDINAL_CONTEXT_PATTERN = /(section|introduction|background|methodology|methods|results|discussion|conclusion|chapter|part\s+\d+)/i;
const CITATION_CONTEXT_PATTERN = /(references?|\[\d+\]|\(\d{4}\)|et\s+al\.|available\s+at|ssrn|researchgate|vol\.|no\.|pp\.|international journal|conference|proceedings)/i;

function getContextSnippet(text: string, index: number, radius = 80): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function scoreContextSnippet(snippet: string): number {
    let score = 0;
    if (METRIC_CONTEXT_PATTERN.test(snippet)) score += 4;
    if (/%|\bms\b|\bsec\b|\bseconds\b/i.test(snippet)) score += 1;
    if (BIBLIOGRAPHIC_CONTEXT_PATTERN.test(snippet)) score -= 5;
    return score;
}

function parseProseNumericSeries(markdown: string): ProseNumericLanes {
    if (!markdown || typeof markdown !== "string") return { strong: [], weak: [] };

    const candidates: ProseNumericHit[] = [];

    // Range patterns: 84-92, 84–92, 84 to 92
    for (const match of markdown.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)/gi)) {
        const a = Number(match[1]);
        const b = Number(match[2]);
        const idx = match.index || 0;
        const snippet = getContextSnippet(markdown, idx);
        if (Number.isFinite(a)) candidates.push({ value: a, contextSnippet: snippet });
        if (Number.isFinite(b)) candidates.push({ value: b, contextSnippet: snippet });
        if (Number.isFinite(a) && Number.isFinite(b)) candidates.push({ value: (a + b) / 2, contextSnippet: snippet });
    }

    // Slash metrics: 0.82/0.76, F1/AUC-like pairs
    for (const match of markdown.matchAll(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/g)) {
        const a = Number(match[1]);
        const b = Number(match[2]);
        const idx = match.index || 0;
        const snippet = getContextSnippet(markdown, idx);
        if (Number.isFinite(a)) candidates.push({ value: a, contextSnippet: snippet });
        if (Number.isFinite(b)) candidates.push({ value: b, contextSnippet: snippet });
    }

    // Number + optional decimal + optional percent/unit prefix/suffix
    for (const match of markdown.matchAll(/(?:(?:p|r|f1|auc|accuracy|precision|recall|latency|loss|rmse|mae|mape)\s*[:=]?\s*)?(-?\d+(?:\.\d+)?)(\s*%?)/gi)) {
        const raw = Number(match[1]);
        if (!Number.isFinite(raw)) continue;
        const idx = match.index || 0;
        candidates.push({ value: raw, contextSnippet: getContextSnippet(markdown, idx) });
    }

    const filtered: ProseNumericHit[] = [];
    const seen = new Set<string>();

    for (const hit of candidates) {
        const raw = hit.value;
        const snippet = hit.contextSnippet;
        const isLikelyYear = raw >= 1900 && raw <= 2100;
        const isLikelyNoise = Math.abs(raw) > 1_000_000;

        const isSmallOrdinal = Number.isInteger(raw) && raw >= 1 && raw <= 12;
        const hasMetricUnitNearby = /%|\bms\b|\bsec\b|\bseconds\b|\bx\b|±/i.test(snippet);
        const hasMetricTermNearby = METRIC_CONTEXT_PATTERN.test(snippet);
        const isSectionLike = SECTION_ORDINAL_CONTEXT_PATTERN.test(snippet);
        const isCitationLike = CITATION_CONTEXT_PATTERN.test(snippet);

        const isBrokenFragment = snippet.length < 24 || /^["'\-\s\d\.\[\]\(\)]+$/.test(snippet);

        if (isLikelyYear || isLikelyNoise) continue;
        if (isBrokenFragment) continue;
        if (isCitationLike && !hasMetricTermNearby && !hasMetricUnitNearby) continue;
        if (isSectionLike && !hasMetricTermNearby) continue;
        if (isSmallOrdinal && !hasMetricUnitNearby && !hasMetricTermNearby) continue;

        const roundedKey = raw.toFixed(4);
        if (seen.has(roundedKey)) continue;
        seen.add(roundedKey);

        filtered.push(hit);
        if (filtered.length >= 120) break;
    }

    // Rank by context quality: prioritize performance/result metrics, suppress bibliographic numerics.
    const ranked = filtered
        .map((hit) => ({ hit, score: scoreContextSnippet(hit.contextSnippet) }))
        .sort((a, b) => b.score - a.score);

    const strong = ranked.filter((item) => item.score > 0).map((item) => item.hit).slice(0, 80);
    const weak = ranked
        .filter(
            (item) =>
                item.score <= 0 &&
                !BIBLIOGRAPHIC_CONTEXT_PATTERN.test(item.hit.contextSnippet) &&
                !CITATION_CONTEXT_PATTERN.test(item.hit.contextSnippet),
        )
        .map((item) => item.hit)
        .slice(0, 40);

    return { strong, weak };
}

function buildProseDataPoints(
    ingestionId: string,
    markdown: string
): { points: CreateDataPointInput[]; lane: "strong" | "weak" | "none" } {
    const lanes = parseProseNumericSeries(markdown);

    const selected = lanes.strong.length >= 2
        ? { lane: "strong" as const, hits: lanes.strong }
        : lanes.weak.length >= 2
            ? { lane: "weak" as const, hits: lanes.weak }
            : { lane: "none" as const, hits: [] as ProseNumericHit[] };

    if (selected.lane === "none") {
        return { points: [], lane: "none" };
    }

    return {
        lane: selected.lane,
        points: selected.hits.map((hit, index) => ({
            ingestionId,
            variableXName: "prose_index",
            variableYName: selected.lane === "strong" ? "prose_metric" : "prose_metric_weak",
            xValue: index + 1,
            yValue: hit.value,
            metadata: {
                source: "prose_numeric_extraction",
                extractionVersion: "2.2.0",
                extractionLane: selected.lane,
                contextSnippet: hit.contextSnippet,
            },
        })),
    };
}

// ── Hash Helper ──────────────────────────────────────────────

async function sha256(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cloneArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
    return buffer.slice(0);
}

// ── Pipeline ─────────────────────────────────────────────────

/**
 * Run the full Automated Scientist pipeline on a PDF buffer.
 *
 * Steps:
 * 1. Hash PDF for idempotent ingestion
 * 2. Create ingestion record (or return existing)
 * 3. Extract metadata (Pass 1: dict, Pass 2: regex)
 * 4. Extract tables (with confidence scoring)
 * 5. Convert to Markdown (best-effort)
 * 6. Parse numeric data points from trusted tables
 * 7. Run deterministic regression/trend/anomaly analysis
 * 8. Build reasoning graph with provenance
 * 9. Persist all results
 */
export async function runIngestionPipeline(
    buffer: ArrayBuffer,
    fileName: string,
    userId: string,
    options: PipelineOptions = {}
): Promise<PipelineResult> {
    const {
        minTableConfidence = 0.6,
        runAnalysis = true,
        skipMarkdown = false,
    } = options;

    const repo = new ScientificDataRepository();
    const warnings: string[] = [];

    // ── Step 1: Hash for idempotency ──
    const fileHash = await sha256(buffer);

    // ── Step 2: Create ingestion record ──
    const ingestion = await repo.createIngestion(
        {
            fileName,
            fileHashSha256: fileHash,
            fileSizeBytes: buffer.byteLength,
        },
        userId
    );

    if (!ingestion) {
        throw new Error("Failed to create ingestion record.");
    }

    // If already completed, reprocess to avoid stale/empty cached artifacts from prior parser failures.
    if (ingestion.status === "completed") {
        warnings.push("Ingestion already completed; reprocessing with latest extractor pipeline.");
    }

    // Mark as processing
    await repo.updateIngestionStatus(ingestion.id, "processing");

    try {
        // ── Step 3: Extract metadata ──
        const metadata = await extractMetadataFromPDF(cloneArrayBuffer(buffer));

        // ── Step 4: Extract tables ──
        const rawTables: RawTableResult[] = await extractTablesFromPDF(cloneArrayBuffer(buffer));
        const { trusted: trustedRaw, flagged: flaggedRaw } = filterTrustedTables(
            rawTables,
            minTableConfidence
        );

        if (flaggedRaw.length > 0) {
            warnings.push(
                `${flaggedRaw.length} table(s) below confidence threshold (${minTableConfidence}); flagged for human review.`
            );
        }

        // Persist tables
        const trustedTables = await repo.saveExtractedTables(
            trustedRaw.map((t) => ({
                ingestionId: ingestion.id,
                pageNumber: t.pageNumber,
                tableIndex: t.tableIndex,
                headers: t.headers,
                rows: t.rows,
                confidence: t.confidence,
                parseStatus: t.parseStatus,
                qaFlags: t.qaFlags,
            }))
        );

        const flaggedTables = await repo.saveExtractedTables(
            flaggedRaw.map((t) => ({
                ingestionId: ingestion.id,
                pageNumber: t.pageNumber,
                tableIndex: t.tableIndex,
                headers: t.headers,
                rows: t.rows,
                confidence: t.confidence,
                parseStatus: t.parseStatus,
                qaFlags: t.qaFlags,
            }))
        );

        // ── Step 5: Markdown conversion ──
        let markdown = "";
        if (!skipMarkdown) {
            markdown = await convertPDFToMarkdown(cloneArrayBuffer(buffer));
        }

        // ── Step 6: Parse numeric data points from trusted tables ──
        const dataPointInputs: CreateDataPointInput[] = [];

        for (const table of trustedTables) {
            // Attempt to parse numeric columns
            if (table.headers.length < 2) continue;

            const xHeader = table.headers[0];
            const yHeader = table.headers[1];

            for (const row of table.rows) {
                const xVal = parseFloat(row[0]);
                const yVal = parseFloat(row[1]);

                if (!isNaN(xVal) && !isNaN(yVal)) {
                    dataPointInputs.push({
                        ingestionId: ingestion.id,
                        sourceTableId: table.id,
                        variableXName: xHeader,
                        variableYName: yHeader,
                        xValue: xVal,
                        yValue: yVal,
                    });
                }
            }
        }

        if (dataPointInputs.length < 2 && markdown.trim().length > 0) {
            const proseResult = buildProseDataPoints(ingestion.id, markdown);
            if (proseResult.points.length >= 2) {
                dataPointInputs.push(...proseResult.points);
                warnings.push(
                    `Table-derived numeric points were insufficient; used prose numeric extraction fallback (${proseResult.points.length} points, lane=${proseResult.lane}).`,
                );
            }
        }

        const dataPoints = await repo.saveDataPoints(dataPointInputs);

        // ── Step 7–8: Compute + Reasoning ──
        let computeRun: ComputeRun | null = null;
        let reasoningGraph: ReasoningGraph = {
            nodes: [],
            edges: [],
            claims: [],
            summary: "No analysis performed.",
        };

        if (runAnalysis && dataPoints.length >= 2) {
            const analysis = await runFullAnalysis(dataPoints);

            // Check cache
            const cached = await repo.findComputeRunByHash(
                analysis.deterministicHash
            );

            if (cached) {
                computeRun = cached;
                warnings.push("Compute run cache hit; using existing results.");
            } else {
                computeRun = await repo.saveComputeRun(
                    {
                        ingestionId: ingestion.id,
                        method: "full_analysis",
                        methodVersion: "1.0.0",
                        params: { minTableConfidence },
                        result: {
                            regression: analysis.regression,
                            trend: analysis.trend,
                            anomalies: analysis.anomalies,
                        },
                        deterministicHash: analysis.deterministicHash,
                    },
                    userId
                );
            }

            // Build reasoning graph
            reasoningGraph = buildReasoningGraph(dataPoints);
        } else if (dataPoints.length < 2) {
            warnings.push(
                "Fewer than 2 numeric data points extracted; skipping analysis."
            );
        }

        // ── Step 9: Mark completed ──
        await repo.updateIngestionStatus(ingestion.id, "completed");

        return {
            ingestion,
            metadata,
            markdown,
            tables: { trusted: trustedTables, flagged: flaggedTables },
            dataPoints,
            computeRun,
            reasoningGraph,
            warnings,
        };
    } catch (err) {
        // Mark failed with error message
        const message = err instanceof Error ? err.message : String(err);
        await repo.updateIngestionStatus(ingestion.id, "failed", message);
        throw err;
    }
}
