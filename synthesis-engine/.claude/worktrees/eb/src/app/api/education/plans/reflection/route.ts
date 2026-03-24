import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ReflectionPayload {
  planId: string;
  mood: "low" | "mid" | "high";
  note?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReflectionPayload = await request.json();

    if (!body.planId || !body.mood) {
      return NextResponse.json({ success: false, error: "Missing reflection fields" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("education_plan_reflections")
      .insert({
        plan_id: body.planId,
        mood: body.mood,
        note: body.note ?? null
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Education Reflection] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}
