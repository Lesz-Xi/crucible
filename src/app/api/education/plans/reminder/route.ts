import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ReminderPayload {
  planId: string;
  dayOfWeek: string;
  timeLocal: string;
  timezone: string;
  enabled: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReminderPayload = await request.json();

    if (!body.planId || !body.dayOfWeek || !body.timeLocal || !body.timezone) {
      return NextResponse.json({ success: false, error: "Missing reminder fields" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("education_plan_reminders")
      .upsert({
        plan_id: body.planId,
        day_of_week: body.dayOfWeek,
        time_local: body.timeLocal,
        timezone: body.timezone,
        enabled: body.enabled
      }, { onConflict: "plan_id" });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Education Reminder] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
