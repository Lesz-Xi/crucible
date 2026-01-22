
import { NextResponse } from "next/server";
import { ServerSessionManager } from "@/lib/epistemic/server-session-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await ServerSessionManager.getSession(id);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error(`Failed to get session:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
