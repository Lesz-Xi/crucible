'use client';

import type { ReactNode } from 'react';

export interface WorkbenchDrawerPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function WorkbenchDrawerPanel({ title, subtitle, children }: WorkbenchDrawerPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="workbench-drawer-header">
        <p className="lab-section-title">{title}</p>
        {subtitle ? <p className="lab-rail-subtitle">{subtitle}</p> : null}
      </header>
      <div className="lab-scroll-region workbench-drawer-body flex-1">{children}</div>
    </div>
  );
}
