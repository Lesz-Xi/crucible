'use client';

import { useState } from 'react';
import { ChevronDown, Eye, EyeOff, FlaskConical, Loader2, Paperclip, Send, SlidersHorizontal, Square } from 'lucide-react';

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
  evidenceRailOpen?: boolean;
  onToggleEvidenceRail?: () => void;
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
  evidenceRailOpen = true,
  onToggleEvidenceRail,
}: ChatComposerV2Props) {
  const canSend = value.trim().length > 0 && !disabled && !isLoading;
  const [shortcutMenuOpen, setShortcutMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  return (
    <div className="lab-card !rounded-t-none border-0 border-t border-[var(--lab-border)] !bg-transparent px-6 pb-1 pt-2 shadow-none">
      <div className="mb-3 flex items-center justify-end gap-2">
        <div className="relative">
          <button
            type="button"
            className="lab-button-secondary !px-3 !py-1.5 text-xs"
            onClick={() => setModeMenuOpen((current) => !current)}
            title="Response mode"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {operatorMode[0].toUpperCase() + operatorMode.slice(1)}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {modeMenuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-2 shadow-lg">
              {(['explore', 'intervene', 'audit'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="lab-card-interactive mb-1 w-full !p-2 text-left text-sm"
                  data-active={operatorMode === mode ? 'true' : 'false'}
                  onClick={() => {
                    onOperatorModeChange(mode);
                    setModeMenuOpen(false);
                  }}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {quickPrompts.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              className="lab-button-secondary !px-3 !py-1.5 text-xs"
              onClick={() => setShortcutMenuOpen((current) => !current)}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Shortcuts
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

        <button
          type="button"
          className="lab-button-secondary !px-3 !py-1.5 text-xs"
          onClick={onToggleEvidenceRail}
          title={evidenceRailOpen ? 'Hide evidence rail' : 'Show evidence rail'}
        >
          {evidenceRailOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>

        <span className="font-mono text-[11px] text-[var(--lab-text-tertiary)]">Enter to send</span>
      </div>

      <textarea
        className="lab-textarea min-h-[112px]"
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

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className="lab-button-secondary" disabled>
            <Paperclip className="h-4 w-4" />
            Attach
          </button>
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
