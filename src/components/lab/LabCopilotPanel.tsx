"use client";

// =============================================================
// LabCopilotPanel — Right-rail scientific copilot chat UI
// Spec: Labs-CoPilot_specv2.md §2, §FR-1–FR-5
// =============================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLab } from "@/lib/contexts/LabContext";
import { buildLabContext } from "@/lib/services/lab-context-builder";
import { LabCopilotMessage } from "./LabCopilotMessage";
import { LabCopilotActions, QuickAction } from "./LabCopilotActions";
import type {
  CopilotMode,
  LearningLevel,
  CopilotAnswer,
} from "@/lib/validations/lab-copilot";

// ── Types ─────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content?: string;
  answer?: CopilotAnswer;
  isLoading?: boolean;
  errorCode?: string;
}

// ── Mode Selector ─────────────────────────────────────────────

const MODES: { id: CopilotMode; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "run", label: "Run" },
  { id: "learn", label: "Learn" },
];

const LEVELS: { id: LearningLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "research", label: "Research" },
];

// ── Panel ─────────────────────────────────────────────────────

interface LabCopilotPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function LabCopilotPanel({ isOpen, onToggle }: LabCopilotPanelProps) {
  const { state, createExperiment, updateExperimentResult } = useLab();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<CopilotMode>("ask");
  const [learningLevel, setLearningLevel] = useState<LearningLevel>("intermediate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<QuickAction | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Submit Chat ─────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const text = prompt.trim();
    if (!text || isSubmitting) return;

    setPrompt("");
    setIsSubmitting(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const labContext = buildLabContext(state);
      const response = await fetch("/api/lab-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, mode, learningLevel, labContext }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      const answer: CopilotAnswer = data.answer;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, isLoading: false, answer, content: answer.observation }
            : m
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorCode = errorMessage.toLowerCase().includes("credits") || errorMessage.toLowerCase().includes("billing")
        ? "BILLING_ERROR"
        : "FETCH_FAILED";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                role: "error" as const,
                isLoading: false,
                content: errorMessage,
                errorCode,
              }
            : m
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [prompt, isSubmitting, mode, learningLevel, state]);

  // ── Quick Action ────────────────────────────────────────────

  const handleAction = useCallback(
    async (action: QuickAction, answer: CopilotAnswer) => {
      setLoadingAction(action);
      try {
        if (action === "create_notebook_entry") {
          await createExperiment(
            "simulate_scientific_phenomenon",
            { thesis: answer.hypothesis, mechanism: answer.mechanisticRationale },
            "observation"
          );
        } else {
          const toolRes = await fetch("/api/lab-copilot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: `Run action: ${action}`,
              mode: "run",
              learningLevel,
              labContext: buildLabContext(state),
            }),
          });
          const data = await toolRes.json();
          if (data.answer) {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.answer.observation,
                answer: data.answer,
              },
            ]);
          }
        }
      } catch {
        // silently swallow
      } finally {
        setLoadingAction(null);
      }
    },
    [state, learningLevel, createExperiment]
  );

  // ── Keyboard ────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Collapsed Toggle ────────────────────────────────────────

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-full w-12 flex-col items-center justify-center gap-4",
          "border-l border-[var(--border)] bg-[var(--bg)] z-50 pointer-events-auto",
          "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-all"
        )}
        title="Open Lab Copilot"
      >
        <Bot className="w-5 h-5 text-[var(--accent)]" />
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--bg)] z-50 overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-2)] px-4 py-3">
        <Bot className="w-4 h-4 text-[var(--accent)]" />
        <span className="flex-1 text-[10px] font-mono font-medium uppercase tracking-widest text-[var(--accent)]">
          Lab Copilot
        </span>

        {/* Mode selector */}
        <div className="flex overflow-hidden rounded-md border border-[var(--border-2)] bg-[var(--bg-3)] text-[10px]">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "px-2 py-1 font-mono font-medium transition-colors",
                mode === m.id
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors ml-1"
          title="Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          title="Close copilot"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-3)] px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">
            Level:
          </span>
          <div className="flex overflow-hidden rounded-md border border-[var(--border)] text-[10px]">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLearningLevel(l.id)}
                className={cn(
                  "px-2 py-1 font-medium transition-colors",
                  learningLevel === l.id
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context indicator */}
      {state.currentStructure && (
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--accent-dim)] px-3 py-1.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          <span className="font-mono text-[10px] text-[var(--accent)]">
            {state.currentStructure.pdbId}
          </span>
          <span className="text-[10px] text-[var(--text-3)]">loaded</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-3">
            <Bot className="w-8 h-8 text-[var(--text-4)]" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--text-2)]">
                Lab Copilot
              </p>
              <p className="max-w-[220px] text-xs text-[var(--text-3)]">
                {state.currentStructure
                  ? `Ask about ${state.currentStructure.pdbId} — structure, mechanism, or function.`
                  : "Load a protein structure first, then ask questions about it."}
              </p>
            </div>
            {/* Starter prompts */}
            {state.currentStructure && (
              <div className="flex flex-col gap-1.5 w-full max-w-[260px]">
                {[
                  "What are the disordered regions?",
                  "Explain the binding mechanism",
                  "What mutations affect function?",
                ].map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => setPrompt(starter)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--text-2)] transition-all hover:border-[var(--border-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, idx) => {
          const isLastAssistant =
            msg.role === "assistant" &&
            !msg.isLoading &&
            msg.answer &&
            idx === messages.length - 1;

          return (
            <div key={msg.id} className="space-y-2">
              <LabCopilotMessage
                role={msg.role}
                content={msg.content}
                answer={msg.answer}
                isLoading={msg.isLoading}
                errorCode={msg.errorCode}
                onOpenSettings={() => setShowSettings(true)}
              />
              {isLastAssistant && msg.answer && (
                <LabCopilotActions
                  answer={msg.answer}
                  onAction={handleAction}
                  loadingAction={loadingAction}
                />
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Clear button */}
      {messages.length > 0 && (
        <div className="px-3 pb-1 flex justify-end">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-[10px] text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="relative flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 transition-colors focus-within:border-[var(--accent-border)] focus-within:ring-1 focus-within:ring-[var(--accent-dim)]">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "run"
                ? "Ask copilot to run a tool…"
                : mode === "learn"
                ? "Ask for an explanation…"
                : "Ask about the loaded structure…"
            }
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-[var(--text-1)] placeholder:text-[var(--text-4)] font-mono focus:outline-none custom-scrollbar"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isSubmitting}
            className={cn(
              "shrink-0 rounded-xl p-2 transition-all",
              prompt.trim() && !isSubmitting
                ? "bg-[var(--accent)] text-white hover:brightness-110"
                : "cursor-not-allowed text-[var(--text-4)] bg-[var(--bg-3)]"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-mono text-[var(--text-4)]">
          ↵ Send · Shift+↵ New line
        </p>
      </div>
    </div>
  );
}
