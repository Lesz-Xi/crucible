'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Clock3, FlaskConical, LayoutGrid, Loader2, MessageSquare, Microscope, Network, Plus, Scale, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';
import { ChatPersistence } from '@/lib/services/chat-persistence';
import { cn } from '@/lib/utils';

export interface ChatSidebarSession {
  id: string;
  title: string;
  updated_at: string;
  domain_classified?: string;
}

export interface ChatSidebarV2Props {
  onNewThread: () => void;
  onLoadSession: (sessionId: string) => void;
}

export function ChatSidebarV2({ onNewThread, onLoadSession }: ChatSidebarV2Props) {
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

  const domainGroups = useMemo(() => {
    const groups: Record<string, ChatSidebarSession[]> = {};
    sessions.forEach(session => {
        // Fallback or explicit extraction of domain would be here.
        // For now, simulating domain grouping if supported by backend or future expansion.
        // Since session object doesn't have domain yet in interface, we'll use a heuristic or mock.
        // The implementation plan says "Use domain_classified from session history".
        // Let's check the interface. It's missing domain_classified.
        // We'll update the interface first.
        const domain = (session as any).domain_classified || 'Unclassified';
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push(session);
    });
    return groups;
  }, [sessions]);

  const getDomainIcon = (domain: string) => {
      const lower = domain.toLowerCase();
      if (lower.includes('economic') || lower.includes('market')) return <Network className="h-3.5 w-3.5" />;
      if (lower.includes('legal') || lower.includes('policy')) return <Scale className="h-3.5 w-3.5" />;
      if (lower.includes('bio') || lower.includes('health')) return <Microscope className="h-3.5 w-3.5" />;
      if (lower.includes('physic')) return <FlaskConical className="h-3.5 w-3.5" />;
      return <BookOpen className="h-3.5 w-3.5" />;
  };

  return (
    <div className="flex h-full flex-col glass-sidebar">
      <div className="border-b border-[var(--lab-border)] p-4">
        <div className="mb-4 flex items-center gap-3">
          <p className="font-mono text-2xl font-semibold tracking-tight text-[var(--lab-text-primary)]">Wu-Weism</p>
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

      <div className="lab-scroll-region flex-1 p-3">
        <p className="lab-section-title mb-4 px-2">Research Streams</p>

        {loading ? (
          <div className="lab-empty-state text-xs px-2">Syncing lab notebook...</div>
        ) : sessions.length === 0 ? (
          <div className="lab-empty-state text-xs px-2">No active research content.</div>
        ) : (

          <div className="space-y-6">
            {Object.entries(domainGroups).map(([domain, groupSessions]) => (
              <div key={domain}>
                <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--lab-text-tertiary)] opacity-80">
                  {getDomainIcon(domain)}
                  {domain}
                </div>
                <div className="space-y-1">
                  {groupSessions.map((session) => (
                    <div key={session.id} className="group relative rounded-md hover:bg-[var(--lab-bg-secondary)] transition-colors">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2"
                        onClick={() => onLoadSession(session.id)}
                      >
                        <p className="truncate text-xs font-medium text-[var(--lab-text-secondary)] group-hover:text-[var(--lab-text-primary)] transition-colors">
                            {session.title || 'Untitled Experiment'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--lab-text-tertiary)] font-mono opacity-70">
                          {new Date(session.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </button>

                      <button
                        type="button"
                        className={cn(
                          'absolute right-1 top-2 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-[var(--lab-bg-tertiary)] text-[var(--lab-text-tertiary)] hover:text-red-500',
                          deletingId === session.id && 'opacity-100 text-red-500'
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            void deleteSession(session.id);
                        }}
                        disabled={deletingId === session.id}
                        title="Archive Thread"
                      >
                        {deletingId === session.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--lab-border)] p-4">
        <AuthButton compact />
      </div>
    </div>
  );
}
