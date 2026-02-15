import { describe, expect, it } from "vitest";
import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import { evaluateInterventionGate } from "../identifiability-gate";

function buildConfoundedScm(): StructuralCausalModel {
  const scm = new StructuralCausalModel();
  scm.hydrate(
    [
      { name: "Confounder", type: "exogenous", domain: "abstract" },
      { name: "Treatment", type: "intervention", domain: "abstract" },
      { name: "Outcome", type: "observable", domain: "abstract" },
    ] as any[],
    [
      { from: "Confounder", to: "Treatment", constraint: "causality", reversible: false },
      { from: "Confounder", to: "Outcome", constraint: "causality", reversible: false },
      { from: "Treatment", to: "Outcome", constraint: "causality", reversible: false },
    ] as any[]
  );
  return scm;
}

describe("evaluateInterventionGate", () => {
  it("blocks intervention claims when required confounders are missing", () => {
    const result = evaluateInterventionGate(buildConfoundedScm(), {
      treatment: "Treatment",
      outcome: "Outcome",
      adjustmentSet: [],
      knownConfounders: ["Confounder"],
    });

    expect(result.allowed).toBe(false);
    expect(result.allowedOutputClass).toBe("intervention_inferred");
    expect(result.identifiability.identifiable).toBe(false);
    expect(result.identifiability.missingConfounders).toContain("Confounder");
  });

  it("allows intervention claims when adjustment set closes backdoor confounders", () => {
    const result = evaluateInterventionGate(buildConfoundedScm(), {
      treatment: "Treatment",
      outcome: "Outcome",
      adjustmentSet: ["Confounder"],
      knownConfounders: ["Confounder"],
    });

    expect(result.allowed).toBe(true);
    expect(result.allowedOutputClass).toBe("intervention_supported");
    expect(result.identifiability.identifiable).toBe(true);
    expect(result.identifiability.missingConfounders).toEqual([]);
  });

  it("downgrades to association_only when no controls are provided", () => {
    const result = evaluateInterventionGate(buildConfoundedScm(), {
      treatment: "Treatment",
      outcome: "Outcome",
    });

    expect(result.allowed).toBe(false);
    expect(result.allowedOutputClass).toBe("association_only");
    expect(result.identifiability.identifiable).toBe(false);
  });
});
