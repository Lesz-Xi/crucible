import { beforeEach, describe, expect, it, vi } from "vitest";

const extractMultipleMock = vi.fn();
const analyzeMock = vi.fn(async () => ({
  question: "but-for?",
  counterfactualScenario: "test",
  result: "necessary",
  confidence: 0.8,
  reasoning: "test",
  necessityScore: 0.8,
  sufficiencyScore: 0.7,
}));

vi.mock("@/lib/extractors/legal-extractor", () => ({
  LegalDocumentExtractor: class {
    async extractMultiple(...args: unknown[]) {
      return extractMultipleMock(...args);
    }
  },
}));

vi.mock("@/lib/services/but-for-analyzer", () => ({
  ButForAnalyzer: class {
    async analyze(...args: unknown[]) {
      return analyzeMock(...args);
    }
    async analyzeMultiple() {
      return new Map();
    }
  },
}));

vi.mock("@/lib/services/precedent-matcher", () => ({
  PrecedentMatcher: class {
    async findPrecedents() {
      return [];
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  })),
}));

import { POST } from "../route";

function buildExtraction(withIntent: boolean) {
  return {
    entities: [{ id: "def", type: "defendant", name: "Def", role: "Defendant", relevantActions: [] }],
    timeline: [
      {
        id: "act-1",
        actor: "def",
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
        description: "Defendant action caused the injury",
        intent: withIntent
          ? {
              type: "reckless",
              description: "Knew risk and proceeded",
              evidenceSnippets: ["memo"],
              confidence: 0.8,
            }
          : undefined,
        butForRelevance: 0.8,
      },
    ],
    harms: [
      {
        id: "harm-1",
        victim: "victim-1",
        type: "physical",
        description: "Plaintiff injury",
        severity: "severe",
        timestamp: new Date("2026-01-02T00:00:00.000Z"),
      },
    ],
    warnings: [],
  };
}

describe("legal reasoning intervention gate integration", () => {
  beforeEach(() => {
    extractMultipleMock.mockReset();
    analyzeMock.mockClear();
  });

  it("returns intervention_supported when legal confounders are controlled", async () => {
    extractMultipleMock.mockResolvedValue(buildExtraction(true));

    const request = new Request("http://localhost/api/legal-reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: ["doc"],
        caseTitle: "Test Case",
        caseType: "tort",
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.allowedOutputClass).toBe("intervention_supported");
    expect(Array.isArray(json.counterfactualTraceIds)).toBe(true);
    expect(json.counterfactualTraceIds.length).toBeGreaterThan(0);
    expect(json.interventionGate.allowed).toBe(true);
    expect(json.interventionGate.allowedChains).toBeGreaterThan(0);
    expect(json.case.causalChains.length).toBeGreaterThan(0);
    expect(json.case.causalChains[0].butForAnalysis.counterfactualTrace.traceId).toBeTypeOf("string");
    expect(json.case.causalChains[0].butForAnalysis.counterfactualTrace.method).toBe("deterministic_graph_diff");
  });

  it("downgrades to intervention_inferred when confounders are missing", async () => {
    extractMultipleMock.mockResolvedValue(buildExtraction(false));

    const request = new Request("http://localhost/api/legal-reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: ["doc"],
        caseTitle: "Test Case",
        caseType: "tort",
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.allowedOutputClass).toBe("intervention_inferred");
    expect(json.counterfactualTraceIds).toEqual([]);
    expect(json.interventionGate.allowed).toBe(false);
    expect(json.interventionGate.blockedChains).toBeGreaterThan(0);
    expect(json.case.causalChains).toHaveLength(0);
  });
});
