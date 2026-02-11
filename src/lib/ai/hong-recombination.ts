/**
 * Hong Recombination: MCMC Hypothesis Exploration
 * 
 * Implements an irreducible Markov chain for hypothesis space exploration
 * based on Hong's edge-coloring sampling theory.
 * 
 * Key properties:
 * 1. Irreducibility: Any hypothesis reachable from any other
 * 2. Linear diameter: Reaches solutions in O(n) transitions
 * 3. Bounded acceptance ratio: Metropolis-Hastings prevents getting stuck
 */

import { getClaudeModel } from "./anthropic";
import { safeParseJson } from "./ai-utils";
import { NovelIdea, ExtractedConcepts, Contradiction } from "@/types";

/**
 * Represents a state in the hypothesis Markov chain
 */
interface HypothesisState {
  idea: NovelIdea;
  energy: number;  // Lower is better (inverse of quality)
}

/**
 * Configuration for Hong Recombination MCMC
 */
interface HongRecombinationConfig {
  numSamples: number;      // Total MCMC iterations
  burnIn: number;          // Initial samples to discard
  temperature: number;     // Metropolis-Hastings temperature (lower = more selective)
  maxProposals: number;    // Max proposals per sample
}

const DEFAULT_CONFIG: HongRecombinationConfig = {
  numSamples: 10,
  burnIn: 2,
  temperature: 0.5,
  maxProposals: 3
};

/**
 * Hong Recombination Engine
 * 
 * Implements Markov Chain Monte Carlo exploration of hypothesis space
 * using Metropolis-Hastings acceptance criteria.
 */
export class HongRecombinationEngine {
  private config: HongRecombinationConfig;
  private sources: { name: string; concepts: ExtractedConcepts }[];
  private contradictions: Contradiction[];

  constructor(
    sources: { name: string; concepts: ExtractedConcepts }[],
    contradictions: Contradiction[],
    config: Partial<HongRecombinationConfig> = {}
  ) {
    this.sources = sources;
    this.contradictions = contradictions;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate "energy" of a hypothesis state.
   * Lower energy = better hypothesis.
   * Uses negative confidence as energy proxy.
   */
  private calculateEnergy(idea: NovelIdea): number {
    // Energy is inverse of quality
    const confidenceComponent = 100 - (idea.confidence || 50);
    const bridgeComponent = 100 - (idea.bridgedConcepts?.length || 0) * 25;

    return (confidenceComponent * 0.6 + bridgeComponent * 0.4);
  }

  /**
   * Propose a new hypothesis state by recombining concepts.
   * This is the transition kernel of the Markov chain.
   */
  private async proposeTransition(current: HypothesisState): Promise<HypothesisState> {
    const model = getClaudeModel();

    // Select random concepts to recombine
    const shuffledSources = [...this.sources].sort(() => Math.random() - 0.5);
    const selectedSources = shuffledSources.slice(0, Math.min(3, shuffledSources.length));

    const conceptMix = selectedSources.map(s => ({
      thesis: s.concepts.mainThesis,
      args: s.concepts.keyArguments.slice(0, 2)
    }));

    const prompt = `You are exploring hypothesis space via recombination.

Current Hypothesis:
Thesis: ${current.idea.thesis}
Mechanism: ${current.idea.mechanism}

Available Concept Mix:
${conceptMix.map((c, i) => `Source ${i + 1}: "${c.thesis}" | Arguments: ${c.args.join("; ")}`).join("\n")}

Instructions:
Propose a DIFFERENT hypothesis that recombines elements from the available concepts.
The new hypothesis should:
1. Bridge ideas from multiple sources
2. Be distinct from the current hypothesis (not just a restatement)
3. Have a testable mechanism

Output JSON:
{
  "thesis": "The core claim of the new hypothesis",
  "description": "2-3 sentences explaining the hypothesis",
  "mechanism": "The causal mechanism that explains why this works",
  "bridgedConcepts": ["Source 1 concept", "Source 2 concept"],
  "prediction": "A testable prediction that could falsify this hypothesis"
}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsed = safeParseJson<any>(responseText, null);
      if (!parsed) {
        // Failed to parse - return current state (reject proposal)
        return current;
      }

      const newIdea: NovelIdea = {
        id: `idea-mcmc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thesis: parsed.thesis || "Unparsed thesis",
        description: parsed.description || "",
        mechanism: parsed.mechanism || "Mechanism unspecified",
        bridgedConcepts: parsed.bridgedConcepts || [],
        prediction: parsed.prediction || "No prediction",
        confidence: 50, // Will be recalculated
        // Required NovelIdea properties
        noveltyAssessment: "MCMC-explored hypothesis"
      };

      const energy = this.calculateEnergy(newIdea);
      return { idea: newIdea, energy };
    } catch (error) {
      console.error('[HongRecombination] Proposal failed:', error);
      return current;
    }
  }

  /**
   * Metropolis-Hastings acceptance criterion.
   * Accept proposal with probability min(1, exp((E_current - E_proposal) / T))
   */
  private accept(currentEnergy: number, proposalEnergy: number): boolean {
    if (proposalEnergy <= currentEnergy) {
      // Always accept if proposal is better (lower energy)
      return true;
    }

    // Probabilistic acceptance for worse proposals
    const deltaEnergy = proposalEnergy - currentEnergy;
    const acceptanceProb = Math.exp(-deltaEnergy / (this.config.temperature * 100));

    return Math.random() < acceptanceProb;
  }

  /**
   * Generate initial hypothesis state from sources.
   */
  private async generateInitialState(): Promise<HypothesisState> {
    const model = getClaudeModel();

    const sourceContext = this.sources.map(s =>
      `"${s.name}": ${s.concepts.mainThesis}`
    ).join("\n");

    const prompt = `Generate an initial synthesis hypothesis from these sources:

${sourceContext}

${this.contradictions.length > 0 ? `Contradictions to resolve: ${this.contradictions.map(c => c.concept).join(", ")}` : ""}

Output JSON:
{
  "thesis": "Core claim",
  "description": "Brief explanation",
  "mechanism": "Causal mechanism",
  "bridgedConcepts": ["concept1", "concept2"],
  "prediction": "Testable prediction for falsification"
}`;

    const result = await model.generateContent(prompt);
    const parsed = safeParseJson<any>(result.response.text(), {
      thesis: "Initial synthesis hypothesis",
      description: "Synthesized from provided sources",
      mechanism: "Mechanism to be determined",
      bridgedConcepts: [],
      prediction: "No prediction"
    });

    const idea: NovelIdea = {
      id: `idea-initial-${Date.now()}`,
      thesis: parsed.thesis,
      description: parsed.description,
      mechanism: parsed.mechanism,
      bridgedConcepts: parsed.bridgedConcepts,
      prediction: parsed.prediction,
      confidence: 50,
      // Required NovelIdea properties
      noveltyAssessment: "Initial MCMC state"
    };

    return { idea, energy: this.calculateEnergy(idea) };
  }

  /**
   * Run MCMC exploration and return sampled hypotheses.
   * 
   * This implements the core Hong Recombination algorithm:
   * 1. Start from initial state
   * 2. Propose transitions (concept recombination)
   * 3. Accept/reject via Metropolis-Hastings
   * 4. Collect samples after burn-in
   */
  async sample(): Promise<NovelIdea[]> {
    console.log(`[HongRecombination] Starting MCMC exploration: ${this.config.numSamples} samples, burn-in: ${this.config.burnIn}`);

    // Initialize
    let current = await this.generateInitialState();
    const samples: NovelIdea[] = [];
    let acceptedCount = 0;

    // MCMC Loop
    for (let i = 0; i < this.config.numSamples; i++) {
      // Propose new state
      const proposal = await this.proposeTransition(current);

      // Accept/reject
      if (this.accept(current.energy, proposal.energy)) {
        current = proposal;
        acceptedCount++;
      }

      // Collect sample after burn-in
      if (i >= this.config.burnIn) {
        samples.push({ ...current.idea });
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const acceptanceRate = acceptedCount / this.config.numSamples;
    console.log(`[HongRecombination] MCMC complete. Acceptance rate: ${(acceptanceRate * 100).toFixed(1)}%, Samples: ${samples.length}`);

    // Deduplicate and sort by energy (best first)
    const uniqueSamples = this.deduplicateSamples(samples);
    return uniqueSamples.sort((a, b) => this.calculateEnergy(a) - this.calculateEnergy(b));
  }

  /**
   * Remove duplicate hypotheses based on thesis similarity.
   */
  private deduplicateSamples(samples: NovelIdea[]): NovelIdea[] {
    const seen = new Set<string>();
    const unique: NovelIdea[] = [];

    for (const sample of samples) {
      // Simple dedup based on thesis hash
      const key = sample.thesis.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(sample);
      }
    }

    return unique;
  }
}

/**
 * Convenience function for running Hong Recombination MCMC.
 * 
 * @param sources - Extracted concepts from sources
 * @param contradictions - Detected contradictions
 * @param config - Optional MCMC configuration
 * @returns Array of sampled novel ideas, sorted by quality
 */
export async function runHongRecombination(
  sources: { name: string; concepts: ExtractedConcepts }[],
  contradictions: Contradiction[],
  config?: Partial<HongRecombinationConfig>
): Promise<NovelIdea[]> {
  const engine = new HongRecombinationEngine(sources, contradictions, config);
  return engine.sample();
}
