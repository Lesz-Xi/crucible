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
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-4 w-4 text-[var(--lab-accent-earth,#C8965A)]" />
        <h3 className="text-base font-semibold text-white/90">Supporting Evidence</h3>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55">
          {sources.length} sources
        </span>
      </div>

      <div className="space-y-2.5">
        {sources.map((source) => (
          <a
            key={source.sourceId}
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/60">
                  {source.domain}
                </span>
                {source.publishedAt ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDistanceToNow(new Date(source.publishedAt), { addSuffix: true })}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/84">
                &quot;{source.excerpt}&quot;
              </p>

              <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-[0.12em] text-white/45">
                <span>Cred. <ScoreValue score={source.credibilityScore} /></span>
                <span>Corr. <ScoreValue score={source.corroborationScore} /></span>
              </div>
            </div>

            <ExternalLink className="mt-1 h-4 w-4 flex-shrink-0 text-white/45" />
          </a>
        ))}
      </div>
    </section>
  );
}

function ScoreValue({ score }: { score: number }) {
  const colorClass = score >= 0.8 ? "text-emerald-400" : score >= 0.5 ? "text-amber-300" : "text-orange-300";
  return <span className={colorClass}>{(score * 100).toFixed(0)}</span>;
}
