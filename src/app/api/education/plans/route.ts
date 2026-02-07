import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PlanReminderPayload {
  dayOfWeek: string;
  timeLocal: string;
  timezone: string;
  enabled: boolean;
}

interface CreatePlanPayload {
  studentId?: string;
  title: string;
  status?: "draft" | "active" | "completed" | "archived";
  targetNode?: string;
  steps: string[];
  interventionId?: string | null;
  expectedGain?: number | null;
  confidence?: number | null;
  causalPath?: string[] | null;
  analysisSnapshot?: Record<string, any> | null;
  reminder?: PlanReminderPayload | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlanPayload = await request.json();

    if (!body.title || !body.steps || !Array.isArray(body.steps)) {
      return NextResponse.json({ success: false, error: "Missing required fields: title, steps" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Lookup student profile (optional)
    let profileId: string | null = null;
    if (body.studentId) {
      const { data: profile } = await supabase
        .from("student_causal_profiles")
        .select("id")
        .eq("student_pseudonym", body.studentId)
        .single();

      profileId = profile?.id ?? null;
    }

    // Validate intervention (optional)
    let validatedInterventionId: string | null = null;
    if (body.interventionId) {
      const { data: intervention } = await supabase
        .from("interventions_library")
        .select("id")
        .eq("id", body.interventionId)
        .single();

      validatedInterventionId = intervention?.id ?? null;
    }

    const { data: plan, error: planError } = await supabase
      .from("education_plans")
      .insert({
        user_id: user.id,
        profile_id: profileId,
        source_intervention_id: validatedInterventionId,
        title: body.title,
        status: body.status ?? "draft",
        target_node: body.targetNode,
        steps: body.steps,
        analysis_snapshot: body.analysisSnapshot ?? null
      })
      .select("id")
      .single();

    if (planError || !plan) {
      return NextResponse.json({ success: false, error: planError?.message || "Failed to create plan" }, { status: 500 });
    }

    let assignmentCreated = false;
    if (body.status === "active" && profileId && validatedInterventionId) {
      const { error: assignmentError } = await supabase
        .from("intervention_assignments")
        .insert({
          profile_id: profileId,
          intervention_id: validatedInterventionId,
          assigned_by: user.id,
          assignment_reason: "apply_this_week",
          expected_gain: body.expectedGain ?? null,
          confidence: body.confidence ?? null,
          causal_path: body.causalPath ?? null,
          status: "active",
          started_at: new Date().toISOString()
        });

      if (!assignmentError) {
        assignmentCreated = true;
      }
    }

    if (body.reminder) {
      await supabase
        .from("education_plan_reminders")
        .upsert({
          plan_id: plan.id,
          day_of_week: body.reminder.dayOfWeek,
          time_local: body.reminder.timeLocal,
          timezone: body.reminder.timezone,
          enabled: body.reminder.enabled
        }, { onConflict: "plan_id" });
    }

    return NextResponse.json({
      success: true,
      planId: plan.id,
      assignmentCreated
    });
  } catch (error) {
    console.error("[Education Plans] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
