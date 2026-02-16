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
  FileText,
  Gavel,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Plus,
  Scale,
  Search,
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

interface SidebarFolder {
  id: string;
  name: string;
}

interface SidebarFolderFile {
  id: string;
  name: string;
  createdAt: string;
}

const NAV_ITEMS = [
  { href: '/mission-control', label: 'Mission', icon: Home },
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
  
  // Phase L: Mock Folder State (to be replaced by DB)
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [folderOpenState, setFolderOpenState] = useState<Record<string, boolean>>({});
  const [folderFiles, setFolderFiles] = useState<Record<string, SidebarFolderFile[]>>({});
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const createFolder = () => {
    const name = prompt("Enter folder name:");
    if (!name) return;

    const nextFolderId = crypto.randomUUID();
    setFolders((prev) => [...prev, { id: nextFolderId, name }]);
    setFolderOpenState((prev) => ({ ...prev, [nextFolderId]: true }));
    setActiveFolderId(nextFolderId);

    // Immediately create first file and open a new chat session.
    createFolderFile(nextFolderId, undefined, true);
  };

  const toggleFolder = (folderId: string) => {
    setActiveFolderId((current) => (current === folderId ? null : folderId));
    setFolderOpenState(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const createFolderFile = (folderId: string, defaultName?: string, startNewChat = false) => {
    const proposed = defaultName ?? `Untitled file ${(folderFiles[folderId]?.length ?? 0) + 1}`;
    const name = prompt('Enter file name:', proposed);
    if (!name) return;
    const nextFile: SidebarFolderFile = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    setFolderFiles((prev) => ({
      ...prev,
      [folderId]: [...(prev[folderId] ?? []), nextFile],
    }));
    setFolderOpenState((prev) => ({ ...prev, [folderId]: true }));
    setActiveFolderId(folderId);
    if (startNewChat) {
      router.push('/chat?new=1');
      window.dispatchEvent(new Event('newChat'));
    }
  };

  const removeFolderFile = (folderId: string, fileId: string) => {
    setFolderFiles((prev) => ({
      ...prev,
      [folderId]: (prev[folderId] ?? []).filter((file) => file.id !== fileId),
    }));
  };

  const removeFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
    setFolderFiles((prev) => {
      const next = { ...prev };
      delete next[folderId];
      return next;
    });
    setFolderOpenState((prev) => {
      const next = { ...prev };
      delete next[folderId];
      return next;
    });
    setActiveFolderId((current) => (current === folderId ? null : current));
  };

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem('wuweism-dashboard-sidebar');
    if (saved === 'collapsed') setCollapsed(true);

    try {
      const savedFolders = window.localStorage.getItem('chat-folders-v1');
      const savedFolderFiles = window.localStorage.getItem('chat-folder-files-v1');
      if (savedFolders) {
        const parsedFolders = JSON.parse(savedFolders) as SidebarFolder[];
        if (Array.isArray(parsedFolders)) setFolders(parsedFolders);
      }
      if (savedFolderFiles) {
        const parsedFolderFiles = JSON.parse(savedFolderFiles) as Record<string, SidebarFolderFile[]>;
        if (parsedFolderFiles && typeof parsedFolderFiles === 'object') setFolderFiles(parsedFolderFiles);
      }
    } catch {
      setFolders([]);
      setFolderFiles({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('chat-folders-v1', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    window.localStorage.setItem('chat-folder-files-v1', JSON.stringify(folderFiles));
  }, [folderFiles]);

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
          throw new Error(`History fetch failed: ${response.status}`);
        }
        const payload = (await response.json()) as { history?: ChatSidebarSession[] };
        setRecentThreads(Array.isArray(payload.history) ? payload.history : []);
      } catch {
        // Keep existing history visible on transient failures.
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
    const onFocus = () => void loadHistory();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadHistory();
    };
    window.addEventListener('historyImported', loadHistory);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('historyImported', loadHistory);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
    const currentParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const currentSessionId = currentParams.get('sessionId');
    if (pathname?.startsWith('/chat') && currentSessionId === sessionId) {
      window.dispatchEvent(new CustomEvent('loadSession', { detail: { sessionId } }));
      return;
    }
    router.push(`/chat?sessionId=${sessionId}`);
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
    <div className={cn('lab-glass-system lg-shell w-full bg-[var(--lab-bg)] text-[var(--lab-text-primary)]', isChatRoute ? 'h-screen' : 'min-h-screen')}>
      <div className={cn('flex', isChatRoute ? 'h-screen' : 'min-h-screen')}>
        {!readingMode ? (
        <aside className={cn(
          'glass-sidebar lg-sidebar relative border-r border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-md transition-all duration-200',
          collapsed ? 'w-[74px]' : 'w-[286px]',
        )}>
          <div className="flex h-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              {collapsed ? null : (
                <div>
                  <p className="font-serif text-[24px] leading-tight tracking-tight text-[var(--lab-text-primary)]">Wu-Weism</p>
                </div>
              )}
              <div className="flex items-center gap-1">
                <button type="button" className="lab-button-secondary lg-control !border-none !bg-transparent !p-1.5 opacity-60 hover:opacity-100" aria-label="Search">
                  <Search className="h-4 w-4" />
                </button>
                <button type="button" className="lab-button-secondary lg-control !border-none !bg-transparent !p-1.5 opacity-60 hover:opacity-100" onClick={toggleSidebar} aria-label="Toggle sidebar">
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <nav className={cn("flex flex-wrap gap-2", collapsed ? "flex-col" : "flex-row")}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="lab-nav-pill lg-control !px-3.5 !py-2.5"
                    data-active={active ? 'true' : 'false'}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {collapsed ? null : <span>{item.label}</span>}
                  </Link>
                );
              })}

              {/* Relics Menu - Moved to align with other nav items */}
              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    "lab-nav-pill !px-3.5 !py-2.5",
                    relicsOpen ? "!bg-[#2b2b2b]" : ""
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
                    "absolute z-[60] mt-2 min-w-[160px] rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-xl p-1.5 shadow-xl lg-dropdown",
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
                          className="lg-control flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--lab-text-secondary)] transition-colors hover:bg-[var(--lab-bg-elevated)] hover:text-[var(--lab-text-primary)]"
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
              <div className="mt-6 flex-1 overflow-hidden">
                <div className="px-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="sidebar-history-item lg-control !py-2.5 !font-medium flex-1"
                      onClick={() => {
                        if (activeFolderId) createFolderFile(activeFolderId);
                        router.push('/chat?new=1');
                        window.dispatchEvent(new Event('newChat'));
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>New chat</span>
                    </button>
                    
                    <button
                      type="button"
                      className="sidebar-history-item lg-control !py-2.5 !px-2.5 !w-auto"
                      onClick={() => {
                        createFolder();
                      }}
                      title="New Folder"
                    >
                      <FolderPlus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="pt-4 pb-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--lab-text-tertiary)] opacity-70">Folders</p>
                  </div>
                </div>

                <div className="lab-scroll-region-minimal h-[68vh] space-y-0.5 pt-1 overflow-y-auto pr-1">
                  {/* Folders Section */}
                  {folders.map(folder => (
                    <div key={folder.id} className="group mb-1">
                      <div
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                          activeFolderId === folder.id
                            ? "bg-[var(--lab-bg-secondary)] text-[var(--lab-text-primary)]"
                            : "text-[var(--lab-text-secondary)] hover:bg-[var(--lab-bg-secondary)] hover:text-[var(--lab-text-primary)]",
                        )}
                      >
                        <button
                          type="button"
                          className="lg-control flex min-w-0 flex-1 items-center gap-2 rounded-md text-left"
                          onClick={() => toggleFolder(folder.id)}
                        >
                          {folderOpenState[folder.id] ? <Folder className="h-3.5 w-3.5" /> : <FolderMinus className="h-3.5 w-3.5" />}
                          <span className="truncate">{folder.name}</span>
                        </button>
                        <span className="text-[10px] opacity-50">{folderFiles[folder.id]?.length ?? 0}</span>
                        <button
                          type="button"
                          className="lg-control rounded p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                          onClick={() => removeFolder(folder.id)}
                          aria-label="Delete folder"
                          title="Delete folder"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      
                      {folderOpenState[folder.id] && (
                        <div className="ml-2 pl-2 border-l border-[var(--lab-border)] mt-0.5 space-y-0.5">
                          <button
                            type="button"
                            className="lg-control flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium opacity-70 hover:opacity-100 hover:bg-[var(--lab-bg-secondary)] rounded-md transition-colors"
                            onClick={() => createFolderFile(folder.id, undefined, true)}
                            title="Create file in folder"
                          >
                            <Plus className="h-3 w-3" />
                            <span>New file</span>
                          </button>
                          {(folderFiles[folder.id] ?? []).length === 0 ? (
                            <div className="px-2 py-1 text-[10px] opacity-40 italic">Empty folder</div>
                          ) : (
                            (folderFiles[folder.id] ?? []).map((file) => (
                              <div key={file.id} className="group lg-control flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-[var(--lab-text-secondary)]">
                                <FileText className="h-3.5 w-3.5 opacity-70" />
                                <span className="truncate" title={file.name}>{file.name}</span>
                                <button
                                  type="button"
                                  className="lg-control ml-auto rounded p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                                  onClick={() => removeFolderFile(folder.id, file.id)}
                                  aria-label="Remove file"
                                  title="Remove file"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Threads List */}
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--lab-text-tertiary)] opacity-70">History</p>
                  </div>
                  {filteredThreads.slice(0, 48).map((session) => {
                    const isActive = pathname === '/chat' && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('sessionId') === session.id;
                    return (
                      <div 
                        key={session.id} 
                        className={cn(
                          "group sidebar-history-item relative",
                          isActive && "sidebar-history-item-active"
                        )}
                      >
                        <button 
                          type="button" 
                          className="flex-1 truncate text-left" 
                          onClick={() => openThread(session.id)}
                          title={session.title || 'Untitled thread'}
                        >
                          {session.title || 'Untitled thread'}
                        </button>
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            className="lg-control rounded-md p-1 hover:bg-white/10"
                            onClick={() => void handleDeleteThread(session.id)}
                            aria-label="Delete thread"
                            title="Delete thread"
                            disabled={deletingThreadId === session.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {recentThreads.length === 0 ? <div className="px-3 py-4 text-xs italic opacity-40">No threads yet.</div> : null}
                </div>
              </div>
            ) : null}

            <div className={cn('mt-auto space-y-2', isChatRoute && !collapsed ? 'pt-8' : '')}>
              {isChatRoute && !collapsed ? <div className="lab-divider-gradient mb-2" /> : null}
              <button
                type="button"
                className="lab-nav-pill lg-control w-full"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                title={collapsed ? 'Toggle theme' : undefined}
              >
                {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {collapsed ? null : <span>{mounted && resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
              </button>

              <Link href="https://docs.openclaw.ai" target="_blank" rel="noreferrer" className="lab-nav-pill lg-control" title={collapsed ? 'Documentation' : undefined}>
                <BookOpen className="h-4 w-4" />
                {collapsed ? null : <span>Documentation</span>}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  className="lab-nav-pill lg-control w-full"
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
                    'absolute z-50 min-w-[190px] rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-2 shadow-xl lg-dropdown',
                    collapsed ? 'bottom-12 left-0' : 'bottom-12 right-0',
                  )}>
                    <div className="mb-1 px-2 py-1 text-xs text-[var(--lab-text-tertiary)]">Signed in</div>
                    <div className="mb-2 truncate px-2 text-xs text-[var(--lab-text-secondary)]">{userEmail || 'Anonymous session'}</div>
                    <button
                      type="button"
                      className="lab-nav-pill lg-control w-full"
                      onClick={() => {
                        setAccountOpen(false);
                        router.push('/chat');
                      }}
                    >
                      <UserCircle2 className="h-4 w-4" />
                      <span>Workspace</span>
                    </button>
                    <button type="button" className="lab-nav-pill lg-control mt-1 w-full" onClick={() => void handleSignOut()}>
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

        <div className={cn('min-w-0 flex-1', isChatRoute ? 'h-screen' : 'min-h-screen')}>{children}</div>
      </div>
    </div>
  );
}
