// =============================================================
// Phase E: Contract Tests — Scientific Analysis Service
// Validates: §A (response shape), §B (graceful degradation),
//            §C (batch concurrency), §E (observability)
// =============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    DefaultScientificAnalysisService,
    type ScientificAnalysisRequest,
} from "../scientific-analysis-service";

// ── Mocks ────────────────────────────────────────────────────

// Mock the pipeline — we test the SERVICE contract, not the pipeline internals
vi.mock("../../pipeline/ingestion-pipeline", () => ({
    runIngestionPipeline: vi.fn(),
}));

import { runIngestionPipeline } from "../../pipeline/ingestion-pipeline";
const mockPipeline = vi.mocked(runIngestionPipeline);

// ── Fixtures ─────────────────────────────────────────────────

function makeRequest(overrides?: Partial<ScientificAnalysisRequest>): ScientificAnalysisRequest {
    return {
        userId: "user-001",
        pdfBuffer: new ArrayBuffer(10),
        fileName: "test.pdf",
        context: { feature: "hybrid" },
        ...overrides,
    };
}

function makePipelineResult() {
    return {
        ingestion: { id: "ing-001" },
        metadata: { title: "Test Paper" },
        markdown: "# Test",
        tables: {
            trusted: [{ id: "tbl-001" }, { id: "tbl-002" }],
            flagged: [{ id: "tbl-003" }],
        },
        dataPoints: [{ id: "dp-001" }, { id: "dp-002" }],
        computeRun: { id: "run-001" },
        reasoningGraph: { nodes: [], edges: [], claims: [] },
        warnings: ["Low-confidence table on page 3"],
    };
}

// ── Tests ────────────────────────────────────────────────────

describe("DefaultScientificAnalysisService", () => {
    let service: DefaultScientificAnalysisService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DefaultScientificAnalysisService();
    });

    // ── §A: Response Contract ──────────────────────────────

    describe("Contract §A: Response shape", () => {
        it("returns all required fields on success", async () => {
            mockPipeline.mockResolvedValueOnce(makePipelineResult() as never);
            const res = await service.run(makeRequest());

            expect(res.ingestionId).toBe("ing-001");
            expect(res.status).toBe("completed");

            // Summary fields
            expect(res.summary.tableCount).toBe(3); // 2 trusted + 1 flagged
            expect(res.summary.trustedTableCount).toBe(2);
            expect(res.summary.dataPointCount).toBe(2);

            // Optional fields
            expect(res.computeRunId).toBe("run-001");
            expect(res.reasoningGraph).toBeDefined();
            expect(res.warnings).toHaveLength(1);
        });

        it("includes provenance reference on success", async () => {
            mockPipeline.mockResolvedValueOnce(makePipelineResult() as never);
            const res = await service.run(makeRequest());

            expect(res.provenance).toBeDefined();
            expect(res.provenance!.ingestionId).toBe("ing-001");
            expect(res.provenance!.sourceTableIds).toEqual(["tbl-001", "tbl-002"]);
            expect(res.provenance!.dataPointIds).toEqual(["dp-001", "dp-002"]);
            expect(res.provenance!.computeRunId).toBe("run-001");
            expect(res.provenance!.methodVersion).toBeDefined();
        });
    });

    // ── §B: Graceful Degradation ───────────────────────────

    describe("Contract §B: Graceful degradation", () => {
        it("returns status 'failed' when pipeline throws", async () => {
            mockPipeline.mockRejectedValueOnce(new Error("DB unavailable"));
            const res = await service.run(makeRequest());

            expect(res.status).toBe("failed");
            expect(res.ingestionId).toBe("");
            expect(res.summary.tableCount).toBe(0);
            expect(res.warnings).toHaveLength(1);
            expect(res.warnings[0]).toContain("DB unavailable");
            expect(res.warnings[0]).toContain("test.pdf");
        });

        it("returns status 'failed' on timeout", async () => {
            mockPipeline.mockImplementationOnce(
                () => new Promise((resolve) => setTimeout(resolve, 5000)),
            );
            const res = await service.run(makeRequest({ options: { timeoutMs: 50 } }));

            expect(res.status).toBe("failed");
            expect(res.warnings[0]).toContain("Timeout");
        });
    });

    // ── §C: Batch & Concurrency ────────────────────────────

    describe("Contract §C: Batch with concurrency cap", () => {
        it("processes all files and returns envelope", async () => {
            mockPipeline.mockResolvedValue(makePipelineResult() as never);

            const requests = [
                makeRequest({ fileName: "a.pdf" }),
                makeRequest({ fileName: "b.pdf" }),
                makeRequest({ fileName: "c.pdf" }),
            ];
            const envelope = await service.runBatch(requests, 2);

            expect(envelope.scientificAnalysis).toHaveLength(3);
            expect(envelope.featureContext).toBe("hybrid");
            expect(envelope.requestSummary.pdfCount).toBe(3);
            expect(envelope.requestSummary.completedCount).toBe(3);
            expect(envelope.requestSummary.failedCount).toBe(0);
        });

        it("mixed success/failure in batch", async () => {
            mockPipeline
                .mockResolvedValueOnce(makePipelineResult() as never)
                .mockRejectedValueOnce(new Error("parse error"));

            const requests = [
                makeRequest({ fileName: "good.pdf" }),
                makeRequest({ fileName: "bad.pdf" }),
            ];
            const envelope = await service.runBatch(requests, 2);

            expect(envelope.requestSummary.completedCount).toBe(1);
            expect(envelope.requestSummary.failedCount).toBe(1);
        });
    });

    // ── §E: Observability ─────────────────────────────────

    describe("Contract §E: Observability metadata", () => {
        it("includes observability fields in response", async () => {
            mockPipeline.mockResolvedValueOnce(makePipelineResult() as never);
            const res = await service.run(makeRequest({ fileName: "metrics.pdf" }));

            expect(res.observability.fileName).toBe("metrics.pdf");
            expect(res.observability.durationMs).toBeGreaterThanOrEqual(0);
            expect(res.observability.status).toBe("completed");
            expect(res.observability.warningsCount).toBe(1);
        });

        it("includes observability fields on failure", async () => {
            mockPipeline.mockRejectedValueOnce(new Error("crash"));
            const res = await service.run(makeRequest());

            expect(res.observability.status).toBe("failed");
            expect(res.observability.warningsCount).toBe(1);
            expect(res.observability.durationMs).toBeGreaterThanOrEqual(0);
        });
    });
});
