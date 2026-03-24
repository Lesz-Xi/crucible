import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  traceJson: null as any,
  shouldError: false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (state.shouldError || !state.traceJson) {
              return { data: null, error: { message: "not found" } };
            }
            return { data: { trace_json: state.traceJson }, error: null };
          },
        }),
      }),
    }),
  })),
}));

import { GET } from "../route";

function buildContext(traceId: string) {
  return {
    params: Promise.resolve({ traceId }),
  };
}

describe("counterfactual trace retrieval route", () => {
  beforeEach(() => {
    state.traceJson = null;
    state.shouldError = false;
  });

  it("returns 400 for invalid traceId", async () => {
    const response = await GET(new Request("http://localhost") as any, buildContext("bad-id") as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns trace payload when found", async () => {
    state.traceJson = {
      traceId: "11111111-1111-4111-8111-111111111111",
      modelRef: { modelKey: "test", version: "v1" },
      query: {
        intervention: { variable: "X", value: 1 },
        outcome: "Y",
        observedWorld: { X: 0, Y: 0.5 },
      },
      assumptions: [],
      adjustmentSet: [],
      computation: {
        method: "deterministic_graph_diff",
        affectedPaths: ["X -> Y"],
        uncertainty: "low",
      },
      result: { actualOutcome: 0.5, counterfactualOutcome: 0.8, delta: 0.3 },
    };

    const response = await GET(
      new Request("http://localhost") as any,
      buildContext("11111111-1111-4111-8111-111111111111") as any
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.trace.traceId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("returns 404 when trace is missing", async () => {
    state.shouldError = true;
    const response = await GET(
      new Request("http://localhost") as any,
      buildContext("11111111-1111-4111-8111-111111111111") as any
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
  });
});
