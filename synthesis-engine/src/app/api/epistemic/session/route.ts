
import { NextResponse } from "next/server";
import { ServerSessionManager } from "@/lib/epistemic/server-session-manager";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, persona } = body;

    const session = await ServerSessionManager.createSession(
      title || "New Research Audit",
      persona || "CriticalRationalist"
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
