'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  ChevronDown,
  FlaskConical,
  FolderMinus,
  Folder,
  FolderPlus,
  FileText,
  Gavel,
  GraduationCap,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Plus,
  Search,
  Sun,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { SidebarModelSettings } from './SidebarModelSettings';

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
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/hybrid', label: 'Hybrid', icon: Bot },
];

const RELICS_ITEMS = [
  { href: '/lab', label: 'Labs', icon: FlaskConical },
  { href: '/legal', label: 'Legal', icon: Gavel },
  { href: '/education', label: 'Educational', icon: GraduationCap },
];

export function AppDashboardShell({ children, readingMode = false }: AppDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [recentThreads, setRecentThreads] = useState<ChatSidebarSession[]>([]);
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
      setAuthChecked(true);
    }).catch(() => {
      setUserEmail(null);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!isChatRoute) return;
    if (!authChecked) return;
    if (!userEmail) {
      setRecentThreads([]);
      return;
    }

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
  }, [authChecked, isChatRoute, userEmail]);

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

  return (
    <div className={cn('app-feature-shell', isChatRoute ? 'h-screen' : 'min-h-screen')}>
      <div className={cn('flex', isChatRoute ? 'h-screen' : 'min-h-screen')}>
        {!readingMode ? (
        <aside className={cn(
          'sidebar relative transition-all duration-200',
          collapsed ? 'collapsed' : '',
        )}>
          <div className="sidebar-header">
            {collapsed ? null : (
              <>
                <div className="wordmark-icon"></div>
                <span style={{ fontFamily: 'var(--font-instrument-serif)', fontSize: '15px', fontWeight: 400, letterSpacing: '0.01em' }}>Synthetic Mind</span>
              </>
            )}
            <button type="button" className="action-button !bg-transparent !border-none !p-1.5 opacity-60 hover:opacity-100 ml-auto" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <div className="sidebar-content">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-item", active ? "active" : "")}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {collapsed ? null : <span style={{ fontFamily: 'var(--font-instrument-serif)', fontSize: '13.5px', fontWeight: 400, letterSpacing: '0.02em' }}>{item.label}</span>}
                </Link>
              );
            })}

            {/* Relics Menu */}
            <div className="relative w-full">
              <button
                type="button"
                className={cn(
                  "nav-item w-full",
                  relicsOpen ? "active" : ""
                )}
                onClick={() => setRelicsOpen(!relicsOpen)}
                title={collapsed ? "Relics" : undefined}
              >
                <Menu className="h-4 w-4" />
                {collapsed ? null : <span className="font-serif tracking-wide text-left flex-1" style={{ fontSize: '13.5px' }}>Relics</span>}
                {!collapsed && <ChevronDown className={cn("h-4 w-4 transition-transform", relicsOpen ? "rotate-180" : "")} />}
              </button>

              {relicsOpen && (
                <div className={cn(
                  "absolute z-[60] mt-2 min-w-[160px] rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-xl p-1.5 shadow-[var(--lab-shadow-lift)]",
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
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors",
                          subActive ? "bg-[var(--lab-active-bg)] text-[var(--lab-text-primary)]" : "text-[var(--lab-text-secondary)] hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]"
                        )}
                      >
                        <SubIcon className="h-4 w-4" />
                        <span className="font-serif tracking-wide">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {isChatRoute && !collapsed ? (
              <div className="mt-4 flex flex-col flex-1 min-h-0">
                <div className="action-buttons pr-1">
                  <button
                    className="btn btn-outline flex-1"
                    onClick={() => {
                      if (activeFolderId) createFolderFile(activeFolderId);
                      router.push('/chat?new=1');
                      window.dispatchEvent(new Event('newChat'));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="font-serif tracking-wide">New chat</span>
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ width: '40px', padding: 0, justifyContent: 'center' }}
                    onClick={() => createFolder()}
                    title="New Folder"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mt-4 pr-1 lab-scroll-region space-y-2 pb-2">
                  <div>
                    <div className="sidebar-section-label">Folders</div>
                    {folders.map(folder => (
                      <div key={folder.id} className="group mb-1">
                        <div
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                            activeFolderId === folder.id
                              ? "bg-[var(--lab-active-bg)] text-[var(--lab-text-primary)]"
                              : "text-[var(--lab-text-secondary)] hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]",
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 text-left bg-transparent border-none p-0 focus:outline-none"
                            onClick={() => toggleFolder(folder.id)}
                          >
                            {folderOpenState[folder.id] ? <Folder className="h-3.5 w-3.5 text-[var(--lab-accent-clay)]" /> : <FolderMinus className="h-3.5 w-3.5 opacity-60" />}
                            <span className="truncate flex-1">{folder.name}</span>
                          </button>
                          <span className="text-[10px] opacity-50 font-mono">{folderFiles[folder.id]?.length ?? 0}</span>
                          <button
                            type="button"
                            className="rounded leading-none opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 bg-transparent border-none p-1 focus:outline-none text-[var(--lab-text-secondary)] hover:text-red-400"
                            onClick={() => removeFolder(folder.id)}
                            aria-label="Delete folder"
                            title="Delete folder"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {folderOpenState[folder.id] && (
                          <div className="ml-3 pl-2 border-l border-[var(--lab-border)] mt-1 mb-2 space-y-0.5">
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-2 py-1.5 w-full text-left text-[11px] font-medium opacity-60 hover:opacity-100 hover:bg-[var(--lab-hover-bg)] rounded-md transition-colors border-none bg-transparent"
                              onClick={() => createFolderFile(folder.id, undefined, true)}
                              title="Create file in folder"
                            >
                              <Plus className="h-3 w-3" />
                              <span className="font-serif tracking-wide">New file</span>
                            </button>
                            {(folderFiles[folder.id] ?? []).length === 0 ? (
                              <div className="px-2 py-1 text-[11px] opacity-40 italic font-serif">Empty folder</div>
                            ) : (
                              (folderFiles[folder.id] ?? []).map((file) => (
                                <div key={file.id} className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-[var(--lab-text-secondary)] hover:text-[var(--lab-text-primary)] hover:bg-[var(--lab-hover-bg)]">
                                  <FileText className="h-3.5 w-3.5 opacity-50 shrink-0" />
                                  <span className="truncate flex-1 font-serif tracking-wide" title={file.name}>{file.name}</span>
                                  <button
                                    type="button"
                                    className="rounded leading-none opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 border-none bg-transparent p-1 focus:outline-none hover:text-[var(--lab-error)]"
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
                  </div>

                  <div className="mt-4">
                    <div className="sidebar-section-label">History</div>
                    {filteredThreads.slice(0, 48).map((session) => {
                      const isActive = pathname === '/chat' && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('sessionId') === session.id;
                      return (
                        <div 
                          key={session.id} 
                          className={cn(
                            "history-item group relative",
                            isActive && "active"
                          )}
                        >
                          <button
                            type="button"
                            className="flex-1 truncate text-left border-none bg-transparent p-0 flex items-center h-full w-full"
                            onClick={() => openThread(session.id)}
                            title={session.title || 'Untitled thread'}
                          >
                            <span className="truncate font-serif tracking-wide text-[12.5px] leading-relaxed">{session.title || 'Untitled thread'}</span>
                          </button>
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 bg-[var(--lab-bg)] pl-2">
                            <button
                              type="button"
                              className="rounded p-1 text-[var(--lab-text-secondary)] hover:text-[var(--lab-error)] hover:bg-[var(--lab-hover-bg)] border-none bg-transparent flex items-center justify-center transition-colors"
                              onClick={(e) => { e.stopPropagation(); void handleDeleteThread(session.id); }}
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
                    {recentThreads.length === 0 ? <div className="history-item"><span className="opacity-40 italic font-serif">No threads yet.</span></div> : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ flex: 1 }}></div>

            {isChatRoute && !collapsed ? <div className="lab-divider-gradient mb-2 mt-4" /> : null}

            <button
              type="button"
              className="nav-item w-full"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title={collapsed ? 'Toggle theme' : undefined}
            >
              {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {collapsed ? null : <span className="font-serif tracking-wide text-left flex-1" style={{ fontSize: '13.5px' }}>{mounted && resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
            </button>

            <Link href="https://docs.openclaw.ai" target="_blank" rel="noreferrer" className="nav-item w-full" title={collapsed ? 'Documentation' : undefined}>
              <BookOpen className="h-4 w-4" />
              {collapsed ? null : <span className="font-serif tracking-wide text-left flex-1" style={{ fontSize: '13.5px' }}>Documentation</span>}
            </Link>

            <SidebarModelSettings collapsed={collapsed} />

            <div className="relative w-full">
              <button
                type="button"
                className="nav-item w-full"
                onClick={() => setAccountOpen((v) => !v)}
                title={collapsed ? 'Account' : undefined}
              >
                <div className="avatar">
                  {initials}
                </div>
                {collapsed ? null : (
                  <span className="min-w-0 flex-1 truncate text-left font-serif tracking-wide text-[13.5px]">
                    {userEmail || 'Account'}
                  </span>
                )}
                {collapsed ? null : <ChevronDown className="h-4 w-4" />}
              </button>

              {accountOpen && (
                <div className={cn(
                  'absolute z-50 min-w-[200px] rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-xl p-2 shadow-[var(--lab-shadow-lift)]',
                  collapsed ? 'bottom-12 left-0' : 'bottom-12 right-0',
                )}>
                  <div className="mb-1 px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--lab-text-tertiary)] mb-0.5">Signed in</div>
                    <div className="truncate text-[13.5px] font-serif text-[var(--lab-text-primary)]">{userEmail || 'Anonymous session'}</div>
                  </div>
                  <div className="lab-divider-gradient my-1" />
                  <button
                    type="button"
                    className="nav-item w-full !px-3 !py-2 !gap-3 !h-auto"
                    onClick={() => {
                      setAccountOpen(false);
                      router.push('/chat');
                    }}
                  >
                    <UserCircle2 className="h-4 w-4 opacity-70" />
                    <span className="font-serif tracking-wide flex-1 text-left" style={{ fontSize: '13.5px' }}>Workspace</span>
                  </button>
                  <button 
                    type="button" 
                    className="nav-item w-full !px-3 !py-2 !gap-3 !h-auto text-[var(--lab-error)] hover:!bg-[var(--lab-error)]/10" 
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4 opacity-70" />
                    <span className="font-serif tracking-wide flex-1 text-left" style={{ fontSize: '13.5px' }}>Sign out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </aside>
        ) : null}

        <div className={cn('min-w-0 flex-1', isChatRoute ? 'h-screen' : 'min-h-screen')}>{children}</div>
      </div>
    </div>
  );
}
