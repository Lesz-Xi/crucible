import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

import { ChatPersistence } from "../chat-persistence";

describe("causal density persistence parity", () => {
  it("persists and reloads causal_density consistently", async () => {
    const persistence = new ChatPersistence();
    const density = {
      score: 2 as const,
      label: "Intervention" as const,
      confidence: 0.73,
      detectedMechanisms: [],
    };
    const insertedPayloads: any[] = [];

    const mockSupabase = {
      from: (table: string) => {
        if (table === "causal_chat_messages") {
          return {
            insert: (payload: any) => {
              insertedPayloads.push(payload);
              return {
                select: async () => ({ data: [{ id: "msg-1" }], error: null }),
              };
            },
            select: (selector: string) => {
              if (selector === "causal_density") {
                return {
                  limit: async () => ({ error: null }),
                };
              }
              return {
                eq: () => ({
                  order: async () => ({
                    data: [
                      {
                        id: "msg-1",
                        role: "assistant",
                        content: "test",
                        created_at: "2026-02-04T00:00:00.000Z",
                        causal_density: density,
                        confidence_score: 0.9,
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === "causal_chat_sessions") {
          return {
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        }
        return {};
      },
    };

    (persistence as any).supabase = mockSupabase;
    (persistence as any).causalDensityColumnAvailable = true;

    await persistence.saveMessage("session-1", {
      id: "msg-1",
      role: "assistant",
      content: "test",
      timestamp: new Date(),
      causalDensity: density,
    });

    expect(insertedPayloads[0].causal_density).toEqual(density);

    const loaded = await persistence.loadSession("session-1");
    expect(loaded[0].causalDensity).toEqual(density);
  });
});
