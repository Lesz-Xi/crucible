import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ScientificIntegrityService } from "@/lib/services/scientific-integrity-service";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

export async function GET() {
  try {
    if (!FEATURE_FLAGS.SCIENTIFIC_INTEGRITY_GATE_ENABLED) {
      return NextResponse.json(
        { success: false, error: "Scientific integrity gate is disabled." },
        { status: 503 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createServerSupabaseAdminClient();
    const integrityService = new ScientificIntegrityService(adminSupabase);
    const status = await integrityService.getStatus();

    const { data: signoffs, error: signoffError } = await adminSupabase
      .from("scm_integrity_signoffs")
      .select("id,decision,rationale,override_used,status_snapshot,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (signoffError) {
      return NextResponse.json(
        { success: false, error: `Failed to load integrity signoff history: ${signoffError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
      signoffs: signoffs ?? [],
    });
  } catch (error) {
    console.error("[SCM Integrity Dashboard API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load scientific integrity dashboard",
      },
      { status: 500 }
    );
  }
}
