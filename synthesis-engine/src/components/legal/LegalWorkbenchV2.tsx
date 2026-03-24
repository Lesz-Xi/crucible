'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LegalCase, LegalDiagnostics } from '@/types/legal';
import { getAnalysisHistory, loadAnalysisFromHistory, saveAnalysisToHistory, type LegalHistoryEntry } from '@/lib/services/legal-history';
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
    setCaseTitle(loaded.title);
    setJurisdiction(loaded.jurisdiction || '');
    setCaseType((loaded.caseType as 'criminal' | 'tort' | 'contract' | 'administrative') || 'tort');
    setDiagnostics(null);
    setAnalysisStatus({ stage: 'complete', message: 'Loaded historical analysis.', progress: 100 });
  };

  return (
    <WorkbenchShell
      feature="legal"
      mainMode="split"
      mainTopbar={
        <>
          <span className="topbar-tag">Legal Analysis Engine</span>
          <div className="topbar-pipeline">
            <span className={analysisStatus.stage !== 'idle' ? 'step done' : 'step'}>intake</span>
            <span className="arrow">→</span>
            <span className={analysisStatus.stage === 'extracting' || analysisStatus.stage === 'analyzing' || analysisStatus.stage === 'matching' || analysisStatus.stage === 'complete' ? 'step done' : 'step'}>extract</span>
            <span className="arrow">→</span>
            <span className={analysisStatus.stage === 'analyzing' || analysisStatus.stage === 'matching' || analysisStatus.stage === 'complete' ? 'step done' : 'step'}>analyze</span>
            <span className="arrow">→</span>
            <span className={analysisStatus.stage === 'matching' || analysisStatus.stage === 'complete' ? 'step done' : 'step'}>match</span>
          </div>
          <span className="topbar-phase">Phase: {analysisStatus.stage}</span>
        </>
      }
      mainContent={
        <div className="split-workspace">
          <div className="split-sidebar w-full lg:w-[500px] xl:w-[600px] shrink-0 transition-all duration-500 ease-out z-20">
            <div className="hybrid-section-head">Case Intake</div>
            <p className="hybrid-sub">Documents, jurisdiction, and legal context setup</p>

            <div className="feature-panel-stack mt-5">
              <div className="feature-panel-shell">
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
              </div>

              <div className="feature-panel-shell">
                <div className="panel-section-head">Historical Analyses</div>
                {historyLoading ? (
                  <p className="text-sm text-[var(--text-2)]">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-[var(--text-3)]">No saved analyses.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry) => (
                      <button key={entry.id} type="button" className="history-item" onClick={() => void loadHistoryEntry(entry.id)}>
                        {entry.caseTitle}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="split-canvas">
            <div className="canvas-stats">
              <div className="stat-card">
                <div className="stat-label">Case Title</div>
                <div className="stat-value">{caseTitle ? '1' : '0'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Documents</div>
                <div className="stat-value">{documentNames.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Transport</div>
                <div className="stat-value">{transportMode === 'sse' ? 'S' : transportMode === 'json-fallback' ? 'J' : 'P'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Diagnostics</div>
                <div className="stat-value">{diagnostics ? diagnostics.documentCount : 0}</div>
              </div>
            </div>

            <div className="canvas-body relative p-1 rounded-3xl overflow-hidden glassmorphism-board border border-white/5 dark:bg-black bg-zinc-900 shadow-2xl">
              {/* Marching borders effect via rotating dashed pseudo-element or gradient */}
              <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_25%,rgba(255,255,255,0.4)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.4)_75%,rgba(255,255,255,0.4)_100%)] bg-[length:24px_24px] pointer-events-none" style={{ animation: 'slideRight 2s linear infinite' }} />
              <div className="w-full relative z-10 bg-[var(--lab-bg)] dark:bg-[var(--lab-panel-soft)] rounded-[1.35rem] h-full overflow-hidden p-2">
                <LegalAnalysisPanelV2
                  statusMessage={analysisStatus.message}
                  progress={analysisStatus.progress}
                  stage={analysisStatus.stage}
                  result={result}
                  gateState={gateState}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
