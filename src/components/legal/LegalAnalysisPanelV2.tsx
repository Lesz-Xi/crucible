'use client';

import { AlertTriangle, CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
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
  if (!result && !error) {
    return (
      <div className="lab-empty-state h-full">
        <p className="font-serif text-2xl text-[var(--lab-text-primary)]">Legal Causal Reasoner</p>
        <p className="mt-2 text-sm">Upload case records to evaluate intent, action, harm, and legal liability chains.</p>
        <p className="mt-3 text-xs text-[var(--lab-text-tertiary)]">{statusMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <section className="lab-card">
        <p className="lab-section-title">Analysis Timeline</p>
        <p className="mt-2 text-sm text-[var(--lab-text-secondary)]">{statusMessage}</p>
        <div className="mt-3 h-2 rounded-full bg-[var(--lab-bg-elevated)]">
          <div className="h-2 rounded-full bg-[var(--lab-accent-earth)] transition-all" style={{ width: `${Math.max(progress, 5)}%` }} />
        </div>
      </section>

      {error ? (
        <section className="lab-card border-red-300 bg-red-50/70">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-medium">{error}</p>
          </div>
        </section>
      ) : null}

      {result ? (
        <>
          <section className="lab-card">
            <div className="mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-[var(--lab-accent-earth)]" />
              <p className="lab-section-title !mb-0">Verdict</p>
            </div>
            <p className="text-lg font-semibold text-[var(--lab-text-primary)]">{result.verdict?.liable ? 'Liability Established' : 'Liability Not Established'}</p>
            <p className="mt-1 text-sm text-[var(--lab-text-secondary)]">{result.verdict?.reasoning || 'No reasoning available.'}</p>
            <p className="mt-2 text-xs text-[var(--lab-text-tertiary)]">Confidence: {Math.round((result.verdict?.confidence || 0) * 100)}%</p>
          </section>

          <section className="lab-card">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--lab-accent-moss)]" />
              <p className="lab-section-title !mb-0">Causal Chains ({result.causalChains.length})</p>
            </div>
            <div className="space-y-2">
              {result.causalChains.slice(0, 10).map((chain, index) => (
                <article key={`${chain.action.id}-${index}`} className="lab-card-interactive !p-3">
                  <p className="text-sm font-semibold text-[var(--lab-text-primary)]">{chain.intent.description}</p>
                  <p className="mt-1 text-sm text-[var(--lab-text-secondary)]">{chain.action.description}</p>
                  <p className="mt-1 text-sm text-[var(--lab-text-secondary)]">Harm: {chain.harm.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="lab-card">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--lab-accent-moss)]" />
              <p className="lab-section-title !mb-0">Intervention Gate</p>
            </div>
            {gateState ? (
              <>
                <p className="text-sm text-[var(--lab-text-secondary)]">{gateState.rationale}</p>
                <p className="mt-2 text-xs text-[var(--lab-text-tertiary)]">
                  Output class: {gateState.allowedOutputClass} · Allowed chains: {gateState.allowedChains} · Blocked: {gateState.blockedChains}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--lab-text-tertiary)]">No gate signal emitted for this run.</p>
            )}
          </section>
        </>
      ) : null}

      <section className="lab-card">
        <p className="lab-section-title">Stage</p>
        <p className="mt-2 text-sm text-[var(--lab-text-secondary)]">{stage}</p>
      </section>
    </div>
  );
}
