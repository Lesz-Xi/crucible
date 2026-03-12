'use client';

import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkbenchEvidenceRailConfig } from '@/types/workbench';

interface AppShellChromeContextValue {
  evidenceRailOverride: WorkbenchEvidenceRailConfig | null;
  setEvidenceRailOverride: Dispatch<SetStateAction<WorkbenchEvidenceRailConfig | null>>;
  evidenceRailVisible: boolean;
  setEvidenceRailVisible: Dispatch<SetStateAction<boolean>>;
  focusMode: boolean;
  setFocusMode: Dispatch<SetStateAction<boolean>>;
}

const AppShellChromeContext = createContext<AppShellChromeContextValue | null>(null);

export const AppShellChromeProvider = AppShellChromeContext.Provider;

export function useAppShellChrome() {
  return useContext(AppShellChromeContext);
}
