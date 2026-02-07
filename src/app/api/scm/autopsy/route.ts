import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { CausalAutopsyMode } from "@/lib/services/causal-autopsy-mode";
import { PersistenceService } from "@/lib/db/persistence-service";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { CausalAutopsyRequest } from "@/types/scm";

export async function POST(request: NextRequest) {
  try {
    if (!FEATURE_FLAGS.AUTOPSY_MODE_ENABLED) {
      return NextResponse.json(
        { success: false, error: "Autopsy mode is disabled." },
        { status: 503 }
      );
    }

    // NOTE: This app uses passcode-based access control (AccessKeyGate),
    // not Supabase authentication. Autopsy uses service-role access on the server.
    const supabaseAdmin = createServerSupabaseAdminClient();
    const userId = "system";

    const payload = (await request.json()) as CausalAutopsyRequest;
    if (!payload?.modelKey && !payload?.domain) {
      return NextResponse.json(
        { success: false, error: "`modelKey` or `domain` is required." },
        { status: 400 }
      );
    }

    const registry = new SCMRegistryService(supabaseAdmin);
    const autopsy = new CausalAutopsyMode({
      registry,
      persistence: new PersistenceService(),
    });

    const resolveAutopsyModelKey = async () => {
      if (payload.modelKey) {
        const direct = await registry.getModelVersion(payload.modelKey, payload.version);
        if (direct) {
          return { modelKey: direct.model.modelKey, version: direct.version.version };
        }
      }

      const domain = payload.domain || payload.modelKey;
      if (domain) {
        const byDomain = await registry.getCurrentModelByDomain(domain);
        if (byDomain) {
          return { modelKey: byDomain.model.modelKey, version: byDomain.version.version };
        }
      }

      return null;
    };

    const resolved = await resolveAutopsyModelKey();
    if (!resolved) {
      return NextResponse.json(
        {
          success: false,
          error: `No canonical SCM model for domain ${payload.domain || payload.modelKey}. Autopsy requires a registry model.`,
        },
        { status: 404 }
      );
    }

    const report = await autopsy.run({
      ...payload,
      modelKey: resolved.modelKey,
      version: payload.version || resolved.version,
      domain: payload.domain || payload.modelKey,
    });

    const { data: persisted, error: persistError } = await supabaseAdmin
      .from("causal_autopsy_reports")
      .insert({
        user_id: userId,
        run_id: payload.runId ?? null,
        model_key: report.modelRef.modelKey,
        model_version: report.modelRef.version,
        failure_title: payload.failureEvent?.title ?? null,
        root_causes: report.rootCauses,
        symptoms: report.symptoms,
        failed_assumptions: report.failedAssumptions,
        necessity_scores: report.necessityScores,
        prevention_plan: report.preventionPlan,
        report_json: report,
      })
      .select("id")
      .single();

    if (persistError) {
      console.warn("[SCM Autopsy API] Unable to persist autopsy report:", persistError.message);
      return NextResponse.json({ success: true, report, persisted: false });
    }

    if (report.preventionPlan.length > 0) {
      const actionsPayload = report.preventionPlan.map((action, index) => ({
        report_id: persisted.id,
        action_order: index + 1,
        action_type: index === 0 ? "intervene" : index === report.preventionPlan.length - 1 ? "monitor" : "validate",
        target_node: report.rootCauses[index] ?? report.rootCauses[0] ?? null,
        rationale: action,
      }));

      const { error: actionError } = await supabaseAdmin
        .from("causal_autopsy_actions")
        .insert(actionsPayload);

      if (actionError) {
        console.warn("[SCM Autopsy API] Unable to persist autopsy actions:", actionError.message);
      }
    }

    return NextResponse.json({
      success: true,
      report,
      reportId: persisted.id,
      persisted: true,
    });
  } catch (error) {
    console.error("[SCM Autopsy API] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to run autopsy mode" },
      { status: 500 }
    );
  }
}
