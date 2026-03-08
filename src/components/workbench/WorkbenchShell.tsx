'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppDashboardShell } from '@/components/dashboard/AppDashboardShell';
import { WorkbenchDock } from '@/components/workbench/WorkbenchDock';
import type {
  CommandHubItem,
  WorkbenchDockConfig,
  WorkbenchDockTab,
  WorkbenchDrawerConfig,
} from '@/types/workbench';

export interface WorkbenchShellProps {
  feature: 'chat' | 'hybrid' | 'legal' | 'report' | 'education' | 'lab';
  header?: ReactNode;
  navRail?: ReactNode;
  primary: ReactNode;
  drawer?: WorkbenchDrawerConfig;
  dock?: WorkbenchDockConfig;
  dockDefaultTab?: WorkbenchDockTab;
  dockInitiallyOpen?: boolean;
  readingMode?: boolean;
  commandItems?: CommandHubItem[];
}

function resolveInitialTab(dock: WorkbenchDockConfig | undefined, preferred: WorkbenchDockTab | undefined): WorkbenchDockTab {
  if (preferred && dock?.tabs.some((tab) => tab.id === preferred)) {
    return preferred;
  }
  return dock?.tabs[0]?.id || 'evidence';
}

export function WorkbenchShell({
  feature,
  header,
  navRail,
  primary,
  drawer,
  dock,
  dockDefaultTab,
  dockInitiallyOpen = false,
  readingMode = false,
  commandItems,
}: WorkbenchShellProps) {
  const storageKey = `workbench-preferences:${feature}`;
  const defaultTab = resolveInitialTab(dock, dockDefaultTab);
  const [dockOpen, setDockOpen] = useState(dockInitiallyOpen);
  const [dockHeight, setDockHeight] = useState(260);
  const [activeDockTab, setActiveDockTab] = useState<WorkbenchDockTab>(defaultTab);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { dockOpen?: boolean; dockHeight?: number; dockTab?: WorkbenchDockTab };
      if (typeof saved.dockOpen === 'boolean') setDockOpen(saved.dockOpen);
      if (typeof saved.dockHeight === 'number') setDockHeight(saved.dockHeight);
      if (saved.dockTab && dock?.tabs.some((tab) => tab.id === saved.dockTab)) {
        setActiveDockTab(saved.dockTab);
      }
    } catch {
      // Ignore malformed local preferences.
    }
  }, [dock?.tabs, storageKey]);

  useEffect(() => {
    if (!dock?.tabs.length) return;
    if (!dock.tabs.some((tab) => tab.id === activeDockTab)) {
      setActiveDockTab(resolveInitialTab(dock, dockDefaultTab));
    }
  }, [activeDockTab, dock, dockDefaultTab]);

  useEffect(() => {
    if (!dockDefaultTab || !dock?.tabs.some((tab) => tab.id === dockDefaultTab)) return;
    setActiveDockTab(dockDefaultTab);
  }, [dock, dockDefaultTab]);

  useEffect(() => {
    if (dockInitiallyOpen) {
      setDockOpen(true);
    }
  }, [dockInitiallyOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          density: 'dense',
          dockOpen,
          dockHeight,
          dockTab: activeDockTab,
          drawerPinned: false,
          focusMode: readingMode,
        }),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [activeDockTab, dockHeight, dockOpen, readingMode, storageKey]);

  const dockContent = useMemo(() => {
    if (!dock?.tabs.length) return null;
    return (
      <WorkbenchDock
        sections={dock.tabs}
        activeTab={activeDockTab}
        isOpen={dockOpen}
        height={dockHeight}
        onToggleOpen={() => setDockOpen((current) => !current)}
        onTabChange={setActiveDockTab}
        onHeightChange={setDockHeight}
      />
    );
  }, [activeDockTab, dock, dockHeight, dockOpen]);

  return (
    <AppDashboardShell
      feature={feature}
      header={header}
      navRail={navRail}
      drawer={drawer}
      commandItems={commandItems}
      readingMode={readingMode}
    >
      <div className={cn('lab-shell workbench-surface min-h-screen w-full', `feature-${feature}`)} data-density="dense">
        <div className="mx-auto flex h-full max-w-[1760px] min-w-0 flex-col px-3 pb-3 pt-3 md:px-5 lg:px-6">
          <div className="workbench-primary-surface min-h-0 flex-1 overflow-hidden">
            {primary}
          </div>
          {dockContent}
        </div>
      </div>
    </AppDashboardShell>
  );
}
