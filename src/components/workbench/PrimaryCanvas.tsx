'use client';

import type { ReactNode } from 'react';

export function PrimaryCanvas({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto">{children}</div>;
}
