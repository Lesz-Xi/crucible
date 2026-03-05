import React, { useState, useEffect } from "react";
import { Send, Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { SCMGroundedReport, AnalyzeErrorResponse } from "@/types/report-analysis";
import { ReportCanvas } from "@/components/reports/ReportCanvas";
import { cn } from "@/lib/utils";

interface ReportAnalysisPanelProps {
  onSubmit: (query: string) => Promise<void>;
  isLoading: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  report: SCMGroundedReport | null; // Pass down the finalized report
}

export function ReportAnalysisPanel({
  onSubmit,
  isLoading,
  statusMessage,
  errorMessage,
  report
}: ReportAnalysisPanelProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold lab-section-title">SCM-Grounded Report Analysis</h2>
      </div>

      {!report && (
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="E.g., Does moderate coffee consumption reduce all-cause mortality?"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-mono text-sm"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {isLoading ? "Running..." : "Analyze"}
          </button>
        </form>
      )}

      {/* Progress / Status display Component */}
      {(isLoading || statusMessage || errorMessage) && !report && (
        <div className={cn(
          "mb-6 p-4 rounded-xl border flex items-start gap-3",
          errorMessage 
            ? "bg-red-500/10 border-red-500/30 text-red-400" 
            : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
        )}>
          {errorMessage ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col flex-1">
            <span className="font-mono text-sm font-semibold mb-1">
              {errorMessage ? "Analysis Failed" : isLoading ? "Pipeline Active" : "Status"}
            </span>
            <span className="text-xs opacity-80 leading-relaxed font-mono whitespace-pre-wrap">
              {errorMessage || statusMessage}
            </span>
          </div>
        </div>
      )}

      {/* Report Canvas */}
      {report && (
        <div className="flex-1 overflow-auto -mx-4 px-4 pb-4">
          <ReportCanvas report={report} />
        </div>
      )}
    </div>
  );
}
