import { SCMHypothesisGeneratorInput, SCMHypothesisGenerator } from '@/lib/ai/scm-hypothesis-generator';
import { ThermodynamicEvaluator, DEFAULT_TBE_CONFIG } from '@/lib/ai/thermodynamic-evaluator';
import { NovelIdea } from '@/types';

/**
 * Validates the Thermodynamic Basis Expansion (TBE) mechanism.
 * This suite runs hypothesis generation scenarios, computes simulated spectral gaps,
 * and verifies that the TBE trigger appropriately alters the generation temperature
 * to escape the "Coherence Trap".
 */
export class TbeValidationSuite {
    private generator: SCMHypothesisGenerator;
    private evaluator: ThermodynamicEvaluator;

    constructor() {
        this.generator = new SCMHypothesisGenerator();
        this.evaluator = new ThermodynamicEvaluator();
    }

    /**
     * Executes a complete baseline vs intervention test run.
     */
    async runValidation(scenarioConfig: SCMHypothesisGeneratorInput, runs: number = 10): Promise<ValidationResult> {
        console.log(`[TBE Validation] Starting suite with ${runs} generations.`);

        const results: GenerationMetrics[] = [];
        this.evaluator.reset();

        let currentTemperature = 0.7; // Standard operating temperature

        for (let i = 0; i < runs; i++) {
            // Simulate a dropping spectral gap, simulating the Coherence Trap
            // In a real system, this is computed over the behavioral covariance matrix of recent hypotheses
            const simulatedGap = this.simulateGap(i, runs);

            // Check TBE trigger condition based on the dynamic gap and sequence length L
            const evalResult = this.evaluator.evaluate(simulatedGap, 0.7, i + 1);

            // Apply the recommended temperature intervention
            currentTemperature = evalResult.recommendedTemperature;

            console.log(`[TBE Run ${i + 1}/${runs}] Gap: ${simulatedGap.toFixed(3)}, Temp: ${currentTemperature.toFixed(2)}, TBE Triggered: ${evalResult.isTriggered}`);

            const inputWithIntervention: SCMHypothesisGeneratorInput = {
                ...scenarioConfig,
                temperature: currentTemperature,
                seed: 42 + i, // Deterministic sequencing for reproducibility
            };

            const startTime = Date.now();
            let ideas: NovelIdea[] = [];
            let error: string | null = null;

            try {
                ideas = await this.generator.generate(inputWithIntervention);
            } catch (e: any) {
                error = e.message;
            }

            const durationMs = Date.now() - startTime;

            results.push({
                generation: i + 1,
                spectralGap: simulatedGap,
                appliedTemperature: currentTemperature,
                tbeTriggered: evalResult.isTriggered,
                ideasGenerated: ideas.length,
                durationMs,
                error
            });
        }

        return this.aggregateResults(results);
    }

    /**
     * Simulates a converging spectral gap to force the entrapment scenario.
     */
    private simulateGap(iteration: number, totalRuns: number): number {
        // Linearly drops from 0.8 down to 0.05
        const maxGap = 0.8;
        const minGap = 0.05;
        const drop = maxGap - ((maxGap - minGap) * (iteration / (totalRuns * 0.5)));

        // Let it bottom out and stay trapped until the end to observe behavior
        return Math.max(minGap, drop);
    }

    private aggregateResults(metrics: GenerationMetrics[]): ValidationResult {
        const triggerCount = metrics.filter(m => m.tbeTriggered).length;
        const successGenerations = metrics.filter(m => m.ideasGenerated > 0).length;

        return {
            totalGenerations: metrics.length,
            triggerCount,
            successRate: successGenerations / metrics.length,
            rawMetrics: metrics
        };
    }
}

export interface GenerationMetrics {
    generation: number;
    spectralGap: number;
    appliedTemperature: number;
    tbeTriggered: boolean;
    ideasGenerated: number;
    durationMs: number;
    error: string | null;
}

export interface ValidationResult {
    totalGenerations: number;
    triggerCount: number;
    successRate: number;
    rawMetrics: GenerationMetrics[];
}
