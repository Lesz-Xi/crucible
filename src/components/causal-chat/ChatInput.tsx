"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Paperclip } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onStop: () => void;
  isExpanded?: boolean; // True for the Welcome Screen version
}

const WabiSendIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export function ChatInput({ input, setInput, isLoading, onSend, onStop, isExpanded = false }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit'; // Reset height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className={cn(
      "group w-full border border-[var(--lab-input-border)] bg-[var(--lab-panel)] shadow-[var(--lab-shadow-soft)] transition-all duration-300 focus-within:border-[var(--lab-border-strong)] focus-within:shadow-[var(--lab-shadow-lift)]",
      isExpanded ? "rounded-3xl p-4 md:p-6" : "rounded-3xl p-3" // Input Box Shape
    )}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className={cn(
          "scrollbar-none w-full resize-none border-none bg-transparent font-serif text-[var(--lab-text-primary)] placeholder:text-[var(--lab-text-tertiary)] focus:outline-none focus:ring-0",
          isExpanded ? "text-lg md:text-xl min-h-[60px]" : "text-base min-h-[24px]"
        )}
        rows={1}
        disabled={isLoading}
      />

      {/* Input Actions Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-[var(--lab-border)] pt-2">
        <div className="flex items-center gap-2">
            <button className="rounded-full p-2 text-[var(--lab-text-secondary)] transition-colors hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-accent-rust)]">
                 <Paperclip className="w-4 h-4" />
            </button>
        </div>

        {isLoading ? (
            <button
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lab-hover-bg)] text-[var(--lab-accent-rust)] transition-all hover:bg-[var(--lab-active-bg)] md:h-10 md:w-10"
            >
              <div className="w-3 h-3 rounded-sm bg-current" />
            </button>
        ) : (
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 md:h-10 md:w-10",
                input.trim() 
                  ? "bg-[var(--lab-text-primary)] text-[var(--lab-panel)] shadow-[var(--lab-shadow-soft)] hover:scale-105 hover:bg-[var(--lab-accent-rust)]" 
                  : "cursor-not-allowed bg-[var(--lab-panel-soft)] text-[var(--lab-text-tertiary)]"
              )}
            >
              <WabiSendIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        )}
      </div>
    </div>
  );
}
