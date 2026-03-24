import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const singleMock = vi.fn();
const selectMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn((row: Record<string, unknown>) => {
  void row;
  return { select: selectMock };
});
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/supabase/public-server", () => ({
  createPublicSupabaseClient: vi.fn(() => ({
    from: fromMock,
  })),
}));

import { POST } from "../route";

type PostRequest = Parameters<typeof POST>[0];

describe("POST /api/bridge/chat-verified", () => {
  const originalToken = process.env.BRIDGE_VERIFICATION_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BRIDGE_VERIFICATION_TOKEN;
    singleMock.mockResolvedValue({ data: { id: "row-1" }, error: null });
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.BRIDGE_VERIFICATION_TOKEN;
    } else {
      process.env.BRIDGE_VERIFICATION_TOKEN = originalToken;
    }
  });

  it("accepts valid ingest payload and persists telemetry row", async () => {
    const req = new Request("http://localhost/api/bridge/chat-verified", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.10.10.10",
        "user-agent": "vitest",
      },
      body: JSON.stringify({
        source: "scm-report",
        verdict: "verified",
        requestId: "req-1",
        metadata: { reportId: "rpt-1" },
      }),
    });

    const res = await POST(req as unknown as PostRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, id: "row-1" });
    expect(fromMock).toHaveBeenCalledWith("bridge_verification_log");
    expect(insertMock).toHaveBeenCalledTimes(1);

    const firstInsertCall = insertMock.mock.calls[0];
    expect(firstInsertCall).toBeDefined();
    if (!firstInsertCall) throw new Error("Expected insert call");
    const typedInsertedRow = firstInsertCall[0];
    expect(typedInsertedRow.source).toBe("scm-report");
    expect(typedInsertedRow.verdict).toBe("verified");
    expect(typedInsertedRow.request_id).toBe("req-1");
    expect(typedInsertedRow.metadata).toEqual({ reportId: "rpt-1" });
  });

  it("rejects unauthorized requests when bridge token is configured", async () => {
    process.env.BRIDGE_VERIFICATION_TOKEN = "secret-token";

    const req = new Request("http://localhost/api/bridge/chat-verified", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "scm-report" }),
    });

    const res = await POST(req as unknown as PostRequest);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized bridge token" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("ignores caller trust-state fields and does not expose verification authority fields", async () => {
    const req = new Request("http://localhost/api/bridge/chat-verified", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "external-adapter",
        causalDepth: "verified",
        verificationDecision: { allowVerified: true },
      }),
    });

    const res = await POST(req as unknown as PostRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json).not.toHaveProperty("causalDepth");
    expect(json).not.toHaveProperty("verificationDecision");
    expect(json).not.toHaveProperty("verificationFailures");

    const firstInsertCall = insertMock.mock.calls[0];
    expect(firstInsertCall).toBeDefined();
    if (!firstInsertCall) throw new Error("Expected insert call");
    const typedInsertedRow = firstInsertCall[0];
    expect(typedInsertedRow).not.toHaveProperty("causalDepth");
    expect(typedInsertedRow).not.toHaveProperty("verificationDecision");
    expect(typedInsertedRow).not.toHaveProperty("verificationFailures");
  });
});
