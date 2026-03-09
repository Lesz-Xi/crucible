'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Eye, EyeOff, Focus, FlaskConical, Loader2, Paperclip, Send, Square } from 'lucide-react';

interface QuickPromptOption {
  id: string;
  label: string;
  snippet: string;
}

export interface ComposerAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
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
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  attachments?: ComposerAttachment[];
  onAddAttachments?: (files: File[]) => void;
  onRemoveAttachment?: (name: string) => void;
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
  focusMode = false,
  onToggleFocusMode,
  attachments = [],
  onAddAttachments,
  onRemoveAttachment,
}: ChatComposerV2Props) {
  const canSend = value.trim().length > 0 && !disabled && !isLoading;
  const [shortcutMenuOpen, setShortcutMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files || []);
    if (selected.length > 0) {
      onAddAttachments?.(selected);
    }
    event.currentTarget.value = '';
  };

  const cycleMode = () => {
    if (operatorMode === 'explore') {
      onOperatorModeChange('intervene');
      return;
    }
    if (operatorMode === 'intervene') {
      onOperatorModeChange('audit');
      return;
    }
    onOperatorModeChange('explore');
  };

  return (
    <div className="input-composer">
      <textarea
        className="lab-textarea min-h-[92px]"
        placeholder={placeholder || 'State your hypothesis, mechanism, and desired intervention...'}
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

      <div className="input-toolbar">
        <div className="flex items-center gap-2 flex-wrap">
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
            className="input-chip"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
          >
            <Paperclip className="h-3 w-3" />
            Attach
          </button>

          <button
            type="button"
            className="input-chip"
            onClick={cycleMode}
            title={`Current mode: ${operatorMode}`}
          >
            <FlaskConical className="h-3 w-3" />
            DAV Mode
          </button>

          {quickPrompts.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                className="input-chip"
                onClick={() => setShortcutMenuOpen((current) => !current)}
              >
                <FlaskConical className="h-3 w-3" />
                Scenarios
                <span className="chip-chevron">▾</span>
              </button>
              {shortcutMenuOpen ? (
                <div className="absolute left-0 z-20 mb-2 w-72 -translate-y-full rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-2 shadow-lg">
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
            className="input-chip"
            onClick={onToggleEvidenceRail}
            title={evidenceRailOpen ? 'Hide evidence rail' : 'Show evidence rail'}
          >
            {evidenceRailOpen ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>

          <button
            type="button"
            className="input-chip"
            onClick={onToggleFocusMode}
            title={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
            aria-pressed={focusMode}
          >
            <Focus className="h-3 w-3" />
          </button>
        </div>

        <div className="input-spacer" />

        <div className="flex items-center gap-2">
          <span className="enter-hint">↵ to send</span>
          {isLoading ? (
            <button type="button" className="input-chip" onClick={onStop}>
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button type="button" className="send-btn" onClick={onSend} disabled={!canSend}>
              {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          )}
        </div>
      </div>

      {attachments.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <button
              key={file.name}
              type="button"
              className="input-chip"
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
