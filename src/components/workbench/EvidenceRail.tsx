'use client';

import type { ReactNode } from 'react';

export interface EvidenceRailProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function EvidenceRail({ title, subtitle, children }: EvidenceRailProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-[var(--lab-border)] px-4 py-4">
        <p className="lab-section-title">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">{subtitle}</p> : null}
      </header>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
