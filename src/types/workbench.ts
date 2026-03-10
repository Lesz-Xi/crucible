import type { ReactNode, ComponentType } from 'react';

export type WorkbenchFeature = 'chat' | 'hybrid' | 'legal' | 'report' | 'education' | 'lab';

export type CausalDensityLevel = 'L1' | 'L2' | 'L3' | null;
export type WorkbenchTone = 'green' | 'amber' | 'red' | 'neutral';

export interface WorkbenchEvidenceAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface WorkbenchEvidenceItem {
  id: string;
  title: string;
  meta: string;
  href?: string;
  badge?: string;
}

export interface WorkbenchEvidenceRailConfig {
  subtitle?: string;
  live?: boolean;
  causalDensity: {
    activeLevel: CausalDensityLevel;
    status: string;
  };
  alignmentPosture: {
    tone: WorkbenchTone;
    text: string;
  };
  modelProvenance: {
    title?: string;
    text: string;
    actions?: WorkbenchEvidenceAction[];
  };
  activeDomain: {
    label: string;
  };
  scientificEvidence: WorkbenchEvidenceItem[];
}

export interface WorkbenchShellProps {
  feature: WorkbenchFeature;
  mainTopbar?: ReactNode;
  mainContent: ReactNode;
  inputArea?: ReactNode;
  evidenceRail: WorkbenchEvidenceRailConfig;
  mainMode?: 'chat' | 'split' | 'report' | 'canvas';
}

// Legacy exports kept temporarily so untouched components continue to type-check
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
