import { NextResponse } from "next/server";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

export async function GET() {
  try {
    const supabase = createPublicSupabaseClient();
    const registry = new SCMRegistryService(supabase);
    const models = await registry.listModels({ publicOnly: true });

    return NextResponse.json({ success: true, models });
  } catch (error) {
    console.error("[SCM Models API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to list SCM models" }, { status: 500 });
  }
}
