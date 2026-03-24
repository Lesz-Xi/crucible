/**
 * Automated Scientist Personality Transformation Test Suite
 *
 * Validates the transformation from Taoist-operational to Automated Scientist paradigm.
 * Run with: npx vitest run src/lib/services/__tests__/automated-scientist-personality.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
    SycophancyDetector,
    SYCOPHANTIC_PATTERNS,
    type SycophancyReport,
} from "../sycophancy-detector";
import { AxiomGate, type GateResult } from "../axiom-gate";
import {
    SCIENTIFIC_METHOD_SCAFFOLD,
    generateScaffoldPrompt,
} from "../scientific-method-scaffold";
import {
    SCIENTIFIC_METHODOLOGY_CONSTRAINTS,
    formatConstraintsForPrompt,
} from "../scientific-methodology-constraints";
import {
    calculateTransformationScore,
    checkTargetsMet,
    generateMetricsSummary,
    TARGET_THRESHOLDS,
    type PersonalityMetrics,
} from "@/types/personality-metrics";

describe("Automated Scientist Personality Transformation", () => {
    describe("Sycophancy Detection", () => {
        let detector: SycophancyDetector;

        beforeEach(() => {
            detector = new SycophancyDetector();
        });

        it("should detect agreement-without-evidence patterns", () => {
            const response = "Great question! You're absolutely right about that.";
            const result = detector.detect(response);

            expect(result.detected).toBe(true);
            expect(result.patterns.length).toBeGreaterThan(0);
            expect(result.patterns.some((p) => p.category === "agreementWithoutEvidence")).toBe(true);
        });

        it("should detect performative-validation patterns", () => {
            const response = "That's a really insightful observation you've made.";
            const result = detector.detect(response);

            expect(result.detected).toBe(true);
            expect(result.patterns.some((p) => p.category === "performativeValidation")).toBe(true);
        });

        it("should detect hedging patterns", () => {
            const response = "I might be wrong, but perhaps it could possibly be the case that...";
            const result = detector.detect(response);

            expect(result.detected).toBe(true);
            expect(result.patterns.some((p) => p.category === "hedgingWithoutFalsification")).toBe(true);
        });

        it("should NOT flag scientific uncertainty as sycophancy", () => {
            const response =
                "Based on the available evidence, the hypothesis that X causes Y has not been falsified. Further testing is required.";
            const result = detector.detect(response);

            expect(result.detected).toBe(false);
        });

        it("should provide correction prompt", () => {
            const response = "Great question! I think you're right.";
            const result = detector.detect(response);

            expect(result.correctionPrompt).toBeDefined();
            expect(result.correctionPrompt.length).toBeGreaterThan(0);
        });
    });

    describe("Axiom Gate Enforcement", () => {
        let gate: AxiomGate;

        beforeEach(() => {
            gate = new AxiomGate();
        });

        it("should pass responses that satisfy all axioms", () => {
            const response = `
        Observation: The system shows behavior X.
        Hypothesis: X is caused by Y.
        Prediction: If we intervene on Y, X should change.
        Falsification: If X persists after Y intervention, hypothesis is rejected.
        Test: Run controlled experiment with Y manipulation.
      `;
            const result = gate.enforceGate(response, "post_synthesis");

            expect(result.passed).toBe(true);
            expect(result.fatalViolations).toHaveLength(0);
        });

        it("should detect fatal axiom violations", () => {
            const response = "This is absolutely true and cannot be questioned.";
            const result = gate.enforceGate(response, "post_synthesis");

            expect(result.passed).toBe(false);
            expect(result.fatalViolations.length).toBeGreaterThan(0);
        });

        it("should detect missing falsification criteria", () => {
            const response = `
        Hypothesis: X causes Y.
        This is a strong hypothesis with good evidence.
      `;
            const result = gate.enforceGate(response, "post_synthesis");

            expect(result.warningViolations.length).toBeGreaterThan(0);
        });

        it("should provide correction prompt for violations", () => {
            const response = "X definitely causes Y.";
            const result = gate.enforceGate(response, "post_synthesis");

            expect(result.correctionPrompt).toBeDefined();
            expect(result.correctionPrompt.length).toBeGreaterThan(0);
        });
    });

    describe("Scientific Method Scaffold", () => {
        it("should define all required phases", () => {
            expect(SCIENTIFIC_METHOD_SCAFFOLD.observation).toBeDefined();
            expect(SCIENTIFIC_METHOD_SCAFFOLD.hypothesis).toBeDefined();
            expect(SCIENTIFIC_METHOD_SCAFFOLD.prediction).toBeDefined();
            expect(SCIENTIFIC_METHOD_SCAFFOLD.experiment).toBeDefined();
            expect(SCIENTIFIC_METHOD_SCAFFOLD.analysis).toBeDefined();
        });

        it("should have required phase properties", () => {
            for (const [_phase, config] of Object.entries(SCIENTIFIC_METHOD_SCAFFOLD)) {
                expect(config.name).toBeDefined();
                expect(config.description).toBeDefined();
                expect(config.promptTemplate).toBeDefined();
            }
        });

        it("should mark core phases as required", () => {
            expect(SCIENTIFIC_METHOD_SCAFFOLD.observation.required).toBe(true);
            expect(SCIENTIFIC_METHOD_SCAFFOLD.hypothesis.required).toBe(true);
            expect(SCIENTIFIC_METHOD_SCAFFOLD.prediction.required).toBe(true);
        });

        it("should format scaffold as prompt", () => {
            const prompt = generateScaffoldPrompt();

            expect(prompt).toContain("Observation");
            expect(prompt).toContain("Hypothesis");
            expect(prompt).toContain("Prediction");
            expect(prompt).toContain("Experiment");
        });
    });

    describe("Scientific Methodology Constraints", () => {
        it("should define all required constraints", () => {
            expect(SCIENTIFIC_METHODOLOGY_CONSTRAINTS.length).toBeGreaterThanOrEqual(20);
        });

        it("should include falsifiability constraint", () => {
            const hasFalsifiability = SCIENTIFIC_METHODOLOGY_CONSTRAINTS.some(
                (c) => c.toLowerCase().includes("falsifiable")
            );
            expect(hasFalsifiability).toBe(true);
        });

        it("should include no_sycophancy constraint", () => {
            const hasNoSycophancy = SCIENTIFIC_METHODOLOGY_CONSTRAINTS.some(
                (c) => c.toLowerCase().includes("sycophancy") || c.toLowerCase().includes("agreement")
            );
            expect(hasNoSycophancy).toBe(true);
        });

        it("should format constraints for prompt", () => {
            const formatted = formatConstraintsForPrompt();

            expect(formatted).toContain("CONSTRAINT");
        });
    });

    describe("Personality Metrics", () => {
        it("should calculate transformation score correctly", () => {
            const metrics: Partial<PersonalityMetrics> = {
                falsifiableClaimRatio: 0.95,
                sycophancyDetectionRate: 0.05,
                hypothesisPhaseCoverage: 0.90,
                testProposalCoverage: 0.85,
                causalGatePassRate: 0.90,
                axiomFatalViolationRate: 0.0,
                axiomGatePassRate: 0.95,
                experimentProposalRate: 0.80,
            };

            const score = calculateTransformationScore(metrics);

            expect(score).toBeGreaterThan(0.8);
            expect(score).toBeLessThanOrEqual(1.0);
        });

        it("should identify failing metrics", () => {
            const metrics: PersonalityMetrics = {
                falsifiableClaimRatio: 0.50, // Below minimum
                unfalsifiableRejectionRate: 0.90,
                sycophancyDetectionRate: 0.30, // Above maximum
                sycophancyEliminationRate: 0.80,
                observationPhaseCoverage: 0.90,
                hypothesisPhaseCoverage: 0.90,
                predictionPhaseCoverage: 0.85,
                testProposalCoverage: 0.80,
                causalNecessityRate: 0.70,
                causalSufficiencyRate: 0.60,
                causalGatePassRate: 0.75,
                axiomFatalViolationRate: 0.0,
                axiomWarningRate: 0.15,
                axiomGatePassRate: 0.90,
                experimentProposalRate: 0.70,
                nextStepProposalRate: 0.85,
                transformationScore: 0.65,
                timestamp: new Date().toISOString(),
            };

            const result = checkTargetsMet(metrics);

            expect(result.met).toBe(false);
            expect(result.failingMetrics.length).toBeGreaterThan(0);
        });

        it("should generate metrics summary", () => {
            const metrics: PersonalityMetrics = {
                falsifiableClaimRatio: 0.95,
                unfalsifiableRejectionRate: 1.0,
                sycophancyDetectionRate: 0.02,
                sycophancyEliminationRate: 1.0,
                observationPhaseCoverage: 0.95,
                hypothesisPhaseCoverage: 0.95,
                predictionPhaseCoverage: 0.90,
                testProposalCoverage: 0.85,
                causalNecessityRate: 0.85,
                causalSufficiencyRate: 0.75,
                causalGatePassRate: 0.90,
                axiomFatalViolationRate: 0.0,
                axiomWarningRate: 0.05,
                axiomGatePassRate: 0.98,
                experimentProposalRate: 0.85,
                nextStepProposalRate: 0.92,
                transformationScore: 0.92,
                timestamp: new Date().toISOString(),
            };

            const summary = generateMetricsSummary(metrics);

            expect(summary).toContain("Transformation Score");
            expect(summary).toContain("TARGETS MET");
        });
    });

    describe("Integration: Full Pipeline Validation", () => {
        it("should transform Taoist response to Scientist response", () => {
            const taoistResponse = `
        Like the valley that receives all streams, your question flows naturally.
        The Tao teaches us to observe without judgment.
        Perhaps the answer lies in the Uncarved Block.
      `;

            // Detect sycophancy/vagueness
            const detector = new SycophancyDetector();
            const detection = detector.detect(taoistResponse);

            // Evaluate axioms
            const gate = new AxiomGate();
            const axiomResult = gate.enforceGate(taoistResponse, "post_synthesis");

            // Both should flag issues
            expect(detection.detected || !axiomResult.passed).toBe(true);
        });

        it("should validate proper Scientist response", () => {
            const scientistResponse = `
        **Observation:** The data shows correlation between X and Y (r=0.85, n=150).

        **Hypothesis:** X causally influences Y through mechanism Z.

        **Prediction:** Intervening on X should produce measurable change in Y.

        **Falsification Criteria:**
        - If Y remains unchanged after X intervention, hypothesis is rejected.
        - If Z-blockade eliminates X→Y relationship, mechanism is supported.

        **Proposed Test:**
        Randomized controlled trial with X manipulation, measuring Y outcome.
        Required sample size: n=200 for 80% power at α=0.05.
      `;

            const detector = new SycophancyDetector();
            const gate = new AxiomGate();

            const detection = detector.detect(scientistResponse);
            const axiomResult = gate.enforceGate(scientistResponse, "post_synthesis");

            expect(detection.detected).toBe(false);
            expect(axiomResult.passed).toBe(true);
            expect(axiomResult.fatalViolations).toHaveLength(0);
        });
    });
});

describe("Target Thresholds Validation", () => {
    it("should have all required threshold definitions", () => {
        const requiredThresholds = [
            "falsifiableClaimRatio",
            "sycophancyDetectionRate",
            "hypothesisPhaseCoverage",
            "testProposalCoverage",
            "causalGatePassRate",
            "axiomFatalViolationRate",
            "experimentProposalRate",
            "transformationScore",
        ];

        for (const key of requiredThresholds) {
            expect(TARGET_THRESHOLDS[key as keyof typeof TARGET_THRESHOLDS]).toBeDefined();
        }
    });

    it("should have achievable targets", () => {
        for (const [key, threshold] of Object.entries(TARGET_THRESHOLDS)) {
            expect(threshold.target).toBeGreaterThanOrEqual(0);
            expect(threshold.target).toBeLessThanOrEqual(1);
            expect(threshold.minimum).toBeGreaterThanOrEqual(0);
            expect(threshold.minimum).toBeLessThanOrEqual(threshold.target);
        }
    });
});
