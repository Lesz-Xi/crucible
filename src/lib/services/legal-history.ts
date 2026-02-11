/**
 * Legal Analysis History Service
 * 
 * Provides persistence for legal causation analyses.
 * Allows saving, loading, and listing previous analyses.
 * 
 * Phase 28.Legal: History persistence following Demis-Workflow
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LegalCase } from '@/types/legal';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

/**
 * History entry for list display (summary only)
 */
export interface LegalHistoryEntry {
  id: string;
  caseTitle: string;
  caseType: string | null;
  jurisdiction: string | null;
  chainsCount: number;
  causationEstablished: boolean;
  confidence: number;
  documentCount: number;
  documentNames: string[];
  createdAt: Date;
}

/**
 * Full history record (includes analysis result)
 */
export interface LegalHistoryRecord extends LegalHistoryEntry {
  analysisResult: LegalCase;
}

/**
 * Save a completed analysis to history
 */
export async function saveAnalysisToHistory(
  legalCase: LegalCase,
  documentNames: string[]
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[LegalHistory] Supabase not configured, skipping save');
      return null;
    }

    const { data, error } = await supabase
      .from('legal_analysis_history')
      .insert({
        case_id: legalCase.id,
        case_title: legalCase.title,
        jurisdiction: legalCase.jurisdiction,
        case_type: legalCase.caseType,
        document_names: documentNames,
        document_count: documentNames.length,
        chains_count: legalCase.causalChains.length,
        causation_established: legalCase.verdict!.liable,
        but_for_satisfied: legalCase.verdict!.butForSatisfied,
        proximate_cause_satisfied: legalCase.verdict!.proximateCauseSatisfied,
        confidence: legalCase.verdict!.confidence,
        analysis_result: legalCase,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[LegalHistory] Failed to save:', error.message);
      return null;
    }

    console.log('[LegalHistory] Saved analysis:', data.id);
    return data.id;
  } catch (err) {
    console.error('[LegalHistory] Save error:', err);
    return null;
  }
}

/**
 * Get list of recent analyses (summaries only)
 */
export async function getAnalysisHistory(
  limit: number = 20
): Promise<LegalHistoryEntry[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[LegalHistory] Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('legal_analysis_history')
      .select(`
        id,
        case_title,
        case_type,
        jurisdiction,
        chains_count,
        causation_established,
        confidence,
        document_count,
        document_names,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[LegalHistory] Failed to fetch:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      caseTitle: row.case_title,
      caseType: row.case_type,
      jurisdiction: row.jurisdiction,
      chainsCount: row.chains_count,
      causationEstablished: row.causation_established,
      confidence: row.confidence,
      documentCount: row.document_count,
      documentNames: row.document_names || [],
      createdAt: new Date(row.created_at),
    }));
  } catch (err) {
    console.error('[LegalHistory] Fetch error:', err);
    return [];
  }
}

/**
 * Load a full analysis from history by ID
 */
export async function loadAnalysisFromHistory(
  id: string
): Promise<LegalCase | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[LegalHistory] Supabase not configured');
      return null;
    }

    const { data, error } = await supabase
      .from('legal_analysis_history')
      .select('analysis_result')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[LegalHistory] Failed to load:', error.message);
      return null;
    }

    if (!data || !data.analysis_result) {
      return null;
    }

    // The analysis_result is stored as JSONB, parse it back to LegalCase
    // JSONB stores dates as strings, so we need to re-hydrate them
    const result = data.analysis_result as any; // Use any to avoid type issues during deserialization
    
    // Re-hydrate Date objects (JSONB stores as strings)
    result.createdAt = new Date(result.createdAt);
    result.timeline = result.timeline.map((action: any) => ({
      ...action,
      timestamp: new Date(action.timestamp),
    }));
    result.harms = result.harms.map((harm: any) => ({
      ...harm,
      timestamp: harm.timestamp ? new Date(harm.timestamp) : new Date(),
    }));

    console.log('[LegalHistory] Loaded analysis:', id);
    return result;
  } catch (err) {
    console.error('[LegalHistory] Load error:', err);
    return null;
  }
}

/**
 * Delete an analysis from history
 */
export async function deleteAnalysisFromHistory(
  id: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[LegalHistory] Supabase not configured');
      return false;
    }

    const { error } = await supabase
      .from('legal_analysis_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[LegalHistory] Failed to delete:', error.message);
      return false;
    }

    console.log('[LegalHistory] Deleted analysis:', id);
    return true;
  } catch (err) {
    console.error('[LegalHistory] Delete error:', err);
    return false;
  }
}

/**
 * Clear all history (use with caution)
 */
export async function clearAllHistory(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from('legal_analysis_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('[LegalHistory] Failed to clear:', error.message);
      return false;
    }

    console.log('[LegalHistory] Cleared all history');
    return true;
  } catch (err) {
    console.error('[LegalHistory] Clear error:', err);
    return false;
  }
}
