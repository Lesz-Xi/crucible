import { describe, expect, it, vi } from "vitest";

const generateReportMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("@/lib/services/scm-report-orchestrator", () => ({
  SCMReportOrchestrator: class {
    async generateReport(query: string, options: any, emitter: any) {
      return generateReportMock(query, options, emitter);
    }
  },
}));

import { POST } from "../analyze/route";

describe("POST /api/reports/analyze", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    const req = new Request("http://localhost/api/reports/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test query" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 on missing query", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-missing-query" } } });
    const req = new Request("http://localhost/api/reports/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("streams report_complete SSE payload", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-stream" } } });
    generateReportMock.mockResolvedValueOnce({
      meta: {
        reportId: "rpt-1",
        causalDepth: "heuristic",
        allowVerified: false,
        verificationFailures: [
          "Pipeline ran with a retrieval gap (Brave API unavailable or partial); conclusions may be incomplete.",
        ],
      },
      claims: [],
      sources: [],
      executiveSummary: [],
      primaryHypotheses: [],
      counterHypotheses: [],
      scmNotes: { identifiableLinks: [], inferredLinks: [], latentConfounders: [] },
      falsifierChecklist: [],
      unknownsAndGaps: [],
      decisionGuidance: { safeConclude: [], notSafeConclude: [] },
    });

    const req = new Request("http://localhost/api/reports/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test query", options: { k: 2 } }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await res.text();
    expect(text).toContain('"event":"report_complete"');
    expect(text).toContain('"reportId":"rpt-1"');
    expect(text).toContain('"causalDepth":"heuristic"');
    expect(text).toContain('"allowVerified":false');
    expect(text).toContain('"verificationFailures"');
  });

  it("streams report_pipeline_error when orchestrator throws", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-error" } } });
    generateReportMock.mockRejectedValueOnce(new Error("boom"));

    const req = new Request("http://localhost/api/reports/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test query" }),
    });

    const res = await POST(req as any);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toContain('"event":"report_pipeline_error"');
    expect(text).toContain('"error":"boom"');
  });

  it("returns 429 after repeated requests from the same user", async () => {
    generateReportMock.mockResolvedValue({
      meta: {
        reportId: "rpt-rate",
        causalDepth: "heuristic",
        allowVerified: false,
        verificationFailures: [],
      },
      claims: [],
      sources: [],
      executiveSummary: [],
      primaryHypotheses: [],
      counterHypotheses: [],
      scmNotes: { identifiableLinks: [], inferredLinks: [], latentConfounders: [] },
      falsifierChecklist: [],
      unknownsAndGaps: [],
      decisionGuidance: { safeConclude: [], notSafeConclude: [] },
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-rate-limit" } } });
      const okReq = new Request("http://localhost/api/reports/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `test query ${attempt}` }),
      });
      const okRes = await POST(okReq as any);
      expect(okRes.status).toBe(200);
      await okRes.text();
    }

    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-rate-limit" } } });
    const limitedReq = new Request("http://localhost/api/reports/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "fourth query" }),
    });

    const limitedRes = await POST(limitedReq as any);
    expect(limitedRes.status).toBe(429);
  });
});
