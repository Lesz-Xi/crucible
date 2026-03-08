'use client';

import { useState } from 'react';
import { PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppDashboardShell } from '@/components/dashboard/AppDashboardShell';
import { WorkbenchEvidenceRail } from '@/components/workbench/WorkbenchEvidenceRail';
import type { WorkbenchShellProps } from '@/types/workbench';

export function WorkbenchShell({
  feature,
  mainTopbar,
  mainContent,
  inputArea,
  evidenceRail,
  mainMode = 'canvas',
}: WorkbenchShellProps) {
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  return (
    <AppDashboardShell feature={feature}>
      <div className={cn('shell app-shell', `main-mode-${mainMode}`)}>
        <button type="button" className="mobile-rail-trigger" onClick={() => setMobileRailOpen(true)} aria-label="Open evidence rail">
          <PanelRightOpen className="h-4 w-4" />
        </button>

        <main className="main">
          {mainTopbar ? <div className="main-topbar visible">{mainTopbar}</div> : null}
          <div className="main-content-shell">{mainContent}</div>
          {inputArea ? <div className="input-area">{inputArea}</div> : null}
        </main>
        <WorkbenchEvidenceRail config={evidenceRail} />

        {mobileRailOpen ? (
          <div className="mobile-rail-overlay" onClick={() => setMobileRailOpen(false)}>
            <div className="mobile-rail-panel" onClick={(event) => event.stopPropagation()}>
              <WorkbenchEvidenceRail config={evidenceRail} />
            </div>
          </div>
        ) : null}
      </div>
    </AppDashboardShell>
  );
}
