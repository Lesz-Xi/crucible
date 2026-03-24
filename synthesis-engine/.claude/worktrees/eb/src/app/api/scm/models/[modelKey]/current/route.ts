import { NextRequest, NextResponse } from "next/server";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

interface RouteParams {
  params: Promise<{ modelKey: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { modelKey } = await params;

    const supabase = createPublicSupabaseClient();
    const registry = new SCMRegistryService(supabase);
    const modelAndVersion = await registry.getModelVersion(modelKey, undefined, { publicOnly: true });

    if (!modelAndVersion) {
      return NextResponse.json({ success: false, error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      model: modelAndVersion.model,
      version: modelAndVersion.version,
    });
  } catch (error) {
    console.error("[SCM Current Model API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch current model version" }, { status: 500 });
  }
}
