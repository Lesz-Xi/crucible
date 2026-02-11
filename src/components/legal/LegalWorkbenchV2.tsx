'use client';

import Link from 'next/link';
import { BookOpen, Clock, Scale, ShieldCheck, UploadCloud, Gavel } from 'lucide-react';
import LegalLegacyPage from '@/components/legal/LegalLegacyPage';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';

export function LegalWorkbenchV2() {
  return (
    <WorkbenchShell
      statusStrip={
        <StatusStrip
          left={
            <div className="flex items-center gap-3">
              <div className="lab-chip-mono">Legal Causation Workbench</div>
              <p className="text-sm text-[var(--lab-text-secondary)]">Intent → Action → Harm with counterfactual rigor</p>
            </div>
          }
          right={<div className="lab-chip-mono">Output Class: intervention-aware</div>}
        />
      }
      contextRail={
        <ContextRail title="Context" subtitle="Case inputs and execution controls">
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
              Upload evidence corpus and fill jurisdictional context before running inference.
            </div>
            <div className="lab-kpi-card text-sm text-[var(--lab-text-secondary)]">
              <Gavel className="mb-2 h-4 w-4 text-[var(--lab-accent-earth)]" />
              Enforce gate outcomes and preserve chain-level traceability.
            </div>
          </div>
        </ContextRail>
      }
      primary={
        <PrimaryCanvas>
          <div className="h-full overflow-auto rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg)]">
            <LegalLegacyPage />
          </div>
        </PrimaryCanvas>
      }
      evidenceRail={
        <EvidenceRail title="Evidence" subtitle="Gate posture and precedents">
          <div className="space-y-3">
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Intervention Gate</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">Association/inference/supported output class reflected in run results.</p>
            </div>
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Causal Chain Integrity</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">But-for and proximate cause confidence remain auditable.</p>
            </div>
            <div className="lab-kpi-card">
              <ul className="space-y-2 text-sm text-[var(--lab-text-secondary)]">
                <li className="flex items-center gap-2"><Scale className="h-4 w-4 text-[var(--lab-accent-clay)]" /> Liability rationale</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--lab-accent-moss)]" /> Governance constraints</li>
                <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--lab-accent-earth)]" /> Precedent grounding</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-[var(--lab-accent-moss)]" /> History retrieval</li>
              </ul>
            </div>
          </div>
        </EvidenceRail>
      }
    />
  );
}
