'use client';

import { CheckCircle2, Clock3, PauseCircle, XCircle } from 'lucide-react';
import type { HybridTimelineReceipt } from '@/types/hybrid-timeline';

export interface HybridTimelineSummaryStripV2Props {
  receipt: HybridTimelineReceipt | null;
  gateDecision?: 'pass' | 'recover' | 'fail' | null;
}

function formatDuration(ms?: number): string {
  if (!ms || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 1000)}s`;
}

export function HybridTimelineSummaryStripV2({ receipt, gateDecision }: HybridTimelineSummaryStripV2Props) {
  if (!receipt) return null;

  const completed = receipt.stages.filter((stage) => stage.state === 'done').length;
  const skipped = receipt.stages.filter((stage) => stage.state === 'skipped').length;
  const blocked = receipt.stages.filter((stage) => stage.state === 'blocked').length;
  const completedStage = receipt.stages.find((stage) => stage.stage === 'completed');
  const completedReason = typeof completedStage?.telemetry?.reason === 'string' ? completedStage.telemetry.reason : null;
  const wasCancelled = completedReason === 'client_cancelled';

  return (
    <section className="lab-timeline-receipt-strip mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="lab-section-title !mb-0">Scientific Receipt</p>
          <span className="lab-timeline-telemetry-chip"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{formatDuration(receipt.totalDurationMs)}</span>
          <span className="lab-timeline-telemetry-chip"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-[var(--lab-accent-moss)]" />done {completed}</span>
          <span className="lab-timeline-telemetry-chip"><PauseCircle className="mr-1 inline h-3.5 w-3.5 text-[var(--lab-text-tertiary)]" />skipped {skipped}</span>
          {blocked > 0 ? <span className="lab-timeline-telemetry-chip"><XCircle className="mr-1 inline h-3.5 w-3.5 text-red-700" />blocked {blocked}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {wasCancelled ? <span className="lab-chip-mono">run: cancelled</span> : null}
          <span className="lab-chip-mono">gate: {gateDecision || 'n/a'}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--lab-text-secondary)]">
        {wasCancelled
          ? 'Run cancelled by user before completion.'
          : receipt.latestSignal || 'Timeline summary captured from live synthesis protocol.'}
      </p>
    </section>
  );
}
