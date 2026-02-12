'use client';

import { ChangeEvent, useRef } from 'react';
import { FileUp, Scale } from 'lucide-react';

export interface LegalIntakePanelV2Props {
  documentNames: string[];
  caseTitle: string;
  jurisdiction: string;
  caseType: 'criminal' | 'tort' | 'contract' | 'administrative';
  disabled?: boolean;
  onFilesRead: (documents: string[], names: string[]) => void;
  onCaseTitleChange: (value: string) => void;
  onJurisdictionChange: (value: string) => void;
  onCaseTypeChange: (value: 'criminal' | 'tort' | 'contract' | 'administrative') => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export function LegalIntakePanelV2({
  documentNames,
  caseTitle,
  jurisdiction,
  caseType,
  disabled = false,
  onFilesRead,
  onCaseTitleChange,
  onJurisdictionChange,
  onCaseTypeChange,
  onAnalyze,
  onClear,
}: LegalIntakePanelV2Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const docs: string[] = [];
    const names: string[] = [];

    for (const file of files) {
      const text = await file.text();
      docs.push(text);
      names.push(file.name);
    }

    onFilesRead(docs, names);
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <FileUp className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <p className="lab-section-title !mb-0">Legal Documents</p>
        </div>

        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.json" className="hidden" onChange={handleUpload} />
        <button type="button" className="lab-button-secondary w-full" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
          <FileUp className="h-4 w-4" />
          Upload evidence files
        </button>

        <div className="mt-3 space-y-2">
          {documentNames.length === 0 ? (
            <div className="lab-empty-state text-sm">No documents loaded</div>
          ) : (
            documentNames.map((name) => (
              <div key={name} className="lab-card-interactive !p-2 text-sm text-[var(--lab-text-primary)]">{name}</div>
            ))
          )}
        </div>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[var(--lab-accent-moss)]" />
          <p className="lab-section-title !mb-0">Case Details</p>
        </div>

        <div className="space-y-2">
          <input className="lab-input" placeholder="Case title" value={caseTitle} onChange={(event) => onCaseTitleChange(event.target.value)} />
          <input className="lab-input" placeholder="Jurisdiction" value={jurisdiction} onChange={(event) => onJurisdictionChange(event.target.value)} />
          <select className="lab-select" value={caseType} onChange={(event) => onCaseTypeChange(event.target.value as 'criminal' | 'tort' | 'contract' | 'administrative')}>
            <option value="tort">Tort</option>
            <option value="criminal">Criminal</option>
            <option value="contract">Contract</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="lab-button-primary" onClick={onAnalyze} disabled={disabled || documentNames.length === 0}>
            Analyze causation
          </button>
          <button type="button" className="lab-button-secondary" onClick={onClear}>
            Clear
          </button>
        </div>
      </section>
    </div>
  );
}
