'use client';

import { BookOpen, Database, FileText, ShieldCheck, SlidersHorizontal, Waves } from 'lucide-react';
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

const TONE_LABEL: Record<NonNullable<WorkbenchEvidenceRailConfig['alignmentPosture']['tone']>, string> = {
  green: 'Ready',
  amber: 'Guarded',
  red: 'Blocked',
  neutral: 'Pending',
};

function normalizeStatus(status: string) {
  const trimmed = status.trim();
  if (!trimmed) {
    return { primary: 'Active rung: unavailable', secondary: 'Awaiting scored output.' };
  }

  if (trimmed.toLowerCase().startsWith('active rung:')) {
    return { primary: trimmed, secondary: 'Awaiting scored output.' };
  }

  return {
    primary: 'Active rung: unavailable',
    secondary: trimmed.endsWith('.') ? trimmed : `${trimmed}.`,
  };
}

function evidenceMetaParts(meta: string) {
  return meta
    .split(/•|\||·/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function deriveConfidenceLabel(tone: WorkbenchEvidenceRailConfig['alignmentPosture']['tone']) {
  switch (tone) {
    case 'green':
      return 'High';
    case 'amber':
      return 'Medium';
    case 'red':
      return 'Low';
    default:
      return 'Unscored';
  }
}

function deriveConfidencePercent(tone: WorkbenchEvidenceRailConfig['alignmentPosture']['tone']) {
  switch (tone) {
    case 'green':
      return 82;
    case 'amber':
      return 58;
    case 'red':
      return 24;
    default:
      return 8;
  }
}

export function WorkbenchEvidenceRail({ config }: WorkbenchEvidenceRailProps) {
  const status = normalizeStatus(config.causalDensity.status);
  const confidenceLabel = deriveConfidenceLabel(config.alignmentPosture.tone);
  const confidencePercent = deriveConfidencePercent(config.alignmentPosture.tone);
  const activeLevelLabel = LEVELS.find((level) => level.id === config.causalDensity.activeLevel)?.label || 'Unavailable';
  const evidenceCount = config.scientificEvidence.length;
  const evidenceStateLabel = evidenceCount > 0 ? `${evidenceCount} evidence record${evidenceCount === 1 ? '' : 's'}` : 'No evidence records';
  const hasModelProvenance = Boolean(config.modelProvenance.title && config.modelProvenance.title !== 'unavailable');
  const hasActiveDomain = Boolean(config.activeDomain.label && config.activeDomain.label !== 'unavailable');

  return (
    <aside className="rail">
      <div className="rail-header">
        <div className="rail-header-status">
          <span className={cn('rail-indicator', config.live && 'live')} />
          <div className="min-w-0">
            <div className="rail-title">Evidence Rail</div>
            <div className="rail-sub">{config.subtitle || 'Live causal posture'}</div>
          </div>
        </div>
        <button type="button" className="rail-settings-btn" aria-label="Evidence rail settings">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rail-body">
        <section className="rail-section">
          <div className="rail-section-head">
            <div className="rail-section-icon-shell">
              <Waves className="h-3.5 w-3.5" />
            </div>
            <span>Causal Density</span>
            <span className={cn('rail-status-chip', config.causalDensity.activeLevel ? 'is-live' : 'is-neutral')}>
              {config.causalDensity.activeLevel || 'pending'}
            </span>
          </div>
          <div className="rail-module">
            <div className="rail-summary-card">
              <div className="rail-summary-meta">Active rung</div>
              <div className="rail-summary-title">{activeLevelLabel}</div>
              <div className="rail-summary-copy">{status.secondary}</div>
            </div>
            <div className="rung-bars">
              {LEVELS.map((level) => (
                <div key={level.id} className={cn('rung-bar-row', config.causalDensity.activeLevel === level.id && 'active')}>
                  <span className="rung-row-level">{level.id}</span>
                  <div className="rung-track">
                    <div className="rung-fill" />
                  </div>
                  <span className="rung-row-label">{level.label}</span>
                </div>
              ))}
            </div>
            <div className="rung-status-line">
              {status.primary.includes('unavailable') ? (
                <>
                  Active rung: <strong>unavailable</strong><br />
                  {status.secondary}
                </>
              ) : (
                <>
                  {status.primary}<br />
                  {status.secondary}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <div className="rail-section-icon-shell">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span>Alignment Posture</span>
            <span className={cn('rail-status-chip', `is-${config.alignmentPosture.tone}`)}>{TONE_LABEL[config.alignmentPosture.tone]}</span>
          </div>
          <div className="rail-module">
            <div className={cn('rail-info-card', config.alignmentPosture.tone !== 'neutral' && config.alignmentPosture.tone)}>
              {config.alignmentPosture.text}
            </div>
            <div className="confidence-meter">
              <div className="confidence-label">
                <span>Confidence</span>
                <strong>{confidenceLabel}</strong>
              </div>
              <div className="meter-track">
                <div className={cn('meter-fill', `is-${config.alignmentPosture.tone}`)} style={{ width: `${confidencePercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <div className="rail-section-icon-shell">
              <Database className="h-3.5 w-3.5" />
            </div>
            <span>Model Provenance</span>
            <span className={cn('rail-status-chip', hasModelProvenance ? 'is-live' : 'is-neutral')}>
              {hasModelProvenance ? 'verified' : 'pending'}
            </span>
          </div>
          <div className="rail-module">
            <div className={cn('rail-info-card rail-provenance-card', !config.modelProvenance.title && 'is-empty')}>
              {config.modelProvenance.title ? <strong className="rail-provenance-title">{config.modelProvenance.title}</strong> : null}
              <div className="rail-provenance-copy">{config.modelProvenance.text}</div>
              {config.modelProvenance.actions?.length ? (
                <div className="rail-actions">
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
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <div className="rail-section-icon-shell">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span>Active Domain</span>
            <span className={cn('rail-status-chip', hasActiveDomain ? 'is-live' : 'is-neutral')}>
              {hasActiveDomain ? 'routed' : 'pending'}
            </span>
          </div>
          <div className="rail-module rail-module-compact">
            <div className="rail-domain-card">
              <span className="rail-summary-meta">Current domain</span>
              <strong>{config.activeDomain.label || 'unavailable'}</strong>
            </div>
          </div>
        </section>

        <section className="rail-section">
          <div className="rail-section-head">
            <div className="rail-section-icon-shell">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <span>Scientific Evidence</span>
            <span className={cn('rail-status-chip', evidenceCount > 0 ? 'is-live' : 'is-neutral')}>{evidenceStateLabel}</span>
          </div>
          <div className="rail-module rail-module-evidence">
            {config.scientificEvidence.length > 0 ? (
              <div className="space-y-1">
                {config.scientificEvidence.slice(0, 6).map((item) => {
                  const metaParts = evidenceMetaParts(item.meta);
                  const content = (
                    <>
                      <div className="file-icon">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="file-info">
                        <div className="file-name">{item.title}</div>
                        <div className="file-meta">
                          {item.badge ? <span className="file-badge">{item.badge}</span> : null}
                          {metaParts.length > 0 ? metaParts.map((part) => (
                            <span key={`${item.id}-${part}`}>{part}</span>
                          )) : <span>{item.meta}</span>}
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
              <div className="rail-info-card rail-empty-card">
                <strong>unavailable</strong>
                No scientific evidence is available for this run.
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
