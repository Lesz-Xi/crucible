"use client";

/**
 * ReportCanvas — SCM-Grounded Report Analysis viewer
 *
 * Displays a full SCMGroundedReport with:
 * - TrustBadge (color-coded by causalDepth)
 * - "Why downgraded?" expandable drawer
 * - Executive summary, hypotheses, claims, SCM notes
 * - Falsifier checklist
 * - Export actions
 */

import React, { useState } from "react";
import type {
  SCMGroundedReport,
  HonestFramingState,
  ClaimClass,
  WarningCode,
} from "@/types/report-analysis";
import { humanizeWarningCode } from "@/lib/services/honest-framing-service";

// ---------------------------------------------------------------------------
// Trust Badge
// ---------------------------------------------------------------------------

const TRUST_COLORS: Record<HonestFramingState, { bg: string; text: string; border: string; label: string }> = {
  verified:  { bg: "bg-emerald-950/60", text: "text-emerald-300",  border: "border-emerald-600/50",  label: "Verified Causal" },
  heuristic: { bg: "bg-amber-950/60",   text: "text-amber-300",    border: "border-amber-600/50",    label: "Heuristic" },
  warning:   { bg: "bg-orange-950/60",  text: "text-orange-300",   border: "border-orange-500/50",   label: "Active Warning" },
  unknown:   { bg: "bg-zinc-900/60",    text: "text-zinc-400",     border: "border-zinc-600/50",     label: "Unknown" },
};

const CLAIM_CLASS_COLORS: Record<ClaimClass, string> = {
  "IDENTIFIED_CAUSAL":    "text-emerald-300 bg-emerald-950/40 border border-emerald-700/40",
  "INFERRED_CAUSAL":      "text-blue-300   bg-blue-950/40    border border-blue-700/40",
  "ASSOCIATIONAL_ONLY":   "text-amber-300  bg-amber-950/40   border border-amber-700/40",
  "INSUFFICIENT_EVIDENCE":"text-zinc-400   bg-zinc-900/40    border border-zinc-700/40",
};

interface TrustBadgeProps {
  state: HonestFramingState;
  verificationFailures: string[];
  warningCodes: WarningCode[];
}

function TrustBadge({ state, verificationFailures, warningCodes }: TrustBadgeProps) {
  const [open, setOpen] = useState(false);
  const colors = TRUST_COLORS[state];
  const hasIssues = verificationFailures.length > 0 || warningCodes.length > 0;

  return (
    <div className={`rounded-xl border px-4 py-3 ${colors.bg} ${colors.border} select-none`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${colors.text.replace("text", "bg")}`} />
        <span className={`text-sm font-semibold uppercase tracking-widest ${colors.text}`}>
          {colors.label}
        </span>
        {hasIssues && state !== "verified" && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
          >
            {open ? "Hide" : "Why downgraded?"}
          </button>
        )}
      </div>

      {open && hasIssues && (
        <div className="mt-3 pt-3 border-t border-zinc-700/40 space-y-2">
          {verificationFailures.slice(0, 5).map((f, i) => (
            <p key={i} className="text-xs text-zinc-400 leading-relaxed">
              • {f}
            </p>
          ))}
          {warningCodes.map((code) => (
            <p key={code} className="text-xs text-orange-400/80 leading-relaxed">
              ⚠ {humanizeWarningCode(code)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Claim pill
// ---------------------------------------------------------------------------

function ClaimPill({ claimClass }: { claimClass: ClaimClass }) {
  const className = CLAIM_CLASS_COLORS[claimClass];
  const labels: Record<ClaimClass, string> = {
    "IDENTIFIED_CAUSAL":    "Identified Causal",
    "INFERRED_CAUSAL":      "Inferred",
    "ASSOCIATIONAL_ONLY":   "Associational",
    "INSUFFICIENT_EVIDENCE":"Insufficient",
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${className}`}>
      {labels[claimClass]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">{title}</h3>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ReportCanvas
// ---------------------------------------------------------------------------

interface ReportCanvasProps {
  report: SCMGroundedReport;
  onExport?: (format: "json" | "markdown") => void;
}

export function ReportCanvas({ report, onExport }: ReportCanvasProps) {
  const { meta, claims, sources, executiveSummary, primaryHypotheses, counterHypotheses,
          scmNotes, falsifierChecklist, unknownsAndGaps, decisionGuidance } = report;

  // Collect unique warning codes from claims
  const allWarningCodes = [
    ...new Set(claims.flatMap((c) => c.warningCodes)),
  ] as WarningCode[];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
              SCM-Grounded Report · {meta.methodVersion}
            </p>
            <h2 className="text-lg font-semibold text-zinc-100 leading-snug line-clamp-2">
              {meta.query}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {new Date(meta.generatedAt).toLocaleString()} · Run ID:{" "}
              <span className="font-mono text-zinc-600">
                {meta.computeRunId.slice(0, 8)}…
              </span>
            </p>
          </div>

          {/* Export buttons */}
          {onExport && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => onExport("json")}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={() => onExport("markdown")}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Export MD
              </button>
            </div>
          )}
        </div>

        {/* Trust badge */}
        <TrustBadge
          state={meta.causalDepth}
          verificationFailures={meta.verificationFailures}
          warningCodes={allWarningCodes}
        />
      </div>

      {/* Executive Summary */}
      <Section title="Executive Summary">
        <ul className="space-y-2">
          {executiveSummary.map((bullet, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>
      </Section>

      {/* Primary Hypotheses */}
      {primaryHypotheses.length > 0 && (
        <Section title="Primary Hypotheses">
          <div className="space-y-3">
            {primaryHypotheses.map((h, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <p className="text-sm text-zinc-200 leading-relaxed">{h.text}</p>
                <div className="flex items-center gap-2">
                  <ClaimPill claimClass={h.claimClass} />
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {(h.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Counter Hypotheses */}
      {counterHypotheses.length > 0 && (
        <Section title="Counter Hypotheses">
          <div className="space-y-2">
            {counterHypotheses.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
                <p className="text-sm text-zinc-300">{c.text}</p>
                <p className="text-xs text-zinc-500 mt-1 italic">{c.rationale}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Decision Guidance */}
      <Section title="Decision Guidance">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 mb-2">Safe to Conclude</p>
            <ul className="space-y-1">
              {decisionGuidance.safeConclude.map((s, i) => (
                <li key={i} className="text-xs text-emerald-300/80">✓ {s}</li>
              ))}
              {decisionGuidance.safeConclude.length === 0 && (
                <li className="text-xs text-zinc-500 italic">None at current evidence level.</li>
              )}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30">
            <p className="text-[10px] uppercase tracking-widest text-red-600 mb-2">Not Safe to Conclude</p>
            <ul className="space-y-1">
              {decisionGuidance.notSafeConclude.map((s, i) => (
                <li key={i} className="text-xs text-red-400/70">✗ {s}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* SCM Notes */}
      {(scmNotes.identifiableLinks.length > 0 || scmNotes.inferredLinks.length > 0 || scmNotes.latentConfounders.length > 0) && (
        <Section title="SCM Notes">
          <div className="space-y-3 text-xs">
            {scmNotes.identifiableLinks.length > 0 && (
              <div>
                <p className="text-emerald-600 font-medium mb-1">Identifiable causal links</p>
                {scmNotes.identifiableLinks.map((l, i) => <p key={i} className="text-zinc-400">→ {l}</p>)}
              </div>
            )}
            {scmNotes.inferredLinks.length > 0 && (
              <div>
                <p className="text-blue-500 font-medium mb-1">Inferred links</p>
                {scmNotes.inferredLinks.map((l, i) => <p key={i} className="text-zinc-400">→ {l}</p>)}
              </div>
            )}
            {scmNotes.latentConfounders.length > 0 && (
              <div>
                <p className="text-orange-500 font-medium mb-1">Latent confounders</p>
                {scmNotes.latentConfounders.map((l, i) => <p key={i} className="text-zinc-400">? {l}</p>)}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Falsifier Checklist */}
      {falsifierChecklist.length > 0 && (
        <Section title="Falsifier Checklist">
          <div className="space-y-2">
            {falsifierChecklist.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="shrink-0 mt-0.5 font-mono text-zinc-600 border border-zinc-700/60 rounded px-1">
                  {f.window}
                </span>
                <span>{f.test}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Unknowns */}
      {unknownsAndGaps.length > 0 && (
        <Section title="Unknowns and Gaps">
          <ul className="space-y-1">
            {unknownsAndGaps.map((u, i) => (
              <li key={i} className="text-xs text-zinc-500">• {u}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Sources Footer */}
      <Section title={`Sources (${sources.length})`}>
        <div className="grid grid-cols-1 gap-1">
          {sources.slice(0, 8).map((s, i) => (
            <a
              key={s.sourceId}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-2 py-1 rounded hover:bg-zinc-800/40 transition-colors group"
            >
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 truncate">{s.url}</span>
              <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                {(s.credibilityScore * 100).toFixed(0)}%
              </span>
            </a>
          ))}
          {sources.length > 8 && (
            <p className="text-[10px] text-zinc-600 px-2 pt-1">+{sources.length - 8} more sources</p>
          )}
        </div>
      </Section>
    </div>
  );
}

export default ReportCanvas;
