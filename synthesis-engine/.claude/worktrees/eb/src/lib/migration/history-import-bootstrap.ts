import { getCurrentUser } from '@/lib/auth/actions';
import { collectLocalHistoryExport } from '@/lib/migration/local-history-export';
import type {
  HistoryImportSummary,
  HistorySyncStatus,
  LegacyAdoptionSummary,
} from '@/types/history-import';

const IMPORT_SENTINEL_PREFIX = 'history-import-complete';
const ADOPTION_SENTINEL_PREFIX = 'legacy-adoption-complete';
const LAST_SUMMARY_KEY = 'history-import-last-summary';
const LEGACY_CLIENT_TOKEN_KEY = 'crucible_legacy_client_token';

const RETRY_DELAY_MS = 5000;

function nowIso(): string {
  return new Date().toISOString();
}

function dispatchSyncStatus(status: HistorySyncStatus): void {
  window.localStorage.setItem(LAST_SUMMARY_KEY, JSON.stringify(status));
  window.dispatchEvent(new CustomEvent('historySyncStatus', { detail: status }));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getOrCreateLegacyClientToken(): string {
  const existing = window.localStorage.getItem(LEGACY_CLIENT_TOKEN_KEY);
  if (existing) {
    return existing;
  }

  const token = crypto.randomUUID();
  window.localStorage.setItem(LEGACY_CLIENT_TOKEN_KEY, token);
  return token;
}

async function runLegacyAdoption(userId: string): Promise<LegacyAdoptionSummary> {
  const token = getOrCreateLegacyClientToken();
  if (!token) {
    return { success: false, adoptedSessions: 0, adoptedMessages: 0, errors: ['Missing legacy client token'] };
  }

  const sentinelKey = `${ADOPTION_SENTINEL_PREFIX}:${userId}`;
  if (window.localStorage.getItem(sentinelKey) === 'true') {
    return { success: true, adoptedSessions: 0, adoptedMessages: 0 };
  }

  const response = await fetch('/api/causal-chat/adopt-legacy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legacyClientToken: token }),
  });

  const body = (await response.json()) as LegacyAdoptionSummary & { error?: string };
  if (!response.ok || !body.success) {
    return {
      success: false,
      adoptedSessions: 0,
      adoptedMessages: 0,
      errors: [body.error || 'Legacy adoption failed'],
    };
  }

  window.localStorage.setItem(sentinelKey, 'true');
  return {
    success: true,
    adoptedSessions: Number(body.adoptedSessions || 0),
    adoptedMessages: Number(body.adoptedMessages || 0),
  };
}

async function runHistoryImport(
  userId: string,
  options?: { force?: boolean; ignoreSentinel?: boolean }
): Promise<{ imported: boolean; summary?: HistoryImportSummary }> {
  const sentinelKey = `${IMPORT_SENTINEL_PREFIX}:${userId}`;
  if (!options?.ignoreSentinel && !options?.force && window.localStorage.getItem(sentinelKey) === 'true') {
    return { imported: false };
  }

  const payload = collectLocalHistoryExport();
  const requestPayload = options?.force ? { ...payload, force: true } : payload;
  const response = await fetch('/api/history/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  const body = (await response.json()) as {
    success?: boolean;
    imported?: boolean;
    reason?: string;
    summary?: HistoryImportSummary;
    error?: string;
  };

  if (response.ok && body.success && (body.imported || body.reason === 'already_imported')) {
    window.localStorage.setItem(sentinelKey, 'true');
    return {
      imported: Boolean(body.imported),
      summary: body.summary,
    };
  }

  throw new Error(body.error || 'History import failed');
}

async function runHistoryImportWithRetry(userId: string): Promise<{ imported: boolean; summary?: HistoryImportSummary }> {
  try {
    return await runHistoryImport(userId);
  } catch {
    await wait(RETRY_DELAY_MS);
    return runHistoryImport(userId);
  }
}

async function getCloudHistoryCount(): Promise<number> {
  const response = await fetch('/api/causal-chat/history');
  if (!response.ok) {
    return 0;
  }
  const body = (await response.json()) as { history?: unknown[] };
  return Array.isArray(body.history) ? body.history.length : 0;
}

export async function bootstrapHistoryRecovery(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return;
  }

  const timestamp = nowIso();
  dispatchSyncStatus({
    status: 'pending',
    message: 'History sync in progress...',
    timestamp,
  });

  try {
    const adoption = await runLegacyAdoption(currentUser.id);
    let importResult = await runHistoryImportWithRetry(currentUser.id);

    const localExport = collectLocalHistoryExport();
    const localChatCount = Array.isArray(localExport.domains.chat) ? localExport.domains.chat.length : 0;
    const cloudHistoryCount = await getCloudHistoryCount();
    const shouldForceImport =
      !importResult.imported && localChatCount > 0 && cloudHistoryCount === 0;

    if (shouldForceImport) {
      importResult = await runHistoryImport(currentUser.id, {
        force: true,
        ignoreSentinel: true,
      });
    }

    if (adoption.adoptedSessions > 0 || adoption.adoptedMessages > 0) {
      dispatchSyncStatus({
        status: 'adopted',
        message: `Adopted ${adoption.adoptedSessions} legacy sessions (${adoption.adoptedMessages} messages).`,
        adoptedSessions: adoption.adoptedSessions,
        adoptedMessages: adoption.adoptedMessages,
        timestamp: nowIso(),
      });
      window.dispatchEvent(new Event('historyImported'));
      return;
    }

    const messagePrefix =
      !adoption.success && adoption.errors?.length
        ? `Legacy adoption skipped: ${adoption.errors[0]}. `
        : '';

    const cloudHistoryCountAfter = await getCloudHistoryCount();
    dispatchSyncStatus({
      status: 'imported',
      message: `${messagePrefix}${
        cloudHistoryCountAfter > 0
          ? `History available (${cloudHistoryCountAfter} session${cloudHistoryCountAfter === 1 ? '' : 's'}).`
          : importResult.imported
            ? 'Local history imported to cloud.'
            : 'No cloud history found for this account on this browser.'
      }`,
      summary: importResult.summary,
      timestamp: nowIso(),
    });

    if (importResult.imported) {
      window.dispatchEvent(new Event('historyImported'));
      return;
    }

    // Even when already imported, refresh history list after login.
    window.dispatchEvent(new Event('historyImported'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'History sync failed';
    dispatchSyncStatus({
      status: 'failed',
      message,
      timestamp: nowIso(),
    });
  }
}

export function readLastHistorySyncStatus(): HistorySyncStatus | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(LAST_SUMMARY_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as HistorySyncStatus;
  } catch {
    return null;
  }
}
