'use client';

import { useRef, type ChangeEvent } from 'react';
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
  explore: 'DAV Mode',
  intervene: 'DAV Mode',
  audit: 'DAV Mode',
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
}: ChatComposerV2Props) {
  const canSend = value.trim().length > 0 && !disabled && !isLoading;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files || []);
    if (selected.length > 0) {
      onAddAttachments?.(selected);
    }
    event.currentTarget.value = '';
  };

  return (
    <div className="chat-composer-shell">
      <div className="composer-textarea-shell">
        <textarea
          className="input-textarea"
          placeholder={placeholder || 'Describe the real-world situation, what changed, and what outcome you need to understand…'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={2}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
      </div>

      <div className="chat-toolbar">
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
          className="chat-toolbar-chip is-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
        >
          <Paperclip className="h-3 w-3" />
          Attach
        </button>

        <button
          type="button"
          className="chat-toolbar-chip is-mode"
          onClick={() => onOperatorModeChange(operatorMode === 'explore' ? 'intervene' : operatorMode === 'intervene' ? 'audit' : 'explore')}
        >
          {MODE_LABELS[operatorMode]}
        </button>

        <button
          type="button"
          className="chat-toolbar-chip is-scenarios"
          onClick={() => onOperatorModeChange(operatorMode === 'explore' ? 'intervene' : operatorMode === 'intervene' ? 'audit' : 'explore')}
        >
          Scenarios
          <ChevronDown className="h-3 w-3" />
        </button>

        <div className="input-spacer" />
        <span className="enter-hint">↵ to send</span>

        {isLoading ? (
          <button type="button" className="send-btn" onClick={onStop}>
            <Square className="h-3 w-3" />
            Stop
          </button>
        ) : (
          <button type="button" className="send-btn" onClick={onSend} disabled={!canSend}>
            {disabled ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </button>
        )}
      </div>

      {attachments.length > 0 ? (
        <div className="composer-attachments">
          {attachments.map((file) => (
            <button
              key={file.name}
              type="button"
              className="composer-attachment"
              onClick={() => onRemoveAttachment?.(file.name)}
              title="Remove attachment"
            >
              <Paperclip className="h-3 w-3" />
              {file.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
