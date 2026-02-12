'use client';

import type { ReactNode } from 'react';

export function PrimaryCanvas({ children }: { children: ReactNode }) {
  return <div className="lab-scroll-region h-full">{children}</div>;
}
