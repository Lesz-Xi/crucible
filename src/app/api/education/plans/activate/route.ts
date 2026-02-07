import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ActivatePayload {
  planId: string;
  expectedGain?: number | null;
  confidence?: number | null;
  causalPath?: string[] | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ActivatePayload = await request.json();

    if (!body.planId) {
      return NextResponse.json({ success: false, error: "Missing planId" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: plan, error: planError } = await supabase
      .from("education_plans")
      .select("id, profile_id, source_intervention_id")
      .eq("id", body.planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ success: false, error: planError?.message || "Plan not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("education_plans")
      .update({ status: "active" })
      .eq("id", body.planId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    let assignmentCreated = false;
    if (plan.profile_id && plan.source_intervention_id) {
      const { error: assignmentError } = await supabase
        .from("intervention_assignments")
        .insert({
          profile_id: plan.profile_id,
          intervention_id: plan.source_intervention_id,
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

    return NextResponse.json({ success: true, assignmentCreated });
  } catch (error) {
    console.error("[Education Plan Activate] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
