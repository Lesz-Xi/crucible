import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractJwt } from "@/lib/mcp/auth";
import { getActiveScm } from "@/lib/mcp/tools/get-active-scm";
import { proposeCausalAxiom } from "@/lib/mcp/tools/propose-causal-axiom";
import { queryCausalAxioms } from "@/lib/mcp/tools/query-causal-axioms";

const scmRegistryMocks = vi.hoisted(() => ({
  listModels: vi.fn(),
  getModelVersion: vi.fn(),
}));

vi.mock("@/lib/services/scm-registry", () => ({
  SCMRegistryService: class {
    listModels = scmRegistryMocks.listModels;
    getModelVersion = scmRegistryMocks.getModelVersion;
  },
}));

function createQuerySupabaseMock(rows: Record<string, unknown>[]) {
  const chain = {
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
    eq: vi.fn().mockReturnThis(),
  };

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    }),
    chain,
  };
}

function createInsertSupabaseMock() {
  const single = vi.fn().mockResolvedValue({ data: { id: "f6df6a1e-9fb5-4eb0-b4f3-33943d0f0b01" }, error: null });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });

  return {
    from: vi.fn().mockReturnValue({
      insert,
    }),
    insert,
    select,
    single,
  };
}

describe("mcp auth helpers", () => {
  it("extracts bearer tokens", () => {
    expect(extractJwt("Bearer abc.def")).toBe("abc.def");
    expect(extractJwt("Bearer    token")).toBe("token");
    expect(extractJwt("Basic xyz")).toBeNull();
    expect(extractJwt(null)).toBeNull();
  });
});

describe("query_causal_axioms", () => {
  it("returns only tool-safe fields and echoes the query", async () => {
    const supabase = createQuerySupabaseMock([
      {
        id: "f6df6a1e-9fb5-4eb0-b4f3-33943d0f0b01",
        axiom_content: "X causes Y",
        confidence_score: 0.95,
        source: "session_extracted",
        created_at: "2026-03-15T00:00:00.000Z",
        session_id: "should-not-leak",
      },
    ]);

    const result = await queryCausalAxioms(
      {
        query: "causes",
        confidence_threshold: 0.9,
        limit: 5,
      },
      supabase as never
    );

    expect(result.total_found).toBe(1);
    expect(result.query_echo).toBe("causes");
    expect(result.axioms[0]).not.toHaveProperty("session_id");
    expect(result.axioms[0].causal_level).toBe(3);
  });
});

describe("propose_causal_axiom", () => {
  it("hardcodes proposal provenance and low confidence", async () => {
    const supabase = createInsertSupabaseMock();

    const result = await proposeCausalAxiom(
      {
        axiom_content: "Increasing attendance causes higher completion rates in this context.",
        justification: "Observed in repeated intervention cycles with stable confounder controls over multiple sessions.",
        agent_id: "researcher-agent-01",
        domain: "education",
      },
      supabase as never
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("pending_review");
    expect(result.confidence_score).toBe(0.1);
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        confidence_score: 0.1,
        source: "agent_proposed",
        review_status: "pending_review",
        derived_from_messages: [],
        agent_id: "researcher-agent-01",
      })
    );
  });
});

describe("get_active_scm", () => {
  beforeEach(() => {
    scmRegistryMocks.listModels.mockReset();
    scmRegistryMocks.getModelVersion.mockReset();
  });

  it("returns found false when no active public model exists", async () => {
    scmRegistryMocks.listModels.mockResolvedValue([]);

    const result = await getActiveScm(
      {
        domain: "biology",
        include_equations: false,
      },
      {} as never
    );

    expect(result).toEqual({ found: false });
  });

  it("uses public registry data and includes equations only when requested", async () => {
    scmRegistryMocks.listModels.mockResolvedValue([
      {
        modelKey: "education_student_graph",
        domain: "education",
      },
    ]);
    scmRegistryMocks.getModelVersion.mockResolvedValue({
      model: {
        modelKey: "education_student_graph",
        domain: "education",
        name: "Education Model",
        description: "Test model",
        status: "active",
      },
      version: {
        version: "v1",
        dagJson: {
          nodes: [{ id: "attendance" }, { id: "completion" }],
          edges: [{ from: "attendance", to: "completion" }],
        },
        assumptionsJson: ["No hidden interventions"],
        structuralEquationsJson: [{ outcome: "completion", expression: "attendance" }],
      },
    });

    const result = await getActiveScm(
      {
        domain: "education",
        include_equations: true,
      },
      {} as never
    );

    expect(scmRegistryMocks.listModels).toHaveBeenCalledWith({ publicOnly: true });
    expect(scmRegistryMocks.getModelVersion).toHaveBeenCalledWith(
      "education_student_graph",
      undefined,
      { publicOnly: true }
    );
    expect(result.found).toBe(true);
    expect(result.model?.dag.nodes).toEqual(["attendance", "completion"]);
    expect(result.model?.structural_equations).toHaveLength(1);
  });
});
