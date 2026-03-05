/**
 * HonestFramingService — SCM-Grounded Report Analysis
 *
 * Pure, deterministic policy evaluator for honest framing of causal claims.
 * No LLM calls, no Supabase — fully unit-testable.
 *
 * @version 1.0.0
 * @methodVersion honest-framing-v1.0
 */

import {
    ClaimRecord,
    ClaimClass,
    EvidenceTier,
    HonestFramingResult,
    HonestFramingState,
    SCMEdgeSupport,
    SourceRecord,
    WarningCode,
    WARNING_CODE_LABELS,
} from "@/types/report-analysis";

export const HONEST_FRAMING_METHOD_VERSION = "honest-framing-v1.0" as const;

const CORROBORATION_THRESHOLD = 0.35;
const MIN_SOURCE_COUNT = 1;
export const HIGH_IMPACT_CONFIDENCE_THRESHOLD = 0.6;

export interface IdentifiabilityGateResult {
    claimClass: ClaimClass;
    scmEdgeSupport: SCMEdgeSupport;
    downgradeReason?: string;
}

export function applyRule1_InsufficientEvidence(sourceIds: string[]): boolean {
    return sourceIds.length < MIN_SOURCE_COUNT;
}

export function applyRule2_AssociationalOnly(
    corroborationScore: number,
    mechanismText?: string
): boolean {
    const hasMechanism =
        mechanismText !== undefined &&
        mechanismText.trim().length > 0;
    return corroborationScore < CORROBORATION_THRESHOLD && !hasMechanism;
}

export function applyRule4_DowngradeSafetyNet(
    proposedClass: ClaimClass,
    evidenceTier: EvidenceTier
): { claimClass: ClaimClass; warningAdded: boolean } {
    if (proposedClass === "IDENTIFIED_CAUSAL" && evidenceTier !== "A") {
        return { claimClass: "INFERRED_CAUSAL", warningAdded: true };
    }
    return { claimClass: proposedClass, warningAdded: false };
}

export function applyIdentifiabilityGate(params: {
    sourceIds: string[];
    corroborationScore: number;
    evidenceTier: EvidenceTier;
    proposedClass: ClaimClass;
    mechanismText?: string;
}): IdentifiabilityGateResult {
    const { sourceIds, corroborationScore, evidenceTier, proposedClass, mechanismText } = params;

    if (applyRule1_InsufficientEvidence(sourceIds)) {
        return {
            claimClass: "INSUFFICIENT_EVIDENCE",
            scmEdgeSupport: "speculative",
            downgradeReason: `Claim has fewer than ${MIN_SOURCE_COUNT} supporting source(s).`,
        };
    }

    if (applyRule2_AssociationalOnly(corroborationScore, mechanismText)) {
        return {
            claimClass: "ASSOCIATIONAL_ONLY",
            scmEdgeSupport: "speculative",
            downgradeReason: `Corroboration score (${corroborationScore.toFixed(2)}) is below threshold (${CORROBORATION_THRESHOLD}) and no mechanism is specified.`,
        };
    }

    const { claimClass, warningAdded } = applyRule4_DowngradeSafetyNet(proposedClass, evidenceTier);

    const scmEdgeSupport: SCMEdgeSupport =
        claimClass === "IDENTIFIED_CAUSAL"
            ? "observed"
            : claimClass === "INFERRED_CAUSAL"
                ? "inferred"
                : "speculative";

    return {
        claimClass,
        scmEdgeSupport,
        downgradeReason: warningAdded
            ? `Proposed IDENTIFIED_CAUSAL downgraded to INFERRED_CAUSAL: evidence tier is "${evidenceTier}" (Tier A required for verified causal identification).`
            : undefined,
    };
}

export interface HonestFramingInput {
    claim: ClaimRecord;
    allSources: SourceRecord[];
    noRuntimeGap: boolean;
}

export function isHighImpactClaim(claim: ClaimRecord): boolean {
    return (
        claim.confidence > HIGH_IMPACT_CONFIDENCE_THRESHOLD ||
        claim.claimClass === "IDENTIFIED_CAUSAL"
    );
}

export function evaluateHonestFraming(
    input: HonestFramingInput
): HonestFramingResult {
    const { claim, noRuntimeGap } = input;
    const warnings: WarningCode[] = [];
    const downgradeReasons: string[] = [];

    const provenanceComplete =
        Boolean(claim.provenance?.computeRunId) &&
        Boolean(claim.provenance?.model) &&
        Boolean(claim.provenance?.promptVersion) &&
        Boolean(claim.provenance?.inputHash) &&
        Boolean(claim.provenance?.methodVersion);

    if (!provenanceComplete) {
        warnings.push("VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE");
        downgradeReasons.push(
            "Claim provenance is incomplete; one or more M6.2 trace fields are missing."
        );
    }

    const evidenceTierSufficient =
        claim.evidenceTier === "A" || claim.evidenceTier === "B";

    if (!evidenceTierSufficient) {
        warnings.push("VERIFIED_DOWNGRADED_EVIDENCE_TIER");
        downgradeReasons.push(
            `Evidence tier is "${claim.evidenceTier}"; Tier A or B is required for a verified label.`
        );
    }

    if (!noRuntimeGap) {
        warnings.push("VERIFIED_DOWNGRADED_RUNTIME_GAP");
        downgradeReasons.push(
            "Pipeline ran with a retrieval gap (Brave API unavailable or partial); conclusions may be incomplete."
        );
    }

    const requiresFalsifier = isHighImpactClaim(claim);
    const falsifiersPresent =
        !requiresFalsifier || (claim.falsifierTests && claim.falsifierTests.length > 0);

    if (!falsifiersPresent) {
        warnings.push("VERIFIED_NOT_EVALUATED");
        downgradeReasons.push(
            `High-impact claim (confidence=${claim.confidence.toFixed(2)}, class=${claim.claimClass}) is missing required falsifier test(s).`
        );
    }

    const allGatesPass =
        provenanceComplete &&
        evidenceTierSufficient &&
        noRuntimeGap &&
        falsifiersPresent;

    let framingState: HonestFramingState;

    if (allGatesPass) {
        framingState = "verified";
    } else if (
        claim.claimClass === "INSUFFICIENT_EVIDENCE"
    ) {
        framingState = "unknown";
        if (!warnings.includes("UNKNOWN_VERIFICATION_STATE")) {
            warnings.push("UNKNOWN_VERIFICATION_STATE");
        }
        downgradeReasons.push("Insufficient evidence — no verified conclusion is available.");
    } else {
        framingState = warnings.length > 0 ? "heuristic" : "warning";
    }

    return {
        framingState,
        warningCodes: warnings,
        downgradeReasons,
        gates: {
            provenanceComplete,
            evidenceTierSufficient,
            noRuntimeGap,
            falsifiersPresent,
        },
    };
}

export function deriveReportFramingState(
    claimResults: HonestFramingResult[]
): HonestFramingState {
    if (claimResults.length === 0) return "unknown";

    const states = new Set(claimResults.map((r) => r.framingState));

    if (states.has("unknown")) return "unknown";
    if (states.has("warning")) return "warning";
    if (states.has("heuristic")) return "heuristic";
    return "verified";
}

export function humanizeWarningCode(code: WarningCode): string {
    return WARNING_CODE_LABELS[code] ?? "An unknown verification issue was detected.";
}

export class HonestFramingService {
    // Singleton pattern for DI
    private static instance: HonestFramingService;

    public static getInstance(): HonestFramingService {
        if (!HonestFramingService.instance) {
            HonestFramingService.instance = new HonestFramingService();
        }
        return HonestFramingService.instance;
    }

    evaluateClaim(input: HonestFramingInput): HonestFramingResult {
        return evaluateHonestFraming(input);
    }

    deriveReportState(results: HonestFramingResult[]): HonestFramingState {
        return deriveReportFramingState(results);
    }
}
