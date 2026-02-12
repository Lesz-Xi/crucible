'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, Clock3, FlaskConical, Scale, Sparkles } from 'lucide-react';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';
import { HybridInputPanelV2 } from '@/components/hybrid/HybridInputPanelV2';
import { HybridResultPanelV2, type HybridResultData } from '@/components/hybrid/HybridResultPanelV2';

interface HistoryEntry {
  id: string;
  created_at?: string;
  synthesis_goal?: string;
  concepts_extracted?: unknown;
}

type Stage = 'input' | 'processing' | 'stabilizing' | 'results';

export function HybridWorkbenchV2() {
  const [files, setFiles] = useState<File[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyDraft, setCompanyDraft] = useState('');
  const [researchFocus, setResearchFocus] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [result, setResult] = useState<HybridResultData | null>(null);
  const [latestEvent, setLatestEvent] = useState<string>('Idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const totalSources = files.length + companies.length;
  const canRun = totalSources >= 2 && totalSources <= 12;

  const contradictionCount = useMemo(() => result?.contradictions.length || 0, [result]);
  const ideaCount = useMemo(() => result?.novelIdeas.length || 0, [result]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/synthesis-history');
      if (!response.ok) {
        setHistory([]);
        return;
      }
      const payload = (await response.json()) as { history?: HistoryEntry[] };
      setHistory(payload.history || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  const addCompany = () => {
    const trimmed = companyDraft.trim();
    if (!trimmed) return;
    if (companies.includes(trimmed)) {
      setCompanyDraft('');
      return;
    }
    if (companies.length >= 5) return;
    setCompanies((prev) => [...prev, trimmed]);
    setCompanyDraft('');
  };

  const runSynthesis = async () => {
    if (!canRun) {
      setError('Use 2-12 total sources before running synthesis.');
      return;
    }

    setError(null);
    setStage('processing');
    setLatestEvent('Starting ingestion...');

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('companies', JSON.stringify(companies));
      formData.append('researchFocus', researchFocus);

      const response = await fetch('/api/hybrid-synthesize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Synthesis request failed (${response.status})`);
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const payload = JSON.parse(part.slice(6)) as { event?: string; message?: string; synthesis?: HybridResultData };

          if (payload.event === 'error') {
            throw new Error(payload.message || 'Synthesis failed');
          }

          if (payload.event === 'complete' && payload.synthesis) {
            setResult(payload.synthesis);
            setLatestEvent('Synthesis completed.');
            setStage('stabilizing');
            setTimeout(() => setStage('results'), 650);
            void fetchHistory();
          } else if (payload.event) {
            setLatestEvent(payload.event.replaceAll('_', ' '));
          }
        }
      }
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Unable to run synthesis';
      setError(message);
      setStage('input');
    }
  };

  const loadHistoricalRun = async (id: string) => {
    setError(null);
    setStage('processing');
    try {
      const response = await fetch(`/api/synthesis-history?id=${id}`);
      if (!response.ok) throw new Error('Failed to load run details');
      const payload = (await response.json()) as { run?: HybridResultData; success?: boolean };
      if (!payload.success || !payload.run) throw new Error('Run missing');
      setResult(payload.run);
      setLatestEvent('Historical run loaded.');
      setStage('results');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load run';
      setError(message);
      setStage('input');
    }
  };

  return (
    <WorkbenchShell
      statusStrip={
        <StatusStrip
          left={
            <div className="flex items-center gap-3">
              <span className="lab-chip-mono">Hybrid Discovery Engine</span>
              <p className="text-sm text-[var(--lab-text-secondary)]">Ingest → contradict → synthesize → structure</p>
            </div>
          }
          right={<span className="lab-chip-mono">Phase: deterministic synthesis routing</span>}
        />
      }
      contextRail={
        <ContextRail title="Input Rail" subtitle="Source inventory, focus constraints, and execution">
          <div className="mb-4 flex flex-wrap gap-2">
            <Link href="/chat" className="lab-nav-pill" data-active="false"><Sparkles className="h-4 w-4" />Chat</Link>
            <Link href="/hybrid" className="lab-nav-pill" data-active="true"><FlaskConical className="h-4 w-4" />Hybrid</Link>
            <Link href="/legal" className="lab-nav-pill" data-active="false"><Scale className="h-4 w-4" />Legal</Link>
          </div>

          <HybridInputPanelV2
            files={files}
            companies={companies}
            companyDraft={companyDraft}
            researchFocus={researchFocus}
            isRunning={stage === 'processing' || stage === 'stabilizing'}
            canRun={canRun}
            onFilesChange={setFiles}
            onCompanyDraftChange={setCompanyDraft}
            onResearchFocusChange={setResearchFocus}
            onAddCompany={addCompany}
            onRemoveCompany={(company) => setCompanies((prev) => prev.filter((entry) => entry !== company))}
            onRemoveFile={(name) => setFiles((prev) => prev.filter((file) => file.name !== name))}
            onRun={runSynthesis}
          />

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </ContextRail>
      }
      primary={
        <PrimaryCanvas>
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Total Sources</p>
                <p className="text-2xl font-semibold text-[var(--lab-text-primary)]">{totalSources}</p>
              </div>
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Contradictions</p>
                <p className="text-2xl font-semibold text-[var(--lab-text-primary)]">{contradictionCount}</p>
              </div>
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Ideas</p>
                <p className="text-2xl font-semibold text-[var(--lab-text-primary)]">{ideaCount}</p>
              </div>
            </div>

            {stage === 'processing' ? (
              <div className="lab-empty-state flex-1">
                <p className="font-serif text-2xl text-[var(--lab-text-primary)]">Processing synthesis run...</p>
                <p className="mt-2 text-sm">Latest event: {latestEvent}</p>
              </div>
            ) : stage === 'stabilizing' ? (
              <div className="lab-empty-state flex-1">
                <p className="font-serif text-2xl text-[var(--lab-text-primary)]">Stabilizing output...</p>
              </div>
            ) : (
              <div className="lab-scroll-region flex-1">
                <HybridResultPanelV2 result={result} stage={stage} />
              </div>
            )}
          </div>
        </PrimaryCanvas>
      }
      evidenceRail={
        <EvidenceRail title="Evidence Rail" subtitle="Telemetry, prior-art confidence, and run history">
          <div className="space-y-3">
            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--lab-accent-earth)]" />
                <p className="lab-section-title !mb-0">Runtime Signal</p>
              </div>
              <p className="text-sm text-[var(--lab-text-secondary)]">{latestEvent}</p>
            </div>

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                <p className="lab-section-title !mb-0">Historical Runs</p>
              </div>
              {historyLoading ? (
                <p className="text-sm text-[var(--lab-text-secondary)]">Loading...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-[var(--lab-text-tertiary)]">No runs available.</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 8).map((entry) => (
                    <button key={entry.id} type="button" className="lab-card-interactive w-full text-left !p-2.5" onClick={() => void loadHistoricalRun(entry.id)}>
                      <p className="truncate text-sm text-[var(--lab-text-primary)]">{entry.synthesis_goal || entry.id}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)]"><Clock3 className="h-3.5 w-3.5" />{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown time'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </EvidenceRail>
      }
    />
  );
}
