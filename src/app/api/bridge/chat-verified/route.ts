import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";
import { randomUUID } from "crypto";

const BridgePayloadSchema = z.object({
  sessionId: z.string().min(1).optional(),
  messageId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  source: z.string().min(1).default("unknown"),
  verdict: z.string().min(1).default("verified"),
  model: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  requestId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function isAuthorized(req: NextRequest): boolean {
  const token = process.env.BRIDGE_VERIFICATION_TOKEN;
  if (!token) return true;
  const headerToken = req.headers.get("x-bridge-token") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerToken === token;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-bridge-token",
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/bridge/chat-verified",
    status: "reachable",
    ts: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized bridge token" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BridgePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent") || null;

  try {
    const supabase = createPublicSupabaseClient();
    const row: Record<string, unknown> = {
      source: parsed.data.source,
      verdict: parsed.data.verdict,
      metadata: parsed.data.metadata ?? {},
    };

    if (parsed.data.sessionId !== undefined) row.session_id = parsed.data.sessionId;
    if (parsed.data.messageId !== undefined) row.message_id = parsed.data.messageId;
    if (parsed.data.userId !== undefined) row.user_id = parsed.data.userId;
    if (parsed.data.model !== undefined) row.model = parsed.data.model;
    if (parsed.data.confidence !== undefined) row.confidence = parsed.data.confidence;
    if (parsed.data.requestId !== undefined) row.request_id = parsed.data.requestId;
    if (clientIp) row.ip = clientIp;
    if (userAgent) row.user_agent = userAgent;

    // Legacy-schema compatibility: some environments still have extra NOT NULL columns.
    // We retry adaptively, filling the reported missing column each pass.
    let attemptRow: Record<string, unknown> = { ...row };
    let error: { message: string } | null = null;
    let data: { id: string } | null = null;

    const injectLegacyDefault = (column: string) => {
      const key = column.toLowerCase();
      if (key === "trace_id") attemptRow.trace_id = parsed.data.requestId || randomUUID();
      else if (key === "endpoint") attemptRow.endpoint = "/api/bridge/chat-verified";
      else if (key === "method") attemptRow.method = req.method;
      else if (key === "event_type") attemptRow.event_type = "chat_verified";
      else if (key === "request_id") attemptRow.request_id = parsed.data.requestId || randomUUID();
      else if (key === "created_at") attemptRow.created_at = new Date().toISOString();
      else if (key === "updated_at") attemptRow.updated_at = new Date().toISOString();
      else if (key === "payload") attemptRow.payload = parsed.data.metadata ?? {};
      else if (key === "status") attemptRow.status = "ok";
    };

    // Prime known legacy columns proactively to reduce retries.
    injectLegacyDefault("trace_id");
    injectLegacyDefault("endpoint");
    injectLegacyDefault("method");
    injectLegacyDefault("event_type");

    for (let i = 0; i < 6; i++) {
      const result = await supabase.from("bridge_verification_log").insert(attemptRow).select("id").single();
      error = (result.error as { message: string } | null) ?? null;
      data = (result.data as { id: string } | null) ?? null;
      if (!error) break;

      const notNullMatch = error.message.match(/null value in column "([^"]+)"/i);
      if (!notNullMatch) break;
      injectLegacyDefault(notNullMatch[1]);
    }

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "Insert succeeded but no row id returned" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}
