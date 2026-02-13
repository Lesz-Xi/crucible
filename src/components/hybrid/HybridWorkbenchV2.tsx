'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';
import { HybridInputPanelV2 } from '@/components/hybrid/HybridInputPanelV2';
import { HybridResultPanelV2, type HybridResultData } from '@/components/hybrid/HybridResultPanelV2';
import { HybridProcessingTimelineV2 } from '@/components/hybrid/HybridProcessingTimelineV2';
import { HybridTimelineSummaryStripV2 } from '@/components/hybrid/HybridTimelineSummaryStripV2';
import { createInitialTimelineReceipt, updateTimelineStage } from '@/lib/hybrid/timeline';
import type { HybridTimelineReceipt, HybridTimelineStageKey, HybridTimelineStageState, HybridTimelineStageTelemetry } from '@/types/hybrid-timeline';

interface HistoryEntry {
  id: string;
  created_at?: string;
  synthesis_goal?: string;
  concepts_extracted?: unknown;
}

type Stage = 'input' | 'processing' | 'stabilizing' | 'results';

type TimelineEventName =
  | 'timeline_stage_started'
  | 'timeline_stage_progress'
  | 'timeline_stage_completed'
  | 'timeline_stage_skipped';

type StreamPayload = {
  event?: string;
  message?: string;
  synthesis?: unknown;
  rows?: number;
  highConfidenceRows?: number;
  proofCount?: number;
  decision?: 'pass' | 'recover' | 'fail';
  passingIdeas?: number;
  blockedIdeas?: number;
  reasons?: string[];
  stage?: HybridTimelineStageKey;
  state?: HybridTimelineStageState;
  timestamp?: string;
  meta?: HybridTimelineStageTelemetry;
  claimId?: string;
};

interface NormalizedRunPayload {
  result: HybridResultData;
  timelineReceipt: HybridTimelineReceipt | null;
}

function normalizeRunPayload(raw: unknown): NormalizedRunPayload | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const noveltyProof = Array.isArray(row.noveltyProof) ? row.noveltyProof : [];
  const contradictions = Array.isArray(row.contradictionMatrix)
    ? row.contradictionMatrix
    : Array.isArray(row.contradictions)
      ? row.contradictions
      : [];

  const rawStructured = (row.structuredApproach || row.structured_approach || {}) as Record<string, unknown>;
  const structuredApproach = {
    objective: typeof rawStructured.objective === 'string' ? rawStructured.objective : undefined,
    phases: Array.isArray(rawStructured.phases) ? (rawStructured.phases as string[]) : undefined,
    risks: Array.isArray(rawStructured.risks) ? (rawStructured.risks as string[]) : undefined,
  };

  const timelineReceipt = row.timelineReceipt && typeof row.timelineReceipt === 'object'
    ? (row.timelineReceipt as HybridTimelineReceipt)
    : rawStructured.__timelineReceipt && typeof rawStructured.__timelineReceipt === 'object'
      ? (rawStructured.__timelineReceipt as HybridTimelineReceipt)
      : null;

  return {
    result: {
      sources: Array.isArray(row.sources) ? (row.sources as HybridResultData['sources']) : [],
      contradictions: contradictions as HybridResultData['contradictions'],
      contradictionMatrix: contradictions as HybridResultData['contradictionMatrix'],
      novelIdeas: Array.isArray(row.novelIdeas) ? (row.novelIdeas as HybridResultData['novelIdeas']) : [],
      noveltyProof: noveltyProof as HybridResultData['noveltyProof'],
      noveltyGate:
        row.noveltyGate && typeof row.noveltyGate === 'object'
          ? (row.noveltyGate as HybridResultData['noveltyGate'])
          : null,
      recoveryPlan:
        row.recoveryPlan && typeof row.recoveryPlan === 'object'
          ? (row.recoveryPlan as HybridResultData['recoveryPlan'])
          : null,
      structuredApproach,
    },
    timelineReceipt,
  };
}

function isTimelineEvent(event?: string): event is TimelineEventName {
  return (
    event === 'timeline_stage_started' ||
    event === 'timeline_stage_progress' ||
    event === 'timeline_stage_completed' ||
    event === 'timeline_stage_skipped'
  );
}

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
  const [matrixStats, setMatrixStats] = useState({ rows: 0, highConfidenceRows: 0 });
  const [proofCount, setProofCount] = useState(0);
  const [gatePreview, setGatePreview] = useState<HybridResultData['noveltyGate']>(null);
  const [timelineReceipt, setTimelineReceipt] = useState<HybridTimelineReceipt | null>(null);
  const [timelineNow, setTimelineNow] = useState<string>(new Date().toISOString());
  const [latestClaimId, setLatestClaimId] = useState<string | null>(null);
  const [claimCopied, setClaimCopied] = useState(false);
  const activeRunAbortRef = useRef<AbortController | null>(null);

  const totalSources = files.length + companies.length;
  const canRun = totalSources >= 2 && totalSources <= 12;

  const contradictionCount = useMemo(
    () => result?.contradictionMatrix?.length || result?.contradictions.length || matrixStats.rows,
    [result, matrixStats.rows],
  );
  const passingIdeas = useMemo(() => result?.noveltyGate?.passingIdeas || gatePreview?.passingIdeas || 0, [result, gatePreview]);
  const blockedIdeas = useMemo(() => result?.noveltyGate?.blockedIdeas || gatePreview?.blockedIdeas || 0, [result, gatePreview]);

  useEffect(() => {
    if (stage !== 'processing' && stage !== 'stabilizing') {
      return;
    }
    const interval = setInterval(() => {
      setTimelineNow(new Date().toISOString());
    }, 500);
    return () => clearInterval(interval);
  }, [stage]);

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

  useEffect(() => {
    return () => {
      activeRunAbortRef.current?.abort();
      activeRunAbortRef.current = null;
    };
  }, []);

  const applyTimelineUpdate = (
    key: HybridTimelineStageKey,
    state: HybridTimelineStageState,
    telemetry?: HybridTimelineStageTelemetry,
    timestamp?: string,
  ) => {
    setTimelineReceipt((current) => {
      const seed = current || createInitialTimelineReceipt(timestamp || new Date().toISOString());
      return updateTimelineStage(seed, {
        stage: key,
        state,
        timestamp,
        telemetry,
      });
    });
  };

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
    setResult(null);
    setProofCount(0);
    setGatePreview(null);
    setMatrixStats({ rows: 0, highConfidenceRows: 0 });
    setTimelineReceipt(createInitialTimelineReceipt());
    setTimelineNow(new Date().toISOString());
    setLatestClaimId(null);
    setClaimCopied(false);

    activeRunAbortRef.current?.abort();
    const abortController = new AbortController();
    activeRunAbortRef.current = abortController;

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('companies', JSON.stringify(companies));
      formData.append('researchFocus', researchFocus);

      const response = await fetch('/api/hybrid-synthesize', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
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
          const payload = JSON.parse(part.slice(6)) as StreamPayload;

          if (payload.event === 'error') {
            throw new Error(payload.message || 'Synthesis failed');
          }

          if (isTimelineEvent(payload.event) && payload.stage && payload.state) {
            applyTimelineUpdate(payload.stage, payload.state, payload.meta, payload.timestamp);
          }

          if (payload.event === 'contradiction_matrix_built') {
            setMatrixStats({ rows: payload.rows || 0, highConfidenceRows: payload.highConfidenceRows || 0 });
            setLatestEvent('Contradiction matrix built');
            continue;
          }

          if (payload.event === 'novelty_proof_computed') {
            setProofCount(payload.proofCount || 0);
            setLatestEvent('Novelty proof computed');
            continue;
          }

          if (payload.event === 'novelty_gate_decision') {
            setGatePreview({
              decision: payload.decision || 'recover',
              threshold: 0.3,
              passingIdeas: payload.passingIdeas || 0,
              blockedIdeas: payload.blockedIdeas || 0,
              reasons: payload.reasons || [],
            });
            setLatestEvent(`Novelty gate: ${payload.decision || 'recover'}`);
            continue;
          }

          if (payload.event === 'recovery_plan_generated') {
            setLatestEvent('Recovery plan generated');
            continue;
          }

          if (payload.event === 'claim_recorded' && payload.claimId) {
            setLatestClaimId(payload.claimId);
            setLatestEvent('Claim lineage receipt written.');
            continue;
          }

          if (payload.event === 'complete' && payload.synthesis) {
            const normalized = normalizeRunPayload(payload.synthesis);
            if (!normalized) {
              throw new Error('Unable to parse synthesis payload');
            }
            setResult(normalized.result);
            setTimelineReceipt((current) => normalized.timelineReceipt || current);
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
      if (runError instanceof DOMException && runError.name === 'AbortError') {
        applyTimelineUpdate('completed', 'blocked', { reason: 'client_cancelled', signal: 'Run stopped by user' });
        setLatestEvent('Synthesis run stopped.');
        setStage('input');
        setError(null);
        return;
      }
      const message = runError instanceof Error ? runError.message : 'Unable to run synthesis';
      setError(message);
      setStage('input');
    } finally {
      if (activeRunAbortRef.current === abortController) {
        activeRunAbortRef.current = null;
      }
    }
  };

  const cancelSynthesis = () => {
    if (!activeRunAbortRef.current) {
      return;
    }
    activeRunAbortRef.current.abort();
  };

  const loadHistoricalRun = async (id: string) => {
    setError(null);
    setStage('processing');
    try {
      const response = await fetch(`/api/synthesis-history?id=${id}`);
      if (!response.ok) throw new Error('Failed to load run details');
      const payload = (await response.json()) as { run?: unknown; success?: boolean };
      if (!payload.success || !payload.run) throw new Error('Run missing');

      const normalized = normalizeRunPayload(payload.run);
      if (!normalized) throw new Error('Run payload malformed');

      setResult(normalized.result);
      setTimelineReceipt(normalized.timelineReceipt);
      setLatestEvent('Historical run loaded.');
      setMatrixStats({
        rows: normalized.result.contradictionMatrix?.length || 0,
        highConfidenceRows: (normalized.result.contradictionMatrix || []).filter((row) => row.highConfidence).length,
      });
      setProofCount(normalized.result.noveltyProof?.length || 0);
      setGatePreview(normalized.result.noveltyGate || null);
      setLatestClaimId(null);

      try {
        const claimResponse = await fetch(`/api/claims?sourceFeature=hybrid&traceId=${id}&limit=1`);
        if (claimResponse.ok) {
          const claimPayload = (await claimResponse.json()) as { claims?: Array<{ id?: string }> };
          const firstClaimId = claimPayload.claims?.[0]?.id;
          if (typeof firstClaimId === 'string' && firstClaimId.length > 0) {
            setLatestClaimId(firstClaimId);
          }
        }
      } catch {
        // non-fatal: historical run may predate claim ledger
      }

      setStage('results');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load run';
      setError(message);
      setStage('input');
    }
  };

  const topOverlaps = useMemo(() => {
    const all = (result?.noveltyProof || []).flatMap((proof) => proof.closestPriorArt || []);
    return all
      .slice()
      .sort((left, right) => {
        const leftScore = left.similarity > 1 ? left.similarity : left.similarity * 100;
        const rightScore = right.similarity > 1 ? right.similarity : right.similarity * 100;
        return rightScore - leftScore;
      })
      .slice(0, 3);
  }, [result?.noveltyProof]);

  const handleCopyClaimId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setClaimCopied(true);
      window.setTimeout(() => setClaimCopied(false), 1400);
    } catch {
      setClaimCopied(false);
    }
  };

  return (
    <WorkbenchShell
      statusStrip={
        <StatusStrip
          left={
            <div className="flex items-center gap-3">
              <span className="lab-chip-mono">Hybrid Discovery Engine</span>
              <p className="text-sm text-[var(--lab-text-secondary)]">Ingest → contradict → synthesize → prove novelty</p>
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
            onCancelRun={cancelSynthesis}
          />

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </ContextRail>
      }
      primary={
        <PrimaryCanvas>
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 grid grid-cols-4 gap-3">
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Sources</p>
                <p className="text-2xl font-semibold text-[var(--lab-text-primary)]">{totalSources}</p>
              </div>
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Validated Contradictions</p>
                <p className="text-2xl font-semibold text-[var(--lab-text-primary)]">{matrixStats.highConfidenceRows || contradictionCount}</p>
              </div>
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Novelty Pass</p>
                <p className="text-2xl font-semibold text-[var(--lab-accent-moss)]">{passingIdeas}</p>
              </div>
              <div className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Blocked Candidates</p>
                <p className="text-2xl font-semibold text-[var(--lab-accent-earth)]">{blockedIdeas || Math.max(0, proofCount - passingIdeas)}</p>
              </div>
            </div>

            {(stage === 'processing' || stage === 'stabilizing') ? (
              <HybridProcessingTimelineV2
                stages={timelineReceipt?.stages || createInitialTimelineReceipt().stages}
                latestSignal={latestEvent}
                startedAt={timelineReceipt?.startedAt}
                nowIso={timelineNow}
                passCount={passingIdeas}
                blockedCount={blockedIdeas || Math.max(0, proofCount - passingIdeas)}
              />
            ) : (
              <div className="lab-scroll-region flex-1">
                <HybridTimelineSummaryStripV2 receipt={timelineReceipt} gateDecision={result?.noveltyGate?.decision || gatePreview?.decision || null} />
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
              <p className="mt-2 text-xs text-[var(--lab-text-tertiary)]">Proof cards: {result?.noveltyProof?.length || proofCount}</p>
            </div>

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                <p className="lab-section-title !mb-0">Gate State</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--lab-text-secondary)]">
                {result?.noveltyGate?.decision === 'pass' ? <CheckCircle2 className="h-4 w-4 text-[var(--lab-accent-moss)]" /> : <AlertTriangle className="h-4 w-4 text-[var(--lab-accent-earth)]" />}
                <span>{result?.noveltyGate?.decision || gatePreview?.decision || 'pending'}</span>
              </div>
              <p className="mt-2 text-xs text-[var(--lab-text-tertiary)]">
                pass={result?.noveltyGate?.passingIdeas || gatePreview?.passingIdeas || 0} · blocked={result?.noveltyGate?.blockedIdeas || gatePreview?.blockedIdeas || 0}
              </p>
            </div>

            {latestClaimId ? (
              <div className="lab-metric-tile">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                  <p className="lab-section-title !mb-0">Claim Lineage</p>
                </div>
                <p className="text-xs text-[var(--lab-text-secondary)]">Claim ID: <span className="font-mono text-[var(--lab-text-primary)]">{latestClaimId}</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a className="inline-block text-xs text-[var(--lab-accent-earth)] underline" href={`/claims/${latestClaimId}`} target="_blank" rel="noreferrer">
                    Open pretty view
                  </a>
                  <a className="inline-block text-xs text-[var(--lab-accent-earth)] underline" href={`/api/claims/${latestClaimId}`} target="_blank" rel="noreferrer">
                    Open JSON
                  </a>
                  <button
                    type="button"
                    className="text-xs text-[var(--lab-text-secondary)] underline"
                    onClick={() => void handleCopyClaimId(latestClaimId)}
                  >
                    Copy Claim ID
                  </button>
                </div>
                {claimCopied ? <p className="mt-1 text-[11px] text-[var(--lab-accent-moss)]">Copied!</p> : null}
              </div>
            ) : null}

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                <p className="lab-section-title !mb-0">Top Prior-Art Overlaps</p>
              </div>
              {topOverlaps.length === 0 ? (
                <p className="text-sm text-[var(--lab-text-tertiary)]">No overlap data yet.</p>
              ) : (
                <ul className="space-y-1 text-xs text-[var(--lab-text-secondary)]">
                  {topOverlaps.map((item, index) => {
                    const overlap = Math.round(item.similarity > 1 ? item.similarity : item.similarity * 100);
                    return <li key={`${item.title}-${index}`}>{item.title} ({overlap}%)</li>;
                  })}
                </ul>
              )}
            </div>

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[var(--lab-accent-earth)]" />
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
