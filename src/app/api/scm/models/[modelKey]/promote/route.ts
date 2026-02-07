import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { CausalDisagreementEngine } from "@/lib/services/causal-disagreement-engine";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { evaluateSCMPromotionGate } from "@/lib/services/scm-promotion-governance";
import { ScientificIntegrityService } from "@/lib/services/scientific-integrity-service";
import { SCMPromotionRequest, SCMPromotionResponse } from "@/types/scm";

interface RouteParams {
  params: Promise<{ modelKey: string }>;
}

function normalizeInterventions(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (!FEATURE_FLAGS.DISAGREEMENT_ENGINE_ENABLED || !FEATURE_FLAGS.SCM_PROMOTION_GUARD_ENABLED) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: "SCM promotion guard is disabled." },
        { status: 503 }
      );
    }

    const { modelKey } = await params;
    if (!modelKey?.trim()) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: "`modelKey` route parameter is required." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SCMPromotionRequest;
    const candidateVersion = body?.candidateVersion?.trim();
    const baselineVersionInput = body?.baselineVersion?.trim();
    const outcomeVar = body?.outcomeVar?.trim();
    const interventions = normalizeInterventions(body?.interventions);
    const override = body?.override
      ? {
          approvedBy: body.override.approvedBy?.trim() || user.id,
          rationale: body.override.rationale?.trim() || "",
        }
      : undefined;

    if (!candidateVersion) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: "`candidateVersion` is required." },
        { status: 400 }
      );
    }

    if (!outcomeVar) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: "`outcomeVar` is required for pre-promotion disagreement audit." },
        { status: 400 }
      );
    }

    const adminSupabase = createServerSupabaseAdminClient();
    const registry = new SCMRegistryService(adminSupabase);
    const baselineModelAndVersion = await registry.getModelVersion(modelKey, baselineVersionInput || undefined);
    const candidateModelAndVersion = await registry.getModelVersion(modelKey, candidateVersion);

    if (!candidateModelAndVersion) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: `Candidate version not found: ${modelKey}@${candidateVersion}` },
        { status: 404 }
      );
    }

    if (!baselineModelAndVersion) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: `Baseline version not found for model key ${modelKey}` },
        { status: 404 }
      );
    }

    const baselineVersion = baselineModelAndVersion.version.version;
    if (baselineVersion === candidateVersion) {
      return NextResponse.json<SCMPromotionResponse>(
        {
          success: false,
          error: "Candidate version already matches baseline/current version. No promotion needed.",
        },
        { status: 400 }
      );
    }

    const disagreementEngine = new CausalDisagreementEngine(registry);
    const report = await disagreementEngine.compare({
      leftModelRef: { modelKey, version: baselineVersion },
      rightModelRef: { modelKey, version: candidateVersion },
      outcomeVar,
      interventions,
    });

    const gate = evaluateSCMPromotionGate({
      report,
      crossDomain:
        baselineModelAndVersion.model.domain.toLowerCase() !==
        candidateModelAndVersion.model.domain.toLowerCase(),
      override,
    });

    const integrityStatus = FEATURE_FLAGS.SCIENTIFIC_INTEGRITY_GATE_ENABLED
      ? await new ScientificIntegrityService(adminSupabase).getStatus()
      : undefined;
    const integrityBlocked = FEATURE_FLAGS.SCIENTIFIC_INTEGRITY_GATE_ENABLED
      ? Boolean(integrityStatus?.freezePromotion)
      : false;
    const promotionBlocked = gate.blocked || integrityBlocked;
    const blockReason = integrityBlocked
      ? "Promotion frozen by M6 scientific integrity gate: one or more required checks are failing."
      : gate.reason;

    const { data: persistedReport, error: reportError } = await supabase
      .from("causal_disagreement_reports")
      .insert({
        user_id: user.id,
        left_model_key: modelKey,
        left_version: baselineVersion,
        right_model_key: modelKey,
        right_version: candidateVersion,
        outcome_var: outcomeVar,
        summary: report.summary,
        score: report.score,
        report_json: report,
      })
      .select("id")
      .single();

    if (reportError) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: `Failed to persist disagreement report: ${reportError.message}` },
        { status: 500 }
      );
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
        console.warn("[SCM Promotion API] Failed to persist disagreement atoms:", atomError.message);
      }
    }

    const overrideApprovedBy = gate.overrideUsed ? user.id : null;

    const { data: auditRecord, error: auditError } = await supabase
      .from("scm_model_promotion_audits")
      .insert({
        user_id: user.id,
        model_id: candidateModelAndVersion.model.id,
        model_key: modelKey,
        candidate_version: candidateVersion,
        baseline_version: baselineVersion,
        disagreement_report_id: persistedReport.id,
        outcome_var: outcomeVar,
        interventions,
        cross_domain: gate.requiredAlignmentCoverage >= 0.95,
        alignment_coverage: gate.alignmentCoverage,
        required_alignment_coverage: gate.requiredAlignmentCoverage,
        high_severity_atoms: gate.highSeverityAtoms,
        medium_severity_atoms: gate.mediumSeverityAtoms,
        low_severity_atoms: gate.lowSeverityAtoms,
        unresolved_high_atoms: gate.unresolvedHighSeverityAtoms,
        blocked: promotionBlocked,
        override_used: gate.overrideUsed,
        override_rationale: gate.overrideUsed ? override?.rationale : null,
        override_approved_by: overrideApprovedBy,
        decision_reason: blockReason,
        gate_json: {
          promotionGate: gate,
          integrityStatus: integrityStatus ?? null,
        },
      })
      .select("id")
      .single();

    if (auditError) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: `Failed to persist promotion governance audit: ${auditError.message}` },
        { status: 500 }
      );
    }

    if (promotionBlocked) {
      return NextResponse.json<SCMPromotionResponse>(
        {
          success: false,
          promoted: false,
          modelKey,
          baselineVersion,
          candidateVersion,
          reportId: persistedReport.id,
          auditId: auditRecord.id,
          gate,
          integrityStatus,
          report,
          error: blockReason,
        },
        { status: 409 }
      );
    }

    const modelId = candidateModelAndVersion.model.id;
    const { error: clearCurrentError } = await adminSupabase
      .from("scm_model_versions")
      .update({ is_current: false })
      .eq("model_id", modelId)
      .eq("is_current", true);

    if (clearCurrentError) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: `Failed to clear current SCM version: ${clearCurrentError.message}` },
        { status: 500 }
      );
    }

    const { error: promoteError } = await adminSupabase
      .from("scm_model_versions")
      .update({ is_current: true })
      .eq("model_id", modelId)
      .eq("version", candidateVersion);

    if (promoteError) {
      return NextResponse.json<SCMPromotionResponse>(
        { success: false, error: `Failed to promote SCM version: ${promoteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json<SCMPromotionResponse>({
      success: true,
      promoted: true,
      modelKey,
      baselineVersion,
      candidateVersion,
      reportId: persistedReport.id,
      auditId: auditRecord.id,
      gate,
      integrityStatus,
      report,
    });
  } catch (error) {
    console.error("[SCM Promotion API] Error:", error);
    return NextResponse.json<SCMPromotionResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to evaluate SCM promotion gate",
      },
      { status: 500 }
    );
  }
}
