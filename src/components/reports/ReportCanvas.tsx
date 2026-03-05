import React from "react";
import { SCMGroundedReport } from "@/types/report-analysis";
import { TrustBadge } from "./TrustBadge";
import { EvidenceRail } from "./EvidenceRail";
import { FalsifierChecklist } from "./FalsifierChecklist";
import { UnknownsPanel } from "./UnknownsPanel";
import { FileText, Link2, GitMerge, LayoutDashboard } from "lucide-react";

interface ReportCanvasProps {
  report: SCMGroundedReport;
}

export function ReportCanvas({ report }: ReportCanvasProps) {
  if (!report) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 isolate">
      {/* Header and Trust Badge */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-sm font-mono">
            <LayoutDashboard className="w-4 h-4" />
            <span>ID: {report.meta.reportId.split('-').pop()}</span>
            <span className="opacity-50">•</span>
            <span>{new Date(report.meta.generatedAt).toLocaleString()}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white/95">
            {report.meta.query}
          </h1>
        </div>
        <div className="flex-shrink-0">
          <TrustBadge report={report} />
        </div>
      </header>

      {/* Executive Summary */}
      <section className="bg-black/20 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white/90">Executive Summary</h2>
        </div>
        <ul className="space-y-3">
          {report.executiveSummary.map((point, idx) => (
            <li key={idx} className="flex gap-3 text-white/80 leading-relaxed">
              <span className="text-emerald-500/50 mt-1">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Primary Hypotheses (Causal Chains) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <GitMerge className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white/90">Primary Hypotheses</h2>
        </div>
        <div className="grid gap-4">
          {report.primaryHypotheses.map((hyp, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono px-2 py-1 bg-black/40 text-blue-300 rounded">
                  Confidence: {(hyp.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-xs font-mono px-2 py-1 bg-black/40 text-white/60 rounded">
                  {hyp.claimClass}
                </span>
              </div>
              <p className="text-white/90 leading-relaxed mb-4">{hyp.text}</p>
              
              {hyp.supportingClaimIds && hyp.supportingClaimIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-white/50 pt-3 border-t border-white/10">
                  <Link2 className="w-3 h-3" />
                  Supported by {hyp.supportingClaimIds.length} claims
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-white/10 my-4" />

      {/* Falsifier & Unknowns Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <FalsifierChecklist items={report.falsifierChecklist} />
        <UnknownsPanel unknowns={report.unknownsAndGaps} />
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Evidence Rail */}
      <EvidenceRail sources={report.sources} />

    </div>
  );
}
