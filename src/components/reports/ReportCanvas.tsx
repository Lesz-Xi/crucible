import React from "react";
import { SCMGroundedReport } from "@/types/report-analysis";
import { TrustBadge } from "./TrustBadge";
import { FalsifierChecklist } from "./FalsifierChecklist";
import { UnknownsPanel } from "./UnknownsPanel";
import { FileText, Link2, GitMerge, LayoutDashboard } from "lucide-react";

interface ReportCanvasProps {
  report: SCMGroundedReport;
}

export function ReportCanvas({ report }: ReportCanvasProps) {
  if (!report) return null;

  return (
    <div className="report-shell flex flex-col gap-6 isolate">
      <header className="report-header md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-2">
          <div className="report-meta">
            <LayoutDashboard className="w-4 h-4" />
            <span>ID: {report.meta.reportId.split('-').pop()}</span>
            <span className="opacity-50">•</span>
            <span>{new Date(report.meta.generatedAt).toLocaleString()}</span>
          </div>
          <h1 className="report-title">{report.meta.query}</h1>
        </div>
        <div className="flex-shrink-0">
          <TrustBadge report={report} />
        </div>
      </header>

      <section className="report-card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--text-1)]">Executive Summary</h2>
        </div>
        <ul className="space-y-3">
          {report.executiveSummary.map((point, idx) => (
            <li key={idx} className="flex gap-3 leading-relaxed text-[var(--text-2)]">
              <span className="mt-1 text-[var(--accent)]">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <GitMerge className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--text-1)]">Primary Hypotheses</h2>
        </div>
        <div className="grid gap-4">
          {report.primaryHypotheses.map((hyp, i) => (
            <div key={i} className="report-card">
              <div className="flex justify-between items-start mb-3">
                <span className="report-chip">
                  Confidence: {(hyp.confidence * 100).toFixed(0)}%
                </span>
                <span className="report-chip">
                  {hyp.claimClass}
                </span>
              </div>
              <p className="mb-4 leading-relaxed text-[var(--text-1)]">{hyp.text}</p>

              {report.sources[i] ? (
                <div className="report-chip mb-4">
                  <Link2 className="w-3 h-3" />
                  <span className="truncate">{report.sources[i].domain}</span>
                </div>
              ) : null}
              
              {hyp.supportingClaimIds && hyp.supportingClaimIds.length > 0 && (
                <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-2)]">
                  <Link2 className="w-3 h-3" />
                  Supported by {hyp.supportingClaimIds.length} claims
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="h-px my-4 bg-[var(--border)]" />

      <div className="grid md:grid-cols-2 gap-6">
        <FalsifierChecklist items={report.falsifierChecklist} />
        <UnknownsPanel unknowns={report.unknownsAndGaps} />
      </div>
    </div>
  );
}
