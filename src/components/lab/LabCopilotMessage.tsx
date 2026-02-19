"use client";

// =============================================================
// LabCopilotMessage — Renders a structured scientific answer
// Spec: Labs-CoPilot_specv2.md §2.3, §FR-2
// =============================================================

import React, { useState } from "react";
import {
  Eye,
  Lightbulb,
  FlaskConical,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopilotAnswer } from "@/lib/validations/lab-copilot";

interface LabCopilotMessageProps {
  role: "user" | "assistant" | "error";
  content?: string;
  answer?: CopilotAnswer;
  isLoading?: boolean;
  errorCode?: string;
  onOpenSettings?: () => void;
}

// ── Section Component ─────────────────────────────────────────

function Section({
  icon: Icon,
  label,
  children,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="space-y-1">
      <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest", accent)}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed pl-4">{children}</div>
    </div>
  );
}

// ── Confidence Bar ────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Confidence</span>
        <span className={cn("font-mono", pct >= 70 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500")}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Structured Answer ─────────────────────────────────────────

function StructuredAnswer({ answer }: { answer: CopilotAnswer }) {
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="space-y-4 text-sm">
      <Section icon={Eye} label="Observation" accent="text-blue-400">
        {answer.observation}
      </Section>

      <Section icon={Lightbulb} label="Hypothesis" accent="text-purple-400">
        {answer.hypothesis}
      </Section>

      <Section icon={FlaskConical} label="Mechanistic Rationale" accent="text-cyan-400">
        {answer.mechanisticRationale}
      </Section>

      <Section icon={ClipboardList} label="Test Plan" accent="text-emerald-400">
        <ol className="list-decimal list-inside space-y-1">
          {answer.testPlan.map((step, i) => (
            <li key={i} className="text-foreground/90">{step}</li>
          ))}
        </ol>
      </Section>

      <ConfidenceBar value={answer.confidence} />

      <Section icon={AlertTriangle} label="Limitations" accent="text-amber-400">
        <ul className="list-disc list-inside space-y-1">
          {answer.limitations.map((lim, i) => (
            <li key={i} className="text-foreground/80">{lim}</li>
          ))}
        </ul>
      </Section>

      {/* Next Step */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-start gap-2">
        <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">
            Suggested Next Step
          </div>
          <div className="text-sm text-foreground/90">{answer.nextStep.action}</div>
        </div>
      </div>

      {/* Citations */}
      {answer.citations.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCitations((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            {answer.citations.length} Citation{answer.citations.length !== 1 ? "s" : ""}
            {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showCitations && (
            <ul className="mt-2 space-y-1 pl-4">
              {answer.citations.map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground underline underline-offset-2"
                    >
                      {c.title}
                    </a>
                  ) : (
                    c.title
                  )}
                  <span className="ml-1 text-[10px] opacity-60">({c.sourceType})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {["w-3/4", "w-full", "w-5/6", "w-2/3"].map((w, i) => (
        <div key={i} className={cn("h-3 rounded bg-muted", w)} />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function LabCopilotMessage({
  role,
  content,
  answer,
  isLoading,
  errorCode,
  onOpenSettings,
}: LabCopilotMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-sm text-foreground">
          {content}
        </div>
      </div>
    );
  }

  if (role === "error") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-3">
        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {errorCode === 'PROVIDER_ERROR' ? 'Provider Error' : 'Error'}
        </div>
        <p className="text-sm text-foreground/80 mb-2">{content}</p>
        
        {errorCode === 'PROVIDER_ERROR' && onOpenSettings && (
          <button 
            onClick={onOpenSettings}
            className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
          >
            Check Settings
          </button>
        )}
      </div>
    );
  }

  // Assistant message
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm px-4 py-4">
      {isLoading ? (
        <LoadingSkeleton />
      ) : answer ? (
        <StructuredAnswer answer={answer} />
      ) : (
        <p className="text-sm text-muted-foreground">{content}</p>
      )}
    </div>
  );
}
