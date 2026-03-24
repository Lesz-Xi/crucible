export type ImportDomain = 'chat' | 'hybrid' | 'legal' | 'education' | 'openclaw' | 'scm';

export interface ImportRecordEnvelope<T> {
  externalImportId: string;
  createdAt?: string;
  payload: T;
}

export interface ChatSessionImportPayload {
  title: string;
  updatedAt?: string;
  legacyClientToken?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: string;
  }>;
}

export interface HybridRunImportPayload {
  sources: Array<Record<string, unknown>>;
  totalIdeas: number;
  status: string;
  structuredApproach?: Record<string, unknown> | null;
  contradictions?: Array<Record<string, unknown>>;
  createdAt?: string;
}

export interface LegalImportPayload {
  caseId: string;
  caseTitle: string;
  jurisdiction?: string | null;
  caseType?: string | null;
  analysisResult: Record<string, unknown>;
  documentNames?: string[];
  createdAt?: string;
}

export interface LocalHistoryExport {
  sourceVersion: string;
  exportedAt: string;
  domains: {
    chat: ImportRecordEnvelope<ChatSessionImportPayload>[];
    hybrid: ImportRecordEnvelope<HybridRunImportPayload>[];
    legal: ImportRecordEnvelope<LegalImportPayload>[];
    education: ImportRecordEnvelope<Record<string, unknown>>[];
    openclaw: ImportRecordEnvelope<Record<string, unknown>>[];
    scm: ImportRecordEnvelope<Record<string, unknown>>[];
  };
}

export interface ImportDomainSummary {
  domain: ImportDomain;
  attempted: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface HistoryImportSummary {
  userId: string;
  sourceVersion: string;
  startedAt: string;
  completedAt: string;
  domains: ImportDomainSummary[];
}

export interface LegacyAdoptionSummary {
  success: boolean;
  adoptedSessions: number;
  adoptedMessages: number;
  errors?: string[];
}

export type HistorySyncStatus =
  | {
      status: 'pending';
      message: string;
      timestamp: string;
    }
  | {
      status: 'imported';
      message: string;
      timestamp: string;
      summary?: HistoryImportSummary;
    }
  | {
      status: 'adopted';
      message: string;
      timestamp: string;
      adoptedSessions: number;
      adoptedMessages: number;
    }
  | {
      status: 'failed';
      message: string;
      timestamp: string;
    };
