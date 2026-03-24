import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CounterfactualTraceResponse } from "@/types/scm";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ traceId: string }> }
) {
  try {
    const { traceId } = await context.params;
    if (!UUID_PATTERN.test(traceId)) {
      return NextResponse.json<CounterfactualTraceResponse>(
        {
          success: false,
          error: "Invalid traceId format.",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("counterfactual_traces")
      .select("trace_json")
      .eq("id", traceId)
      .single();

    if (error || !data?.trace_json) {
      return NextResponse.json<CounterfactualTraceResponse>(
        {
          success: false,
          error: "Counterfactual trace not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<CounterfactualTraceResponse>({
      success: true,
      trace: data.trace_json,
    });
  } catch (error) {
    console.error("[Counterfactual Trace API] Error:", error);
    return NextResponse.json<CounterfactualTraceResponse>(
      {
        success: false,
        error: "Failed to fetch counterfactual trace.",
      },
      { status: 500 }
    );
  }
}
