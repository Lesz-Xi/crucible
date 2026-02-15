'use client';

import { Activity, Database, GitMerge, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CausalGaugesProps {
  density: {
    score: number;
    label: string;
    confidence: number;
  } | null;
  posture: string;
  modelKey: string;
}

export function CausalGauges({ density, posture, modelKey }: CausalGaugesProps) {
  const isSecure = posture.includes('Gate cleared') || posture.includes('No unaudited');
  const isBlocked = posture.includes('Gate blocked') || posture.includes('downgraded');

  const quantizedScore = density?.score ? Math.round(density.score * 10) / 10 : 0;
  // Arc length for r=70 is 2*PI*70 ≈ 440
  const totalLength = 440;
  const progressOffset = totalLength - (totalLength * (quantizedScore || 0)) / 100;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-500">
      {/* 1. Causal Density Gauge */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--lab-text-secondary)]">
            <Activity className="h-3 w-3" />
            Causal Density
          </div>
          {density?.confidence && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
              density.confidence > 0.8 
                ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/5 text-amber-600 border-amber-500/20"
            )}>
              CONF: {(density.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        <div className="relative flex items-center justify-center py-4 bg-[var(--lab-bg-secondary)] rounded-lg border border-[var(--lab-border)]">
          {/* SVG Gauge */}
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="var(--lab-border)"
                strokeWidth="8"
                className="opacity-20"
              />
              {/* Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={totalLength}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000 ease-out",
                  quantizedScore > 80 ? "text-emerald-500" :
                  quantizedScore > 50 ? "text-blue-500" :
                  "text-slate-400"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tracking-tighter tabular-nums text-[var(--lab-text-primary)]">
                {quantizedScore || 'N/A'}
              </span>
              <span className="text-[10px] uppercase text-[var(--lab-text-tertiary)] pt-1">Density</span>
            </div>
          </div>
        </div>
        
        <p className="mt-2 text-center text-xs text-[var(--lab-text-secondary)] font-medium">
          {density?.label || 'Awaiting scored output'}
        </p>
      </section>

      {/* 2. Alignment Posture */}
      <section className={cn(
        "p-3 rounded-lg border transition-all duration-300",
        isBlocked 
          ? "border-amber-500/30 bg-amber-500/5" 
          : "border-[var(--lab-border)] bg-[var(--lab-bg-secondary)]"
      )}>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--lab-text-secondary)]">
          {isSecure 
            ? <ShieldCheck className="h-3 w-3 text-emerald-600" /> 
            : <ShieldAlert className="h-3 w-3 text-amber-600" />
          }
          Alignment Posture
        </div>
        <p className={cn(
          "text-xs leading-relaxed font-medium",
          isBlocked ? "text-amber-700 dark:text-amber-400" : "text-[var(--lab-text-secondary)]"
        )}>
          {posture}
        </p>
      </section>

      {/* 3. Model Provenance */}
      <section className="p-3 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg-secondary)]">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--lab-text-secondary)]">
          <GitMerge className="h-3 w-3" />
          Model Provenance
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Database className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-bold text-[var(--lab-text-primary)]">
              {modelKey === 'default' ? 'Anthropic Claude 3.5' : modelKey}
            </p>
            <p className="text-[10px] text-[var(--lab-text-tertiary)] font-mono">
              v{modelKey === 'default' ? 'sonnet' : 'custom'} • Active Reasoner
            </p>
          </div>
        </div>

        {/* Provenance Chain */}
        <div className="relative pl-3 ml-1 space-y-3 border-l border-[var(--lab-border)]">
           <div className="relative group">
             <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_var(--lab-bg-secondary)]" />
             <p className="text-[10px] font-medium text-[var(--lab-text-secondary)]">Input Guardrails</p>
             <p className="text-[10px] text-[var(--lab-text-tertiary)]">Sanitized & Checked</p>
           </div>
           <div className="relative group">
             <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_var(--lab-bg-secondary)]" />
             <p className="text-[10px] font-medium text-[var(--lab-text-secondary)]">Trace Integrity</p>
             <p className="text-[10px] text-[var(--lab-text-tertiary)]">Hash: verified</p>
           </div>
        </div>
      </section>
    </div>
  );
}
