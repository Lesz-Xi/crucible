'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { FlaskConical, Microscope, Network, ShieldCheck, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { parseSSEChunk } from '@/lib/services/sse-event-parser';
import { ChatPersistence } from '@/lib/services/chat-persistence';
import { ChatSidebarV2 } from '@/components/causal-chat/ChatSidebarV2';
import { ChatComposerV2 } from '@/components/causal-chat/ChatComposerV2';
import { ContextRail } from '@/components/workbench/ContextRail';
import { EvidenceRail } from '@/components/workbench/EvidenceRail';
import { PrimaryCanvas } from '@/components/workbench/PrimaryCanvas';
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell';

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
  primary?: string;
  message?: string;
  finished?: boolean;
}

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>('');

  const resetThread = useCallback(() => {
    setMessages([]);
    setPrompt('');
    setError(null);
    setDbSessionId(null);
    setCurrentDomain('unclassified');
    setCurrentModelKey('default');
    setLastDensity(null);
    onNewChat?.();
  }, [onNewChat]);

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

        const latestAssistantWithEvidence = [...filteredMessages]
          .reverse()
          .find((message) => {
            if (message.role !== 'assistant') return false;
            const hasDomain = typeof message.domain_classified === 'string' && message.domain_classified.length > 0;
            const hasModel = typeof message.model_key === 'string' && message.model_key.length > 0;
            const density = message.causal_density;
            const hasDensity =
              !!density &&
              typeof density.score === 'number' &&
              Number.isFinite(density.score) &&
              typeof density.confidence === 'number' &&
              Number.isFinite(density.confidence);
            return hasDomain || hasModel || hasDensity;
          });

        setMessages(loadedMessages);
        setCurrentDomain(latestAssistantWithEvidence?.domain_classified || 'unclassified');
        setCurrentModelKey(latestAssistantWithEvidence?.model_key || 'default');
        if (
          latestAssistantWithEvidence?.causal_density &&
          typeof latestAssistantWithEvidence.causal_density.score === 'number' &&
          typeof latestAssistantWithEvidence.causal_density.confidence === 'number'
        ) {
          setLastDensity({
            score: latestAssistantWithEvidence.causal_density.score,
            label: latestAssistantWithEvidence.causal_density.label || 'Unknown',
            confidence: latestAssistantWithEvidence.causal_density.confidence,
          });
        } else {
          setLastDensity(null);
        }
        setDbSessionId(sessionId);
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

  const handleStreamEvent = useCallback(
    (eventName: string, data: unknown, assistantMessageId: string) => {
      const payload = (data || {}) as AssistantEventPayload;

      if (eventName === 'domain_classified' && payload.primary) {
        setCurrentDomain(payload.primary);
        return;
      }

      if (eventName === 'provenance' && payload.model_key) {
        setCurrentModelKey(payload.model_key);
        return;
      }

      const isDensityEvent = eventName === 'causal_density_update' || eventName === 'causal_density_final';
      if (isDensityEvent && typeof payload.score === 'number') {
        setLastDensity({
          score: payload.score,
          label: payload.label || 'Unknown',
          confidence: typeof payload.confidence === 'number' ? payload.confidence : 0,
        });
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

      if (sessionForSave) {
        const finalText = assistantContentRef.current;
        const normalizedScore = Math.max(1, Math.min(3, Math.round(lastDensity?.score ?? 1))) as 1 | 2 | 3;
        const normalizedLabel =
          normalizedScore === 3 ? 'Counterfactual' : normalizedScore === 2 ? 'Intervention' : 'Association';

        await chatPersistence.saveMessage(sessionForSave, {
          id: assistantMessageId,
          role: 'assistant',
          content: finalText,
          timestamp: new Date(),
          domain: currentDomain,
          causalDensity: lastDensity
            ? {
                score: normalizedScore,
                label: normalizedLabel,
                confidence: lastDensity.confidence,
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
  }, [chatPersistence, currentDomain, dbSessionId, handleStreamEvent, isLoading, lastDensity, messages, prompt]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return (
    <WorkbenchShell
      contextRail={
        <ContextRail title="Command Rail" subtitle="Thread control and feature routing">
          <ChatSidebarV2 onLoadSession={loadSession} onNewThread={resetThread} />
        </ContextRail>
      }
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

            <ChatComposerV2 value={prompt} onChange={setPrompt} onSend={handleSend} onStop={handleStop} isLoading={isLoading} />
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
              <p className="text-sm text-[var(--lab-text-secondary)]">No unaudited intervention claims without identifiability gates.</p>
            </div>

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
