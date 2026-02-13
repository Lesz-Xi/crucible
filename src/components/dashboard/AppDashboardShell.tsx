'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  Clock3,
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
    window.addEventListener('historyImported', loadHistory);
    return () => window.removeEventListener('historyImported', loadHistory);
  }, [isChatRoute]);

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

  return (
    <div className="min-h-screen w-full bg-[var(--lab-bg)] text-[var(--lab-text-primary)]">
      <div className="flex min-h-screen">
        <aside className={cn(
          'relative border-r border-[var(--lab-border)] bg-[var(--lab-panel)] backdrop-blur-md transition-all duration-200',
          collapsed ? 'w-[74px]' : 'w-[272px]',
        )}>
          <div className="flex h-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              {collapsed ? null : (
                <div>
                  <p className="font-serif text-[30px] leading-none tracking-tight">Wu-Weism</p>
                  <p className="text-xs text-[var(--lab-text-secondary)]">Dashboard</p>
                </div>
              )}
              <button type="button" className="lab-button-secondary !px-2.5 !py-2" onClick={toggleSidebar} aria-label="Toggle sidebar">
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>

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

            {isChatRoute && !collapsed ? (
              <section className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]/55 p-3">
                <button
                  type="button"
                  className="lab-button-primary mb-3 w-full"
                  onClick={() => {
                    router.push('/chat?new=1');
                    window.dispatchEvent(new Event('newChat'));
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Thread
                </button>
                <p className="lab-section-title mb-2 text-[11px]">Recent Threads</p>
                <div className="lab-scroll-region h-[34vh] space-y-2 pr-1">
                  {recentThreads.length === 0 ? (
                    <div className="lab-empty-state text-xs">No recent history for this account.</div>
                  ) : (
                    recentThreads.slice(0, 12).map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        className="lab-card-interactive w-full !p-2.5 text-left"
                        onClick={() => {
                          router.push(`/chat?sessionId=${session.id}`);
                          window.dispatchEvent(new CustomEvent('loadSession', { detail: { sessionId: session.id } }));
                        }}
                      >
                        <p className="truncate text-sm font-medium text-[var(--lab-text-primary)]">{session.title || 'Untitled thread'}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)]">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(session.updated_at).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
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
