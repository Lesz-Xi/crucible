import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SCMGroundedReport } from "@/types/report-analysis";
import { generateSCMReportMarkdown } from "@/lib/services/scm-report-export";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { reportId } = await params;

    const body = await req.json().catch(() => ({}));
    const format = body.format || "json";

    if (!reportId) {
      return NextResponse.json({ error: "Missing reportId parameter." }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from("scm_reports")
      .select("report_json")
      .eq("report_id", reportId)
      .single();

    if (error || !row?.report_json) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const report = row.report_json as SCMGroundedReport;

    if (format === "markdown") {
      const markdown = generateSCMReportMarkdown(report, {
        includeProvenance: true,
        includeRawJSON: false,
      });

      // Generate friendly filename from query
      const querySlug = report.meta.query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 50);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `scm-report-${querySlug}-${timestamp}.md`;

      return new Response(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error(`[SCM Report Export] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error." }, { status: 500 });
  }
}
