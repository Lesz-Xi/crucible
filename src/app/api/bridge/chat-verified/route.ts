import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

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
    const { error, data } = await supabase
      .from("bridge_verification_log")
      .insert({
        session_id: parsed.data.sessionId ?? null,
        message_id: parsed.data.messageId ?? null,
        user_id: parsed.data.userId ?? null,
        source: parsed.data.source,
        verdict: parsed.data.verdict,
        model: parsed.data.model ?? null,
        confidence: parsed.data.confidence ?? null,
        request_id: parsed.data.requestId ?? null,
        metadata: parsed.data.metadata ?? {},
        ip: clientIp,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}
