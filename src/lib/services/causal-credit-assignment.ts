import { SCMViolation } from "../ai/causal-blueprint";
import { CounterfactualEvaluation } from "./counterfactual-generator";
import { MasaMemory } from "../ai/masa-memory";
import { MasaAudit, PriorArt } from "../../types";

export interface CausalCredit {
  mechanism_fault: number;  // 0-1: How incomplete is the mechanism?
  evidence_fault: number;   // 0-1: How poor is the evidence/confounder control?
  novelty_fault: number;    // 0-1: How similar to prior art?
  formulation_fault: number;// 0-1: How unclear/unbounded is the formulation?
}

export class CausalCreditService {
  constructor(private memory?: MasaMemory) {}

  /**
   * Calculate Causal Credit based on all 3 Pearl Layers
   * 
   * @param scmViolations - Tier 1/2 violations (Layer 1)
   * @param interventionalViolations - do-calculus warning violations (Layer 2)
   * @param counterfactualEval - Counterfactual robustness (Layer 3)
   * @param priorArt - Existing knowledge
   */
  calculateCredit(
    scmViolations: SCMViolation[] | undefined,
    interventionalViolations: any[] | undefined, // Typed as any[] to avoid circular deps if needed
    counterfactualEval: CounterfactualEvaluation | undefined,
    priorArt: PriorArt[]
  ): CausalCredit | undefined {
    // If no counterfactual evaluation, we can't fully assign credit
    if (!counterfactualEval) {
      return undefined;
    }

    // 1. Mechanism Fault (Incompleteness)
    // Base fault from counterfactual completeness
    let mechanismFault = 1.0 - counterfactualEval.completeness;
    
    // Penalty for SCM violations (Tier 1/2) - fatal ones usually reject earlier, but helpful for logging
    if (scmViolations && scmViolations.length > 0) {
        mechanismFault = Math.min(1.0, mechanismFault + 0.2);
    }
    
    // Penalty for interventional failures (Layer 2)
    if (interventionalViolations && interventionalViolations.length > 0) {
        mechanismFault = Math.min(1.0, mechanismFault + 0.15);
    }

    // 2. Evidence Fault (Confounder Handling)
    const evidenceFault = 1.0 - counterfactualEval.confounderHandling;

    // 3. Formulation Fault (Boundary Awareness)
    const formulationFault = 1.0 - counterfactualEval.boundaryAwareness;

    // 4. Novelty Fault (Similarity to Prior Art)
    const noveltyFault = this.calculateNoveltyFault(priorArt);

    return {
      mechanism_fault: parseFloat(mechanismFault.toFixed(2)),
      evidence_fault: parseFloat(evidenceFault.toFixed(2)),
      novelty_fault: parseFloat(noveltyFault.toFixed(2)),
      formulation_fault: parseFloat(formulationFault.toFixed(2))
    };
  }

  /**
   * Calculate novelty fault (0 = pure novelty, 1 = duplicate)
   */
  private calculateNoveltyFault(priorArt: PriorArt[]): number {
    if (!priorArt || priorArt.length === 0) {
      return 0; // Highly novel
    }
    // Simple heuristic: based on similarity scores if available, or count
    // Assuming priorArt comes with some similarity metric, otherwise use count
    // MASA passes raw PriorArt objects. Let's assume average relevance score if available?
    // For now, heuristic: 
    // fault = min(1.0, count * 0.1)
    return Math.min(priorArt.length * 0.1, 1.0);
  }

  /**
   * Record failure pattern to Sovereign Memory
   * Only records if the idea failed (score < 50) AND we have causal credit data
   */
  async recordFailurePattern(audit: MasaAudit, domain: string) {
    if (audit.finalSynthesis.validityScore < 50 && audit.causal_credit) {
       // This would be where we store (domain, failure_vector) tuples
       // For now, we delegate to MasaMemory if it has a specific method, 
       // or we log it for future analysis.
       
       console.log(`[CausalCredit] Recording failure pattern for domain '${domain}':`, audit.causal_credit);
       
       // Phase 28 Comp 4: Record failure pattern
       if (this.memory) {
           this.memory.recordFailurePattern(domain, audit.causal_credit);
       }
    }
  }
}
