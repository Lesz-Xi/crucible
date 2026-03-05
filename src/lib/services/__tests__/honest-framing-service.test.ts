import { describe, expect, it } from "vitest";
import { evaluateHonestFraming } from "@/lib/services/honest-framing-service";

const baseClaim: any = {
  claimId: "c1",
  text: "X causes Y",
  entities: ["X", "Y"],
  sourceIds: ["s1"],
  evidenceTier: "A",
  claimClass: "IDENTIFIED_CAUSAL",
  scmEdgeSupport: "observed",
  confidence: 0.9,
  warningCodes: [],
  falsifierTests: ["If Y does not change after X intervention in 30d"],
  provenance: {
    computeRunId: "run-1",
    model: "gemini-2.5-flash",
    promptVersion: "v1",
    inputHash: "abc",
    methodVersion: "m1",
  },
};

describe("evaluateHonestFraming", () => {
  it("returns verified only when all gates pass", () => {
    const res = evaluateHonestFraming({
      claim: baseClaim,
      allSources: [],
      noRuntimeGap: true,
    });

    expect(res.framingState).toBe("verified");
    expect(res.warningCodes).toEqual([]);
    expect(res.gates.provenanceComplete).toBe(true);
    expect(res.gates.evidenceTierSufficient).toBe(true);
    expect(res.gates.noRuntimeGap).toBe(true);
    expect(res.gates.falsifiersPresent).toBe(true);
  });

  it("downgrades when provenance is incomplete", () => {
    const claim = {
      ...baseClaim,
      provenance: { ...baseClaim.provenance, model: "" },
    };

    const res = evaluateHonestFraming({ claim, allSources: [], noRuntimeGap: true });

    expect(res.framingState).not.toBe("verified");
    expect(res.warningCodes).toContain("VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE");
  });

  it("downgrades high-impact claim with missing falsifier tests", () => {
    const claim = { ...baseClaim, falsifierTests: [] };

    const res = evaluateHonestFraming({ claim, allSources: [], noRuntimeGap: true });

    expect(res.framingState).not.toBe("verified");
    expect(res.warningCodes).toContain("VERIFIED_NOT_EVALUATED");
    expect(res.gates.falsifiersPresent).toBe(false);
  });

  it("returns unknown for INSUFFICIENT_EVIDENCE claims", () => {
    const claim = {
      ...baseClaim,
      claimClass: "INSUFFICIENT_EVIDENCE",
      sourceIds: [],
      evidenceTier: "UNKNOWN",
      confidence: 0.1,
    };

    const res = evaluateHonestFraming({ claim, allSources: [], noRuntimeGap: false });

    expect(res.framingState).toBe("unknown");
    expect(res.warningCodes).toContain("UNKNOWN_VERIFICATION_STATE");
  });
});
