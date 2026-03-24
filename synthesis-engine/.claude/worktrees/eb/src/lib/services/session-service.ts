/**
 * Session Service - Persistent Session Memory Integration
 * 
 * Provides full persistence for chat sessions including causal density metadata,
 * session statistics, and enhanced query capabilities.
 * 
 * Following Demis Workflow:
 * - L1 Impact: Efficient queries with proper indexing
 * - L2 Risk: Graceful handling of missing data
 * - L3 Calibration: Batched saves to reduce API calls
 * - L4 Critical Gap: Requires database migration for causal_density column
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CausalDensityResult } from "@/lib/ai/causal-integrity-service";
import type { PruningDecision } from "@/types/persistent-memory";

type JsonRecord = Record<string, unknown>;

interface CausalSessionStatsRow {
  session_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  total_messages?: number | null;
  assistant_messages?: number | null;
  l3_messages?: number | null;
  l2_messages?: number | null;
  l1_messages?: number | null;
  avg_confidence?: number | null;
  extracted_axioms?: number | null;
}

interface CausalDensityMessageRow {
  causal_density?: CausalDensityResult | null;
}

interface SessionIdRow {
  session_id: string;
}

export interface SessionWithStats {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  totalMessages: number;
  assistantMessages: number;
  l3Messages: number;
  l2Messages: number;
  l1Messages: number;
  avgConfidence: number | null;
  extractedAxioms: number;
}

export interface MessageWithDensity {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  domain_classified?: string;
  scm_tier1_used?: string[];
  scm_tier2_used?: string[];
  confidence_score?: number;
  causal_density?: CausalDensityResult;
  causal_graph?: JsonRecord;
  created_at: string;
}

export interface SessionStats {
  totalMessages: number;
  assistantMessages: number;
  l3Messages: number;
  l2Messages: number;
  l1Messages: number;
  avgConfidence: number | null;
  extractedAxioms: number;
  oracleModeActivations: number;
  topMechanisms: string[];
  avgCausalLevel: number;
}

/**
 * Service for managing persistent chat sessions with causal metadata.
 */
export class SessionService {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase credentials missing for SessionService");
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Create a new chat session.
   * 
   * @param title - Session title
   * @param userId - User ID (optional for anonymous sessions)
   * @returns The created session ID
   */
  async createSession(title: string, userId?: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("causal_chat_sessions")
      .insert({
        title,
        user_id: userId || null,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[SessionService] Failed to create session:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Save a message with full causal provenance.
   * 
   * @param sessionId - The session ID
   * @param message - The message to save
   * @param densityResult - Optional causal density result
   */
  async saveMessage(
    sessionId: string,
    message: {
      role: "user" | "assistant";
      content: string;
      domain?: string;
      constraints?: string[];
      confidence?: number;
      graph?: JsonRecord;
    },
    densityResult?: CausalDensityResult
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("causal_chat_messages")
      .insert({
        session_id: sessionId,
        role: message.role,
        content: message.content,
        domain_classified: message.domain,
        scm_tier1_used: message.constraints,
        confidence_score: message.confidence,
        causal_graph: message.graph,
        causal_density: densityResult,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[SessionService] Failed to save message:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Load a session with all messages and metadata.
   * 
   * @param sessionId - The session ID to load
   * @returns Session data with messages
   */
  async loadSession(sessionId: string): Promise<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    messages: MessageWithDensity[];
  }> {
    // Get session
    const { data: session, error: sessionError } = await this.supabase
      .from("causal_chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      console.error("[SessionService] Failed to load session:", sessionError);
      throw sessionError;
    }

    // Get messages
    const { data: messages, error: messagesError } = await this.supabase
      .from("causal_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("[SessionService] Failed to load messages:", messagesError);
      throw messagesError;
    }

    return {
      ...session,
      messages: messages || [],
    };
  }

  /**
   * Get all sessions for a user with statistics.
   * 
   * @param userId - The user ID
   * @returns Array of sessions with stats
   */
  async getUserSessions(userId?: string): Promise<SessionWithStats[]> {
    let query = this.supabase
      .from("causal_session_stats")
      .select("*");

    if (userId) {
      // Filter by user if provided
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      console.error("[SessionService] Failed to get sessions:", error);
      throw error;
    }

    const rows = (data || []) as CausalSessionStatsRow[];
    return rows.map((row) => ({
      id: row.session_id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      totalMessages: row.total_messages || 0,
      assistantMessages: row.assistant_messages || 0,
      l3Messages: row.l3_messages || 0,
      l2Messages: row.l2_messages || 0,
      l1Messages: row.l1_messages || 0,
      avgConfidence: row.avg_confidence ?? null,
      extractedAxioms: row.extracted_axioms || 0,
    }));
  }

  /**
   * Get detailed statistics for a session.
   * 
   * @param sessionId - The session ID
   * @returns Session statistics
   */
  async getSessionStats(sessionId: string): Promise<SessionStats> {
    const { data, error } = await this.supabase
      .from("causal_session_stats")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (error) {
      console.error("[SessionService] Failed to get stats:", error);
      throw error;
    }

    // Calculate additional metrics
    const { data: mechanisms, error: mechError } = await this.supabase
      .from("causal_chat_messages")
      .select("causal_density")
      .eq("session_id", sessionId)
      .not("causal_density", "is", null);

    if (mechError) {
      console.error("[SessionService] Failed to get mechanisms:", mechError);
    }

    // Extract top mechanisms
    const mechanismCounts: Record<string, number> = {};
    const mechanismRows = (mechanisms || []) as CausalDensityMessageRow[];
    mechanismRows.forEach((msg) => {
      const detected = msg.causal_density?.detectedMechanisms || [];
      detected.forEach((m: string) => {
        mechanismCounts[m] = (mechanismCounts[m] || 0) + 1;
      });
    });

    const topMechanisms = Object.entries(mechanismCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Calculate average causal level
    const totalCausalMessages = (data.l3_messages || 0) + (data.l2_messages || 0) + (data.l1_messages || 0);
    const avgCausalLevel = totalCausalMessages > 0
      ? ((data.l3_messages || 0) * 3 + (data.l2_messages || 0) * 2 + (data.l1_messages || 0) * 1) / totalCausalMessages
      : 0;

    return {
      totalMessages: data.total_messages || 0,
      assistantMessages: data.assistant_messages || 0,
      l3Messages: data.l3_messages || 0,
      l2Messages: data.l2_messages || 0,
      l1Messages: data.l1_messages || 0,
      avgConfidence: data.avg_confidence,
      extractedAxioms: data.extracted_axioms || 0,
      oracleModeActivations: 0, // Would need separate tracking
      topMechanisms,
      avgCausalLevel,
    };
  }

  /**
   * Update session status.
   * 
   * @param sessionId - The session ID
   * @param status - New status (active/completed/compressed)
   */
  async updateSessionStatus(
    sessionId: string,
    status: "active" | "completed" | "compressed"
  ): Promise<void> {
    const { error } = await this.supabase
      .from("causal_chat_sessions")
      .update({ status })
      .eq("id", sessionId);

    if (error) {
      console.error("[SessionService] Failed to update status:", error);
      throw error;
    }
  }

  /**
   * Delete a session and all its messages.
   * 
   * @param sessionId - The session ID to delete
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from("causal_chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("[SessionService] Failed to delete session:", error);
      throw error;
    }
  }

  /**
   * Search within session content.
   * 
   * @param query - Search query
   * @param userId - Optional user filter
   * @returns Matching sessions
   */
  async searchSessions(query: string, userId?: string): Promise<SessionWithStats[]> {
    // Search in message content
    const { data: messageMatches, error } = await this.supabase
      .from("causal_chat_messages")
      .select("session_id")
      .ilike("content", `%${query}%`);

    if (error) {
      console.error("[SessionService] Search failed:", error);
      throw error;
    }

    const messageRows = (messageMatches || []) as SessionIdRow[];
    const sessionIds = [...new Set(messageRows.map((m) => m.session_id))];

    if (sessionIds.length === 0) return [];

    // Get full session data
    let sessionQuery = this.supabase
      .from("causal_session_stats")
      .select("*")
      .in("session_id", sessionIds);

    if (userId) {
      sessionQuery = sessionQuery.eq("user_id", userId);
    }

    const { data: sessions, error: sessionError } = await sessionQuery;

    if (sessionError) {
      console.error("[SessionService] Failed to get search results:", sessionError);
      throw sessionError;
    }

    const rows = (sessions || []) as CausalSessionStatsRow[];
    return rows.map((row) => ({
      id: row.session_id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      totalMessages: row.total_messages || 0,
      assistantMessages: row.assistant_messages || 0,
      l3Messages: row.l3_messages || 0,
      l2Messages: row.l2_messages || 0,
      l1Messages: row.l1_messages || 0,
      avgConfidence: row.avg_confidence ?? null,
      extractedAxioms: row.extracted_axioms || 0,
    }));
  }

  /**
   * Batch save multiple messages (for auto-save functionality).
   * 
   * @param sessionId - The session ID
   * @param messages - Array of messages to save
   */
  async batchSaveMessages(
    sessionId: string,
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      domain?: string;
      constraints?: string[];
      confidence?: number;
      graph?: JsonRecord;
      causalDensity?: CausalDensityResult;
    }>
  ): Promise<void> {
    const inserts = messages.map((msg) => ({
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      domain_classified: msg.domain,
      scm_tier1_used: msg.constraints,
      confidence_score: msg.confidence,
      causal_graph: msg.graph,
      causal_density: msg.causalDensity,
    }));

    const { error } = await this.supabase
      .from("causal_chat_messages")
      .insert(inserts);

    if (error) {
      console.error("[SessionService] Batch save failed:", error);
      throw error;
    }
  }

  async loadRecentMessagesForCompaction(sessionId: string, windowSize = 12): Promise<Array<{
    id: string;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    domain_classified?: string | null;
    confidence_score?: number | null;
    created_at: string;
  }>> {
    const { data, error } = await this.supabase
      .from("causal_chat_messages")
      .select("id, session_id, role, content, domain_classified, confidence_score, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(windowSize);

    if (error) {
      console.error("[SessionService] Failed to load compaction window:", error);
      return [];
    }

    return (data || []).reverse() as Array<{
      id: string;
      session_id: string;
      role: "user" | "assistant";
      content: string;
      domain_classified?: string | null;
      confidence_score?: number | null;
      created_at: string;
    }>;
  }

  async persistPruningDecisions(sessionId: string, decisions: PruningDecision[]): Promise<void> {
    if (decisions.length === 0) return;

    const { error } = await this.supabase.from("causal_pruning_decisions").insert(
      decisions.map((decision) => ({
        session_id: sessionId,
        message_id: decision.messageId,
        eligible: decision.eligible,
        reason: decision.reason,
        cache_ttl_state: decision.cacheTtlState,
        keep_priority_score: decision.keepPriorityScore,
        causal_level: decision.causalLevel,
        created_at: new Date().toISOString(),
      })),
    );

    if (error) {
      console.error("[SessionService] Failed to persist pruning decisions:", error);
    }
  }
}

/**
 * Singleton instance for convenience.
 */
export const sessionService = new SessionService();
