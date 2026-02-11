import { NextRequest, NextResponse } from "next/server";
import { PersistenceService } from "@/lib/db/persistence-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("id");
    const persistence = new PersistenceService();

    if (runId) {
      // Fetch specific run details
      const details = await persistence.getRunDetails(runId, user.id);
      if (!details) {
        return NextResponse.json({ error: "Run not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, run: details });
    } else {
      // Fetch list of runs
      const history = await persistence.getHistoricalRuns(20, user.id);
      return NextResponse.json({ success: true, history });
    }
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch synthesis history" },
      { status: 500 }
    );
  }
}
