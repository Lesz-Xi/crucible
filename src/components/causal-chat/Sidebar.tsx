"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Plus, 
  MessageSquare, 
  Sparkles,
  Scale,
  Star, 
  Clock, 
  PanelLeftClose,
  Trash2, // Delete icon
  Loader2 // Loading spinner
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChatPersistence } from "@/lib/services/chat-persistence";
import { AuthButton } from "@/components/auth/AuthButton";
import { readLastHistorySyncStatus } from "@/lib/migration/history-import-bootstrap";
import type { HistorySyncStatus } from "@/types/history-import";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface LocalChatStore {
  sessions?: ChatSession[];
}

const LOCAL_FALLBACK_KEYS = [
  "causal-chat-local-fallback-v1",
  "causal_chat_sessions_local",
  "causalChatSessions",
  "chatHistory",
] as const;

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  badge?: string;
}

const sidebarItemClasses = (active?: boolean) =>
  cn(
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
    active
      ? "bg-wabi-white/10 text-wabi-white font-medium"
      : "text-wabi-stone hover:bg-wabi-white/5 hover:text-wabi-mist"
  );

const SidebarItem = ({ icon: Icon, label, active, onClick, href, badge }: SidebarItemProps) => {
  if (href) {
    return (
      <Link href={href} className={sidebarItemClasses(active)}>
        <Icon className="w-4 h-4" />
        <span className="truncate">{label}</span>
        {badge && (
          <span className="ml-auto text-xs bg-wabi-white/10 px-1.5 py-0.5 rounded-full text-wabi-mist">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={sidebarItemClasses(active)}>
      <Icon className="w-4 h-4" />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-xs bg-wabi-white/10 px-1.5 py-0.5 rounded-full text-wabi-mist">
          {badge}
        </span>
      )}
    </button>
  );
};

const SectionHeader = ({ label }: { label: string }) => (
  <div className="px-3 py-2 text-xs font-serif uppercase tracking-wider text-wabi-stone/50 mt-4 mb-1">
    {label}
  </div>
);

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
  onLoadSession?: (sessionId: string) => void;
  onNewChat?: () => void;
}

export function Sidebar({ className, isOpen, onToggle, onLoadSession, onNewChat }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<HistorySyncStatus | null>(null);
  const chatPersistence = new ChatPersistence();

  const loadLocalFallbackSessions = (): ChatSession[] => {
    try {
      for (const key of LOCAL_FALLBACK_KEYS) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as LocalChatStore | ChatSession[];
        const sessions = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.sessions)
            ? parsed.sessions
            : [];
        if (sessions.length > 0) {
          return sessions
            .slice()
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 10);
        }
      }
      return [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const lastStatus = readLastHistorySyncStatus();
    if (lastStatus) {
      setSyncStatus(lastStatus);
    }
  }, []);

  useEffect(() => {
    const handleSyncStatus = (event: Event) => {
      const customEvent = event as CustomEvent<HistorySyncStatus>;
      if (customEvent.detail) {
        setSyncStatus(customEvent.detail);
      }
    };

    window.addEventListener("historySyncStatus", handleSyncStatus);
    return () => window.removeEventListener("historySyncStatus", handleSyncStatus);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/causal-chat/history');
        if (response.status === 401) {
          setRecentSessions(loadLocalFallbackSessions());
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (Array.isArray(data?.history)) {
          if (data.history.length === 0) {
            setRecentSessions(loadLocalFallbackSessions());
            return;
          }
          setRecentSessions(data.history as ChatSession[]);
        }
      } catch (error) {
        console.warn('[Sidebar] Supabase not configured; skipping chat history fetch.', error);
      }
    };
    
    // Initial fetch
    fetchHistory();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchHistory, 5000);
    window.addEventListener('historyImported', fetchHistory);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('historyImported', fetchHistory);
    };
  }, []);

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session load on delete click

    // Optimistic UI update
    setDeletingSessionId(sessionId);
    const originalSessions = [...recentSessions];
    setRecentSessions(prev => prev.filter(s => s.id !== sessionId));

    // Call delete API
    const result = await chatPersistence.deleteSession(sessionId);

    if (result.success) {
      console.log('[Sidebar] ✅ Session deleted successfully');
      
      // Dispatch event to notify CausalChatInterface if active session was deleted
      window.dispatchEvent(new CustomEvent('sessionDeleted', { 
        detail: { sessionId } 
      }));
    } else {
      // Revert optimistic update on error
      setRecentSessions(originalSessions);
      alert(`Failed to delete session: ${result.error}`);
    }

    setDeletingSessionId(null);
  };
  
  return (
    <div className={cn(
      "h-screen flex flex-col border-r border-wabi-stone/20 transition-all duration-300 relative bg-background", 
      isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden",
      className
    )}>
      {/* Header / Logo Area */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="font-serif text-xl tracking-widest text-foreground whitespace-nowrap">
            Wu-Weism
          </span>
        </div>
       <div className="flex items-center gap-2">
           <AuthButton compact className="hidden lg:block" />
           <button 
             onClick={onToggle}
             className="p-1 hover:bg-white/5 rounded-md text-wabi-stone transition-colors"
           >
             <PanelLeftClose size={18} />
           </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 flex flex-col gap-0.5">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-2 bg-wabi-clay hover:bg-wabi-clay/90 text-wabi-sumi px-3 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-black/20 mb-4 group ring-1 ring-white/10"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>New chat</span>
        </button>

        <SectionHeader label="Features" />
        <SidebarItem icon={MessageSquare} label="Chat" href="/chat" active={pathname.startsWith("/chat")} />
        <SidebarItem icon={Sparkles} label="Hybrid" href="/hybrid" active={pathname.startsWith("/hybrid")} />
        <SidebarItem icon={Scale} label="Legal" href="/legal" active={pathname.startsWith("/legal")} />
      </div>

      {/* Starred */}
      <div className="px-3 mt-4">
         <SectionHeader label="Starred" />
         <SidebarItem icon={Star} label="Causal Logic Core" />
         <SidebarItem icon={Star} label="System Prompts" />
      </div>

      {/* Recents */}
      <div className="px-3 mt-2 flex-1 overflow-y-auto scrollbar-wabi">
         <SectionHeader label="Recents" />
         {recentSessions.map((session) => (
            <div key={session.id} className="group/session relative">
              <SidebarItem 
                icon={Clock} 
                label={session.title || "Untitled Session"} 
                onClick={() => onLoadSession?.(session.id)}
                active={false}
              />
              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                disabled={deletingSessionId === session.id}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "p-1.5 rounded-md transition-all",
                  "opacity-0 group-hover/session:opacity-100",
                  "hover:bg-red-500/20 text-wabi-stone hover:text-red-400",
                  deletingSessionId === session.id && "opacity-100"
                )}
                title="Delete session"
              >
                {deletingSessionId === session.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
         ))}
         {recentSessions.length === 0 && (
           <div className="px-2 py-2 text-xs text-wabi-stone/50 italic">
             No recent history
           </div>
         )}
      </div>

      {/* User Footer */}
       <div className="p-4 mt-auto border-t border-wabi-stone/20 space-y-3">
         <div className="rounded-lg border border-wabi-stone/20 bg-wabi-white/5 px-3 py-2">
           <p className="text-[10px] uppercase tracking-wider text-wabi-stone/70">History sync</p>
           <p className="mt-1 text-xs text-wabi-mist">
             {syncStatus?.message || "No sync status yet."}
           </p>
         </div>
         <AuthButton />
      </div>
    </div>
  );
}
