
import { NextResponse } from "next/server";
import { ServerAgentRunner } from "@/lib/epistemic/server-agent-runner";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, content } = body;

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "Missing sessionId or content" },
        { status: 400 }
      );
    }

    // Process the turn (updates session state in background/foreground)
    await ServerAgentRunner.processTurn(sessionId, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process chat:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
