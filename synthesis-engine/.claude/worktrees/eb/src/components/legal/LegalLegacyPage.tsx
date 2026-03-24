'use client';

/**
 * Legal Reasoning Page
 * 
 * Interface for autonomous legal causation analysis.
 * Implements the Intent → Action → Harm causal chain visualization.
 * 
 * The Taoist Principle: "The valley receives all streams,
 * but only some streams carved the valley."
 * (Correlation ≠ Causation)
 * 
 * Phase 28.Legal: Pearl's Causal Blueprint for Legal Reasoning
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Scale, 
  FileText, 
  Upload, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  BookOpen,
  Link2,
  Gavel,
  Users,
  Clock,
  History,
  ChevronLeft
} from 'lucide-react';
import { 
  LegalCase, 
  LegalCausalChain, 
  LegalPrecedent, 
  LegalVerdict,
  LegalEntity,
  LegalAction
} from '@/types/legal';
import {
  getAnalysisHistory,
  loadAnalysisFromHistory,
  saveAnalysisToHistory,
  LegalHistoryEntry
} from '@/lib/services/legal-history';

interface AnalysisStatus {
  stage: 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'matching' | 'complete' | 'error';
  message: string;
  progress: number;
}

interface LegalGateState {
  allowed: boolean;
  allowedOutputClass: 'association_only' | 'intervention_inferred' | 'intervention_supported';
  allowedChains: number;
  blockedChains: number;
  missingConfounders: string[];
  rationale: string;
  counterfactualTraceIds?: string[];
}

export default function LegalReasoningPage() {
  const [documents, setDocuments] = useState<string[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  const [caseTitle, setCaseTitle] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [caseType, setCaseType] = useState<'criminal' | 'tort' | 'contract' | 'administrative'>('tort');
  
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    stage: 'idle',
    message: 'Upload legal documents to begin analysis',
    progress: 0,
  });
  
  const [result, setResult] = useState<LegalCase | null>(null);
  const [gateState, setGateState] = useState<LegalGateState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History sidebar state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<LegalHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file uploads
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setAnalysisStatus({
      stage: 'uploading',
      message: 'Reading documents...',
      progress: 10,
    });

    const newDocs: string[] = [];
    const newNames: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        newDocs.push(text);
        newNames.push(file.name);
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    setDocuments((prev) => [...prev, ...newDocs]);
    setDocumentNames((prev) => [...prev, ...newNames]);
    
    setAnalysisStatus({
      stage: 'idle',
      message: `${documents.length + newDocs.length} document(s) ready for analysis`,
      progress: 0,
    });
  }, [documents.length]);

  /**
   * Handle streaming events from the API
   */
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const entries = await getAnalysisHistory(20);
    setHistoryEntries(entries);
    setLoadingHistory(false);
  }, []);

  const handleStreamEvent = useCallback((event: any) => {
    switch (event.event) {
      case 'legal_extraction_start':
        setAnalysisStatus({
          stage: 'extracting',
          message: `Extracting from ${event.documentCount} document(s)...`,
          progress: 20,
        });
        break;

      case 'legal_entity_found':
        setAnalysisStatus((prev) => ({
          ...prev,
          message: `Found entity: ${event.entity?.name || 'Unknown'}`,
          progress: Math.min(40, prev.progress + 5),
        }));
        break;

      case 'but_for_analysis_start':
        setAnalysisStatus({
          stage: 'analyzing',
          message: 'Performing but-for causation test...',
          progress: 50,
        });
        break;

      case 'but_for_result':
        setAnalysisStatus((prev) => ({
          ...prev,
          message: `But-for test: ${event.result}`,
          progress: Math.min(70, prev.progress + 10),
        }));
        break;

      case 'causal_chain_established':
        setAnalysisStatus((prev) => ({
          ...prev,
          message: 'Causal chain established',
          progress: Math.min(80, prev.progress + 5),
        }));
        break;

      case 'legal_masa_audit_start':
        setAnalysisStatus({
          stage: 'matching',
          message: 'Finding relevant precedents...',
          progress: 85,
        });
        break;
      
      case 'intervention_gate':
        setGateState({
          allowed: event.allowed,
          allowedOutputClass: event.allowedOutputClass,
          allowedChains: event.allowedChains,
          blockedChains: event.blockedChains,
          missingConfounders: event.missingConfounders || [],
          rationale: event.rationale,
          counterfactualTraceIds: event.counterfactualTraceIds || [],
        });
        break;

      case 'precedent_found':
        setAnalysisStatus((prev) => ({
          ...prev,
          message: `Found precedent: ${event.precedent?.caseName || 'Unknown'}`,
          progress: Math.min(95, prev.progress + 2),
        }));
        break;

      case 'legal_analysis_complete':
        setResult(event.case);
        setAnalysisStatus({
          stage: 'complete',
          message: 'Analysis complete',
          progress: 100,
        });
        // Auto-save to history
        if (event.case) {
          saveAnalysisToHistory(event.case, documentNames).then(() => {
            loadHistory(); // Refresh history list
          });
        }
        break;

      case 'legal_error':
        setError(event.message);
        setAnalysisStatus({
          stage: 'error',
          message: event.message,
          progress: 0,
        });
        break;
    }
  }, [documentNames, loadHistory]);

  /**
   * Run the legal reasoning analysis
   */
  const runAnalysis = useCallback(async () => {
    if (documents.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setError(null);
    setResult(null);
    setGateState(null);

    try {
      // Use streaming endpoint
      const response = await fetch('/api/legal-reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          documents,
          caseTitle: caseTitle || 'Legal Analysis',
          jurisdiction,
          caseType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              handleStreamEvent(event);
            } catch {
              // Skip malformed events
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed');
      setAnalysisStatus({
        stage: 'error',
        message: err.message || 'Analysis failed',
        progress: 0,
      });
    }
  }, [documents, caseTitle, jurisdiction, caseType, handleStreamEvent]);

  /**
   * Clear all data
   */
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
      message: 'Upload legal documents to begin analysis',
      progress: 0,
    });
  };

  /**
   * Load a previous analysis from history
   */
  const handleLoadAnalysis = async (id: string) => {
    const loaded = await loadAnalysisFromHistory(id);
    if (loaded) {
      setResult(loaded);
      setGateState(null);
      setCaseTitle(loaded.title);
      setJurisdiction(loaded.jurisdiction || '');
      if (loaded.caseType) {
        setCaseType(loaded.caseType as 'criminal' | 'tort' | 'contract' | 'administrative');
      }
      setHistoryOpen(false);
      setAnalysisStatus({
        stage: 'complete',
        message: 'Analysis loaded from history',
        progress: 100,
      });
    }
  };

  // Load history when sidebar opens
  useEffect(() => {
    if (historyOpen && historyEntries.length === 0) {
      loadHistory();
    }
  }, [historyOpen, historyEntries.length, loadHistory]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-wabi-clay/20 relative overflow-x-hidden">
      {/* Subtle noise texture */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none z-0" />
      
      {/* Header */}
      <header className="border-b border-wabi-stone/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Scale className="w-8 h-8 text-amber-600/80" />
            <div>
              <h1 className="text-xl font-serif font-bold text-wabi-sumi tracking-widest uppercase">Legal Causation Analyzer</h1>
              <p className="text-xs text-wabi-stone font-mono tracking-wide">
                Pearl's Causal Blueprint • Intent → Action → Harm
              </p>
            </div>
          </div>
          
          {/* History Button */}
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="px-4 py-2 text-sm font-mono text-wabi-moss hover:text-white 
                       bg-wabi-moss/10 hover:bg-wabi-moss rounded-lg transition-colors flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </header>

      {/* History Sidebar */}
      {historyOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-wabi-stone/20 shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-wabi-stone/20 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-wabi-sumi flex items-center gap-2">
              <History className="w-5 h-5 text-wabi-moss" />
              Analysis History
            </h3>
            <button
              onClick={() => setHistoryOpen(false)}
              className="text-wabi-stone hover:text-wabi-sumi transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {loadingHistory ? (
              <div className="text-center text-wabi-stone py-8">Loading...</div>
            ) : historyEntries.length === 0 ? (
              <div className="text-center text-wabi-stone py-8">
                <p>No previous analyses</p>
                <p className="text-xs mt-2">Complete an analysis to save to history</p>
              </div>
            ) : (
              historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-wabi-patina/5 rounded-lg p-3 border border-wabi-patina/10 hover:border-wabi-moss/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-wabi-sumi line-clamp-2">
                      {entry.caseTitle}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs mb-2">
                    {entry.caseType && (
                      <span className="px-2 py-0.5 bg-wabi-clay/20 text-wabi-clay rounded font-mono">
                        {entry.caseType}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-mono ${
                      entry.causationEstablished 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {entry.chainsCount} chains
                    </span>
                    <span className="px-2 py-0.5 bg-wabi-stone/10 text-wabi-stone rounded font-mono">
                      {Math.round(entry.confidence * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-wabi-stone">
                      {entry.createdAt.toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleLoadAnalysis(entry.id)}
                      className="px-3 py-1 text-xs font-medium text-wabi-moss hover:text-white 
                                 bg-wabi-moss/10 hover:bg-wabi-moss rounded transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Document Upload */}
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-wabi-stone/10 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-wabi-sumi">
                <FileText className="w-5 h-5 text-wabi-clay" />
                Documents
              </h2>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".txt,.md,.pdf"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-wabi-stone/30 rounded-lg
                         hover:border-wabi-clay hover:bg-wabi-clay/5 transition-all
                         flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-wabi-stone" />
                <span className="text-sm text-wabi-stone">
                  Upload legal documents (.txt, .md)
                </span>
              </button>

              {documentNames.length > 0 && (
                <div className="mt-4 space-y-2">
                  {documentNames.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-white/30 rounded text-sm"
                    >
                      <FileText className="w-4 h-4 text-wabi-clay" />
                      <span className="truncate">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Case Details */}
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-wabi-stone/10 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-wabi-sumi">
                <Gavel className="w-5 h-5 text-amber-600/80" />
                Case Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-wabi-stone mb-1 font-mono">Case Title</label>
                  <input
                    type="text"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="e.g., Smith v. Jones"
                    className="w-full px-3 py-2 bg-white/50 border border-wabi-stone/20 rounded
                             focus:border-wabi-clay focus:outline-none text-wabi-sumi"
                  />
                </div>

                <div>
                  <label className="block text-sm text-wabi-stone mb-1 font-mono">Jurisdiction</label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g., California, Federal"
                    className="w-full px-3 py-2 bg-white/50 border border-wabi-stone/20 rounded
                             focus:border-wabi-clay focus:outline-none text-wabi-sumi"
                  />
                </div>

                <div>
                  <label className="block text-sm text-wabi-stone mb-1 font-mono">Case Type</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/50 border border-wabi-stone/20 rounded
                             focus:border-wabi-clay focus:outline-none text-wabi-sumi"
                  >
                    <option value="tort">Tort</option>
                    <option value="criminal">Criminal</option>
                    <option value="contract">Contract</option>
                    <option value="administrative">Administrative</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={runAnalysis}
                disabled={documents.length === 0 || analysisStatus.stage === 'analyzing'}
                className="flex-1 px-4 py-3 bg-wabi-clay hover:bg-wabi-clay/80 disabled:bg-wabi-stone/30
                         disabled:cursor-not-allowed rounded-lg font-medium flex items-center
                         justify-center gap-2 transition-colors text-white"
              >
                <Play className="w-5 h-5" />
                Analyze Causation
              </button>

              <button
                onClick={clearAll}
                className="px-4 py-3 bg-white/40 hover:bg-white/60 rounded-lg border border-wabi-stone/20
                         font-medium transition-colors text-wabi-sumi"
              >
                Clear
              </button>
            </div>

            {/* Status */}
            {analysisStatus.stage !== 'idle' && (
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-wabi-stone/10">
                <div className="flex items-center gap-2 mb-2">
                  {analysisStatus.stage === 'complete' && (
                    <CheckCircle className="w-5 h-5 text-wabi-moss" />
                  )}
                  {analysisStatus.stage === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {!['complete', 'error', 'idle'].includes(analysisStatus.stage) && (
                    <div className="w-5 h-5 border-2 border-wabi-clay border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="text-sm text-wabi-sumi">{analysisStatus.message}</span>
                </div>
                {analysisStatus.progress > 0 && analysisStatus.stage !== 'error' && (
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wabi-clay transition-all duration-500"
                      style={{ width: `${analysisStatus.progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* Verdict Summary */}
                {gateState && (
                  <InterventionGateCard gate={gateState} />
                )}
                {result.verdict && (
                  <VerdictCard verdict={result.verdict} />
                )}

                {/* Causal Chains */}
                <CausalChainsSection chains={result.causalChains} />

                {/* Parties */}
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-wabi-stone/10 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-wabi-sumi">
                    <Users className="w-5 h-5 text-wabi-moss" />
                    Parties ({result.parties.length})
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    {result.parties.map((party, i) => (
                      <EntityCard key={i} entity={party} />
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-wabi-stone/10 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-wabi-sumi">
                    <Clock className="w-5 h-5 text-amber-600/80" />
                    Timeline ({result.timeline.length} actions)
                  </h2>

                  <div className="space-y-3">
                    {result.timeline.map((action, i) => (
                      <ActionCard key={i} action={action} index={i} />
                    ))}
                  </div>
                </div>

                {/* Precedents */}
                {result.precedents.length > 0 && (
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-wabi-stone/10 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-wabi-sumi">
                      <BookOpen className="w-5 h-5 text-amber-600/80" />
                      Relevant Precedents ({result.precedents.length})
                    </h2>

                    <div className="space-y-4">
                      {result.precedents.map((precedent, i) => (
                        <PrecedentCard key={i} precedent={precedent} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-12 border border-wabi-stone/10 text-center shadow-sm">
                <Scale className="w-16 h-16 text-wabi-stone/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-wabi-sumi mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-wabi-stone max-w-md mx-auto">
                  Upload legal documents and click "Analyze Causation" to identify
                  Intent → Action → Harm chains and find relevant precedents.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Verdict Summary Card
 */
function VerdictCard({ verdict }: { verdict: LegalVerdict }) {
  return (
    <div
      className={`rounded-xl p-6 border ${
        verdict.liable
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-full ${
            verdict.liable ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          {verdict.liable ? (
            <AlertTriangle className="w-8 h-8 text-red-600" />
          ) : (
            <CheckCircle className="w-8 h-8 text-green-600" />
          )}
        </div>

        <div className="flex-1">
          <h2 className={`text-xl font-bold ${
            verdict.liable ? 'text-red-700' : 'text-green-700'
          }`}>
            {verdict.liable ? 'Causation Established' : 'Causation Not Established'}
          </h2>

          <p className="text-wabi-sumi mt-2">{verdict.reasoning}</p>

          <div className="flex flex-wrap gap-4 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-mono ${
              verdict.butForSatisfied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              But-For: {verdict.butForSatisfied ? 'Satisfied' : 'Not Satisfied'}
            </span>

            <span className={`px-3 py-1 rounded-full text-sm font-mono ${
              verdict.proximateCauseSatisfied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              Proximate Cause: {verdict.proximateCauseSatisfied ? 'Satisfied' : 'Not Satisfied'}
            </span>

            <span className="px-3 py-1 rounded-full text-sm font-mono bg-wabi-clay/20 text-wabi-clay">
              Confidence: {Math.round(verdict.confidence * 100)}%
            </span>
          </div>

          {verdict.caveats && verdict.caveats.length > 0 && (
            <div className="mt-4 text-sm text-wabi-stone">
              <p className="font-medium">Caveats:</p>
              <ul className="list-disc ml-4 mt-1">
                {verdict.caveats.map((caveat, i) => (
                  <li key={i}>{caveat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InterventionGateCard({ gate }: { gate: LegalGateState }) {
  const tone =
    gate.allowedOutputClass === 'intervention_supported'
      ? {
          shell: 'bg-emerald-50 border-emerald-200',
          chip: 'bg-emerald-100 text-emerald-700',
          title: 'text-emerald-700',
        }
      : gate.allowedOutputClass === 'intervention_inferred'
        ? {
            shell: 'bg-amber-50 border-amber-200',
            chip: 'bg-amber-100 text-amber-700',
            title: 'text-amber-700',
          }
        : {
            shell: 'bg-rose-50 border-rose-200',
            chip: 'bg-rose-100 text-rose-700',
            title: 'text-rose-700',
          };

  return (
    <div className={`rounded-xl p-4 border ${tone.shell}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-sm font-mono uppercase tracking-[0.18em] ${tone.title}`}>
          Intervention Gate
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.12em] ${tone.chip}`}>
          {gate.allowedOutputClass.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="mt-2 text-sm text-wabi-sumi">{gate.rationale}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono text-wabi-stone">
        <span>Allowed chains: {gate.allowedChains}</span>
        <span>Blocked chains: {gate.blockedChains}</span>
        {gate.missingConfounders.length > 0 && (
          <span>Missing confounders: {gate.missingConfounders.join(', ')}</span>
        )}
      </div>
      {(gate.counterfactualTraceIds?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {gate.counterfactualTraceIds?.slice(0, 3).map((traceId) => (
            <a
              key={traceId}
              href={`/api/scm/counterfactual-traces/${traceId}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border-subtle)] bg-white/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-wabi-sumi hover:border-wabi-clay/45"
            >
              Trace {traceId.slice(0, 8)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Causal Chains Section - With expand/collapse all controls
 */
function CausalChainsSection({ chains }: { chains: LegalCausalChain[] }) {
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    // First 3 expanded by default
    new Set([0, 1, 2])
  );
  
  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIndices(new Set([0, 1, 2])); // Reset to first 3
    } else {
      setExpandedIndices(new Set(chains.map((_, i) => i))); // Expand all
    }
    setAllExpanded(!allExpanded);
  };
  
  const toggleChain = (index: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedIndices(newSet);
    // Update allExpanded state
    setAllExpanded(newSet.size === chains.length);
  };
  
  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-wabi-stone/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-wabi-sumi">
          <Link2 className="w-5 h-5 text-wabi-moss" />
          Causal Chains ({chains.length})
        </h2>
        
        {chains.length > 3 && (
          <button
            onClick={toggleAll}
            className="px-3 py-1 text-xs font-mono text-wabi-moss hover:text-wabi-sumi 
                       bg-wabi-moss/10 hover:bg-wabi-moss/20 rounded transition-colors"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {chains.length === 0 ? (
        <div className="text-wabi-stone text-center py-8">
          <p>No causal chains could be established.</p>
          <p className="text-sm mt-2 italic">
            "The valley receives all streams, but only some streams carved the valley."
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chains.map((chain, i) => (
            <CausalChainCard 
              key={i} 
              chain={chain} 
              index={i}
              isExpanded={expandedIndices.has(i)}
              onToggle={() => toggleChain(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Causal Chain Card - Collapsible with improved layout
 */
function CausalChainCard({ chain, index, isExpanded, onToggle }: { 
  chain: LegalCausalChain; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white/50 rounded-lg border border-wabi-stone/20 overflow-hidden">
      {/* Header - Always visible, clickable */}
      <button 
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-white/30 transition-colors text-left"
      >
        <ChevronRight className={`w-4 h-4 text-wabi-stone transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <span className="px-2 py-0.5 bg-wabi-moss/20 text-wabi-moss rounded text-xs font-medium font-mono">
          Chain {index + 1}
        </span>
        <span className="px-2 py-0.5 bg-wabi-clay/20 text-wabi-clay rounded text-xs font-mono">
          Strength: {Math.round(chain.causalStrength * 100)}%
        </span>
        {chain.proximateCauseEstablished && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-mono">
            Proximate ✓
          </span>
        )}
        {/* Preview of action (truncated) */}
        <span className="flex-1 text-xs text-wabi-stone truncate ml-2">
          {chain.action.description.slice(0, 60)}...
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Intent → Action → Harm - Stacked vertical layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Intent */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <span className="text-xs text-amber-600 block font-mono mb-1">Intent</span>
              <span className="text-amber-800 font-medium">{chain.intent.type}</span>
              {chain.intent.description && (
                <p className="text-xs text-amber-700 mt-1">{chain.intent.description}</p>
              )}
            </div>

            {/* Action */}
            <div className="bg-wabi-clay/5 rounded-lg p-3 border border-wabi-clay/20">
              <span className="text-xs text-wabi-clay block font-mono mb-1">Action</span>
              <p className="text-sm text-wabi-sumi leading-relaxed">{chain.action.description}</p>
            </div>

            {/* Harm */}
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <span className="text-xs text-red-600 block font-mono mb-1">Harm</span>
              <p className="text-sm text-red-800 leading-relaxed">{chain.harm.description}</p>
              {chain.harm.severity && (
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-mono ${
                  chain.harm.severity === 'catastrophic' ? 'bg-red-200 text-red-800' :
                  chain.harm.severity === 'severe' ? 'bg-orange-200 text-orange-800' :
                  chain.harm.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {chain.harm.severity}
                </span>
              )}
            </div>
          </div>

          {/* But-For Test Analysis */}
          {chain.butForAnalysis && (
            <div className="bg-wabi-patina/5 rounded-lg p-3 border border-wabi-patina/20 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium font-mono text-sm text-wabi-sumi">But-For Test:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                  chain.butForAnalysis.result === 'both' ? 'bg-green-100 text-green-700' :
                  chain.butForAnalysis.result === 'necessary' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {chain.butForAnalysis.result} (confidence: {Math.round(chain.butForAnalysis.confidence * 100)}%)
                </span>
              </div>
              {chain.butForAnalysis.counterfactualScenario && (
                <p className="text-sm text-wabi-stone italic leading-relaxed">
                  "{chain.butForAnalysis.counterfactualScenario}"
                </p>
              )}
              {chain.butForAnalysis.counterfactualTrace && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-wabi-stone">
                    {chain.butForAnalysis.counterfactualTrace.method}
                  </span>
                  <a
                    href={chain.butForAnalysis.counterfactualTrace.retrievalPath}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--border-subtle)] bg-white/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-wabi-sumi hover:border-wabi-clay/45"
                  >
                    Trace {chain.butForAnalysis.counterfactualTrace.traceId.slice(0, 8)}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Entity Card
 */
function EntityCard({ entity }: { entity: LegalEntity }) {
  const roleColors: Record<string, string> = {
    plaintiff: 'text-blue-700 bg-blue-100',
    defendant: 'text-red-700 bg-red-100',
    witness: 'text-green-700 bg-green-100',
    third_party: 'text-purple-700 bg-purple-100',
    victim: 'text-orange-700 bg-orange-100',
  };

  return (
    <div className="bg-white/50 rounded-lg p-3 border border-wabi-stone/20">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-wabi-sumi">{entity.name}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-mono ${roleColors[entity.role] || 'text-wabi-stone bg-white/70'}`}>
          {entity.role}
        </span>
      </div>
      {entity.type && (
        <span className="text-xs text-wabi-stone">{entity.type}</span>
      )}
    </div>
  );
}

/**
 * Action Card
 */
function ActionCard({ action, index }: { action: LegalAction; index: number }) {
  return (
    <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3 border border-wabi-stone/20">
      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-medium">
        {index + 1}
      </div>
      <div className="flex-1">
        <p className="text-sm text-wabi-sumi">{action.description}</p>
        <div className="flex gap-2 mt-1">
          {action.actor && (
            <span className="text-xs text-wabi-stone font-mono">Actor: {action.actor}</span>
          )}
          {action.timestamp && (
            <span className="text-xs text-wabi-stone font-mono">
              {new Date(action.timestamp).toLocaleDateString()}
            </span>
          )}
          {action.intent && (
            <span className="text-xs text-amber-700">{action.intent.type}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Precedent Card
 */
function PrecedentCard({ precedent }: { precedent: LegalPrecedent }) {
  return (
    <div className="bg-white/50 rounded-lg p-4 border border-wabi-stone/20">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-amber-700">{precedent.caseName}</h4>
          <p className="text-xs text-wabi-stone font-mono">
            {precedent.citation} ({precedent.year})
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
          precedent.causalPattern.ruling === 'liable' 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {precedent.causalPattern.ruling === 'liable' ? 'Liable' : 'Not Liable'}
        </span>
      </div>

      <p className="text-sm text-wabi-sumi mt-2">{precedent.holdingText}</p>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-wabi-stone font-mono">Similarity:</span>
        <div className="flex-1 h-2 bg-white/70 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500"
            style={{ width: `${Math.round(precedent.similarity * 100)}%` }}
          />
        </div>
        <span className="text-xs text-wabi-stone font-mono">
          {Math.round(precedent.similarity * 100)}%
        </span>
      </div>
    </div>
  );
}
