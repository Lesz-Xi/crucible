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
      <header className="border-b border-[var(--lab-border)] bg-[var(--lab-panel)] px-4 py-4">
        <p className="lab-section-title">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">{subtitle}</p> : null}
      </header>
      <div className="lab-scroll-region flex-1 p-4">{children}</div>
    </div>
  );
}
