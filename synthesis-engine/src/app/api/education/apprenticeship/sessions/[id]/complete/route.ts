import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildWeekProgress,
  mapApprenticeshipSession,
} from "@/lib/services/education-apprenticeship";
import {
  CompleteApprenticeshipSessionRequest,
  CompleteApprenticeshipSessionResponse,
} from "@/types/education";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: CompleteApprenticeshipSessionRequest = await request.json();

    if (!body?.mood || !["low", "mid", "high"].includes(body.mood)) {
      return NextResponse.json(
        { success: false, error: "Invalid mood. Expected low | mid | high." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingSession, error: fetchError } = await supabase
      .from("education_apprenticeship_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("education_apprenticeship_sessions")
      .update({
        status: "completed",
        intent_note: body.intentNote ?? null,
        mood: body.mood,
        reflection_note: body.reflectionNote ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      return NextResponse.json(
        { success: false, error: updateError?.message || "Failed to update session" },
        { status: 500 }
      );
    }

    const { data: weekRows, error: weekError } = await supabase
      .from("education_apprenticeship_sessions")
      .select("*")
      .eq("plan_id", updatedRow.plan_id)
      .eq("week_start", updatedRow.week_start)
      .order("session_number", { ascending: true });

    if (weekError) {
      return NextResponse.json({ success: false, error: weekError.message }, { status: 500 });
    }

    const mapped = (weekRows ?? []).map(mapApprenticeshipSession);
    const progress = buildWeekProgress(updatedRow.week_start, mapped);

    const response: CompleteApprenticeshipSessionResponse = {
      success: true,
      session: mapApprenticeshipSession(updatedRow),
      progress,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Apprenticeship Complete] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
