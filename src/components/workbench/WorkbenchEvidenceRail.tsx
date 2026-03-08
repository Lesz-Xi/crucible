'use client';

import { Activity, BookOpen, Database, FileText, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkbenchEvidenceRailConfig } from '@/types/workbench';

interface WorkbenchEvidenceRailProps {
  config: WorkbenchEvidenceRailConfig;
}

const LEVELS = [
  { id: 'L1', label: 'Association' },
  { id: 'L2', label: 'Intervention' },
  { id: 'L3', label: 'Counterfactual' },
] as const;

export function WorkbenchEvidenceRail({ config }: WorkbenchEvidenceRailProps) {
  return (
    <aside className="rail">
      <div className="rail-header">
        <span className={cn('rail-indicator', config.live && 'live')} />
        <div className="min-w-0">
          <div className="rail-title">Evidence Rail</div>
          <div className="rail-sub">{config.subtitle || 'Live posture and provenance'}</div>
        </div>
      </div>

      <div className="rail-body">
        <section className="rail-section">
          <div className="rail-section-head">
            <Activity className="h-3.5 w-3.5" />
            <span>Causal Density</span>
          </div>
          <div className="rung-grid">
            {LEVELS.map((level) => (
              <div key={level.id} className={cn('rung', config.causalDensity.activeLevel === level.id && 'active')}>
                <div className="rung-level">{level.id}</div>
                <div className="rung-label">{level.label}</div>
              </div>
            ))}
          </div>
          <div className="rung-status">{config.causalDensity.status}</div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Alignment Posture</span>
          </div>
          <div className={cn('rail-info-card', config.alignmentPosture.tone !== 'neutral' && config.alignmentPosture.tone)}>
            {config.alignmentPosture.text}
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <Database className="h-3.5 w-3.5" />
            <span>Model Provenance</span>
          </div>
          <div className="rail-info-card">
            {config.modelProvenance.title ? <strong className="block pb-1 text-[11px] text-[var(--text-2)]">{config.modelProvenance.title}</strong> : null}
            <div className="text-[12px] leading-[1.55] text-[var(--text-2)]">{config.modelProvenance.text}</div>
            {config.modelProvenance.actions?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {config.modelProvenance.actions.map((action) => (
                  action.href ? (
                    <a key={`${action.label}-${action.href}`} className="rail-link" href={action.href} target="_blank" rel="noreferrer">
                      {action.label}
                    </a>
                  ) : (
                    <button key={action.label} type="button" className="rail-link" onClick={action.onClick}>
                      {action.label}
                    </button>
                  )
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <FileText className="h-3.5 w-3.5" />
            <span>Active Domain</span>
          </div>
          <div className="rail-info-card unavailable">
            <strong>{config.activeDomain.label || 'unavailable'}</strong>
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Scientific Evidence</span>
          </div>
          {config.scientificEvidence.length > 0 ? (
            <div className="space-y-1">
              {config.scientificEvidence.slice(0, 6).map((item) => {
                const content = (
                  <>
                    <div className="file-icon">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="file-info">
                      <div className="file-name">{item.title}</div>
                      <div className="file-meta">
                        <span>{item.meta}</span>
                        {item.badge ? <span>{item.badge}</span> : null}
                      </div>
                    </div>
                  </>
                );

                return item.href ? (
                  <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="evidence-file">
                    {content}
                  </a>
                ) : (
                  <div key={item.id} className="evidence-file">
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="unavailable">
              <strong>unavailable</strong>
              No scientific evidence is available for this run.
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
