import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";

export type AllowedOutputClass =
  | "association_only"
  | "intervention_inferred"
  | "intervention_supported";

export interface InterventionGateInput {
  treatment: string;
  outcome: string;
  adjustmentSet?: string[];
  knownConfounders?: string[];
}

export interface InterventionGateResult {
  allowed: boolean;
  allowedOutputClass: AllowedOutputClass;
  rationale: string;
  identifiability: {
    identifiable: boolean;
    requiredConfounders: string[];
    adjustmentSet: string[];
    missingConfounders: string[];
    note: string;
  };
}

function sanitizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

export function evaluateInterventionGate(
  scm: StructuralCausalModel,
  input: InterventionGateInput
): InterventionGateResult {
  const treatment = typeof input.treatment === "string" ? input.treatment.trim() : "";
  const outcome = typeof input.outcome === "string" ? input.outcome.trim() : "";
  const adjustmentSet = sanitizeList(input.adjustmentSet);
  const knownConfounders = sanitizeList(input.knownConfounders);

  if (!treatment || !outcome) {
    return {
      allowed: false,
      allowedOutputClass: "association_only",
      rationale: "Treatment and outcome are required for identifiability checks.",
      identifiability: {
        identifiable: false,
        requiredConfounders: knownConfounders,
        adjustmentSet,
        missingConfounders: knownConfounders,
        note: "Insufficient inputs for identifiability check.",
      },
    };
  }

  const identifiability = scm.checkIdentifiability({
    treatment,
    outcome,
    adjustmentSet,
    knownConfounders,
  });

  if (identifiability.identifiable) {
    return {
      allowed: true,
      allowedOutputClass: "intervention_supported",
      rationale: "Backdoor confounders are controlled for intervention claims.",
      identifiability,
    };
  }

  const hasPartialControls = adjustmentSet.length > 0 || knownConfounders.length > 0;
  return {
    allowed: false,
    allowedOutputClass: hasPartialControls ? "intervention_inferred" : "association_only",
    rationale: hasPartialControls
      ? "Intervention semantics are degraded because required confounders are missing."
      : "No confounder controls provided; intervention claims must downgrade to association.",
    identifiability,
  };
}
