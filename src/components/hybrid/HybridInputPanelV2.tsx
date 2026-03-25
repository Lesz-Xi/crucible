'use client';

import { FormEvent, KeyboardEvent, useRef } from 'react';
import {
  AlertCircle,
  Building2,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  ScanLine,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';

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
  const totalSources = files.length + companies.length;
  const capacityPct = Math.min((totalSources / 12) * 100, 100);
  const capacityLabel = `${totalSources} / 12 sources`;
  const atMin = totalSources >= 2;
  const atMax = totalSources >= 12;

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
    <div className="hybrid-input-panel">
      {/* ── Header ── */}
      <div className="hip-header">
        <div className="hip-icon">
          <ScanLine className="h-4 w-4" />
        </div>
        <div>
          <p className="hip-title">Source Ingestion</p>
          <p className="hip-sub">Upload PDFs · tag companies · set focus</p>
        </div>
      </div>

      {/* ── Capacity Bar ── */}
      <div className="hip-capacity">
        <div className="hip-capacity-meta">
          <span className="hip-capacity-label">{capacityLabel}</span>
          {!atMin && <span className="hip-capacity-warn">Need ≥ 2 sources</span>}
          {atMax && <span className="hip-capacity-good">Source limit reached</span>}
        </div>
        <div className="hip-bar-track">
          <div
            className={`hip-bar-fill${atMin ? ' hip-bar-fill--ready' : ''}`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>

      {/* ── PDF Sources ── */}
      <section className="hip-section">
        <div className="hip-section-header">
          <UploadCloud className="h-3.5 w-3.5" />
          <span>PDF Documents</span>
          <span className="hip-count">{files.length} / 6</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onInput={handleFileSelect}
        />

        {files.length === 0 ? (
          <button
            type="button"
            className="hip-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-5 w-5 opacity-60" />
            <span className="hip-drop-label">Click to add PDFs</span>
            <span className="hip-drop-hint">Max 6 files · PDF only</span>
          </button>
        ) : (
          <div className="hip-file-list">
            {files.map((file) => (
              <div key={file.name} className="hip-file-row">
                <FileText className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                <span className="hip-file-name">{file.name}</span>
                <button
                  type="button"
                  className="hip-remove-btn"
                  onClick={() => onRemoveFile(file.name)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < 6 && (
              <button
                type="button"
                className="hip-add-more"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-3.5 w-3.5" />
                Add more PDFs
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Company Sources ── */}
      <section className="hip-section">
        <div className="hip-section-header">
          <Building2 className="h-3.5 w-3.5" />
          <span>Company Signals</span>
          <span className="hip-count">{companies.length} / 5</span>
        </div>

        <div className="hip-company-input-row">
          <input
            className="hip-text-input"
            placeholder="e.g. OpenAI, Anthropic, Google…"
            value={companyDraft}
            onChange={(event) => onCompanyDraftChange(event.target.value)}
            onKeyDown={handleCompanyKeyDown}
            disabled={companies.length >= 5}
          />
          <button
            type="button"
            className="hip-add-btn"
            onClick={onAddCompany}
            disabled={!companyDraft.trim() || companies.length >= 5}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {companies.length > 0 && (
          <div className="hip-chip-list">
            {companies.map((company) => (
              <span key={company} className="hip-chip">
                {company}
                <button
                  type="button"
                  onClick={() => onRemoveCompany(company)}
                  className="hip-chip-x"
                  aria-label={`Remove ${company}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Research Focus ── */}
      <section className="hip-section">
        <div className="hip-section-header">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Research Focus</span>
          <span className="hip-optional">optional</span>
        </div>
        <textarea
          className="hip-textarea"
          placeholder="Target a specific mechanism, sector, or causal tension…"
          value={researchFocus}
          rows={3}
          onChange={(event) => onResearchFocusChange(event.target.value)}
        />
      </section>

      {/* ── Run / Cancel ── */}
      <div className="hip-actions">
        {isRunning ? (
          <button type="button" className="hip-cancel-btn" onClick={onCancelRun}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Stop Run
          </button>
        ) : (
          <button
            type="button"
            className={`hip-run-btn${canRun ? ' hip-run-btn--active' : ''}`}
            disabled={!canRun}
            onClick={onRun}
          >
            <Zap className="h-4 w-4" />
            Launch Synthesis
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
        )}
        {!canRun && !isRunning && (
          <p className="hip-run-hint">Add at least 2 sources to run</p>
        )}
      </div>
    </div>
  );
}
