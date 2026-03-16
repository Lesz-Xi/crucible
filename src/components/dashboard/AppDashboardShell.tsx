"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FlaskConical,
  Folder,
  FolderMinus,
  FolderPlus,
  Gavel,
  GraduationCap,
  LogOut,
  MessageSquare,
  Moon,
  Orbit,
  Plus,
  Sun,
  Trash2,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import type { WorkbenchEvidenceRailConfig, WorkbenchFeature } from "@/types/workbench";
import { AppShellChromeProvider } from "./AppShellChromeContext";
import { SidebarModelSettings } from "./SidebarModelSettings";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  detail?: string;
};

type ChatSidebarSession = {
  id: string;
  title: string | null;
  updated_at: string | null;
  created_at?: string | null;
  domain_classified?: string | null;
};

type SidebarFolder = {
  id: string;
  name: string;
};

type SidebarFolderFile = {
  id: string;
  name: string;
  createdAt: string;
};

const PRIMARY_NAV: NavItem[] = [
  { id: "chat", label: "Chat", href: "/chat", icon: MessageSquare },
  { id: "hybrid", label: "Hybrid", href: "/hybrid", icon: Orbit },
];

const INSTRUMENTS_NAV: NavItem[] = [
  { id: "legal", label: "Legal", href: "/legal", icon: Gavel, detail: "Case analysis" },
  { id: "education", label: "Education", href: "/education", icon: GraduationCap, detail: "Intervention design" },
  { id: "lab", label: "Lab", href: "/lab", icon: FlaskConical, detail: "Experimental tools" },
];

const FOLDERS_STORAGE_KEY = "chat-folders-v1";
const FOLDER_FILES_STORAGE_KEY = "chat-folder-files-v1";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed-v1";
const RESEARCH_THREAD_IDS_STORAGE_KEY = "chat-research-thread-ids";

function canCreateSupabaseClient() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function SidebarToggleGlyph({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="sidebar-toggle-glyph"
    >
      {[16, 12, 9, 6, 4, 6, 9, 12, 16].map((dotY, index) => {
        const rowCount = index < 4 ? index + 1 : index === 4 ? 4 : 9 - index;
        const y = 4 + index * 3;
        return Array.from({ length: rowCount }).map((_, dotIndex) => {
          const x = isOpen ? 8 + dotIndex * 4.4 : 24 - dotIndex * 4.4;
          return <circle key={`${index}-${dotIndex}`} cx={x} cy={y} r={1.35} fill="currentColor" />;
        });
      })}
    </svg>
  );
}

function formatLedgerTimestamp(value: string | null | undefined) {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDomainTag(value?: string | null) {
  if (!value) return null;
  const normalized = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("_")
    .toUpperCase();
  return normalized || null;
}

export function AppDashboardShell({
  children,
  feature,
}: {
  children: ReactNode;
  feature: WorkbenchFeature;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = useMemo(() => (canCreateSupabaseClient() ? createClient() : null), []);

  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [evidenceRailOverride, setEvidenceRailOverride] = useState<WorkbenchEvidenceRailConfig | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [recentThreads, setRecentThreads] = useState<ChatSidebarSession[]>([]);
  const [researchThreadIds, setResearchThreadIds] = useState<string[]>([]);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [folderOpenState, setFolderOpenState] = useState<Record<string, boolean>>({});
  const [folderFiles, setFolderFiles] = useState<Record<string, SidebarFolderFile[]>>({});
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const accountRef = useRef<HTMLDivElement>(null);

  const activeSessionId = searchParams.get("sessionId");
  const isChatRoute = pathname?.startsWith("/chat") ?? false;

  useEffect(() => {
    setMounted(true);

    try {
      const savedFolders = window.localStorage.getItem(FOLDERS_STORAGE_KEY);
      const savedFolderFiles = window.localStorage.getItem(FOLDER_FILES_STORAGE_KEY);
      const savedSidebarCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      const savedResearchThreadIds = window.localStorage.getItem(RESEARCH_THREAD_IDS_STORAGE_KEY);

      if (savedFolders) {
        const parsedFolders = JSON.parse(savedFolders) as SidebarFolder[];
        if (Array.isArray(parsedFolders)) setFolders(parsedFolders);
      }

      if (savedFolderFiles) {
        const parsedFolderFiles = JSON.parse(savedFolderFiles) as Record<string, SidebarFolderFile[]>;
        if (parsedFolderFiles && typeof parsedFolderFiles === "object") setFolderFiles(parsedFolderFiles);
      }

      if (savedSidebarCollapsed === "true") setSidebarCollapsed(true);

      if (savedResearchThreadIds) {
        const parsedResearch = JSON.parse(savedResearchThreadIds) as string[];
        if (Array.isArray(parsedResearch)) setResearchThreadIds(parsedResearch);
      }
    } catch {
      setFolders([]);
      setFolderFiles({});
      setResearchThreadIds([]);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      window.localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
      window.localStorage.setItem(FOLDER_FILES_STORAGE_KEY, JSON.stringify(folderFiles));
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, JSON.stringify(sidebarCollapsed));
      window.localStorage.setItem(RESEARCH_THREAD_IDS_STORAGE_KEY, JSON.stringify(researchThreadIds));
    } catch {
      // Ignore storage write failures.
    }
  }, [folderFiles, folders, mounted, researchThreadIds, sidebarCollapsed]);

  useEffect(() => {
    let cancelled = false;

    if (!supabase) {
      setUserEmail(null);
      setAuthChecked(true);
      return;
    }

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        setUserEmail(data.user?.email ?? null);
        setAuthChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setUserEmail(null);
        setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!authChecked || !userEmail) {
      if (authChecked && !userEmail) setRecentThreads([]);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        const response = await fetch("/api/causal-chat/history");
        if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
        const payload = (await response.json()) as { history?: ChatSidebarSession[] };
        if (cancelled) return;
        setRecentThreads(Array.isArray(payload.history) ? payload.history : []);
      } catch {
        if (!cancelled) {
          setRecentThreads((current) => current);
        }
      }
    };

    void loadHistory();

    const handleFocus = () => void loadHistory();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void loadHistory();
    };
    const handleHistoryImported = () => void loadHistory();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("historyImported", handleHistoryImported);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("historyImported", handleHistoryImported);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [authChecked, userEmail]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountRef.current?.contains(target)) return;
      setAccountOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setMobileSidebarOpen(false);
  }, [pathname, searchParams]);

  const initials = useMemo(() => {
    if (!userEmail) return "CO";
    const local = userEmail.split("@")[0] || "";
    return local.slice(0, 2).toUpperCase() || "CO";
  }, [userEmail]);

  const ledgerEntries = useMemo(
    () =>
      recentThreads.map((conversation) => ({
        id: conversation.id,
        title: conversation.title?.trim() || "Untitled session",
        timestamp: formatLedgerTimestamp(conversation.updated_at ?? conversation.created_at),
        domainTag: formatDomainTag(conversation.domain_classified),
        active: activeSessionId === conversation.id,
        research: researchThreadIds.includes(conversation.id),
      })),
    [activeSessionId, recentThreads, researchThreadIds]
  );

  const handleCreateConversation = () => {
    setAccountOpen(false);
    router.push("/chat?new=1");
    window.dispatchEvent(new Event("newChat"));
    setMobileSidebarOpen(false);
  };

  const handleCreateFolder = () => {
    setAccountOpen(false);
    const name = window.prompt("Enter folder name:");
    if (!name?.trim()) return;

    const nextFolderId = crypto.randomUUID();
    const nextName = name.trim();
    setFolders((current) => [...current, { id: nextFolderId, name: nextName }]);
    setFolderOpenState((current) => ({ ...current, [nextFolderId]: true }));
    setActiveFolderId(nextFolderId);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((current) => current.filter((folder) => folder.id !== folderId));
    setFolderFiles((current) => {
      const next = { ...current };
      delete next[folderId];
      return next;
    });
    setFolderOpenState((current) => {
      const next = { ...current };
      delete next[folderId];
      return next;
    });
    setActiveFolderId((current) => (current === folderId ? null : current));
  };

  const toggleFolder = (folderId: string) => {
    setFolderOpenState((current) => ({ ...current, [folderId]: !current[folderId] }));
    setActiveFolderId((current) => (current === folderId ? null : folderId));
  };

  const createFolderFile = (folderId: string, defaultName?: string, startNewChat = false) => {
    const proposed = defaultName ?? `Untitled file ${(folderFiles[folderId]?.length ?? 0) + 1}`;
    const name = window.prompt("Enter file name:", proposed);
    if (!name?.trim()) return;

    const nextFile: SidebarFolderFile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    setFolderFiles((current) => ({
      ...current,
      [folderId]: [...(current[folderId] ?? []), nextFile],
    }));
    setFolderOpenState((current) => ({ ...current, [folderId]: true }));
    setActiveFolderId(folderId);

    if (startNewChat) {
      handleCreateConversation();
    }
  };

  const removeFolderFile = (folderId: string, fileId: string) => {
    setFolderFiles((current) => ({
      ...current,
      [folderId]: (current[folderId] ?? []).filter((file) => file.id !== fileId),
    }));
  };

  const openConversation = (sessionId: string) => {
    setAccountOpen(false);
    const currentSessionId = searchParams.get("sessionId");

    if (isChatRoute && currentSessionId === sessionId) {
      window.dispatchEvent(new CustomEvent("loadSession", { detail: { sessionId } }));
    } else {
      router.push(`/chat?sessionId=${sessionId}`);
    }

    setMobileSidebarOpen(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (deletingThreadId === conversationId) return;

    const confirmed = window.confirm("Delete this session from the ledger?");
    if (!confirmed) return;

    setDeletingThreadId(conversationId);
    const previousThreads = recentThreads;
    const previousResearch = researchThreadIds;

    setRecentThreads((current) => current.filter((session) => session.id !== conversationId));
    setResearchThreadIds((current) => current.filter((id) => id !== conversationId));

    try {
      const response = await fetch(`/api/causal-chat/sessions/${conversationId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete thread");

      if (isChatRoute && searchParams.get("sessionId") === conversationId) {
        handleCreateConversation();
      }
    } catch {
      setRecentThreads(previousThreads);
      setResearchThreadIds(previousResearch);
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setAccountOpen(false);
      router.push("/");
      router.refresh();
      return;
    }
    await supabase.auth.signOut();
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  };

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-controls">
          <button
            type="button"
            className="surface-chrome-btn surface-chrome-btn-toggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            <SidebarToggleGlyph isOpen={!sidebarCollapsed} />
          </button>
        </div>
      </div>

      <div className="sidebar-body">
        <div className="sidebar-main">
          <nav className="sidebar-nav">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link key={item.id} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                  <span className="nav-item-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="nav-item-copy">
                    <span className="nav-label">{item.label}</span>
                  </span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-actions">
            <button type="button" className="action-btn" onClick={handleCreateConversation}>
              <Plus className="h-5 w-5" />
              <span className="action-label">New thread</span>
            </button>
            <button type="button" className="action-btn" onClick={handleCreateFolder}>
              <FolderPlus className="h-5 w-5" />
              <span className="action-label">New folder</span>
            </button>
          </div>

          <div className="sidebar-section-heading">
            <span className="sidebar-section-label">Systems</span>
            <span className="sidebar-section-count">{INSTRUMENTS_NAV.length}</span>
          </div>

          <button
            type="button"
            className="nav-item nav-item-system"
            onClick={() => setFoldersExpanded((current) => !current)}
          >
            <span className="nav-item-icon">
              <FileText className="h-5 w-5" />
            </span>
            <span className="nav-item-copy">
              <span className="nav-label">Instruments</span>
            </span>
            <span className="nav-badge">{foldersExpanded ? "Open" : INSTRUMENTS_NAV.length}</span>
            {foldersExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {foldersExpanded ? (
            <div className="sidebar-subnav">
              {INSTRUMENTS_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link key={item.id} href={item.href} className={`nav-item nav-item-sub ${isActive ? "active" : ""}`}>
                    <span className="nav-item-icon">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="nav-item-copy">
                      <span className="nav-label">{item.label}</span>
                      {item.detail ? <span className="nav-detail">{item.detail}</span> : null}
                    </span>
                  </Link>
                );
              })}

              {folders.length > 0 ? (
                <div className="sidebar-section-heading">
                  <span className="sidebar-section-label">Notebooks</span>
                  <span className="sidebar-section-count">{folders.length}</span>
                </div>
              ) : null}

              {folders.map((folder) => {
                const active = activeFolderId === folder.id;
                return (
                  <div key={folder.id}>
                    <button
                      type="button"
                      className={`nav-item nav-item-sub ${active ? "active" : ""}`}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <span className="nav-item-icon">
                        <Folder className="h-4.5 w-4.5" />
                      </span>
                      <span className="nav-item-copy">
                        <span className="nav-label">{folder.name}</span>
                      </span>
                      <button
                        type="button"
                        className="folder-action"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        aria-label={`Delete folder ${folder.name}`}
                        title="Delete folder"
                      >
                        <FolderMinus className="h-4 w-4" />
                      </button>
                    </button>
                    {folderOpenState[folder.id] ? (
                      <div className="folder-files">
                        <button
                          type="button"
                          className="history-item"
                          onClick={() => createFolderFile(folder.id, undefined, true)}
                        >
                          + New file
                        </button>
                        {(folderFiles[folder.id] ?? []).map((file) => (
                          <div key={file.id} className="folder-file-row">
                            <span className="history-item">{file.name}</span>
                            <button
                              type="button"
                              className="folder-action"
                              onClick={() => removeFolderFile(folder.id, file.id)}
                              aria-label="Remove file"
                            >
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
          ) : null}
        </div>

        <div className="history-section">
          <div className="sidebar-section-heading history-section-heading">
            <span className="sidebar-section-label">Session ledger</span>
            <span className="sidebar-section-count">{ledgerEntries.length}</span>
          </div>

          <div className="history-ledger-scroll">
            {ledgerEntries.length === 0 ? (
              <div className="empty-ledger">No notebook sessions recorded.</div>
            ) : (
              <div className="history-list history-ledger">
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="history-row thread-row thread-ledger-row">
                    <button
                      type="button"
                      className={`history-item thread-item thread-ledger-item ${entry.active ? "active" : ""}`}
                      onClick={() => openConversation(entry.id)}
                      title={entry.title}
                    >
                      <span className="thread-ledger-dot" />
                      <span className="thread-ledger-copy">
                        <span className="thread-ledger-title">{entry.title}</span>
                        <span className="thread-ledger-meta">
                          {entry.domainTag ? <span className="thread-ledger-chip">{entry.domainTag}</span> : null}
                          <span className="thread-ledger-time">{entry.timestamp}</span>
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="folder-action thread-action"
                      onClick={() => void handleDeleteConversation(entry.id)}
                      title="Delete session"
                      aria-label={`Delete ${entry.title}`}
                      disabled={deletingThreadId === entry.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div ref={accountRef} className="user-row">
          {accountOpen ? (
            <div className="account-popover">
              <div className="account-section">
                <button
                  type="button"
                  className="account-action"
                  onClick={() => {
                    setTheme(resolvedTheme === "light" ? "dark" : "light");
                    setAccountOpen(false);
                  }}
                >
                  {resolvedTheme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span className="account-action-label">{resolvedTheme === "light" ? "Dark" : "Light"}</span>
                </button>

                <Link href="/docs" className="account-action" onClick={() => setAccountOpen(false)}>
                  <BookOpen className="h-4 w-4" />
                  <span className="account-action-label">Documentation</span>
                </Link>

                <div className="account-menu-settings">
                  <SidebarModelSettings collapsed={false} variant="account" />
                </div>

                <div className="account-section-divider" />

                <button type="button" className="account-action">
                  <UserCircle2 className="h-4 w-4" />
                  <span className="account-action-label">Workspace</span>
                </button>

                {userEmail ? (
                  <button type="button" className="account-action" onClick={() => void handleSignOut()}>
                    <LogOut className="h-4 w-4" />
                    <span className="account-action-label">Sign out</span>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="user-panel"
            onClick={() => setAccountOpen((current) => !current)}
            aria-expanded={accountOpen}
            aria-haspopup="menu"
          >
            <span className="user-avatar">{initials}</span>
            <span className="account-copy">
              <span className="user-email">{userEmail ?? "Anonymous session"}</span>
              <span className="user-role">{userEmail ? "Authenticated operator" : "Guest workspace"}</span>
            </span>
            <ChevronDown className="account-chevron h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <AppShellChromeProvider value={{ evidenceRailOverride, setEvidenceRailOverride }}>
      <div className={`canonical-workbench-shell feature-${feature} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {!sidebarCollapsed ? <div className="desktop-sidebar">{sidebar}</div> : null}

        <button
          type="button"
          className="mobile-shell-trigger"
          onClick={() => {
            if (mounted && window.matchMedia("(max-width: 1023px)").matches) {
              setMobileSidebarOpen(true);
            } else {
              setSidebarCollapsed((current) => !current);
            }
          }}
          aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          <SidebarToggleGlyph isOpen={!sidebarCollapsed} />
        </button>

        {mobileSidebarOpen ? (
          <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}>
            <div className="mobile-sidebar-panel" onClick={(event) => event.stopPropagation()}>
              {sidebar}
            </div>
          </div>
        ) : null}

        <div className="main-content-shell" data-main-surface="gridded">
          {children}
        </div>
      </div>
    </AppShellChromeProvider>
  );
}
