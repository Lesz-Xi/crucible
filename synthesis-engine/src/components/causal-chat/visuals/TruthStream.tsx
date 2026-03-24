"use client";

/**
 * Truth Stream - Causal Message List
 * 
 * Displays chat messages with integrated causal density indicators.
 * Each message shows its L1/L2/L3 classification in real-time.
 * Now supports Markdown rendering and Glass Card UI.
 */

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { AnimatedCausalDensityBadge } from "../CausalDensityBadge";
import { CausalFluxLogo } from "@/components/CausalFluxLogo";
import { CausalDensityResult } from "@/lib/ai/causal-integrity-service";
import { cn } from "@/lib/utils";
import { WabiLoadingState } from "../WabiLoadingState";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MessageWithDensity {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** Causal density analysis (null while streaming) */
  density?: CausalDensityResult | null;
  /** Whether message is still streaming */
  isStreaming?: boolean;
  /** Oracle mode active during this message */
  oracleMode?: boolean;
  /** Domain classification from server */
  domain?: string;
  /** Tier 1 SCM constraints used */
  tier1Used?: string[];
  /** Tier 2 SCM constraints used */
  tier2Used?: string[];
  /** Optional metrics for display */
  metrics?: {
    causalDensity: number;
    coherenceScore: number;
    latencyMs: number;
  };
}

export interface TruthStreamProps {
  messages: MessageWithDensity[];
  className?: string;
}

// Removed unused LEVEL_STYLES constant to reduce confusion and potential styling conflicts

function MessageBubble({
  message,
  isLast,
}: {
  message: MessageWithDensity;
  isLast: boolean;
}) {
  const isUser = message.role === "user";
  const hasDensity = message.density !== undefined && message.density !== null;

  // For streaming messages with no content yet, show only avatar + loading state
  const isEmptyStreaming = !isUser && message.isStreaming && !message.content;

  if (isEmptyStreaming) {
    return (
      <div className="flex gap-4 group flex-row mb-8">
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
            "bg-white text-wabi-charcoal border border-white/40"
          )}
        >
          <CausalFluxLogo className="w-4 h-4" />
        </div>

        {/* Loading State - No bubble wrapper */}
        <div className="flex flex-col items-start pt-1">
          <WabiLoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 group flex-row mb-8 animate-fadeIn">
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10",
          isUser
            ? "bg-wabi-clay text-wabi-sumi ring-2 ring-white"
            : message.oracleMode
            ? "bg-gradient-to-br from-white/10 to-white/30 text-wabi-rust border border-white/40"
            : "bg-white text-wabi-charcoal border border-white/40"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <CausalFluxLogo className="w-4 h-4" />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 items-start">
        {/* Bubble / Card */}
        <div
          className={cn(
            "relative w-full overflow-hidden",
            isUser
              ? "px-6 py-5 rounded-2xl bg-wabi-clay text-wabi-sumi rounded-tr-sm rounded-bl-3xl rounded-tl-3xl shadow-md transition-all duration-300"
              : "pl-0 py-2 bg-transparent text-wabi-charcoal" 
          )}
        >
          {/* Markdown Content */}
          <div className={cn(
            "prose prose-sm max-w-[820px] leading-relaxed break-words transition-all duration-300 font-sans text-base tracking-normal",
            // Markdown Customization
            "prose-headings:font-sans prose-headings:font-semibold prose-headings:text-wabi-sumi",
            "prose-p:text-[16px] prose-p:leading-[1.62]",
            "prose-a:text-wabi-clay prose-a:no-underline prose-a:font-medium hover:prose-a:underline",
            "prose-code:font-mono prose-code:text-xs prose-code:bg-black/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
            "prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100 prose-pre:shadow-inner prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl",
            "prose-blockquote:border-l-wabi-clay prose-blockquote:bg-wabi-clay/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:rounded-r-lg",
            "prose-ul:list-disc prose-ul:pl-5",
            "prose-ol:list-decimal prose-ol:pl-5",
            // Dark/Light mode adaptations for User
            isUser ? "text-wabi-sumi prose-headings:text-wabi-sumi prose-p:text-wabi-sumi prose-strong:text-wabi-sumi" : "text-wabi-charcoal"
          )}>
             <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom rendering for layout stability if needed
                  img: ({ ...props }) => {
                    if (!props.src) return null;
                    // Handle Blob URLs (convert to object URL string)
                    const imageSrc = typeof props.src === 'string' 
                      ? props.src 
                      : props.src instanceof Blob 
                        ? URL.createObjectURL(props.src)
                        : String(props.src);
                    return (
                      <Image
                        src={imageSrc}
                        alt={props.alt || ""}
                        width={800}
                        height={600}
                        className="rounded-lg shadow-sm max-h-96 object-contain bg-white"
                        style={{ width: "100%", height: "auto" }}
                      />
                    );
                  }
                }}
             >
                {message.content}
             </ReactMarkdown>
             
             {message.isStreaming && (
               <span className="inline-block w-2 h-4 ml-1 align-bottom bg-current animate-pulse opacity-50" />
             )}
          </div>
        </div>

        {/* Footer: Gauge + Timestamp */}
        <div className={cn("flex items-center gap-3 mt-2 px-1 transition-opacity duration-300", isLast ? "opacity-100" : "opacity-40 group-hover:opacity-100")}>
          {!isUser && hasDensity && (
            <AnimatedCausalDensityBadge 
              level={`L${message.density!.score}` as 'L0' | 'L1' | 'L2' | 'L3'} 
              score={Math.round((message.density!.confidence || 0.5) * 100)}
              label={message.density!.label}
              size="sm"
            />
          )}
          
          <span className="text-[10px] text-wabi-stone font-medium tabular-nums tracking-wide opacity-60">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TruthStream({ messages, className }: TruthStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messages.length]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "py-12 pb-32 w-full max-w-3xl mx-auto px-4",
        className
      )}
    >
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLast={idx === messages.length - 1}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
