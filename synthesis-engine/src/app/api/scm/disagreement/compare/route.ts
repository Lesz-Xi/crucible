import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CausalDisagreementEngine,
  CompareDisagreementInput,
} from "@/lib/services/causal-disagreement-engine";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

export async function POST(request: NextRequest) {
  try {
    if (!FEATURE_FLAGS.DISAGREEMENT_ENGINE_ENABLED) {
      return NextResponse.json(
        { success: false, error: "Disagreement engine is disabled." },
        { status: 503 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CompareDisagreementInput;

    if (!body?.outcomeVar) {
      return NextResponse.json(
        { success: false, error: "`outcomeVar` is required." },
        { status: 400 }
      );
    }

    if (!body.leftModelRef && !body.leftSpec) {
      return NextResponse.json(
        { success: false, error: "Either leftModelRef or leftSpec must be provided." },
        { status: 400 }
      );
    }

    if (!body.rightModelRef && !body.rightSpec) {
      return NextResponse.json(
        { success: false, error: "Either rightModelRef or rightSpec must be provided." },
        { status: 400 }
      );
    }

    const registry = new SCMRegistryService(supabase);
    const engine = new CausalDisagreementEngine(registry);
    const report = await engine.compare(body);

    const leftModelKey = body.leftModelRef?.modelKey ?? body.leftSpec?.modelKey ?? "inline_left";
    const rightModelKey = body.rightModelRef?.modelKey ?? body.rightSpec?.modelKey ?? "inline_right";
    const leftVersion = body.leftModelRef?.version ?? body.leftSpec?.version ?? "current";
    const rightVersion = body.rightModelRef?.version ?? body.rightSpec?.version ?? "current";

    const { data: persistedReport, error: reportError } = await supabase
      .from("causal_disagreement_reports")
      .insert({
        user_id: user.id,
        left_model_key: leftModelKey,
        left_version: leftVersion,
        right_model_key: rightModelKey,
        right_version: rightVersion,
        outcome_var: body.outcomeVar,
        summary: report.summary,
        score: report.score,
        report_json: report,
      })
      .select("id")
      .single();

    if (reportError) {
      console.warn("[SCM Disagreement API] Failed to persist report:", reportError.message);
      return NextResponse.json({ success: true, report, persisted: false });
    }

    if (report.atoms.length > 0) {
      const atomsPayload = report.atoms.map((atom) => ({
        report_id: persistedReport.id,
        atom_type: atom.type,
        severity: atom.severity,
        variable: atom.variable ?? null,
        edge_from: atom.edge?.from ?? null,
        edge_to: atom.edge?.to ?? null,
        left_model_value: atom.leftModelValue,
        right_model_value: atom.rightModelValue,
        reason: atom.reason,
        epistemic_weight: atom.epistemicWeight,
      }));

      const { error: atomError } = await supabase
        .from("causal_disagreement_atoms")
        .insert(atomsPayload);

      if (atomError) {
        console.warn("[SCM Disagreement API] Failed to persist disagreement atoms:", atomError.message);
      }
    }

    return NextResponse.json({ success: true, report, reportId: persistedReport.id, persisted: true });
  } catch (error) {
    console.error("[SCM Disagreement API] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to compare SCM models" },
      { status: 500 }
    );
  }
}
