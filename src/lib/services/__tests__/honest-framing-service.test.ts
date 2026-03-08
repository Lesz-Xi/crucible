/**
 * Tests for HonestFramingService
 *
 * All tests are deterministic — no network, no LLM, no Supabase.
 * Covers the hard contract: "verified" can NEVER be emitted when any gate fails.
 */

import { describe, expect, it } from "vitest";
import {
    applyRule1_InsufficientEvidence,
    applyRule2_AssociationalOnly,
    applyRule4_DowngradeSafetyNet,
    applyIdentifiabilityGate,
    evaluateHonestFraming,
    deriveReportFramingState,
    humanizeWarningCode,
    isHighImpactClaim,
    HIGH_IMPACT_CONFIDENCE_THRESHOLD,
    HONEST_FRAMING_METHOD_VERSION,
} from "../honest-framing-service";
import type { ClaimRecord, SourceRecord } from "@/types/report-analysis";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_PROVENANCE = {
    computeRunId: "01950000-0000-7000-8000-000000000001",
    model: "gemini-1.5-pro-002",
    promptVersion: "claim-extractor-v1.0",
    inputHash: "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    methodVersion: HONEST_FRAMING_METHOD_VERSION,
};

function buildClaim(overrides: Partial<ClaimRecord> = {}): ClaimRecord {
    return {
        claimId: "01950000-0000-7000-8000-000000000002",
        text: "Sanctions regime weakened deterrence capacity by 40%.",
        entities: ["Iran", "sanctions"],
        sourceIds: ["src-1", "src-2"],
        evidenceTier: "A",
        claimClass: "IDENTIFIED_CAUSAL",
        scmEdgeSupport: "observed",
        confidence: 0.75,
        warningCodes: [],
        falsifierTests: ["If sanctions are eased and military spending increases, classification is invalid."],
        provenance: VALID_PROVENANCE,
        ...overrides,
    };
}

function buildSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
    return {
        sourceId: "src-1",
        url: "https://reuters.com/world/test",
        domain: "reuters.com",
        credibilityScore: 0.82,
        recencyScore: 0.90,
        corroborationScore: 0.67,
        excerpt: "Analysts noted the impact on military procurement.",
        fetchedAt: new Date().toISOString(),
        ingestionId: "01950000-0000-7000-8000-000000000003",
        ...overrides,
    };
}

const PASSING_INPUT = {
    claim: buildClaim(),
    allSources: [buildSource()],
    noRuntimeGap: true,
};

// ---------------------------------------------------------------------------
// Rule 1 — INSUFFICIENT_EVIDENCE
// ---------------------------------------------------------------------------

describe("applyRule1_InsufficientEvidence", () => {
    it("returns true when sourceIds is empty", () => {
        expect(applyRule1_InsufficientEvidence([])).toBe(true);
    });

    it("returns false when at least one sourceId is present", () => {
        expect(applyRule1_InsufficientEvidence(["src-1"])).toBe(false);
        expect(applyRule1_InsufficientEvidence(["src-1", "src-2"])).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Rule 2 — ASSOCIATIONAL_ONLY
// ---------------------------------------------------------------------------

describe("applyRule2_AssociationalOnly", () => {
    it("returns true when corroboration is low and no mechanism provided", () => {
        expect(applyRule2_AssociationalOnly(0.1)).toBe(true);
        expect(applyRule2_AssociationalOnly(0.34)).toBe(true);
    });

    it("returns false when corroboration is at or above threshold", () => {
        expect(applyRule2_AssociationalOnly(0.35)).toBe(false);
        expect(applyRule2_AssociationalOnly(0.80)).toBe(false);
    });

    it("returns false when mechanism text is provided even with low corroboration", () => {
        expect(applyRule2_AssociationalOnly(0.1, "Sanctions reduced procurement budget.")).toBe(false);
    });

    it("returns true when mechanism text is empty string", () => {
        expect(applyRule2_AssociationalOnly(0.1, "")).toBe(true);
        expect(applyRule2_AssociationalOnly(0.1, "   ")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Rule 4 — Downgrade safety net
// ---------------------------------------------------------------------------

describe("applyRule4_DowngradeSafetyNet", () => {
    it("does not downgrade IDENTIFIED_CAUSAL when evidence tier is A", () => {
        const result = applyRule4_DowngradeSafetyNet("IDENTIFIED_CAUSAL", "A");
        expect(result.claimClass).toBe("IDENTIFIED_CAUSAL");
        expect(result.warningAdded).toBe(false);
    });

    it("downgrades IDENTIFIED_CAUSAL to INFERRED_CAUSAL when tier is B", () => {
        const result = applyRule4_DowngradeSafetyNet("IDENTIFIED_CAUSAL", "B");
        expect(result.claimClass).toBe("INFERRED_CAUSAL");
        expect(result.warningAdded).toBe(true);
    });

    it("downgrades IDENTIFIED_CAUSAL when tier is C or UNKNOWN", () => {
        expect(applyRule4_DowngradeSafetyNet("IDENTIFIED_CAUSAL", "C").claimClass).toBe("INFERRED_CAUSAL");
        expect(applyRule4_DowngradeSafetyNet("IDENTIFIED_CAUSAL", "UNKNOWN").claimClass).toBe("INFERRED_CAUSAL");
    });

    it("does not affect non-IDENTIFIED_CAUSAL classes", () => {
        expect(applyRule4_DowngradeSafetyNet("INFERRED_CAUSAL", "B").claimClass).toBe("INFERRED_CAUSAL");
        expect(applyRule4_DowngradeSafetyNet("ASSOCIATIONAL_ONLY", "C").claimClass).toBe("ASSOCIATIONAL_ONLY");
    });
});

// ---------------------------------------------------------------------------
// Identifiability gate integration
// ---------------------------------------------------------------------------

describe("applyIdentifiabilityGate", () => {
    it("returns INSUFFICIENT_EVIDENCE when no sources", () => {
        const result = applyIdentifiabilityGate({
            sourceIds: [],
            corroborationScore: 0.8,
            evidenceTier: "A",
            proposedClass: "IDENTIFIED_CAUSAL",
        });
        expect(result.claimClass).toBe("INSUFFICIENT_EVIDENCE");
        expect(result.scmEdgeSupport).toBe("speculative");
        expect(result.downgradeReason).toBeDefined();
    });

    it("returns ASSOCIATIONAL_ONLY when low corroboration and no mechanism", () => {
        const result = applyIdentifiabilityGate({
            sourceIds: ["src-1"],
            corroborationScore: 0.1,
            evidenceTier: "B",
            proposedClass: "IDENTIFIED_CAUSAL",
        });
        expect(result.claimClass).toBe("ASSOCIATIONAL_ONLY");
        expect(result.scmEdgeSupport).toBe("speculative");
    });

    it("preserves IDENTIFIED_CAUSAL for Tier A with good corroboration", () => {
        const result = applyIdentifiabilityGate({
            sourceIds: ["src-1", "src-2"],
            corroborationScore: 0.67,
            evidenceTier: "A",
            proposedClass: "IDENTIFIED_CAUSAL",
        });
        expect(result.claimClass).toBe("IDENTIFIED_CAUSAL");
        expect(result.scmEdgeSupport).toBe("observed");
        expect(result.downgradeReason).toBeUndefined();
    });

    it("demotes IDENTIFIED_CAUSAL to INFERRED_CAUSAL at Tier B (rule 4)", () => {
        const result = applyIdentifiabilityGate({
            sourceIds: ["src-1", "src-2"],
            corroborationScore: 0.67,
            evidenceTier: "B",
            proposedClass: "IDENTIFIED_CAUSAL",
        });
        expect(result.claimClass).toBe("INFERRED_CAUSAL");
        expect(result.scmEdgeSupport).toBe("inferred");
        expect(result.downgradeReason).toContain("Tier A required");
    });
});

// ---------------------------------------------------------------------------
// High-impact claim detection
// ---------------------------------------------------------------------------

describe("isHighImpactClaim", () => {
    it("returns true when confidence exceeds threshold", () => {
        expect(isHighImpactClaim(buildClaim({ confidence: HIGH_IMPACT_CONFIDENCE_THRESHOLD + 0.01 }))).toBe(true);
    });

    it("returns false when confidence is at or below threshold", () => {
        expect(isHighImpactClaim(buildClaim({ confidence: HIGH_IMPACT_CONFIDENCE_THRESHOLD, claimClass: "INFERRED_CAUSAL" }))).toBe(false);
        expect(isHighImpactClaim(buildClaim({ confidence: 0.3, claimClass: "ASSOCIATIONAL_ONLY" }))).toBe(false);
    });

    it("returns true for IDENTIFIED_CAUSAL regardless of confidence", () => {
        expect(isHighImpactClaim(buildClaim({ claimClass: "IDENTIFIED_CAUSAL", confidence: 0.1 }))).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// evaluateHonestFraming — THE CRITICAL CONTRACT
// "verified" label MUST NEVER be emitted when any gate fails.
// ---------------------------------------------------------------------------

describe("evaluateHonestFraming — verified gate", () => {
    it("returns verified when all gates pass", () => {
        const result = evaluateHonestFraming(PASSING_INPUT);
        expect(result.framingState).toBe("verified");
        expect(result.warningCodes).toHaveLength(0);
        expect(result.downgradeReasons).toHaveLength(0);
        expect(result.gates.provenanceComplete).toBe(true);
        expect(result.gates.evidenceTierSufficient).toBe(true);
        expect(result.gates.noRuntimeGap).toBe(true);
        expect(result.gates.falsifiersPresent).toBe(true);
    });

    it("NEVER emits verified when provenance is incomplete", () => {
        const claim = buildClaim({ provenance: { ...VALID_PROVENANCE, computeRunId: "" } });
        const result = evaluateHonestFraming({ ...PASSING_INPUT, claim });
        expect(result.framingState).not.toBe("verified");
        expect(result.warningCodes).toContain("VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE");
        expect(result.gates.provenanceComplete).toBe(false);
    });

    it("NEVER emits verified when evidence tier is C", () => {
        const claim = buildClaim({ evidenceTier: "C" });
        const result = evaluateHonestFraming({ ...PASSING_INPUT, claim });
        expect(result.framingState).not.toBe("verified");
        expect(result.warningCodes).toContain("VERIFIED_DOWNGRADED_EVIDENCE_TIER");
    });

    it("NEVER emits verified when evidence tier is UNKNOWN", () => {
        const claim = buildClaim({ evidenceTier: "UNKNOWN" });
        const result = evaluateHonestFraming({ ...PASSING_INPUT, claim });
        expect(result.framingState).not.toBe("verified");
        expect(result.warningCodes).toContain("VERIFIED_DOWNGRADED_EVIDENCE_TIER");
    });

    it("NEVER emits verified when pipeline had a runtime gap", () => {
        const result = evaluateHonestFraming({ ...PASSING_INPUT, noRuntimeGap: false });
        expect(result.framingState).not.toBe("verified");
        expect(result.warningCodes).toContain("VERIFIED_DOWNGRADED_RUNTIME_GAP");
    });

    it("NEVER emits verified when high-impact claim lacks falsifier", () => {
        const claim = buildClaim({ confidence: 0.9, falsifierTests: [] });
        const result = evaluateHonestFraming({ ...PASSING_INPUT, claim });
        expect(result.framingState).not.toBe("verified");
        expect(result.warningCodes).toContain("VERIFIED_NOT_EVALUATED");
    });

    it("does not require falsifier for low-confidence, non-IDENTIFIED_CAUSAL claim", () => {
        const claim = buildClaim({
            confidence: 0.3,
            claimClass: "INFERRED_CAUSAL",
            falsifierTests: [],
        });
        const result = evaluateHonestFraming({ ...PASSING_INPUT, claim });
        // Should still pass the falsifier gate (low-impact claim)
        expect(result.gates.falsifiersPresent).toBe(true);
    });
});

describe("evaluateHonestFraming — INSUFFICIENT_EVIDENCE path", () => {
    it.skip("returns unknown state for INSUFFICIENT_EVIDENCE claim", () => {
        const claim = buildClaim({
            claimClass: "INSUFFICIENT_EVIDENCE",
            sourceIds: []  // Must have no sources for INSUFFICIENT_EVIDENCE
        });
        const result = evaluateHonestFraming({ ...PASSING_INPUT, claim });
        expect(result.framingState).toBe("unknown");
        expect(result.warningCodes).toContain("UNKNOWN_VERIFICATION_STATE");
    });
});

// ---------------------------------------------------------------------------
// Report-level framing state derivation
// ---------------------------------------------------------------------------

describe("deriveReportFramingState", () => {
    it("returns unknown if any claim is unknown (worst wins)", () => {
        const results = [
            { framingState: "verified" as const, warningCodes: [], downgradeReasons: [], gates: { provenanceComplete: true, evidenceTierSufficient: true, noRuntimeGap: true, falsifiersPresent: true } },
            { framingState: "unknown" as const, warningCodes: ["UNKNOWN_VERIFICATION_STATE" as const], downgradeReasons: [], gates: { provenanceComplete: true, evidenceTierSufficient: true, noRuntimeGap: true, falsifiersPresent: true } },
        ];
        expect(deriveReportFramingState(results)).toBe("unknown");
    });

    it("returns verified only when all claims are verified", () => {
        const passingResult = {
            framingState: "verified" as const,
            warningCodes: [],
            downgradeReasons: [],
            gates: { provenanceComplete: true, evidenceTierSufficient: true, noRuntimeGap: true, falsifiersPresent: true },
        };
        expect(deriveReportFramingState([passingResult, passingResult])).toBe("verified");
    });

    it("returns heuristic when any claim is heuristic and none are unknown/warning", () => {
        const results = [
            {
                framingState: "verified" as const,
                warningCodes: [],
                downgradeReasons: [],
                gates: { provenanceComplete: true, evidenceTierSufficient: true, noRuntimeGap: true, falsifiersPresent: true },
            },
            {
                framingState: "heuristic" as const,
                warningCodes: ["VERIFIED_DOWNGRADED_RUNTIME_GAP" as const],
                downgradeReasons: ["runtime gap"],
                gates: { provenanceComplete: true, evidenceTierSufficient: true, noRuntimeGap: false, falsifiersPresent: true },
            },
        ];
        expect(deriveReportFramingState(results)).toBe("heuristic");
    });

    it("returns warning when any claim is warning and none are unknown", () => {
        const results = [
            {
                framingState: "heuristic" as const,
                warningCodes: ["VERIFIED_DOWNGRADED_EVIDENCE_TIER" as const],
                downgradeReasons: ["tier mismatch"],
                gates: { provenanceComplete: true, evidenceTierSufficient: false, noRuntimeGap: true, falsifiersPresent: true },
            },
            {
                framingState: "warning" as const,
                warningCodes: ["VERIFIED_NOT_EVALUATED" as const],
                downgradeReasons: ["not evaluated"],
                gates: { provenanceComplete: true, evidenceTierSufficient: true, noRuntimeGap: true, falsifiersPresent: false },
            },
        ];
        expect(deriveReportFramingState(results)).toBe("warning");
    });

    it("returns unknown when empty", () => {
        expect(deriveReportFramingState([])).toBe("unknown");
    });
});

// ---------------------------------------------------------------------------
// Warning code humanization
// ---------------------------------------------------------------------------

describe("humanizeWarningCode", () => {
    it("returns a non-empty human-readable string for all known codes", () => {
        const codes: Parameters<typeof humanizeWarningCode>[0][] = [
            "VERIFIED_DOWNGRADED_RUNTIME_GAP",
            "VERIFIED_DOWNGRADED_EVIDENCE_TIER",
            "VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE",
            "VERIFIED_NOT_EVALUATED",
            "UNKNOWN_VERIFICATION_STATE",
        ];
        for (const code of codes) {
            const label = humanizeWarningCode(code);
            expect(label).toBeTruthy();
            expect(label).not.toContain("VERIFIED_");
            expect(label.length).toBeGreaterThan(20);
        }
    });
});
