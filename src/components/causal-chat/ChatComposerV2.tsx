'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ChevronDown, Focus, Loader2, PanelRightClose, PanelRightOpen, Paperclip, Send, Square } from 'lucide-react';
import { useAppShellChrome } from '@/components/dashboard/AppShellChromeContext';

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

const SCENARIO_LABELS: Record<'explore' | 'intervene' | 'audit', string> = {
  explore: 'Discovery',
  intervene: 'Intervention',
  audit: 'Audit',
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
  const scenarioMenuRef = useRef<HTMLDivElement | null>(null);
  const shellChrome = useAppShellChrome();
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!scenarioMenuRef.current?.contains(event.target as Node)) {
        setScenarioMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

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

        <div className="chat-toolbar-menu" ref={scenarioMenuRef}>
          <button
            type="button"
            className="chat-toolbar-chip is-scenarios"
            onClick={() => setScenarioMenuOpen((current) => !current)}
            aria-expanded={scenarioMenuOpen}
            aria-haspopup="menu"
          >
            Scenarios
            <ChevronDown className="h-3 w-3" />
          </button>

          {scenarioMenuOpen ? (
            <div className="chat-toolbar-dropdown" role="menu" aria-label="Scenario modes">
              {(['explore', 'intervene', 'audit'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={operatorMode === mode}
                  className={`chat-toolbar-dropdown-item ${operatorMode === mode ? 'active' : ''}`}
                  onClick={() => {
                    onOperatorModeChange(mode);
                    setScenarioMenuOpen(false);
                  }}
                >
                  <span className="chat-toolbar-dropdown-title">{SCENARIO_LABELS[mode]}</span>
                  <span className="chat-toolbar-dropdown-meta">{mode}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="chat-toolbar-chip is-shell-toggle"
          onClick={() => shellChrome?.setEvidenceRailVisible((current) => !current)}
          title={shellChrome?.evidenceRailVisible ? 'Hide evidence rail' : 'Show evidence rail'}
          aria-label={shellChrome?.evidenceRailVisible ? 'Hide evidence rail' : 'Show evidence rail'}
        >
          {shellChrome?.evidenceRailVisible ? <PanelRightClose className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
        </button>

        <button
          type="button"
          className="chat-toolbar-chip is-shell-toggle"
          onClick={() => shellChrome?.setFocusMode((current) => !current)}
          title={shellChrome?.focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          aria-label={shellChrome?.focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          <Focus className="h-3 w-3" />
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
