'use client';

import Link from 'next/link';
import { BookOpen, Clock, Scale, Sparkles, UploadCloud, FlaskConical } from 'lucide-react';
import HybridLegacyPage from '@/components/hybrid/HybridLegacyPage';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';

export function HybridWorkbenchV2() {
  return (
    <WorkbenchShell
      statusStrip={
        <StatusStrip
          left={
            <div className="flex items-center gap-3">
              <div className="lab-chip-mono">Hybrid Synthesis Workbench</div>
              <p className="text-sm text-[var(--lab-text-secondary)]">Ingestion → contradiction → hypothesis</p>
            </div>
          }
          right={<div className="lab-chip-mono">Mode: report-first</div>}
        />
      }
      contextRail={
        <ContextRail title="Context" subtitle="Input staging and run controls">
          <div className="space-y-3">
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-2">Feature Switcher</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Link href="/chat" className="lab-kpi-card !p-2 text-center">Chat</Link>
                <Link href="/hybrid" className="lab-kpi-card !p-2 text-center">Hybrid</Link>
                <Link href="/legal" className="lab-kpi-card !p-2 text-center">Legal</Link>
              </div>
            </div>

            <div className="lab-kpi-card text-sm text-[var(--lab-text-secondary)]">
              <UploadCloud className="mb-2 h-4 w-4 text-[var(--lab-accent-clay)]" />
              Stage documents and company entities in the central canvas.
            </div>

            <div className="lab-kpi-card text-sm text-[var(--lab-text-secondary)]">
              <FlaskConical className="mb-2 h-4 w-4 text-[var(--lab-accent-earth)]" />
              Keep 2-12 sources for valid synthesis run constraints.
            </div>
          </div>
        </ContextRail>
      }
      primary={
        <PrimaryCanvas>
          <div className="h-full overflow-auto rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg)]">
            <HybridLegacyPage />
          </div>
        </PrimaryCanvas>
      }
      evidenceRail={
        <EvidenceRail title="Evidence" subtitle="Contradictions, prior art, telemetry">
          <div className="space-y-3">
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Contradiction Radar</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">Track claim tension and synthesis resolution quality.</p>
            </div>
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Prior Art Guard</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">Novelty claims stay anchored to prior-art evidence.</p>
            </div>
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Operational Feed</p>
              <ul className="space-y-2 text-sm text-[var(--lab-text-secondary)]">
                <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--lab-accent-clay)]" /> Stage events</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-[var(--lab-accent-moss)]" /> Runtime traces</li>
                <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--lab-accent-earth)]" /> Audit artifacts</li>
                <li className="flex items-center gap-2"><Scale className="h-4 w-4 text-[var(--lab-accent-clay)]" /> Governance posture</li>
              </ul>
            </div>
          </div>
        </EvidenceRail>
      }
    />
  );
}
