import type {
  ChatSessionImportPayload,
  HybridRunImportPayload,
  LegalImportPayload,
  LocalHistoryExport,
} from '@/types/history-import';

const STORAGE_KEYS = {
  chat: ['causal-chat-local-fallback-v1', 'causal_chat_sessions_local', 'causalChatSessions', 'chatHistory'],
  hybrid: ['hybrid_synthesis_history_local', 'hybridHistory', 'synthesisHistory'],
  legal: ['legal_analysis_history_local', 'legalHistory'],
  education: ['education_history_local', 'educationHistory'],
  openclaw: ['openclaw_history_local', 'openclawHistory'],
  scm: ['scm_history_local', 'scmHistory'],
} as const;

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && value !== null) return [value];
    return [];
  } catch {
    return [];
  }
}

function findFirstArray(keys: readonly string[]): unknown[] {
  for (const key of keys) {
    const parsed = parseJsonArray(window.localStorage.getItem(key));
    if (parsed.length > 0) {
      return parsed;
    }
  }
  return [];
}

function normalizeChat(): LocalHistoryExport['domains']['chat'] {
  const rows = findFirstArray(STORAGE_KEYS.chat);
  const isFallbackStore =
    rows.length === 1 &&
    typeof rows[0] === 'object' &&
    rows[0] !== null &&
    Array.isArray((rows[0] as Record<string, unknown>).sessions);

  if (isFallbackStore) {
    const sessions = ((rows[0] as Record<string, unknown>).sessions as unknown[]) || [];
    return sessions.map((session, index) => {
      const record = session as Record<string, unknown>;
      const id = String(record.id ?? `chat-${index}`);
      const title = String(record.title ?? 'Imported Chat Session');
      const messagesRaw = Array.isArray(record.messages) ? record.messages : [];
      const payload: ChatSessionImportPayload = {
        title,
        updatedAt: typeof record.updated_at === 'string' ? record.updated_at : undefined,
        messages: messagesRaw
          .map((message) => {
            const msg = message as Record<string, unknown>;
            const role = toChatRole(msg.role);
            if (!role) return null;
            return {
              role,
              content: String(msg.content ?? ''),
              createdAt: typeof msg.created_at === 'string' ? msg.created_at : undefined,
            };
          })
          .filter((message): message is NonNullable<typeof message> => Boolean(message)),
      };
      return {
        externalImportId: `local-chat-${id}`,
        createdAt: typeof record.created_at === 'string' ? record.created_at : undefined,
        payload,
      };
    });
  }

  return rows
    .map((row, index) => {
      const record = row as Record<string, unknown>;
      const id = String(record.id ?? `chat-${index}`);
      const title = String(record.title ?? 'Imported Chat Session');
      const messagesRaw = Array.isArray(record.messages) ? record.messages : [];

      const payload: ChatSessionImportPayload = {
        title,
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
        messages: messagesRaw
          .map((message) => {
            const msg = message as Record<string, unknown>;
            const role = toChatRole(msg.role);
            if (!role) return null;
            return {
              role,
              content: String(msg.content ?? ''),
              createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : undefined,
            };
          })
          .filter((message): message is NonNullable<typeof message> => Boolean(message)),
      };

      return {
        externalImportId: `local-chat-${id}`,
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
        payload,
      };
    })
    .filter((row) => row.payload.messages.length > 0 || row.payload.title.length > 0);
}

function toChatRole(value: unknown): 'user' | 'assistant' | 'system' | null {
  if (value === 'user' || value === 'assistant' || value === 'system') {
    return value;
  }
  return null;
}

function normalizeHybrid(): LocalHistoryExport['domains']['hybrid'] {
  const rows = findFirstArray(STORAGE_KEYS.hybrid);
  return rows
    .map((row, index) => {
      const record = row as Record<string, unknown>;
      const id = String(record.id ?? `hybrid-${index}`);
      const payload: HybridRunImportPayload = {
        sources: Array.isArray(record.sources)
          ? (record.sources as Array<Record<string, unknown>>)
          : [],
        totalIdeas: Number(record.totalIdeas ?? record.total_ideas ?? 0),
        status: String(record.status ?? 'completed'),
        structuredApproach:
          record.structuredApproach && typeof record.structuredApproach === 'object'
            ? (record.structuredApproach as Record<string, unknown>)
            : null,
        contradictions: Array.isArray(record.contradictions)
          ? (record.contradictions as Array<Record<string, unknown>>)
          : [],
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
      };
      return {
        externalImportId: `local-hybrid-${id}`,
        createdAt: payload.createdAt,
        payload,
      };
    })
    .filter((row) => row.payload.sources.length > 0 || row.payload.totalIdeas > 0);
}

function normalizeLegal(): LocalHistoryExport['domains']['legal'] {
  const rows = findFirstArray(STORAGE_KEYS.legal);
  return rows
    .map((row, index) => {
      const record = row as Record<string, unknown>;
      const id = String(record.id ?? record.caseId ?? `legal-${index}`);
      const caseTitle = String(record.caseTitle ?? record.title ?? 'Imported Legal Analysis');
      const payload: LegalImportPayload = {
        caseId: String(record.caseId ?? id),
        caseTitle,
        jurisdiction: typeof record.jurisdiction === 'string' ? record.jurisdiction : null,
        caseType: typeof record.caseType === 'string' ? record.caseType : null,
        analysisResult:
          typeof record.analysisResult === 'object' && record.analysisResult
            ? (record.analysisResult as Record<string, unknown>)
            : (record as Record<string, unknown>),
        documentNames: Array.isArray(record.documentNames)
          ? (record.documentNames as string[])
          : [],
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
      };

      return {
        externalImportId: `local-legal-${id}`,
        createdAt: payload.createdAt,
        payload,
      };
    })
    .filter((row) => row.payload.caseTitle.length > 0);
}

function normalizeGeneric(keys: readonly string[], prefix: string): LocalHistoryExport['domains']['education'] {
  const rows = findFirstArray(keys);
  return rows.map((row, index) => ({
    externalImportId: `local-${prefix}-${index}`,
    payload: typeof row === 'object' && row ? (row as Record<string, unknown>) : { value: row },
  }));
}

export function collectLocalHistoryExport(): LocalHistoryExport {
  if (typeof window === 'undefined') {
    return {
      sourceVersion: 'local-v1',
      exportedAt: new Date().toISOString(),
      domains: {
        chat: [],
        hybrid: [],
        legal: [],
        education: [],
        openclaw: [],
        scm: [],
      },
    };
  }

  return {
    sourceVersion: 'local-v1',
    exportedAt: new Date().toISOString(),
    domains: {
      chat: normalizeChat(),
      hybrid: normalizeHybrid(),
      legal: normalizeLegal(),
      education: normalizeGeneric(STORAGE_KEYS.education, 'education'),
      openclaw: normalizeGeneric(STORAGE_KEYS.openclaw, 'openclaw'),
      scm: normalizeGeneric(STORAGE_KEYS.scm, 'scm'),
    },
  };
}
