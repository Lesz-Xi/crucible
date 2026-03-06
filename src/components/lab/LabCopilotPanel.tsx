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
    const trimmed = prompt.trim();
    if (!trimmed || isSubmitting) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed },
      { id: assistantMsgId, role: "assistant", isLoading: true },
    ]);
    setPrompt("");
    setIsSubmitting(true);

    try {
      const { labContext } = buildLabContext(state);

      const res = await fetch("/api/lab/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          mode,
          learningLevel,
          labContext,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg =
          data.error?.message ?? "An error occurred. Please try again.";
        const errCode = data.error?.code;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { id: assistantMsgId, role: "error", content: errMsg, errorCode: errCode }
              : m
          )
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { id: assistantMsgId, role: "assistant", answer: data.answer }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                id: assistantMsgId,
                role: "error",
                content:
                  "Network error. Please check your connection and try again.",
              }
            : m
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [prompt, isSubmitting, mode, learningLevel, state]);

  // ── Quick Actions ───────────────────────────────────────────

  const handleAction = useCallback(
    async (action: QuickAction, answer: CopilotAnswer) => {
      if (action === "ask_followup") {
        textareaRef.current?.focus();
        return;
      }

      if (action === "fetch_related_structure") {
        setPrompt(
          `Based on your analysis, what related protein structure should I fetch next? Please suggest a PDB ID or UniProt accession.`
        );
        textareaRef.current?.focus();
        return;
      }

      // ── create_notebook_entry: persist copilot insight to LabContext ──
      if (action === "create_notebook_entry") {
        const sourceId = crypto.randomUUID();
        const experiment = await createExperiment(
          "analyze_protein_sequence",
          {
            // Store insight summary in input_json for notebook display
            copilot_insight: true,
            source_message_id: sourceId,
            observation: answer.observation,
            hypothesis: answer.hypothesis,
            confidence: answer.confidence,
            structure: state.currentStructure?.pdbId ?? null,
          } as unknown as import("@/types/lab").LabToolInput,
          "observation"
        );
        if (experiment) {
          await updateExperimentResult(
            experiment.id,
            {
              copilot_insight: true,
              mechanisticRationale: answer.mechanisticRationale,
              testPlan: answer.testPlan,
              limitations: answer.limitations,
              citations: answer.citations,
            } as unknown as import("@/types/lab").LabToolResult,
            "success"
          );
          setMessages((prev) => [
            ...prev,
            {
              id: sourceId,
              role: "assistant" as const,
              content: "✓ Notebook entry created — insight logged to Lab Notebook.",
            },
          ]);
        }
        return;
      }

      // ── Tool-execution actions ────────────────────────────────
      setLoadingAction(action);
      const sourceMessageId = crypto.randomUUID();
      try {
        let tool: string;
        let params: Record<string, unknown>;

        if (action === "run_sequence_analysis") {
          tool = "analyze_protein_sequence";
          params = answer.nextStep.params ?? {};
          if (!params.sequence && state.currentStructure) {
            setPrompt("Please run sequence analysis. What is the protein sequence?");
            textareaRef.current?.focus();
            setLoadingAction(null);
            return;
          }
        } else if (action === "run_docking") {
          tool = "dock_ligand";
          params = answer.nextStep.params ?? {};
          if (!params.pdbId && state.currentStructure) {
            params = { ...params, pdbId: state.currentStructure.pdbId };
          }
        } else {
          setLoadingAction(null);
          return;
        }

        // Create pending experiment record in LabContext
        const toolName = tool as import("@/types/lab").LabToolName;
        const experiment = await createExperiment(
          toolName,
          { ...params, source_message_id: sourceMessageId } as unknown as import("@/types/lab").LabToolInput,
          "intervention"
        );

        const res = await fetch("/api/lab/copilot/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool, params }),
        });

        const data = await res.json();

        // Update experiment with result
        if (experiment) {
          await updateExperimentResult(
            experiment.id,
            data.result ?? { raw: data } as unknown as import("@/types/lab").LabToolResult,
            data.success ? "success" : "failure"
          );
        }

        const statusMsg = data.success
          ? `✓ \`${tool}\` completed — result logged to Lab Notebook.`
          : `✗ \`${tool}\` failed: ${data.error?.message ?? "Unknown error"}`;

        setMessages((prev) => [
          ...prev,
          {
            id: sourceMessageId,
            role: data.success ? "assistant" as const : "error" as const,
            content: statusMsg,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: sourceMessageId,
            role: "error" as const,
            content: "Tool execution failed. Please try again.",
          },
        ]);
      } finally {
        setLoadingAction(null);
      }
    },
    [state, createExperiment, updateExperimentResult]
  );

  // ── Keyboard Submit ─────────────────────────────────────────

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
          "flex flex-col items-center justify-center gap-2 w-10 h-full",
          "border-l border-border/60 bg-card/20 backdrop-blur-sm",
          "text-muted-foreground hover:text-foreground hover:bg-card/40 transition-colors"
        )}
        title="Open Lab Copilot"
      >
        <Bot className="w-4 h-4" />
        <ChevronLeft className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full border-l border-border/60 bg-card/20 backdrop-blur-sm w-[380px] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-card/40">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex-1">
          Lab Copilot
        </span>

        {/* Mode selector */}
        <div className="flex rounded-md overflow-hidden border border-border/60 text-[10px]">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "px-2 py-1 font-medium transition-colors",
                mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Close copilot"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-3 py-2 border-b border-border/60 bg-card/30 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Level:
          </span>
          <div className="flex rounded-md overflow-hidden border border-border/60 text-[10px]">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLearningLevel(l.id)}
                className={cn(
                  "px-2 py-1 font-medium transition-colors",
                  learningLevel === l.id
                    ? "bg-primary/80 text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
        <div className="px-3 py-1.5 border-b border-border/40 bg-primary/5 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary font-mono">
            {state.currentStructure.pdbId}
          </span>
          <span className="text-[10px] text-muted-foreground">loaded</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-3">
            <Bot className="w-8 h-8 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Lab Copilot
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-[220px]">
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
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
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
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 focus-within:border-primary/50 transition-colors">
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
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isSubmitting}
            className={cn(
              "shrink-0 rounded-lg p-1.5 transition-all",
              prompt.trim() && !isSubmitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1 text-center">
          ↵ Send · Shift+↵ New line
        </p>
      </div>
    </div>
  );
}
