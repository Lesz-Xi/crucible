/**
 * Temporal Decay Service
 * 
 * Implements age-based weighting for prior art relevance following
 * exponential decay principles. Older research receives progressively
 * lower weights in similarity calculations.
 * 
 * Decay Formula: weight = exp(-λ * age_years)
 * where λ (lambda) is the decay constant (default: 0.1)
 */

export interface TemporalDecayConfig {
    /**
     * Decay constant (lambda). Higher values = faster decay.
     * Default: 0.1 (approximately 10% reduction per year)
     */
    decayConstant?: number;

    /**
     * Minimum weight floor to prevent complete obsolescence.
     * Default: 0.1 (10% minimum relevance)
     */
    minWeight?: number;

    /**
     * Reference year for age calculation. Defaults to current year.
     */
    referenceYear?: number;
}

export interface PriorArtWithAge {
    title: string;
    publicationYear: number | null;
    similarity: number;
    snippet?: string;
}

export interface WeightedPriorArt extends PriorArtWithAge {
    temporalWeight: number;
    adjustedSimilarity: number;
    ageYears: number;
}

const DEFAULT_CONFIG: Required<TemporalDecayConfig> = {
    decayConstant: 0.1,
    minWeight: 0.1,
    referenceYear: new Date().getFullYear(),
};

/**
 * Calculate temporal decay weight using exponential decay formula.
 * 
 * @param ageYears - Age of the publication in years
 * @param config - Temporal decay configuration
 * @returns Weight between minWeight and 1.0
 */
export function calculateTemporalWeight(
    ageYears: number,
    config: TemporalDecayConfig = {}
): number {
    const { decayConstant, minWeight } = { ...DEFAULT_CONFIG, ...config };

    if (ageYears < 0) {
        // Future dates or invalid data: return full weight
        return 1.0;
    }

    // Exponential decay: weight = exp(-λ * t)
    const rawWeight = Math.exp(-decayConstant * ageYears);

    // Apply minimum weight floor
    return Math.max(rawWeight, minWeight);
}

/**
 * Parse publication year from various formats.
 * Supports: "2023", "2023-01-15", "Jan 2023", etc.
 * 
 * @param dateString - Publication date in any common format
 * @param fallbackYear - Year to use if parsing fails (from env var)
 * @returns Parsed year or fallback
 */
export function parsePublicationYear(
    dateString: string | null | undefined,
    fallbackYear?: number
): number | null {
    if (!dateString) {
        return fallbackYear ?? null;
    }

    // Try to extract 4-digit year using regex
    const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        return parseInt(yearMatch[0], 10);
    }

    // Try parsing as full date
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed.getFullYear();
    }

    // If all parsing fails, use fallback
    return fallbackYear ?? null;
}

/**
 * Apply temporal decay to a list of prior art results.
 * 
 * @param priorArt - Array of prior art with publication years
 * @param config - Temporal decay configuration
 * @returns Array with temporal weights and adjusted similarities
 */
export function applyTemporalDecay(
    priorArt: PriorArtWithAge[],
    config: TemporalDecayConfig = {}
): WeightedPriorArt[] {
    const { referenceYear } = { ...DEFAULT_CONFIG, ...config };

    return priorArt.map((item) => {
        // Calculate age (null years get no decay penalty)
        const ageYears = item.publicationYear
            ? referenceYear - item.publicationYear
            : 0;

        // Calculate temporal weight
        const temporalWeight = item.publicationYear
            ? calculateTemporalWeight(ageYears, config)
            : 1.0; // No penalty for missing publication year

        // Adjust similarity score by temporal weight
        const adjustedSimilarity = item.similarity * temporalWeight;

        return {
            ...item,
            temporalWeight,
            adjustedSimilarity,
            ageYears,
        };
    });
}

/**
 * Sort prior art by adjusted similarity (temporal-weighted).
 * 
 * @param weightedPriorArt - Array of weighted prior art
 * @returns Sorted array (highest adjusted similarity first)
 */
export function sortByTemporalRelevance(
    weightedPriorArt: WeightedPriorArt[]
): WeightedPriorArt[] {
    return [...weightedPriorArt].sort(
        (a, b) => b.adjustedSimilarity - a.adjustedSimilarity
    );
}

/**
 * Generate human-readable explanation of temporal decay impact.
 * 
 * @param item - Weighted prior art item
 * @returns Explanation string
 */
export function explainTemporalImpact(item: WeightedPriorArt): string {
    if (!item.publicationYear) {
        return "Publication year unknown; no temporal decay applied.";
    }

    const percentageReduction = Math.round((1 - item.temporalWeight) * 100);

    if (percentageReduction === 0) {
        return `Recent publication (${item.publicationYear}); full relevance weight.`;
    }

    return `Published ${item.ageYears} years ago (${item.publicationYear}); ` +
        `relevance reduced by ${percentageReduction}% due to age-based decay.`;
}
