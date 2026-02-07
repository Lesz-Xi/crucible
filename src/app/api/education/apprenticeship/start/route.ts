import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildWeekProgress,
  getCurrentWeekStartIso,
  mapApprenticeshipSession,
} from "@/lib/services/education-apprenticeship";
import { StartApprenticeshipRequest, StartApprenticeshipResponse } from "@/types/education";

export async function POST(request: NextRequest) {
  try {
    const body: StartApprenticeshipRequest = await request.json();
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Resolve plan (existing or create-and-activate)
    let activePlanId: string | null = null;

    if (body.planId) {
      const { data: existingPlan } = await supabase
        .from("education_plans")
        .select("id")
        .eq("id", body.planId)
        .eq("user_id", user.id)
        .single();

      if (existingPlan?.id) {
        activePlanId = existingPlan.id;
        await supabase
          .from("education_plans")
          .update({ status: "active" })
          .eq("id", activePlanId)
          .eq("user_id", user.id);
      }
    }

    if (!activePlanId) {
      let profileId: string | null = null;
      if (body.studentId) {
        const { data: profile } = await supabase
          .from("student_causal_profiles")
          .select("id")
          .eq("student_pseudonym", body.studentId)
          .single();

        profileId = profile?.id ?? null;
      }

      let interventionId: string | null = null;
      if (body.interventionId) {
        const { data: intervention } = await supabase
          .from("interventions_library")
          .select("id")
          .eq("id", body.interventionId)
          .single();

        interventionId = intervention?.id ?? null;
      }

      const { data: newPlan, error: planError } = await supabase
        .from("education_plans")
        .insert({
          user_id: user.id,
          profile_id: profileId,
          source_intervention_id: interventionId,
          title: "Causal Apprenticeship Lab",
          status: "active",
          target_node: body.focusNode ?? null,
          steps: [
            "Block two 25-minute lab sessions this week.",
            "Practice using your top intervention protocol.",
            "Capture one mood + one reflection per session.",
          ],
          analysis_snapshot: {
            mode: "causal_apprenticeship",
            interventionName: body.interventionName ?? null,
            createdAt: new Date().toISOString(),
          },
        })
        .select("id, profile_id, source_intervention_id")
        .single();

      if (planError || !newPlan?.id) {
        return NextResponse.json(
          { success: false, error: planError?.message || "Failed to create apprenticeship plan" },
          { status: 500 }
        );
      }

      activePlanId = newPlan.id;

      // Align with full integration: create assignment when possible (idempotent-ish)
      if (newPlan.profile_id && newPlan.source_intervention_id) {
        const { data: existingAssignment } = await supabase
          .from("intervention_assignments")
          .select("id")
          .eq("profile_id", newPlan.profile_id)
          .eq("intervention_id", newPlan.source_intervention_id)
          .in("status", ["pending", "active"])
          .limit(1)
          .maybeSingle();

        if (!existingAssignment?.id) {
          await supabase.from("intervention_assignments").insert({
            profile_id: newPlan.profile_id,
            intervention_id: newPlan.source_intervention_id,
            assigned_by: user.id,
            assignment_reason: "causal_apprenticeship_start",
            status: "active",
            started_at: new Date().toISOString(),
          });
        }
      }
    }

    if (!activePlanId) {
      return NextResponse.json({ success: false, error: "Unable to resolve active plan" }, { status: 500 });
    }

    const weekStart = getCurrentWeekStartIso();

    const seedRows = [1, 2].map((sessionNumber) => ({
      plan_id: activePlanId,
      user_id: user.id,
      session_number: sessionNumber,
      week_start: weekStart,
      duration_minutes: 25,
      status: "pending",
      focus_node: body.focusNode ?? null,
      intervention_name: body.interventionName ?? null,
    }));

    const { error: seedError } = await supabase
      .from("education_apprenticeship_sessions")
      .upsert(seedRows, { onConflict: "plan_id,week_start,session_number" });

    if (seedError) {
      return NextResponse.json({ success: false, error: seedError.message }, { status: 500 });
    }

    const { data: sessionRows, error: sessionError } = await supabase
      .from("education_apprenticeship_sessions")
      .select("*")
      .eq("plan_id", activePlanId)
      .eq("week_start", weekStart)
      .order("session_number", { ascending: true });

    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
    }

    const sessions = (sessionRows ?? []).map(mapApprenticeshipSession);
    const progress = buildWeekProgress(weekStart, sessions);

    const response: StartApprenticeshipResponse = {
      success: true,
      planId: activePlanId,
      sessions,
      progress,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Apprenticeship Start] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
