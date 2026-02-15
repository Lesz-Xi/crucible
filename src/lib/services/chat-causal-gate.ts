/**
 * Chat Causal Gate Service
 *
 * Integrates causal reasoning primitives from but-for-analyzer.ts into chat response pipelines.
 * Validates causal claims through necessity and sufficiency analysis.
 */

import { ButForAnalyzer } from './but-for-analyzer';

/**
 * Result of causal validation
 */
export interface CausalValidationResult {
    /** Is the action necessary for the outcome? */
    isNecessary: boolean;

    /** Is the action sufficient for the outcome? */
    isSufficient: boolean;

    /** Overall confidence in causal claim */
    confidence: number;

    /** Necessity score (0-1) */
    necessityScore: number;

    /** Sufficiency score (0-1) */
    sufficiencyScore: number;

    /** Counterfactual scenario description */
    counterfactualScenario?: string;

    /** Reasoning for the determination */
    reasoning?: string;

    /** Whether validation passed minimum threshold */
    passed: boolean;

    /** Gate status */
    gateStatus: "pass" | "warning" | "fail";
}

/**
 * Options for causal gate
 */
export interface CausalGateOptions {
    /** Minimum necessity score to pass (default: 0.5) */
    minNecessity?: number;

    /** Minimum sufficiency score to pass (default: 0.3) */
    minSufficiency?: number;

    /** Require both necessity AND sufficiency (default: false) */
    requireBoth?: boolean;

    /** Fail on uncertain results (default: false) */
    failOnUncertain?: boolean;
}

/**
 * Extracted causal claim from text
 */
export interface ExtractedCausalClaim {
    /** The action/intervention being claimed */
    action: string;

    /** The outcome being claimed */
    outcome: string;

    /** The claim text */
    claimText: string;

    /** Confidence in extraction */
    extractionConfidence: number;
}

/**
 * Chat Causal Gate - validates causal claims in chat responses
 */
export class ChatCausalGate {
    private analyzer: ButForAnalyzer;
    private defaultOptions: CausalGateOptions = {
        minNecessity: 0.5,
        minSufficiency: 0.3,
        requireBoth: false,
        failOnUncertain: false,
    };

    constructor() {
        this.analyzer = new ButForAnalyzer();
    }

    /**
     * Validate a causal claim
     */
    async validateCausalClaim(
        claim: string,
        action: string,
        outcome: string,
        options: CausalGateOptions = {}
    ): Promise<CausalValidationResult> {
        const opts = { ...this.defaultOptions, ...options };

        try {
            // Create minimal LegalAction for analysis
            const legalAction = {
                id: `action-${Date.now()}`,
                actor: "unknown",
                timestamp: new Date(),
                description: action,
                butForRelevance: 0.5,
            };

            // Create minimal Harm for analysis
            const legalHarm = {
                id: `harm-${Date.now()}`,
                victim: "unknown",
                type: "economic" as const,
                description: outcome,
                severity: "moderate" as const,
                timestamp: new Date(),
            };

            const result = await this.analyzer.analyze(legalAction, legalHarm);

            const isNecessary = result.result === 'necessary' || result.result === 'both';
            const isSufficient = result.result === 'sufficient' || result.result === 'both';

            // Get scores with defaults
            const necessityScore = result.necessityScore ?? 0.5;
            const sufficiencyScore = result.sufficiencyScore ?? 0.5;
            const minNecessity = opts.minNecessity ?? this.defaultOptions.minNecessity ?? 0.5;
            const minSufficiency = opts.minSufficiency ?? this.defaultOptions.minSufficiency ?? 0.3;

            // Determine gate status
            let gateStatus: CausalValidationResult["gateStatus"] = "pass";

            if (opts.requireBoth) {
                if (!isNecessary || !isSufficient) {
                    gateStatus = "fail";
                } else if (necessityScore < minNecessity || sufficiencyScore < minSufficiency) {
                    gateStatus = "warning";
                }
            } else {
                if (necessityScore < minNecessity && sufficiencyScore < minSufficiency) {
                    gateStatus = opts.failOnUncertain ? "fail" : "warning";
                }
            }

            return {
                isNecessary,
                isSufficient,
                confidence: result.confidence,
                necessityScore,
                sufficiencyScore,
                counterfactualScenario: result.counterfactualScenario,
                reasoning: result.reasoning,
                passed: gateStatus === "pass",
                gateStatus,
            };
        } catch (error) {
            console.error("[CausalGate] Validation failed:", error);

            return {
                isNecessary: false,
                isSufficient: false,
                confidence: 0,
                necessityScore: 0.5,
                sufficiencyScore: 0.5,
                passed: false,
                gateStatus: "fail",
                reasoning: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Extract causal claims from text
     */
    extractCausalClaims(text: string): ExtractedCausalClaim[] {
        const claims: ExtractedCausalClaim[] = [];

        // Pattern: "X causes Y", "X leads to Y", "X results in Y"
        const causalPatterns = [
            /(\w+(?:\s+\w+)?)\s+(?:causes?|leads?\s+to|results?\s+in|produces?|generates?|creates?)\s+(\w+(?:\s+\w+)?)/gi,
            /(?:because|since|as)\s+(\w+(?:\s+\w+)?)\s*,?\s+(\w+(?:\s+\w+)?)\s+(?:happens?|occurs?|results?)/gi,
            /(\w+(?:\s+\w+)?)\s+(?:makes?|forces?|drives?)\s+(\w+(?:\s+\w+)?)\s+(?:to\s+)?(\w+(?:\s+\w+)?)/gi,
        ];

        for (const pattern of causalPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const action = match[1]?.trim() || "";
                const outcome = match[2]?.trim() || "";

                if (action && outcome && action.length > 2 && outcome.length > 2) {
                    claims.push({
                        action,
                        outcome,
                        claimText: match[0],
                        extractionConfidence: 0.7,
                    });
                }
            }
        }

        return claims;
    }

    /**
     * Validate all causal claims in a text
     */
    async validateAllClaims(
        text: string,
        options: CausalGateOptions = {}
    ): Promise<{
        claims: ExtractedCausalClaim[];
        validations: CausalValidationResult[];
        overallPassed: boolean;
        anyWarnings: boolean;
    }> {
        const claims = this.extractCausalClaims(text);
        const validations: CausalValidationResult[] = [];
        let overallPassed = true;
        let anyWarnings = false;

        for (const claim of claims) {
            const validation = await this.validateCausalClaim(
                claim.claimText,
                claim.action,
                claim.outcome,
                options
            );

            validations.push(validation);

            if (!validation.passed) {
                overallPassed = false;
            }

            if (validation.gateStatus === "warning") {
                anyWarnings = true;
            }
        }

        return {
            claims,
            validations,
            overallPassed,
            anyWarnings,
        };
    }

    /**
     * Generate falsification prompt for unvalidated claims
     */
    generateFalsificationPrompt(claim: ExtractedCausalClaim, validation: CausalValidationResult): string {
        if (validation.passed) {
            return "";
        }

        return `
### CAUSAL GATE WARNING

Your claim "${claim.claimText}" did not pass causal validation:
- Necessity: ${validation.isNecessary ? "Yes" : "No"} (score: ${validation.necessityScore.toFixed(2)})
- Sufficiency: ${validation.isSufficient ? "Yes" : "No"} (score: ${validation.sufficiencyScore.toFixed(2)})

**Counterfactual:** ${validation.counterfactualScenario || "Not generated"}

**Required Action:**
1. Distinguish correlation from causation in your claim
2. State the causal mechanism explicitly
3. Provide falsification criteria: what would disprove this causal relationship?
4. Propose an experiment to test the causal claim

**Revised claim format:**
"Hypothesis: [action] causes [outcome] via [mechanism].
Prediction: [specific observable].
Falsification: [what would disprove]."
`;
    }

    /**
     * Generate SSE event for causal gate result
     */
    formatGateEvent(claim: ExtractedCausalClaim, validation: CausalValidationResult): Record<string, unknown> {
        return {
            type: "causal_gate",
            claim: claim.claimText,
            action: claim.action,
            outcome: claim.outcome,
            isNecessary: validation.isNecessary,
            isSufficient: validation.isSufficient,
            necessityScore: validation.necessityScore,
            sufficiencyScore: validation.sufficiencyScore,
            confidence: validation.confidence,
            gateStatus: validation.gateStatus,
            passed: validation.passed,
        };
    }
}

/**
 * Singleton instance
 */
let instance: ChatCausalGate | null = null;

export function getChatCausalGate(): ChatCausalGate {
    if (!instance) {
        instance = new ChatCausalGate();
    }
    return instance;
}
