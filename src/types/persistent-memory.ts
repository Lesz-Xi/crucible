export type CausalRung = "L1" | "L2" | "L3";

export interface CausalMemoryEntry {
  id: string;
  sessionId: string;
  traceId?: string | null;
  sourceMessageIds: string[];
  domain: string;
  causalLevel: CausalRung;
  axiom: string;
  confidence: number;
  createdAt: string;
}

export interface CompactionReceipt {
  compactionId: string;
  sessionId: string;
  windowStartMessageId: string | null;
  windowEndMessageId: string | null;
  entriesExtracted: number;
  summaryFallbackUsed: boolean;
  durationMs: number;
  createdAt: string;
}

export type CacheTtlState = "cache_ttl_fresh" | "cache_ttl_expired" | "unknown";

export interface PruningDecision {
  messageId: string;
  eligible: boolean;
  reason: string;
  cacheTtlState: CacheTtlState;
  keepPriorityScore: number;
  causalLevel: CausalRung;
}

export interface RetrievalFusionScoredItem {
  id: string;
  content: string;
  causalLevel: CausalRung;
  vectorScore: number;
  lexicalScore: number;
  causalPriority: number;
  finalScore: number;
}

export interface RetrievalFusionResult {
  query: string;
  topK: RetrievalFusionScoredItem[];
}

export interface CrossSessionAxiomEvent {
  originSessionId: string;
  targetSessionId: string;
  axiomIds: string[];
  policy: string;
  timestamp: string;
}

export interface LatticeBroadcastGateResult {
  accepted: boolean;
  reason: string;
  event: CrossSessionAxiomEvent;
}
