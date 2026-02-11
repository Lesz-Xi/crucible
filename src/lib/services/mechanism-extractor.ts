/**
 * Mechanism Extractor - Enhanced NLP for Causal Mechanism Detection
 * 
 * Extracts causal mechanisms from text using:
 * 1. Pattern matching (regex-based)
 * 2. Heuristic analysis
 * 3. LLM fallback for complex extractions
 * 
 * Following Demis Workflow:
 * - L1 Impact: Fast regex-first approach, async LLM only when needed
 * - L2 Risk: Graceful degradation if LLM fails
 * - L3 Calibration: Caching to reduce redundant LLM calls
 * - L4 Critical Gap: Requires ANTHROPIC_API_KEY for LLM fallback
 */

import { getClaudeModel } from "@/lib/ai/anthropic";

export type MechanismType = "physical" | "biological" | "cognitive" | "social" | "unknown";

export interface MechanismExtraction {
  /** The extracted mechanism phrase */
  mechanism: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Scientific domain classification */
  type: MechanismType;
  /** Original text supporting the extraction */
  supportingText: string;
  /** Position in original text (for highlighting) */
  position?: { start: number; end: number };
}

/**
 * Patterns for mechanism extraction
 */
const MECHANISM_PATTERNS = [
  // "X works by Y"
  /(\w+(?:\s+\w+){0,5})\s+works?\s+(?:by|through|via)\s+([^.]+)/gi,
  
  // "The mechanism is X"
  /(?:the\s+)?mechanism\s+(?:is|involves|entails)\s+([^.]+)/gi,
  
  // "Caused by X"
  /caused\s+by\s+([^.]+)/gi,
  
  // "Results from X"
  /results?\s+(?:from|in)\s+([^.]+)/gi,
  
  // "Due to X"
  /due\s+to\s+([^.]+)/gi,
  
  // "Because of X"
  /because\s+(?:of\s+)?([^.]+)/gi,
  
  // "Driven by X"
  /driven\s+by\s+([^.]+)/gi,
  
  // "Mediated by X"
  /mediated\s+by\s+([^.]+)/gi,
  
  // "Modulated by X"
  /modulated\s+by\s+([^.]+)/gi,
  
  // "X leads to Y"
  /(\w+(?:\s+\w+){0,5})\s+leads?\s+to\s+([^.]+)/gi,
  
  // "X produces Y"
  /(\w+(?:\s+\w+){0,5})\s+produces?\s+([^.]+)/gi,
  
  // "X generates Y"
  /(\w+(?:\s+\w+){0,5})\s+generates?\s+([^.]+)/gi,
];

/**
 * Domain-specific keywords for classification
 */
const DOMAIN_KEYWORDS: Record<MechanismType, string[]> = {
  physical: [
    "force", "energy", "momentum", "velocity", "acceleration", "gravity",
    "electromagnetic", "quantum", "thermodynamic", "entropy", "pressure",
    "temperature", "friction", "resistance", "conductivity", "diffusion"
  ],
  biological: [
    "gene", "protein", "enzyme", "cell", "tissue", "organ", "organism",
    "metabolism", "synthesis", "replication", "transcription", "translation",
    "membrane", "receptor", "hormone", "neurotransmitter", "immune"
  ],
  cognitive: [
    "attention", "memory", "perception", "cognition", "decision", "bias",
    "heuristic", "reasoning", "learning", "belief", "intention", "emotion",
    "consciousness", "unconscious", "processing", "representation"
  ],
  social: [
    "norm", "institution", "culture", "interaction", "relationship", "network",
    "communication", "cooperation", "competition", "hierarchy", "power",
    "influence", "behavior", "attitude", "belief", "value"
  ],
  unknown: []
};

/**
 * Service for extracting causal mechanisms from text.
 */
export class MechanismExtractor {
  private llm = getClaudeModel();
  private cache: Map<string, MechanismExtraction[]> = new Map();

  /**
   * Extract mechanisms using pattern matching.
   * Fast, synchronous method for real-time use.
   * 
   * @param text - The text to analyze
   * @returns Array of extracted mechanisms
   */
  extract(text: string): MechanismExtraction[] {
    const mechanisms: MechanismExtraction[] = [];
    const seen = new Set<string>();

    for (const pattern of MECHANISM_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const mechanism = match[1] || match[2] || match[0];
        const cleanMechanism = mechanism.trim().toLowerCase();
        
        // Skip duplicates and very short matches
        if (seen.has(cleanMechanism) || cleanMechanism.length < 5) continue;
        seen.add(cleanMechanism);

        // Get surrounding context
        const start = Math.max(0, match.index - 30);
        const end = Math.min(text.length, match.index + mechanism.length + 30);
        const supportingText = text.slice(start, end);

        mechanisms.push({
          mechanism: cleanMechanism,
          confidence: 0.6, // Base confidence for pattern matching
          type: this.categorize(cleanMechanism),
          supportingText,
          position: { start: match.index, end: match.index + mechanism.length }
        });
      }
    }

    // Sort by confidence and return top results
    return mechanisms
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Extract mechanisms using LLM for higher accuracy.
   * Async method for when precision matters.
   * 
   * @param text - The text to analyze
   * @returns Array of extracted mechanisms with high confidence
   */
  async extractWithLLM(text: string): Promise<MechanismExtraction[]> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const prompt = `You are a causal hypothesis generation engine. Analyze the following text and generate 2-3 COMPETING causal mechanisms that could explain the phenomena described.

Text: """
${text}
"""

For each competing mechanism, you must:
1. **Testability**: Can this be empirically tested? Are predictions measurable?
2. **Falsifiability**: What specific observations would disprove this mechanism?
3. **Specificity**: Does it make precise predictions (avoid vague language)?
4. **Parsimony**: Is it the simplest explanation that fits the evidence?

Generate competing hypotheses (not just variations of the same idea). Rank them by:
- Evidence support (how well does the text support this mechanism?)
- Testability (how easily can this be tested?)
- Information value (how much would confirming this advance understanding?)

Respond in this exact JSON format:
{
  "mechanisms": [
    {
      "mechanism": "Precise name of causal mechanism",
      "type": "physical|biological|cognitive|social",
      "confidence": 0.85,
      "supportingText": "Direct quote from source",
      "testability": 0.9,
      "falsifiability": 0.85,
      "parsimony": 0.8,
      "distinguishingTest": "What experiment would confirm/reject this vs alternatives?"
    }
  ]
}

CRITICAL: Generate truly DIFFERENT mechanisms, not just variations. If the text only supports one mechanism, generate plausible alternatives based on domain knowledge. Limit to top 3 ranked by combined score.`;

    try {
      const response = await this.llm.generateContent(prompt);
      const responseText = response.response.text();
      
      // Extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("[MechanismExtractor] No JSON in LLM response");
        return this.extract(text); // Fallback to pattern matching
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const mechanisms: MechanismExtraction[] = (parsed.mechanisms || [])
        .map((m: any) => {
          // Calculate composite quality score
          const qualityScore = (
            (m.testability || 0.5) * 0.3 +
            (m.falsifiability || 0.5) * 0.3 +
            (m.parsimony || 0.5) * 0.2 +
            (m.confidence || 0.5) * 0.2
          );
          
          return {
            mechanism: m.mechanism.toLowerCase(),
            confidence: qualityScore, // Use composite score
            type: this.validateType(m.type),
            supportingText: m.supportingText || "",
          };
        })
        .filter((m: MechanismExtraction) => m.confidence >= 0.6) // Higher threshold
        .sort((a: MechanismExtraction, b: MechanismExtraction) => b.confidence - a.confidence)
        .slice(0, 3); // Top 3

      // Cache result
      this.cache.set(cacheKey, mechanisms);
      
      // Limit cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      return mechanisms;
    } catch (err) {
      console.error("[MechanismExtractor] LLM extraction failed:", err);
      return this.extract(text); // Fallback
    }
  }

  /**
   * Categorize a mechanism by scientific domain.
   * 
   * @param mechanism - The mechanism to categorize
   * @returns The domain type
   */
  categorize(mechanism: string): MechanismType {
    const words = mechanism.toLowerCase().split(/\s+/);
    const scores: Record<MechanismType, number> = {
      physical: 0,
      biological: 0,
      cognitive: 0,
      social: 0,
      unknown: 0
    };

    for (const word of words) {
      for (const [type, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        if (keywords.some(kw => word.includes(kw) || kw.includes(word))) {
          scores[type as MechanismType]++;
        }
      }
    }

    // Find highest score
    let bestType: MechanismType = "unknown";
    let bestScore = 0;
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as MechanismType;
      }
    }

    return bestType;
  }

  /**
   * Get all unique mechanisms from a list, sorted by frequency.
   * 
   * @param extractions - Array of mechanism extractions
   * @returns Sorted unique mechanisms
   */
  getTopMechanisms(extractions: MechanismExtraction[], limit = 10): string[] {
    const counts: Record<string, number> = {};
    
    for (const extraction of extractions) {
      counts[extraction.mechanism] = (counts[extraction.mechanism] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([mechanism]) => mechanism);
  }

  /**
   * Group mechanisms by domain type.
   * 
   * @param extractions - Array of mechanism extractions
   * @returns Grouped mechanisms
   */
  groupByDomain(extractions: MechanismExtraction[]): Record<MechanismType, MechanismExtraction[]> {
    const grouped: Record<MechanismType, MechanismExtraction[]> = {
      physical: [],
      biological: [],
      cognitive: [],
      social: [],
      unknown: []
    };

    for (const extraction of extractions) {
      grouped[extraction.type].push(extraction);
    }

    return grouped;
  }

  /**
   * Clear the extraction cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses
    };
  }

  // Private helpers

  private validateType(type: string): MechanismType {
    const validTypes: MechanismType[] = ["physical", "biological", "cognitive", "social"];
    return validTypes.includes(type as MechanismType) ? (type as MechanismType) : "unknown";
  }

  private hashText(text: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}

/**
 * Singleton instance for convenience.
 */
export const mechanismExtractor = new MechanismExtractor();
