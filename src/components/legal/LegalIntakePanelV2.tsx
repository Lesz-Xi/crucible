'use client';

import { ChangeEvent, useRef } from 'react';
import { FileUp, Scale, UploadCloud } from 'lucide-react';

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
    <div className="space-y-6">
      <section className="bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-3)]">
              <FileUp className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <h2 className="font-mono text-sm tracking-widest text-[var(--text-1)] uppercase">Evidence</h2>
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.json" className="hidden" onChange={handleUpload} />
        
        <button 
          type="button" 
          className="w-full relative group flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-xl border border-dashed border-[var(--border-2)] bg-[var(--bg)] transition-colors hover:bg-[var(--bg-hover)] hover:border-[var(--accent-border)] overflow-hidden" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={disabled}
        >
          <div className="absolute inset-0 bg-[var(--accent-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <UploadCloud className="h-8 w-8 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors" />
          <div className="text-center relative">
            <p className="text-sm text-[var(--text-1)] font-medium font-mono">Upload evidence files</p>
            <p className="text-xs text-[var(--text-3)] mt-1">.txt, .md, .json</p>
          </div>
        </button>

        <div className="mt-4 space-y-2">
          {documentNames.length === 0 ? (
            <div className="py-4 text-center border border-[var(--border)] rounded-xl bg-[var(--bg-3)] text-xs text-[var(--text-3)] font-mono">No documents loaded</div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {documentNames.map((name) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text-2)] font-mono group hover:bg-[var(--bg-hover)] transition-colors">
                  <span className="truncate flex-1">{name}</span>
                  <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-3)]">
              <Scale className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <h2 className="font-mono text-sm tracking-widest text-[var(--text-1)] uppercase">Details</h2>
          </div>
        </div>

        <div className="space-y-3">
          <input 
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)] transition-all" 
            placeholder="Case title" 
            value={caseTitle} 
            onChange={(event) => onCaseTitleChange(event.target.value)} 
          />
          <input 
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)] transition-all" 
            placeholder="Jurisdiction" 
            value={jurisdiction} 
            onChange={(event) => onJurisdictionChange(event.target.value)} 
          />
          <div className="relative">
            <select 
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-1)] font-mono appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)] transition-all" 
              value={caseType} 
              onChange={(event) => onCaseTypeChange(event.target.value as 'criminal' | 'tort' | 'contract' | 'administrative')}
            >
              <option value="tort">Tort Law</option>
              <option value="criminal">Criminal Law</option>
              <option value="contract">Contract Law</option>
              <option value="administrative">Administrative Law</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-3)]">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button 
            type="button" 
            className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] border border-transparent px-4 py-3 text-sm font-mono font-medium text-white transition-all hover:brightness-110 shadow-[var(--accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onAnalyze} 
            disabled={disabled || documentNames.length === 0}
          >
            <span className="relative flex items-center justify-center gap-2">
              Analyze Causation
            </span>
          </button>
          <button 
            type="button" 
            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm font-mono text-[var(--text-3)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]" 
            onClick={onClear}
          >
            Clear Configuration
          </button>
        </div>
      </section>
    </div>
  );
}
