'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppDashboardShell } from '@/components/dashboard/AppDashboardShell';

export interface WorkbenchShellProps {
  contextRail: ReactNode;
  primary: ReactNode;
  evidenceRail: ReactNode;
  statusStrip?: ReactNode;
  className?: string;
  contextRailOpen?: boolean;
  evidenceRailOpen?: boolean;
  readingMode?: boolean;
}

export function WorkbenchShell({
  contextRail,
  primary,
  evidenceRail,
  statusStrip,
  className,
  contextRailOpen = true,
  evidenceRailOpen = true,
  readingMode = false,
}: WorkbenchShellProps) {
  const [mobileTab, setMobileTab] = useState<'context' | 'primary' | 'evidence'>('primary');
  const isChatFeature = className?.includes('feature-chat') ?? false;

  const desktopGridCols = contextRailOpen && evidenceRailOpen
    ? '320px minmax(720px,1fr) 360px'
    : contextRailOpen
      ? '320px minmax(760px,1fr)'
      : evidenceRailOpen
        ? 'minmax(760px,1fr) 360px'
        : 'minmax(920px,1fr)';

  const tabletGridCols = contextRailOpen ? '300px minmax(0,1fr)' : 'minmax(0,1fr)';

  const panelHeight = isChatFeature ? 'calc(100svh - 2px)' : 'calc(100svh - 112px)';

  return (
    <AppDashboardShell readingMode={readingMode}>
      <div className={cn('lab-shell min-h-screen w-full', className)}>
        {statusStrip}

        <div
          className={cn(
            'mx-auto max-w-[1760px] px-4 md:px-6 lg:px-8',
            isChatFeature ? 'max-w-none pb-0 pt-0 pl-0 md:pl-0 lg:pl-0' : 'pb-5 pt-2',
          )}
        >
          <div className="hidden lg:grid lg:gap-4" style={{ gridTemplateColumns: desktopGridCols }}>
            {contextRailOpen ? <aside className="lab-panel overflow-hidden" style={{ height: panelHeight }}>{contextRail}</aside> : null}
            <main className={cn(isChatFeature ? 'lab-panel' : 'lab-panel-elevated', 'overflow-hidden')} style={{ height: panelHeight }}>{primary}</main>
            {evidenceRailOpen ? <aside className="lab-panel overflow-hidden" style={{ height: panelHeight }}>{evidenceRail}</aside> : null}
          </div>

          <div className="hidden md:grid lg:hidden md:gap-4" style={{ gridTemplateColumns: tabletGridCols }}>
            {contextRailOpen ? <aside className="lab-panel overflow-hidden" style={{ height: panelHeight }}>{contextRail}</aside> : null}
            <main className={cn(isChatFeature ? 'lab-panel' : 'lab-panel-elevated', 'overflow-hidden')} style={{ height: panelHeight }}>{primary}</main>
          </div>

          <div className="md:hidden">
            <div className={cn('mb-3 grid gap-2', contextRailOpen && evidenceRailOpen ? 'grid-cols-3' : contextRailOpen || evidenceRailOpen ? 'grid-cols-2' : 'grid-cols-1')}>
              {contextRailOpen ? (
                <button type="button" className="lab-nav-pill justify-center" data-active={mobileTab === 'context'} onClick={() => setMobileTab('context')}>Context</button>
              ) : null}
              <button type="button" className="lab-nav-pill justify-center" data-active={mobileTab === 'primary'} onClick={() => setMobileTab('primary')}>Canvas</button>
              {evidenceRailOpen ? (
                <button type="button" className="lab-nav-pill justify-center" data-active={mobileTab === 'evidence'} onClick={() => setMobileTab('evidence')}>Evidence</button>
              ) : null}
            </div>

            {contextRailOpen && mobileTab === 'context' ? <section className={isChatFeature ? 'lab-panel' : 'lab-panel-elevated'}>{contextRail}</section> : null}
            {mobileTab === 'primary' ? <section className={isChatFeature ? 'lab-panel' : 'lab-panel-elevated'}>{primary}</section> : null}
            {evidenceRailOpen && mobileTab === 'evidence' ? <section className={isChatFeature ? 'lab-panel' : 'lab-panel-elevated'}>{evidenceRail}</section> : null}
          </div>
        </div>
      </div>
    </AppDashboardShell>
  );
}
