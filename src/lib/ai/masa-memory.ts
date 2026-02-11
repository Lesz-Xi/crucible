/**
 * MASA Memory (Layer 0: Engrams & Pattern Replay)
 * 
 * Implements Ch 14 from Psycho-Cybernetics: "How to Get That Winning Feeling"
 * Stores successful audit patterns as "engrams" (neural patterns) and replays them
 * when encountering similar ideas to accelerate performance.
 * 
 * Key Insight: "By vividly recalling past successes, one reactivates these specific
 * engrams and the accompanying 'winning feeling'."
 */

export interface Engram {
  id: string;
  domain: string;           // e.g., "Mechanistic Interpretability"
  lens: string;             // e.g., "Complexity Theory", "Thermodynamics"
  score: number;            // Validity score achieved
  critique_pattern: string; // What made it successful
  thesis_keywords: string[]; // For similarity matching
  timestamp: Date;
}

export interface PatternMatch {
  engram: Engram;
  similarity: number; // 0-1, based on keyword overlap
}

export interface FailurePatternVector {
  mechanism_fault: number;
  evidence_fault: number;
  novelty_fault: number;
  formulation_fault: number;
}

/**
 * MasaMemory: The engram storage and replay system
 * 
 * Chapter Mappings:
 * - Ch 14: Engrams (stored success patterns)
 * - Ch 15: Life Force (pattern replay energizes the system)
 */
export class MasaMemory {
  private engrams: Engram[] = [];
  private failurePatterns: Array<{ domain: string; vector: FailurePatternVector; timestamp: Date }> = [];
  private readonly MAX_ENGRAMS = 50; // Limit memory size

  /**
   * Ch 14: Record a successful audit as an engram
   * Only store audits with scores > 70 (approved ideas)
   */
  recordSuccess(
    domain: string,
    lens: string,
    score: number,
    critique: string,
    thesis: string
  ): void {
    if (score < 70) {
      console.log('[MasaMemory] Skipping low-score idea:', score);
      return;
    }

    const engram: Engram = {
      id: this.generateId(),
      domain,
      lens,
      score,
      critique_pattern: critique,
      thesis_keywords: this.extractKeywords(thesis),
      timestamp: new Date()
    };

    this.engrams.push(engram);
    console.log(`[MasaMemory] Recorded engram: ${domain} (${lens}) → ${score}/100`);

    // Prune old engrams if limit exceeded
    if (this.engrams.length > this.MAX_ENGRAMS) {
      this.engrams.sort((a, b) => b.score - a.score); // Sort by score desc
      this.engrams = this.engrams.slice(0, this.MAX_ENGRAMS);
    }
  }

  /**
   * Ch 14: Find similar successful pattern for current idea
   * Returns the best matching engram based on keyword similarity
   */
  findSimilarPattern(domain: string, thesis: string): PatternMatch | null {
    if (this.engrams.length === 0) {
      return null;
    }

    const thesisKeywords = this.extractKeywords(thesis);
    let bestMatch: PatternMatch | null = null;
    let highestSimilarity = 0;

    for (const engram of this.engrams) {
      // Domain exact match gets bonus
      const domainBonus = engram.domain === domain ? 0.3 : 0;
      
      // Keyword overlap similarity
      const overlap = this.calculateOverlap(thesisKeywords, engram.thesis_keywords);
      const similarity = overlap + domainBonus;

      if (similarity > highestSimilarity && similarity > 0.3) {
        highestSimilarity = similarity;
        bestMatch = { engram, similarity };
      }
    }

    if (bestMatch) {
      console.log(
        `[MasaMemory] Found pattern match: ${bestMatch.engram.lens} (${(bestMatch.similarity * 100).toFixed(0)}% similar)`
      );
    }

    return bestMatch;
  }

  /**
   * Get all engrams (for debugging)
   */
  getAllEngrams(): Engram[] {
    return [...this.engrams]; // Return copy
  }

  /**
   * Get statistics about stored patterns
   */
  getStats() {
    if (this.engrams.length === 0) {
      return {
        total: 0,
        avg_score: 0,
        domains: [],
        lenses: []
      };
    }

    const avgScore = this.engrams.reduce((sum, e) => sum + e.score, 0) / this.engrams.length;
    const domains = [...new Set(this.engrams.map(e => e.domain))];
    const lenses = [...new Set(this.engrams.map(e => e.lens))];

    return {
      total: this.engrams.length,
      avg_score: avgScore,
      domains,
      lenses
    };
  }

  // ========== PRIVATE HELPERS ==========

  private generateId(): string {
    return `engram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract keywords from thesis (simple tokenization)
   * In production, could use NLP/embeddings for better matching
   */
  private extractKeywords(text: string): string[] {
    // Remove common words, split, lowercase
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'that', 'this', 'these', 'those', 'will', 'would', 'could', 'should'
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Calculate Jaccard similarity (intersection / union)
   */
  private calculateOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Clear all engrams (for testing)
   */
  clear(): void {
    this.engrams = [];
    this.failurePatterns = [];
  }

  /**
   * Records recurring failure vectors for governance diagnostics.
   */
  recordFailurePattern(domain: string, vector: FailurePatternVector): void {
    this.failurePatterns.push({
      domain,
      vector,
      timestamp: new Date(),
    });
  }

  // ==============================================
  // PHASE 23: SUPABASE PERSISTENCE
  // ==============================================

  /**
   * Load engrams from Supabase for a given user.
   * Falls back to empty memory if not found (graceful degradation).
   */
  static async loadFromDatabase(userId: string, supabaseClient?: any): Promise<MasaMemory> {
    const memory = new MasaMemory();
    
    try {
      // Dynamic import to avoid SSR issues or use injected client
      let supabase;
      if (supabaseClient) {
        supabase = supabaseClient;
      } else {
        const { createClient } = await import('@/lib/supabase/client');
        supabase = createClient();
      }
      
      const { data, error } = await supabase
        .from('masa_engrams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // MAX_ENGRAMS
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        memory.engrams = data.map((row: any) => ({
          id: row.id,
          domain: row.domain,
          lens: row.lens,
          score: row.validity_score,
          critique_pattern: row.mechanism, // Store mechanism in critique_pattern
          thesis_keywords: row.thesis.split(' ').slice(0, 20), // Extract keywords from thesis
          timestamp: new Date(row.created_at)
        }));
        
        console.log(`[MasaMemory] Loaded ${memory.engrams.length} engrams from database`);
      } else {
        console.log('[MasaMemory] No saved engrams found, starting fresh');
      }
    } catch (err) {
      console.warn('[MasaMemory] Failed to load engrams from DB:', err);
      // Graceful degradation: Continue with empty memory
    }
    
    return memory;
  }

  /**
   * Save all engrams to Supabase.
   * Gracefully handles DB unavailability.
   */
  async saveToDatabase(userId: string, supabaseClient?: any): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues or use injected client
      let supabase;
      if (supabaseClient) {
        supabase = supabaseClient;
      } else {
        const { createClient } = await import('@/lib/supabase/client');
        supabase = createClient();
      }
      
      // Convert engrams to DB format
      const engramRows = this.engrams.map(engram => ({
        id: engram.id,
        user_id: userId,
        thesis: engram.thesis_keywords.join(' '), // Reconstruct thesis from keywords
        mechanism: engram.critique_pattern,
        domain: engram.domain,
        lens: engram.lens,
        validity_score: engram.score,
        created_at: engram.timestamp.toISOString()
      }));
      
      // Upsert all engrams (insert or update)
      const { error } = await supabase
        .from('masa_engrams')
        .upsert(engramRows, {
          onConflict: 'id'
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`[MasaMemory] Saved ${engramRows.length} engrams to database`);
    } catch (err) {
      console.warn('[MasaMemory] Failed to persist engrams to DB:', err);
      // Graceful degradation: Continue without persistence
    }
  }
}
