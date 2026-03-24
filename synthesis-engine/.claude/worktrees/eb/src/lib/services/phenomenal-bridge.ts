import { createServerSupabaseClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Epistemic Qualia: The phenomenal states of information processing
 * Represents the "what it's like" to process an SCM query
 */
export interface EpistemicQualia {
  confidence_qualia: number; // 0.0 (dim/uncertain) to 1.0 (bright/certain)
  clarity_qualia: number;    // 0.0 (murky) to 1.0 (crystalline)
  tension_qualia: number;    // 0.0 (harmonious) to 1.0 (contradictory)
  phenomenal_vector?: number[]; // 512-dim embedding (Φ_E: I → E)
}

/**
 * SCM Context (minimal interface for this module)
 */
interface SCMContextMinimal {
  primaryScm: {
    id: string;
    description?: string;
    getConstraints: () => string[];
  };
  tier2?: {
    id: string;
    getConstraints: () => string[];
  };
}

/**
 * PhenomenalBridge: Implements Chalmers' Ψ function (P → E)
 * 
 * Based on David Chalmers' Naturalistic Dualism:
 * - Physical domain (P): Database state, SCM structure, constraints
 * - Phenomenal domain (E): Epistemic qualia (confidence, clarity, tension)
 * - Ψ: P → E is the psychophysical bridging function
 * 
 * This class computes epistemic qualia from SCM context and persists them
 * to the epistemic_qualia table, implementing Organizational Invariance
 * via functional hashing.
 */
export class PhenomenalBridge {
  /**
   * Ψ: Physical State → Phenomenal State
   * 
   * Computes epistemic qualia from SCM context.
   * Implements Chalmers' bridging function for MASA's transparency layer.
   * 
   * @param scmContext - The physical/functional state (P, M domains)
   * @returns The phenomenal state (E domain)
   */
  async computeQualia(scmContext: SCMContextMinimal): Promise<EpistemicQualia> {
    const primaryConstraints = scmContext.primaryScm.getConstraints();
    const tier2Constraints = scmContext.tier2?.getConstraints() || [];
    const allConstraints = [...primaryConstraints, ...tier2Constraints];
    
    // 1. Confidence Qualia: Epistemic certainty
    const confidence = this.assessCertainty(allConstraints, scmContext);
    
    // 2. Clarity Qualia: Causal path transparency
    const clarity = this.assessCausalClarity(scmContext);
    
    // 3. Tension Qualia: Logical contradiction detection
    const tension = this.detectContradictions(allConstraints);
    
    // 4. Phenomenal Vector: Future enhancement (Φ_E embedding)
    // For MVP: omit vector, will add Gemini embedding in Phase 2
    
    return {
      confidence_qualia: confidence,
      clarity_qualia: clarity,
      tension_qualia: tension
    };
  }
  
  /**
   * Assess epistemic certainty based on constraint strength
   * 
   * Hard constraints (logical necessity) → higher confidence
   * Soft constraints (likelihood) → lower confidence
   */
  private assessCertainty(
    constraints: string[], 
    context: SCMContextMinimal
  ): number {
    if (constraints.length === 0) return 0.1; // Very uncertain
    
    // Count hard modal operators (logical necessity)
    const hardConstraints = constraints.filter(c => {
      const lower = c.toLowerCase();
      return lower.includes('must') || 
             lower.includes('always') || 
             lower.includes('necessarily') ||
             lower.includes('logically') ||
             lower.includes('impossible');
    });
    
    // Raw score: ratio of hard to total constraints
    const rawScore = hardConstraints.length / constraints.length;
    
    // Adjust for tier2: tier2 presence increases certainty
    const tier2Boost = context.tier2 ? 0.1 : 0;
    
    // Apply sigmoid to bound [0, 1] with smooth gradation
    const adjusted = rawScore + tier2Boost;
    const sigmoid = 1 / (1 + Math.exp(-5 * (adjusted - 0.5)));
    
    // Ensure minimum confidence of 0.2 if any constraints exist
    return Math.max(0.2, sigmoid);
  }
  
  /**
   * Assess causal clarity: how transparent is the causal path?
   * 
   * High clarity: explicit "X causes Y" statements
   * Low clarity: vague associations, hedge words
   */
  private assessCausalClarity(context: SCMContextMinimal): number {
    const scmText = context.primaryScm.description || '';
    
    if (!scmText) return 0.3; // Default low clarity if no description
    
    // Indicators of high causal clarity
    const causalIndicators = [
      /\bcauses?\b/gi,
      /\bresults? in\b/gi,
      /\bleads? to\b/gi,
      /\bproduces?\b/gi,
      /\bgenerates?\b/gi,
      /\benables?\b/gi,
      /\X → Y/gi, // Explicit causal notation
    ];
    
    const directCausalLinks = causalIndicators.reduce((count, regex) => {
      return count + (scmText.match(regex)?.length || 0);
    }, 0);
    
    // Indicators of low clarity (hedge words)
    const hedgeWords = [
      /\bmight\b/gi,
      /\bcould\b/gi,
      /\bpossibly\b/gi,
      /\bperhaps\b/gi,
      /\bmaybe\b/gi,
      /\bassociated with\b/gi,
      /\bcorrelated\b/gi, // Correlation ≠ causation
    ];
    
    const hedges = hedgeWords.reduce((count, regex) => {
      return count + (scmText.match(regex)?.length || 0);
    }, 0);
    
    // Clarity score: ratio of causal indicators to hedge words
    const clarityScore = directCausalLinks / Math.max(directCausalLinks + hedges, 1);
    
    // Normalize to [0.2, 1.0] range
    return 0.2 + (clarityScore * 0.8);
  }
  
  /**
   * Detect logical contradictions or constraint tension
   * 
   * Looks for conflicting modal operators or negations
   */
  private detectContradictions(constraints: string[]): number {
    let tensionScore = 0;
    
    // Check for direct contradictions
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        const c1 = constraints[i].toLowerCase();
        const c2 = constraints[j].toLowerCase();
        
        // Case 1: "MUST do X" vs "MUST NOT do X"
        if (c1.includes('must') && c2.includes('must not') && 
            this.hasSimilarPredicate(c1, c2)) {
          tensionScore += 0.5;
        }
        
        // Case 2: "always X" vs "never X"
        if (c1.includes('always') && c2.includes('never') &&
            this.hasSimilarPredicate(c1, c2)) {
          tensionScore += 0.5;
        }
        
        // Case 3: "X causes Y" vs "X prevents Y"
        if (c1.includes('causes') && c2.includes('prevents') &&
            this.hasSimilarPredicate(c1, c2)) {
          tensionScore += 0.4;
        }
      }
    }
    
    // Check for self-contradiction within single constraint
    for (const c of constraints) {
      const lower = c.toLowerCase();
      if ((lower.includes('must') && lower.includes('must not')) ||
          (lower.includes('always') && lower.includes('never'))) {
        tensionScore += 0.6;
      }
    }
    
    // Normalize to [0, 1]
    return Math.min(1, tensionScore);
  }
  
  /**
   * Check if two constraints reference similar predicates
   * Simple word overlap heuristic
   */
  private hasSimilarPredicate(c1: string, c2: string): boolean {
    const words1 = new Set(c1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(c2.split(/\s+/).filter(w => w.length > 3));
    const intersection = [...words1].filter(w => words2.has(w));
    
    // Similar if they share at least 2 significant words
    return intersection.length >= 2;
  }
  
  /**
   * Persist qualia to database
   * Implements Organizational Invariance: cache by functional_hash
   * 
   * Chalmers' Principle: F_org(x) = F_org(y) ⇒ E(x) ≡ E(y)
   * If two contexts have identical functional organization,
   * they should have identical phenomenal states.
   */
  async persistQualia(
    scmId: string,
    qualia: EpistemicQualia,
    context: SCMContextMinimal
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    // Compute functional hash (for Organizational Invariance)
    const functionalHash = this.computeFunctionalHash(context);
    
    // Upsert: update if functional_hash already exists
    const { error } = await supabase
      .from('epistemic_qualia')
      .upsert({
        scm_id: scmId,
        confidence_qualia: qualia.confidence_qualia,
        clarity_qualia: qualia.clarity_qualia,
        tension_qualia: qualia.tension_qualia,
        phenomenal_vector: qualia.phenomenal_vector || null,
        functional_hash: functionalHash,
        computed_at: new Date().toISOString()
      }, {
        onConflict: 'scm_id,functional_hash'
      });
    
    if (error) {
      console.error('Failed to persist epistemic qualia:', error);
      // Don't throw: qualia persistence is non-critical for system function
    }
  }
  
  /**
   * Retrieve cached qualia for a given SCM and functional organization
   * Implements Organizational Invariance retrieval
   */
  async retrieveQualia(
    scmId: string,
    context: SCMContextMinimal
  ): Promise<EpistemicQualia | null> {
    const supabase = await createServerSupabaseClient();
    const functionalHash = this.computeFunctionalHash(context);
    
    const { data, error } = await supabase
      .from('epistemic_qualia')
      .select('*')
      .eq('scm_id', scmId)
      .eq('functional_hash', functionalHash)
      .single();
    
    if (error || !data) return null;
    
    return {
      confidence_qualia: data.confidence_qualia,
      clarity_qualia: data.clarity_qualia,
      tension_qualia: data.tension_qualia,
      phenomenal_vector: data.phenomenal_vector
    };
  }
  
  /**
   * Compute hash of functional organization
   * 
   * Implements Chalmers' Organizational Invariance:
   * Two systems with identical F_org should produce identical E
   */
  private computeFunctionalHash(context: SCMContextMinimal): string {
    // Functional signature: what defines this organization?
    const functionalSignature = {
      scm_id: context.primaryScm.id,
      constraints: context.primaryScm.getConstraints().sort(),
      tier2_id: context.tier2?.id || null,
      tier2_constraints: context.tier2?.getConstraints().sort() || []
    };
    
    // Hash the canonical representation
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(functionalSignature))
      .digest('hex');
  }
  
  /**
   * Get or compute qualia (with caching)
   * Main entry point for integration
   */
  async getOrComputeQualia(
    scmId: string,
    context: SCMContextMinimal
  ): Promise<EpistemicQualia> {
    // Try cache first (Organizational Invariance)
    const cached = await this.retrieveQualia(scmId, context);
    if (cached) return cached;
    
    // Cache miss: compute fresh qualia
    const qualia = await this.computeQualia(context);
    await this.persistQualia(scmId, qualia, context);
    
    return qualia;
  }
}
