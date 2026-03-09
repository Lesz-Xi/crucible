import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WorkbenchShell } from '../WorkbenchShell';
import { WorkbenchEvidenceRail } from '../WorkbenchEvidenceRail';
import type { WorkbenchEvidenceRailConfig } from '@/types/workbench';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'dark',
    setTheme: () => undefined,
  }),
}));

vi.mock('@/components/dashboard/SidebarModelSettings', () => ({
  SidebarModelSettings: () => <div>Model Settings</div>,
}));

const railConfig: WorkbenchEvidenceRailConfig = {
  subtitle: 'Live causal posture and provenance',
  live: true,
  causalDensity: {
    activeLevel: 'L2',
    status: 'Active rung: Intervention',
  },
  alignmentPosture: {
    tone: 'green',
    text: 'No unaudited intervention claims without identifiability gates.',
  },
  modelProvenance: {
    title: 'claude-sonnet-4',
    text: 'Runtime model metadata was emitted for this run. Verified claim lineage is unavailable.',
  },
  activeDomain: {
    label: 'biology',
  },
  scientificEvidence: [
    {
      id: 'e1',
      title: 'Anomaly-Detection.pdf',
      meta: '151 points • 22 days ago',
      badge: 'pdf',
    },
  ],
};

describe('WorkbenchShell', () => {
  it('renders shared navigation, main content, and evidence rail', () => {
    const html = renderToStaticMarkup(
      <WorkbenchShell
        feature="chat"
        evidenceRail={railConfig}
        mainMode="chat"
        mainContent={<div>Workbench body</div>}
        inputArea={<div>Workbench input</div>}
      />,
    );

    expect(html).toContain('canonical-workbench-shell');
    expect(html).toContain('Bio-Lab Notebook');
    expect(html).toContain('Workbench body');
    expect(html).toContain('Workbench input');
    expect(html).toContain('Evidence Rail');
  });
});

describe('WorkbenchEvidenceRail', () => {
  it('renders the configured sections without feature-specific markup', () => {
    const html = renderToStaticMarkup(<WorkbenchEvidenceRail config={railConfig} />);

    expect(html).toContain('Causal Density');
    expect(html).toContain('Alignment Posture');
    expect(html).toContain('Model Provenance');
    expect(html).toContain('Anomaly-Detection.pdf');
  });
});
