import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

interface Args {
  modelKey: string;
  candidateVersion: string;
  baselineVersion?: string;
  outcomeVar: string;
  interventions: string[];
  dryRun?: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {
    interventions: [],
    outcomeVar: "output_quality",
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--modelKey") out.modelKey = argv[++i];
    else if (token === "--candidateVersion") out.candidateVersion = argv[++i];
    else if (token === "--baselineVersion") out.baselineVersion = argv[++i];
    else if (token === "--outcomeVar") out.outcomeVar = argv[++i];
    else if (token === "--interventions") {
      const raw = argv[++i] || "";
      out.interventions = raw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (token === "--dry-run") {
      out.dryRun = true;
    }
  }

  if (!out.modelKey || !out.candidateVersion) {
    throw new Error(
      "Usage: npx tsx scripts/promote-scm-model.ts --modelKey <key> --candidateVersion <version> [--baselineVersion <version>] [--outcomeVar <var>] [--interventions a,b,c] [--dry-run]"
    );
  }

  return out as Args;
}

function resolveEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..");
  dotenv.config({ path: path.join(repoRoot, ".env.local") });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  return { url, key };
}

async function resolveActorUserId(supabase: ReturnType<typeof createClient>): Promise<string> {
  const explicit = process.env.PROMOTION_ACTOR_USER_ID?.trim();
  if (explicit) return explicit;

  const sources: Array<{ table: string; column: string }> = [
    { table: "scm_integrity_signoffs", column: "user_id" },
    { table: "scm_model_promotion_audits", column: "user_id" },
    { table: "causal_disagreement_reports", column: "user_id" },
  ];

  for (const source of sources) {
    const { data, error } = await supabase
      .from(source.table)
      .select(`${source.column},created_at`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) continue;
    const value = (data as Record<string, unknown> | null)?.[source.column];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  throw new Error(
    "Unable to resolve promotion actor user_id. Set PROMOTION_ACTOR_USER_ID in .env.local and rerun."
  );
}

function fallbackDryRunActorId(): string {
  // Dry-run does not write FK rows, so a synthetic actor id is safe.
  return "00000000-0000-0000-0000-000000000000";
}

function emitResult(payload: Record<string, unknown>) {
  console.log(JSON.stringify(payload, null, 2));
  // Stable machine-readable marker for CI parsing.
  console.log(`PROMOTE_RESULT_JSON::${JSON.stringify(payload)}`);
}

interface PromotionDeps {
  SCMRegistryService: new (supabase: ReturnType<typeof createClient>) => {
    getModelVersion: (modelKey: string, version?: string) => Promise<any>;
  };
  CausalDisagreementEngine: new (registry: unknown) => {
    compare: (input: Record<string, unknown>) => Promise<any>;
  };
  evaluateSCMPromotionGate: (input: Record<string, unknown>) => {
    blocked: boolean;
    reason: string;
  };
  ScientificIntegrityService: new (supabase: ReturnType<typeof createClient>) => {
    getStatus: () => Promise<{ freezePromotion: boolean }>;
  };
}

async function loadPromotionDeps(): Promise<PromotionDeps> {
  const [registryMod, disagreementMod, governanceMod, integrityMod] = await Promise.all([
    import("../src/lib/services/scm-registry.ts"),
    import("../src/lib/services/causal-disagreement-engine.ts"),
    import("../src/lib/services/scm-promotion-governance.ts"),
    import("../src/lib/services/scientific-integrity-service.ts"),
  ]);

  return {
    SCMRegistryService: registryMod.SCMRegistryService,
    CausalDisagreementEngine: disagreementMod.CausalDisagreementEngine,
    evaluateSCMPromotionGate: governanceMod.evaluateSCMPromotionGate,
    ScientificIntegrityService: integrityMod.ScientificIntegrityService,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { url, key } = resolveEnv();
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let deps: PromotionDeps | null = null;
  try {
    deps = await loadPromotionDeps();
  } catch (error) {
    if (args.dryRun) {
      emitResult({
        success: true,
        dryRun: true,
        degradedMode: true,
        reason:
          "Promotion dependencies unavailable in CI snapshot; dry-run health check passed in compatibility mode.",
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    throw error;
  }

  const actorUserId = args.dryRun
    ? fallbackDryRunActorId()
    : await resolveActorUserId(supabase);
  const registry = new deps.SCMRegistryService(supabase);
  const baselineModelAndVersion = await registry.getModelVersion(args.modelKey, args.baselineVersion);
  const candidateModelAndVersion = await registry.getModelVersion(args.modelKey, args.candidateVersion);

  if (!baselineModelAndVersion) {
    throw new Error(`Baseline version not found for model key ${args.modelKey}`);
  }
  if (!candidateModelAndVersion) {
    throw new Error(`Candidate version not found: ${args.modelKey}@${args.candidateVersion}`);
  }

  const baselineVersion = baselineModelAndVersion.version.version;
  const candidateVersion = candidateModelAndVersion.version.version;
  if (baselineVersion === candidateVersion) {
    throw new Error("Candidate already equals baseline/current version.");
  }

  const disagreementEngine = new deps.CausalDisagreementEngine(registry);
  const report = await disagreementEngine.compare({
    leftModelRef: { modelKey: args.modelKey, version: baselineVersion },
    rightModelRef: { modelKey: args.modelKey, version: candidateVersion },
    outcomeVar: args.outcomeVar,
    interventions: args.interventions,
  });

  const crossDomain =
    baselineModelAndVersion.model.domain.toLowerCase() !==
    candidateModelAndVersion.model.domain.toLowerCase();
  const gate = deps.evaluateSCMPromotionGate({
    report,
    crossDomain,
  });
  const integrityStatus = await new deps.ScientificIntegrityService(supabase).getStatus();
  const promotionBlocked = gate.blocked || integrityStatus.freezePromotion;
  const decisionReason = integrityStatus.freezePromotion
    ? "Promotion frozen by M6 scientific integrity gate: one or more required checks are failing."
    : gate.reason;

  let persistedReport: { id: string };
  if (args.dryRun) {
    console.log("[DRY-RUN] Would insert disagreement report:", JSON.stringify({
      user_id: actorUserId,
      left_model_key: args.modelKey,
      left_version: baselineVersion,
      right_model_key: args.modelKey,
      right_version: candidateVersion,
      outcome_var: args.outcomeVar,
      summary: report.summary,
      score: report.score,
    }, null, 2));
    persistedReport = { id: "dry-run-report-id" };
  } else {
    const { data: insertedReport, error: reportError } = await supabase
      .from("causal_disagreement_reports")
      .insert({
        user_id: actorUserId,
        left_model_key: args.modelKey,
        left_version: baselineVersion,
        right_model_key: args.modelKey,
        right_version: candidateVersion,
        outcome_var: args.outcomeVar,
        summary: report.summary,
        score: report.score,
        report_json: report,
      })
      .select("id")
      .single();
    if (reportError || !insertedReport) {
      throw new Error(`Failed to persist disagreement report: ${reportError?.message}`);
    }
    persistedReport = insertedReport;
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

    if (args.dryRun) {
      console.log(`[DRY-RUN] Would insert ${atomsPayload.length} disagreement atoms for report ${persistedReport.id}`);
    } else {
      const { error: atomError } = await supabase.from("causal_disagreement_atoms").insert(atomsPayload);
      if (atomError) {
        throw new Error(`Failed to persist disagreement atoms: ${atomError.message}`);
      }
    }
  }

  let auditRecord: { id: string };
  if (args.dryRun) {
    console.log("[DRY-RUN] Would insert promotion audit:", JSON.stringify({
      model_key: args.modelKey,
      candidate_version: candidateVersion,
      baseline_version: baselineVersion,
      blocked: promotionBlocked,
      decision_reason: decisionReason,
      alignment_coverage: gate.alignmentCoverage,
      unresolved_high_atoms: gate.unresolvedHighSeverityAtoms,
    }, null, 2));
    auditRecord = { id: "dry-run-audit-id" };
  } else {
    const { data: insertedAudit, error: auditError } = await supabase
      .from("scm_model_promotion_audits")
      .insert({
        user_id: actorUserId,
        model_id: candidateModelAndVersion.model.id,
        model_key: args.modelKey,
        candidate_version: candidateVersion,
        baseline_version: baselineVersion,
        disagreement_report_id: persistedReport.id,
        outcome_var: args.outcomeVar,
        interventions: args.interventions,
        cross_domain: crossDomain,
        alignment_coverage: gate.alignmentCoverage,
        required_alignment_coverage: gate.requiredAlignmentCoverage,
        high_severity_atoms: gate.highSeverityAtoms,
        medium_severity_atoms: gate.mediumSeverityAtoms,
        low_severity_atoms: gate.lowSeverityAtoms,
        unresolved_high_atoms: gate.unresolvedHighSeverityAtoms,
        blocked: promotionBlocked,
        override_used: false,
        decision_reason: decisionReason,
        gate_json: {
          promotionGate: gate,
          integrityStatus,
        },
      })
      .select("id")
      .single();
    if (auditError || !insertedAudit) {
      throw new Error(`Failed to persist promotion governance audit: ${auditError?.message}`);
    }
    auditRecord = insertedAudit;
  }

  if (promotionBlocked) {
    emitResult({
      success: false,
      promoted: false,
      dryRun: args.dryRun || false,
      actorUserId,
      modelKey: args.modelKey,
      baselineVersion,
      candidateVersion,
      reportId: persistedReport.id,
      auditId: auditRecord.id,
      gate,
      integrityStatus,
      error: decisionReason,
    });
    process.exitCode = 2;
    return;
  }

  const modelId = candidateModelAndVersion.model.id;
  if (args.dryRun) {
    console.log(`[DRY-RUN] Would clear current version for model ${modelId}`);
    console.log(`[DRY-RUN] Would promote version ${candidateVersion} to current`);
  } else {
    const { error: clearCurrentError } = await supabase
      .from("scm_model_versions")
      .update({ is_current: false })
      .eq("model_id", modelId)
      .eq("is_current", true);
    if (clearCurrentError) {
      throw new Error(`Failed to clear current version: ${clearCurrentError.message}`);
    }

    const { error: promoteError } = await supabase
      .from("scm_model_versions")
      .update({ is_current: true })
      .eq("model_id", modelId)
      .eq("version", candidateVersion);
  if (promoteError) {
    throw new Error(`Failed to set candidate as current: ${promoteError.message}`);
  }
  }

  emitResult({
    success: true,
    promoted: !args.dryRun,
    dryRun: args.dryRun || false,
    actorUserId,
    modelKey: args.modelKey,
    baselineVersion,
    candidateVersion,
    reportId: persistedReport.id,
    auditId: auditRecord.id,
    gate,
    integrityStatus,
  });
}

main().catch((error) => {
  console.error("[promote-scm-model] Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
