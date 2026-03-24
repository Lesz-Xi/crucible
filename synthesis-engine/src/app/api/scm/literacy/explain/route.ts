import { NextRequest, NextResponse } from "next/server";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { buildLiteracyExplanation } from "@/lib/services/causal-literacy";
import { CausalLiteracyRequest, CausalUserLevel } from "@/types/scm";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

const VALID_LEVELS: CausalUserLevel[] = ["novice", "intermediate", "expert"];

function isValidLevel(level: unknown): level is CausalUserLevel {
  return typeof level === "string" && VALID_LEVELS.includes(level as CausalUserLevel);
}

export async function POST(request: NextRequest) {
  try {
    if (!FEATURE_FLAGS.CAUSAL_LITERACY_ENABLED) {
      return NextResponse.json(
        { success: false, error: "Causal literacy mode is disabled." },
        { status: 503 }
      );
    }

    const supabase = createPublicSupabaseClient();

    const body = (await request.json()) as CausalLiteracyRequest;

    if (!body?.modelKey || !isValidLevel(body.userLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body. `modelKey` and `userLevel` are required.",
        },
        { status: 400 }
      );
    }

    const registry = new SCMRegistryService(supabase);
    const modelAndVersion = await registry.getModelVersion(body.modelKey, body.version, {
      publicOnly: true,
    });

    if (!modelAndVersion) {
      return NextResponse.json(
        { success: false, error: `Model not found for key ${body.modelKey}` },
        { status: 404 }
      );
    }

    const explanation = buildLiteracyExplanation({
      model: modelAndVersion.model,
      modelVersion: modelAndVersion.version,
      request: body,
    });

    return NextResponse.json(explanation);
  } catch (error) {
    console.error("[SCM Literacy API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate causal literacy explanation" },
      { status: 500 }
    );
  }
}
