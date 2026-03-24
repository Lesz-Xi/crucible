/**
 * Axiom Compression Service - Fractal Memory Implementation
 * 
 * This service compresses chat sessions into high-level causal axioms,
 * enabling the system to distill conversations into persistent "Truths"
 * stored in the causal_axioms table.
 * 
 * Following Demis Workflow:
 * - L1 Impact: Service runs async to not block UI
 * - L2 Risk: Deduplication prevents duplicate axioms
 * - L3 Calibration: LLM calls batched to minimize token usage
 * - L4 Critical Gap: Requires ANTHROPIC_API_KEY for compression
 */

import { getClaudeModel } from "@/lib/ai/anthropic";
import { CausalIntegrityService, CausalDensityResult } from "@/lib/ai/causal-integrity-service";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface AxiomCompressionResult {
  /** The compressed "law" or "truth" derived from the conversation */
  axiom: string;
  /** Confidence score 0.0 - 1.0 */
  confidence: number;
  /** Array of message IDs that contributed to this axiom */
  derivedFrom: string[];
  /** Highest causal level detected in source messages */
  causalLevel: 1 | 2 | 3;
  /** Domain classification (e.g., 'physics', 'biology', 'economics') */
  domain: string;
  /** Mechanisms identified in the source */
  mechanisms: string[];
}

export interface MessageWithDensity {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  causal_density?: CausalDensityResult;
  created_at: string;
}

/**
 * Service for compressing chat sessions into causal axioms.
 * Implements the "Fractal Memory" pattern from the MASA architecture.
 */
export class AxiomCompressionService {
  private llm = getClaudeModel();
  private causalService = new CausalIntegrityService();
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error("Supabase credentials missing for AxiomCompressionService");
    }
    
    this.supabase = createClient(url, key);
  }

  /**
   * Compress an entire chat session into causal axioms.
   * Only processes messages with L3 (Counterfactual) causal density.
   * 
   * @param sessionId - The UUID of the chat session to compress
   * @returns Array of extracted axioms
   */
  async compressSession(sessionId: string): Promise<AxiomCompressionResult[]> {
    // Fetch all messages for this session
    const { data: messages, error } = await this.supabase
      .from("causal_chat_messages")
      .select("id, content, role, causal_density, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[AxiomCompression] Failed to fetch messages:", error);
      throw new Error(`Failed to fetch session messages: ${error.message}`);
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Filter to L3 messages only (high-quality counterfactual reasoning)
    const l3Messages = messages.filter((msg: MessageWithDensity) => {
      const density = msg.causal_density;
      return density && density.score === 3 && density.confidence >= 0.7;
    });

    if (l3Messages.length === 0) {
      console.log(`[AxiomCompression] No L3 messages in session ${sessionId}, skipping compression`);
      return [];
    }

    // Group related messages (within 5 minutes of each other)
    const messageGroups = this.groupRelatedMessages(l3Messages);
    
    // Extract axioms from each group
    const axioms: AxiomCompressionResult[] = [];
    
    for (const group of messageGroups) {
      try {
        const axiom = await this.extractAxiomFromGroup(group);
        if (axiom && axiom.confidence >= 0.9) {
          // Check for duplicates before adding
          const isDuplicate = await this.checkForDuplicate(axiom.axiom);
          if (!isDuplicate) {
            axioms.push(axiom);
            await this.saveAxiom(sessionId, axiom);
          }
        }
      } catch (err) {
        console.error("[AxiomCompression] Failed to extract axiom from group:", err);
      }
    }

    console.log(`[AxiomCompression] Extracted ${axioms.length} axioms from session ${sessionId}`);
    return axioms;
  }

  /**
   * Extract an axiom from a single high-quality message.
   * Used for real-time extraction during streaming.
   * 
   * @param message - The message to extract from
   * @returns The extracted axiom or null if not qualified
   */
  async extractFromMessage(message: MessageWithDensity): Promise<AxiomCompressionResult | null> {
    if (!this.qualifiesForExtraction(message)) {
      return null;
    }

    const group: MessageWithDensity[] = [message];
    return this.extractAxiomFromGroup(group);
  }

  /**
   * Check if a message qualifies for axiom extraction.
   * Requires L3 (Counterfactual) causal density with high confidence.
   * 
   * @param message - The message to check
   * @returns True if the message qualifies
   */
  qualifiesForExtraction(message: MessageWithDensity): boolean {
    const density = message.causal_density;
    if (!density) return false;
    
    // Must be L3 (Counterfactual) with high confidence
    return density.score === 3 && density.confidence >= 0.8;
  }

  /**
   * Get all axioms for a session.
   * 
   * @param sessionId - The session UUID
   * @returns Array of stored axioms
   */
  async getAxiomsForSession(sessionId: string): Promise<AxiomCompressionResult[]> {
    const { data, error } = await this.supabase
      .from("causal_axioms")
      .select("*")
      .eq("session_id", sessionId)
      .order("confidence_score", { ascending: false });

    if (error) {
      console.error("[AxiomCompression] Failed to fetch axioms:", error);
      throw error;
    }

    return (data || []).map(row => ({
      axiom: row.axiom_content,
      confidence: row.confidence_score,
      derivedFrom: row.derived_from_messages || [],
      causalLevel: 3, // All stored axioms are L3
      domain: "general", // Could be extracted from session metadata
      mechanisms: [], // Could be stored in future schema update
    }));
  }

  /**
   * Group related messages by temporal proximity (within 5 minutes).
   */
  private groupRelatedMessages(messages: MessageWithDensity[]): MessageWithDensity[][] {
    if (messages.length === 0) return [];
    
    const groups: MessageWithDensity[][] = [];
    let currentGroup: MessageWithDensity[] = [messages[0]];
    
    for (let i = 1; i < messages.length; i++) {
      const prevMsg = messages[i - 1];
      const currMsg = messages[i];
      
      const prevTime = new Date(prevMsg.created_at).getTime();
      const currTime = new Date(currMsg.created_at).getTime();
      const diffMinutes = (currTime - prevTime) / (1000 * 60);
      
      if (diffMinutes <= 5) {
        currentGroup.push(currMsg);
      } else {
        groups.push(currentGroup);
        currentGroup = [currMsg];
      }
    }
    
    groups.push(currentGroup);
    return groups;
  }

  /**
   * Use LLM to extract a causal axiom from a group of messages.
   */
  private async extractAxiomFromGroup(messages: MessageWithDensity[]): Promise<AxiomCompressionResult | null> {
    const combinedContent = messages.map(m => m.content).join("\n\n");
    
    const prompt = `You are a scientific reasoning compression engine. Your task is to distill the following high-level causal reasoning into a concise, universal "axiom" or "law".

Source text:
"""
${combinedContent}
"""

Extract a single, crisp causal axiom that captures the core insight. The axiom should:
1. Be a standalone statement of causation
2. Use precise scientific language
3. Be falsifiable (could be tested)
4. Capture the counterfactual nature (what would happen if X were different)

Respond in this exact JSON format:
{
  "axiom": "The concise causal law or principle",
  "confidence": 0.95,
  "domain": "physics|biology|economics|psychology|general",
  "mechanisms": ["mechanism1", "mechanism2"]
}

Confidence should be 0.0-1.0 based on how well the source supports the axiom.`;

    try {
      const response = await this.llm.generateContent(prompt);
      const text = response.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("[AxiomCompression] No JSON found in LLM response");
        return null;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        axiom: parsed.axiom,
        confidence: parsed.confidence,
        derivedFrom: messages.map(m => m.id),
        causalLevel: 3,
        domain: parsed.domain || "general",
        mechanisms: parsed.mechanisms || [],
      };
    } catch (err) {
      console.error("[AxiomCompression] LLM extraction failed:", err);
      return null;
    }
  }

  /**
   * Check if a similar axiom already exists in the database.
   * Uses simple string similarity (could be enhanced with embeddings).
   */
  private async checkForDuplicate(axiom: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("causal_axioms")
      .select("axiom_content")
      .limit(100);

    if (error || !data) return false;

    // Simple similarity check - could use embeddings for better results
    for (const row of data) {
      const similarity = this.calculateSimilarity(axiom, row.axiom_content);
      if (similarity > 0.85) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate simple string similarity (Jaccard index on words).
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Save an axiom to the database.
   */
  private async saveAxiom(sessionId: string, axiom: AxiomCompressionResult): Promise<void> {
    const { error } = await this.supabase.from("causal_axioms").insert({
      session_id: sessionId,
      axiom_content: axiom.axiom,
      derived_from_messages: axiom.derivedFrom,
      confidence_score: axiom.confidence,
    });

    if (error) {
      console.error("[AxiomCompression] Failed to save axiom:", error);
      throw error;
    }
  }
}

/**
 * Singleton instance for convenience.
 */
export const axiomCompressionService = new AxiomCompressionService();
