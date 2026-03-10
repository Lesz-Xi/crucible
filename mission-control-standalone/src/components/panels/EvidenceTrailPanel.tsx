'use client';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types (mirror bridge-types Evidence interface)
// ---------------------------------------------------------------------------

export interface EvidenceItem {
  sourceId: string;
  title: string;
  uri: string;
  snippet: string;
  methodology: string;
  confidenceContribution: number;
}

export interface ProvMetadata {
  traceId: string;
  causalDepth: 'heuristic' | 'verified';
  provenanceHash: string;
  generatedAt?: string;
}

interface EvidenceTrailPanelProps {
  evidence: EvidenceItem[];
  provenance?: ProvMetadata;
  onSourceClick?: (item: EvidenceItem) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const barColor =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/60">{pct}%</span>
    </div>
  );
}

function CausalDepthBadge({ depth }: { depth: 'heuristic' | 'verified' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        depth === 'verified'
          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
          : 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
      }`}
    >
      {depth === 'verified' ? '✓ Verified' : '⟳ Heuristic'}
    </span>
  );
}

function EvidenceCard({
  item,
  index,
  onClick,
}: {
  item: EvidenceItem;
  index: number;
  onClick?: (item: EvidenceItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group relative rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-indigo-400/40 hover:bg-white/8 cursor-pointer"
      onClick={() => {
        setExpanded((e) => !e);
        onClick?.(item);
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-white/90 leading-snug line-clamp-1 group-hover:text-indigo-200 transition-colors">
            {item.title}
          </p>
        </div>
        <span className="shrink-0 text-white/30 text-xs mt-0.5">{expanded ? '↑' : '↓'}</span>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={item.confidenceContribution} />

      {/* Methodology chip */}
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">
          {item.methodology}
        </span>
      </div>

      {/* Expanded snippet + link */}
      {expanded && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-xs text-white/60 leading-relaxed italic">{item.snippet}</p>
          <a
            href={item.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Open source ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function EvidenceTrailPanel({
  evidence,
  provenance,
  onSourceClick,
  className = '',
}: EvidenceTrailPanelProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filtered = evidence.filter((e) => {
    if (activeFilter === 'high') return e.confidenceContribution >= 0.8;
    if (activeFilter === 'medium')
      return e.confidenceContribution >= 0.5 && e.confidenceContribution < 0.8;
    if (activeFilter === 'low') return e.confidenceContribution < 0.5;
    return true;
  });

  const avgConfidence =
    evidence.length > 0
      ? evidence.reduce((acc, e) => acc + e.confidenceContribution, 0) / evidence.length
      : 0;

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0d0d1a]/80 p-4 backdrop-blur-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Evidence Trail</h3>
          <p className="text-xs text-white/40">
            {evidence.length} source{evidence.length !== 1 ? 's' : ''} · avg confidence{' '}
            {Math.round(avgConfidence * 100)}%
          </p>
        </div>
        {provenance?.causalDepth && (
          <CausalDepthBadge depth={provenance.causalDepth} />
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'high', 'medium', 'low'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              activeFilter === f
                ? 'bg-indigo-500 text-white'
                : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Evidence cards */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-white/30 py-4">No sources match this filter.</p>
        ) : (
          filtered.map((item, i) => (
            <EvidenceCard key={item.sourceId} item={item} index={i} onClick={onSourceClick} />
          ))
        )}
      </div>

      {/* Provenance footer */}
      {provenance && (
        <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2">
          <p className="text-[10px] text-white/30 font-mono leading-relaxed break-all">
            <span className="text-white/50 font-semibold not-italic">Trace:</span>{' '}
            {provenance.traceId}
          </p>
          <p className="text-[10px] text-white/30 font-mono leading-relaxed break-all mt-0.5">
            <span className="text-white/50 font-semibold not-italic">Hash:</span>{' '}
            {provenance.provenanceHash.slice(0, 16)}…
          </p>
        </div>
      )}
    </div>
  );
}
