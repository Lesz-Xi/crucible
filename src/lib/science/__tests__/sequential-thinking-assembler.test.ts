import { describe, expect, it } from "vitest";
import type { ScientificAnalysisResponse } from "../scientific-analysis-service";
import {
  buildAttachmentSequentialThinkingReport,
  classifyNumericEvidence,
} from "../sequential-thinking-assembler";

function analysisWithEvidence(
  numericEvidence: ScientificAnalysisResponse["numericEvidence"],
  fileName = "Anomaly-Detection.pdf",
): ScientificAnalysisResponse {
  return {
    ingestionId: "ing-1",
    status: "completed",
    summary: { tableCount: 0, trustedTableCount: 0, dataPointCount: numericEvidence.length },
    warnings: [],
    numericEvidence,
    observability: {
      fileName,
      durationMs: 10,
      status: "completed",
      warningsCount: 0,
    },
  };
}

describe("sequential-thinking-assembler", () => {
  it("classifies temporal delta phrases as potential_metric", () => {
    const category = classifyNumericEvidence(
      3,
      "Root-cause analysis time reduced from three hours to fifteen minutes after intervention.",
    );
    expect(category).toBe("potential_metric");
  });

  it("classifies scale quantifiers as potential_metric", () => {
    const category = classifyNumericEvidence(1_000_000_000, "Pipeline processes billions of events daily.");
    expect(category).toBe("potential_metric");
  });

  it("classifies section references as structural", () => {
    const category = classifyNumericEvidence(3.2, "See Section 3.2 for architecture details.");
    expect(category).toBe("structural");
  });

  it("builds Section 2 deterministically from Section 1 potential_metric bucket", () => {
    const report = buildAttachmentSequentialThinkingReport([
      analysisWithEvidence([
        {
          value: 15,
          source: "prose",
          contextSnippet: "RCA time reduced from three hours to fifteen minutes.",
        },
        {
          value: 5,
          source: "prose",
          contextSnippet: "The paper discusses five critical areas for implementation.",
        },
      ]),
    ]);

    const section2 = report.split("Section 2: Claim-Eligible Numerics")[1] || "";
    expect(section2).toContain("15");
    expect(section2).not.toContain("five critical areas");
    expect(report).toContain("Section 1: All Explicit Numbers with Context");
    expect(report).toContain("Section 2: Claim-Eligible Numerics");
    expect(report).toContain("Section 3: Three Claims with Uncertainty Labels");
  });

  it("emits NONE in Section 2 when no claim-eligible numerics exist", () => {
    const report = buildAttachmentSequentialThinkingReport([
      analysisWithEvidence([
        {
          value: 2025,
          source: "prose",
          contextSnippet: "World Journal of Advanced Research and Reviews, 2025, 26(02), 874-879.",
        },
      ]),
    ]);

    const section2 = report.split("Section 2: Claim-Eligible Numerics")[1] || "";
    expect(section2).toContain("NONE");
    expect(report).not.toContain("Section 4:");
    expect(report).not.toContain("Falsification Criteria");
  });
});

