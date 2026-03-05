import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { reportId } = params;

        if (!reportId) {
            return NextResponse.json({ error: "Missing reportId parameter." }, { status: 400 });
        }

        // 1. Fetch report metadata and JSON blob
        const { data: report, error } = await supabase
            .from("scm_reports")
            .select("*")
            .eq("report_id", reportId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({ error: "Report not found." }, { status: 404 });
            }
            throw error;
        }

        // 2. Return report payload
        return NextResponse.json(report.report_json);
    } catch (error) {
        console.error(`[SCM Report GET ${params.reportId}] Error:`, error);
        return NextResponse.json(
            { error: "Internal Server Error." },
            { status: 500 }
        );
    }
}
