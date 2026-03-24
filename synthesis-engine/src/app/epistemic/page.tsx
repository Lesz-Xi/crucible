"use client";

import { useEffect, useState } from "react";
import { SessionManager } from "@/lib/epistemic/session-manager";
import { ChatInterface, ExecutionStream, FileTreeItem } from "@/components/epistemic-ui";
import { KDenseSession, VirtualFile } from "@/lib/epistemic/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function EpistemicPage() {
  const [session, setSession] = useState<KDenseSession | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);

  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const newSession = await SessionManager.createSession("HIV Thermodynamics Audit");
        setSession(newSession);
      } catch (e) {
        console.error("Failed to init session", e);
      }
    };
    initSession();
  }, []);

  // Polling for updates (Agent thoughts, file changes)
  useEffect(() => {
    if (!session?.id) return;

    const interval = setInterval(async () => {
      const updated = await SessionManager.refreshSession(session.id);
      if (updated) {
          setSession(prev => {
              // Only update if timestamp changed to avoid re-renders or cursor jumps
              if (prev && updated.updatedAt > prev.updatedAt) return updated;
              return prev; 
          });
      }
    }, 2000); // 2s polling

    return () => clearInterval(interval);
  }, [session?.id]);

  const handleSendMessage = async (text: string) => {
    if (!session) return;
    
    setIsTyping(true);
    try {
        await SessionManager.addMessage(session.id, text, "user");
        // Immediate refresh to show user message
        const updated = await SessionManager.refreshSession(session.id);
        if(updated) setSession(updated);
    } catch(e) {
        console.error("Failed to send message", e);
    } finally {
        setIsTyping(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--lab-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--lab-accent-slate)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--lab-bg)] text-[var(--lab-text-primary)]">
      {/* Top Bar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--lab-border)] bg-[var(--lab-panel)] px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <Link href="/" className="rounded-lg p-2 transition-colors hover:bg-[var(--lab-hover-bg)]">
            <ArrowLeft className="h-5 w-5 text-[var(--lab-text-secondary)] hover:text-[var(--lab-text-primary)]" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-sm font-semibold text-[var(--lab-text-primary)]">
              <div className="relative h-14 w-14 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)] p-1.5">
                <img src="/wu-wei-mark.png" alt="Wu-Weism logo" className="h-full w-full object-contain dark:invert" />
              </div>
              Epistemic Audit
              <span className="rounded-full border border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--lab-accent-slate)]">
              </span>
            </h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Chat (Negotiation) */}
        <div className="flex w-[350px] flex-col border-r border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)]">
           <ChatInterface 
             messages={session.messages} 
             onSendMessage={handleSendMessage}
             isTyping={isTyping} 
           />
        </div>

        {/* Center: Execution Stream (Glass Box) */}
        <div className="relative flex flex-1 flex-col bg-[var(--lab-panel)] shadow-[var(--lab-shadow-soft)]">
          <div className="absolute top-4 right-4 z-10">
             {/* Mock controls for demo */}
             {session.status === "generating_conjecture" && (
               <button 
                 onClick={() => handleSendMessage("Approved. Proceed.")}
                 className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-accent-moss)] px-4 py-2 text-sm font-medium text-[var(--lab-bg)] transition-all hover:brightness-105"
               >
                 Approve Conjecture
               </button>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {session.plan.length === 0 ? (
               <div className="flex h-full flex-col items-center justify-center gap-4 text-[var(--lab-text-tertiary)]">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--lab-border)] bg-[var(--lab-panel-soft)]">
                   <Loader2 className="h-8 w-8 text-[var(--lab-text-tertiary)]" />
                 </div>
                 <p className="text-sm font-medium text-[var(--lab-text-secondary)]">Waiting for conjecture generation...</p>
               </div>
             ) : (
               <ExecutionStream plan={session.plan} currentStepIndex={session.currentStepIndex} />
             )}
          </div>
        </div>

        {/* Right: Session Explorer (VFS) */}
        <div className="flex w-[300px] flex-col border-l border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)]">
          <div className="border-b border-[var(--lab-border)] p-3 text-xs font-bold uppercase tracking-widest text-[var(--lab-text-secondary)]">
            Session Directory
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {session.fileSystem.map((file) => (
              <FileTreeItem key={file.path} file={file} onSelect={setSelectedFile} />
            ))}
          </div>
          
          {/* Mini File Preview */}
          <div className="h-[200px] overflow-auto border-t border-[var(--lab-border)] bg-[var(--lab-panel)] p-4 font-mono text-xs shadow-inner">
             {selectedFile ? (
               <div className="space-y-2">
                 <div className="font-bold text-[var(--lab-text-primary)]">{selectedFile.name}</div>
                 <div className="whitespace-pre-wrap leading-relaxed text-[var(--lab-text-secondary)]">
                   {selectedFile.content || "(Binary Content or Empty)"}
                 </div>
               </div>
             ) : (
               <span className="italic text-[var(--lab-text-tertiary)]">Select a file to preview...</span>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
