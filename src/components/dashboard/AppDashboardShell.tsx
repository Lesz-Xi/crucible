'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock3,
  FolderCheck,
  FolderMinus,
  Folder,
  FolderPlus,
  Gavel,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Plus,
  Scale,
  Settings,
  Sun,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AppDashboardShellProps {
  children: ReactNode;
  readingMode?: boolean;
}

interface ChatSidebarSession {
  id: string;
  title: string;
  updated_at: string;
}

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/hybrid', label: 'Hybrid', icon: Bot },
];

const RELICS_ITEMS = [
  { href: '/legal', label: 'Legal', icon: Gavel },
  { href: '/education', label: 'Educational', icon: GraduationCap },
];

export function AppDashboardShell({ children, readingMode = false }: AppDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [recentThreads, setRecentThreads] = useState<ChatSidebarSession[]>([]);
  const [sidebarMode, setSidebarMode] = useState<'threads' | 'research'>('threads');
  const [researchExpanded, setResearchExpanded] = useState(true);
  const [relicsOpen, setRelicsOpen] = useState(false);
  const [researchThreadIds, setResearchThreadIds] = useState<string[]>([]);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const isChatRoute = pathname?.startsWith('/chat');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem('wuweism-dashboard-sidebar');
    if (saved === 'collapsed') setCollapsed(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!isChatRoute) return;

    const loadHistory = async () => {
      try {
        const response = await fetch('/api/causal-chat/history');
        if (!response.ok) {
          setRecentThreads([]);
          return;
        }
        const payload = (await response.json()) as { history?: ChatSidebarSession[] };
        setRecentThreads(Array.isArray(payload.history) ? payload.history : []);
      } catch {
        setRecentThreads([]);
      }
    };

    void loadHistory();
    try {
      const savedResearch = window.localStorage.getItem('chat-research-thread-ids');
      if (savedResearch) {
        const parsed = JSON.parse(savedResearch) as string[];
        if (Array.isArray(parsed)) setResearchThreadIds(parsed);
      }
    } catch {
      setResearchThreadIds([]);
    }
    window.addEventListener('historyImported', loadHistory);
    return () => window.removeEventListener('historyImported', loadHistory);
  }, [isChatRoute]);

  useEffect(() => {
    if (!isChatRoute) return;
    window.localStorage.setItem('chat-research-thread-ids', JSON.stringify(researchThreadIds));
  }, [isChatRoute, researchThreadIds]);

  const initials = useMemo(() => {
    if (!userEmail) return 'WW';
    const local = userEmail.split('@')[0] || '';
    return local.slice(0, 2).toUpperCase() || 'WW';
  }, [userEmail]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('wuweism-dashboard-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAccountOpen(false);
    router.push('/');
    router.refresh();
  };

  const openThread = (sessionId: string) => {
    router.push(`/chat?sessionId=${sessionId}`);
    window.dispatchEvent(new CustomEvent('loadSession', { detail: { sessionId } }));
  };

  const removeFromResearch = (sessionId: string) => {
    setResearchThreadIds((current) => current.filter((id) => id !== sessionId));
  };

  const handleDeleteThread = async (sessionId: string) => {
    if (deletingThreadId === sessionId) return;
    setDeletingThreadId(sessionId);

    const previousThreads = recentThreads;
    const previousResearch = researchThreadIds;

    setRecentThreads((current) => current.filter((session) => session.id !== sessionId));
    setResearchThreadIds((current) => current.filter((id) => id !== sessionId));

    try {
      const response = await fetch(`/api/causal-chat/sessions/${sessionId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }
      if (pathname?.startsWith('/chat')) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('sessionId') === sessionId) {
          router.push('/chat?new=1');
          window.dispatchEvent(new Event('newChat'));
        }
      }
    } catch {
      setRecentThreads(previousThreads);
      setResearchThreadIds(previousResearch);
    } finally {
      setDeletingThreadId(null);
    }
  };

  const filteredThreads = useMemo(() => {
    return recentThreads;
  }, [recentThreads]);

  const filteredResearchThreads = useMemo(() => {
    const idSet = new Set(researchThreadIds);
    return recentThreads.filter((session) => idSet.has(session.id));
  }, [recentThreads, researchThreadIds]);

  return (
    <div className="lab-glass-system min-h-screen w-full bg-[var(--lab-bg)] text-[var(--lab-text-primary)]">
      <div className="flex min-h-screen">
        {!readingMode ? (
        <aside className={cn(
          'glass-sidebar relative border-r border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-md transition-all duration-200',
          collapsed ? 'w-[74px]' : 'w-[286px]',
        )}>
          <div className="flex h-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              {collapsed ? null : (
                <div>
                  <p className="font-serif text-[28px] leading-none tracking-tight">Wu-Weism</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--lab-text-secondary)]">Workspace</p>
                </div>
              )}
              <button type="button" className="lab-button-secondary !px-2.5 !py-2" onClick={toggleSidebar} aria-label="Toggle sidebar">
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>

            <nav className={cn("flex flex-wrap gap-2", collapsed ? "flex-col" : "flex-row")}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="lab-nav-pill !px-3.5 !py-2.5"
                    data-active={active ? 'true' : 'false'}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {collapsed ? null : <span>{item.label}</span>}
                  </Link>
                );
              })}

              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    "lab-nav-pill !px-3.5 !py-2.5",
                    relicsOpen ? "border-[var(--lab-accent-earth)]" : ""
                  )}
                  onClick={() => setRelicsOpen(!relicsOpen)}
                  title={collapsed ? "Relics" : undefined}
                >
                  <Menu className="h-4 w-4" />
                  {collapsed ? null : <span>Relics</span>}
                  {!collapsed && <ChevronDown className={cn("h-3 w-3 transition-transform", relicsOpen ? "rotate-180" : "")} />}
                </button>

                {relicsOpen && (
                  <div className={cn(
                    "absolute z-[60] mt-2 min-w-[160px] rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-xl p-1.5 shadow-xl",
                    collapsed ? "left-full ml-2 top-0" : "left-0 top-full"
                  )}>
                    {RELICS_ITEMS.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setRelicsOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--lab-text-secondary)] hover:bg-[var(--lab-bg-elevated)] hover:text-[var(--lab-text-primary)] transition-colors"
                          data-active={subActive}
                        >
                          <SubIcon className="h-4 w-4" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>

            {isChatRoute && !collapsed ? (
              <section className="mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]/55 p-2.5">
                <div className="space-y-1.5">
                  <button
                    type="button"
                    className="lab-nav-pill w-full justify-start !py-2"
                    onClick={() => {
                      router.push('/chat?new=1');
                      window.dispatchEvent(new Event('newChat'));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>New chat</span>
                  </button>

                  <button type="button" className="lab-nav-pill w-full justify-start !py-2" onClick={() => setSidebarMode('threads')} data-active={sidebarMode === 'threads' ? 'true' : 'false'}>
                    <MessageSquare className="h-4 w-4" />
                    <span>Threads</span>
                    <span className="ml-auto rounded-full border border-[var(--lab-border)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--lab-text-tertiary)]">
                      {filteredThreads.length}
                    </span>
                  </button>
                  <button type="button" className="lab-nav-pill w-full justify-start !py-2" onClick={() => setSidebarMode('research')} data-active={sidebarMode === 'research' ? 'true' : 'false'}>
                    <Folder className="h-4 w-4" />
                    <span>Research</span>
                    <span className="ml-auto rounded-full border border-[var(--lab-border)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--lab-text-tertiary)]">
                      {filteredResearchThreads.length}
                    </span>
                  </button>
                </div>

                <div className="lab-scroll-region mt-4 h-[44vh] space-y-3 pr-1">
                  {sidebarMode === 'research' ? (
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-[var(--lab-text-tertiary)]">Research ({filteredResearchThreads.length})</p>
                      <button
                        type="button"
                        className="lab-button-secondary mb-2 w-full justify-start !py-2 text-xs"
                        onClick={() => {
                          setSidebarMode('threads');
                          router.push('/chat?new=1&context=research');
                          window.dispatchEvent(new Event('newChat'));
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New research query
                      </button>
                      <div className="mb-2 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]/70 p-2">
                        <button
                          type="button"
                          className="lab-nav-pill w-full justify-start !px-2 !py-1 text-xs"
                          onClick={() => setResearchExpanded((current) => !current)}
                        >
                          {researchExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          <Folder className="h-3.5 w-3.5" />
                          <span className="truncate">Research</span>
                        </button>
                        {researchExpanded ? (
                          <div className="mt-1 space-y-1">
                            {filteredResearchThreads.slice(0, 24).map((session) => (
                              <div key={session.id} className="flex items-center gap-1 px-1 py-0.5">
                                <button type="button" className="min-w-0 flex-1 truncate px-1 py-1 text-left text-xs text-[var(--lab-text-secondary)] hover:text-[var(--lab-text-primary)]" onClick={() => openThread(session.id)}>
                                  {session.title || 'Untitled thread'}
                                </button>
                                <button
                                  type="button"
                                  className="lab-button-secondary !px-1.5 !py-1"
                                  onClick={() => removeFromResearch(session.id)}
                                  aria-label="Remove from Research"
                                  title="Remove from Research"
                                >
                                  <FolderMinus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="lab-button-secondary !px-1.5 !py-1"
                                  onClick={() => void handleDeleteThread(session.id)}
                                  aria-label="Delete thread"
                                  title="Delete thread"
                                  disabled={deletingThreadId === session.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {filteredResearchThreads.length === 0 ? <p className="px-2 py-1 text-xs text-[var(--lab-text-tertiary)]">No research queries yet. Add from Threads or start a new research query.</p> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-[var(--lab-text-tertiary)]">Threads ({filteredThreads.length})</p>
                      <div className="space-y-2">
                        {filteredThreads.slice(0, 24).map((session) => (
                          <div key={session.id} className="lab-card-interactive w-full !p-2 text-left">
                            <div className="flex items-start justify-between gap-2">
                              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openThread(session.id)}>
                                <p className="truncate text-sm font-medium text-[var(--lab-text-primary)]">{session.title || 'Untitled thread'}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)]">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {new Date(session.updated_at).toLocaleString()}
                                </p>
                              </button>
                              <button
                                type="button"
                                className="lab-button-secondary !px-2 !py-1 text-[11px]"
                                onClick={() =>
                                  setResearchThreadIds((current) =>
                                    current.includes(session.id)
                                      ? current.filter((id) => id !== session.id)
                                      : [session.id, ...current]
                                  )
                                }
                                aria-label={researchThreadIds.includes(session.id) ? 'Remove from Research' : 'Add to Research'}
                                title={researchThreadIds.includes(session.id) ? 'Remove from Research' : 'Add to Research'}
                              >
                                {researchThreadIds.includes(session.id) ? <FolderCheck className="h-3.5 w-3.5" /> : <FolderPlus className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                className="lab-button-secondary !px-2 !py-1 text-[11px]"
                                onClick={() => void handleDeleteThread(session.id)}
                                aria-label="Delete thread"
                                title="Delete thread"
                                disabled={deletingThreadId === session.id}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {recentThreads.length === 0 ? <div className="lab-empty-state mt-2 text-xs">No thread history for this account.</div> : null}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            <div className={cn('mt-auto space-y-2', isChatRoute && !collapsed ? 'pt-8' : '')}>
              {isChatRoute && !collapsed ? <div className="lab-divider-gradient mb-2" /> : null}
              <button
                type="button"
                className="lab-nav-pill w-full"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                title={collapsed ? 'Toggle theme' : undefined}
              >
                {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {collapsed ? null : <span>{mounted && resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
              </button>

              <Link href="https://docs.openclaw.ai" target="_blank" rel="noreferrer" className="lab-nav-pill" title={collapsed ? 'Documentation' : undefined}>
                <BookOpen className="h-4 w-4" />
                {collapsed ? null : <span>Documentation</span>}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  className="lab-nav-pill w-full"
                  onClick={() => setAccountOpen((v) => !v)}
                  title={collapsed ? 'Account' : undefined}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--lab-border)] text-[10px] font-semibold">
                    {initials}
                  </span>
                  {collapsed ? null : (
                    <span className="min-w-0 flex-1 truncate text-left">
                      {userEmail || 'Account'}
                    </span>
                  )}
                  {collapsed ? null : <ChevronDown className="h-4 w-4" />}
                </button>

                {accountOpen ? (
                  <div className={cn(
                    'absolute z-50 min-w-[190px] rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-2 shadow-xl',
                    collapsed ? 'bottom-12 left-0' : 'bottom-12 right-0',
                  )}>
                    <div className="mb-1 px-2 py-1 text-xs text-[var(--lab-text-tertiary)]">Signed in</div>
                    <div className="mb-2 truncate px-2 text-xs text-[var(--lab-text-secondary)]">{userEmail || 'Anonymous session'}</div>
                    <button
                      type="button"
                      className="lab-nav-pill w-full"
                      onClick={() => {
                        setAccountOpen(false);
                        router.push('/chat');
                      }}
                    >
                      <UserCircle2 className="h-4 w-4" />
                      <span>Workspace</span>
                    </button>
                    <button type="button" className="lab-nav-pill mt-1 w-full" onClick={() => void handleSignOut()}>
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
        ) : null}

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
