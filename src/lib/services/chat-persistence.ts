import { createClient } from '@/lib/supabase/client';
import type { CausalDensityResult } from '@/lib/ai/causal-integrity-service';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  // Causal provenance fields
  domain?: string;
  tier1Used?: string[];
  tier2Used?: string[];
  confidenceScore?: number;
  causalGraph?: any;
  causalDensity?: CausalDensityResult;
}

/**
 * ChatPersistence Service
 * 
 * Handles persistence of causal chat sessions and messages to Supabase.
 * Integrates with the causal_chat_sessions and causal_chat_messages tables.
 */
export class ChatPersistence {
  private supabase = createClient();
  private causalDensityColumnAvailable: boolean | null = null;

  private async verifyCausalDensityColumn(): Promise<boolean> {
    if (this.causalDensityColumnAvailable !== null) {
      return this.causalDensityColumnAvailable;
    }

    const { error } = await this.supabase
      .from('causal_chat_messages')
      .select('causal_density')
      .limit(1);

    if (error) {
      const isMissingColumn = /causal_density|column/i.test(error.message || '');
      if (isMissingColumn) {
        console.warn(
          '[ChatPersistence] causal_density column not found. Apply migration 20260129_add_axiom_compression_trigger.sql. Falling back without density persistence.'
        );
        this.causalDensityColumnAvailable = false;
        return false;
      }

      console.warn('[ChatPersistence] Could not verify causal_density column, falling back without density persistence:', error);
      this.causalDensityColumnAvailable = false;
      return false;
    }

    this.causalDensityColumnAvailable = true;
    return true;
  }

  /**
   * Get or create a chat session
   * @param userId - The authenticated user's ID
   * @param firstMessage - The first message to generate title from
   * @returns Session ID
   */
  async getOrCreateSession(userId: string | undefined, firstMessage: string): Promise<string> {
    console.log('[ChatPersistence] Creating session for user:', userId || 'ANONYMOUS', 'with message:', firstMessage.substring(0, 50));
    
    // Generate title from first message (first 50 chars)
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...' 
      : firstMessage;

    const { data, error } = await this.supabase
      .from('causal_chat_sessions')
      .insert({
        user_id: userId || null, // Handle unauthenticated users
        title,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ChatPersistence] ❌ Failed to create session:', error);
      throw error;
    }

    console.log('[ChatPersistence] ✅ Session created:', data.id);
    return data.id;
  }

  /**
   * Save a message to the database
   * @param sessionId - The session ID
   * @param message - The message to save
   */
  async saveMessage(sessionId: string, message: Message): Promise<void> {
    console.log('[ChatPersistence] Saving', message.role, 'message to session:', sessionId);
    console.log('[ChatPersistence] Message content preview:', message.content.substring(0, 100));
    
    const canPersistDensity = await this.verifyCausalDensityColumn();
    const payload: Record<string, unknown> = {
      session_id: sessionId,
      role: message.role,
      content: message.content,
      domain_classified: message.domain,
      scm_tier1_used: message.tier1Used,
      scm_tier2_used: message.tier2Used,
      confidence_score: message.confidenceScore,
      causal_graph: message.causalGraph,
    };
    if (canPersistDensity && message.causalDensity) {
      payload.causal_density = message.causalDensity;
    }

    let { data, error } = await this.supabase
      .from('causal_chat_messages')
      .insert(payload)
      .select();

    if (error && /causal_density|column/i.test(error.message || '') && payload.causal_density) {
      console.warn(
        '[ChatPersistence] causal_density write failed (column unavailable). Retrying without density payload. Run migration 20260129_add_axiom_compression_trigger.sql.'
      );
      this.causalDensityColumnAvailable = false;
      delete payload.causal_density;
      const retry = await this.supabase
        .from('causal_chat_messages')
        .insert(payload)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[ChatPersistence] ❌ Failed to save message:', error);
      console.error('[ChatPersistence] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[ChatPersistence] ✅ Message saved successfully:', data);
    
    // Update session timestamp
    await this.touchSession(sessionId);
  }

  /**   
   * Update the session's updated_at timestamp
   * @param sessionId - The session ID
   */
  async touchSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('causal_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update session timestamp:', error);
    }
  }

  /**
   * Load all messages for a specific session
   * @param sessionId - The session ID to load messages for
   * @returns Array of messages in chronological order
   */
  async loadSession(sessionId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('causal_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load session messages:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform database records to Message format
    return data.map((row) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
      timestamp: new Date(row.created_at),
      domain: row.domain_classified || undefined,
      tier1Used: row.scm_tier1_used || undefined,
      tier2Used: row.scm_tier2_used || undefined,
      confidenceScore: row.confidence_score || undefined,
      causalDensity: row.causal_density || undefined,
      causalGraph: row.causal_graph || undefined,
    }));
  }

  /**
   * Delete a chat session and all its messages
   * @param sessionId - The session ID to delete
   * @returns Success status
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/causal-chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[ChatPersistence] Delete failed:', data.error);
        return { success: false, error: data.error || 'Failed to delete session' };
      }

      console.log('[ChatPersistence] ✅ Session deleted:', sessionId);
      return { success: true };
    } catch (error: any) {
      console.error('[ChatPersistence] Delete error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  }
}
