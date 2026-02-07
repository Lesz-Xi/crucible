"use client";

import type { AlignmentAuditReport } from "@/types/alignment";

interface AlignmentInsightsPanelProps {
  report: AlignmentAuditReport | null;
  modelKey?: string | null;
  className?: string;
}

function formatNumber(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return value.toFixed(3);
}

export function AlignmentInsightsPanel({ report, modelKey, className }: AlignmentInsightsPanelProps) {
  if (!report) {
    return (
      <section className={`rounded-2xl border border-wabi-stone/20 bg-white/60 p-5 ${className || ""}`}>
        <h3 className="text-sm font-semibold text-wabi-sumi">Alignment Audit Insights</h3>
        {modelKey && <div className="mt-1 text-xs text-wabi-stone">Model: {modelKey}</div>}
        <p className="mt-2 text-sm text-wabi-stone">
          No alignment audit report has been ingested yet. Run the Python audit and insert the JSON report into
          <code className="mx-1 rounded bg-wabi-stone/10 px-1 py-0.5">alignment_audit_reports</code>
          to populate this panel.
        </p>
      </section>
    );
  }

  const fairness = report.fairness || null;
  const pathSpecific = report.path_specific_fairness || null;
  const decision = report.alignment_decision || null;

  return (
    <section className={`rounded-2xl border border-wabi-stone/20 bg-white/70 p-5 ${className || ""}`}>
      <h3 className="text-sm font-semibold text-wabi-sumi">Alignment Audit Insights</h3>
      {modelKey && <div className="mt-1 text-xs text-wabi-stone">Model: {modelKey}</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">Fairness Gap Index</div>
          <div className="mt-1 text-lg font-semibold text-wabi-sumi">{formatNumber(fairness?.fairness_gap_index)}</div>
        </div>
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">Demographic Parity</div>
          <div className="mt-1 text-lg font-semibold text-wabi-sumi">{formatNumber(fairness?.demographic_parity_gap)}</div>
        </div>
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">Equal Opportunity</div>
          <div className="mt-1 text-lg font-semibold text-wabi-sumi">{formatNumber(fairness?.equal_opportunity_gap)}</div>
        </div>
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">False Positive Rate</div>
          <div className="mt-1 text-lg font-semibold text-wabi-sumi">{formatNumber(fairness?.false_positive_rate_gap)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">Direct Gap (Blocked)</div>
          <div className="mt-1 text-base font-semibold text-wabi-sumi">
            {formatNumber(pathSpecific?.direct_gap_after_blocking_mediated_paths)}
          </div>
        </div>
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">Mediated Gap Removed</div>
          <div className="mt-1 text-base font-semibold text-wabi-sumi">{formatNumber(pathSpecific?.mediated_gap_removed)}</div>
        </div>
        <div className="rounded-xl border border-wabi-stone/20 bg-white p-3">
          <div className="text-xs uppercase tracking-wide text-wabi-stone">Sign Flip</div>
          <div className="mt-1 text-base font-semibold text-wabi-sumi">
            {pathSpecific?.sign_flip_after_blocking ? "true" : "false"}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-wabi-stone/20 bg-white p-3 text-sm">
        <div className="font-medium text-wabi-sumi">Alignment Decision</div>
        <div className="mt-1 text-wabi-stone">
          {decision?.aligned ? "Aligned" : "Not aligned"}
          {Array.isArray(decision?.failures) && decision.failures.length > 0
            ? `: ${decision.failures.join(" | ")}`
            : ""}
        </div>
      </div>
    </section>
  );
}

export default AlignmentInsightsPanel;
