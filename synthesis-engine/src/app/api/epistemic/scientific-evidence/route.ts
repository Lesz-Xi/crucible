import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRecentScientificEvidence } from "@/lib/science/epistemic-data-bridge";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return NextResponse.json({ evidence: [] }, { status: 200 });
    }

    const evidence = await getRecentScientificEvidence(userId, 5);
    return NextResponse.json({ evidence }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        evidence: [],
        error: error instanceof Error ? error.message : "Failed to load scientific evidence",
      },
      { status: 500 },
    );
  }
}
