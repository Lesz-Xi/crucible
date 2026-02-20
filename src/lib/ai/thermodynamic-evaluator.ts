import { ExtractedConcepts } from "@/types";

export interface TBEConfig {
    /** The lower threshold for spectral gap (1/sqrt(L)). If gap drops below this, TBE triggers. */
    spectralGapThreshold: number;
    /** The temperature to apply when TBE is triggered (T=1.5). */
    expansionTemperature: number;
    /** How many stable generations required before cooling down. */
    cooldownPeriod: number;
    /** The upper limit for spectral gap where cooldown begins. */
    recoveryThreshold: number;
}

export const DEFAULT_TBE_CONFIG: TBEConfig = {
    spectralGapThreshold: 0.1, // Will be dynamically calculated based on L
    expansionTemperature: 1.5,
    cooldownPeriod: 3,
    recoveryThreshold: 0.2, // Hysteresis buffer
};

export class ThermodynamicEvaluator {
    private config: TBEConfig;
    private triggered: boolean = false;
    private cooldownCounter: number = 0;

    constructor(config: Partial<TBEConfig> = {}) {
        this.config = { ...DEFAULT_TBE_CONFIG, ...config };
    }

    /**
     * Evaluates the current spectral gap and updates TBE state.
     * Returns the recommended temperature for the next generation.
     * 
     * @param spectralGap The calculated spectral gap of the behavioral covariance matrix.
     * @param baseTemperature The normal operating temperature (e.g. 0.7).
     * @param sequenceLength (L) The number of recent generations over which the gap was calculated.
     */
    evaluate(spectralGap: number, baseTemperature: number, sequenceLength: number): { recommendedTemperature: number, isTriggered: boolean } {
        // Dynamic threshold: 1/sqrt(L)
        const dynamicThreshold = typeof sequenceLength === 'number' && sequenceLength > 0
            ? 1 / Math.sqrt(sequenceLength)
            : this.config.spectralGapThreshold;

        if (this.triggered) {
            if (spectralGap > this.config.recoveryThreshold) {
                this.cooldownCounter++;
                if (this.cooldownCounter >= this.config.cooldownPeriod) {
                    // Escaped trap and completed cooldown
                    this.triggered = false;
                    this.cooldownCounter = 0;
                    return { recommendedTemperature: baseTemperature, isTriggered: false };
                } else {
                    // Recovering, but still cooling down. Maintain high temperature or interpolate.
                    // For simplicity in Phase A, we maintain the high temperature until cooldown completes.
                    return { recommendedTemperature: this.config.expansionTemperature, isTriggered: true };
                }
            } else {
                // Still trapped, reset cooldown
                this.cooldownCounter = 0;
                return { recommendedTemperature: this.config.expansionTemperature, isTriggered: true };
            }
        } else {
            if (spectralGap < dynamicThreshold) {
                // Trap detected, trigger TBE
                this.triggered = true;
                this.cooldownCounter = 0;
                return { recommendedTemperature: this.config.expansionTemperature, isTriggered: true };
            } else {
                // Normal operation
                return { recommendedTemperature: baseTemperature, isTriggered: false };
            }
        }
    }

    isCurrentlyTriggered(): boolean {
        return this.triggered;
    }

    reset(): void {
        this.triggered = false;
        this.cooldownCounter = 0;
    }
}
