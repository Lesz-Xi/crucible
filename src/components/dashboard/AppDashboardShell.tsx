'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  FlaskConical,
  Folder,
  FolderMinus,
  FolderPlus,
  Gavel,
  GraduationCap,
  LogOut,
  MessageSquare,
  Moon,
  PanelRightOpen,
  Plus,
  Search,
  ScrollText,
  Sun,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { SidebarModelSettings } from './SidebarModelSettings';
import { WorkbenchEvidenceRail } from '@/components/workbench/WorkbenchEvidenceRail';
import { AppShellChromeProvider } from './AppShellChromeContext';
import type { WorkbenchEvidenceRailConfig, WorkbenchFeature } from '@/types/workbench';

interface AppDashboardShellProps {
  children: ReactNode;
  feature: WorkbenchFeature;
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
] as const;

const RELICS_NAV = [
  { href: '/legal', label: 'Legal', icon: Gavel },
  { href: '/education', label: 'Education', icon: GraduationCap },
  { href: '/lab', label: 'Lab', icon: FlaskConical },
] as const;

export function AppDashboardShell({ children, feature }: AppDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [relicsOpen, setRelicsOpen] = useState(true);
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [evidenceRailOverride, setEvidenceRailOverride] = useState<WorkbenchEvidenceRailConfig | null>(null);

  const activeSessionId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('sessionId')
    : null;

  useEffect(() => {
    setMounted(true);
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
    try {
      window.localStorage.setItem('chat-folders-v1', JSON.stringify(folders));
      window.localStorage.setItem('chat-folder-files-v1', JSON.stringify(folderFiles));
    } catch {
      // Ignore storage failures.
    }
  }, [folderFiles, folders]);

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
    if (!authChecked || !userEmail) {
      if (!userEmail) setRecentThreads([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await fetch('/api/causal-chat/history');
        if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
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
  }, [authChecked, userEmail]);

  useEffect(() => {
    window.localStorage.setItem('chat-research-thread-ids', JSON.stringify(researchThreadIds));
  }, [researchThreadIds]);

  const initials = useMemo(() => {
    if (!userEmail) return 'CO';
    const local = userEmail.split('@')[0] || '';
    return local.slice(0, 2).toUpperCase() || 'CO';
  }, [userEmail]);

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recentThreads;
    return recentThreads.filter((session) => (session.title || 'Untitled thread').toLowerCase().includes(query));
  }, [recentThreads, searchQuery]);

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
      setMobileSidebarOpen(false);
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
    } else {
      router.push(`/chat?sessionId=${sessionId}`);
    }
    setMobileSidebarOpen(false);
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
      if (!response.ok) throw new Error('Failed to delete thread');
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

  const isRelicActive = RELICS_NAV.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
  const defaultSurfaceRail: WorkbenchEvidenceRailConfig = {
    subtitle: feature === 'education' ? 'Learning posture and provenance' : 'Live posture and provenance',
    live: false,
    causalDensity: {
      activeLevel: null,
      status: 'Awaiting scored output',
    },
    alignmentPosture: {
      tone: 'neutral',
      text: 'No auditable posture has been emitted for this surface yet.',
    },
    modelProvenance: {
      title: 'unavailable',
      text: 'No verified model provenance was emitted for this run.',
    },
    activeDomain: {
      label: feature === 'education' ? 'education' : feature,
    },
    scientificEvidence: [],
  };

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="wordmark-icon">
          <FlaskConical className="h-4 w-4" />
        </div>
        <span className="wordmark-text">Bio-Lab Notebook</span>
        <div className="sidebar-header-actions">
          <button type="button" className="icon-btn" title="Search" aria-label="Search" onClick={() => setSearchOpen((current) => !current)}>
            <Search className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="icon-btn" title="Toggle layout" aria-label="Toggle layout" onClick={() => setRelicsOpen((current) => !current)}>
            <PanelRightOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={cn('nav-item', isActive && 'active')} onClick={() => setMobileSidebarOpen(false)}>
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button type="button" className={cn('nav-item', isRelicActive && 'active')} onClick={() => setRelicsOpen((current) => !current)}>
          <ScrollText className="h-3.5 w-3.5" />
          <span>Relics</span>
          <span className="chevron">{relicsOpen ? '▾' : '▸'}</span>
        </button>

        {relicsOpen ? (
          <div className="mt-1 space-y-1 pl-4">
            {RELICS_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={cn('nav-item', isActive && 'active')} onClick={() => setMobileSidebarOpen(false)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        {searchOpen ? (
          <div className="px-2 pt-2">
            <input
              className="sidebar-search"
              placeholder="Search history"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        ) : null}
      </nav>

      <div className="sidebar-actions">
        <button
          type="button"
          className="action-btn"
          onClick={() => {
            router.push('/chat?new=1');
            window.dispatchEvent(new Event('newChat'));
            setMobileSidebarOpen(false);
          }}
        >
          <Plus className="h-3 w-3" />
          New chat
        </button>
        <button type="button" className="action-btn" onClick={createFolder}>
          <FolderPlus className="h-3 w-3" />
          New folder
        </button>
      </div>

      <div className="sidebar-section-label">Folders</div>
      <div className="history-list is-folders">
        {folders.length === 0 ? (
          <div className="history-item muted">No folders yet.</div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="folder-block">
              <div className={cn('folder-row', activeFolderId === folder.id && 'active')}>
                <button type="button" className="folder-label" onClick={() => toggleFolder(folder.id)}>
                  {folderOpenState[folder.id] ? <Folder className="h-3.5 w-3.5" /> : <FolderMinus className="h-3.5 w-3.5" />}
                  <span>{folder.name}</span>
                </button>
                <button type="button" className="folder-action" onClick={() => removeFolder(folder.id)} aria-label="Delete folder">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {folderOpenState[folder.id] ? (
                <div className="folder-files">
                  <button type="button" className="history-item" onClick={() => createFolderFile(folder.id, undefined, true)}>
                    + New file
                  </button>
                  {(folderFiles[folder.id] ?? []).map((file) => (
                    <div key={file.id} className="folder-file-row">
                      <span className="history-item">{file.name}</span>
                      <button type="button" className="folder-action" onClick={() => removeFolderFile(folder.id, file.id)} aria-label="Remove file">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="sidebar-section-label history-label">History</div>
      <div className="history-list">
        {filteredThreads.length === 0 ? (
          <div className="history-item muted">No threads yet.</div>
        ) : (
          filteredThreads.slice(0, 36).map((session) => {
            const isActive = pathname === '/chat' && activeSessionId === session.id;
            return (
              <div key={session.id} className={cn('history-row', isActive && 'active')}>
                <button type="button" className="history-item flex-1 text-left" onClick={() => openThread(session.id)} title={session.title || 'Untitled thread'}>
                  {session.title || 'Untitled thread'}
                </button>
                <button
                  type="button"
                  className="folder-action"
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

      <div className="sidebar-footer">
        <button
          type="button"
          className="footer-item"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{mounted && resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <a href="https://docs.openclaw.ai" target="_blank" rel="noreferrer" className="footer-item">
          <BookOpen className="h-3.5 w-3.5" />
          Documentation
        </a>
        <div className="footer-item footer-settings">
          <SidebarModelSettings collapsed={false} />
        </div>
      </div>

      <div className="user-row" onClick={() => setAccountOpen((current) => !current)}>
        <div className="user-avatar">{initials}</div>
        <span className="user-email">{userEmail || 'Anonymous session'}</span>
        <span className="chevron">▾</span>
        {accountOpen ? (
          <div className="account-popover">
            <button type="button" className="account-action" onClick={() => { setAccountOpen(false); router.push('/chat'); setMobileSidebarOpen(false); }}>
              <UserCircle2 className="h-3.5 w-3.5" />
              Workspace
            </button>
            <button type="button" className="account-action" onClick={() => void handleSignOut()}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );

  return (
    <AppShellChromeProvider value={{ evidenceRailOverride, setEvidenceRailOverride }}>
      <div className={cn('app-feature-shell', `feature-${feature}`)}>
      <button type="button" className="mobile-shell-trigger" onClick={() => setMobileSidebarOpen(true)} aria-label="Open navigation">
        <PanelRightOpen className="h-4 w-4" />
      </button>

      <div className="desktop-sidebar">{sidebar}</div>

      {mobileSidebarOpen ? (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}>
          <div className="mobile-sidebar-panel" onClick={(event) => event.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="app-shell-main">
        {feature === 'education' || feature === 'lab' ? (
          <div className="shell app-shell">
            <main className="main">
              <div className="main-content-shell">{children}</div>
            </main>
            <WorkbenchEvidenceRail config={evidenceRailOverride || defaultSurfaceRail} />
          </div>
        ) : (
          children
        )}
      </div>
      </div>
    </AppShellChromeProvider>
  );
}
