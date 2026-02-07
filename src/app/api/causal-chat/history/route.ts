import { NextRequest, NextResponse } from "next/server";
import { PersistenceService } from "@/lib/db/persistence-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");
    const persistence = new PersistenceService();

    if (sessionId) {
      // Fetch specific session details
      const details = await persistence.getCausalSessionDetails(sessionId);
      if (!details) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, session: details });
    } else {
      // Fetch list of sessions
      const history = await persistence.getCausalSessions(20);
      return NextResponse.json({ success: true, history });
    }
  } catch (error) {
    console.error("Causal History API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch causal chat history" },
      { status: 500 }
    );
  }
}
