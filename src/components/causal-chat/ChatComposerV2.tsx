'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ChevronDown, Loader2, Paperclip, Send, Square } from 'lucide-react';

export interface ComposerAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SlashCommandOption {
  id: string;
  label: string;
  description: string;
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
  attachments?: ComposerAttachment[];
  onAddAttachments?: (files: File[]) => void;
  onRemoveAttachment?: (name: string) => void;
  slashCommands?: readonly SlashCommandOption[];
  onSlashCommand?: (id: string) => void;
}

const MODE_LABELS: Record<'explore' | 'intervene' | 'audit', string> = {
  explore: 'Diagnose',
  intervene: 'Act',
  audit: 'Validate',
};

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
  attachments = [],
  onAddAttachments,
  onRemoveAttachment,
  slashCommands = [],
  onSlashCommand,
}: ChatComposerV2Props) {
  const canSend = value.trim().length > 0 && !disabled && !isLoading;
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeSlashQuery = value.startsWith('/') ? value.slice(1).toLowerCase() : '';
  const filteredSlashCommands = useMemo(() => {
    if (!activeSlashQuery) return slashCommands;
    return slashCommands.filter((item) => item.label.toLowerCase().includes(activeSlashQuery) || item.id.toLowerCase().includes(activeSlashQuery));
  }, [activeSlashQuery, slashCommands]);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files || []);
    if (selected.length > 0) {
      onAddAttachments?.(selected);
    }
    event.currentTarget.value = '';
  };

  return (
    <div className="workbench-composer-shell">
      <textarea
        className="lab-textarea min-h-[88px]"
        placeholder={placeholder || 'State your hypothesis, mechanism, and desired intervention...'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (value.startsWith('/') && filteredSlashCommands[0]) {
              onSlashCommand?.(filteredSlashCommands[0].id);
              return;
            }
            if (canSend) onSend();
          }
        }}
      />

      {value.startsWith('/') ? (
        <div className="workbench-slash-menu">
          {filteredSlashCommands.length === 0 ? (
            <div className="workbench-empty-panel">No matching slash command.</div>
          ) : (
            filteredSlashCommands.map((item) => (
              <button
                key={item.id}
                type="button"
                className="workbench-command-row w-full"
                onClick={() => onSlashCommand?.(item.id)}
              >
                <div className="min-w-0 text-left">
                  <div className="font-medium text-[var(--lab-text-primary)]">/{item.label}</div>
                  <div className="truncate text-xs text-[var(--lab-text-secondary)]">{item.description}</div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <button
            type="button"
            className="lab-button-secondary !px-3 !py-1.5 text-[11px]"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </button>

          <div className="relative">
            <button
              type="button"
              className="workbench-mode-chip"
              onClick={() => setModeMenuOpen((current) => !current)}
              aria-expanded={modeMenuOpen}
            >
              <span>{MODE_LABELS[operatorMode]}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {modeMenuOpen ? (
              <div className="workbench-floating-panel left-0 top-[calc(100%+8px)] min-w-[180px]">
                {(['explore', 'intervene', 'audit'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="workbench-command-row w-full"
                    onClick={() => {
                      onOperatorModeChange(mode);
                      setModeMenuOpen(false);
                    }}
                  >
                    <span>{MODE_LABELS[mode]}</span>
                    {mode === operatorMode ? <span className="workbench-command-kind">Active</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--lab-text-tertiary)]">`/` for commands</span>
          <span className="font-mono text-[10px] text-[var(--lab-text-tertiary)]">Enter to send</span>
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

      {attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <button
              key={file.name}
              type="button"
              className="lab-nav-pill"
              onClick={() => onRemoveAttachment?.(file.name)}
              title="Remove attachment"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {file.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
