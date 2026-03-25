'use client';

import { ChangeEvent, useRef } from 'react';
import { FileUp, Scale, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <motion.section 
        className="bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-white/10 bg-white/5 shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]">
              <FileUp className="h-4 w-4 text-[#5B8DB8]" />
            </div>
            <h2 className="font-mono text-sm tracking-widest text-[var(--text-primary)] uppercase">Evidence</h2>
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.json" className="hidden" onChange={handleUpload} />
        
        <button 
          type="button" 
          className="w-full relative group flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] transition-colors hover:bg-white/[0.04] hover:border-[#5B8DB8]/50 overflow-hidden" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={disabled}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#5B8DB8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <UploadCloud className="h-8 w-8 text-[var(--text-tertiary)] group-hover:text-[#5B8DB8] transition-colors" />
          <div className="text-center">
            <p className="text-sm text-[var(--text-primary)] font-medium font-mono">Upload evidence files</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">.txt, .md, .json</p>
          </div>
        </button>

        <div className="mt-4 space-y-2">
          {documentNames.length === 0 ? (
            <div className="py-4 text-center border border-white/5 rounded-xl bg-black/40 text-xs text-[var(--text-tertiary)] font-mono">No documents loaded</div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {documentNames.map((name) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-[var(--text-secondary)] font-mono group hover:bg-white/[0.05] transition-colors">
                  <span className="truncate flex-1">{name}</span>
                  <div className="h-2 w-2 rounded-full bg-[#5B8DB8] shadow-[0_0_8px_#5B8DB8]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <motion.section 
        className="bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-white/10 bg-white/5 shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]">
              <Scale className="h-4 w-4 text-[#5B8DB8]" />
            </div>
            <h2 className="font-mono text-sm tracking-widest text-[var(--text-primary)] uppercase">Details</h2>
          </div>
        </div>

        <div className="space-y-3">
          <input 
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] font-mono focus:outline-none focus:ring-1 focus:ring-[#5B8DB8]/50 focus:border-[#5B8DB8]/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all" 
            placeholder="Case title" 
            value={caseTitle} 
            onChange={(event) => onCaseTitleChange(event.target.value)} 
          />
          <input 
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] font-mono focus:outline-none focus:ring-1 focus:ring-[#5B8DB8]/50 focus:border-[#5B8DB8]/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all" 
            placeholder="Jurisdiction" 
            value={jurisdiction} 
            onChange={(event) => onJurisdictionChange(event.target.value)} 
          />
          <div className="relative">
            <select 
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-[var(--text-primary)] font-mono appearance-none focus:outline-none focus:ring-1 focus:ring-[#5B8DB8]/50 focus:border-[#5B8DB8]/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all" 
              value={caseType} 
              onChange={(event) => onCaseTypeChange(event.target.value as 'criminal' | 'tort' | 'contract' | 'administrative')}
            >
              <option value="tort">Tort Law</option>
              <option value="criminal">Criminal Law</option>
              <option value="contract">Contract Law</option>
              <option value="administrative">Administrative Law</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-tertiary)]">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button 
            type="button" 
            className="group relative w-full overflow-hidden rounded-xl bg-[#0F172A] border border-[#5B8DB8]/30 px-4 py-3 text-sm font-mono font-medium text-[var(--text-primary)] transition-all hover:border-[#5B8DB8]/80 shadow-[0_0_15px_rgba(91,141,184,0.15)] hover:shadow-[0_0_25px_rgba(91,141,184,0.4)] disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onAnalyze} 
            disabled={disabled || documentNames.length === 0}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DB8]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              Analyze Causation
              <div className="h-1.5 w-1.5 rounded-full bg-[#5B8DB8] shadow-[0_0_10px_#5B8DB8]" />
            </span>
          </button>
          <button 
            type="button" 
            className="w-full rounded-xl border border-white/5 bg-transparent px-4 py-3 text-sm font-mono text-[var(--text-tertiary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]" 
            onClick={onClear}
          >
            Clear Configuration
          </button>
        </div>
      </motion.section>
    </div>
  );
}
