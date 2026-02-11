'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface WorkbenchShellProps {
  contextRail: ReactNode;
  primary: ReactNode;
  evidenceRail: ReactNode;
  statusStrip?: ReactNode;
  className?: string;
}

export function WorkbenchShell({ contextRail, primary, evidenceRail, statusStrip, className }: WorkbenchShellProps) {
  return (
    <div className={cn('lab-shell min-h-screen w-full', className)}>
      {statusStrip}

      <div className="mx-auto max-w-[1720px] px-4 pb-6 pt-4 md:px-6 lg:px-8">
        <div className="hidden lg:grid lg:grid-cols-[320px_minmax(720px,1fr)_360px] lg:gap-4">
          <aside className="lab-panel h-[calc(100vh-136px)] overflow-hidden">{contextRail}</aside>
          <main className="lab-panel h-[calc(100vh-136px)] overflow-hidden">{primary}</main>
          <aside className="lab-panel h-[calc(100vh-136px)] overflow-hidden">{evidenceRail}</aside>
        </div>

        <div className="hidden md:grid lg:hidden md:grid-cols-[300px_minmax(0,1fr)] md:gap-4">
          <aside className="lab-panel h-[calc(100vh-136px)] overflow-hidden">{contextRail}</aside>
          <main className="lab-panel h-[calc(100vh-136px)] overflow-hidden">{primary}</main>
        </div>

        <div className="md:hidden space-y-4">
          <section className="lab-panel-elevated p-3">{contextRail}</section>
          <section className="lab-panel p-2">{primary}</section>
          <section className="lab-panel-elevated p-3">{evidenceRail}</section>
        </div>
      </div>
    </div>
  );
}
