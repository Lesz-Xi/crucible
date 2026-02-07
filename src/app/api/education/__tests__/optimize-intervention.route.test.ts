import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../optimize-intervention/route";

const ORIGINAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORIGINAL_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/education/optimize-intervention", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function isoNow(): string {
  return new Date("2026-02-05T00:00:00.000Z").toISOString();
}

describe("education optimize-intervention gate integration", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_SUPABASE_ANON_KEY;
  });

  it("keeps supported interventions and returns intervention_supported output class", async () => {
    const request = buildRequest({
      studentId: "student-supported",
      optimizationGoal: "performance",
      causalGraph: {
        studentId: "student-supported",
        nodes: [
          { name: "Confounder", type: "latent", value: 5, confidence: 0.9, lastUpdated: isoNow() },
          { name: "Motivation", type: "observable", value: 4, confidence: 0.8, lastUpdated: isoNow() },
          { name: "Performance", type: "observable", value: 5, confidence: 0.8, lastUpdated: isoNow() },
        ],
        edges: [
          { from: "Confounder", to: "Motivation", mechanism: "background", strength: 0.8, evidence: "test", modifiable: false },
          { from: "Confounder", to: "Performance", mechanism: "background", strength: 0.8, evidence: "test", modifiable: false },
          { from: "Motivation", to: "Performance", mechanism: "main effect", strength: 0.9, evidence: "test", modifiable: true },
        ],
        bottleneck: "Motivation",
        leveragePoint: "Motivation",
        timestamp: isoNow(),
        version: 1,
      },
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.allowedOutputClass).toBe("intervention_supported");
    expect(json.interventionGateSummary.allowedInterventions).toBeGreaterThan(0);
    expect(json.topRecommendation.interventionGate.allowed).toBe(true);
    expect(json.topRecommendation.counterfactualTrace.traceId).toBeTypeOf("string");
    expect(json.topRecommendation.interventionGate.counterfactualTrace.traceId).toBeTypeOf("string");
    expect(Array.isArray(json.counterfactuals)).toBe(true);
    expect(json.counterfactuals.length).toBeGreaterThan(0);
    expect(Array.isArray(json.counterfactualTraceIds)).toBe(true);
    expect(json.counterfactualTraceIds.length).toBeGreaterThan(0);
    expect(json.counterfactuals.every((scenario: any) => typeof scenario.counterfactualTrace?.traceId === "string")).toBe(true);
  });

  it("downgrades to association_only when treatment/outcome cannot be mapped", async () => {
    const request = buildRequest({
      studentId: "student-blocked",
      optimizationGoal: "performance",
      causalGraph: {
        studentId: "student-blocked",
        nodes: [
          { name: "Motivation", type: "observable", value: 4, confidence: 0.8, lastUpdated: isoNow() },
        ],
        edges: [],
        bottleneck: "Motivation",
        leveragePoint: "Motivation",
        timestamp: isoNow(),
        version: 1,
      },
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.allowedOutputClass).toBe("association_only");
    expect(json.interventionGateSummary.allowedInterventions).toBe(0);
    expect(json.interventionGateSummary.blockedInterventions).toBeGreaterThan(0);
    expect(json.topRecommendation.interventionGate.allowed).toBe(false);
    expect(json.topRecommendation.counterfactualTrace).toBeUndefined();
    expect(json.counterfactualTraceIds).toEqual([]);
    expect(json.counterfactuals).toEqual([]);
  });
});
