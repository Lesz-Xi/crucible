/**
 * Axiom Gate - Hard Enforcement
 *
 * Implements axiom-validation gates at all response synthesis checkpoints.
 * Unlike the AxiomValidator which issues warnings, this gate enforces hard blocks.
 */

import { AxiomValidator, type AxiomViolation } from './axiom-validator';

/**
 * Gate enforcement policy
 */
export type GatePolicy = "fatal" | "warning" | "skip";

/**
 * Configuration for axiom gate
 */
export interface AxiomGateConfig {
    /** Policy for unfalsifiable claims */
    unfalsifiabilityPolicy: GatePolicy;

    /** Policy for ambiguous claims */
    ambiguityPolicy: GatePolicy;

    /** Policy for retrocausal claims */
    retrocausalityPolicy: GatePolicy;

    /** Policy for thermodynamic violations */
    entropyViolationPolicy: GatePolicy;

    /** Policy for sycophantic patterns */
    sycophancyPolicy: GatePolicy;

    /** Maximum warnings before blocking */
    maxWarnings: number;
}

/**
 * Default gate configuration - strict enforcement
 */
export const DEFAULT_GATE_CONFIG: AxiomGateConfig = {
    unfalsifiabilityPolicy: "fatal",
    ambiguityPolicy: "warning",
    retrocausalityPolicy: "fatal",
    entropyViolationPolicy: "fatal",
    sycophancyPolicy: "warning",
    maxWarnings: 3,
};

/**
 * Checkpoint types for gate enforcement
 */
export type GateCheckpoint =
    | "pre_synthesis"    // Before LLM call
    | "post_synthesis"   // After LLM response
    | "pre_release";     // Before SSE emission

/**
 * Result of gate enforcement
 */
export interface GateResult {
    /** Whether the text passed the gate */
    passed: boolean;

    /** All violations detected */
    violations: AxiomViolation[];

    /** Fatal violations only */
    fatalViolations: AxiomViolation[];

    /** Warning violations only */
    warningViolations: AxiomViolation[];

    /** Prompt to correct violations */
    correctionPrompt: string;

    /** Gate status */
    status: "pass" | "warning" | "blocked";

    /** Checkpoint where gate was applied */
    checkpoint: GateCheckpoint;
}

/**
 * Unfalsifiability detection result
 */
export interface UnfalsifiabilityViolation {
    detected: boolean;
    evidence: string;
    pattern: string;
    severity: "fatal" | "warning";
}

/**
 * Axiom Gate - Hard enforcement at checkpoints
 */
export class AxiomGate {
    private validator: AxiomValidator;
    private config: AxiomGateConfig;

    constructor(config: Partial<AxiomGateConfig> = {}) {
        this.validator = new AxiomValidator();
        this.config = { ...DEFAULT_GATE_CONFIG, ...config };
    }

    /**
     * Enforce gate at a checkpoint
     */
    enforceGate(
        text: string,
        checkpoint: GateCheckpoint,
        config: Partial<AxiomGateConfig> = {}
    ): GateResult {
        const effectiveConfig = { ...this.config, ...config };
        const violations: AxiomViolation[] = [];

        // Run standard axiom validation
        const report = this.validator.validate(text);
        violations.push(...report.violations);

        // Check for unfalsifiability (new)
        const unfalsifiable = this.detectUnfalsifiability(text);
        if (unfalsifiable.detected) {
            violations.push({
                axiom: "Falsifiability",
                severity: effectiveConfig.unfalsifiabilityPolicy === "fatal" ? "fatal" : "warning",
                evidence: unfalsifiable.evidence,
                reason: `Unfalsifiable claim detected: ${unfalsifiable.pattern}`,
            });
        }

        // Check for sycophancy (new)
        const sycophancy = this.detectSycophancy(text);
        if (sycophancy.detected) {
            violations.push({
                axiom: "NoSycophancy",
                severity: effectiveConfig.sycophancyPolicy === "fatal" ? "fatal" : "warning",
                evidence: sycophancy.evidence,
                reason: "Sycophantic pattern detected - replace with hypothesis-driven response",
            });
        }

        // Check for missing falsification criteria when a hypothesis/claim is asserted.
        const hasHypothesisLikeClaim = /hypothesis|causes|definitely|absolutely true/i.test(text);
        const hasFalsification = /falsif|disprov|reject(ed)? if/i.test(text);
        if (hasHypothesisLikeClaim && !hasFalsification) {
            violations.push({
                axiom: "Falsifiability",
                severity: "warning",
                evidence: "missing falsification criteria",
                reason: "Hypothesis-like claim without explicit falsification criteria.",
            });
        }

        // Apply policy filters
        const fatalViolations = violations.filter(v => {
            if (v.severity !== "fatal") return false;

            // Check policy for specific axioms
            if (v.axiom === "Reversibility" && effectiveConfig.retrocausalityPolicy !== "fatal") return false;
            if (v.axiom === "Entropy" && effectiveConfig.entropyViolationPolicy !== "fatal") return false;
            if (v.axiom === "Falsifiability" && effectiveConfig.unfalsifiabilityPolicy !== "fatal") return false;

            return true;
        });

        const warningViolations = violations.filter(v => v.severity === "warning");

        // Determine status
        let status: GateResult["status"] = "pass";
        if (fatalViolations.length > 0) {
            status = "blocked";
        } else if (warningViolations.length > effectiveConfig.maxWarnings) {
            status = "blocked";
        } else if (warningViolations.length > 0) {
            status = "warning";
        }

        return {
            passed: status !== "blocked",
            violations,
            fatalViolations,
            warningViolations,
            correctionPrompt: this.generateCorrectionPrompt(violations),
            status,
            checkpoint,
        };
    }

    /**
     * Detect unfalsifiable claims
     */
    detectUnfalsifiability(text: string): UnfalsifiabilityViolation {
        const unfalsifiablePatterns = [
            { pattern: /could be (anything|everything|any number of things)/i, severity: "fatal" as const },
            { pattern: /impossible to (know|verify|test|determine|falsify)/i, severity: "fatal" as const },
            { pattern: /beyond (scientific|empirical) (investigation|scope|reach)/i, severity: "fatal" as const },
            { pattern: /we can't know/i, severity: "fatal" as const },
            { pattern: /unknowable/i, severity: "fatal" as const },
            { pattern: /cannot be questioned/i, severity: "fatal" as const },
            { pattern: /no way to (prove|disprove|verify|falsify)/i, severity: "fatal" as const },
            { pattern: /might possibly/i, severity: "warning" as const },
            { pattern: /could possibly/i, severity: "warning" as const },
            { pattern: /perhaps/i, severity: "warning" as const },
        ];

        for (const { pattern, severity } of unfalsifiablePatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    detected: true,
                    evidence: match[0],
                    pattern: pattern.source,
                    severity,
                };
            }
        }

        return {
            detected: false,
            evidence: "",
            pattern: "",
            severity: "warning",
        };
    }

    /**
     * Detect sycophantic patterns
     */
    detectSycophancy(text: string): { detected: boolean; evidence: string; patterns: string[] } {
        const sycophanticPatterns = [
            /you('re| are) (absolutely |completely )?(right|correct)/i,
            /that('s| is) (absolutely |completely )?correct/i,
            /i (completely |totally |fully )?agree/i,
            /great (question|point|observation)/i,
            /excellent (question|point|observation)/i,
            /i appreciate (your |that )?(perspective|question|input)/i,
            /from your perspective/i,
            /that makes sense from your/i,
        ];

        const detectedPatterns: string[] = [];
        let evidence = "";

        for (const pattern of sycophanticPatterns) {
            const match = text.match(pattern);
            if (match) {
                detectedPatterns.push(pattern.source);
                evidence = match[0];
            }
        }

        return {
            detected: detectedPatterns.length > 0,
            evidence,
            patterns: detectedPatterns,
        };
    }

    /**
     * Generate correction prompt for violations
     */
    generateCorrectionPrompt(violations: AxiomViolation[]): string {
        if (violations.length === 0) return "";

        const fatalCount = violations.filter(v => v.severity === "fatal").length;
        const header = fatalCount > 0
            ? "### BLOCKED: AXIOM VIOLATIONS DETECTED"
            : "### WARNING: AXIOM VIOLATIONS DETECTED";

        return `
${header}

Your response violated the Pearlian Causal Axioms:

${violations.map(v => `- **${v.axiom}** (${v.severity}): ${v.reason} (Evidence: "${v.evidence}")`).join('\n')}

**CORRECTION INSTRUCTION:**
${this.getCorrectionInstructions(violations)}

**REQUIRED OUTPUT FORMAT:**
1. Observation: [what phenomenon is under investigation]
2. Hypothesis: [falsifiable explanation]
3. Prediction: [testable consequence]
4. Falsification: [what would disprove]
5. Test: [how to verify]
`;
    }

    /**
     * Get specific correction instructions based on violation types
     */
    private getCorrectionInstructions(violations: AxiomViolation[]): string {
        const instructions: string[] = [];

        for (const v of violations) {
            switch (v.axiom) {
                case "Definiteness":
                    instructions.push("- Replace probabilistic hedging (maybe/could) with structural determinism (X determines Y)");
                    break;
                case "Reversibility":
                    instructions.push("- DELETE any retrocausal claims immediately - causation flows forward in time only");
                    break;
                case "Entropy":
                    instructions.push("- DELETE any thermodynamic violations (perpetual motion, free energy)");
                    break;
                case "Falsifiability":
                    instructions.push("- State what would disprove your claim - if nothing can, the claim is invalid");
                    break;
                case "NoSycophancy":
                    instructions.push("- Remove sycophantic agreement - proceed directly to hypothesis formulation");
                    break;
                default:
                    instructions.push(`- Address ${v.axiom} violation`);
            }
        }

        return instructions.join('\n');
    }

    /**
     * Quick check if text passes all fatal gates
     */
    quickCheck(text: string): boolean {
        const result = this.enforceGate(text, "pre_release");
        return result.passed;
    }

    /**
     * Format gate result as SSE event
     */
    formatGateEvent(result: GateResult): Record<string, unknown> {
        return {
            type: "axiom_gate",
            passed: result.passed,
            status: result.status,
            checkpoint: result.checkpoint,
            fatalCount: result.fatalViolations.length,
            warningCount: result.warningViolations.length,
            violations: result.violations.map(v => ({
                axiom: v.axiom,
                severity: v.severity,
                evidence: v.evidence,
            })),
        };
    }
}

/**
 * Singleton instance
 */
let instance: AxiomGate | null = null;

export function getAxiomGate(config?: Partial<AxiomGateConfig>): AxiomGate {
    if (!instance) {
        instance = new AxiomGate(config);
    }
    return instance;
}

/**
 * Convenience function for quick gate check
 */
export function checkAxiomGate(text: string, checkpoint: GateCheckpoint = "pre_release"): GateResult {
    return getAxiomGate().enforceGate(text, checkpoint);
}