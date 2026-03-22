'use client';

import { FormEvent, KeyboardEvent, useRef } from 'react';
import { FileText, Plus, X } from 'lucide-react';

export interface HybridInputPanelV2Props {
  files: File[];
  companies: string[];
  companyDraft: string;
  researchFocus: string;
  isRunning: boolean;
  canRun: boolean;
  onFilesChange: (files: File[]) => void;
  onCompanyDraftChange: (value: string) => void;
  onResearchFocusChange: (value: string) => void;
  onAddCompany: () => void;
  onRemoveCompany: (company: string) => void;
  onRemoveFile: (name: string) => void;
  onRun: () => void;
  onCancelRun: () => void;
}

export function HybridInputPanelV2({
  files,
  companies,
  companyDraft,
  researchFocus,
  isRunning,
  canRun,
  onFilesChange,
  onCompanyDraftChange,
  onResearchFocusChange,
  onAddCompany,
  onRemoveCompany,
  onRemoveFile,
  onRun,
  onCancelRun,
}: HybridInputPanelV2Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: FormEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files || []);
    if (selected.length === 0) return;

    const deduped = [...files];
    for (const file of selected) {
      if (!deduped.some((existing) => existing.name === file.name)) {
        deduped.push(file);
      }
    }
    onFilesChange(deduped.slice(0, 6));
  };

  const handleCompanyKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onAddCompany();
    }
  };

  return (
    <div className="space-y-5">
      <section className="pb-5 border-b border-[var(--lab-border)]">
        <p className="lab-section-title">Research Sources</p>

        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onInput={handleFileSelect} />
        <button type="button" className="lab-button-secondary w-full" onClick={() => fileInputRef.current?.click()}>
          <FileText className="h-3.5 w-3.5" />
          Add PDF Files
        </button>

        <div className="mt-3 space-y-1">
          {files.length === 0 ? (
            <p className="lab-empty-state">No PDFs selected</p>
          ) : (
            files.map((file) => (
              <div key={file.name} className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--lab-border)] last:border-0">
                <p className="truncate text-xs text-[var(--lab-text-secondary)] font-mono">{file.name}</p>
                <button type="button" className="text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)] transition-colors" onClick={() => onRemoveFile(file.name)}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="pb-5 border-b border-[var(--lab-border)]">
        <p className="lab-section-title">Companies</p>

        <div className="flex gap-2 items-end">
          <input
            className="lab-input flex-1"
            placeholder="Add company name"
            value={companyDraft}
            onChange={(event) => onCompanyDraftChange(event.target.value)}
            onKeyDown={handleCompanyKeyDown}
          />
          <button type="button" className="lab-button-secondary shrink-0 mb-0" style={{ padding: '7px 10px' }} onClick={onAddCompany}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {companies.map((company) => (
            <span
              key={company}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-[var(--lab-text-secondary)] border border-[var(--lab-border-strong)] rounded"
            >
              {company}
              <button type="button" className="text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)] transition-colors" onClick={() => onRemoveCompany(company)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {companies.length === 0 ? <p className="lab-empty-state">No companies added.</p> : null}
        </div>
      </section>

      <section className="pb-2">
        <p className="lab-section-title">Research Focus</p>
        <textarea
          className="lab-textarea"
          placeholder="Optional: target a specific mechanism, sector, or causal tension"
          value={researchFocus}
          onChange={(event) => onResearchFocusChange(event.target.value)}
        />

        <button type="button" className="lab-button-primary mt-4" disabled={!canRun || isRunning} onClick={onRun}>
          {isRunning ? 'Running synthesis...' : 'Start synthesis run'}
        </button>
        {isRunning ? (
          <button type="button" className="lab-button-secondary mt-2 w-full" onClick={onCancelRun}>
            Stop run
          </button>
        ) : null}
      </section>
    </div>
  );
}
