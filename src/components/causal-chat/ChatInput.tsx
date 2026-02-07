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
      "w-full bg-white/10 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.15)] transition-all duration-500 group focus-within:bg-white/20 focus-within:shadow-[0_8px_32px_rgba(31,38,135,0.2)]",
      isExpanded ? "rounded-3xl p-4 md:p-6" : "rounded-3xl p-3" // Input Box Shape
    )}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className={cn(
          "w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none font-serif text-wabi-sumi placeholder:text-wabi-stone/40 scrollbar-none",
          isExpanded ? "text-lg md:text-xl min-h-[60px]" : "text-base min-h-[24px]"
        )}
        rows={1}
        disabled={isLoading}
      />

      {/* Input Actions Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-wabi-sand/10">
        <div className="flex items-center gap-2">
            <button className="p-2 text-wabi-stone hover:text-wabi-clay hover:bg-wabi-sand/20 rounded-full transition-colors">
                 <Paperclip className="w-4 h-4" />
            </button>
        </div>

        {isLoading ? (
            <button
              onClick={onStop}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-wabi-rust/10 text-wabi-rust flex items-center justify-center hover:bg-wabi-rust/20 transition-all"
            >
              <div className="w-3 h-3 rounded-sm bg-current" />
            </button>
        ) : (
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300",
                input.trim() 
                  ? "bg-wabi-clay text-wabi-sumi shadow-lg hover:bg-wabi-clay/90 hover:scale-105" 
                  : "bg-wabi-sand/30 text-wabi-stone/40 cursor-not-allowed"
              )}
            >
              <WabiSendIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        )}
      </div>
    </div>
  );
}
