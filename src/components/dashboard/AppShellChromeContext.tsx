'use client';

import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkbenchEvidenceRailConfig } from '@/types/workbench';

interface AppShellChromeContextValue {
  evidenceRailOverride: WorkbenchEvidenceRailConfig | null;
  setEvidenceRailOverride: Dispatch<SetStateAction<WorkbenchEvidenceRailConfig | null>>;
}

const AppShellChromeContext = createContext<AppShellChromeContextValue | null>(null);

export const AppShellChromeProvider = AppShellChromeContext.Provider;

export function useAppShellChrome() {
  return useContext(AppShellChromeContext);
}
