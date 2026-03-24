import { NextRequest, NextResponse } from "next/server";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

interface RouteParams {
  params: Promise<{ modelKey: string; version: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { modelKey, version } = await params;

    const supabase = createPublicSupabaseClient();
    const registry = new SCMRegistryService(supabase);
    const modelAndVersion = await registry.getModelVersion(modelKey, version, { publicOnly: true });

    if (!modelAndVersion) {
      return NextResponse.json({ success: false, error: "Model version not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      model: modelAndVersion.model,
      version: modelAndVersion.version,
    });
  } catch (error) {
    console.error("[SCM Version API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch SCM model version" }, { status: 500 });
  }
}
