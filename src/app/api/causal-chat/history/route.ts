import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("causal_chat_sessions")
        .select("id, title, updated_at, created_at")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (sessionError || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const { data: messages, error: messageError } = await supabase
        .from("causal_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messageError) {
        return NextResponse.json({ error: "Failed to fetch session messages" }, { status: 500 });
      }

      return NextResponse.json({ success: true, session, messages: messages || [] });
    }

    const { data: history, error: historyError } = await supabase
      .from("causal_chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (historyError) {
      return NextResponse.json({ error: "Failed to fetch causal chat history" }, { status: 500 });
    }

    return NextResponse.json({ success: true, history: history || [] });
  } catch (error) {
    console.error("Causal History API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch causal chat history" },
      { status: 500 }
    );
  }
}
