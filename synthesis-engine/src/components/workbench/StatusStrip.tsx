'use client';

import type { ReactNode } from 'react';

export function StatusStrip({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--lab-border)] bg-[var(--lab-bg)]/78 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1760px] items-center justify-between px-4 py-2.5 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 [svg]:translate-y-[0.5px]">{left}</div>
        {right ? <div className="hidden shrink-0 md:block">{right}</div> : <div />}
      </div>
    </div>
  );
}
