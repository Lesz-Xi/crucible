'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Clock3, Gavel, Scale, Sparkles } from 'lucide-react';
import type { LegalCase } from '@/types/legal';
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
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LegalHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

      if (!response.ok || !response.body) {
        throw new Error(`Analysis request failed (${response.status})`);
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event = JSON.parse(line.slice(6)) as Record<string, unknown>;
          handleStreamEvent(event);
        }
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
    setAnalysisStatus({ stage: 'complete', message: 'Loaded historical analysis.', progress: 100 });
  };

  return (
    <WorkbenchShell
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
          <div className="mb-4 flex flex-wrap gap-2">
            <Link href="/chat" className="lab-nav-pill" data-active="false"><Sparkles className="h-4 w-4" />Chat</Link>
            <Link href="/hybrid" className="lab-nav-pill" data-active="false"><Gavel className="h-4 w-4" />Hybrid</Link>
            <Link href="/legal" className="lab-nav-pill" data-active="true"><Scale className="h-4 w-4" />Legal</Link>
          </div>

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
              <p className="lab-section-title !mb-1">Intervention Gate</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">{gateState?.rationale || 'Pending gate evaluation.'}</p>
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
