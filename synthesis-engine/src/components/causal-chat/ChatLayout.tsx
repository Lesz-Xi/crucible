"use client";

import { useState } from "react";
import { Sidebar } from "@/components/causal-chat/Sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ChatLayoutProps {
  children: React.ReactNode;
  onLoadSession?: (sessionId: string) => void;
  onNewChat?: () => void;
}

export function ChatLayout({ children, onLoadSession, onNewChat }: ChatLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full bg-[var(--lab-bg)] font-sans text-[var(--lab-text-primary)]">
      {/* Sidebar - Controlled - Sticky for page scroll */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onLoadSession={onLoadSession}
        onNewChat={onNewChat}
        className="hidden md:flex flex-shrink-0 z-20 sticky top-0 h-screen"
      />

      {/* Main Content Area */}
      <div className="relative flex min-h-screen flex-1 flex-col bg-[var(--lab-bg)] transition-all duration-300">
        
        {/* Toggle Button - Floating Top Left */}
        <div className="absolute top-4 left-4 z-50">
           <button
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)] p-2 text-[var(--lab-text-secondary)] transition-colors hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-accent-rust)]"
             title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
           >
             {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
             ) : (
                <PanelLeftOpen className="w-5 h-5" />
             )}
           </button>
        </div>

        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Child Content (Chat Interface) */}
        <div className="flex-1 relative z-10 p-0">
           {children}
        </div>
      </div>
    </div>
  );
}
