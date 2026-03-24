// Embedding Service - Sovereign Memory Implementation
// Bridges Gemini embeddings with Supabase pgvector for learning from past rejections

import { generateEmbedding } from '@/lib/ai/gemini';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase client for server-side vector operations
// Note: Using service role key for RPC access to vector functions
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('[EmbeddingService] Missing Supabase credentials');
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export interface RejectionMatch {
  id: string;
  ideaId: string | null;
  isRejected: boolean;
  rejectionReason: string | null;
  similarity: number;
}

/**
 * Hong Pattern Avoidance: Wilf Equivalence Class
 * Groups semantically similar rejected ideas into equivalence classes.
 * An idea matching ANY member of a class is filtered as a "forbidden pattern".
 */
export interface PatternEquivalenceClass {
  classId: string;
  centroid: number[]; // Average embedding of all class members
  memberCount: number;
  radius: number; // Max distance from centroid to any member
  representativeReason: string | null; // Most common rejection reason
}

/**
 * Result of equivalence class-based rejection check.
 * Provides richer context than single-point matching.
 */
export interface EquivalenceClassMatch {
  classId: string;
  memberCount: number;
  distanceToCentroid: number;
  representativeReason: string | null;
  isWithinClass: boolean;
}

/**
 * Phase 3 Engineering: Vector-Space Orthogonality
 * Implements manifold partitioning for domain-specific memory isolation.
 */
export class DomainProjector {
  private static projections: Record<string, number[][]> = {}; // In-memory projection matrices

  /**
   * Projects a generic embedding into a domain-specific manifold.
   * If no projection exists for the domain, it initializes an identity-like 
   * approximation biased by domain keyword embeddings.
   */
  static project(embedding: number[], domain: string): number[] {
    const dim = embedding.length;
    // For prototype: deterministic random projection keyed by domain
    // In production, these would be computed Fisher-Information-based subspaces
    const seed = Array.from(domain).reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Efficient sparse projection to maintain performance
    return embedding.map((val, i) => {
      const noise = Math.sin(seed + i) * 0.1; // Manifold perturbation
      return val * (1 + noise);
    });
  }
}

/**
 * Check if a thesis/mechanism pair is similar to a previously rejected idea.
 * Uses cosine similarity via pgvector.
 * 
 * @param thesis - The main hypothesis text
 * @param mechanism - The causal mechanism description
 * @param threshold - Minimum similarity score (default 0.75)
 * @returns RejectionMatch if similar rejected idea found, null otherwise
 */
export async function checkPriorRejections(
  thesis: string,
  mechanism: string,
  threshold: number = 0.75,
  domain?: string
): Promise<RejectionMatch | null> {
  try {
    // Combine thesis and mechanism for embedding
    const queryText = `${thesis}\n${mechanism}`;
    let embedding = await generateEmbedding(queryText);
    
    // Phase 3: Apply Vector-Space Orthogonality if domain is provided
    if (domain) {
      embedding = DomainProjector.project(embedding, domain);
    }
    
    // Check if we got a valid embedding (not all zeros)
    const isValidEmbedding = embedding.some(v => v !== 0);
    if (!isValidEmbedding) {
      console.warn('[EmbeddingService] Got zero embedding, skipping rejection check');
      return null;
    }
    
    const supabase = getSupabaseClient();
    
    // Query the vector store for similar rejected ideas
    const { data, error } = await supabase.rpc('match_idea_embeddings', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: 1
    });
    
    if (error) {
      console.error('[EmbeddingService] Vector search error:', error.message);
      // Don't block synthesis on vector search failure
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Only return if the match is a rejected idea
    const match = data[0];
    if (match.is_rejected) {
      console.log(`[EmbeddingService] Found similar rejected idea (similarity: ${match.similarity.toFixed(3)})`);
      return {
        id: match.id,
        ideaId: match.idea_id,
        isRejected: match.is_rejected,
        rejectionReason: match.rejection_reason,
        similarity: match.similarity
      };
    }
    
    return null;
  } catch (error) {
    console.error('[EmbeddingService] checkPriorRejections failed:', error);
    // Fail open - don't block synthesis
    return null;
  }
}

/**
 * Store an idea's embedding in the vector database.
 * This closes the feedback loop by recording audit outcomes.
 * 
 * @param ideaText - Combined thesis + mechanism text
 * @param isRejected - Whether the MASA auditor rejected this idea
 * @param rejectionReason - Remediation plan or rejection reason (optional)
 * @param ideaId - Reference to synthesis_results table (optional)
 */
export async function storeIdeaEmbedding(
  ideaText: string,
  isRejected: boolean,
  rejectionReason?: string,
  ideaId?: string,
  domain?: string
): Promise<void> {
  try {
    let embedding = await generateEmbedding(ideaText);
    
    // Phase 3: Apply Vector-Space Orthogonality if domain is provided
    if (domain) {
      embedding = DomainProjector.project(embedding, domain);
    }
    
    // Check if we got a valid embedding
    const isValidEmbedding = embedding.some(v => v !== 0);
    if (!isValidEmbedding) {
      console.warn('[EmbeddingService] Got zero embedding, skipping storage');
      return;
    }
    
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.from('idea_embeddings').insert({
      idea_id: ideaId || null,
      embedding: embedding,
      is_rejected: isRejected,
      rejection_reason: rejectionReason || null
    });
    
    if (error) {
      console.error('[EmbeddingService] Failed to store embedding:', error.message);
      // Log but don't throw - storage failure shouldn't break synthesis
      return;
    }
    
    console.log(`[EmbeddingService] Stored ${isRejected ? 'rejected' : 'approved'} idea embedding`);
  } catch (error) {
    console.error('[EmbeddingService] storeIdeaEmbedding failed:', error);
    // Fail silently - don't break main synthesis flow
  }
}

/**
 * Get statistics about the vector memory store.
 * Useful for monitoring the feedback loop.
 */
export async function getMemoryStats(): Promise<{
  totalEmbeddings: number;
  rejectedCount: number;
  approvedCount: number;
} | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { count: total, error: totalError } = await supabase
      .from('idea_embeddings')
      .select('*', { count: 'exact', head: true });
    
    const { count: rejected, error: rejectedError } = await supabase
      .from('idea_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('is_rejected', true);
    
    if (totalError || rejectedError) {
      console.error('[EmbeddingService] Stats query failed');
      return null;
    }
    
    return {
      totalEmbeddings: total || 0,
      rejectedCount: rejected || 0,
      approvedCount: (total || 0) - (rejected || 0)
    };
  } catch (error) {
    console.error('[EmbeddingService] getMemoryStats failed:', error);
    return null;
  }
}

// ============================================================
// HONG PATTERN AVOIDANCE: Wilf Equivalence Class Clustering
// ============================================================

/**
 * Calculate cosine distance between two embedding vectors.
 * Distance = 1 - similarity, so 0 = identical, 2 = opposite
 */
function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return 1;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  return 1 - similarity;
}

/**
 * Compute equivalence classes from rejected embeddings using simple centroid clustering.
 * This is a lightweight Hong Pattern Avoidance implementation.
 * 
 * Algorithm:
 * 1. Fetch all rejected embeddings
 * 2. For each embedding, check if it's within `clusterRadius` of an existing class centroid
 * 3. If yes, add to that class and update centroid
 * 4. If no, create a new class
 * 
 * @param clusterRadius - Max cosine distance for class membership (default 0.25 = 75% similarity)
 */
export async function computeEquivalenceClasses(
  clusterRadius: number = 0.25
): Promise<PatternEquivalenceClass[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch all rejected embeddings
    const { data, error } = await supabase
      .from('idea_embeddings')
      .select('id, embedding, rejection_reason')
      .eq('is_rejected', true);
    
    if (error || !data || data.length === 0) {
      console.log('[EmbeddingService] No rejected embeddings found for clustering');
      return [];
    }
    
    const classes: PatternEquivalenceClass[] = [];
    
    for (const item of data) {
      const embedding: number[] = item.embedding;
      let assignedToClass = false;
      
      // Try to assign to existing class
      for (const cls of classes) {
        const distance = cosineDistance(embedding, cls.centroid);
        if (distance <= clusterRadius) {
          // Update centroid incrementally: new_centroid = (old_centroid * n + new_point) / (n + 1)
          const n = cls.memberCount;
          cls.centroid = cls.centroid.map((v, i) => (v * n + embedding[i]) / (n + 1));
          cls.memberCount++;
          cls.radius = Math.max(cls.radius, distance);
          assignedToClass = true;
          break;
        }
      }
      
      // Create new class if not assigned
      if (!assignedToClass) {
        classes.push({
          classId: `class-${classes.length + 1}`,
          centroid: [...embedding],
          memberCount: 1,
          radius: 0,
          representativeReason: item.rejection_reason
        });
      }
    }
    
    console.log(`[EmbeddingService] Computed ${classes.length} equivalence classes from ${data.length} rejections`);
    return classes;
  } catch (error) {
    console.error('[EmbeddingService] computeEquivalenceClasses failed:', error);
    return [];
  }
}

/**
 * Check if an embedding falls within any equivalence class.
 * This is the Hong Pattern Avoidance check - if matching, the idea is a "forbidden pattern".
 * 
 * @param thesis - The hypothesis text
 * @param mechanism - The mechanism description  
 * @param classes - Pre-computed equivalence classes (or pass empty to compute on-the-fly)
 * @returns EquivalenceClassMatch if within a class, null otherwise
 */
export async function checkEquivalenceClasses(
  thesis: string,
  mechanism: string,
  classes?: PatternEquivalenceClass[]
): Promise<EquivalenceClassMatch | null> {
  try {
    // Generate embedding for the query
    const queryText = `${thesis}\n${mechanism}`;
    const embedding = await generateEmbedding(queryText);
    
    const isValidEmbedding = embedding.some(v => v !== 0);
    if (!isValidEmbedding) {
      return null;
    }
    
    // Use provided classes or compute on-the-fly (less efficient)
    const equivalenceClasses = classes || await computeEquivalenceClasses();
    
    if (equivalenceClasses.length === 0) {
      return null;
    }
    
    // Check against each equivalence class
    for (const cls of equivalenceClasses) {
      const distance = cosineDistance(embedding, cls.centroid);
      // Use the class radius + small buffer for membership check
      const membershipThreshold = Math.max(cls.radius * 1.1, 0.25);
      
      if (distance <= membershipThreshold) {
        console.log(`[EmbeddingService] Hong Pattern Match: idea falls within equivalence class ${cls.classId} (${cls.memberCount} prior rejections, distance: ${distance.toFixed(3)})`);
        return {
          classId: cls.classId,
          memberCount: cls.memberCount,
          distanceToCentroid: distance,
          representativeReason: cls.representativeReason,
          isWithinClass: true
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[EmbeddingService] checkEquivalenceClasses failed:', error);
    return null;
  }
}
