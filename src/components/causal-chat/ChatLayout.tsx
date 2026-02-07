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
    <div className="min-h-screen w-full flex bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      {/* Sidebar - Controlled - Sticky for page scroll */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onLoadSession={onLoadSession}
        onNewChat={onNewChat}
        className="hidden md:flex flex-shrink-0 z-20 sticky top-0 h-screen"
      />

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col min-h-screen bg-[var(--bg-primary)] transition-all duration-300">
        
        {/* Toggle Button - Floating Top Left */}
        <div className="absolute top-4 left-4 z-50">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="p-2 rounded-lg text-wabi-stone hover:bg-wabi-clay/10 hover:text-wabi-clay transition-colors"
             title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
           >
             {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
             ) : (
                <PanelLeftOpen className="w-5 h-5" />
             )}
           </button>
        </div>

        {/* Theme Toggle - Floating Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Background depth layers */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none z-0 fixed" />
        
        {/* Child Content (Chat Interface) */}
        <div className="flex-1 relative z-10 p-0">
           {children}
        </div>
      </div>
    </div>
  );
}
