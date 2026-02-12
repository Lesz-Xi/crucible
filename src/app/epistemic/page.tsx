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
      <div className="min-h-screen bg-[#F0EFF4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F0EFF4] text-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-200 flex items-center px-6 lg:px-12 justify-between bg-white/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-gray-900" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
              <div className="w-12 h-12 relative">
                <img src="/wu-wei-logo.png" alt="Wu-Wei Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              Epistemic Audit
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] uppercase tracking-wider font-bold">
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Chat (Negotiation) */}
        <div className="w-[350px] border-r border-gray-200 flex flex-col bg-[#F0EFF4]">
           <ChatInterface 
             messages={session.messages} 
             onSendMessage={handleSendMessage}
             isTyping={isTyping} 
           />
        </div>

        {/* Center: Execution Stream (Glass Box) */}
        <div className="flex-1 flex flex-col bg-white relative shadow-sm">
          <div className="absolute top-4 right-4 z-10">
             {/* Mock controls for demo */}
             {session.status === "generating_conjecture" && (
               <button 
                 onClick={() => handleSendMessage("Approved. Proceed.")}
                 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg shadow-lg shadow-emerald-900/20 font-medium transition-all"
               >
                 Approve Conjecture
               </button>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {session.plan.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                 <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                   <Loader2 className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-sm font-medium">Waiting for conjecture generation...</p>
               </div>
             ) : (
               <ExecutionStream plan={session.plan} currentStepIndex={session.currentStepIndex} />
             )}
          </div>
        </div>

        {/* Right: Session Explorer (VFS) */}
        <div className="w-[300px] border-l border-gray-200 bg-gray-50/50 flex flex-col">
          <div className="p-3 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-widest">
            Session Directory
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {session.fileSystem.map((file) => (
              <FileTreeItem key={file.path} file={file} onSelect={setSelectedFile} />
            ))}
          </div>
          
          {/* Mini File Preview */}
          <div className="h-[200px] border-t border-gray-200 bg-white p-4 text-xs font-mono overflow-auto shadow-inner">
             {selectedFile ? (
               <div className="space-y-2">
                 <div className="font-bold text-gray-900">{selectedFile.name}</div>
                 <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                   {selectedFile.content || "(Binary Content or Empty)"}
                 </div>
               </div>
             ) : (
               <span className="text-gray-400 italic">Select a file to preview...</span>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
