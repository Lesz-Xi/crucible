import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AxiomCompressionService } from "@/lib/services/axiom-compression-service";
import type { CausalMemoryEntry, CompactionReceipt } from "@/types/persistent-memory";

export interface CompactionInputMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  domain_classified?: string | null;
  confidence_score?: number | null;
  created_at: string;
}

export interface CompactionOrchestrationResult {
  receipt: CompactionReceipt;
  entries: CausalMemoryEntry[];
}

export class CompactionOrchestrator {
  private readonly axiomService: AxiomCompressionService;

  constructor() {
    this.axiomService = new AxiomCompressionService();
  }

  async compactSessionWindow(
    supabase: SupabaseClient,
    sessionId: string,
    messages: CompactionInputMessage[],
  ): Promise<CompactionOrchestrationResult> {
    const startedAt = Date.now();
    const compactionId = randomUUID();

    const messageIds = messages.map((msg) => msg.id);
    const domain = messages.map((msg) => msg.domain_classified).find(Boolean) ?? "abstract";

    let entries: CausalMemoryEntry[] = [];
    let summaryFallbackUsed = false;

    try {
      const axioms = await this.axiomService.compressSession(sessionId);
      entries = axioms.map((axiom) => ({
        id: randomUUID(),
        sessionId,
        traceId: compactionId,
        sourceMessageIds: axiom.derivedFrom,
        domain,
        causalLevel: axiom.causalLevel === 3 ? "L3" : axiom.causalLevel === 2 ? "L2" : "L1",
        axiom: axiom.axiom,
        confidence: axiom.confidence,
        createdAt: new Date().toISOString(),
      }));

      if (entries.length === 0) {
        summaryFallbackUsed = true;
      }
    } catch (error) {
      summaryFallbackUsed = true;
      console.warn("[CompactionOrchestrator] Axiom-first compaction failed, using summary fallback.", error);
    }

    const receipt: CompactionReceipt = {
      compactionId,
      sessionId,
      windowStartMessageId: messageIds[0] ?? null,
      windowEndMessageId: messageIds[messageIds.length - 1] ?? null,
      entriesExtracted: entries.length,
      summaryFallbackUsed,
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };

    await supabase.from("causal_compaction_receipts").insert({
      compaction_id: receipt.compactionId,
      session_id: receipt.sessionId,
      window_start_message_id: receipt.windowStartMessageId,
      window_end_message_id: receipt.windowEndMessageId,
      entries_extracted: receipt.entriesExtracted,
      summary_fallback_used: receipt.summaryFallbackUsed,
      duration_ms: receipt.durationMs,
      created_at: receipt.createdAt,
    });

    if (entries.length > 0) {
      await supabase.from("causal_memory_entries").insert(
        entries.map((entry) => ({
          id: entry.id,
          session_id: entry.sessionId,
          trace_id: entry.traceId,
          source_message_ids: entry.sourceMessageIds,
          domain: entry.domain,
          causal_level: entry.causalLevel,
          axiom: entry.axiom,
          confidence: entry.confidence,
          created_at: entry.createdAt,
        })),
      );
    }

    return { receipt, entries };
  }
}
