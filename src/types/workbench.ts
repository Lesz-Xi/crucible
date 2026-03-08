import type { ReactNode, ComponentType } from 'react';

export type WorkbenchDockTab = 'evidence' | 'context' | 'provenance' | 'diagnostics';

export type CommandHubItemKind = 'navigation' | 'action' | 'toggle';

export interface CommandHubItem {
  id: string;
  label: string;
  kind: CommandHubItemKind;
  icon?: ComponentType<{ className?: string }>;
  keywords?: string[];
  run: () => void;
  featureScope?: string[];
}

export interface WorkbenchDrawerConfig {
  title: string;
  subtitle?: string;
  content: ReactNode;
}

export interface WorkbenchDockSection {
  id: WorkbenchDockTab;
  label: string;
  content: ReactNode;
  badge?: string | number;
}

export interface WorkbenchDockConfig {
  tabs: WorkbenchDockSection[];
}

export interface WorkbenchPreferences {
  theme?: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact' | 'dense';
  dockOpen: boolean;
  dockTab: WorkbenchDockTab;
  drawerPinned: boolean;
  focusMode: boolean;
}
