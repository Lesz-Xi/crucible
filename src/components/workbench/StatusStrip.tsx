'use client';

import type { ReactNode } from 'react';

export function StatusStrip({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--lab-border)] bg-[var(--lab-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        {left}
        {right ? <div>{right}</div> : <div />}
      </div>
    </div>
  );
}
