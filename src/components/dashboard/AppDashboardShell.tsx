'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Boxes,
  Clock3,
  Code2,
  Folder,
  FolderPlus,
  FolderTree,
  Gavel,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sun,
  UserCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AppDashboardShellProps {
  children: ReactNode;
}

interface ChatSidebarSession {
  id: string;
  title: string;
  updated_at: string;
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/hybrid', label: 'Hybrid', icon: Bot },
  { href: '/legal', label: 'Legal', icon: Gavel },
  { href: '/education', label: 'Educational', icon: GraduationCap },
];

export function AppDashboardShell({ children }: AppDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [recentThreads, setRecentThreads] = useState<ChatSidebarSession[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [threadFolderMap, setThreadFolderMap] = useState<Record<string, string>>({});
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
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

    try {
      const savedFolders = window.localStorage.getItem('chat-thread-folders');
      const savedMap = window.localStorage.getItem('chat-thread-folder-map');
      if (savedFolders) setFolders(JSON.parse(savedFolders) as string[]);
      if (savedMap) setThreadFolderMap(JSON.parse(savedMap) as Record<string, string>);
    } catch {
      setFolders([]);
      setThreadFolderMap({});
    }

    void loadHistory();
    window.addEventListener('historyImported', loadHistory);
    return () => window.removeEventListener('historyImported', loadHistory);
  }, [isChatRoute]);

  useEffect(() => {
    if (!isChatRoute) return;
    window.localStorage.setItem('chat-thread-folders', JSON.stringify(folders));
  }, [folders, isChatRoute]);

  useEffect(() => {
    if (!isChatRoute) return;
    window.localStorage.setItem('chat-thread-folder-map', JSON.stringify(threadFolderMap));
  }, [threadFolderMap, isChatRoute]);

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

  const folderedThreads = useMemo(() => {
    const groups: Record<string, ChatSidebarSession[]> = {};
    for (const folder of folders) groups[folder] = [];

    const unfiled: ChatSidebarSession[] = [];
    for (const thread of recentThreads) {
      const folder = threadFolderMap[thread.id];
      if (folder && groups[folder]) groups[folder].push(thread);
      else unfiled.push(thread);
    }

    return { groups, unfiled };
  }, [folders, recentThreads, threadFolderMap]);

  const openThread = (sessionId: string) => {
    router.push(`/chat?sessionId=${sessionId}`);
    window.dispatchEvent(new CustomEvent('loadSession', { detail: { sessionId } }));
  };

  const filteredUnfiledThreads = useMemo(() => {
    if (!searchQuery.trim()) return folderedThreads.unfiled;
    const q = searchQuery.toLowerCase();
    return folderedThreads.unfiled.filter((session) => (session.title || 'Untitled thread').toLowerCase().includes(q));
  }, [folderedThreads.unfiled, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[var(--lab-bg)] text-[var(--lab-text-primary)]">
      <div className="flex min-h-screen">
        <aside className={cn(
          'relative border-r border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-md transition-all duration-200',
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

            {isChatRoute ? null : (
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="lab-nav-pill"
                      data-active={active ? 'true' : 'false'}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      {collapsed ? null : <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            )}

            {isChatRoute && !collapsed ? (
              <section className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]/55 p-3">
                <div className="space-y-1.5">
                  <button
                    type="button"
                    className="lab-nav-pill w-full justify-start !py-2.5"
                    onClick={() => {
                      router.push('/chat?new=1');
                      window.dispatchEvent(new Event('newChat'));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>New chat</span>
                  </button>

                  <div className="flex items-center gap-2 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] px-3 py-2">
                    <Search className="h-4 w-4 text-[var(--lab-text-secondary)]" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--lab-text-tertiary)]"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>

                  <button type="button" className="lab-nav-pill w-full justify-start !py-2.5" onClick={() => router.push('/chat')}>
                    <MessageSquare className="h-4 w-4" />
                    <span>Chats</span>
                  </button>
                  <button type="button" className="lab-nav-pill w-full justify-start !py-2.5" onClick={() => setCreatingFolder((v) => !v)}>
                    <Folder className="h-4 w-4" />
                    <span>Projects</span>
                  </button>
                  <button type="button" className="lab-nav-pill w-full justify-start !py-2.5" onClick={() => router.push('/legal')}>
                    <Boxes className="h-4 w-4" />
                    <span>Artifacts</span>
                  </button>
                  <button type="button" className="lab-nav-pill w-full justify-start !py-2.5" onClick={() => router.push('/hybrid')}>
                    <Code2 className="h-4 w-4" />
                    <span>Code</span>
                  </button>
                </div>

                {creatingFolder ? (
                  <div className="mb-3 mt-3 flex items-center gap-2">
                    <input
                      className="lab-input !min-h-[36px] text-sm"
                      value={newFolderName}
                      placeholder="Project folder name"
                      onChange={(event) => setNewFolderName(event.target.value)}
                    />
                    <button
                      type="button"
                      className="lab-button-primary !px-3 !py-2 text-xs"
                      onClick={() => {
                        const name = newFolderName.trim();
                        if (!name || folders.includes(name)) return;
                        setFolders((prev) => [...prev, name]);
                        setExpandedFolders((prev) => ({ ...prev, [name]: true }));
                        setNewFolderName('');
                        setCreatingFolder(false);
                      }}
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                ) : null}

                <div className="lab-scroll-region mt-4 h-[44vh] space-y-3 pr-1">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-[var(--lab-text-tertiary)]">Starred</p>
                    {folders.length === 0 ? <p className="text-xs text-[var(--lab-text-tertiary)]">No projects yet.</p> : null}
                    {folders.slice(0, 4).map((folder) => {
                      const items = folderedThreads.groups[folder] || [];
                      const expanded = expandedFolders[folder] ?? true;
                      return (
                        <div key={folder} className="mb-2 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]/70 p-2">
                          <button
                            type="button"
                            className="lab-nav-pill w-full justify-start !px-2 !py-1 text-xs"
                            onClick={() => setExpandedFolders((prev) => ({ ...prev, [folder]: !expanded }))}
                          >
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <FolderTree className="h-3.5 w-3.5" />
                            <span className="truncate">{folder}</span>
                          </button>
                          {expanded ? (
                            <div className="mt-1 space-y-1">
                              {items.slice(0, 3).map((session) => (
                                <button key={session.id} type="button" className="w-full truncate px-2 py-1 text-left text-xs text-[var(--lab-text-secondary)] hover:text-[var(--lab-text-primary)]" onClick={() => openThread(session.id)}>
                                  {session.title || 'Untitled thread'}
                                </button>
                              ))}
                              {items.length === 0 ? <p className="px-2 py-1 text-xs text-[var(--lab-text-tertiary)]">No threads yet.</p> : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-[var(--lab-text-tertiary)]">Recents</p>
                    <div className="space-y-2">
                      {filteredUnfiledThreads.slice(0, 18).map((session) => (
                        <div key={session.id} className="lab-card-interactive w-full !p-2 text-left">
                          <button type="button" className="w-full text-left" onClick={() => openThread(session.id)}>
                            <p className="truncate text-sm font-medium text-[var(--lab-text-primary)]">{session.title || 'Untitled thread'}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)]">
                              <Clock3 className="h-3.5 w-3.5" />
                              {new Date(session.updated_at).toLocaleString()}
                            </p>
                          </button>
                          {folders.length > 0 ? (
                            <select
                              className="lab-select mt-2 !min-h-[34px] text-xs"
                              value={threadFolderMap[session.id] || ''}
                              onChange={(event) => {
                                const value = event.target.value;
                                setThreadFolderMap((prev) => ({ ...prev, [session.id]: value }));
                              }}
                            >
                              <option value="">Move to project…</option>
                              {folders.map((folder) => (
                                <option key={folder} value={folder}>{folder}</option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {recentThreads.length === 0 ? <div className="lab-empty-state mt-2 text-xs">No recent history for this account.</div> : null}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mt-auto space-y-2">
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
                  {collapsed ? null : <Menu className="h-4 w-4" />}
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

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
