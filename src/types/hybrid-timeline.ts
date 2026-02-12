export type HybridTimelineStageKey =
  | 'ingestion'
  | 'pdf_parsing'
  | 'entity_harvest'
  | 'contradiction_scan'
  | 'hypothesis_generation'
  | 'novelty_proof'
  | 'novelty_gate'
  | 'recovery_plan'
  | 'completed';

export type HybridTimelineStageState = 'pending' | 'active' | 'done' | 'blocked' | 'skipped';

export interface HybridTimelineStageTelemetry {
  processedFiles?: number;
  totalFiles?: number;
  companyCount?: number;
  resolvedEntities?: number;
  rows?: number;
  highConfidenceRows?: number;
  proofCount?: number;
  avgPriorArtDistance?: number;
  decision?: 'pass' | 'recover' | 'fail';
  passCount?: number;
  blockedCount?: number;
  reason?: string;
  signal?: string;
  durationMs?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface HybridTimelineStageRecord {
  stage: HybridTimelineStageKey;
  title: string;
  rationale: string;
  optional: boolean;
  state: HybridTimelineStageState;
  startedAt?: string;
  completedAt?: string;
  telemetry?: HybridTimelineStageTelemetry;
}

export interface HybridTimelineReceipt {
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  stages: HybridTimelineStageRecord[];
  latestSignal?: string;
}
