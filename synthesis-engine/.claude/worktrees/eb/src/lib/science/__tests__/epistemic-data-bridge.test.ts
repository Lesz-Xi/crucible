import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server-admin", () => ({
  createServerSupabaseAdminClient: () => ({
    from: fromMock,
  }),
}));

import { getRecentScientificEvidence } from "../epistemic-data-bridge";

describe("epistemic-data-bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps recent scientific evidence", async () => {
    const ingestionsResult = {
      data: [{ id: "ing-1", file_name: "paper.pdf", created_at: "2026-02-14T00:00:00Z" }],
      error: null,
    };

    const ingestionQuery: any = {
      select: vi.fn(() => ingestionQuery),
      eq: vi.fn(() => ingestionQuery),
      order: vi.fn(() => ingestionQuery),
      limit: vi.fn(() => Promise.resolve(ingestionsResult)),
    };

    const pointsQuery: any = {
      select: vi.fn(() => pointsQuery),
      in: vi.fn(() => Promise.resolve({
        data: [
          { id: "dp-1", ingestion_id: "ing-1" },
          { id: "dp-2", ingestion_id: "ing-1" },
        ],
        error: null,
      })),
    };

    const tablesQuery: any = {
      select: vi.fn(() => tablesQuery),
      in: vi.fn(() => tablesQuery),
      gte: vi.fn(() => Promise.resolve({
        data: [{ id: "t-1", ingestion_id: "ing-1", confidence: 0.9 }],
        error: null,
      })),
    };

    const runsQuery: any = {
      select: vi.fn(() => runsQuery),
      in: vi.fn(() => runsQuery),
      order: vi.fn(() => Promise.resolve({
        data: [{ id: "run-1", ingestion_id: "ing-1", created_at: "2026-02-14T00:01:00Z" }],
        error: null,
      })),
    };

    fromMock
      .mockReturnValueOnce(ingestionQuery)
      .mockReturnValueOnce(pointsQuery)
      .mockReturnValueOnce(tablesQuery)
      .mockReturnValueOnce(runsQuery);

    const result = await getRecentScientificEvidence("user-1", 5);

    expect(result).toHaveLength(1);
    expect(result[0].ingestionId).toBe("ing-1");
    expect(result[0].dataPointCount).toBe(2);
    expect(result[0].trustedTableCount).toBe(1);
    expect(result[0].computeRunId).toBe("run-1");
  });
});
