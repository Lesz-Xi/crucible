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
}

export function WorkbenchShell({
  contextRail,
  primary,
  evidenceRail,
  statusStrip,
  className,
  contextRailOpen = true,
  evidenceRailOpen = true,
}: WorkbenchShellProps) {
  const [mobileTab, setMobileTab] = useState<'context' | 'primary' | 'evidence'>('primary');

  const desktopGridCols = contextRailOpen && evidenceRailOpen
    ? '320px minmax(720px,1fr) 360px'
    : contextRailOpen
      ? '320px minmax(760px,1fr)'
      : evidenceRailOpen
        ? 'minmax(760px,1fr) 360px'
        : 'minmax(920px,1fr)';

  const tabletGridCols = contextRailOpen ? '300px minmax(0,1fr)' : 'minmax(0,1fr)';

  return (
    <AppDashboardShell>
      <div className={cn('lab-shell min-h-screen w-full', className)}>
        {statusStrip}

        <div className="mx-auto max-w-[1760px] px-4 pb-6 pt-4 md:px-6 lg:px-8">
          <div className="hidden lg:grid lg:gap-4" style={{ gridTemplateColumns: desktopGridCols }}>
            {contextRailOpen ? <aside className="lab-panel h-[calc(100vh-132px)] overflow-hidden">{contextRail}</aside> : null}
            <main className="lab-panel-elevated h-[calc(100vh-132px)] overflow-hidden">{primary}</main>
            {evidenceRailOpen ? <aside className="lab-panel h-[calc(100vh-132px)] overflow-hidden">{evidenceRail}</aside> : null}
          </div>

          <div className="hidden md:grid lg:hidden md:gap-4" style={{ gridTemplateColumns: tabletGridCols }}>
            {contextRailOpen ? <aside className="lab-panel h-[calc(100vh-132px)] overflow-hidden">{contextRail}</aside> : null}
            <main className="lab-panel-elevated h-[calc(100vh-132px)] overflow-hidden">{primary}</main>
          </div>

          <div className="md:hidden">
            <div className="mb-3 grid grid-cols-3 gap-2">
              <button type="button" className="lab-nav-pill justify-center" data-active={mobileTab === 'context'} onClick={() => setMobileTab('context')}>Context</button>
              <button type="button" className="lab-nav-pill justify-center" data-active={mobileTab === 'primary'} onClick={() => setMobileTab('primary')}>Canvas</button>
              <button type="button" className="lab-nav-pill justify-center" data-active={mobileTab === 'evidence'} onClick={() => setMobileTab('evidence')}>Evidence</button>
            </div>

            {mobileTab === 'context' ? <section className="lab-panel-elevated">{contextRail}</section> : null}
            {mobileTab === 'primary' ? <section className="lab-panel-elevated">{primary}</section> : null}
            {mobileTab === 'evidence' ? <section className="lab-panel-elevated">{evidenceRail}</section> : null}
          </div>
        </div>
      </div>
    </AppDashboardShell>
  );
}
