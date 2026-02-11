'use client';

import Link from 'next/link';
import { MessageSquare, Scale, Sparkles, ShieldCheck, Binary, FlaskConical } from 'lucide-react';
import { Sidebar } from '@/components/causal-chat/Sidebar';
import { CausalChatInterface } from '@/components/causal-chat/CausalChatInterface';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';

interface ChatWorkbenchV2Props {
  onLoadSession?: (sessionId: string) => void;
  onNewChat?: () => void;
}

export function ChatWorkbenchV2({ onLoadSession, onNewChat }: ChatWorkbenchV2Props) {
  return (
    <WorkbenchShell
      statusStrip={
        <StatusStrip
          left={
            <div className="flex items-center gap-3">
              <div className="lab-chip-mono">Automated Scientist Console</div>
              <p className="text-sm text-[var(--lab-text-secondary)]">Causal-first reasoning with verifiable traces</p>
            </div>
          }
          right={<div className="lab-chip-mono">Ladder: L1/L2/L3</div>}
        />
      }
      contextRail={
        <ContextRail title="Context" subtitle="Sessions, navigation, and sync">
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Link href="/chat" className="lab-kpi-card !p-2 text-xs text-center">
              <MessageSquare className="mx-auto mb-1 h-3.5 w-3.5" />Chat
            </Link>
            <Link href="/hybrid" className="lab-kpi-card !p-2 text-xs text-center">
              <Sparkles className="mx-auto mb-1 h-3.5 w-3.5" />Hybrid
            </Link>
            <Link href="/legal" className="lab-kpi-card !p-2 text-xs text-center">
              <Scale className="mx-auto mb-1 h-3.5 w-3.5" />Legal
            </Link>
          </div>

          <div className="lab-divider-gradient mb-4" />

          <div className="rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]/70 p-2">
            <Sidebar
              isOpen
              onToggle={() => {}}
              onLoadSession={onLoadSession}
              onNewChat={onNewChat}
              className="!h-auto !w-full !translate-x-0 !border-0 !bg-transparent"
            />
          </div>
        </ContextRail>
      }
      primary={
        <PrimaryCanvas>
          <div className="h-full p-2">
            <div className="lab-panel h-full">
              <CausalChatInterface />
            </div>
          </div>
        </PrimaryCanvas>
      }
      evidenceRail={
        <EvidenceRail title="Evidence" subtitle="Live governance and trace posture">
          <div className="space-y-3">
            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Causal Density</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">Real-time score appears in stream events and persisted chat density.</p>
            </div>

            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Provenance</p>
              <ul className="space-y-2 text-sm text-[var(--lab-text-secondary)]">
                <li className="flex items-center gap-2"><Binary className="h-4 w-4 text-[var(--lab-accent-clay)]" /> Model/domain trace</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--lab-accent-moss)]" /> Integrity gates</li>
              </ul>
            </div>

            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Alignment Lens</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">Bias-sensitive paths and DAG audit appear when alignment domain is active.</p>
            </div>

            <div className="lab-kpi-card">
              <p className="lab-section-title !mb-1">Next Action</p>
              <button
                type="button"
                onClick={onNewChat}
                className="lab-focus-ring mt-2 w-full rounded-lg border border-[var(--lab-border)] bg-white/70 px-3 py-2 text-left text-sm font-medium text-[var(--lab-text-primary)] hover:-translate-y-[1px]"
              >
                <FlaskConical className="mr-2 inline h-4 w-4 text-[var(--lab-accent-earth)]" />
                Start controlled intervention chat
              </button>
            </div>
          </div>
        </EvidenceRail>
      }
    />
  );
}
