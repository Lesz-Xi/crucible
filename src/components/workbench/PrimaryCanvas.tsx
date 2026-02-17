'use client';

import type { ReactNode } from 'react';

export function PrimaryCanvas({ children }: { children: ReactNode }) {
  return <div className="lab-scroll-region h-full px-4 py-4 md:px-5 md:py-5">{children}</div>;
}
