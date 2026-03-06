"use client";

// =============================================================
// LabNotebook — Provenance log for lab experiments
// C2: adds copilot_insight entry type rendering
// =============================================================

import React, { useEffect, useState } from "react";
import { useLab } from "@/lib/contexts/LabContext";
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronUp,
  ChevronDown,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NOTEBOOK_COLLAPSED_KEY = "lab-notebook-collapsed";

// ── Type guard for copilot insight entries ────────────────────

interface CopilotInsightInput {
  copilot_insight: true;
  observation: string;
  hypothesis: string;
  confidence: number;
  structure: string | null;
}

function isCopilotInsight(input: unknown): input is CopilotInsightInput {
  return (
    typeof input === "object" &&
    input !== null &&
    (input as Record<string, unknown>).copilot_insight === true
  );
}

// ── Component ─────────────────────────────────────────────────

export function LabNotebook() {
  const { state } = useLab();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NOTEBOOK_COLLAPSED_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(NOTEBOOK_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col border-t border-[var(--lab-border)] bg-[var(--lab-panel-soft)] transition-[height] duration-200",
        collapsed ? "h-12" : "h-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--lab-border)] bg-[var(--lab-panel)] p-2">
        <BookOpen className="h-4 w-4 text-[var(--lab-text-tertiary)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lab-text-tertiary)]">
          Lab Notebook (Provenance Log)
        </span>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--lab-border)] px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--lab-text-secondary)] hover:bg-[var(--lab-hover-bg)]"
          title={collapsed ? "Open notebook" : "Close notebook"}
          aria-label={collapsed ? "Open notebook" : "Close notebook"}
        >
          {collapsed ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {collapsed ? "Open" : "Close"}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {state.experimentHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--lab-text-tertiary)] opacity-60">
              No experiments recorded in this session.
            </div>
          ) : (
            <div className="space-y-3">
              {state.experimentHistory.map((log) => {
                const input = log.input_json as unknown;

                // ── Copilot Insight Entry ──────────────────────
                if (isCopilotInsight(input)) {
                  return (
                    <div key={log.id} className="flex gap-3 text-sm group">
                      <div className="mt-0.5">
                        <Bot className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[color-mix(in_srgb,var(--lab-accent-moss)_12%,transparent)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--lab-accent-moss)]">
                            copilot_insight
                          </span>
                          <span className="rounded border border-[color-mix(in_srgb,var(--lab-accent-slate)_30%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-slate)_8%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--lab-accent-slate)]">
                            OBS(Y)
                          </span>
                          {input.structure && (
                            <span className="text-[10px] font-mono text-[var(--lab-text-tertiary)]">
                              {input.structure}
                            </span>
                          )}
                          <span className="ml-auto font-mono text-xs text-[var(--lab-text-tertiary)]">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="space-y-1 rounded border border-[color-mix(in_srgb,var(--lab-accent-moss)_22%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-moss)_8%,var(--lab-panel))] p-2 text-xs text-[var(--lab-text-secondary)]">
                          <p>
                            <span className="font-semibold text-[var(--lab-accent-moss)]">Obs: </span>
                            {input.observation}
                          </p>
                          <p>
                            <span className="font-semibold text-[var(--lab-accent-moss)]">Hyp: </span>
                            {input.hypothesis}
                          </p>
                          <p className="text-[10px] text-[var(--lab-text-tertiary)]">
                            Confidence: {Math.round(input.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── Standard Experiment Entry ──────────────────
                return (
                    <div key={log.id} className="flex gap-3 text-sm group">
                      <div className="mt-0.5">
                        {log.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-[var(--lab-accent-moss)]" />
                      )}
                      {log.status === "failure" && (
                        <AlertTriangle className="h-4 w-4 text-[var(--lab-accent-rust)]" />
                      )}
                      {log.status === "pending" && (
                        <Clock className="h-4 w-4 animate-pulse text-[var(--lab-accent-rust)]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[color-mix(in_srgb,var(--lab-accent-rust)_10%,transparent)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--lab-accent-rust)]">
                          {log.tool_name}
                        </span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                            log.causal_role === "intervention"
                              ? "border-[color-mix(in_srgb,var(--lab-accent-rust)_26%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-rust)_8%,transparent)] text-[var(--lab-accent-rust)]"
                              : log.causal_role === "observation"
                              ? "border-[color-mix(in_srgb,var(--lab-accent-slate)_30%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-slate)_8%,transparent)] text-[var(--lab-accent-slate)]"
                              : "border-[var(--lab-border)] text-[var(--lab-text-tertiary)]"
                          )}
                        >
                          {log.causal_role === "intervention"
                            ? "DO(X)"
                            : log.causal_role === "observation"
                            ? "OBS(Y)"
                            : "CF"}
                        </span>
                        <span className="ml-auto font-mono text-xs text-[var(--lab-text-tertiary)]">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <pre className="custom-scrollbar overflow-x-auto rounded border border-[var(--lab-border)] bg-[color-mix(in_srgb,var(--lab-panel-soft)_84%,transparent)] p-2 font-mono text-xs text-[var(--lab-text-secondary)]">
                        {JSON.stringify(log.input_json, null, 2)}
                      </pre>

                      {log.status === "success" && log.result_json && (
                        <div className="mt-2 border-l-2 border-[color-mix(in_srgb,var(--lab-accent-moss)_34%,transparent)] pl-2 text-xs">
                          <span className="mb-1 block text-[10px] font-semibold uppercase text-[var(--lab-accent-moss)]">
                            Result
                          </span>
                          <pre className="custom-scrollbar overflow-x-auto font-mono text-[var(--lab-text-secondary)]">
                            {JSON.stringify(log.result_json, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.error_message && (
                        <div className="rounded border border-[color-mix(in_srgb,var(--lab-accent-rust)_24%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-rust)_10%,transparent)] p-2 text-xs text-[var(--lab-accent-rust)]">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
