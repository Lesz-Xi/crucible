import { describe, expect, it, vi } from "vitest";

const singleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: singleMock,
        }),
      }),
    }),
  })),
}));

import { POST } from "../route";

describe("POST /api/reports/[reportId]/export", () => {
  const sampleReport = {
    meta: {
      reportId: "rpt-1",
      query: "Does X cause Y?",
      causalDepth: "heuristic",
      generatedAt: "2026-03-05T00:00:00.000Z",
    },
    executiveSummary: ["Summary 1"],
    primaryHypotheses: [
      {
        text: "X may cause Y",
        confidence: 0.72,
        claimClass: "INFERRED_CAUSAL",
      },
    ],
    counterHypotheses: [{ text: "Z explains Y", rationale: "Confounding" }],
    decisionGuidance: { safeConclude: ["A"], notSafeConclude: ["B"] },
    unknownsAndGaps: ["Need RCT"],
    falsifierChecklist: [{ claimId: "c1", test: "Observe Y under do(X)", window: "30d" }],
    sources: [{ domain: "reuters.com", url: "https://reuters.com/x" }],
    claims: [{ claimClass: "INFERRED_CAUSAL", evidenceTier: "B", confidence: 0.62, text: "X linked to Y" }],
  };

  it("returns JSON export by default", async () => {
    singleMock.mockResolvedValueOnce({ data: { report_json: sampleReport }, error: null });

    const req = new Request("http://localhost/api/reports/rpt-1/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "json" }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ reportId: "rpt-1" }) } as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.meta.reportId).toBe("rpt-1");
  });

  it("returns markdown export when requested", async () => {
    singleMock.mockResolvedValueOnce({ data: { report_json: sampleReport }, error: null });

    const req = new Request("http://localhost/api/reports/rpt-1/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "markdown" }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ reportId: "rpt-1" }) } as any);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(text).toContain("# SCM Grounded Report");
    expect(text).toContain("**Report ID:** rpt-1");
  });
});
