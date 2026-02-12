'use client';

import { FormEvent, KeyboardEvent, useRef } from 'react';
import { Building2, FileText, Plus, UploadCloud, X } from 'lucide-react';

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
    <div className="space-y-4">
      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <p className="lab-section-title !mb-0">Research Sources</p>
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onInput={handleFileSelect} />
        <button type="button" className="lab-button-secondary w-full" onClick={() => fileInputRef.current?.click()}>
          <FileText className="h-4 w-4" />
          Add PDF Files
        </button>

        <div className="mt-3 space-y-2">
          {files.length === 0 ? (
            <div className="lab-empty-state text-sm">No PDFs selected</div>
          ) : (
            files.map((file) => (
              <div key={file.name} className="lab-card-interactive !p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-[var(--lab-text-primary)]">{file.name}</p>
                  <button type="button" className="lab-button-secondary !px-2 !py-1 text-xs" onClick={() => onRemoveFile(file.name)}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--lab-accent-moss)]" />
          <p className="lab-section-title !mb-0">Companies</p>
        </div>

        <div className="flex gap-2">
          <input
            className="lab-input"
            placeholder="Add company name"
            value={companyDraft}
            onChange={(event) => onCompanyDraftChange(event.target.value)}
            onKeyDown={handleCompanyKeyDown}
          />
          <button type="button" className="lab-button-secondary" onClick={onAddCompany}>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {companies.map((company) => (
            <button key={company} type="button" className="lab-nav-pill" data-active="true" onClick={() => onRemoveCompany(company)}>
              {company}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
          {companies.length === 0 ? <p className="text-sm text-[var(--lab-text-tertiary)]">No companies added.</p> : null}
        </div>
      </section>

      <section className="lab-card">
        <p className="lab-section-title mb-2">Research Focus</p>
        <textarea
          className="lab-textarea"
          placeholder="Optional: target a specific mechanism, sector, or causal tension"
          value={researchFocus}
          onChange={(event) => onResearchFocusChange(event.target.value)}
        />

        <button type="button" className="lab-button-primary mt-3 w-full" disabled={!canRun || isRunning} onClick={onRun}>
          {isRunning ? 'Running synthesis...' : 'Start synthesis run'}
        </button>
      </section>
    </div>
  );
}
