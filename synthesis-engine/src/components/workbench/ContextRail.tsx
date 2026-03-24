'use client';

import type { ReactNode } from 'react';

export interface ContextRailProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ContextRail({ title, subtitle, children }: ContextRailProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="lab-rail-header">
        <p className="lab-section-title">{title}</p>
        {subtitle ? <p className="lab-rail-subtitle">{subtitle}</p> : null}
      </header>
      <div className="lab-scroll-region lab-rail-body flex-1">{children}</div>
    </div>
  );
}
