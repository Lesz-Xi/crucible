'use client';

import { AlertTriangle, CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LegalCase } from '@/types/legal';

export interface LegalGateSummary {
  allowed: boolean;
  allowedOutputClass: 'association_only' | 'intervention_inferred' | 'intervention_supported';
  allowedChains: number;
  blockedChains: number;
  missingConfounders: string[];
  rationale: string;
}

export interface LegalAnalysisPanelV2Props {
  statusMessage: string;
  progress: number;
  stage: 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'matching' | 'complete' | 'error';
  result: LegalCase | null;
  gateState: LegalGateSummary | null;
  error: string | null;
}

export function LegalAnalysisPanelV2({ statusMessage, progress, stage, result, gateState, error }: LegalAnalysisPanelV2Props) {
  const isBillingError = (error || '').toLowerCase().includes('anthropic credits depleted');

  if (!result && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <Scale className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="font-serif text-2xl text-white/90">Legal Causal Reasoner</p>
        <p className="mt-3 text-sm text-white/40 max-w-sm">Upload case records to evaluate intent, action, harm, and legal liability chains through deterministic graphs.</p>
        <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs font-mono text-emerald-400">{statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Section */}
      <section className="relative overflow-hidden p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Analysis Timeline</p>
          <div className="flex justify-between items-ends mb-3">
            <p className="text-sm font-medium text-emerald-400">{statusMessage}</p>
            <p className="text-xs font-mono text-white/30 text-right uppercase">{stage}</p>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.5)] rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, 5)}%` }} 
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {error && (
          <motion.section 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-[#0a0505] border border-red-500/20 backdrop-blur-md shadow-[0_4px_30px_rgba(239,68,68,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
            <div className="relative flex items-start gap-3 text-red-400">
              <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-medium">{error}</p>
                {isBillingError && (
                  <p className="mt-2 text-[11px] text-white/40">
                    Action: Open Anthropic Plans & Billing, add credits, then rerun analysis.
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Verdict Box */}
            <section className="md:col-span-2 relative overflow-hidden p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] group hover:border-emerald-500/20 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80">Final Verdict</span>
                </div>
                
                <h2 className="text-3xl font-serif text-white/90 mb-3 tracking-tight">
                  {result.verdict?.liable ? 'Liability Established' : 'Liability Not Established'}
                </h2>
                
                <p className="text-sm text-white/60 max-w-2xl leading-relaxed mb-4">
                  {result.verdict?.reasoning || 'No reasoning available.'}
                </p>
                
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs text-white/30">Confidence Score:</span>
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10">
                    <span className="text-xs font-mono font-medium text-emerald-400">{Math.round((result.verdict?.confidence || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Causal Chains Box */}
            <section className="relative overflow-hidden p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Causal Chains</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40">{result.causalChains.length} Detected</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[300px] scrollbar-hide">
                {result.causalChains.slice(0, 10).map((chain, index) => (
                  <article key={`${chain.action.id}-${index}`} className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 opacity-0 group-hover:opacity-10 group-hover:from-cyan-500/10 transition-all pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5 text-[10px] font-mono text-cyan-500">INT</span>
                        <p className="text-xs font-medium text-white/90">{chain.intent.description}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5 text-[10px] font-mono text-emerald-500">ACT</span>
                        <p className="text-xs text-white/60">{chain.action.description}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5 text-[10px] font-mono text-red-400">HRM</span>
                        <p className="text-xs text-white/60">{chain.harm.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Intervention Gate Box */}
            <section className="relative overflow-hidden p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <ShieldCheck className="h-4 w-4 text-orange-400" />
                </div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Intervention Gate</h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                {gateState ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white/70 leading-relaxed border-l-2 border-orange-500/50 pl-3">
                      {gateState.rationale}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-white/30 uppercase">Output Class</span>
                        <span className="text-xs font-mono text-white/90 truncate" title={gateState.allowedOutputClass}>{gateState.allowedOutputClass}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                        <span className="text-[10px] font-mono text-white/30 uppercase">Chains Status</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-emerald-400">{gateState.allowedChains} Pass</span>
                          <span className="text-xs font-mono text-red-400">{gateState.blockedChains} Block</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 font-mono">No gate signal emitted for this run.</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
