export interface FactTriggerResult {
  shouldSearch: boolean;
  confidence: number;
  reason: string;
  normalizedEntities: string[];
}

export interface GroundingSource {
  title: string;
  link: string;
  snippet: string;
  domain: string;
  rank: number;
  publishedAt?: string;
}

export type FactualConfidenceLevel = "high" | "medium" | "low" | "insufficient";

export interface FactualConfidenceResult {
  level: FactualConfidenceLevel;
  score: number;
  rationale: string;
}

export interface ChatGroundingState {
  trigger: FactTriggerResult;
  sources: GroundingSource[];
  confidence: FactualConfidenceResult;
  enabled: boolean;
}
