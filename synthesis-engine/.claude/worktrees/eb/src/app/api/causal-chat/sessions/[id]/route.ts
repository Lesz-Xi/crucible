import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * DELETE /api/causal-chat/sessions/[id]
 * 
 * Deletes a chat session and all associated messages (via CASCADE).
 * Only authenticated users can delete their own sessions (enforced by RLS).
 */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    // Initialize Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Require authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessionId = params.id;

    let error, count;

    // Authenticated user: RLS policy enforces ownership automatically
    const result = await supabase
      .from("causal_chat_sessions")
      .delete({ count: "exact" })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    error = result.error;
    count = result.count;

    if (error) {
      console.error("[Delete Session] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete session. Please try again." },
        { status: 500 }
      );
    }

    // If count is 0, session either doesn't exist or user doesn't own it
    if (count === 0) {
      return NextResponse.json(
        { error: "Session not found or you don't have permission to delete it." },
        { status: 404 }
      );
    }

    console.log(`[Delete Session] Successfully deleted session: ${sessionId}`);

    return NextResponse.json(
      { success: true, message: "Session deleted successfully" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[Delete Session] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
