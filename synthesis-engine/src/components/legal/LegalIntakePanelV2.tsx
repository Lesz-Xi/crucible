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
    <div className="space-y-6">
      <section className="relative overflow-hidden p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FileUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/60 !mb-0">Legal Documents</p>
          </div>

          <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.json" className="hidden" onChange={handleUpload} />
          
          <button 
            type="button" 
            className="w-full relative group overflow-hidden rounded-xl border border-dashed border-white/20 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed py-8 flex flex-col items-center justify-center gap-3" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={disabled}
          >
            <div className="p-3 rounded-full bg-black/50 border border-white/10 group-hover:scale-110 group-hover:border-emerald-500/30 transition-transform duration-300">
              <FileUp className="h-5 w-5 text-white/40 group-hover:text-emerald-400 transition-colors" />
            </div>
            <span className="font-sans text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors">
              Click to upload evidence files
            </span>
          </button>

          <div className="mt-4 space-y-2">
            {documentNames.length === 0 ? (
              <div className="text-center p-3 rounded-lg border border-white/5 bg-black/20 text-xs text-white/30 font-mono">
                No documents loaded
              </div>
            ) : (
              documentNames.map((name) => (
                <div key={name} className="p-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {name}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Scale className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/60 !mb-0">Case Details</p>
          </div>

          <div className="space-y-3">
            <input 
              className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-lg px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans" 
              placeholder="Case title" 
              value={caseTitle} 
              onChange={(event) => onCaseTitleChange(event.target.value)} 
            />
            <input 
              className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-lg px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans" 
              placeholder="Jurisdiction" 
              value={jurisdiction} 
              onChange={(event) => onJurisdictionChange(event.target.value)} 
            />
            <select 
              className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans appearance-none" 
              value={caseType} 
              onChange={(event) => onCaseTypeChange(event.target.value as 'criminal' | 'tort' | 'contract' | 'administrative')}
            >
              <option value="tort" className="bg-black text-white/90">Tort</option>
              <option value="criminal" className="bg-black text-white/90">Criminal</option>
              <option value="contract" className="bg-black text-white/90">Contract</option>
              <option value="administrative" className="bg-black text-white/90">Administrative</option>
            </select>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button 
              type="button" 
              className="px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
              onClick={onAnalyze} 
              disabled={disabled || documentNames.length === 0}
            >
              Analyze causation
            </button>
            <button 
              type="button" 
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 text-sm font-medium transition-all" 
              onClick={onClear}
            >
              Clear
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
