"use client";

import { useEffect, useState } from "react";
import { SessionManager } from "@/lib/epistemic/session-manager";
import { ChatInterface, ExecutionStream, FileTreeItem } from "@/components/epistemic-ui";
import { KDenseSession, VirtualFile } from "@/lib/epistemic/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
      <div style={{ minHeight: "100%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "var(--accent)" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", background: "var(--bg)", color: "var(--text-1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top Bar */}
      <header style={{ height: "var(--topbar-h)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between", background: "var(--bg-2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ padding: 8, borderRadius: "var(--radius-sm)", color: "var(--text-3)", display: "flex" }} className="transitional">
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Epistemic Audit
              <span style={{ padding: "2px 7px", borderRadius: 3, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border-2)", fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                Active
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* 3-Pane Layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left: Chat (Negotiation) */}
        <div style={{ width: 350, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--sidebar-bg)", flexShrink: 0 }}>
           <ChatInterface 
             messages={session.messages} 
             onSendMessage={handleSendMessage}
             isTyping={isTyping} 
           />
        </div>

        {/* Center: Execution Stream (Glass Box) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, zIndex: 10 }}>
             {/* Mock controls for demo */}
             {session.status === "generating_conjecture" && (
               <button 
                 onClick={() => handleSendMessage("Approved. Proceed.")}
                 style={{ padding: "7px 14px", background: "var(--green-dim)", border: "1px solid var(--green-border)", color: "var(--green)", fontSize: 12, fontFamily: "var(--font-mono)", borderRadius: "var(--radius-sm)", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}
               >
                 Approve Conjecture
               </button>
             )}
          </div>
          
          <div style={{ flex: 1, overflowY: "auto" }}>
             {session.plan.length === 0 ? (
               <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                 <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <Loader2 style={{ width: 28, height: 28, color: "var(--text-4)" }} className="animate-spin" />
                 </div>
                 <p style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Awaiting conjecture generation...</p>
               </div>
             ) : (
               <ExecutionStream plan={session.plan} currentStepIndex={session.currentStepIndex} />
             )}
          </div>
        </div>

        {/* Right: Session Explorer (Evidence Rail) */}
        <div style={{ width: 300, borderLeft: "1px solid var(--border)", background: "var(--rail-bg)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div className="topbar" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="label-mono" style={{ color: "var(--text-4)" }}>Session Directory</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {session.fileSystem.map((file) => (
              <FileTreeItem key={file.path} file={file} onSelect={setSelectedFile} />
            ))}
          </div>
          
          {/* Mini File Preview */}
          <div style={{ height: 200, borderTop: "1px solid var(--border)", background: "var(--bg-2)", padding: 14, fontFamily: "var(--font-mono)", fontSize: 11, overflowY: "auto" }}>
             {selectedFile ? (
               <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                 <div style={{ fontWeight: 600, color: "var(--text-1)" }}>{selectedFile.name}</div>
                 <div style={{ color: "var(--text-3)", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                   {selectedFile.content || "(Binary Content or Empty)"}
                 </div>
               </div>
             ) : (
               <span style={{ color: "var(--text-4)", fontStyle: "italic" }}>Select a file to preview...</span>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
