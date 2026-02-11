"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Database, // Truth Store
  ShieldCheck, // Axiom Validator
  Layers, // Obsidian Layer alternative
  Star, 
  Clock, 
  PanelLeftClose,
  Trash2, // Delete icon
  Loader2 // Loading spinner
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChatPersistence } from "@/lib/services/chat-persistence";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthButton } from "@/components/auth/AuthButton";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface LocalChatStore {
  sessions?: ChatSession[];
}

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
      active 
        ? "bg-wabi-white/10 text-wabi-white font-medium" 
        : "text-wabi-stone hover:bg-wabi-white/5 hover:text-wabi-mist"
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="truncate">{label}</span>
    {badge && (
      <span className="ml-auto text-xs bg-wabi-white/10 px-1.5 py-0.5 rounded-full text-wabi-mist">
        {badge}
      </span>
    )}
  </button>
);

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
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const chatPersistence = new ChatPersistence();

  const loadLocalFallbackSessions = (): ChatSession[] => {
    try {
      const raw = window.localStorage.getItem('causal-chat-local-fallback-v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LocalChatStore;
      if (!Array.isArray(parsed.sessions)) return [];
      return parsed.sessions
        .slice()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10);
    } catch {
      return [];
    }
  };

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
            Crucible
          </span>
        </div>
       <div className="flex items-center gap-2">
           <AuthButton compact className="hidden lg:block" />
           <ThemeToggle />
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

        <SidebarItem icon={Search} label="Search" />
        <SidebarItem icon={MessageSquare} label="Chats" active />
        <SidebarItem icon={Layers} label="Obsidian Layer" />
        <SidebarItem icon={Database} label="Truth Store" />
        <SidebarItem icon={ShieldCheck} label="Axiom Validator" />
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
       <div className="p-4 mt-auto border-t border-wabi-stone/20">
         <AuthButton />
      </div>
    </div>
  );
}
