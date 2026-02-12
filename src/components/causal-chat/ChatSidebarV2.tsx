'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Clock3, Loader2, MessageSquare, Plus, Scale, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';
import { ChatPersistence } from '@/lib/services/chat-persistence';
import { cn } from '@/lib/utils';
import type { HistorySyncStatus } from '@/types/history-import';

export interface ChatSidebarSession {
  id: string;
  title: string;
  updated_at: string;
}

export interface ChatSidebarV2Props {
  onNewThread: () => void;
  onLoadSession: (sessionId: string) => void;
  syncStatus: HistorySyncStatus | null;
}

export function ChatSidebarV2({ onNewThread, onLoadSession, syncStatus }: ChatSidebarV2Props) {
  const pathname = usePathname();
  const chatPersistence = useMemo(() => new ChatPersistence(), []);
  const [sessions, setSessions] = useState<ChatSidebarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/causal-chat/history');
      if (!response.ok) {
        setSessions([]);
        return;
      }

      const payload = (await response.json()) as { history?: ChatSidebarSession[] };
      setSessions(Array.isArray(payload.history) ? payload.history : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    window.addEventListener('historyImported', loadHistory);
    return () => window.removeEventListener('historyImported', loadHistory);
  }, []);

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    const original = sessions;
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));

    const result = await chatPersistence.deleteSession(sessionId);
    if (!result.success) {
      setSessions(original);
    } else {
      window.dispatchEvent(new CustomEvent('sessionDeleted', { detail: { sessionId } }));
    }

    setDeletingId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--lab-border)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-[var(--lab-border)]">
              <Image src="/wu-wei-logo.png" alt="Wu-Wei logo" fill sizes="36px" className="object-cover" />
            </div>
            <div>
            <p className="font-mono text-2xl font-semibold tracking-tight text-[var(--lab-text-primary)]">Wu-Wei</p>
            <p className="text-xs text-[var(--lab-text-secondary)]">Automated Scientist Workbench</p>
            </div>
          </div>
          <AuthButton compact />
        </div>

        <button type="button" className="lab-button-primary w-full" onClick={onNewThread}>
          <Plus className="h-4 w-4" />
          New Thread
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/chat" className="lab-nav-pill" data-active={pathname?.startsWith('/chat') ? 'true' : 'false'}>
            <MessageSquare className="h-4 w-4" /> Chat
          </Link>
          <Link href="/hybrid" className="lab-nav-pill" data-active={pathname?.startsWith('/hybrid') ? 'true' : 'false'}>
            <Sparkles className="h-4 w-4" /> Hybrid
          </Link>
          <Link href="/legal" className="lab-nav-pill" data-active={pathname?.startsWith('/legal') ? 'true' : 'false'}>
            <Scale className="h-4 w-4" /> Legal
          </Link>
        </div>
      </div>

      <div className="lab-scroll-region flex-1 p-4">
        <p className="lab-section-title mb-3">Recent Threads</p>

        {loading ? (
          <div className="lab-empty-state text-sm">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="lab-empty-state text-sm">No recent history for this account.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="lab-card-interactive group !p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onLoadSession(session.id)}
                >
                  <p className="truncate text-sm font-medium text-[var(--lab-text-primary)]">{session.title || 'Untitled session'}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(session.updated_at).toLocaleString()}
                  </p>
                </button>

                <button
                  type="button"
                  className={cn('lab-button-secondary mt-2 w-full !py-1.5 text-xs', deletingId === session.id && 'opacity-60')}
                  onClick={() => void deleteSession(session.id)}
                  disabled={deletingId === session.id}
                >
                  {deletingId === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--lab-border)] p-4">
        <p className="lab-section-title">History Sync</p>
        <p className="mt-2 text-xs text-[var(--lab-text-secondary)]">{syncStatus?.message || 'Sync status unavailable.'}</p>
      </div>
    </div>
  );
}
