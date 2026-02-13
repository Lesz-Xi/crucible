'use client';

import { useState } from 'react';
import { ChevronDown, FlaskConical, Loader2, Paperclip, Send, Square } from 'lucide-react';

interface QuickPromptOption {
  id: string;
  label: string;
  snippet: string;
}

export interface ChatComposerV2Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  operatorMode: 'explore' | 'intervene' | 'audit';
  onOperatorModeChange: (mode: 'explore' | 'intervene' | 'audit') => void;
  quickPrompts?: readonly QuickPromptOption[];
  selectedQuickPromptId?: string;
  onQuickPromptSelect?: (id: string, snippet: string) => void;
}

export function ChatComposerV2({
  value,
  onChange,
  onSend,
  onStop,
  disabled = false,
  isLoading = false,
  placeholder,
  operatorMode,
  onOperatorModeChange,
  quickPrompts = [],
  selectedQuickPromptId,
  onQuickPromptSelect,
}: ChatComposerV2Props) {
  const canSend = value.trim().length > 0 && !disabled && !isLoading;
  const [shortcutMenuOpen, setShortcutMenuOpen] = useState(false);

  return (
    <div className="lab-card !rounded-t-none border-0 border-t border-[var(--lab-border)] !bg-transparent px-6 pb-5 pt-4 shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="lab-section-title">Prompt</span>
        <div className="relative flex items-center gap-2">
          {quickPrompts.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                className="lab-button-secondary !px-3 !py-1.5 text-xs"
                onClick={() => setShortcutMenuOpen((current) => !current)}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Scientific shortcuts
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {shortcutMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-2 shadow-lg">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="lab-card-interactive mb-1 w-full !p-2.5 text-left"
                      data-active={selectedQuickPromptId === item.id ? 'true' : 'false'}
                      onClick={() => {
                        onQuickPromptSelect?.(item.id, item.snippet);
                        setShortcutMenuOpen(false);
                      }}
                    >
                      <p className="text-sm font-medium text-[var(--lab-text-primary)]">{item.label}</p>
                      <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">{item.snippet}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <span className="font-mono text-[11px] text-[var(--lab-text-tertiary)]">Enter to send</span>
        </div>
      </div>

      <textarea
        className="lab-textarea min-h-[134px]"
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

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className="lab-button-secondary" disabled>
            <Paperclip className="h-4 w-4" />
            Attach
          </button>

          <div className="flex items-center gap-1 rounded-full border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] px-1 py-1">
            <button
              type="button"
              className="lab-nav-pill !px-3 !py-1.5"
              data-active={operatorMode === 'explore'}
              onClick={() => onOperatorModeChange('explore')}
            >
              Explore
            </button>
            <button
              type="button"
              className="lab-nav-pill !px-3 !py-1.5"
              data-active={operatorMode === 'intervene'}
              onClick={() => onOperatorModeChange('intervene')}
            >
              Intervene
            </button>
            <button
              type="button"
              className="lab-nav-pill !px-3 !py-1.5"
              data-active={operatorMode === 'audit'}
              onClick={() => onOperatorModeChange('audit')}
            >
              Audit
            </button>
          </div>
        </div>

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
