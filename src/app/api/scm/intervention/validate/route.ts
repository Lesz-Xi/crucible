import { NextRequest, NextResponse } from "next/server";
import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import { evaluateInterventionGate } from "@/lib/services/identifiability-gate";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import {
  InterventionValidateRequest,
  InterventionValidateResponse,
} from "@/types/scm";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function extractDagNodes(version: { dagJson?: { nodes?: Array<Record<string, unknown>> } }) {
  return Array.isArray(version?.dagJson?.nodes) ? version.dagJson.nodes : [];
}

function extractDagEdges(version: { dagJson?: { edges?: Array<Record<string, unknown>> } }) {
  return Array.isArray(version?.dagJson?.edges) ? version.dagJson.edges : [];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InterventionValidateRequest;
    const modelKey = body?.modelRef?.modelKey;
    const version = body?.modelRef?.version;
    const treatment = body?.treatment;
    const outcome = body?.outcome;

    if (!isNonEmptyString(modelKey)) {
      return NextResponse.json<InterventionValidateResponse>(
        {
          success: false,
          allowed: false,
          allowedOutputClass: "association_only",
          rationale: "Invalid request.",
          error: "`modelRef.modelKey` is required.",
        },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(treatment) || !isNonEmptyString(outcome)) {
      return NextResponse.json<InterventionValidateResponse>(
        {
          success: false,
          allowed: false,
          allowedOutputClass: "association_only",
          rationale: "Invalid request.",
          error: "`treatment` and `outcome` are required.",
        },
        { status: 400 }
      );
    }

    const supabase = createPublicSupabaseClient();
    const registry = new SCMRegistryService(supabase);
    const modelAndVersion = await registry.getModelVersion(modelKey, version, {
      publicOnly: true,
    });

    if (!modelAndVersion) {
      return NextResponse.json<InterventionValidateResponse>(
        {
          success: false,
          allowed: false,
          allowedOutputClass: "association_only",
          rationale: "Model lookup failed.",
          error: `Model not found for key ${modelKey}`,
        },
        { status: 404 }
      );
    }

    const scm = new StructuralCausalModel();
    const nodes = extractDagNodes(modelAndVersion.version) as any[];
    const edges = extractDagEdges(modelAndVersion.version) as any[];
    if (nodes.length > 0 || edges.length > 0) {
      scm.hydrate(nodes, edges);
    }

    const gate = evaluateInterventionGate(scm, {
      treatment,
      outcome,
      adjustmentSet: body.adjustmentSet,
      knownConfounders: body.knownConfounders,
    });

    return NextResponse.json<InterventionValidateResponse>({
      success: true,
      allowed: gate.allowed,
      allowedOutputClass: gate.allowedOutputClass,
      rationale: gate.rationale,
      modelRef: {
        modelKey: modelAndVersion.model.modelKey,
        version: modelAndVersion.version.version,
      },
      identifiability: gate.identifiability,
    });
  } catch (error) {
    console.error("[SCM Intervention Gate API] Error:", error);
    return NextResponse.json<InterventionValidateResponse>(
      {
        success: false,
        allowed: false,
        allowedOutputClass: "association_only",
        rationale: "Intervention gate failed.",
        error: "Failed to validate intervention identifiability.",
      },
      { status: 500 }
    );
  }
}
