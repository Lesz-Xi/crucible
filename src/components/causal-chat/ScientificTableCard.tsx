import { useState } from 'react';
import { FileText, Table, Database, AlertTriangle, ChevronDown, ChevronRight, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScientificAnalysisResponse, ScientificNumericEvidenceItem } from '@/lib/science/scientific-analysis-service';

interface ScientificTableCardProps {
  analysis: ScientificAnalysisResponse;
  className?: string;
}

function EvidenceRow({ item }: { item: ScientificNumericEvidenceItem }) {
  return (
    <div className="flex items-start gap-2 text-xs border-l-2 border-[var(--lab-border)] pl-2 py-0.5">
      <div className="font-mono font-medium text-[var(--lab-text-primary)] shrink-0">
        {item.value}
      </div>
      <div className="text-[var(--lab-text-tertiary)] line-clamp-2" title={item.contextSnippet}>
        {item.contextSnippet || "No context"}
      </div>
    </div>
  );
}

export function ScientificTableCard({ analysis, className }: ScientificTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { summary, numericEvidence, warnings, observability } = analysis;
  const hasWarnings = warnings.length > 0;
  const statusColor = analysis.status === 'failed' ? 'text-red-400' : 
                      analysis.status === 'partial' ? 'text-amber-400' : 'text-emerald-400';

  // Group evidence by category for display
  const metrics = numericEvidence.filter(item => item.source === 'table');
  const prose = numericEvidence.filter(item => item.source === 'prose');

  return (
    <div className={cn("lab-card overflow-hidden !p-0 border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]", className)}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--lab-panel)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-md bg-[var(--lab-bg)] border border-[var(--lab-border)]")}>
            <FileText className="h-4 w-4 text-[var(--lab-text-secondary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-[var(--lab-text-primary)]">
                {observability.fileName}
              </h4>
              <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--lab-bg)] border border-[var(--lab-border)]", statusColor)}>
                {analysis.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--lab-text-tertiary)] font-mono">
              <span className="flex items-center gap-1">
                <Table className="h-3 w-3" />
                {summary.trustedTableCount}/{summary.tableCount} tables
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {summary.dataPointCount} points
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasWarnings && (
            <div title={`${warnings.length} warnings`}>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 text-[var(--lab-text-tertiary)]" /> : 
            <ChevronRight className="h-4 w-4 text-[var(--lab-text-tertiary)]" />
          }
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--lab-border)] bg-[var(--lab-bg)] p-4 space-y-4">
          
          {/* Warnings Section */}
          {hasWarnings && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Ingestion Warnings
              </h5>
              <ul className="space-y-1">
                {warnings.slice(0, 3).map((w, idx) => (
                  <li key={idx} className="text-xs text-[var(--lab-text-secondary)] pl-3 border-l text-wrap break-words border-amber-500/20">
                    {w}
                  </li>
                ))}
                {warnings.length > 3 && (
                  <li className="text-[10px] text-[var(--lab-text-tertiary)] pt-1 italic">
                    + {warnings.length - 3} more warnings
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Metrics Preview */}
          {metrics.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[var(--lab-text-secondary)] mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Extracted Metrics (Table)
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {metrics.slice(0, 4).map((item, idx) => (
                  <EvidenceRow key={idx} item={item} />
                ))}
              </div>
            </div>
          )}

           {/* Prose Claims Preview */}
           {prose.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[var(--lab-text-secondary)] mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" />
                Textual Claims (Prose)
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {prose.slice(0, 3).map((item, idx) => (
                  <EvidenceRow key={idx} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="pt-2 border-t border-[var(--lab-border)] flex items-center justify-between text-[10px] text-[var(--lab-text-tertiary)] font-mono">
             <span>ID: {analysis.ingestionId.slice(0, 8)}</span>
             <span>{Math.round(observability.durationMs)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
