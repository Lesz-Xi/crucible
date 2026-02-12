'use client';

import type { ReactElement } from 'react';
import { Activity, CheckCircle2, Circle, FlaskConical, Loader2, PauseCircle, XCircle } from 'lucide-react';
import type { HybridTimelineStageRecord } from '@/types/hybrid-timeline';

export interface HybridProcessingTimelineV2Props {
  stages: HybridTimelineStageRecord[];
  latestSignal: string;
  startedAt?: string;
  nowIso: string;
  passCount: number;
  blockedCount: number;
}

function formatDuration(ms?: number): string {
  if (!ms || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  return `${seconds}s`;
}

function elapsedSince(startedAt?: string, nowIso?: string): string {
  if (!startedAt || !nowIso) return '—';
  const ms = Date.parse(nowIso) - Date.parse(startedAt);
  return formatDuration(ms);
}

function iconForStage(stage: HybridTimelineStageRecord) {
  if (stage.state === 'done') return <CheckCircle2 className="h-5 w-5 text-[var(--lab-accent-moss)]" />;
  if (stage.state === 'active') return <Loader2 className="h-5 w-5 animate-spin text-[var(--lab-accent-earth)]" />;
  if (stage.state === 'blocked') return <XCircle className="h-5 w-5 text-red-700" />;
  if (stage.state === 'skipped') return <PauseCircle className="h-5 w-5 text-[var(--lab-text-tertiary)]" />;
  return <Circle className="h-5 w-5 text-[var(--lab-text-tertiary)]" />;
}

function chip(label: string, value: string | number | undefined) {
  return (
    <span className="lab-timeline-telemetry-chip" key={label}>
      {label}: {value ?? '—'}
    </span>
  );
}

function stageTelemetry(stage: HybridTimelineStageRecord, nowIso: string): ReactElement[] {
  const t = stage.telemetry || {};
  const elapsed = stage.state === 'active'
    ? elapsedSince(stage.startedAt, nowIso)
    : formatDuration(t.durationMs as number | undefined);

  const entries: ReactElement[] = [chip('elapsed', elapsed)];
  if (typeof t.processedFiles === 'number') entries.push(chip('processed', `${t.processedFiles}/${t.totalFiles ?? '?'}`));
  if (typeof t.companyCount === 'number') entries.push(chip('companies', t.companyCount));
  if (typeof t.resolvedEntities === 'number') entries.push(chip('entities', t.resolvedEntities));
  if (typeof t.rows === 'number') entries.push(chip('rows', t.rows));
  if (typeof t.highConfidenceRows === 'number') entries.push(chip('high_conf', t.highConfidenceRows));
  if (typeof t.proofCount === 'number') entries.push(chip('proofs', t.proofCount));
  if (typeof t.passCount === 'number') entries.push(chip('pass', t.passCount));
  if (typeof t.blockedCount === 'number') entries.push(chip('blocked', t.blockedCount));
  if (typeof t.decision === 'string') entries.push(chip('decision', t.decision));
  if (typeof t.reason === 'string') entries.push(chip('reason', t.reason));
  return entries;
}

export function HybridProcessingTimelineV2({
  stages,
  latestSignal,
  startedAt,
  nowIso,
  passCount,
  blockedCount,
}: HybridProcessingTimelineV2Props) {
  return (
    <section className="lab-timeline-shell flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="lab-section-title">Causal Process Spine</p>
          <h3 className="lab-panel-heading mt-1">Synthesis Protocol in Flight</h3>
          <p className="mt-1 text-sm text-[var(--lab-text-secondary)]">Each stage records deterministic runtime evidence as the run advances.</p>
        </div>
        <span className="lab-chip-mono">LIVE</span>
      </div>

      <div className="lab-timeline-spine flex-1 pr-2">
        {stages.map((stage, index) => (
          <article
            key={stage.stage}
            className={`lab-timeline-node ${stage.state === 'active' ? 'lab-timeline-node-active' : ''} ${stage.state === 'done' ? 'lab-timeline-node-done' : ''} ${stage.state === 'skipped' ? 'lab-timeline-node-skipped' : ''}`}
          >
            <div className="lab-timeline-node-marker">
              {iconForStage(stage)}
              {index < stages.length - 1 ? <span className="lab-timeline-node-line" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-serif text-2xl text-[var(--lab-text-primary)]">{stage.title}</p>
                {stage.optional ? <span className="lab-chip-mono">optional</span> : null}
              </div>
              <p className="text-sm text-[var(--lab-text-secondary)]">{stage.rationale}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stageTelemetry(stage, nowIso)}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="lab-divider-gradient my-4" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--lab-text-secondary)]">
          <Activity className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <span>Signal: {latestSignal}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="lab-timeline-telemetry-chip">runtime: {elapsedSince(startedAt, nowIso)}</span>
          <span className="lab-timeline-telemetry-chip">pass: {passCount}</span>
          <span className="lab-timeline-telemetry-chip">blocked: {blockedCount}</span>
          <span className="lab-timeline-telemetry-chip"><FlaskConical className="mr-1 inline h-3.5 w-3.5" />protocol active</span>
        </div>
      </div>
    </section>
  );
}
