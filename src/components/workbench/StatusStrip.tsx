'use client';

import type { ReactNode } from 'react';

export function StatusStrip({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 bg-[var(--lab-bg)]/65 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 py-2 md:px-6 lg:px-8">
        {left}
        {right ? <div>{right}</div> : <div />}
      </div>
    </div>
  );
}
