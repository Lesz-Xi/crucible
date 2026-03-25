'use client';

import { useEffect, useState } from 'react';
import { PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppDashboardShell } from '@/components/dashboard/AppDashboardShell';
import { AppShellChromeProvider } from '@/components/dashboard/AppShellChromeContext';
import { WorkbenchEvidenceRail } from '@/components/workbench/WorkbenchEvidenceRail';
import type { WorkbenchEvidenceRailConfig, WorkbenchShellProps } from '@/types/workbench';

export function WorkbenchShell({
  feature,
  mainTopbar,
  mainContent,
  inputArea,
  evidenceRail,
  mainMode = 'canvas',
  focusModeReady = true,
}: WorkbenchShellProps) {
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [evidenceRailOverride, setEvidenceRailOverride] = useState<WorkbenchEvidenceRailConfig | null>(null);
  const [evidenceRailVisible, setEvidenceRailVisible] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const supportsEvidenceRail = feature === 'chat';
  const resolvedEvidenceRail = evidenceRailOverride || evidenceRail || null;
  const focusReadMode = focusMode && focusModeReady;
  const showEvidenceRail = supportsEvidenceRail && evidenceRailVisible && !focusMode && Boolean(resolvedEvidenceRail);

  useEffect(() => {
    if (!showEvidenceRail) setMobileRailOpen(false);
  }, [showEvidenceRail]);

  return (
    <AppShellChromeProvider
      value={{
        evidenceRailOverride,
        setEvidenceRailOverride,
        evidenceRailVisible,
        setEvidenceRailVisible,
        focusMode,
        setFocusMode,
      }}
    >
      <AppDashboardShell feature={feature} focusModeActive={focusMode}>
        <div className={cn('dark shell app-shell', `main-mode-${mainMode}`, !showEvidenceRail && 'rail-hidden', focusMode && 'shell-focus-mode')}>
          {showEvidenceRail ? (
            <button type="button" className="mobile-rail-trigger" onClick={() => setMobileRailOpen(true)} aria-label="Open evidence rail">
              <PanelRightOpen className="h-4 w-4" />
            </button>
          ) : null}

          <main className="main">
            <div className="main-content-shell" data-main-surface={feature === 'chat' ? 'editorial' : 'gridded'}>
              {mainTopbar ? <div className="main-topbar-inline">{mainTopbar}</div> : null}
              {mainContent}
            </div>
            {inputArea && !focusReadMode ? <div className="input-area">{inputArea}</div> : null}
          </main>
          {showEvidenceRail && resolvedEvidenceRail ? <WorkbenchEvidenceRail config={resolvedEvidenceRail} /> : null}

          {showEvidenceRail && mobileRailOpen ? (
            <div className="mobile-rail-overlay" onClick={() => setMobileRailOpen(false)}>
              <div className="mobile-rail-panel" onClick={(event) => event.stopPropagation()}>
                {resolvedEvidenceRail ? <WorkbenchEvidenceRail config={resolvedEvidenceRail} /> : null}
              </div>
            </div>
          ) : null}
        </div>
      </AppDashboardShell>
    </AppShellChromeProvider>
  );
}
