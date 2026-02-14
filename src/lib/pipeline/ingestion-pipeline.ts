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

    // If already completed, return early (idempotent)
    if (ingestion.status === "completed") {
        warnings.push("Ingestion already completed; returning cached result.");
        return {
            ingestion,
            metadata: {},
            markdown: "",
            tables: { trusted: [], flagged: [] },
            dataPoints: [],
            computeRun: null,
            reasoningGraph: { nodes: [], edges: [], claims: [], summary: "Cached." },
            warnings,
        };
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
