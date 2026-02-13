'use client';

import { Loader2, Paperclip, Send, Square } from 'lucide-react';

export interface ChatComposerV2Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatComposerV2({ value, onChange, onSend, onStop, disabled = false, isLoading = false, placeholder }: ChatComposerV2Props) {
  const canSend = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className="lab-card border-t border-[var(--lab-border)] !rounded-b-2xl !rounded-t-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="lab-section-title">Prompt</span>
        <span className="font-mono text-[11px] text-[var(--lab-text-tertiary)]">Enter to send</span>
      </div>

      <textarea
        className="lab-textarea min-h-[110px]"
        placeholder={placeholder || "State your hypothesis, mechanism, and desired intervention..."}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
      />

      <div className="mt-3 flex items-center justify-between">
        <button type="button" className="lab-button-secondary" disabled>
          <Paperclip className="h-4 w-4" />
          Attach
        </button>

        {isLoading ? (
          <button type="button" className="lab-button-secondary" onClick={onStop}>
            <Square className="h-4 w-4" />
            Stop
          </button>
        ) : (
          <button type="button" className="lab-button-primary" onClick={onSend} disabled={!canSend}>
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        )}
      </div>
    </div>
  );
}
