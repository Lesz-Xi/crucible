'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Clock3 } from 'lucide-react';
import type { LegalCase, LegalDiagnostics } from '@/types/legal';
import { getAnalysisHistory, loadAnalysisFromHistory, saveAnalysisToHistory, type LegalHistoryEntry } from '@/lib/services/legal-history';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';
import { LegalAnalysisPanelV2, type LegalGateSummary } from '@/components/legal/LegalAnalysisPanelV2';
import { LegalIntakePanelV2 } from '@/components/legal/LegalIntakePanelV2';

interface AnalysisStatus {
  stage: 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'matching' | 'complete' | 'error';
  message: string;
  progress: number;
}

export function LegalWorkbenchV2() {
  const [documents, setDocuments] = useState<string[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  const [caseTitle, setCaseTitle] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [caseType, setCaseType] = useState<'criminal' | 'tort' | 'contract' | 'administrative'>('tort');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    stage: 'idle',
    message: 'Upload legal documents to begin analysis.',
    progress: 0,
  });
  const [result, setResult] = useState<LegalCase | null>(null);
  const [gateState, setGateState] = useState<LegalGateSummary | null>(null);
  const [latestClaimId, setLatestClaimId] = useState<string | null>(null);
  const [claimCopied, setClaimCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LegalHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transportMode, setTransportMode] = useState<'idle' | 'sse' | 'json-fallback'>('idle');
  const [diagnostics, setDiagnostics] = useState<LegalDiagnostics | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const entries = await getAnalysisHistory(12);
    setHistory(entries);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const clearAll = () => {
    setDocuments([]);
    setDocumentNames([]);
    setCaseTitle('');
    setJurisdiction('');
    setResult(null);
    setGateState(null);
    setLatestClaimId(null);
    setClaimCopied(false);
    setError(null);
    setTransportMode('idle');
    setDiagnostics(null);
    setAnalysisStatus({
      stage: 'idle',
      message: 'Upload legal documents to begin analysis.',
      progress: 0,
    });
  };

  const handleStreamEvent = (event: Record<string, unknown>) => {
    const eventType = event.event;

    if (eventType === 'claim_recorded') {
      const claimId = typeof event.claimId === 'string' ? event.claimId : null;
      setLatestClaimId(claimId);
      return;
    }

    if (eventType === 'intervention_gate') {
      setGateState({
        allowed: Boolean(event.allowed),
        allowedOutputClass: String(event.allowedOutputClass || 'association_only') as LegalGateSummary['allowedOutputClass'],
        allowedChains: Number(event.allowedChains || 0),
        blockedChains: Number(event.blockedChains || 0),
        missingConfounders: Array.isArray(event.missingConfounders) ? (event.missingConfounders as string[]) : [],
        rationale: String(event.rationale || 'No rationale provided'),
      });
      return;
    }

    if (eventType === 'legal_diagnostics') {
      const payload = (event.diagnostics || null) as LegalDiagnostics | null;
      if (payload) {
        setDiagnostics(payload);
      }
      return;
    }

    if (eventType === 'legal_analysis_complete') {
      const legalCase = event.case as LegalCase;
      setResult(legalCase);
      setAnalysisStatus({ stage: 'complete', message: 'Analysis complete.', progress: 100 });
      void saveAnalysisToHistory(legalCase, documentNames).then(loadHistory);
      return;
    }

    if (eventType === 'legal_error') {
      const message = String(event.message || 'Legal analysis failed');
      setError(message);
      setAnalysisStatus({ stage: 'error', message, progress: 0 });
      return;
    }

    const statusMap: Record<string, AnalysisStatus> = {
      legal_extraction_start: { stage: 'extracting', message: 'Extracting legal entities and actions...', progress: 24 },
      but_for_analysis_start: { stage: 'analyzing', message: 'Running but-for causation test...', progress: 54 },
      legal_masa_audit_start: { stage: 'matching', message: 'Matching precedents...', progress: 82 },
    };

    if (typeof eventType === 'string' && statusMap[eventType]) {
      setAnalysisStatus(statusMap[eventType]);
    }
  };

  const runAnalysis = async () => {
    if (documents.length === 0) {
      setError('Please upload at least one legal document.');
      return;
    }

    setError(null);
    setResult(null);
    setGateState(null);
    setTransportMode('idle');
    setDiagnostics(null);
    setAnalysisStatus({ stage: 'uploading', message: 'Preparing analysis request...', progress: 12 });

    try {
      const response = await fetch('/api/legal-reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          documents,
          caseTitle: caseTitle || 'Legal Analysis',
          jurisdiction,
          caseType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed (${response.status})`);
      }

      const contentType = response.headers.get('content-type') || '';

      // Fallback: some environments/proxies can downgrade streaming to JSON.
      if (contentType.includes('application/json')) {
        setTransportMode('json-fallback');
        const payload = (await response.json()) as {
          success?: boolean;
          error?: string;
          case?: LegalCase;
          interventionGate?: {
            allowed?: boolean;
            allowedChains?: number;
            blockedChains?: number;
            missingConfounders?: string[];
            rationale?: string;
          };
          diagnostics?: LegalDiagnostics;
          allowedOutputClass?: LegalGateSummary['allowedOutputClass'];
        };

        if (!payload.success || !payload.case) {
          throw new Error(payload.error || 'Legal analysis failed');
        }

        setResult(payload.case);
        if (payload.interventionGate) {
          setGateState({
            allowed: Boolean(payload.interventionGate.allowed),
            allowedOutputClass: (payload.allowedOutputClass || 'association_only') as LegalGateSummary['allowedOutputClass'],
            allowedChains: Number(payload.interventionGate.allowedChains || 0),
            blockedChains: Number(payload.interventionGate.blockedChains || 0),
            missingConfounders: payload.interventionGate.missingConfounders || [],
            rationale: payload.interventionGate.rationale || 'No rationale provided',
          });
        }
        if (payload.diagnostics) {
          setDiagnostics(payload.diagnostics);
        }
        setAnalysisStatus({ stage: 'complete', message: 'Analysis complete.', progress: 100 });
        void saveAnalysisToHistory(payload.case, documentNames).then(loadHistory);
        return;
      }

      if (!response.body) {
        throw new Error('Analysis stream was empty');
      }

      setTransportMode('sse');
      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      const processLine = (rawLine: string) => {
        const line = rawLine.trim();
        if (!line.startsWith('data: ')) return;
        try {
          const event = JSON.parse(line.slice(6)) as Record<string, unknown>;
          handleStreamEvent(event);
        } catch (parseError) {
          console.warn('[LegalWorkbenchV2] Failed to parse SSE event line:', parseError, line);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processLine(line);
        }
      }

      // Flush any final buffered line if stream ends without trailing newline.
      if (buffer.trim().length > 0) {
        processLine(buffer);
      }
    } catch (analysisError) {
      const message = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
      setError(message);
      setAnalysisStatus({ stage: 'error', message, progress: 0 });
    }
  };

  const loadHistoryEntry = async (id: string) => {
    const loaded = await loadAnalysisFromHistory(id);
    if (!loaded) return;

    setResult(loaded);
    setLatestClaimId(null);
    setClaimCopied(false);
    setCaseTitle(loaded.title);
    setJurisdiction(loaded.jurisdiction || '');
    setCaseType((loaded.caseType as 'criminal' | 'tort' | 'contract' | 'administrative') || 'tort');
    setDiagnostics(null);
    setAnalysisStatus({ stage: 'complete', message: 'Loaded historical analysis.', progress: 100 });
  };

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
      className="feature-legal"
      statusStrip={
        <StatusStrip
          left={
            <div className="flex items-center gap-3">
              <span className="lab-chip-mono">Legal Causation Console</span>
              <p className="text-sm text-[var(--lab-text-secondary)]">Intent → Action → Harm with intervention gates</p>
            </div>
          }
          right={<span className="lab-chip-mono">Output class: gate-aware liability analysis</span>}
        />
      }
      contextRail={
        <ContextRail title="Case Intake" subtitle="Document parsing and legal context setup">
          <LegalIntakePanelV2
            documentNames={documentNames}
            caseTitle={caseTitle}
            jurisdiction={jurisdiction}
            caseType={caseType}
            disabled={analysisStatus.stage === 'uploading' || analysisStatus.stage === 'extracting' || analysisStatus.stage === 'analyzing' || analysisStatus.stage === 'matching'}
            onFilesRead={(docs, names) => {
              setDocuments((previous) => [...previous, ...docs]);
              setDocumentNames((previous) => [...previous, ...names]);
            }}
            onCaseTitleChange={setCaseTitle}
            onJurisdictionChange={setJurisdiction}
            onCaseTypeChange={setCaseType}
            onAnalyze={runAnalysis}
            onClear={clearAll}
          />
        </ContextRail>
      }
      primary={
        <PrimaryCanvas>
          <div className="lab-scroll-region h-full p-4">
            <LegalAnalysisPanelV2
              statusMessage={analysisStatus.message}
              progress={analysisStatus.progress}
              stage={analysisStatus.stage}
              result={result}
              gateState={gateState}
              error={error}
            />
          </div>
        </PrimaryCanvas>
      }
      evidenceRail={
        <EvidenceRail title="Evidence Rail" subtitle="Precedents, confidence, and history quick load">
          <div className="space-y-3">
            <section className="lab-metric-tile">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="lab-section-title !mb-0">Intervention Gate</p>
                <span className="lab-chip-mono text-[10px]">
                  Transport: {transportMode === 'idle' ? 'pending' : transportMode === 'sse' ? 'SSE stream' : 'JSON fallback'}
                </span>
              </div>
              <p className="text-sm text-[var(--lab-text-secondary)]">{gateState?.rationale || 'Pending gate evaluation.'}</p>
            </section>

            {latestClaimId ? (
              <section className="lab-metric-tile">
                <p className="lab-section-title !mb-1">Claim Lineage</p>
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
              </section>
            ) : null}

            <section className="lab-metric-tile">
              <p className="lab-section-title !mb-1">Diagnostics</p>
              {diagnostics ? (
                <div className="space-y-1.5 text-xs text-[var(--lab-text-secondary)]">
                  <p>Docs: {diagnostics.documentCount} · Entities: {diagnostics.extractedEntities}</p>
                  <p>Actions: {diagnostics.extractedActions} · Harms: {diagnostics.extractedHarms}</p>
                  <p>Pairs: {diagnostics.actionHarmPairsAnalyzed}</p>
                  <p>But-for pass (necessary/both): {diagnostics.butForNecessaryOrBoth}</p>
                  <p>But-for sufficient-only: {diagnostics.butForSufficientOnly} · neither: {diagnostics.butForNeither}</p>
                  <p>Low-confidence: {diagnostics.butForLowConfidence} · LLM-failure signals: {diagnostics.llmFailureSignals}</p>
                  <p>Chains raw→dedup: {diagnostics.causalChainsBeforeDedup} → {diagnostics.causalChainsAfterDedup}</p>
                  <p>Gate allowed/blocked: {diagnostics.gateAllowedChains}/{diagnostics.gateBlockedChains}</p>
                  {diagnostics.extractionWarnings.length > 0 ? (
                    <p className="text-[var(--lab-accent-earth)]">Warnings: {diagnostics.extractionWarnings.slice(0, 2).join(' | ')}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-[var(--lab-text-tertiary)]">No diagnostics yet.</p>
              )}
            </section>

            <section className="lab-metric-tile">
              <p className="lab-section-title !mb-1">Historical Analyses</p>
              {historyLoading ? (
                <p className="text-sm text-[var(--lab-text-secondary)]">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-[var(--lab-text-tertiary)]">No saved analyses.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <button key={entry.id} type="button" className="lab-card-interactive w-full text-left !p-2.5" onClick={() => void loadHistoryEntry(entry.id)}>
                      <p className="truncate text-sm font-medium text-[var(--lab-text-primary)]">{entry.caseTitle}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {entry.createdAt.toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--lab-accent-earth)]" />
                <p className="lab-section-title !mb-0">Chain Metrics</p>
              </div>
              <p className="text-sm text-[var(--lab-text-secondary)]">
                {result
                  ? `${result.causalChains.length} chains · ${result.precedents.length} precedents · ${Math.round((result.verdict?.confidence || 0) * 100)}% confidence`
                  : 'No active verdict metrics.'}
              </p>
            </section>
          </div>
        </EvidenceRail>
      }
    />
  );
}
