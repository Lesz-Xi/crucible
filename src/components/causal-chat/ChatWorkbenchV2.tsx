'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlaskConical,
  Microscope,
  Network,
  PanelRightClose,
  PanelRightOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { parseSSEChunk } from '@/lib/services/sse-event-parser';
import { ChatPersistence } from '@/lib/services/chat-persistence';
import { ChatComposerV2 } from '@/components/causal-chat/ChatComposerV2';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';
import { StatusStrip } from '@/components/workbench/StatusStrip';
import type { FactualConfidenceResult, GroundingSource } from '@/types/chat-grounding';

interface ChatWorkbenchV2Props {
  onLoadSession?: (sessionId: string) => void;
  onNewChat?: () => void;
}

interface WorkbenchMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

interface AssistantEventPayload {
  text?: string;
  token?: string;
  score?: number;
  label?: string;
  confidence?: number;
  model_key?: string;
  model_version?: string;
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
}

type OperatorMode = 'explore' | 'intervene' | 'audit';

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
}

const isRealDomain = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value !== 'unclassified';

const isRealModelKey = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value !== 'default';

export function ChatWorkbenchV2({ onLoadSession, onNewChat }: ChatWorkbenchV2Props) {
  const chatPersistence = useMemo(() => new ChatPersistence(), []);
  const [messages, setMessages] = useState<WorkbenchMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>('unclassified');
  const [currentModelKey, setCurrentModelKey] = useState<string>('default');
  const [lastDensity, setLastDensity] = useState<{ score: number; label: string; confidence: number } | null>(null);
  const currentDomainRef = useRef<string>('unclassified');
  const currentModelKeyRef = useRef<string>('default');
  const lastDensityRef = useRef<{ score: number; label: string; confidence: number } | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [groundingStatus, setGroundingStatus] = useState<'idle' | 'searching' | 'ready' | 'failed'>('idle');
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [factualConfidence, setFactualConfidence] = useState<FactualConfidenceResult | null>(null);
  const [alignmentPosture, setAlignmentPosture] = useState<string>('No unaudited intervention claims without identifiability gates.');
  const [latestClaimId, setLatestClaimId] = useState<string | null>(null);
  const [claimCopied, setClaimCopied] = useState(false);
  const [operatorMode, setOperatorMode] = useState<OperatorMode>('explore');
  const [evidenceRailOpen, setEvidenceRailOpen] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>('');

  const resetThread = useCallback(() => {
    setMessages([]);
    setPrompt('');
    setError(null);
    setDbSessionId(null);
    setCurrentDomain('unclassified');
    currentDomainRef.current = 'unclassified';
    setCurrentModelKey('default');
    currentModelKeyRef.current = 'default';
    setLastDensity(null);
    lastDensityRef.current = null;
    setGroundingSources([]);
    setGroundingStatus('idle');
    setGroundingError(null);
    setFactualConfidence(null);
    setAlignmentPosture('No unaudited intervention claims without identifiability gates.');
    setLatestClaimId(null);
    setClaimCopied(false);
    onNewChat?.();
  }, [onNewChat]);


  useEffect(() => {
    const savedEvidenceRail = window.localStorage.getItem('chat-v3-evidence-rail');
    if (savedEvidenceRail === 'closed') setEvidenceRailOpen(false);

    const onKeyDown = (event: KeyboardEvent) => {
      const isMetaToggle = (event.metaKey || event.ctrlKey) && !event.altKey;
      if (!isMetaToggle) return;

      if (event.key === ']') {
        event.preventDefault();
        setEvidenceRailOpen((current) => {
          const next = !current;
          window.localStorage.setItem('chat-v3-evidence-rail', next ? 'open' : 'closed');
          return next;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const loadSession = useCallback(
    async (sessionId: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/causal-chat/history?id=${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to load session.');
        }

        const payload = (await response.json()) as {
          messages?: SessionHistoryMessage[];
        };
        const historyMessages = payload.messages || [];
        const filteredMessages = historyMessages
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const loadedMessages: WorkbenchMessage[] = filteredMessages
          .map((message) => ({
            id: message.id,
            role: message.role as 'user' | 'assistant',
            content: message.content,
            createdAt: new Date(message.created_at),
          }));

        const latestAssistantWithDensity = [...filteredMessages]
          .reverse()
          .find((message) => {
            if (message.role !== 'assistant') return false;
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
            if (message.role !== 'assistant') return false;
            return isRealDomain(message.domain_classified) || isRealModelKey(message.model_key);
          });

        const restoredDomain = isRealDomain(latestAssistantWithEvidence?.domain_classified)
          ? latestAssistantWithEvidence.domain_classified
          : 'unclassified';
        const restoredModelKey = isRealModelKey(latestAssistantWithEvidence?.model_key)
          ? latestAssistantWithEvidence.model_key
          : 'default';

        setMessages(loadedMessages);
        setCurrentDomain(restoredDomain);
        currentDomainRef.current = restoredDomain;
        setCurrentModelKey(restoredModelKey);
        currentModelKeyRef.current = restoredModelKey;
        if (
          latestAssistantWithEvidence?.causal_density &&
          typeof latestAssistantWithEvidence.causal_density.score === 'number' &&
          typeof latestAssistantWithEvidence.causal_density.confidence === 'number'
        ) {
          const restoredDensity = {
            score: latestAssistantWithEvidence.causal_density.score,
            label: latestAssistantWithEvidence.causal_density.label || 'Unknown',
            confidence: latestAssistantWithEvidence.causal_density.confidence,
          };
          setLastDensity(restoredDensity);
          lastDensityRef.current = restoredDensity;
        } else {
          setLastDensity(null);
          lastDensityRef.current = null;
        }
        setGroundingSources([]);
        setGroundingStatus('idle');
        setGroundingError(null);
        setFactualConfidence(null);
        setAlignmentPosture('No unaudited intervention claims without identifiability gates.');
        setLatestClaimId(null);
        setClaimCopied(false);
        setDbSessionId(sessionId);

        try {
          const claimResponse = await fetch(`/api/claims?sourceFeature=chat&sessionId=${sessionId}&limit=1`);
          if (claimResponse.ok) {
            const claimPayload = (await claimResponse.json()) as { claims?: Array<{ id?: string }> };
            const firstClaimId = claimPayload.claims?.[0]?.id;
            if (typeof firstClaimId === 'string' && firstClaimId.length > 0) {
              setLatestClaimId(firstClaimId);
            }
          }
        } catch {
          // non-fatal: claim lineage may not exist for historical session
        }

        onLoadSession?.(sessionId);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load session';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [onLoadSession]
  );

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlSessionId = params.get('sessionId');
      const isNew = params.get('new') === '1';

      if (isNew) {
        resetThread();
        return;
      }

      if (urlSessionId && urlSessionId !== dbSessionId) {
        void loadSession(urlSessionId);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [dbSessionId, loadSession, resetThread]);

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

      if (eventName === 'domain_classified' && payload.primary) {
        setCurrentDomain(payload.primary);
        currentDomainRef.current = payload.primary;
        return;
      }

      if (eventName === 'provenance' && payload.model_key) {
        setCurrentModelKey(payload.model_key);
        currentModelKeyRef.current = payload.model_key;
        return;
      }

      if (eventName === 'web_grounding_started') {
        setGroundingStatus('searching');
        setGroundingError(null);
        return;
      }

      if (eventName === 'web_grounding_completed') {
        setGroundingStatus('ready');
        setGroundingSources(Array.isArray(payload.sources) ? payload.sources : []);
        setGroundingError(null);
        return;
      }

      if (eventName === 'web_grounding_failed') {
        setGroundingStatus('failed');
        setGroundingSources([]);
        setGroundingError(payload.message || 'Grounding failed.');
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

      const isDensityEvent = eventName === 'causal_density_update' || eventName === 'causal_density_final';
      if (isDensityEvent && typeof payload.score === 'number') {
        const nextDensity = {
          score: payload.score,
          label: payload.label || 'Unknown',
          confidence: typeof payload.confidence === 'number' ? payload.confidence : 0,
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
      }
    },
    []
  );

  const handleSend = useCallback(async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isLoading) return;

    setError(null);
    setIsLoading(true);
    setGroundingSources([]);
    setGroundingStatus('idle');
    setGroundingError(null);
    setFactualConfidence(null);
    setAlignmentPosture('No unaudited intervention claims without identifiability gates.');
    setLatestClaimId(null);
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

      const response = await fetch('/api/causal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation,
          sessionId: sessionForSave,
          operatorMode,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Chat request failed (${response.status})`);
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
        });
      }

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
  }, [chatPersistence, dbSessionId, handleStreamEvent, isLoading, messages, operatorMode, prompt]);

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

  const handleQuickPrompt = useCallback((snippet: string) => {
    setPrompt((current) => {
      if (!current.trim()) return snippet;
      return `${current.trim()}\n\n${snippet}`;
    });
  }, []);

  const toggleEvidenceRail = useCallback(() => {
    setEvidenceRailOpen((current) => {
      const next = !current;
      window.localStorage.setItem('chat-v3-evidence-rail', next ? 'open' : 'closed');
      return next;
    });
  }, []);

  return (
    <WorkbenchShell
      contextRailOpen={false}
      evidenceRailOpen={evidenceRailOpen}
      statusStrip={
        <StatusStrip
          left={<div />}
          right={
            <div className="flex items-center gap-2">
              <button type="button" className="lab-button-secondary !py-1.5" onClick={toggleEvidenceRail} title="Toggle evidence rail">
                {evidenceRailOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
            </div>
          }
        />
      }
      contextRail={<div />}
      primary={
        <PrimaryCanvas>
          <div className="flex h-full flex-col">
            <div className="lab-scroll-region flex-1 space-y-3 px-5 py-4">
              {messages.length === 0 ? (
                <div className="lab-empty-state">
                  <p className="font-serif text-xl text-[var(--lab-text-primary)]">Start a New Scientific Thread</p>
                  <p className="mt-2 text-sm">Ask for mechanism analysis, counterfactual reasoning, or intervention planning.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={message.role === 'user' ? 'lab-card-interactive ml-14' : 'lab-card mr-14'}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="lab-chip-mono">{message.role === 'user' ? 'Researcher' : 'Wu-Weism'}</span>
                      <span className="text-xs text-[var(--lab-text-tertiary)]">{message.createdAt.toLocaleTimeString()}</span>
                    </div>
                    {message.role === 'assistant' ? (
                      <div className="lab-chat-prose">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content || '...'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--lab-text-primary)]">{message.content || '...'}</p>
                    )}
                    {message.isStreaming ? (
                      <p className="mt-2 text-xs text-[var(--lab-text-secondary)]">Streaming response...</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <div className="border-t border-[var(--lab-border)] px-5 pt-3">
              <p className="mb-2 text-[11px] font-mono uppercase tracking-wide text-[var(--lab-text-tertiary)]">Scientific shortcuts</p>
              <div className="mb-3 flex flex-wrap gap-2">
                <button type="button" className="lab-button-secondary !py-1.5 text-xs" onClick={() => handleQuickPrompt('Define the causal claim, mechanism, confounders, and one falsifier.')}>Claim template</button>
                <button type="button" className="lab-button-secondary !py-1.5 text-xs" onClick={() => handleQuickPrompt('Run intervention framing: do(X)=..., expected delta on Y, and identifiability assumptions.')}>Add intervention</button>
                <button type="button" className="lab-button-secondary !py-1.5 text-xs" onClick={() => handleQuickPrompt('Generate one counterfactual test and explain necessity vs sufficiency.')}>Ask counterfactual</button>
              </div>
            </div>

            <ChatComposerV2
              value={prompt}
              onChange={setPrompt}
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
              operatorMode={operatorMode}
              onOperatorModeChange={setOperatorMode}
              placeholder={
                operatorMode === 'intervene'
                  ? 'Specify do(X)=..., expected Y delta, and required controls...'
                  : operatorMode === 'audit'
                    ? 'Request citation-grounded claim audit with uncertainty and falsifier...'
                    : 'State your hypothesis, mechanism, and desired intervention...'
              }
            />
            {error ? <div className="px-5 pb-4 text-sm text-red-700">{error}</div> : null}
          </div>
        </PrimaryCanvas>
      }
      evidenceRail={
        <EvidenceRail title="Evidence Rail" subtitle="Live causal posture and provenance">
          <div className="space-y-3">
            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--lab-accent-earth)]" />
                <p className="lab-section-title !mb-0">Causal Density</p>
              </div>
              <p className="text-2xl font-semibold text-[var(--lab-text-primary)]">{lastDensity ? `L${lastDensity.score}` : 'N/A'}</p>
              <p className="text-sm text-[var(--lab-text-secondary)]">{lastDensity ? `${lastDensity.label} (${Math.round(lastDensity.confidence * 100)}%)` : 'Awaiting scored output'}</p>
            </div>

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <Network className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                <p className="lab-section-title !mb-0">Domain</p>
              </div>
              <p className="text-sm font-medium text-[var(--lab-text-primary)]">{currentDomain}</p>
            </div>

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <Microscope className="h-4 w-4 text-[var(--lab-accent-earth)]" />
                <p className="lab-section-title !mb-0">Model Provenance</p>
              </div>
              <p className="text-sm font-medium text-[var(--lab-text-primary)]">{currentModelKey}</p>
            </div>

            <div className="lab-metric-tile">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                <p className="lab-section-title !mb-0">Alignment Posture</p>
              </div>
              <p className="text-sm text-[var(--lab-text-secondary)]">{alignmentPosture}</p>
            </div>

            {latestClaimId ? (
              <div className="lab-metric-tile">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                  <p className="lab-section-title !mb-0">Claim Lineage</p>
                </div>
                <p className="text-xs text-[var(--lab-text-secondary)]">Claim ID: <span className="font-mono text-[var(--lab-text-primary)]">{latestClaimId}</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    className="inline-block text-xs text-[var(--lab-accent-earth)] underline"
                    href={`/claims/${latestClaimId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open pretty view
                  </a>
                  <a
                    className="inline-block text-xs text-[var(--lab-accent-earth)] underline"
                    href={`/api/claims/${latestClaimId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
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

            {(groundingStatus !== 'idle' || groundingSources.length > 0 || factualConfidence) ? (
              <div className="lab-metric-tile">
                <div className="mb-2 flex items-center gap-2">
                  <Network className="h-4 w-4 text-[var(--lab-accent-earth)]" />
                  <p className="lab-section-title !mb-0">Grounding Sources</p>
                </div>
                <p className="text-xs text-[var(--lab-text-secondary)]">
                  {groundingStatus === 'searching' && 'Searching web sources...'}
                  {groundingStatus === 'ready' && `${groundingSources.length} sources linked.`}
                  {groundingStatus === 'failed' && (groundingError || 'Verification incomplete.')}
                  {groundingStatus === 'idle' && 'No factual web-grounding triggered.'}
                </p>
                {factualConfidence ? (
                  <p className="mt-2 text-xs text-[var(--lab-text-secondary)]">
                    Confidence: <span className="font-semibold text-[var(--lab-text-primary)]">{factualConfidence.level}</span>
                  </p>
                ) : null}
                {groundingSources.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {groundingSources.slice(0, 5).map((source) => (
                      <a
                        key={`${source.rank}-${source.link}`}
                        href={source.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md border border-[var(--lab-border)] p-2 transition hover:bg-[var(--lab-bg-elevated)]"
                      >
                        <p className="text-xs font-semibold text-[var(--lab-text-primary)]">[{source.rank}] {source.title}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] text-[var(--lab-text-secondary)]">{source.snippet || source.domain}</p>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <button type="button" className="lab-button-secondary w-full" onClick={resetThread}>
              <FlaskConical className="h-4 w-4" />
              Start controlled intervention
            </button>
          </div>
        </EvidenceRail>
      }
    />
  );
}
