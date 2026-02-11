"use client";

import { useState, useRef } from 'react';
import { Upload, X, FileText, Plus } from 'lucide-react';

interface UploadPoolProps {
  files: File[];
  companies: string[];
  onFilesSelected: (files: File[]) => void;
  onCompaniesChange: (companies: string[]) => void;
  maxFiles: number;
  maxCompanies: number;
  isProcessing: boolean;
}

export function UploadPool({ 
  files, 
  companies, 
  onFilesSelected, 
  onCompaniesChange,
  maxFiles,
  maxCompanies,
  isProcessing
}: UploadPoolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Company Tags
  const [newTag, setNewTag] = useState("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFilesSelected([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onCompaniesChange([...companies, newTag.trim()]);
      setNewTag("");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center relative p-8">
      {/* WABI-SABI LAYOUT: Ma (Negative Space) focused */}
      
      {/* THE POOL (Liquid Glass Container) */}
      <div 
        className={`
          relative w-full aspect-video max-h-[500px] 
          rounded-3xl border border-white/40 
          backdrop-blur-xl bg-white/10 
          shadow-[0_8px_32px_rgba(31,38,135,0.15)]
          transition-all duration-700 ease-out
          flex flex-col items-center justify-center
          overflow-hidden
          ${isDragging ? 'scale-[1.02] bg-white/20' : 'hover:bg-white/15'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Ripples / Background Noise */}
        <div className="absolute inset-0 bg-patina opacity-50 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/10 pointer-events-none" />

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".pdf" 
          onChange={(e) => e.target.files && onFilesSelected([...files, ...Array.from(e.target.files)])}
        />

          {files.length === 0 ? (
            <div 
              className="text-center z-10 p-10 animate-fade-in-up"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30 transform transition-transform duration-500 hover:scale-110">
                <Upload className="w-8 h-8 text-wabi-sumi/60" />
              </div>
              <p className="font-serif text-2xl text-wabi-sumi/80 mb-2 tracking-tight">
                Drop synthesis material
              </p>
              <p className="font-mono text-xs text-wabi-stone uppercase tracking-widest">
                PDF / Research / Context
              </p>
            </div>
          ) : (
            <div className="relative z-10 w-full h-full p-8 grid grid-cols-3 gap-4 overflow-y-auto animate-fade-in">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="group relative aspect-[3/4] rounded-xl bg-white/40 border border-white/50 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-1 transition-all duration-500 hover:shadow-xl"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                   <FileText className="w-8 h-8 text-wabi-moss mb-3 opacity-80" />
                   <p className="text-xs font-medium text-wabi-sumi line-clamp-2">{file.name}</p>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onFilesSelected(files.filter((_, idx) => idx !== i)); }}
                     className="absolute top-2 right-2 p-1 rounded-full bg-black/5 hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <X className="w-3 h-3" />
                   </button>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* COMPANY TAGGING (Floating Glass Chips) */}
      <div 
        className="w-full mt-8 flex flex-wrap items-center gap-3 justify-center transition-all duration-500"
      >
        {companies.map((tag, i) => (
          <span
            key={tag}
            className="px-4 py-2 rounded-full bg-white/30 border border-wabi-stone/20 text-wabi-sumi text-xs font-mono tracking-wide backdrop-blur-sm flex items-center gap-2 animate-pop-in"
          >
            {tag}
            <button onClick={() => onCompaniesChange(companies.filter(t => t !== tag))} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        <form onSubmit={handleAddTag} className="relative">
          <input 
            type="text" 
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="+ TAG ENTITY"
            className="px-6 py-2 rounded-full bg-transparent border border-wabi-stone/30 text-wabi-sumi text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-wabi-clay/60 focus:bg-white/10 transition-colors placeholder:text-wabi-stone/50 w-40 focus:w-64 transition-all duration-500"
          />
        </form>
      </div>
    </div>
  );
}
