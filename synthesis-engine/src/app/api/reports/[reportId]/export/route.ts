import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SCMGroundedReport } from "@/types/report-analysis";

function toMarkdown(report: SCMGroundedReport): string {
  const lines: string[] = [];
  lines.push(`# SCM Grounded Report`);
  lines.push("");
  lines.push(`- **Report ID:** ${report.meta.reportId}`);
  lines.push(`- **Query:** ${report.meta.query}`);
  lines.push(`- **Causal Depth:** ${report.meta.causalDepth}`);
  lines.push(`- **Generated At:** ${report.meta.generatedAt}`);
  lines.push("");

  lines.push(`## Executive Summary`);
  lines.push("");
  for (const item of report.executiveSummary || []) lines.push(`- ${item}`);
  lines.push("");

  lines.push(`## Primary Hypotheses`);
  lines.push("");
  for (const h of report.primaryHypotheses || []) {
    lines.push(`- **${h.text}** (confidence: ${h.confidence.toFixed?.(2) ?? h.confidence}, class: ${h.claimClass})`);
  }
  lines.push("");

  lines.push(`## Counter Hypotheses`);
  lines.push("");
  for (const h of report.counterHypotheses || []) {
    lines.push(`- **${h.text}** — ${h.rationale}`);
  }
  lines.push("");

  lines.push(`## Decision Guidance`);
  lines.push("");
  lines.push(`### Safe to Conclude`);
  for (const item of report.decisionGuidance?.safeConclude || []) lines.push(`- ${item}`);
  lines.push("");
  lines.push(`### Not Safe to Conclude`);
  for (const item of report.decisionGuidance?.notSafeConclude || []) lines.push(`- ${item}`);
  lines.push("");

  lines.push(`## Unknowns & Gaps`);
  lines.push("");
  for (const item of report.unknownsAndGaps || []) lines.push(`- ${item}`);
  lines.push("");

  lines.push(`## Falsifier Checklist`);
  lines.push("");
  for (const item of report.falsifierChecklist || []) {
    lines.push(`- [${item.window}] claim=${item.claimId} :: ${item.test}`);
  }
  lines.push("");

  lines.push(`## Sources`);
  lines.push("");
  for (const s of report.sources || []) {
    lines.push(`- ${s.domain} — ${s.url}`);
  }
  lines.push("");

  lines.push(`## Claims`);
  lines.push("");
  for (const c of report.claims || []) {
    lines.push(`- (${c.claimClass} | ${c.evidenceTier} | ${c.confidence.toFixed?.(2) ?? c.confidence}) ${c.text}`);
  }

  return lines.join("\n");
}

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
      const markdown = toMarkdown(report);
      return new Response(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="scm-report-${reportId}.md"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error(`[SCM Report Export] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error." }, { status: 500 });
  }
}
