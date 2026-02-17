"use client";

/**
 * Causal Chat Interface - Integrated with Real API
 * 
 * Replaces mock responses with real SSE streaming from /api/causal-chat.
 * Displays real-time causal density analysis via TruthStream and CausalGauge.
 * 
 * Following Demis Workflow:
 * - L1 Impact: Replaces message list with TruthStream component
 * - L2 Risk: Maintains backward-compatible message shape
 * - L3 Calibration: Throttled density updates every 500ms
 * - L4 Critical Gap: Requires ANTHROPIC_API_KEY for LLM responses
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import { ChatInput } from './ChatInput';
import { TruthStream, MessageWithDensity } from "./visuals/TruthStream";
import { CausalFluxLogo } from "@/components/CausalFluxLogo";
import { v4 as uuidv4 } from "uuid";
import { ChatPersistence } from "@/lib/services/chat-persistence";
import { createClient } from "@/lib/supabase/client";
import { parseSSEChunk } from "@/lib/services/sse-event-parser";
import type { AlignmentAuditReport } from "@/types/alignment";
import { AlignmentInsightsPanel } from "./AlignmentInsightsPanel";
import { AlignmentDagView } from "./AlignmentDagView";
import { resolveOracleModeFromEvent } from "@/lib/services/oracle-event-state";


export function CausalChatInterface() {
  // Initialize empty to show Welcome Screen first
  const [messages, setMessages] = useState<MessageWithDensity[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [currentModelKey, setCurrentModelKey] = useState<string | null>(null);
  const [causalGraphPayload, setCausalGraphPayload] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [alignmentAuditReport, setAlignmentAuditReport] = useState<AlignmentAuditReport | null>(null);
  const [biasSensitivePaths, setBiasSensitivePaths] = useState<string[][]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatPersistence = useRef(new ChatPersistence()).current;

  /**
   * Load a previous chat session from history
   * @param sessionId - The database session ID to load
   */
  const handleLoadSession = useCallback(async (loadSessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch messages from database
      const loadedMessages = await chatPersistence.loadSession(loadSessionId);
      
      // Transform to MessageWithDensity format, filtering out 'system' messages
      const formattedMessages: MessageWithDensity[] = loadedMessages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => {
          const persistedDensity = msg.causalDensity || null;
          if (!persistedDensity && msg.confidenceScore !== undefined) {
            console.warn(
              `[Session Load] Missing causal_density for message ${msg.id}. confidence_score exists but is domain confidence metadata.`
            );
          }

          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.timestamp,
            domain: msg.domain,
            tier1Used: msg.tier1Used,
            tier2Used: msg.tier2Used,
            metrics: persistedDensity ? {
              causalDensity: persistedDensity.score,
              coherenceScore: persistedDensity.confidence,
              latencyMs: 0,
            } : undefined,
            density: persistedDensity,
            oracleMode: false,
            isStreaming: false,
          };
        });
      
      // Update state
      setMessages(formattedMessages);
      setDbSessionId(loadSessionId);
      
      console.log('[Session Load] Loaded', formattedMessages.length, 'messages from session', loadSessionId);
    } catch (err) {
      console.error('[Session Load] Failed to load session:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  }, [chatPersistence]);

  /**
   * Start a new chat session
   * Clears current messages and generates a new session ID
   */
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(uuidv4());
    setDbSessionId(null);
    setInput("");
    setError(null);
    setCurrentDomain(null);
    setCurrentModelKey(null);
    setCausalGraphPayload(null);
    setAlignmentAuditReport(null);
    setBiasSensitivePaths([]);
    console.log('[New Chat] Started new session');
  }, []);

  // Initialize Session ID on mount
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Listen for session load events from Sidebar (via ChatLayout -> page.tsx)
  useEffect(() => {
    const handleLoadSessionEvent = (event: Event) => {
      console.log('[Event Listener] loadSession event received');
      const customEvent = event as CustomEvent<{ sessionId: string }>;
      console.log('[Event Listener] Session ID:', customEvent.detail?.sessionId);
      if (customEvent.detail?.sessionId) {
        console.log('[Event Listener] Calling handleLoadSession...');
        handleLoadSession(customEvent.detail.sessionId);
      } else {
        console.warn('[Event Listener] No sessionId in event detail!');
      }
    };

    const handleNewChatEvent = () => {
      handleNewChat();
    };

    const handleSessionDeletedEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ sessionId: string }>;
      const deletedSessionId = customEvent.detail?.sessionId;
      
      // If the deleted session is the current one, start a new chat
      if (deletedSessionId && deletedSessionId === dbSessionId) {
        console.log('[Session Deleted] Active session deleted, starting new chat');
        handleNewChat();
      }
    };

    window.addEventListener('loadSession', handleLoadSessionEvent);
    window.addEventListener('newChat', handleNewChatEvent);
    window.addEventListener('sessionDeleted', handleSessionDeletedEvent);
    return () => {
      window.removeEventListener('loadSession', handleLoadSessionEvent);
      window.removeEventListener('newChat', handleNewChatEvent);
      window.removeEventListener('sessionDeleted', handleSessionDeletedEvent);
    };
  }, [handleLoadSession, handleNewChat, dbSessionId]);


  const handleStreamEvent = useCallback(async (eventType: string, data: any, messageId: string, sessionIdForSave: string | null) => {
    if (eventType === "domain_classified" && data?.primary) {
      setCurrentDomain(String(data.primary));
      return;
    }

    if (eventType === "causal_graph" && data?.nodes && data?.edges) {
      setCausalGraphPayload(data);
      return;
    }

    if (eventType === "provenance") {
      if (data?.model_key) {
        setCurrentModelKey(String(data.model_key));
      }
      return;
    }

    if (eventType === "alignment_audit_report") {
      const payload = (data?.report || data?.payload || null) as AlignmentAuditReport | null;
      setAlignmentAuditReport(payload);
      return;
    }

    if (eventType === "bias_sensitive_paths") {
      if (Array.isArray(data?.paths)) {
        setBiasSensitivePaths(data.paths as string[][]);
      } else if (Array.isArray(data)) {
        setBiasSensitivePaths(data as string[][]);
      }
      return;
    }

    if (eventType === "error" && data?.message) {
      setError(String(data.message));
      return;
    }

    if (eventType === "oracle_mode_change" || eventType === "bayesian_oracle_update") {
      setMessages((prev) => prev.map((message) => {
        if (message.id !== messageId) return message;
        return {
          ...message,
          oracleMode: resolveOracleModeFromEvent({
            eventType,
            data,
            currentOracleMode: !!message.oracleMode,
          }),
        };
      }));
      return;
    }

    const shouldTouchMessage =
      eventType === "answer_chunk" ||
      eventType === "causal_density_update" ||
      eventType === "causal_density_final" ||
      eventType === "complete" ||
      !!data?.finished;

    if (!shouldTouchMessage) {
      return;
    }

    // Check if this is the finish event BEFORE setState
    const isFinishEvent = eventType === "complete" || !!data?.finished;
    
    // We'll capture the final message content during setState callback
    let capturedMessageForSave: any = null;
    
    if (isFinishEvent && sessionIdForSave) {
      console.log('[Frontend] 🏁 Received finish event, preparing to save assistant message');
    }

    // The state update callback - extracted so we can call it with or without flushSync
    const stateUpdater = (prev: MessageWithDensity[]): MessageWithDensity[] => {
      const newMessages = [...prev];
      const msgIndex = newMessages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) {
        console.warn('[Frontend] ⚠️ Assistant message not found in array:', messageId);
        console.warn('[Frontend] Current message IDs:', newMessages.map(m => m.id));
        return prev;
      }

      const msg = { ...newMessages[msgIndex] };

      // Handle answer chunks (new streaming format uses 'text', old format uses 'token')
      if (eventType === "answer_chunk" && (data?.text || data?.token)) {
        const chunk = data.text || data.token;
        msg.content += chunk;
        console.log(`[Frontend] Received chunk: "${chunk.substring(0, 20)}..."`);
      }

      // Handle causal density updates
      // Backend (route.ts) sends this as: { score, label, confidence, ... }
      // Frontend expects it wrapped in 'density' or we need to detect it by shape
      const isDensityUpdate = data?.score !== undefined && data?.label !== undefined;
      
      if (eventType === "causal_density_update" || eventType === "causal_density_final" || data?.density || isDensityUpdate) {
        const densityData = data.density || data;
        
        msg.metrics = {
          causalDensity: densityData.density || densityData.score || 0,
          coherenceScore: 0.95,
          latencyMs: Date.now() - msg.timestamp.getTime(),
        };
        
        
        msg.oracleMode = resolveOracleModeFromEvent({
          eventType,
          data,
          currentOracleMode: !!msg.oracleMode,
        });

        // CRITICAL FIX: TruthStream checks msg.density directly, not just msg.metrics
        // We must populate this property for the badge to show
        msg.density = {
          score: densityData.score || 0,
          label: densityData.label || 'Unknown',
          confidence: densityData.confidence || 0,
          detectedMechanisms: densityData.detectedMechanisms || [],
          evidence: densityData.evidence || undefined,
        };
      }

      if (isFinishEvent) {
        msg.isStreaming = false;
        
        // Capture the message for saving
        if (sessionIdForSave && msg.content) {
          capturedMessageForSave = {
            id: msg.id,
            role: 'assistant' as const,
            content: msg.content,
            timestamp: msg.timestamp,
            domain: msg.domain,
            causalDensity: msg.density || undefined,
          };
          console.log('[Frontend] 📝 Captured message for save, content length:', msg.content.length);
        }
      }

      newMessages[msgIndex] = msg;
      return newMessages;
    };

    // Use flushSync for finish events to ensure synchronous callback execution
    // This is critical for capturing the message data before checking it below
    if (isFinishEvent) {
      flushSync(() => {
        setMessages(stateUpdater);
      });
    } else {
      setMessages(stateUpdater);
    }

    // Save AFTER setState - flushSync guarantees capturedMessageForSave is set
    if (isFinishEvent && capturedMessageForSave && sessionIdForSave) {
      try {
        console.log('[Persistence] 💾 Saving assistant message to session:', sessionIdForSave);
        await chatPersistence.saveMessage(sessionIdForSave, capturedMessageForSave);
        console.log('[Persistence] ✅ Assistant message saved successfully!');
      } catch (err) {
        console.error('[Persistence] ❌ Failed to save assistant message:', err);
      }
    }
  }, [chatPersistence]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Clear any previous errors
    setError(null);

    // Add user message
    const userMessage: MessageWithDensity = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    // Don't clear input immediately if we want to keep it for optimistic update or something, but usually we do.
    // Actually, handling this after setMessages is fine. 
    const currentInput = input; // capture for the body
    setInput("");
    setIsLoading(true);

      // Create DB session on first message
      let currentDbSessionId = dbSessionId;
      if (!currentDbSessionId && messages.length === 0) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          currentDbSessionId = await chatPersistence.getOrCreateSession(user?.id, currentInput);
          setDbSessionId(currentDbSessionId);
          console.log('[Persistence] Created session:', currentDbSessionId);
        } catch (err) {
          console.error('[Persistence] Failed to create session:', err);
        }
      }

      // Save user message to database
      if (currentDbSessionId) {
        try {
          await chatPersistence.saveMessage(currentDbSessionId, userMessage);
          console.log('[Persistence] Saved user message');
        } catch (err) {
          console.error('[Persistence] Failed to save user message:', err);
        }
      }

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: MessageWithDensity = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      oracleMode: false,
    };

    // Add assistant message placeholder to state SYNCHRONOUSLY
    // This prevents race condition where streaming chunks arrive before setState completes
    flushSync(() => {
      setMessages((prev) => [...prev, assistantMessage]);
    });

    try {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();



      // Extract BYOK Key based on active provider
      let byokHeaders: Record<string, string> = {};
      let activeProvider = 'anthropic';
      let activeModel: string | undefined = undefined;

      try {
        const savedConfig = localStorage.getItem('lab_llm_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          if (parsed) {
             activeProvider = parsed.provider || 'anthropic';
             activeModel = typeof parsed.model === 'string' && parsed.model.trim().length > 0
               ? parsed.model
               : undefined;
             let selectedKey = parsed.apiKey; // Fallback to compatible field

             // Prefer specific provider keys if available
             if (activeProvider === 'anthropic' && parsed.anthropicApiKey) selectedKey = parsed.anthropicApiKey;
             if (activeProvider === 'openai' && parsed.openaiApiKey) selectedKey = parsed.openaiApiKey;
             if (activeProvider === 'gemini' && parsed.geminiApiKey) selectedKey = parsed.geminiApiKey;

             if (selectedKey) {
               byokHeaders["X-BYOK-API-Key"] = selectedKey;
               console.log(`[CausalChat] 🔑 Injected BYOK API Key for ${activeProvider}`);
             }
          }
        }
      } catch (e) {
        console.warn("[CausalChat] Failed to read BYOK config", e);
      }

      // Start SSE connection
      const response = await fetch("/api/causal-chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...byokHeaders 
        },
        body: JSON.stringify({
          sessionId: sessionId,
          modelKey: undefined,
          providerId: activeProvider, // Explicitly pass provider
          model: activeModel,
          messages: messages
            .filter((m) => !m.isStreaming)
            .map((m) => ({ role: m.role, content: m.content }))
            .concat([{ role: "user", content: currentInput }]),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let remainder = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parsed = parseSSEChunk(chunk, remainder);
        remainder = parsed.remainder;

        for (const event of parsed.events) {
          await handleStreamEvent(event.event, event.data, assistantMessageId, currentDbSessionId);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Chat error:", err);
      setError(err.message || "Failed to connect to causal engine");
      
      // Update the placeholder to show error state
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, isStreaming: false, content: m.content + "\n\n*[Connection interrupted]*" }
          : m
      ));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, sessionId, chatPersistence, dbSessionId, handleStreamEvent]);

 
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const isWelcomeMode = messages.length === 0;

  return (
    <div className="flex flex-col min-h-full relative">


      {isWelcomeMode ? (
        // WELCOME MODE
        <div className="flex-1 flex flex-col items-center justify-center p-4">
           {/* Logo Animation */}
            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-wabi-clay/20 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
              <CausalFluxLogo className="w-24 h-24 text-[#8B5E3C] drop-shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-500" />
            </div>

           {/* Hero Text */}
           <h1 className="text-3xl md:text-4xl font-serif text-wabi-sumi mb-2 text-center">
             Resume Synthesis, Lesz
           </h1>
           <p className="text-wabi-stone mb-10 text-center max-w-md font-light">
             Explore causal relationships, analyze patterns, or draft your next breakthrough.
           </p>

           {/* Input Area - Centered */}
           <div className="w-full max-w-2xl mb-12">
              <ChatInput 
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                onSend={handleSend}
                onStop={handleStop}
                isExpanded={true}
              />
              {error && (
                <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
           </div>

           {/* Quick Actions (Wabi Stones) - Light Mode */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl px-4">
              {[
                { label: "Analyze PDF", icon: "📄", action: () => setInput("Analyze this document: ") },
                { label: "Causal Graph", icon: "🕸️", action: () => setInput("Generate a causal graph for...") },
                { label: "Draft Paper", icon: "✍️", action: () => setInput("Draft a research abstract about...") },
                { label: "Brainstorm", icon: "💡", action: () => setInput("Brainstorm ideas for...") },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-wabi-sumi/5 border border-wabi-sumi/5 hover:bg-wabi-sumi/10 hover:border-wabi-sumi/20 transition-all group shadow-sm"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300 grayscale opacity-80">{item.icon}</span>
                  <span className="text-xs font-medium text-wabi-charcoal group-hover:text-wabi-sumi">{item.label}</span>
                </button>
              ))}
           </div>
        </div>
      ) : (
        // CHAT MODE
        <>
          <div className="relative">
            <TruthStream messages={messages} />
          </div>

          {currentDomain === "alignment" && (
            <div className="mx-auto w-full max-w-5xl px-4 pb-8 space-y-4">
              <AlignmentInsightsPanel report={alignmentAuditReport} modelKey={currentModelKey} />
              <AlignmentDagView graph={causalGraphPayload} biasSensitivePaths={biasSensitivePaths} />
            </div>
          )}

          <div className="w-full sticky bottom-0 z-20 bg-wabi-washi/80 backdrop-blur-md border-t border-wabi-white/10">
            <div className="max-w-3xl mx-auto px-4 pb-6 pt-4">
               {/* Tutorial Section (dismissible/collapsible) */}


               <ChatInput 
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  onSend={handleSend}
                  onStop={handleStop}
                  isExpanded={false}
                />
                {error && (
                  <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <div className="text-center mt-2">
                   <span className="text-[10px] text-wabi-stone/30 font-serif">
                     AI can make mistakes. Please verify important information.
                   </span>
                </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default CausalChatInterface;
