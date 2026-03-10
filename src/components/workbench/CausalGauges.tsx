'use client';

import { Activity, GitMerge, ShieldCheck } from 'lucide-react';

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
  const rung = density?.score === 3 ? 3 : density?.score === 2 ? 2 : density?.score === 1 ? 1 : null;
  const statusLabel = rung === 3 ? 'Counterfactual' : rung === 2 ? 'Intervention' : rung === 1 ? 'Association' : 'Awaiting scored output';

  return (
    <>
      <section className="rail-section">
        <div className="rail-section-head">
          <Activity className="h-3 w-3" />
          <span>Causal Density</span>
        </div>

        <div className="rounded-[12px] border border-[var(--lab-border)] bg-[var(--lab-bg-secondary)] p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { level: 1, short: 'L1', label: 'Association' },
              { level: 2, short: 'L2', label: 'Intervention' },
              { level: 3, short: 'L3', label: 'Counterfactual' },
            ].map((item) => {
              const active = rung === item.level;
              return (
                <div
                  key={item.level}
                  className="rounded-[8px] border border-[var(--lab-border)] px-2 py-3 text-center transition-colors"
                  data-active={active ? 'true' : 'false'}
                  style={active ? { background: 'var(--bg-active)', borderColor: 'var(--accent-border)' } : undefined}
                >
                  <p className="text-[14px] font-semibold text-[var(--text-1)]">{item.short}</p>
                  <p className="mt-1 text-[10px] text-[var(--text-2)]">{item.label}</p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-[11px] font-semibold text-[var(--text-1)]">
            {rung ? `Active rung: L${rung}` : 'Active rung: unavailable'}
          </p>
        </div>

        <p className="mt-3 text-center text-[11.5px] text-[var(--text-2)]">{statusLabel}</p>
      </section>

      <section className="rail-section">
        <div className="rail-section-head">
          <ShieldCheck className="h-3 w-3 text-[var(--green)]" />
          <span>Alignment Posture</span>
        </div>
        <div className="rail-info-card green">
          {posture}
        </div>
      </section>

      <section className="rail-section">
        <div className="rail-section-head">
          <GitMerge className="h-3 w-3" />
          <span>Model Provenance</span>
        </div>
        {provenanceAvailable ? (
          <div className="rounded-[8px] border border-[var(--lab-border)] bg-[var(--bg-2)] p-3">
            <p className="text-xs font-semibold text-[var(--text-1)]">
              {modelKey === 'default' ? 'Configured default model' : modelKey}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-2)]">
              Verified model provenance was emitted for this run.
            </p>
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--lab-border)] bg-[var(--bg-2)] p-3">
            <p className="text-xs font-semibold text-[var(--text-1)]">unavailable</p>
            <p className="mt-1 text-[11px] text-[var(--text-2)]">
              No verified model provenance was emitted for this run.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
