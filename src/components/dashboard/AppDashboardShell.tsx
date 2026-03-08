'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  Command,
  FileText,
  FlaskConical,
  Folder,
  FolderMinus,
  FolderPlus,
  Gavel,
  GraduationCap,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
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
import type { CommandHubItem, WorkbenchDrawerConfig } from '@/types/workbench';

interface AppDashboardShellProps {
  children: ReactNode;
  feature: 'chat' | 'hybrid' | 'legal' | 'report' | 'education' | 'lab';
  header?: ReactNode;
  navRail?: ReactNode;
  drawer?: WorkbenchDrawerConfig;
  commandItems?: CommandHubItem[];
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

const PRIMARY_NAV = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/hybrid', label: 'Hybrid', icon: Bot },
  { href: '/legal', label: 'Legal', icon: Gavel },
];

const SECONDARY_NAV = [
  { href: '/lab', label: 'Labs', icon: FlaskConical },
  { href: '/education', label: 'Educational', icon: GraduationCap },
];

export function AppDashboardShell({
  children,
  feature,
  header,
  navRail,
  drawer,
  commandItems = [],
  readingMode = false,
}: AppDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(feature !== 'chat');
  const [drawerPinned, setDrawerPinned] = useState(feature !== 'chat');
  const [hubOpen, setHubOpen] = useState(false);
  const [hubQuery, setHubQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [recentThreads, setRecentThreads] = useState<ChatSidebarSession[]>([]);
  const [researchThreadIds, setResearchThreadIds] = useState<string[]>([]);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [folderOpenState, setFolderOpenState] = useState<Record<string, boolean>>({});
  const [folderFiles, setFolderFiles] = useState<Record<string, SidebarFolderFile[]>>({});
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const isChatRoute = pathname?.startsWith('/chat');
  const railStorageKey = `workbench-drawer:${feature}`;
  const activeSessionId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('sessionId')
    : null;

  useEffect(() => {
    setMounted(true);
    try {
      const savedState = window.localStorage.getItem(railStorageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState) as { open?: boolean; pinned?: boolean };
        if (typeof parsed.open === 'boolean') setDrawerOpen(parsed.open);
        if (typeof parsed.pinned === 'boolean') setDrawerPinned(parsed.pinned);
      }
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
  }, [railStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(railStorageKey, JSON.stringify({ open: drawerOpen, pinned: drawerPinned }));
      window.localStorage.setItem('chat-folders-v1', JSON.stringify(folders));
      window.localStorage.setItem('chat-folder-files-v1', JSON.stringify(folderFiles));
    } catch {
      // Ignore storage failures.
    }
  }, [drawerOpen, drawerPinned, folderFiles, folders, railStorageKey]);

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
    if (!isChatRoute || !authChecked || !userEmail) {
      if (!userEmail) setRecentThreads([]);
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
        // Keep prior list if fetch fails.
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

  useEffect(() => {
    if (readingMode) {
      setHubOpen(false);
      setAccountOpen(false);
    }
  }, [readingMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setHubOpen((current) => !current);
      }
      if (event.key === 'Escape') {
        setHubOpen(false);
        setAccountOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const initials = useMemo(() => {
    if (!userEmail) return 'WW';
    const local = userEmail.split('@')[0] || '';
    return local.slice(0, 2).toUpperCase() || 'WW';
  }, [userEmail]);

  const createFolder = () => {
    const name = prompt('Enter folder name:');
    if (!name) return;

    const nextFolderId = crypto.randomUUID();
    setFolders((prev) => [...prev, { id: nextFolderId, name }]);
    setFolderOpenState((prev) => ({ ...prev, [nextFolderId]: true }));
    setActiveFolderId(nextFolderId);
    createFolderFile(nextFolderId, undefined, true);
  };

  const toggleFolder = (folderId: string) => {
    setActiveFolderId((current) => (current === folderId ? null : folderId));
    setFolderOpenState((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAccountOpen(false);
    router.push('/');
    router.refresh();
  };

  const toggleDrawer = () => {
    if (readingMode) return;
    setDrawerOpen((current) => !current);
  };

  const effectiveDrawer: WorkbenchDrawerConfig | null = (() => {
    if (drawer) return drawer;
    if (!isChatRoute) return null;

    return {
      title: 'Workspace',
      subtitle: 'Recent sessions, folders, and pinned research context',
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="lab-button-secondary w-full justify-center"
              onClick={() => {
                if (activeFolderId) createFolderFile(activeFolderId);
                router.push('/chat?new=1');
                window.dispatchEvent(new Event('newChat'));
              }}
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
            <button type="button" className="lab-button-secondary w-full justify-center" onClick={createFolder}>
              <FolderPlus className="h-4 w-4" />
              Folder
            </button>
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="lab-section-title !mb-0">Folders</p>
              <span className="text-[11px] text-[var(--lab-text-tertiary)]">{folders.length}</span>
            </div>
            <div className="space-y-1.5">
              {folders.length === 0 ? (
                <div className="workbench-empty-panel">No folders yet.</div>
              ) : (
                folders.map((folder) => (
                  <div key={folder.id} className="workbench-drawer-group">
                    <div className={cn('workbench-drawer-row', activeFolderId === folder.id && 'is-active')}>
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => toggleFolder(folder.id)}>
                        {folderOpenState[folder.id] ? <Folder className="h-4 w-4" /> : <FolderMinus className="h-4 w-4" />}
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <button type="button" className="workbench-inline-action" onClick={() => removeFolder(folder.id)} aria-label="Delete folder">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {folderOpenState[folder.id] ? (
                      <div className="ml-4 mt-1 space-y-1 border-l border-[var(--lab-border)] pl-3">
                        <button type="button" className="workbench-subtle-action" onClick={() => createFolderFile(folder.id, undefined, true)}>
                          <Plus className="h-3.5 w-3.5" />
                          New file
                        </button>
                        {(folderFiles[folder.id] ?? []).length === 0 ? (
                          <p className="text-xs text-[var(--lab-text-tertiary)]">Empty folder</p>
                        ) : (
                          (folderFiles[folder.id] ?? []).map((file) => (
                            <div key={file.id} className="workbench-drawer-row text-xs">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="truncate">{file.name}</span>
                              </div>
                              <button type="button" className="workbench-inline-action" onClick={() => removeFolderFile(folder.id, file.id)} aria-label="Remove file">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="lab-section-title !mb-0">History</p>
              <span className="text-[11px] text-[var(--lab-text-tertiary)]">{recentThreads.length}</span>
            </div>
            <div className="space-y-1.5">
              {recentThreads.length === 0 ? (
                <div className="workbench-empty-panel">No threads yet.</div>
              ) : (
                recentThreads.slice(0, 36).map((session) => {
                  const isActive = pathname === '/chat' && activeSessionId === session.id;
                  return (
                    <div key={session.id} className={cn('workbench-drawer-row', isActive && 'is-active')}>
                      <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => openThread(session.id)} title={session.title || 'Untitled thread'}>
                        {session.title || 'Untitled thread'}
                      </button>
                      <button
                        type="button"
                        className="workbench-inline-action"
                        onClick={() => void handleDeleteThread(session.id)}
                        aria-label="Delete thread"
                        disabled={deletingThreadId === session.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      ),
    };
  })();

  const baseCommandItems = useMemo<CommandHubItem[]>(() => {
    const items: CommandHubItem[] = [
      {
        id: 'toggle-drawer',
        label: effectiveDrawer ? (drawerOpen ? 'Hide workspace drawer' : 'Show workspace drawer') : 'No drawer available',
        kind: 'toggle',
        icon: drawerOpen ? PanelLeftClose : PanelLeftOpen,
        keywords: ['drawer', 'history', 'folders', 'setup'],
        run: () => {
          if (!effectiveDrawer) return;
          setDrawerOpen((current) => !current);
        },
      },
      {
        id: 'toggle-theme',
        label: mounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        kind: 'toggle',
        icon: mounted && resolvedTheme === 'dark' ? Sun : Moon,
        keywords: ['theme', 'appearance', 'dark', 'light'],
        run: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'docs',
        label: 'Open documentation',
        kind: 'navigation',
        icon: BookOpen,
        keywords: ['docs', 'documentation'],
        run: () => window.open('https://docs.openclaw.ai', '_blank', 'noopener,noreferrer'),
      },
    ];

    for (const item of PRIMARY_NAV) {
      items.push({
        id: `nav:${item.href}`,
        label: `Go to ${item.label}`,
        kind: 'navigation',
        icon: item.icon,
        keywords: [item.label.toLowerCase(), 'workspace', 'feature'],
        run: () => router.push(item.href),
      });
    }

    for (const item of SECONDARY_NAV) {
      items.push({
        id: `nav:${item.href}`,
        label: `Go to ${item.label}`,
        kind: 'navigation',
        icon: item.icon,
        keywords: [item.label.toLowerCase(), 'relics'],
        run: () => router.push(item.href),
      });
    }

    if (isChatRoute) {
      items.unshift({
        id: 'new-chat',
        label: 'Start new chat',
        kind: 'action',
        icon: Plus,
        keywords: ['chat', 'new', 'thread'],
        run: () => {
          router.push('/chat?new=1');
          window.dispatchEvent(new Event('newChat'));
        },
      });
    }

    return items;
  }, [drawerOpen, effectiveDrawer, isChatRoute, mounted, resolvedTheme, router, setTheme]);

  const mergedCommandItems = useMemo(() => [...baseCommandItems, ...commandItems], [baseCommandItems, commandItems]);

  const filteredCommandItems = useMemo(() => {
    const query = hubQuery.trim().toLowerCase();
    if (!query) return mergedCommandItems;
    return mergedCommandItems.filter((item) => {
      const haystack = [item.label, ...(item.keywords || [])].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [hubQuery, mergedCommandItems]);

  const executeCommand = (item: CommandHubItem) => {
    item.run();
    setHubOpen(false);
    setHubQuery('');
  };

  return (
    <div className="app-feature-shell flex min-h-screen w-full bg-[var(--lab-bg)] text-[var(--lab-text-primary)]">
      {!readingMode ? (
        <aside className="workbench-icon-rail">
          <div className="flex h-full flex-col items-center gap-3 py-4">
            <button
              type="button"
              className="workbench-rail-button is-primary"
              onClick={() => setHubOpen(true)}
              aria-label="Open command hub"
              title="Open command hub"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="workbench-rail-divider" />

            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={cn('workbench-rail-button', isActive && 'is-active')} title={item.label} aria-label={item.label}>
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}

            {navRail}

            <div className="workbench-rail-divider" />

            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={cn('workbench-rail-button', isActive && 'is-active')} title={item.label} aria-label={item.label}>
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}

            <div className="mt-auto flex flex-col items-center gap-3">
              {effectiveDrawer ? (
                <button
                  type="button"
                  className={cn('workbench-rail-button', drawerOpen && 'is-active')}
                  onClick={toggleDrawer}
                  title={drawerOpen ? 'Hide drawer' : 'Show drawer'}
                  aria-label={drawerOpen ? 'Hide drawer' : 'Show drawer'}
                >
                  {drawerOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </button>
              ) : null}

              <button
                type="button"
                className="workbench-rail-button"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                title={mounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={mounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <SidebarModelSettings collapsed />

              <div className="relative">
                <button
                  type="button"
                  className="workbench-rail-avatar"
                  onClick={() => setAccountOpen((current) => !current)}
                  title={userEmail || 'Account'}
                  aria-label="Account"
                >
                  {initials}
                </button>
                {accountOpen ? (
                  <div className="workbench-floating-panel bottom-12 left-full ml-3">
                    <div className="mb-2 text-xs text-[var(--lab-text-tertiary)]">Signed in</div>
                    <div className="mb-3 max-w-[180px] truncate text-xs text-[var(--lab-text-secondary)]">{userEmail || 'Anonymous session'}</div>
                    <button type="button" className="workbench-command-row w-full" onClick={() => { setAccountOpen(false); router.push('/chat'); }}>
                      <UserCircle2 className="h-4 w-4" />
                      Workspace
                    </button>
                    <button type="button" className="workbench-command-row mt-1 w-full" onClick={() => void handleSignOut()}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      {!readingMode && effectiveDrawer ? (
        <aside className={cn('workbench-drawer-shell', drawerOpen && 'is-open', drawerPinned && 'is-pinned')}>
          <div className="workbench-drawer-topbar">
            <div className="min-w-0">
              <p className="lab-section-title !mb-0">{effectiveDrawer.title}</p>
              {effectiveDrawer.subtitle ? <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">{effectiveDrawer.subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="workbench-icon-button"
                onClick={() => setDrawerPinned((current) => !current)}
                aria-label={drawerPinned ? 'Unpin drawer' : 'Pin drawer'}
                title={drawerPinned ? 'Unpin drawer' : 'Pin drawer'}
              >
                {drawerPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="workbench-icon-button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
                title="Close drawer"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="lab-scroll-region workbench-drawer-scroll">{effectiveDrawer.content}</div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {!readingMode ? (
          <header className="workbench-app-bar">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" className="workbench-icon-button md:hidden" onClick={() => setHubOpen(true)} aria-label="Open command hub">
                <Menu className="h-4 w-4" />
              </button>
              <div className="hidden md:flex">
                <button type="button" className="workbench-icon-button" onClick={() => setHubOpen(true)} aria-label="Open command hub" title="Command hub">
                  <Command className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">{header}</div>
            </div>
            <button type="button" className="workbench-command-pill" onClick={() => setHubOpen(true)}>
              <Search className="h-3.5 w-3.5" />
              <span>Command hub</span>
              <span className="workbench-kbd">⌘K</span>
            </button>
          </header>
        ) : null}

        <div className="min-h-0 flex-1">{children}</div>
      </div>

      {hubOpen ? (
        <div className="workbench-overlay" onClick={() => setHubOpen(false)}>
          <div className="workbench-command-hub" onClick={(event) => event.stopPropagation()}>
            <div className="workbench-command-input">
              <Search className="h-4 w-4 text-[var(--lab-text-tertiary)]" />
              <input
                autoFocus
                value={hubQuery}
                onChange={(event) => setHubQuery(event.target.value)}
                placeholder="Search features, tools, and actions"
              />
            </div>
            <div className="lab-scroll-region max-h-[420px] space-y-1">
              {filteredCommandItems.length === 0 ? (
                <div className="workbench-empty-panel">No matching actions.</div>
              ) : (
                filteredCommandItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" className="workbench-command-row w-full" onClick={() => executeCommand(item)}>
                      <div className="flex min-w-0 items-center gap-3">
                        {Icon ? <Icon className="h-4 w-4" /> : <Command className="h-4 w-4" />}
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="workbench-command-kind">{item.kind}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
