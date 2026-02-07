import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildWeekProgress,
  getCurrentWeekStartIso,
  mapApprenticeshipSession,
} from "@/lib/services/education-apprenticeship";
import { ActiveApprenticeshipResponse } from "@/types/education";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: plan, error: planError } = await supabase
      .from("education_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) {
      return NextResponse.json({ success: false, error: planError.message }, { status: 500 });
    }

    if (!plan?.id) {
      const empty: ActiveApprenticeshipResponse = {
        success: true,
        sessions: [],
      };
      return NextResponse.json(empty);
    }

    const weekStart = getCurrentWeekStartIso();

    const { data: sessionRows, error: sessionError } = await supabase
      .from("education_apprenticeship_sessions")
      .select("*")
      .eq("plan_id", plan.id)
      .eq("week_start", weekStart)
      .order("session_number", { ascending: true });

    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
    }

    const sessions = (sessionRows ?? []).map(mapApprenticeshipSession);
    const progress = buildWeekProgress(weekStart, sessions);

    const response: ActiveApprenticeshipResponse = {
      success: true,
      planId: plan.id,
      sessions,
      progress,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Apprenticeship Active] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
