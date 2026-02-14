import { describe, it, expect, vi, beforeEach } from "vitest";

const runMock = vi.fn();

vi.mock("../scientific-analysis-service", () => ({
  DefaultScientificAnalysisService: class {
    run = runMock;
  },
}));

import { processChatAttachments, type ChatAttachment } from "../chat-scientific-bridge";

const pdfData = Buffer.from("fake-pdf-content").toString("base64");

function attachment(name = "a.pdf"): ChatAttachment {
  return { name, data: pdfData, mimeType: "application/pdf" };
}

describe("chat-scientific-bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes PDF attachments and formats context summary", async () => {
    runMock.mockResolvedValue({
      ingestionId: "ing-1",
      status: "completed",
      summary: { tableCount: 2, trustedTableCount: 1, dataPointCount: 5 },
      warnings: [],
      provenance: {
        ingestionId: "ing-1",
        sourceTableIds: ["t1"],
        dataPointIds: ["d1"],
        methodVersion: "1.0.0",
      },
      observability: { fileName: "a.pdf", durationMs: 10, status: "completed", warningsCount: 0 },
    });

    const result = await processChatAttachments([attachment()], "user-1");

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(result.analyses).toHaveLength(1);
    expect(result.summaryForContext).toContain("Attachment #1");
    expect(result.summaryForContext).toContain("ingestion=ing-1");
  });

  it("skips invalid payloads gracefully", async () => {
    const result = await processChatAttachments(
      [{ name: "bad.pdf", data: "%%%", mimeType: "application/pdf" }],
      "user-1",
    );

    expect(result.analyses).toHaveLength(0);
    expect(result.warnings.join(" ")).toContain("Skipped bad.pdf");
  });

  it("ignores non-PDF attachments", async () => {
    const result = await processChatAttachments(
      [{ name: "x.txt", data: pdfData, mimeType: "text/plain" }],
      "user-1",
    );

    expect(runMock).not.toHaveBeenCalled();
    expect(result.analyses).toHaveLength(0);
  });

  it("includes all explicit numerics with categories and separates claim-eligible candidates", async () => {
    runMock.mockResolvedValue({
      ingestionId: "ing-2",
      status: "completed",
      summary: { tableCount: 0, trustedTableCount: 0, dataPointCount: 3 },
      warnings: [],
      provenance: {
        ingestionId: "ing-2",
        sourceTableIds: [],
        dataPointIds: ["d1", "d2", "d3"],
        methodVersion: "1.0.0",
      },
      numericEvidence: [
        { value: 2, source: "prose_numeric_extraction", contextSnippet: "[2] Esposito, J. (2024) Real-Time Monitoring..." },
        { value: 2025, source: "prose_numeric_extraction", contextSnippet: "World Journal of Advanced Research and Reviews, 2025" },
        { value: 4.0, source: "prose_numeric_extraction", contextSnippet: "Creative Commons Attribution License 4.0" },
        { value: 1, source: "prose_numeric_extraction", contextSnippet: "1. Introduction" },
        { value: 0.82, source: "prose_numeric_extraction", contextSnippet: "model achieved 82% accuracy on validation" },
      ],
      observability: { fileName: "a.pdf", durationMs: 10, status: "completed", warningsCount: 0 },
    });

    const result = await processChatAttachments([attachment()], "user-1");

    expect(result.summaryForContext).toContain("Extracted numbers with context (all explicit numerics)");
    expect(result.summaryForContext).toContain("value=2 | category=reference_index");
    expect(result.summaryForContext).toContain("value=2025 | category=citation_year");
    expect(result.summaryForContext).toContain("value=4 | category=bibliographic");
    expect(result.summaryForContext).toContain("value=1 | category=structural");
    expect(result.summaryForContext).toContain("value=0.82 | category=potential_metric");
    expect(result.summaryForContext).toContain("Claim-eligible numeric candidates:");
  });
});
