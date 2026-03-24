import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { selectLatestAlignmentAuditReport } from "@/lib/services/alignment-audit";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams;
    const modelKey = search.get("modelKey") || "alignment_bias_scm";
    const scope = search.get("scope") || "global";

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("alignment_audit_reports")
      .select("id, model_key, model_version, scope, source, created_at, report_json")
      .eq("model_key", modelKey)
      .eq("scope", scope)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const latest = selectLatestAlignmentAuditReport(data as any[]);
    if (!latest) {
      return NextResponse.json({ success: true, report: null });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: latest.id,
        modelKey: latest.modelKey,
        modelVersion: latest.modelVersion,
        scope: latest.scope,
        source: latest.source,
        createdAt: latest.createdAt,
        payload: latest.report,
      },
    });
  } catch (error) {
    console.error("[Alignment Audit Latest API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alignment audit report" },
      { status: 500 }
    );
  }
}
