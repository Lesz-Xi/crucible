import React from "react";
import { SourceRecord } from "@/types/report-analysis";
import { ExternalLink, Database, CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EvidenceRailProps {
  sources: SourceRecord[];
}

export function EvidenceRail({ sources }: EvidenceRailProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-cyan-500" />
        <h3 className="text-lg font-semibold text-white/90">Supporting Evidence</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
          {sources.length} sources
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((source) => (
          <div 
            key={source.sourceId} 
            className="flex flex-col p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-black/40 text-cyan-300">
                {source.domain}
              </span>
              {source.publishedAt && (
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <CalendarIcon className="w-3 h-3" />
                  {formatDistanceToNow(new Date(source.publishedAt), { addSuffix: true })}
                </div>
              )}
            </div>
            
            <p className="text-sm text-white/80 line-clamp-3 mb-4 flex-1">
              "{source.excerpt}"
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
              <div className="flex gap-2">
                <ScorePill label="Cred." score={source.credibilityScore} />
                <ScorePill label="Corr." score={source.corroborationScore} />
              </div>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noreferrer noopener"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  // Score is 0-1
  const colorClass = score >= 0.8 ? "text-emerald-400" : score >= 0.5 ? "text-amber-400" : "text-orange-400";
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono whitespace-nowrap">
      <span className="text-white/40">{label}:</span>
      <span className={colorClass}>{(score * 100).toFixed(0)}</span>
    </div>
  );
}
