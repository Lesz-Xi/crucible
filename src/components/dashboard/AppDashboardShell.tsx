'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Orbit,
  ChevronDown,
  ChevronRight,
  FileText,
  FlaskConical,
  Folder,
  FolderMinus,
  FolderPlus,
  Minimize2,
  Gavel,
  GraduationCap,
  type LucideIcon,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Sun,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAppShellChrome } from './AppShellChromeContext';
import { SidebarModelSettings } from './SidebarModelSettings';
import type { WorkbenchFeature } from '@/types/workbench';

interface AppDashboardShellProps {
  children: ReactNode;
  feature: WorkbenchFeature;
  focusModeActive?: boolean;
}

interface ChatSidebarSession {
  id: string;
  title: string;
  updated_at: string;
  domain_classified?: string | null;
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

interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  code?: string;
  badge?: string;
  detail?: string;
}

function SidebarToggleGlyph({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <g transform={isOpen ? 'translate(24 0) scale(-1 1)' : undefined}>
        <circle cx="6.5" cy="3" r="1.35" />
        <circle cx="6.5" cy="6.5" r="1.35" />
        <circle cx="10" cy="6.5" r="1.35" />
        <circle cx="6.5" cy="10" r="1.35" />
        <circle cx="10" cy="10" r="1.35" />
        <circle cx="13.5" cy="10" r="1.35" />
        <circle cx="6.5" cy="13.5" r="1.35" />
        <circle cx="10" cy="13.5" r="1.35" />
        <circle cx="13.5" cy="13.5" r="1.35" />
        <circle cx="17" cy="13.5" r="1.35" />
        <circle cx="6.5" cy="17" r="1.35" />
        <circle cx="10" cy="17" r="1.35" />
        <circle cx="13.5" cy="17" r="1.35" />
        <circle cx="6.5" cy="20.5" r="1.35" />
        <circle cx="10" cy="20.5" r="1.35" />
        <circle cx="6.5" cy="22" r="1.35" />
      </g>
    </svg>
  );
}

const PRIMARY_NAV: SidebarNavItem[] = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/hybrid', label: 'Hybrid', icon: Orbit },
];

const INSTRUMENTS_NAV: SidebarNavItem[] = [
  { href: '/legal', label: 'Legal', icon: Gavel, code: 'S01', detail: 'Case analysis' },
  { href: '/education', label: 'Education', icon: GraduationCap, code: 'S02', detail: 'Intervention design' },
  { href: '/lab', label: 'Lab', icon: FlaskConical, code: 'S03', detail: 'Experimental tools' },
];

function formatLedgerTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const isSameDay = now.toDateString() === date.toDateString();
  if (isSameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  if (now.getFullYear() === date.getFullYear()) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatDomainTag(domain?: string | null): string {
  const normalized = domain?.trim().toLowerCase();
  if (!normalized) return 'General';
  if (normalized.includes('legal') || normalized.includes('policy')) return 'Legal';
  if (normalized.includes('market') || normalized.includes('economic') || normalized.includes('finance')) return 'Markets';
  if (normalized.includes('bio') || normalized.includes('health') || normalized.includes('medical')) return 'Bio';
  if (normalized.includes('education') || normalized.includes('learning')) return 'Learning';
  if (normalized.includes('physic') || normalized.includes('chem')) return 'Science';
  return domain?.trim() || 'General';
}

export function AppDashboardShell({ children, feature, focusModeActive = false }: AppDashboardShellProps) {
  const shellChrome = useAppShellChrome();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeSessionId = searchParams.get('sessionId');
  const isInstrumentActive = INSTRUMENTS_NAV.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
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
      const savedSidebarCollapsed = window.localStorage.getItem('sidebar-collapsed-v1');
      if (savedSidebarCollapsed === 'true') setSidebarCollapsed(true);
    } catch {
      setFolders([]);
      setFolderFiles({});
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('chat-folders-v1', JSON.stringify(folders));
      window.localStorage.setItem('chat-folder-files-v1', JSON.stringify(folderFiles));
      window.localStorage.setItem('sidebar-collapsed-v1', JSON.stringify(sidebarCollapsed));
    } catch {
      // Ignore storage failures.
    }
  }, [folderFiles, folders, sidebarCollapsed]);

  useEffect(() => {
    if (focusModeActive) setMobileSidebarOpen(false);
  }, [focusModeActive]);

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

  useEffect(() => {
    if (isInstrumentActive) setInstrumentsOpen(true);
  }, [isInstrumentActive]);

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

  const operatorEmail = userEmail || 'Anonymous session';
  const visibleThreads = recentThreads;
  const shouldShowInstrumentChildren = instrumentsOpen && !sidebarCollapsed;

  const handleMainSurfaceChromeToggle = () => {
    const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (focusModeActive && shellChrome) {
      shellChrome.setFocusMode(false);
      setSidebarCollapsed(false);
      if (isNarrowViewport) {
        setMobileSidebarOpen(true);
      }
      return;
    }

    if (isNarrowViewport) {
      setMobileSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  };

  const handleInstrumentToggle = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setInstrumentsOpen(true);
      return;
    }

    setInstrumentsOpen((current) => !current);
  };

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-controls" role="group" aria-label="Workbench navigation controls">
          <button
            type="button"
            className="surface-chrome-btn surface-chrome-btn-toggle"
            title={focusModeActive ? 'Exit focus mode and open sidebar' : sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            aria-label={focusModeActive ? 'Exit focus mode and open sidebar' : sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            onClick={handleMainSurfaceChromeToggle}
          >
            {focusModeActive ? <Minimize2 className="h-4 w-4" /> : <SidebarToggleGlyph isOpen={!focusModeActive && !sidebarCollapsed} />}
          </button>
        </div>
      </div>
      <div className="sidebar-body">
        <div className="sidebar-main">
          <nav className="sidebar-nav" aria-label="Workbench modes">
          <div className="sidebar-stack">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('nav-item', isActive && 'active')}
                  onClick={() => setMobileSidebarOpen(false)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="nav-copy">
                    {item.code ? <span className="nav-kicker">{item.code}</span> : null}
                    <span className="nav-label">{item.label}</span>
                  </span>
                  {item.detail || item.badge ? (
                    <span className="nav-meta">
                      {item.detail ? <span className="nav-detail">{item.detail}</span> : null}
                      {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="sidebar-actions" role="group" aria-label="Operator commands">
            <button
              type="button"
              className="action-btn"
              onClick={() => {
                router.push('/chat?new=1');
                window.dispatchEvent(new Event('newChat'));
                setMobileSidebarOpen(false);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="action-copy">
                <span className="action-label">New thread</span>
              </span>
            </button>
            <button type="button" className="action-btn" onClick={createFolder}>
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="action-copy">
                <span className="action-label">New folder</span>
              </span>
            </button>
          </div>

          <div className="sidebar-section-label">
            <span>Systems</span>
            <span className="sidebar-section-count">{INSTRUMENTS_NAV.length}</span>
          </div>
          <button
            type="button"
            className={cn('nav-item nav-item-toggle nav-item-system', isInstrumentActive && 'active', instrumentsOpen && 'open')}
            onClick={handleInstrumentToggle}
            title={sidebarCollapsed ? 'Open sidebar and show instruments' : 'Toggle instruments'}
            aria-label={sidebarCollapsed ? 'Open sidebar and show instruments' : 'Toggle instruments'}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="nav-copy">
              <span className="nav-label">Instruments</span>
            </span>
            <span className="nav-meta">
              <span className="nav-meta-trailing">
                <span className="nav-badge">{shouldShowInstrumentChildren ? 'Open' : `${INSTRUMENTS_NAV.length}`}</span>
                {shouldShowInstrumentChildren ? <ChevronDown className="chevron h-3 w-3" /> : <ChevronRight className="chevron h-3 w-3" />}
              </span>
            </span>
          </button>

          {shouldShowInstrumentChildren ? (
            <div className="sidebar-subnav">
              {INSTRUMENTS_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('nav-item nav-item-sub nav-item-system', isActive && 'active')}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="nav-copy">
                      <span className="nav-label">{item.label}</span>
                    </span>
                    <span className="nav-meta">
                      <span className="nav-detail">{item.detail}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
          </nav>

          {folders.length > 0 ? (
            <section className="sidebar-section">
              <div className="sidebar-section-label">
                <span>Notebooks</span>
                <span className="sidebar-section-count">{folders.length}</span>
              </div>
              <div className="history-list is-folders">
                {folders.map((folder) => {
                  const fileCount = folderFiles[folder.id]?.length ?? 0;
                  return (
                    <div key={folder.id} className="folder-block">
                      <div className={cn('folder-row', activeFolderId === folder.id && 'active')}>
                        <button type="button" className="folder-label" onClick={() => toggleFolder(folder.id)}>
                          {folderOpenState[folder.id] ? <Folder className="h-3.5 w-3.5" /> : <FolderMinus className="h-3.5 w-3.5" />}
                          <span className="folder-copy">
                            <span className="folder-title">{folder.name}</span>
                            <span className="folder-meta">{fileCount} file{fileCount === 1 ? '' : 's'}</span>
                          </span>
                        </button>
                        <button type="button" className="folder-action" onClick={() => removeFolder(folder.id)} aria-label="Delete folder">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {folderOpenState[folder.id] ? (
                        <div className="folder-files">
                          <button type="button" className="history-item history-item-inline" onClick={() => createFolderFile(folder.id, undefined, true)}>
                            <span className="history-inline-label">+ New file</span>
                            <span className="history-inline-meta">Open thread</span>
                          </button>
                          {(folderFiles[folder.id] ?? []).map((file) => (
                            <div key={file.id} className="folder-file-row">
                              <span className="history-item history-item-inline">
                                <span className="history-inline-label">{file.name}</span>
                                <span className="history-inline-meta">{formatLedgerTimestamp(file.createdAt)}</span>
                              </span>
                              <button type="button" className="folder-action" onClick={() => removeFolderFile(folder.id, file.id)} aria-label="Remove file">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <section className="sidebar-section history-section">
          <div className="sidebar-section-label history-label">
            <span>Session ledger</span>
            <span className="sidebar-section-count">{visibleThreads.length}</span>
          </div>
          <div className="history-ledger-scroll">
            <div className="history-list history-ledger">
              {visibleThreads.length === 0 ? (
                <div className="history-item muted">No notebook sessions recorded.</div>
              ) : (
                visibleThreads.map((session) => {
                  const isActive = pathname === '/chat' && activeSessionId === session.id;
                  const isResearch = researchThreadIds.includes(session.id);
                  const sessionTitle = session.title || 'Untitled thread';
                  return (
                    <div key={session.id} className={cn('history-row', 'thread-row', isActive && 'active')}>
                      <button
                        type="button"
                        className="history-item thread-item flex-1 text-left"
                        onClick={() => openThread(session.id)}
                        aria-label={`Open session: ${sessionTitle}`}
                      >
                        <span className="thread-ledger-dot" aria-hidden="true" />
                        <span className="thread-copy">
                          <span className="thread-title">{sessionTitle}</span>
                          <span className="thread-meta">
                            <span className="thread-chip">{formatDomainTag(session.domain_classified)}</span>
                            {isResearch ? <span className="thread-chip accent">Research</span> : null}
                            <span className="thread-time">{formatLedgerTimestamp(session.updated_at)}</span>
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="folder-action thread-action"
                        onClick={() => void handleDeleteThread(session.id)}
                        aria-label={`Delete session: ${sessionTitle}`}
                        disabled={deletingThreadId === session.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <div
        className="user-row"
        onClick={() => {
          if (sidebarCollapsed) {
            setSidebarCollapsed(false);
            setAccountOpen(true);
            return;
          }

          setAccountOpen((current) => !current);
        }}
        title={sidebarCollapsed ? 'Open account panel' : operatorEmail}
        aria-label={sidebarCollapsed ? 'Open account panel' : operatorEmail}
      >
        <div className="user-avatar">{initials}</div>
        <span className="account-copy">
          <span className="user-email">{operatorEmail}</span>
          <span className="user-role">{userEmail ? 'authenticated operator' : 'guest workspace'}</span>
        </span>
        <ChevronDown className="account-chevron h-3.5 w-3.5" />
        {accountOpen ? (
          <div className="account-popover" onClick={(event) => event.stopPropagation()}>
            <div className="account-section">
              <button
                type="button"
                className="account-action"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                title={mounted ? `Theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'}` : 'Theme: Light'}
                aria-label={mounted ? `Theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'}` : 'Theme: Light'}
              >
                {mounted && resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span className="account-action-label">{mounted ? (resolvedTheme === 'dark' ? 'Dark' : 'Light') : 'Light'}</span>
              </button>
              <a
                href="https://docs.openclaw.ai"
                target="_blank"
                rel="noreferrer"
                className="account-action"
                onClick={() => setAccountOpen(false)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="account-action-label">Documentation</span>
              </a>
              <div className="account-menu-settings">
                <SidebarModelSettings collapsed={false} variant="account" />
              </div>
            </div>
            <div className="account-section-divider" aria-hidden="true" />
            <div className="account-section">
            <button type="button" className="account-action" onClick={() => { setAccountOpen(false); router.push('/chat'); setMobileSidebarOpen(false); }}>
              <UserCircle2 className="h-3.5 w-3.5" />
              Workspace
            </button>
            <button type="button" className="account-action" onClick={() => void handleSignOut()}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );

  return (
    <div className={cn('app-feature-shell canonical-workbench-shell', `feature-${feature}`, sidebarCollapsed && 'sidebar-collapsed', focusModeActive && 'focus-mode')}>
      <button
        type="button"
        className={cn('mobile-shell-trigger', (sidebarCollapsed || focusModeActive) && 'is-visible', focusModeActive && 'is-focus-exit')}
        onClick={handleMainSurfaceChromeToggle}
        aria-label={focusModeActive ? 'Exit focus mode and open navigation' : 'Open navigation'}
        title={focusModeActive ? 'Exit focus mode and open navigation' : 'Open navigation'}
      >
        {focusModeActive ? <Minimize2 className="h-4 w-4" /> : <SidebarToggleGlyph isOpen={!focusModeActive && !sidebarCollapsed} />}
      </button>

      {!focusModeActive && !sidebarCollapsed ? <div className="desktop-sidebar">{sidebar}</div> : null}

      {!focusModeActive && mobileSidebarOpen ? (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}>
          <div className="mobile-sidebar-panel" onClick={(event) => event.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="app-shell-main">
        {children}
      </div>
    </div>
  );
}
