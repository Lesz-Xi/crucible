import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ScientificIntegrityService } from "@/lib/services/scientific-integrity-service";
import {
  ScientificIntegritySignoffRequest,
  ScientificIntegritySignoffResponse,
} from "@/types/scm";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

export async function POST(request: NextRequest) {
  try {
    if (!FEATURE_FLAGS.SCIENTIFIC_INTEGRITY_GATE_ENABLED) {
      return NextResponse.json<ScientificIntegritySignoffResponse>(
        { success: false, error: "Scientific integrity gate is disabled." },
        { status: 503 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ScientificIntegritySignoffResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ScientificIntegritySignoffRequest;
    const decision = body?.decision;
    const rationale = typeof body?.rationale === "string" ? body.rationale.trim() : "";
    const override = body?.override === true;

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json<ScientificIntegritySignoffResponse>(
        { success: false, error: "`decision` must be either `approved` or `rejected`." },
        { status: 400 }
      );
    }

    if (rationale.length < 16) {
      return NextResponse.json<ScientificIntegritySignoffResponse>(
        { success: false, error: "`rationale` must be at least 16 characters." },
        { status: 400 }
      );
    }

    const adminSupabase = createServerSupabaseAdminClient();
    const integrityService = new ScientificIntegrityService(adminSupabase);
    const status = await integrityService.getStatus();

    if (decision === "approved" && !status.overallPass && !override) {
      return NextResponse.json<ScientificIntegritySignoffResponse>(
        {
          success: false,
          status,
          error:
            "Integrity signoff cannot be approved while required checks are failing. Provide override=true with explicit rationale if emergency approval is required.",
        },
        { status: 409 }
      );
    }

    const signoffId = await integrityService.createSignoff(
      user.id,
      { decision, rationale, override },
      status
    );

    return NextResponse.json<ScientificIntegritySignoffResponse>({
      success: true,
      signoffId,
      status,
    });
  } catch (error) {
    console.error("[SCM Integrity Signoff API] Error:", error);
    return NextResponse.json<ScientificIntegritySignoffResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit integrity signoff",
      },
      { status: 500 }
    );
  }
}
