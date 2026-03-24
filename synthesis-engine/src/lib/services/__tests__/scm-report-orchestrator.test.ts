import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/retrieval-orchestrator-service", () => ({
  RetrievalOrchestratorService: class {
    static getInstance() {
      return { orchestrateRetrieval: vi.fn(async () => ({ sources: [], failedFamilies: [] })) };
    }
  },
}));

vi.mock("@/lib/services/source-scoring-service", () => ({
  SourceScoringService: class {
    static getInstance() {
      return {};
    }
  },
}));

vi.mock("@/lib/services/evidence-extraction-service", () => ({
  EvidenceExtractionService: class {
    static getInstance() {
      return { extractClaimsBatch: vi.fn(async () => []) };
    }
  },
}));

vi.mock("@/lib/supabase/server-admin", () => ({
  createServerSupabaseAdminClient: vi.fn(() => ({
    from: () => ({ insert: vi.fn(async () => ({ error: null })) }),
  })),
}));

vi.mock("@/lib/services/report-synthesizer-service", () => ({
  ReportSynthesizerService: class {
    static getInstance() {
      return {
        synthesizeReport: vi.fn(async () => ({
          meta: {
            reportId: "r1",
            reportVersion: 1,
            computeRunId: "run-1",
            inputHash: "hash",
            query: "q",
            causalDepth: "heuristic",
            allowVerified: false,
            verificationFailures: [],
            unknowns: [],
            generatedAt: new Date().toISOString(),
            methodVersion: "scm-grounded-report-v1",
            pipelineConfig: {
              queryFamilyCount: 5,
              kResultsPerQuery: 5,
              maxExcerptChars: 2000,
              braveDomain: "api.search.brave.com",
            },
          },
          sources: [],
          claims: [],
          executiveSummary: [],
          primaryHypotheses: [],
          counterHypotheses: [],
          scmNotes: { identifiableLinks: [], inferredLinks: [], latentConfounders: [] },
          falsifierChecklist: [],
          unknownsAndGaps: [],
          decisionGuidance: { safeConclude: [], notSafeConclude: [] },
        })),
      };
    }
  },
}));

describe("SCMReportOrchestrator SSE contract", () => {
  it("emits start -> stage progress -> complete flow with heartbeat", async () => {
    vi.useFakeTimers();

    const { SCMReportOrchestrator } = await import("@/lib/services/scm-report-orchestrator");

    const retrievalService = {
      orchestrateRetrieval: vi.fn(
        () =>
          new Promise<any>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  sources: [
                    {
                      sourceId: "s1",
                      url: "https://reuters.com/x",
                      domain: "reuters.com",
                      credibilityScore: 0.82,
                      recencyScore: 0.9,
                      corroborationScore: 0.5,
                      excerpt: "x",
                      fetchedAt: new Date().toISOString(),
                      ingestionId: "ing-1",
                    },
                  ],
                  failedFamilies: [],
                }),
              700
            )
          )
      ),
    } as any;

    const extractionService = {
      extractClaimsBatch: vi.fn(async () => []),
    } as any;

    const synthesizerService = {
      synthesizeReport: vi.fn(async () => ({
        meta: {
          reportId: "r1",
          reportVersion: 1,
          computeRunId: "run-1",
          inputHash: "hash",
          query: "q",
          causalDepth: "heuristic",
          allowVerified: false,
          verificationFailures: [],
          unknowns: [],
          generatedAt: new Date().toISOString(),
          methodVersion: "scm-grounded-report-v1",
          pipelineConfig: {
            queryFamilyCount: 5,
            kResultsPerQuery: 5,
            maxExcerptChars: 2000,
            braveDomain: "api.search.brave.com",
          },
        },
        sources: [],
        claims: [],
        executiveSummary: [],
        primaryHypotheses: [],
        counterHypotheses: [],
        scmNotes: { identifiableLinks: [], inferredLinks: [], latentConfounders: [] },
        falsifierChecklist: [],
        unknownsAndGaps: [],
        decisionGuidance: { safeConclude: [], notSafeConclude: [] },
      })),
    } as any;

    const supabase = {
      from: vi.fn(() => ({ insert: vi.fn(async () => ({ error: null })) })),
    } as any;

    const events: any[] = [];
    const emitter = { emit: (e: any) => events.push(e) } as any;

    const orchestrator = new SCMReportOrchestrator({
      retrievalService,
      extractionService,
      synthesizerService,
      supabase,
    } as any);

    const promise = orchestrator.generateReport("test query", { heartbeatIntervalMs: 500 }, emitter);

    await vi.advanceTimersByTimeAsync(1200);
    const report = await promise;

    expect(report.meta.reportId).toBeDefined();
    expect(events.some((e) => e.event === "report_pipeline_start")).toBe(true);
    expect(events.some((e) => e.event === "report_heartbeat")).toBe(true);

    const stageEvents = events.filter((e) => e.event === "report_stage_progress");
    expect(stageEvents.map((e: any) => e.label)).toEqual(
      expect.arrayContaining(["retrieval", "scoring", "extraction", "synthesis", "complete"])
    );

    vi.useRealTimers();
  });

  it("caps retrieval breadth and extraction source count by default", async () => {
    const { SCMReportOrchestrator } = await import("@/lib/services/scm-report-orchestrator");

    const sources = Array.from({ length: 12 }, (_, index) => ({
      sourceId: `s${index + 1}`,
      url: `https://example.com/${index + 1}`,
      domain: "example.com",
      credibilityScore: 0.8,
      recencyScore: 0.8,
      corroborationScore: 0.5,
      excerpt: "excerpt",
      fetchedAt: new Date().toISOString(),
      ingestionId: "ing-1",
    }));

    const retrievalService = {
      orchestrateRetrieval: vi.fn(async () => ({ sources, failedFamilies: [] })),
    } as any;

    const extractionService = {
      extractClaimsBatch: vi.fn(async () => []),
    } as any;

    const synthesizerService = {
      synthesizeReport: vi.fn(async () => ({
        meta: {
          reportId: "r2",
          reportVersion: 1,
          computeRunId: "run-2",
          inputHash: "hash",
          query: "q",
          causalDepth: "heuristic",
          allowVerified: false,
          verificationFailures: [],
          unknowns: [],
          generatedAt: new Date().toISOString(),
          methodVersion: "scm-grounded-report-v1",
          pipelineConfig: {
            queryFamilyCount: 5,
            kResultsPerQuery: 8,
            maxExcerptChars: 2000,
            braveDomain: "api.search.brave.com",
          },
        },
        sources,
        claims: [],
        executiveSummary: [],
        primaryHypotheses: [],
        counterHypotheses: [],
        scmNotes: { identifiableLinks: [], inferredLinks: [], latentConfounders: [] },
        falsifierChecklist: [],
        unknownsAndGaps: [],
        decisionGuidance: { safeConclude: [], notSafeConclude: [] },
      })),
    } as any;

    const supabase = {
      from: vi.fn(() => ({ insert: vi.fn(async () => ({ error: null })) })),
    } as any;

    const emitter = { emit: vi.fn() } as any;

    const orchestrator = new SCMReportOrchestrator({
      retrievalService,
      extractionService,
      synthesizerService,
      supabase,
    } as any);

    await orchestrator.generateReport("test query", {}, emitter);

    expect(retrievalService.orchestrateRetrieval).toHaveBeenCalledWith(
      expect.objectContaining({ k: 6 })
    );
    expect(extractionService.extractClaimsBatch).toHaveBeenCalledWith(
      "test query",
      expect.arrayContaining(sources.slice(0, 8)),
      expect.any(String),
      expect.any(String)
    );
    expect(extractionService.extractClaimsBatch.mock.calls[0][1]).toHaveLength(8);
  });
});
