/**
 * Personality Metrics Types
 *
 * Metrics and validation criteria for measuring successful personality transformation
 * from Taoist-operational to Automated Scientist paradigm.
 */

/**
 * Overall personality metrics
 */
export interface PersonalityMetrics {
    // === Falsifiability Metrics ===
    /** Ratio of claims with falsification criteria */
    falsifiableClaimRatio: number;

    /** Rate of unfalsifiable claim rejection */
    unfalsifiableRejectionRate: number;

    // === Sycophancy Metrics ===
    /** Rate of sycophantic pattern detection */
    sycophancyDetectionRate: number;

    /** Rate of sycophancy elimination (after correction) */
    sycophancyEliminationRate: number;

    // === Scientific Method Compliance ===
    /** Coverage of observation phase in responses */
    observationPhaseCoverage: number;

    /** Coverage of hypothesis phase in responses */
    hypothesisPhaseCoverage: number;

    /** Coverage of prediction phase in responses */
    predictionPhaseCoverage: number;

    /** Coverage of test proposal in responses */
    testProposalCoverage: number;

    // === Causal Rigor ===
    /** Rate of claims with necessity validation */
    causalNecessityRate: number;

    /** Rate of claims with sufficiency validation */
    causalSufficiencyRate: number;

    /** Overall causal gate pass rate */
    causalGatePassRate: number;

    // === Axiom Compliance ===
    /** Rate of fatal axiom violations */
    axiomFatalViolationRate: number;

    /** Rate of axiom warnings */
    axiomWarningRate: number;

    /** Overall axiom gate pass rate */
    axiomGatePassRate: number;

    // === Active Investigation ===
    /** Rate of experiment proposals when uncertain */
    experimentProposalRate: number;

    /** Rate of responses with next step proposals */
    nextStepProposalRate: number;

    // === Transformation Progress ===
    /** Overall transformation score (0-1) */
    transformationScore: number;

    /** Timestamp of metrics collection */
    timestamp: string;
}

/**
 * Target thresholds for successful transformation
 */
export const TARGET_THRESHOLDS: Record<keyof Omit<PersonalityMetrics, "timestamp">, {
    target: number;
    minimum: number;
    description: string;
}> = {
    falsifiableClaimRatio: {
        target: 0.95,
        minimum: 0.85,
        description: "Ratio of claims with falsification criteria",
    },

    unfalsifiableRejectionRate: {
        target: 1.0,
        minimum: 0.95,
        description: "Rate of unfalsifiable claim rejection",
    },

    sycophancyDetectionRate: {
        target: 0.05,
        minimum: 0.05,
        description: "Rate of sycophantic pattern detection (lower is better)",
    },

    sycophancyEliminationRate: {
        target: 1.0,
        minimum: 0.90,
        description: "Rate of sycophancy elimination after correction",
    },

    observationPhaseCoverage: {
        target: 0.95,
        minimum: 0.85,
        description: "Coverage of observation phase in responses",
    },

    hypothesisPhaseCoverage: {
        target: 0.95,
        minimum: 0.85,
        description: "Coverage of hypothesis phase in responses",
    },

    predictionPhaseCoverage: {
        target: 0.90,
        minimum: 0.80,
        description: "Coverage of prediction phase in responses",
    },

    testProposalCoverage: {
        target: 0.85,
        minimum: 0.75,
        description: "Coverage of test proposal in responses",
    },

    causalNecessityRate: {
        target: 0.85,
        minimum: 0.70,
        description: "Rate of claims with necessity validation",
    },

    causalSufficiencyRate: {
        target: 0.75,
        minimum: 0.60,
        description: "Rate of claims with sufficiency validation",
    },

    causalGatePassRate: {
        target: 0.85,
        minimum: 0.75,
        description: "Overall causal gate pass rate",
    },

    axiomFatalViolationRate: {
        target: 0.0,
        minimum: 0.0,
        description: "Rate of fatal axiom violations (must be 0)",
    },

    axiomWarningRate: {
        target: 0.10,
        minimum: 0.10,
        description: "Rate of axiom warnings (lower is better)",
    },

    axiomGatePassRate: {
        target: 0.95,
        minimum: 0.85,
        description: "Overall axiom gate pass rate",
    },

    experimentProposalRate: {
        target: 0.80,
        minimum: 0.65,
        description: "Rate of experiment proposals when uncertain",
    },

    nextStepProposalRate: {
        target: 0.90,
        minimum: 0.80,
        description: "Rate of responses with next step proposals",
    },

    transformationScore: {
        target: 0.90,
        minimum: 0.75,
        description: "Overall transformation score (0-1)",
    },
};

/**
 * Single response metrics
 */
export interface ResponseMetrics {
    /** Response ID */
    responseId: string;

    /** Timestamp */
    timestamp: string;

    /** User question */
    question: string;

    /** Response length */
    responseLength: number;

    /** Falsifiability */
    hasFalsificationCriteria: boolean;
    falsifiableClaims: number;
    totalClaims: number;

    /** Sycophancy */
    sycophanticPatternsDetected: number;
    sycophanticPatternsRemoved: number;

    /** Scientific method */
    hasObservation: boolean;
    hasHypothesis: boolean;
    hasPrediction: boolean;
    hasTestProposal: boolean;
    hasNextStep: boolean;

    /** Causal validation */
    causalClaimsValidated: number;
    causalClaimsFailed: number;
    averageNecessityScore: number;
    averageSufficiencyScore: number;

    /** Axiom validation */
    axiomFatalViolations: number;
    axiomWarnings: number;
    axiomGatePassed: boolean;

    /** Confidence */
    statedConfidence: number | null;
    evidenceGroundedConfidence: number | null;
}

/**
 * Metrics collection result
 */
export interface MetricsCollectionResult {
    success: boolean;
    metrics: PersonalityMetrics;
    responseMetrics: ResponseMetrics[];
    summary: string;
    issues: string[];
    recommendations: string[];
}

/**
 * Calculate transformation score from individual metrics
 */
export function calculateTransformationScore(metrics: Partial<PersonalityMetrics>): number {
    const weights: Record<string, number> = {
        falsifiableClaimRatio: 0.15,
        sycophancyDetectionRate: 0.10, // Inverted - lower is better
        hypothesisPhaseCoverage: 0.10,
        testProposalCoverage: 0.10,
        causalGatePassRate: 0.15,
        axiomFatalViolationRate: 0.15, // Inverted - must be 0
        axiomGatePassRate: 0.10,
        experimentProposalRate: 0.15,
    };

    let score = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
        const value = metrics[key as keyof PersonalityMetrics];
        if (typeof value === "number") {
            // Invert metrics where lower is better
            let normalizedValue = value;
            if (key === "sycophancyDetectionRate" || key === "axiomFatalViolationRate" || key === "axiomWarningRate") {
                normalizedValue = 1 - value;
            }

            score += normalizedValue * weight;
            totalWeight += weight;
        }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Check if transformation targets are met
 */
export function checkTargetsMet(metrics: PersonalityMetrics): {
    met: boolean;
    failingMetrics: string[];
    warningMetrics: string[];
} {
    const failingMetrics: string[] = [];
    const warningMetrics: string[] = [];

    for (const [key, threshold] of Object.entries(TARGET_THRESHOLDS)) {
        const value = metrics[key as keyof PersonalityMetrics];
        if (typeof value !== "number") continue;

        // For rates where lower is better
        const isLowerBetter = key.includes("Detection") ||
            key.includes("Violation") ||
            key.includes("Warning");

        if (isLowerBetter) {
            if (value > threshold.target) {
                warningMetrics.push(`${key}: ${value.toFixed(2)} (target: <${threshold.target})`);
            }
            if (value > threshold.minimum) {
                failingMetrics.push(`${key}: ${value.toFixed(2)} (minimum: <${threshold.minimum})`);
            }
        } else {
            if (value < threshold.minimum) {
                failingMetrics.push(`${key}: ${value.toFixed(2)} (minimum: ${threshold.minimum})`);
            } else if (value < threshold.target) {
                warningMetrics.push(`${key}: ${value.toFixed(2)} (target: ${threshold.target})`);
            }
        }
    }

    return {
        met: failingMetrics.length === 0,
        failingMetrics,
        warningMetrics,
    };
}

/**
 * Generate metrics summary
 */
export function generateMetricsSummary(metrics: PersonalityMetrics): string {
    const targetCheck = checkTargetsMet(metrics);

    let summary = `# Personality Transformation Metrics\n\n`;
    summary += `**Transformation Score:** ${(metrics.transformationScore * 100).toFixed(1)}%\n`;
    summary += `**Status:** ${targetCheck.met ? "TARGETS MET" : "TARGETS NOT MET"}\n\n`;

    summary += `## Key Metrics\n\n`;
    summary += `| Metric | Value | Target | Status |\n`;
    summary += `|--------|-------|--------|--------|\n`;

    for (const [key, threshold] of Object.entries(TARGET_THRESHOLDS)) {
        const value = metrics[key as keyof PersonalityMetrics];
        if (typeof value !== "number") continue;

        const isLowerBetter = key.includes("Detection") ||
            key.includes("Violation") ||
            key.includes("Warning");

        const status = isLowerBetter
            ? (value <= threshold.target ? "OK" : value <= threshold.minimum ? "WARN" : "FAIL")
            : (value >= threshold.target ? "OK" : value >= threshold.minimum ? "WARN" : "FAIL");

        summary += `| ${key} | ${value.toFixed(2)} | ${threshold.target} | ${status} |\n`;
    }

    if (targetCheck.failingMetrics.length > 0) {
        summary += `\n## Failing Metrics\n\n`;
        for (const m of targetCheck.failingMetrics) {
            summary += `- ${m}\n`;
        }
    }

    if (targetCheck.warningMetrics.length > 0) {
        summary += `\n## Warning Metrics\n\n`;
        for (const m of targetCheck.warningMetrics) {
            summary += `- ${m}\n`;
        }
    }

    return summary;
}