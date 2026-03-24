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
  provenanceAvailable?: boolean;
}

export function CausalGauges({ density, posture, modelKey, provenanceAvailable = true }: CausalGaugesProps) {
  const isSecure = posture.includes('Gate cleared') || posture.includes('No unaudited');
  const isBlocked = posture.includes('Gate blocked') || posture.includes('downgraded');

  const rung = density?.score === 3 ? 3 : density?.score === 2 ? 2 : density?.score === 1 ? 1 : null;
  const rungLabel = rung === 3 ? 'Counterfactual' : rung === 2 ? 'Intervention' : rung === 1 ? 'Association' : 'Awaiting scored output';

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

        <div className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg-secondary)] p-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { level: 1, short: 'L1', label: 'Association' },
              { level: 2, short: 'L2', label: 'Intervention' },
              { level: 3, short: 'L3', label: 'Counterfactual' },
            ].map((item) => {
              const active = rung === item.level;
              return (
                <div
                  key={item.level}
                  className={cn(
                    'rounded-md border px-2 py-2 text-center transition-all',
                    active
                      ? 'border-[var(--lab-accent-earth)] bg-[color-mix(in_srgb,var(--lab-accent-earth)_12%,transparent)]'
                      : 'border-[var(--lab-border)] bg-transparent',
                  )}
                >
                  <p className={cn('text-sm font-bold', active ? 'text-[var(--lab-text-primary)]' : 'text-[var(--lab-text-secondary)]')}>
                    {item.short}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--lab-text-tertiary)]">{item.label}</p>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-center text-xs font-semibold text-[var(--lab-text-primary)]">
            {rung ? `Active rung: L${rung}` : 'Active rung: unavailable'}
          </p>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--lab-text-secondary)] font-medium">
          {rungLabel}
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
        {provenanceAvailable ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <Database className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-xs font-bold text-[var(--lab-text-primary)]">
                  {modelKey === "default" ? "Anthropic Claude 3.5" : modelKey}
                </p>
                <p className="font-mono text-[10px] text-[var(--lab-text-tertiary)]">
                  provenance event emitted
                </p>
              </div>
            </div>

            <div className="relative ml-1 space-y-3 border-l border-[var(--lab-border)] pl-3">
              <div className="group relative">
                <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_var(--lab-bg-secondary)]" />
                <p className="text-[10px] font-medium text-[var(--lab-text-secondary)]">Input Guardrails</p>
                <p className="text-[10px] text-[var(--lab-text-tertiary)]">Sanitized and checked</p>
              </div>
              <div className="group relative">
                <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_var(--lab-bg-secondary)]" />
                <p className="text-[10px] font-medium text-[var(--lab-text-secondary)]">Trace Integrity</p>
                <p className="text-[10px] text-[var(--lab-text-tertiary)]">Session provenance available</p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-[var(--lab-border)] bg-[var(--lab-bg-primary)] p-3">
            <p className="text-xs font-semibold text-[var(--lab-text-primary)]">unavailable</p>
            <p className="mt-1 text-[11px] text-[var(--lab-text-secondary)]">
              No verified model provenance was emitted for this run.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
