"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Terminal, FileJson, FileText, CheckCircle2, Circle, 
  Loader2, AlertCircle, ChevronRight, ChevronDown, 
  MessageSquare, Play, FolderOpen, File as FileIcon,
  RefreshCw, Cpu, Activity, Zap
} from "lucide-react";
import { ExecutionStep, ExecutionLog, VirtualFile, ChatMessage } from "@/lib/epistemic/types";
import { formatDistanceToNow } from "date-fns";

// --- DARK EXECUTION STREAM ---

export function ExecutionStream({ plan, currentStepIndex }: { plan: ExecutionStep[], currentStepIndex: number }) {
  return (
    <div className="space-y-4 px-2">
      {plan.map((step, index) => {
        const isActive = step.status === "running";
        const isCompleted = step.status === "completed";
        const isPending = step.status === "pending";

        return (
          <div 
            key={step.id} 
            className={`
              relative pl-12 transition-all duration-500 group
              ${isActive ? "scale-[1.02]" : "opacity-60 hover:opacity-100"}
            `}
          >
            {/* Upper Line (Connects to previous) - Hidden for first item */}
            {index > 0 && (
              <div className={`
                absolute left-[23px] top-0 h-[50%] w-[2px]
                ${plan[index - 1].status === "completed" ? "bg-orange-500/50" : "bg-neutral-800"}
                transition-colors
              `} />
            )}

            {/* Lower Line (Connects to next) - Hidden for last item */}
            {index < plan.length - 1 && (
              <div className={`
                absolute left-[23px] top-[50%] bottom-[-16px] w-[2px]
                ${isCompleted ? "bg-orange-500/50" : "bg-neutral-800"}
                transition-colors
              `} />
            )}

            {/* Step Marker (Vertically Centered) */}
            <div className={`
              absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border 
              flex items-center justify-center z-10 transition-all duration-300
              ${isActive ? "bg-orange-500 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]" : 
                isCompleted ? "bg-orange-500/20 border-orange-500 text-orange-500" : "bg-[#0A0A0A] border-white/10"}
            `}>
              {isActive && <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />}
              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isPending && <div className="w-2 h-2 rounded-full bg-neutral-600" />}
            </div>

            {/* Step Content */}
            <div className={`
              relative rounded-xl border p-5 transition-all duration-300
              ${isActive ? "bg-[#0A0A0A] border-orange-500/30 shadow-lg shadow-orange-500/10" : 
                "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"}
            `}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className={`font-medium tracking-tight ${isActive ? "text-orange-200" : "text-neutral-300"}`}>
                    {step.label}
                  </h3>
                  {step.description && (
                     <p className="text-[10px] text-neutral-500 mt-0.5 max-w-[90%] leading-relaxed">
                        {step.description}
                     </p>
                  )}
                </div>
                <span className={`
                  text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-1 rounded shrink-0
                  ${isActive ? "bg-orange-500/20 text-orange-300" : 
                    isCompleted ? "bg-orange-500/10 text-orange-400" : "text-neutral-600"}
                `}>
                  {step.status}
                </span>
              </div>

              {/* Live Logs */}
              {(isActive || (isCompleted && step.logs.length > 0)) && (
                <div className="mt-3 font-mono text-xs space-y-1">
                  {step.logs.slice(-10).map((log) => (
                    <div key={log.id} className="flex gap-3 items-start text-neutral-400">
                      <span className="opacity-30 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </span>
                      <span className={isActive ? "text-orange-200/80" : "text-neutral-500"}>
                         {log.message}
                      </span>
                    </div>
                  ))}
                  {isActive && (
                     <div className="flex gap-2 items-center text-orange-400/60 pt-1 animate-pulse">
                        <Activity className="w-3 h-3" />
                        <span>Processing...</span>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- DARK FILE EXPLORER ---

export function FileTreeItem({ file, level = 0, onSelect }: { file: VirtualFile, level?: number, onSelect: (f: VirtualFile) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = file.type === "folder";
  
  return (
    <div className="">
      <div 
        onClick={() => isFolder ? setIsOpen(!isOpen) : onSelect(file)}
        className={`
          flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer text-sm font-medium
          hover:bg-white/5 transition-colors border border-transparent hover:border-white/5
          ${!isFolder ? "text-neutral-400" : "text-neutral-200"}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {isFolder && (
          <span className="opacity-50">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
        
        {isFolder ? <FolderOpen className="w-4 h-4 text-orange-400" /> : <FileTypeIcon filename={file.name} />}
        
        <span className="truncate tracking-tight">{file.name}</span>
        
        {!isFolder && (
          <span className="ml-auto text-[10px] text-neutral-600 font-mono">
            {formatBytes(file.size)}
          </span>
        )}
      </div>

      {isFolder && isOpen && file.children && (
        <div className="border-l border-white/5 ml-4">
          {file.children.map((child) => (
            <FileTreeItem key={child.path} file={child} level={level} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileTypeIcon({ filename }: { filename: string }) {
  if (filename.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-500/80" />;
  if (filename.endsWith('.md')) return <FileText className="w-4 h-4 text-emerald-500/80" />;
  if (filename.endsWith('.pdf')) return <FileText className="w-4 h-4 text-rose-500/80" />;
  return <FileIcon className="w-4 h-4 text-neutral-500" />;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + '' + sizes[i];
}


// --- DARK CHAT INTERFACE ---

export function ChatInterface({ messages, onSendMessage, isTyping }: { 
  messages: ChatMessage[], 
  onSendMessage: (msg: string) => void,
  isTyping: boolean 
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg) => {
          const isAgent = msg.role === "agent";
          return (
            <div key={msg.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
              <div 
                className={`
                  max-w-[90%] rounded-2xl px-5 py-4 text-sm leading-relaxed
                  ${isAgent 
                    ? "bg-[#0A0A0A] border border-white/5 text-neutral-200" 
                    : "bg-orange-600/90 text-white shadow-lg shadow-orange-900/20"}
                `}
              >
                <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] font-mono uppercase tracking-wider">
                    {isAgent && <Cpu className="w-3 h-3" />}
                    <span>{isAgent ? "Methodologist" : "You"}</span>
                </div>
                {msg.content}
              </div>
            </div>
          );
        })}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-[#0A0A0A] rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
               <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-75" />
               <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-150" />
             </div>
           </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
