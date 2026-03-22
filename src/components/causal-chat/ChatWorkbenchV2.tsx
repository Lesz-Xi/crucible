'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Focus, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { parseSSEChunk } from '@/lib/services/sse-event-parser';
import { ChatPersistence } from '@/lib/services/chat-persistence';
import { ChatComposerV2, type ComposerAttachment } from '@/components/causal-chat/ChatComposerV2';
import { ThinkingAnimation } from '@/components/causal-chat/ThinkingAnimation';
import { useAppShellChrome } from '@/components/dashboard/AppShellChromeContext';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';
import type { FactualConfidenceResult, GroundingSource } from '@/types/chat-grounding';
import type { ScientificAnalysisResponse } from '@/lib/science/scientific-analysis-service';
import { buildModelProvenanceDisplayState } from '@/lib/workbench/model-provenance-display';
import { ScientificTableCard } from '@/components/causal-chat/ScientificTableCard';
import type { WorkbenchEvidenceItem, WorkbenchEvidenceRailConfig, WorkbenchTone } from '@/types/workbench';
import { cn } from '@/lib/utils';

interface WorkbenchMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
  scientificAnalysis?: ScientificAnalysisResponse;
}

interface AssistantEventPayload {
  text?: string;
  token?: string;
  score?: number;
  label?: string;
  confidence?: number;
  model_key?: string;
  model_version?: string;
  requested_model?: string;
  used_model?: string;
  provider?: string;
  primary?: string;
  allowed?: boolean;
  rationale?: string;
  message?: string;
  finished?: boolean;
  sources?: GroundingSource[];
  sourceCount?: number;
  topDomains?: string[];
  level?: FactualConfidenceResult["level"];
  claimId?: string;
  analysis?: ScientificAnalysisResponse;
}

type OperatorMode = 'explore' | 'intervene' | 'audit';

const OPERATOR_MODE_LABELS: Record<OperatorMode, string> = {
  explore: 'Discovery',
  intervene: 'Intervention',
  audit: 'Audit',
};

function ChatWorkbenchTopbar({
  operatorMode,
  sourceCount,
}: {
  operatorMode: OperatorMode;
  sourceCount: number;
}) {
  const shellChrome = useAppShellChrome();

  return (
    <>
      <span className="topbar-tag">Causal Research Workbench</span>
      <div className="topbar-pipeline">
        <span className="step done">observe</span>
        <span className="arrow">→</span>
        <span className={operatorMode !== 'explore' ? 'step done' : 'step'}>intervene</span>
        <span className="arrow">→</span>
        <span className={operatorMode === 'audit' ? 'step done' : 'step'}>audit</span>
      </div>
      <span className="topbar-phase">Mode: {OPERATOR_MODE_LABELS[operatorMode]}</span>
      <div className="workbench-toolbar">
        <span className="workbench-toolbar-meta">
          Sources <strong>{sourceCount}</strong>
        </span>
        <button
          type="button"
          className={shellChrome?.evidenceRailVisible ? 'workbench-toolbar-chip is-active' : 'workbench-toolbar-chip'}
          onClick={() => shellChrome?.setEvidenceRailVisible((current) => !current)}
          aria-label={shellChrome?.evidenceRailVisible ? 'Hide evidence rail' : 'Show evidence rail'}
          title={shellChrome?.evidenceRailVisible ? 'Hide evidence rail' : 'Show evidence rail'}
        >
          {shellChrome?.evidenceRailVisible ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          <span>Evidence</span>
        </button>
        <button
          type="button"
          className={shellChrome?.focusMode ? 'workbench-toolbar-chip is-active' : 'workbench-toolbar-chip'}
          onClick={() => shellChrome?.setFocusMode((current) => !current)}
          aria-label={shellChrome?.focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          title={shellChrome?.focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          <Focus className="h-3.5 w-3.5" />
          <span>Focus</span>
        </button>
      </div>
    </>
  );
}

interface PendingAttachment extends ComposerAttachment {
  file: File;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const payload = result.includes(',') ? result.split(',')[1] : result;
        resolve(payload || '');
      } else {
        reject(new Error('Failed to read attachment as base64 string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Attachment read failed'));
    reader.readAsDataURL(file);
  });

const quantizeConfidence = (value: number): number => {
  const bounded = Math.max(0, Math.min(1, value));
  const percent = bounded * 100;
  if (percent < 50) return 0.45;
  if (percent < 60) return 0.55;
  if (percent < 70) return 0.65;
  if (percent < 80) return 0.75;
  if (percent < 90) return 0.85;
  return 0.95;
};

const AUTOMATED_SCIENTIST_STAGES = [
  'Observation framing',
  'Hypothesis synthesis',
  'Prediction drafting',
  'Falsification checks',
  'Test-plan compilation',
] as const;

const parseInterventionPayload = (input: string): {
  node_id: string;
  value: string;
  outcome_var?: string;
  known_confounders?: string[];
  adjustment_set?: string[];
} | null => {
  const text = input || '';

  const doMatch = text.match(/do\(\s*([a-zA-Z0-9_]+)\s*=\s*([^\)]+)\)/i);
  if (!doMatch) return null;

  const node_id = doMatch[1]?.trim();
  const value = doMatch[2]?.trim();
  if (!node_id || !value) return null;

  const extractList = (pattern: RegExp): string[] => {
    const match = text.match(pattern);
    if (!match?.[1]) return [];
    return match[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const outcomeMatch = text.match(/outcome\s*:\s*([a-zA-Z0-9_]+)/i);
  const knownConfounders = extractList(/known\s+confounders\s*:\s*([^\.\n]+)/i);
  const adjustmentSet = extractList(/adjustment\s+set\s*:\s*([^\.\n]+)/i);

  return {
    node_id,
    value,
    outcome_var: outcomeMatch?.[1]?.trim(),
    known_confounders: knownConfounders,
    adjustment_set: adjustmentSet,
  };
};

const inferOperatorMode = (input: string): OperatorMode => {
  const text = input.toLowerCase();

  const auditSignals = [
    'audit',
    'verify',
    'validation',
    'fact check',
    'citation',
    'source',
    'uncertainty',
    'falsifier',
    'evidence quality',
    'confidence score',
  ];

  const interveneSignals = [
    'do(',
    'intervention',
    'intervene',
    'treatment',
    'counterfactual',
    'what if we change',
    'what happens if',
    'manipulate',
    'policy change',
    'expected delta',
    'controlled',
    'ab test',
  ];

  if (auditSignals.some((signal) => text.includes(signal))) return 'audit';
  if (interveneSignals.some((signal) => text.includes(signal))) return 'intervene';
  return 'explore';
};

interface SessionHistoryMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
  domain_classified?: string | null;
  model_key?: string | null;
  causal_density?: {
    score?: number;
    label?: string;
    confidence?: number;
  } | null;
  scientific_analysis?: ScientificAnalysisResponse | null;
}

const isRealDomain = (value: string | null | undefined): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value !== 'unclassified' &&
  value !== 'abstract' &&
  value !== 'unknown';

const isRealModelKey = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value !== 'default';

const extractCitedRanksFromText = (text: string): Set<number> => {
  const matches = text.match(/\[(\d+)\]/g) || [];
  const ranks = new Set<number>();
  for (const token of matches) {
    const rank = Number(token.replace(/[^0-9]/g, ''));
    if (Number.isFinite(rank) && rank > 0) ranks.add(rank);
  }
  return ranks;
};

const extractSourcesFromText = (text: string): GroundingSource[] => {
  const lines = text.split('\n');
  const sources: GroundingSource[] = [];
  const regex = /^\[(\d+)\]\s+(.+?)\s+—\s+(https?:\/\/\S+)$/;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (!match) continue;

    const rank = Number(match[1]) || sources.length + 1;
    const title = match[2].trim();
    const link = match[3].trim();
    let domain = 'unknown';
    try {
      domain = new URL(link).hostname.replace(/^www\./, '');
    } catch {
      domain = 'unknown';
    }

    sources.push({ rank, title, link, domain, snippet: domain });
  }

  return sources.slice(0, 5);
};

const flattenMarkdownText = (value: ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenMarkdownText).join('');
  return '';
};

const CHAT_MARKDOWN_COMPONENTS: Components = {
  pre({ children }) {
    return <div className="chat-code-frame">{children}</div>;
  },
  code({ children, className, ...props }) {
    const text = flattenMarkdownText(children).replace(/\n$/, '');
    const language = className?.match(/language-([\w-]+)/)?.[1];
    const isBlock = Boolean(language) || text.includes('\n');

    if (!isBlock) {
      return (
        <code className="chat-inline-code" {...props}>
          {text}
        </code>
      );
    }

    return (
      <code
        className={cn('chat-code-block', className)}
        data-language={language || undefined}
        {...props}
      >
        {text}
      </code>
    );
  },
  table({ children }) {
    return (
      <div className="chat-table-wrap">
        <table className="chat-table">{children}</table>
      </div>
    );
  },
  blockquote({ children }) {
    return <blockquote className="chat-blockquote">{children}</blockquote>;
  },
  a({ href, children, ...props }) {
    const external = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
      <a
        {...props}
        href={href}
        className="chat-link"
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
      >
        {children}
      </a>
    );
  },
};



const normalizeHistoryRole = (role: unknown): 'user' | 'assistant' | null => {
  if (typeof role !== 'string') return null;
  const value = role.trim().toLowerCase();
  if (['user', 'human', 'researcher', 'client'].includes(value)) return 'user';
  if (['assistant', 'ai', 'model', 'system', 'agent', 'wu-weism'].includes(value)) return 'assistant';
  return null;
};

const inferHistoricalTone = (analysis?: ScientificAnalysisResponse | null): WorkbenchTone => {
  if (!analysis) return 'neutral';
  if (analysis.status === 'completed') return 'green';
  if (analysis.status === 'partial') return 'amber';
  return 'red';
};

const buildHistoricalConfidence = (
  analysis: ScientificAnalysisResponse | undefined,
  density: { score: number; label: string; confidence: number } | null,
): FactualConfidenceResult | null => {
  if (!analysis) return null;

  const tone = inferHistoricalTone(analysis);
  const score =
    typeof density?.confidence === 'number' && Number.isFinite(density.confidence)
      ? density.confidence
      : tone === 'green'
        ? 0.82
        : tone === 'amber'
          ? 0.58
          : 0.24;

  const rationale =
    analysis.warnings[0] ||
    `Restored ${analysis.summary.dataPointCount} quantitative points across ${analysis.summary.trustedTableCount}/${analysis.summary.tableCount} trusted tables.`;

  return {
    level: tone === 'green' ? 'high' : tone === 'amber' ? 'medium' : 'low',
    score,
    rationale,
  };
};

const buildHistoricalEvidenceItems = (
  analysis: ScientificAnalysisResponse | undefined,
): WorkbenchEvidenceItem[] => {
  if (!analysis) return [];

  return analysis.numericEvidence.slice(0, 6).map((item, index) => {
    const variableLabel =
      item.variableYName && item.variableXName
        ? `${item.variableYName} vs ${item.variableXName}`
        : item.variableYName || item.variableXName || `Evidence record ${index + 1}`;

    return {
      id: `${analysis.ingestionId}-${index}`,
      title: variableLabel,
      meta: item.contextSnippet || 'Restored from historical scientific analysis.',
      badge: item.source,
    };
  });
};

const buildHistoricalAlignmentCopy = (
  analysis: ScientificAnalysisResponse | undefined,
  fallback: string,
): string => {
  if (!analysis) return fallback;
  if (analysis.warnings.length > 0) return analysis.warnings[0];

  return `Restored scientific review recovered ${analysis.summary.dataPointCount} quantified points across ${analysis.summary.trustedTableCount}/${analysis.summary.tableCount} trusted tables.`;
};

export function ChatWorkbenchV2() {
  const chatPersistence = useMemo(() => new ChatPersistence(), []);
  const [messages, setMessages] = useState<WorkbenchMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>('unclassified');
  const [currentModelKey, setCurrentModelKey] = useState<string>('default');
  const [modelFallbackNotice, setModelFallbackNotice] = useState<string | null>(null);
  const [lastDensity, setLastDensity] = useState<{ score: number; label: string; confidence: number } | null>(null);
  const currentDomainRef = useRef<string>('unclassified');
  const currentModelKeyRef = useRef<string>('default');
  const lastDensityRef = useRef<{ score: number; label: string; confidence: number } | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [, setGroundingStatus] = useState<'idle' | 'searching' | 'ready' | 'failed'>('idle');
  const [, setGroundingError] = useState<string | null>(null);
  const [, setUsedGroundingFallback] = useState(false);
  const [factualConfidence, setFactualConfidence] = useState<FactualConfidenceResult | null>(null);
  const [alignmentPosture, setAlignmentPosture] = useState<string>('No unaudited intervention claims without identifiability gates.');
  const [latestClaimId, setLatestClaimId] = useState<string | null>(null);
  const [claimCopied, setClaimCopied] = useState(false);
  const [operatorMode, setOperatorMode] = useState<OperatorMode>('explore');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [isHistoricalReview, setIsHistoricalReview] = useState(false);
  const assistantContentRef = useRef<string>('');
  const scientificAnalysisRef = useRef<ScientificAnalysisResponse | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionCacheRef = useRef<Map<string, SessionHistoryMessage[]>>(new Map());
  const loadRequestIdRef = useRef(0);
  const loadAbortControllerRef = useRef<AbortController | null>(null);
  const groundingSourcesLengthRef = useRef(0);

  // Keep ref in sync so loadSession reads current value without being a dependency
  useEffect(() => {
    groundingSourcesLengthRef.current = groundingSources.length;
  }, [groundingSources.length]);

  const resetThread = useCallback(() => {
    loadRequestIdRef.current += 1;
    loadAbortControllerRef.current?.abort();
    setMessages([]);
    setPrompt('');
    setError(null);
    setDbSessionId(null);
    setIsHistoricalReview(false);
    setCurrentDomain('unclassified');
    currentDomainRef.current = 'unclassified';
    setCurrentModelKey('default');
    currentModelKeyRef.current = 'default';
    setModelFallbackNotice(null);
    setLastDensity(null);
    // Clear refs for new generation
    assistantContentRef.current = '';
    lastDensityRef.current = null;
    scientificAnalysisRef.current = undefined;
    setGroundingSources([]);
    setGroundingStatus('idle');
    setGroundingError(null);
    setUsedGroundingFallback(false);
    setFactualConfidence(null);
    setAlignmentPosture('No unaudited intervention claims without identifiability gates.');
    setLatestClaimId(null);
    setClaimCopied(false);
  }, []);

  useEffect(() => {
    return () => {
      loadAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStageIndex((current) => (current + 1) % AUTOMATED_SCIENTIST_STAGES.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  const applySessionHistory = useCallback((sessionId: string, historyMessages: SessionHistoryMessage[]) => {
    console.log('[DEBUG applySessionHistory] called with', sessionId, 'messages:', historyMessages.length);
    const sortedMessages = [...historyMessages]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let normalizedHistory = sortedMessages
      .map((message, index) => ({
        ...message,
        __role: normalizeHistoryRole(message.role),
        __index: index,
      }))
      .filter((message) => message.__role === 'user' || message.__role === 'assistant');

    // Recovery for legacy/broken role persistence: if everything came back as user, infer alternating turns.
    if (normalizedHistory.length > 1 && !normalizedHistory.some((m) => m.__role === 'assistant')) {
      normalizedHistory = normalizedHistory.map((message, index) => ({
        ...message,
        __role: index % 2 === 0 ? 'user' : 'assistant',
      }));
    }

    const filteredMessages = normalizedHistory as Array<SessionHistoryMessage & { __role: 'user' | 'assistant' }>;

    const loadedMessages: WorkbenchMessage[] = filteredMessages.map((message) => ({
      id: message.id,
      role: message.__role,
      content: message.content,
      createdAt: new Date(message.created_at),
      scientificAnalysis: message.__role === 'assistant' ? message.scientific_analysis || undefined : undefined,
    }));

    const latestAssistantWithDensity = [...filteredMessages]
      .reverse()
      .find((message) => {
        if (message.__role !== 'assistant') return false;
        const density = message.causal_density;
        return (
          !!density &&
          typeof density.score === 'number' &&
          Number.isFinite(density.score) &&
          typeof density.confidence === 'number' &&
          Number.isFinite(density.confidence)
        );
      });

    const latestAssistantWithEvidence = latestAssistantWithDensity || [...filteredMessages]
      .reverse()
      .find((message) => {
        if (message.__role !== 'assistant') return false;
        return isRealDomain(message.domain_classified) || isRealModelKey(message.model_key);
      });

    const restoredDomain = isRealDomain(latestAssistantWithEvidence?.domain_classified)
      ? latestAssistantWithEvidence.domain_classified
      : 'unclassified';
    const restoredModelKey = isRealModelKey(latestAssistantWithEvidence?.model_key)
      ? latestAssistantWithEvidence.model_key
      : 'default';

    console.log('[DEBUG applySessionHistory] setting', loadedMessages.length, 'messages for session', sessionId);
    setMessages(loadedMessages);
    setIsHistoricalReview(loadedMessages.length > 0);
    setCurrentDomain(restoredDomain);
    currentDomainRef.current = restoredDomain;
    setCurrentModelKey(restoredModelKey);
    currentModelKeyRef.current = restoredModelKey;

    if (
      latestAssistantWithDensity?.causal_density &&
      typeof latestAssistantWithDensity.causal_density.score === 'number' &&
      typeof latestAssistantWithDensity.causal_density.confidence === 'number'
    ) {
      const restoredDensity = {
        score: latestAssistantWithDensity.causal_density.score,
        label: latestAssistantWithDensity.causal_density.label || 'Unknown',
        confidence: latestAssistantWithDensity.causal_density.confidence,
      };
      setLastDensity(restoredDensity);
      lastDensityRef.current = restoredDensity;
    } else {
      setLastDensity(null);
      lastDensityRef.current = null;
    }

    const latestAssistantText = [...loadedMessages].reverse().find((m) => m.role === 'assistant')?.content || '';
    const latestAssistantAnalysis = [...loadedMessages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.scientificAnalysis)?.scientificAnalysis;
    assistantContentRef.current = latestAssistantText;
    scientificAnalysisRef.current = latestAssistantAnalysis;
    const restoredSources = extractSourcesFromText(latestAssistantText);
    const citedRanks = extractCitedRanksFromText(latestAssistantText);
    const citedOnly = citedRanks.size > 0 ? restoredSources.filter((source) => citedRanks.has(source.rank)) : restoredSources;
    const finalRestoredSources = citedOnly.length > 0 ? citedOnly : restoredSources;
    setGroundingSources(finalRestoredSources);
    setGroundingStatus(finalRestoredSources.length > 0 ? 'ready' : 'idle');
    setGroundingError(null);
    setUsedGroundingFallback(restoredSources.length > 0);
    setFactualConfidence(null);
    setAlignmentPosture('No unaudited intervention claims without identifiability gates.');
    setLatestClaimId(null);
    setClaimCopied(false);
    setDbSessionId(sessionId);
  }, []);

  const loadSession = useCallback(
    async (sessionId: string) => {
      console.log('[DEBUG loadSession] ENTER', sessionId);
      const requestId = ++loadRequestIdRef.current;
      console.log('[DEBUG loadSession] requestId=', requestId);
      loadAbortControllerRef.current?.abort();
      const controller = new AbortController();
      loadAbortControllerRef.current = controller;
      setError(null);
      setModelFallbackNotice(null);

      const cached = sessionCacheRef.current.get(sessionId);
      console.log('[DEBUG loadSession] cached?', !!cached, 'for', sessionId);
      if (cached) {
        applySessionHistory(sessionId, cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/causal-chat/history?id=${sessionId}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to load session.');
        }

        const payload = (await response.json()) as { messages?: SessionHistoryMessage[] };
        console.log('[DEBUG loadSession] fetch done. requestId=', requestId, 'current=', loadRequestIdRef.current);
        if (requestId !== loadRequestIdRef.current) {
          console.log('[DEBUG loadSession] STALE REQUEST — dropping results');
          return;
        }
        const historyMessages = payload.messages || [];
        console.log('[DEBUG loadSession] got', historyMessages.length, 'messages from API');
        sessionCacheRef.current.set(sessionId, historyMessages);
        applySessionHistory(sessionId, historyMessages);

        void (async () => {
          try {
            const claimResponse = await fetch(`/api/claims?sourceFeature=chat&sessionId=${sessionId}&limit=1`);
            if (claimResponse.ok) {
              const claimPayload = (await claimResponse.json()) as { claims?: Array<{ id?: string }> };
              const firstClaimId = claimPayload.claims?.[0]?.id;
              if (typeof firstClaimId === 'string' && firstClaimId.length > 0) {
                setLatestClaimId(firstClaimId);

                if (groundingSourcesLengthRef.current === 0) {
                  const reconstructionRes = await fetch(`/api/claims/${firstClaimId}`);
                  if (reconstructionRes.ok) {
                    const reconstructionPayload = (await reconstructionRes.json()) as {
                      reconstruction?: {
                        evidenceLinks?: Array<{
                          evidenceRef?: string;
                          snippet?: string | null;
                          metadata?: { title?: string; domain?: string; rank?: number };
                        }>;
                      };
                    };

                    const fromClaim = (reconstructionPayload.reconstruction?.evidenceLinks || [])
                      .map((evidence, index) => {
                        const link = evidence.evidenceRef || '';
                        if (!/^https?:\/\//.test(link)) return null;
                        return {
                          rank: evidence.metadata?.rank ?? index + 1,
                          title: evidence.metadata?.title || evidence.snippet || `Source ${index + 1}`,
                          link,
                          domain: evidence.metadata?.domain || (() => {
                            try {
                              return new URL(link).hostname.replace(/^www\./, '');
                            } catch {
                              return 'unknown';
                            }
                          })(),
                          snippet: evidence.snippet || evidence.metadata?.domain || '',
                        } as GroundingSource;
                      })
                      .filter((item): item is GroundingSource => item !== null)
                      .slice(0, 5);

                    if (fromClaim.length > 0) {
                      setGroundingSources((prev) => (prev.length > 0 ? prev : fromClaim));
                      setGroundingStatus((prev) => (prev === 'ready' ? prev : 'ready'));
                      setUsedGroundingFallback(true);
                    }
                  }
                }
              }
            }
          } catch {
            // non-fatal: claim lineage may not exist for historical session
          }
        })();
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
        const message = loadError instanceof Error ? loadError.message : 'Unable to load session';
        if (requestId === loadRequestIdRef.current) {
          setError(message);
        }
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [applySessionHistory]
  );

  const syncThreadFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('sessionId');
    const isNew = params.get('new') === '1';

    if (isNew) {
      resetThread();
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    console.log('[DEBUG URL effect] urlSessionId=', urlSessionId, 'dbSessionId=', dbSessionId);
    if (urlSessionId && urlSessionId !== dbSessionId) {
      console.log('[DEBUG URL effect] TRIGGERING loadSession');
      void loadSession(urlSessionId);
    } else {
      console.log('[DEBUG URL effect] SKIPPED — same session or no sessionId');
    }
  }, [dbSessionId, loadSession, resetThread]);

  useEffect(() => {
    syncThreadFromUrl();
    window.addEventListener('popstate', syncThreadFromUrl);
    return () => {
      window.removeEventListener('popstate', syncThreadFromUrl);
    };
  }, [syncThreadFromUrl]);

  useEffect(() => {
    const onLoadSessionEvent = (event: Event) => {
      const custom = event as CustomEvent<{ sessionId?: string }>;
      const sessionId = custom.detail?.sessionId;
      if (typeof sessionId === 'string' && sessionId.length > 0) {
        void loadSession(sessionId);
      }
    };

    const onNewChatEvent = () => resetThread();

    window.addEventListener('loadSession', onLoadSessionEvent as EventListener);
    window.addEventListener('newChat', onNewChatEvent);
    return () => {
      window.removeEventListener('loadSession', onLoadSessionEvent as EventListener);
      window.removeEventListener('newChat', onNewChatEvent);
    };
  }, [loadSession, resetThread]);

  const handleStreamEvent = useCallback(
    (eventName: string, data: unknown, assistantMessageId: string) => {
      const payload = (data || {}) as AssistantEventPayload;

      if (eventName === 'domain_classified' && isRealDomain(payload.primary)) {
        setCurrentDomain(payload.primary);
        currentDomainRef.current = payload.primary;
        return;
      }

      if (eventName === 'provenance' && isRealModelKey(payload.model_key)) {
        setCurrentModelKey(payload.model_key);
        currentModelKeyRef.current = payload.model_key;
        return;
      }

      if (eventName === 'model_fallback') {
        const requested = payload.requested_model || 'requested model';
        const used = payload.used_model || 'fallback model';
        const provider = payload.provider ? `${payload.provider}: ` : '';
        setModelFallbackNotice(`${provider}${requested} unavailable → routed to ${used}`);
        return;
      }

      if (eventName === 'web_grounding_started') {
        setGroundingStatus('searching');
        setGroundingError(null);
        setUsedGroundingFallback(false);
        return;
      }

      if (eventName === 'web_grounding_completed') {
        setGroundingStatus('ready');
        setGroundingSources(Array.isArray(payload.sources) ? payload.sources : []);
        setGroundingError(null);
        setUsedGroundingFallback(false);
        return;
      }

      if (eventName === 'web_grounding_failed') {
        setGroundingStatus('failed');
        setGroundingSources([]);
        setGroundingError(payload.message || 'Grounding failed.');
        setUsedGroundingFallback(false);
        return;
      }

      if (eventName === 'factual_confidence_assessed') {
        if (typeof payload.level === 'string' && typeof payload.score === 'number') {
          setFactualConfidence({
            level: payload.level,
            score: payload.score,
            rationale: payload.rationale || 'No rationale provided.',
          });
        }
        return;
      }

      if (eventName === 'intervention_gate') {
        if (payload.allowed === false) {
          setAlignmentPosture(`Gate blocked: ${payload.rationale || 'missing confounder controls or identifiability requirements.'}`);
        } else {
          setAlignmentPosture(`Gate cleared: ${payload.rationale || 'intervention allowed under declared identifiability assumptions.'}`);
        }
        return;
      }

      if (eventName === 'intervention_blocked') {
        setAlignmentPosture('Intervention downgraded to association-level output pending identifiability gates.');
        return;
      }

      if (eventName === 'alignment_audit_report') {
        setAlignmentPosture('Alignment audit report loaded: using latest global governance check.');
        return;
      }

      if (eventName === 'causal_density_update' && typeof payload.score === 'number') {
        const streamingDensity = {
          score: payload.score,
          label: payload.label || 'Unknown',
          confidence: quantizeConfidence(typeof payload.confidence === 'number' ? payload.confidence : 0),
        };
        lastDensityRef.current = streamingDensity;
        return;
      }

      if (eventName === 'scientific_extraction_complete') {
        if (payload.analysis) {
          scientificAnalysisRef.current = payload.analysis;
          setMessages((previous) =>
            previous.map((message) =>
              message.id === assistantMessageId ? { ...message, scientificAnalysis: payload.analysis } : message
            )
          );
        }
        return;
      }

      if (eventName === 'causal_density_final' && typeof payload.score === 'number') {
        const nextDensity = {
          score: payload.score,
          label: payload.label || 'Unknown',
          confidence: quantizeConfidence(typeof payload.confidence === 'number' ? payload.confidence : 0),
        };
        setLastDensity(nextDensity);
        lastDensityRef.current = nextDensity;
      }

      if (eventName === 'answer_chunk') {
        const chunk = payload.text || payload.token || '';
        if (!chunk) return;
        assistantContentRef.current = `${assistantContentRef.current}${chunk}`;

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId ? { ...message, content: `${message.content}${chunk}` } : message
          )
        );
      }

      if (eventName === 'claim_recorded' && payload.claimId) {
        setLatestClaimId(payload.claimId);
        return;
      }

      if (eventName === 'error' && payload.message) {
        setError(payload.message);
      }

      if (eventName === 'complete' || payload.finished) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId ? { ...message, isStreaming: false } : message
          )
        );

        const citedRanks = extractCitedRanksFromText(assistantContentRef.current || '');

        setGroundingSources((previous) => {
          if (previous.length > 0) {
            if (citedRanks.size > 0) {
              const citedOnly = previous.filter((source) => citedRanks.has(source.rank));
              return citedOnly.length > 0 ? citedOnly : previous;
            }
            return previous;
          }

          const parsed = extractSourcesFromText(assistantContentRef.current || '');
          if (parsed.length > 0) {
            const citedOnly = citedRanks.size > 0 ? parsed.filter((source) => citedRanks.has(source.rank)) : parsed;
            const finalSources = citedOnly.length > 0 ? citedOnly : parsed;
            setGroundingStatus('ready');
            setGroundingError(null);
            setUsedGroundingFallback(true);
            return finalSources;
          }
          return previous;
        });
      }
    },
    []
  );

  const handleSend = useCallback(async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isLoading) return;

    const inferredMode = inferOperatorMode(cleanPrompt);
    if (inferredMode !== operatorMode) {
      setOperatorMode(inferredMode);
    }

    const interventionPayload = inferredMode === 'intervene'
      ? parseInterventionPayload(cleanPrompt)
      : null;

    if (inferredMode === 'intervene' && !interventionPayload) {
      setAlignmentPosture('Intervention gate not evaluated: missing structured do(X)=value payload.');
    }

    setError(null);
    setModelFallbackNotice(null);
    setIsLoading(true);
    setGroundingSources([]);
    setGroundingStatus('idle');
    setGroundingError(null);
    setUsedGroundingFallback(false);
    setFactualConfidence(null);
    setAlignmentPosture('No unaudited intervention claims without identifiability gates.');
    setClaimCopied(false);

    const userMessage: WorkbenchMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanPrompt,
      createdAt: new Date(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: WorkbenchMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      isStreaming: true,
    };
    assistantContentRef.current = '';

    const conversation = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setPrompt('');

    let sessionForSave = dbSessionId;

    try {
      if (!sessionForSave) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        sessionForSave = await chatPersistence.getOrCreateSession(user?.id, cleanPrompt);
        setDbSessionId(sessionForSave);
      }

      if (sessionForSave) {
        const params = new URLSearchParams(window.location.search);
        const currentUrlSessionId = params.get('sessionId');
        if (currentUrlSessionId !== sessionForSave) {
          const next = `${window.location.pathname}?sessionId=${encodeURIComponent(sessionForSave)}`;
          window.history.replaceState({}, '', next);
        }
      }

      const shouldPersistClientSide = !!sessionForSave && sessionForSave.startsWith('local-');

      if (shouldPersistClientSide && sessionForSave) {
        await chatPersistence.saveMessage(sessionForSave, {
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          timestamp: userMessage.createdAt,
        });
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const serializedAttachments = await Promise.all(
        attachments.map(async (item) => ({
          name: item.name,
          mimeType: item.mimeType,
          data: await fileToBase64(item.file),
        }))
      );

      // Resolve provider/model and BYOK from lab config for parity with legacy chat path
      let activeProvider: 'anthropic' | 'openai' | 'gemini' = 'anthropic';
      let activeModel: string | undefined;
      const byokHeaders: Record<string, string> = {};

      try {
        const savedConfig = window.localStorage.getItem('lab_llm_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          if (parsed) {
            const providerCandidate = parsed.provider;
            if (providerCandidate === 'anthropic' || providerCandidate === 'openai' || providerCandidate === 'gemini') {
              activeProvider = providerCandidate;
            }

            if (typeof parsed.model === 'string' && parsed.model.trim().length > 0) {
              activeModel = parsed.model.trim();
            }

            let selectedKey: string | undefined = typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined;
            if (activeProvider === 'anthropic' && typeof parsed.anthropicApiKey === 'string') selectedKey = parsed.anthropicApiKey;
            if (activeProvider === 'openai' && typeof parsed.openaiApiKey === 'string') selectedKey = parsed.openaiApiKey;
            if (activeProvider === 'gemini' && typeof parsed.geminiApiKey === 'string') selectedKey = parsed.geminiApiKey;

            if (selectedKey && selectedKey.trim().length > 0) {
              byokHeaders['X-BYOK-API-Key'] = selectedKey.trim();
            }
          }
        }
      } catch (configError) {
        console.warn('[ChatWorkbenchV2] Failed to read lab_llm_config for BYOK/provider selection', configError);
      }

      const response = await fetch('/api/causal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...byokHeaders },
        body: JSON.stringify({
          messages: conversation,
          sessionId: sessionForSave,
          operatorMode: inferredMode,
          intervention: interventionPayload || undefined,
          attachments: serializedAttachments.length > 0 ? serializedAttachments : undefined,
          providerId: activeProvider,
          model: activeModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        const raw = body.error || `Chat request failed (${response.status})`;
        const normalized = raw.toLowerCase();

        if (normalized.includes('credit balance is too low') || normalized.includes('plans & billing')) {
          throw new Error('Anthropic credits are insufficient. Open Model Settings and switch provider (OpenAI/Gemini) or top up Anthropic credits.');
        }

        if (normalized.includes('missing api key') || normalized.includes('configuration error')) {
          throw new Error('Provider API key is missing. Open Model Settings and add a BYOK key for the selected provider.');
        }

        throw new Error(raw);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming body unavailable');

      const decoder = new TextDecoder();
      let remainder = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parsed = parseSSEChunk(chunk, remainder);
        remainder = parsed.remainder;

        for (const event of parsed.events) {
          handleStreamEvent(event.event, event.data, assistantMessageId);
        }
      }

      if (shouldPersistClientSide && sessionForSave) {
        const finalText = assistantContentRef.current;
        const latestDensity = lastDensityRef.current;
        const normalizedScore = Math.max(1, Math.min(3, Math.round(latestDensity?.score ?? 1))) as 1 | 2 | 3;
        const normalizedLabel =
          normalizedScore === 3 ? 'Counterfactual' : normalizedScore === 2 ? 'Intervention' : 'Association';

        await chatPersistence.saveMessage(sessionForSave, {
          id: assistantMessageId,
          role: 'assistant',
          content: finalText,
          timestamp: new Date(),
          domain: currentDomainRef.current,
          modelKey: currentModelKeyRef.current,
          causalDensity: latestDensity
            ? {
                score: normalizedScore,
                label: normalizedLabel,
                confidence: latestDensity.confidence,
                detectedMechanisms: [],
              }
            : undefined,
          scientificAnalysis: scientificAnalysisRef.current,
        });
      }

      setAttachments([]);
      window.dispatchEvent(new Event('historyImported'));
    } catch (sendError) {
      if ((sendError as Error).name !== 'AbortError') {
        const message = sendError instanceof Error ? sendError.message : 'Failed to send prompt';
        setError(message);
      }

      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantMessageId
            ? { ...message, isStreaming: false, content: message.content || 'Response interrupted.' }
            : message
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [attachments, chatPersistence, dbSessionId, handleStreamEvent, isLoading, messages, operatorMode, prompt]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const handleCopyClaimId = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setClaimCopied(true);
      window.setTimeout(() => setClaimCopied(false), 1400);
    } catch {
      setClaimCopied(false);
    }
  }, []);

  const handleAddAttachments = useCallback((files: File[]) => {
    setAttachments((previous) => {
      const next = [...previous];
      for (const file of files) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) continue;
        if (!next.some((item) => item.name === file.name)) {
          next.push({
            file,
            name: file.name,
            mimeType: file.type || 'application/pdf',
            sizeBytes: file.size,
          });
        }
      }
      return next.slice(0, 3);
    });
  }, []);

  const handleRemoveAttachment = useCallback((name: string) => {
    setAttachments((previous) => previous.filter((item) => item.name !== name));
  }, []);

  const latestAssistantAnalysis = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === 'assistant' && message.scientificAnalysis)?.scientificAnalysis,
    [messages],
  );
  const derivedHistoricalConfidence = useMemo(
    () => buildHistoricalConfidence(latestAssistantAnalysis, lastDensity),
    [lastDensity, latestAssistantAnalysis],
  );
  const effectiveConfidence = factualConfidence || derivedHistoricalConfidence;
  const effectiveAlignmentText =
    factualConfidence?.rationale ||
    buildHistoricalAlignmentCopy(latestAssistantAnalysis, alignmentPosture);
  const domainDisplay = isRealDomain(currentDomain) ? currentDomain : 'unavailable';
  const inlineGroundingSources = groundingSources.slice(0, 3);
  const modelProvenanceState = buildModelProvenanceDisplayState({
    modelKey: currentModelKey,
    latestClaimId,
  });
  const historicalEvidenceItems = useMemo(
    () => buildHistoricalEvidenceItems(latestAssistantAnalysis),
    [latestAssistantAnalysis],
  );
  const railConfig = useMemo<WorkbenchEvidenceRailConfig>(() => ({
    subtitle: isHistoricalReview ? 'Restored session posture' : 'Live causal posture',
    live: groundingSources.length > 0 || latestClaimId !== null || messages.length > 0,
    causalDensity: {
      activeLevel:
        lastDensity?.score && lastDensity.score >= 0.8
          ? 'L3'
          : lastDensity?.score && lastDensity.score >= 0.6
            ? 'L2'
            : lastDensity
              ? 'L1'
              : null,
      status: lastDensity?.label
        ? `Active rung: ${lastDensity.label}`
        : 'Awaiting scored output',
    },
    alignmentPosture: {
      tone: effectiveConfidence?.level === 'high'
        ? 'green'
        : effectiveConfidence?.level === 'medium'
          ? 'amber'
          : effectiveConfidence?.level === 'low'
            ? 'red'
            : inferHistoricalTone(latestAssistantAnalysis),
      text: effectiveAlignmentText,
    },
    modelProvenance: {
      title:
        modelProvenanceState.title !== 'unavailable'
          ? modelProvenanceState.title
          : latestAssistantAnalysis?.provenance
            ? `method ${latestAssistantAnalysis.provenance.methodVersion}`
            : modelProvenanceState.title,
      text:
        latestAssistantAnalysis?.provenance && modelProvenanceState.title === 'unavailable'
          ? `Scientific lineage restored for ingestion ${latestAssistantAnalysis.provenance.ingestionId.slice(0, 8)} with ${latestAssistantAnalysis.provenance.sourceTableIds.length} source tables and ${latestAssistantAnalysis.provenance.dataPointIds.length} data points.`
          : modelProvenanceState.text,
      actions: latestClaimId ? [
        { label: 'Pretty view', href: `/claims/${latestClaimId}` },
        { label: 'JSON', href: `/api/claims/${latestClaimId}` },
        { label: claimCopied ? 'Copied' : 'Copy ID', onClick: () => void handleCopyClaimId(latestClaimId) },
      ] : undefined,
    },
    activeDomain: {
      label: domainDisplay,
    },
    scientificEvidence:
      groundingSources.length > 0
        ? groundingSources.slice(0, 6).map((source) => ({
            id: `${source.rank}-${source.link}`,
            title: `[${source.rank}] ${source.title}`,
            meta: source.snippet || source.domain,
            href: source.link,
            badge: source.domain,
          }))
        : historicalEvidenceItems,
  }), [
    claimCopied,
    domainDisplay,
    effectiveAlignmentText,
    effectiveConfidence?.level,
    groundingSources,
    handleCopyClaimId,
    historicalEvidenceItems,
    isHistoricalReview,
    lastDensity,
    latestClaimId,
    latestAssistantAnalysis,
    messages.length,
    modelProvenanceState,
  ]);
  const hasAssistantOutput = messages.some(
    (message) =>
      message.role === 'assistant' &&
      (message.content.trim().length > 0 || Boolean(message.scientificAnalysis))
  );
  const composerBlock = (
    <div className={cn('chat-composer-panel', isHistoricalReview && 'is-history-review')}>
      <ChatComposerV2
        value={prompt}
        onChange={setPrompt}
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        operatorMode={operatorMode}
        onOperatorModeChange={setOperatorMode}
        attachments={attachments.map(({ name, mimeType, sizeBytes }) => ({ name, mimeType, sizeBytes }))}
        onAddAttachments={handleAddAttachments}
        onRemoveAttachment={handleRemoveAttachment}
        placeholder={
          operatorMode === 'intervene'
            ? 'Describe the action you want to take, expected impact, and guardrails...'
            : operatorMode === 'audit'
              ? 'Paste the claim to validate, evidence available, and what could disprove it...'
              : 'Describe the real-world situation, what changed, and what outcome you need...'
        }
      />
      {modelFallbackNotice ? <div className="mt-3 text-xs text-[var(--accent)]">Model fallback: {modelFallbackNotice}</div> : null}
      {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
    </div>
  );

  return (
    <WorkbenchShell
      feature="chat"
      evidenceRail={railConfig}
      mainMode="chat"
      focusModeReady={hasAssistantOutput}
      mainTopbar={
        <ChatWorkbenchTopbar
          operatorMode={operatorMode}
          sourceCount={groundingSources.length}
        />
      }
      mainContent={
        <div className={cn('chat-workbench', isHistoricalReview && 'is-history-review')}>
          <div className="chat-message-scroll">
            {messages.length === 0 ? (
              <div className="chat-empty-shell fade-in">
                <div className="chat-empty-console">
                  <div className="chat-empty-console-body">
                    {composerBlock}
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn('chat-review-stage', isHistoricalReview && 'is-history-review')}>
                <div className={cn('chat-message-list', isHistoricalReview && 'is-history-review')}>
                  {messages.map((message, index) => (
                    <article
                      key={message.id}
                      className={cn(
                        'chat-message',
                        message.role === 'user' ? 'user' : 'assistant',
                        isHistoricalReview && 'is-history-review-message',
                        message.role === 'assistant' && message.scientificAnalysis && 'has-artifact'
                      )}
                    >
                      <div className="chat-message-head">
                        <span className="chat-message-role">{message.role === 'user' ? 'Researcher' : 'Wu-Weism'}</span>
                        <span className="chat-message-time">{message.createdAt.toLocaleTimeString()}</span>
                      </div>
                      {message.role === 'assistant' && message.scientificAnalysis && (
                        <div className="chat-artifact-slot">
                          <ScientificTableCard analysis={message.scientificAnalysis} />
                        </div>
                      )}
                      <div className="chat-message-body">
                        {message.role === 'assistant' ? (
                          <div className="chat-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={CHAT_MARKDOWN_COMPONENTS}>
                              {message.content || ''}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content || '...'}</p>
                        )}
                      </div>
                      {message.role === 'assistant' && index === messages.length - 1 && inlineGroundingSources.length > 0 ? (
                        <div className="chat-citations">
                          {inlineGroundingSources.map((source) => (
                            <a key={`${source.rank}-${source.link}`} href={source.link} target="_blank" rel="noreferrer" className="chat-citation">
                              <span>[{source.rank}] {source.title}</span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {message.isStreaming ? (
                        <ThinkingAnimation
                          stageLabel={AUTOMATED_SCIENTIST_STAGES[loadingStageIndex]}
                          stageIndex={loadingStageIndex}
                        />
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
      inputArea={messages.length > 0 ? composerBlock : undefined}
    />
  );
}
