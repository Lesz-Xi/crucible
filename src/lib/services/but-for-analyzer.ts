/**
 * But-For Causation Analyzer
 * 
 * Implements Pearl's Rung 3 (Counterfactual) analysis for legal causation.
 * 
 * The But-For Test: "Would harm Y have occurred if action X was removed?"
 * 
 * In causal notation: P(~Y | do(~X), X, Y)
 * - Given that X happened and Y happened
 * - What is the probability that Y would NOT have happened if X had NOT happened?
 * 
 * Not all correlations are causations - the but-for test distinguishes them.
 * 
 * Phase 28.Legal: Pearl's Counterfactual Layer for Legal Reasoning
 * 
 * PERFORMANCE OPTIMIZATIONS (v2):
 * - Batched LLM prompts: Analyze multiple action-harm pairs in single call
 * - Early termination: Stop after finding sufficient causal chains
 * - Heuristic-first: Filter obvious cases before LLM
 */

import { getClaudeModel } from '../ai/anthropic';
import { safeParseJson } from '../ai/ai-utils';
import { 
  LegalAction, 
  Harm, 
  ButForAnalysis, 
  ButForResult 
} from '@/types/legal';

// Cache for but-for analyses (key: action-harm pair)
const analysisCache = new Map<string, ButForAnalysis>();

/**
 * Configuration for but-for analysis
 */
export interface ButForAnalyzerConfig {
  /** Use cached results if available */
  useCache?: boolean;
  /** Minimum confidence threshold for caching */
  cacheThreshold?: number;
  /** Include detailed counterfactual scenario in analysis */
  detailedScenario?: boolean;
  /** Maximum tokens for LLM response */
  maxTokens?: number;
  /** Early termination: stop after finding this many confirmed causal chains */
  maxCausalChains?: number;
  /** LLM call timeout in milliseconds */
  timeoutMs?: number;
}

const DEFAULT_CONFIG: ButForAnalyzerConfig = {
  useCache: true,
  cacheThreshold: 0.7,
  detailedScenario: true,
  maxTokens: 1024,
  maxCausalChains: 5, // Stop after finding 5 confirmed chains
  timeoutMs: 60000, // 60 second timeout for batched LLM calls (larger prompts need more time)
};

/**
 * But-For Causation Analyzer
 * 
 * Performs counterfactual analysis to determine if an action is a "but-for" cause
 * of a harm. Uses Pearl's Rung 3 (Counterfactual) reasoning.
 */
export class ButForAnalyzer {
  private config: ButForAnalyzerConfig;

  constructor(config: Partial<ButForAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze whether an action is a "but-for" cause of a harm
   * 
   * @param action - The action to analyze
   * @param harm - The harm to check causation for
   * @returns ButForAnalysis with necessity/sufficiency determination
   */
  async analyze(action: LegalAction, harm: Harm): Promise<ButForAnalysis> {
    // Generate cache key
    const cacheKey = `${action.id}->${harm.id}`;

    // Check cache if enabled
    if (this.config.useCache && analysisCache.has(cacheKey)) {
      console.log(`[ButForAnalyzer] Cache hit for ${cacheKey}`);
      return analysisCache.get(cacheKey)!;
    }

    // Step 1: Preliminary heuristic check
    const heuristicResult = this.heuristicCheck(action, harm);
    if (heuristicResult.confident) {
      const result: ButForAnalysis = {
        question: `Would "${harm.description}" have occurred if "${action.description}" was removed?`,
        counterfactualScenario: heuristicResult.scenario,
        result: heuristicResult.result,
        confidence: heuristicResult.confidence,
        reasoning: heuristicResult.reasoning,
        necessityScore: heuristicResult.result === 'necessary' || heuristicResult.result === 'both' ? 0.85 : 0.15,
        sufficiencyScore: heuristicResult.result === 'sufficient' || heuristicResult.result === 'both' ? 0.75 : 0.25,
      };

      // Cache if above threshold
      if (this.config.useCache && result.confidence >= (this.config.cacheThreshold || 0.7)) {
        analysisCache.set(cacheKey, result);
      }

      return result;
    }

    // Step 2: LLM-based counterfactual analysis
    const llmResult = await this.llmAnalysis(action, harm);

    // Cache if above threshold
    if (this.config.useCache && llmResult.confidence >= (this.config.cacheThreshold || 0.7)) {
      analysisCache.set(cacheKey, llmResult);
    }

    return llmResult;
  }

  /**
   * Heuristic check for common but-for patterns
   */
  private heuristicCheck(action: LegalAction, harm: Harm): {
    confident: boolean;
    result: ButForResult;
    confidence: number;
    scenario: string;
    reasoning: string;
  } {
    const actionText = action.description.toLowerCase();
    const harmText = harm.description.toLowerCase();
    const combinedText = `${actionText} ${harmText}`;

    // Pattern 1: Direct causation keywords (high confidence NECESSARY)
    const directCausationPatterns = [
      /directly caused/i,
      /the [a-z]+ caused/i,
      /resulted directly from/i,
      /struck and killed/i,
      /shot and wounded/i,
      /stabbed.*resulting in/i,
      /administered.*causing/i,
      /collision caused/i,
    ];

    for (const pattern of directCausationPatterns) {
      if (pattern.test(combinedText)) {
        return {
          confident: true,
          result: 'necessary',
          confidence: 0.9,
          scenario: `In a world where "${action.description}" did not occur, "${harm.description}" would not have happened.`,
          reasoning: `Direct causal language detected: "${combinedText.match(pattern)?.[0]}". The action was necessary for the harm.`,
        };
      }
    }

    // Pattern 2: Independence keywords (high confidence NEITHER)
    const independencePatterns = [
      /would have occurred anyway/i,
      /regardless of/i,
      /independent of/i,
      /coincidence/i,
      /unrelated to/i,
      /pre-existing condition/i,
      /inevitable/i,
    ];

    for (const pattern of independencePatterns) {
      if (pattern.test(combinedText)) {
        return {
          confident: true,
          result: 'neither',
          confidence: 0.85,
          scenario: `Even in a world where "${action.description}" did not occur, "${harm.description}" would still have happened due to independent factors.`,
          reasoning: `Independence language detected: "${combinedText.match(pattern)?.[0]}". The harm was not causally dependent on the action.`,
        };
      }
    }

    // Pattern 3: Concurrent cause (SUFFICIENT but may show both)
    const concurrentPatterns = [
      /also contributed/i,
      /jointly caused/i,
      /combined to cause/i,
      /concurrently/i,
      /both actions resulted/i,
    ];

    for (const pattern of concurrentPatterns) {
      if (pattern.test(combinedText)) {
        return {
          confident: true,
          result: 'sufficient',
          confidence: 0.75,
          scenario: `The action was sufficient to cause the harm, though other factors may have also been sufficient.`,
          reasoning: `Concurrent cause language detected: "${combinedText.match(pattern)?.[0]}". Multiple sufficient causes present.`,
        };
      }
    }

    // Pattern 4: Mere presence (correlationwithouth causation)
    const presenceOnlyPatterns = [
      /was present at/i,
      /witnessed the/i,
      /observed the/i,
      /at the scene/i,
    ];

    const actionIndicators = [
      /struck/i, /hit/i, /pushed/i, /pulled/i, /shot/i, /stabbed/i,
      /drove/i, /operated/i, /administered/i, /prescribed/i,
      /manufactured/i, /sold/i, /distributed/i,
    ];

    const hasPresenceOnly = presenceOnlyPatterns.some(p => p.test(actionText));
    const hasActionIndicator = actionIndicators.some(p => p.test(actionText));

    if (hasPresenceOnly && !hasActionIndicator) {
      return {
        confident: true,
        result: 'neither',
        confidence: 0.85,
        scenario: `Mere presence at the scene does not establish causation. Presence alone is not a causal mechanism.`,
        reasoning: `Correlation trap detected: Defendant's presence does not causally link to the harm without specific action.`,
      };
    }

    // No confident heuristic match - fall back to LLM
    return {
      confident: false,
      result: 'neither',
      confidence: 0,
      scenario: '',
      reasoning: 'Requires LLM counterfactual analysis',
    };
  }

  /**
   * LLM-based counterfactual analysis using Pearl's Rung 3
   */
  private async llmAnalysis(action: LegalAction, harm: Harm): Promise<ButForAnalysis> {
    const model = getClaudeModel();

    const prompt = `You are a legal causation expert performing a but-for counterfactual analysis.

## THE BUT-FOR TEST (Pearl's Rung 3 - Counterfactual)

The fundamental question: "Would the harm have occurred BUT FOR the defendant's action?"

This is a counterfactual analysis:
- In the ACTUAL world: Action A occurred, Harm H occurred
- In the COUNTERFACTUAL world: Action A did NOT occur, would Harm H still occur?

**ACTION:** ${action.description}
${action.intent ? `**INTENT:** ${action.intent.type} - ${action.intent.description}` : ''}
${action.actor ? `**ACTOR:** ${action.actor}` : ''}

**HARM:** ${harm.description}
**VICTIM:** ${harm.victim}
**TYPE:** ${harm.type}
**SEVERITY:** ${harm.severity}

## YOUR TASK:

1. Construct a detailed counterfactual scenario where the ACTION did NOT occur
2. In that counterfactual world, analyze whether the HARM would still have occurred
3. Determine the causal relationship:
   - "necessary": Harm would NOT have occurred without the action (classic but-for causation)
   - "sufficient": Action guarantees harm, but harm could occur through other means too
   - "both": Action is both necessary AND sufficient
   - "neither": No causal relationship - harm would occur regardless

4. Calculate scores:
   - Necessity Score (0-1): How necessary was the action for the harm?
     - 1.0 = Harm definitely would not occur without action
     - 0.5 = Uncertain
     - 0.0 = Harm would definitely still occur
   - Sufficiency Score (0-1): How sufficient was the action to cause harm?
     - 1.0 = Action definitely causes the type of harm
     - 0.5 = Uncertain
     - 0.0 = Action unlikely to cause this harm

## CAUSAL DISCIPLINE:
Not all correlations are causations. Be rigorous in distinguishing mere presence from actual causation.

## OUTPUT (JSON only, no markdown):
{
  "question": "Would [harm] have occurred if [action] was removed?",
  "counterfactualScenario": "Detailed description of the world where the action did not occur",
  "harmInCounterfactual": true or false,
  "result": "necessary" | "sufficient" | "both" | "neither",
  "confidence": number between 0 and 1,
  "necessityScore": number between 0 and 1,
  "sufficiencyScore": number between 0 and 1,
  "reasoning": "Detailed causal reasoning explaining your determination"
}`;

    try {
      const response = await model.generateContent(prompt);
      const parsed = safeParseJson<any>(response.response.text(), {
        question: `Would "${harm.description}" occur without "${action.description}"?`,
        counterfactualScenario: 'Unable to generate counterfactual scenario',
        harmInCounterfactual: true,
        result: 'neither',
        confidence: 0.5,
        necessityScore: 0.5,
        sufficiencyScore: 0.5,
        reasoning: 'LLM analysis failed, defaulting to uncertain',
      });

      // Derive result from harmInCounterfactual if not explicitly set correctly
      let result: ButForResult = parsed.result;
      if (parsed.harmInCounterfactual === false && result === 'neither') {
        result = 'necessary';
      }

      return {
        question: parsed.question,
        counterfactualScenario: parsed.counterfactualScenario,
        result,
        confidence: Math.min(1, Math.max(0, parsed.confidence)),
        reasoning: parsed.reasoning,
        necessityScore: Math.min(1, Math.max(0, parsed.necessityScore)),
        sufficiencyScore: Math.min(1, Math.max(0, parsed.sufficiencyScore)),
      };
    } catch (error) {
      console.error('[ButForAnalyzer] LLM analysis failed:', error);
      return {
        question: `Would "${harm.description}" occur without "${action.description}"?`,
        counterfactualScenario: 'Analysis error - unable to generate counterfactual',
        result: 'neither',
        confidence: 0.3,
        reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        necessityScore: 0.5,
        sufficiencyScore: 0.5,
      };
    }
  }

  /**
   * Batch analyze multiple action-harm pairs
   * 
   * OPTIMIZED v2: Uses batched LLM prompts + early termination
   * 
   * @param actions - Array of actions to analyze
   * @param harms - Array of harms to check against
   * @returns Map of "actionId->harmId" to ButForAnalysis
   */
  async analyzeMultiple(
    actions: LegalAction[],
    harms: Harm[]
  ): Promise<Map<string, ButForAnalysis>> {
    const results = new Map<string, ButForAnalysis>();
    let confirmedCausalChains = 0;
    const maxChains = this.config.maxCausalChains || 5;

    // Build all pairs
    const pairs: Array<{ action: LegalAction; harm: Harm; key: string }> = [];
    for (const action of actions) {
      for (const harm of harms) {
        pairs.push({ action, harm, key: `${action.id}->${harm.id}` });
      }
    }

    // Step 1: Check cache and heuristics first (no LLM calls)
    const pairsNeedingLLM: Array<{ action: LegalAction; harm: Harm; key: string }> = [];
    
    for (const { action, harm, key } of pairs) {
      // Check cache
      if (this.config.useCache && analysisCache.has(key)) {
        const cached = analysisCache.get(key)!;
        results.set(key, cached);
        if (cached.result === 'necessary' || cached.result === 'both') {
          confirmedCausalChains++;
        }
        continue;
      }

      // Try heuristic check
      const heuristicResult = this.heuristicCheck(action, harm);
      if (heuristicResult.confident) {
        const analysis: ButForAnalysis = {
          question: `Would "${harm.description}" have occurred if "${action.description}" was removed?`,
          counterfactualScenario: heuristicResult.scenario,
          result: heuristicResult.result,
          confidence: heuristicResult.confidence,
          reasoning: heuristicResult.reasoning,
          necessityScore: heuristicResult.result === 'necessary' || heuristicResult.result === 'both' ? 0.85 : 0.15,
          sufficiencyScore: heuristicResult.result === 'sufficient' || heuristicResult.result === 'both' ? 0.75 : 0.25,
        };
        results.set(key, analysis);
        
        if (this.config.useCache && analysis.confidence >= (this.config.cacheThreshold || 0.7)) {
          analysisCache.set(key, analysis);
        }
        
        if (analysis.result === 'necessary' || analysis.result === 'both') {
          confirmedCausalChains++;
        }
        continue;
      }

      // Needs LLM analysis
      pairsNeedingLLM.push({ action, harm, key });
    }

    // Step 2: Early termination check
    if (confirmedCausalChains >= maxChains) {
      console.log(`[ButForAnalyzer] Early termination: found ${confirmedCausalChains} causal chains`);
      // Mark remaining pairs as not analyzed (lower confidence)
      for (const { action, harm, key } of pairsNeedingLLM) {
        results.set(key, {
          question: `Would "${harm.description}" occur without "${action.description}"?`,
          counterfactualScenario: 'Analysis skipped due to early termination',
          result: 'neither',
          confidence: 0.3,
          reasoning: 'Sufficient causal chains already established',
          necessityScore: 0.5,
          sufficiencyScore: 0.5,
        });
      }
      return results;
    }

    // Step 3: Batch LLM analysis for remaining pairs
    if (pairsNeedingLLM.length > 0) {
      const batchAnalyses = await this.batchLLMAnalysis(pairsNeedingLLM);
      for (const [key, analysis] of batchAnalyses) {
        results.set(key, analysis);
        if (this.config.useCache && analysis.confidence >= (this.config.cacheThreshold || 0.7)) {
          analysisCache.set(key, analysis);
        }
      }
    }

    return results;
  }

  /**
   * Batched LLM analysis - analyze multiple pairs in a single prompt
   * 
   * MAJOR OPTIMIZATION: Reduces N LLM calls to 1
   * FIXED: Smaller batch size (3) to prevent hanging
   */
  private async batchLLMAnalysis(
    pairs: Array<{ action: LegalAction; harm: Harm; key: string }>
  ): Promise<Map<string, ButForAnalysis>> {
    const results = new Map<string, ButForAnalysis>();
    
    // FIXED: Reduced from 10 to 3 to prevent LLM timeouts/hangs
    const maxBatchSize = 3;
    
    console.log(`[ButForAnalyzer] Batch analyzing ${pairs.length} pairs in batches of ${maxBatchSize}`);
    
    for (let i = 0; i < pairs.length; i += maxBatchSize) {
      const batch = pairs.slice(i, i + maxBatchSize);
      console.log(`[ButForAnalyzer] Processing batch ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(pairs.length / maxBatchSize)} (${batch.length} pairs)`);
      
      try {
        const batchResults = await this.analyzeBatch(batch);
        for (const [key, analysis] of batchResults) {
          results.set(key, analysis);
        }
        console.log(`[ButForAnalyzer] Batch ${Math.floor(i / maxBatchSize) + 1} completed successfully`);
      } catch (error) {
        console.error(`[ButForAnalyzer] Batch ${Math.floor(i / maxBatchSize) + 1} failed:`, error);
        // Add default results for failed batch
        for (const { key, action, harm } of batch) {
          results.set(key, {
            question: `Would "${harm.description}" occur without "${action.description}"?`,
            counterfactualScenario: 'Batch failed - using fallback',
            result: 'neither',
            confidence: 0.3,
            reasoning: 'Batch analysis failed, using safe default',
            necessityScore: 0.5,
            sufficiencyScore: 0.5,
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Analyze a batch of action-harm pairs in a single LLM call
   */
  private async analyzeBatch(
    batch: Array<{ action: LegalAction; harm: Harm; key: string }>
  ): Promise<Map<string, ButForAnalysis>> {
    console.log(`[ButForAnalyzer] analyzeBatch called with ${batch.length} pairs`);
    const model = getClaudeModel();
    const results = new Map<string, ButForAnalysis>();

    // Build batch prompt
    const pairsText = batch.map((p, idx) => `
## PAIR ${idx + 1} (ID: ${p.key})
**ACTION:** ${p.action.description.slice(0, 200)}${p.action.description.length > 200 ? '...' : ''}
${p.action.intent ? `**INTENT:** ${p.action.intent.type}` : ''}
**HARM:** ${p.harm.description.slice(0, 200)}${p.harm.description.length > 200 ? '...' : ''}
`).join('\n---\n');
    
    console.log(`[ButForAnalyzer] Built prompt with ${pairsText.length} characters`);

    const prompt = `You are a legal causation expert performing BUT-FOR counterfactual analysis on multiple action-harm pairs.

## THE BUT-FOR TEST (Pearl's Rung 3 - Counterfactual)
For each pair, answer: "Would the harm have occurred BUT FOR the defendant's action?"

${pairsText}

## YOUR TASK
For EACH pair above, provide counterfactual analysis.

## OUTPUT FORMAT (JSON array, no markdown):
[
  {
    "pairId": "action-id->harm-id",
    "question": "Would [harm] have occurred if [action] was removed?",
    "counterfactualScenario": "Description of world where action did not occur",
    "harmInCounterfactual": true or false,
    "result": "necessary" | "sufficient" | "both" | "neither",
    "confidence": number (0-1),
    "necessityScore": number (0-1),
    "sufficiencyScore": number (0-1),
    "reasoning": "Brief causal reasoning"
  }
]

Analyze all ${batch.length} pairs concisely. Be rigorous in distinguishing correlation from causation.`;

    try {
      // Add timeout support
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('LLM timeout')), this.config.timeoutMs || 30000)
      );
      
      const responsePromise = model.generateContent(prompt);
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      const parsed = safeParseJson<any[]>(response.response.text(), []);

      // Map results back to pairs
      for (const result of parsed) {
        if (!result.pairId) continue;
        
        let butForResult: ButForResult = result.result || 'neither';
        if (result.harmInCounterfactual === false && butForResult === 'neither') {
          butForResult = 'necessary';
        }

        results.set(result.pairId, {
          question: result.question || '',
          counterfactualScenario: result.counterfactualScenario || '',
          result: butForResult,
          confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
          reasoning: result.reasoning || '',
          necessityScore: Math.min(1, Math.max(0, result.necessityScore || 0.5)),
          sufficiencyScore: Math.min(1, Math.max(0, result.sufficiencyScore || 0.5)),
        });
      }

      // Fill in any missing pairs with defaults
      for (const { key, action, harm } of batch) {
        if (!results.has(key)) {
          results.set(key, {
            question: `Would "${harm.description}" occur without "${action.description}"?`,
            counterfactualScenario: 'Could not determine from batch analysis',
            result: 'neither',
            confidence: 0.4,
            reasoning: 'Batch analysis did not return result for this pair',
            necessityScore: 0.5,
            sufficiencyScore: 0.5,
          });
        }
      }

    } catch (error) {
      console.error('[ButForAnalyzer] Batch LLM analysis failed:', error);
      // Return defaults for all pairs
      for (const { key, action, harm } of batch) {
        results.set(key, {
          question: `Would "${harm.description}" occur without "${action.description}"?`,
          counterfactualScenario: 'Analysis error - batch failed',
          result: 'neither',
          confidence: 0.3,
          reasoning: `Batch analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          necessityScore: 0.5,
          sufficiencyScore: 0.5,
        });
      }
    }

    return results;
  }

  /**
   * Filter actions that pass the but-for test for a given harm
   * 
   * @param actions - Actions to filter
   * @param harm - The harm to test against
   * @returns Actions that are necessary or both necessary and sufficient causes
   */
  async filterButForCauses(
    actions: LegalAction[],
    harm: Harm
  ): Promise<LegalAction[]> {
    const analyses = await this.analyzeMultiple(actions, [harm]);
    
    return actions.filter(action => {
      const key = `${action.id}->${harm.id}`;
      const analysis = analyses.get(key);
      return analysis && (analysis.result === 'necessary' || analysis.result === 'both');
    });
  }

  /**
   * Clear the analysis cache
   */
  clearCache(): void {
    analysisCache.clear();
    console.log('[ButForAnalyzer] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: analysisCache.size,
      keys: Array.from(analysisCache.keys()),
    };
  }
}

// Export singleton instance with default config
export const butForAnalyzer = new ButForAnalyzer();
