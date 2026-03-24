/**
 * Node Detail Modal Component
 * 
 * Shows comprehensive information about a causal node:
 * - Current value and distribution
 * - Incoming causal influences
 * - Outgoing effects
 * - Research backing
 * - Intervention suggestions
 */

'use client';

import React from 'react';
import { X, TrendingUp, TrendingDown, Info, ExternalLink } from 'lucide-react';
import { formatNodeName, getNodeDescription, getNodeResearch } from '@/lib/utils/text-formatting';

interface NodeInfluence {
  from: string;
  strength: number;
  description: string;
}

interface NodeEffect {
  to: string;
  strength: number;
  description: string;
}

interface NodeDetailModalProps {
  nodeId: string;
  currentValue: number;
  meanValue?: number;
  influences?: NodeInfluence[];
  effects?: NodeEffect[];
  isBottleneck?: boolean;
  isLeveragePoint?: boolean;
  onClose: () => void;
  className?: string;
}

export function NodeDetailModal({
  nodeId,
  currentValue,
  meanValue = 50,
  influences = [],
  effects = [],
  isBottleneck = false,
  isLeveragePoint = false,
  onClose,
  className = ''
}: NodeDetailModalProps) {
  const research = getNodeResearch(nodeId);
  const description = getNodeDescription(nodeId);
  const deviation = currentValue - meanValue;
  const percentile = Math.round((currentValue / 100) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-2xl mb-2">{formatNodeName(nodeId)}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-4">
            {isBottleneck && (
              <div className="px-3 py-1 rounded-full bg-wabi-rust/20 text-wabi-rust text-xs font-mono uppercase tracking-wider">
                Bottleneck
              </div>
            )}
            {isLeveragePoint && (
              <div className="px-3 py-1 rounded-full bg-wabi-moss/20 text-wabi-moss text-xs font-mono uppercase tracking-wider">
                Leverage Point
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Value */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
              Current State
            </h3>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--text-secondary)]">Value</span>
                <span className="font-mono text-2xl">{currentValue.toFixed(1)}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-wabi-moss transition-all"
                  style={{ width: `${Math.min(percentile, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-tertiary)]">{percentile}th percentile</span>
                {deviation !== 0 && (
                  <span
                    className={`flex items-center gap-1 ${
                      deviation > 0 ? 'text-wabi-moss' : 'text-wabi-rust'
                    }`}
                  >
                    {deviation > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(deviation).toFixed(1)} {deviation > 0 ? 'above' : 'below'} average
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Incoming Influences */}
          {influences.length > 0 && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Causal Influences (What Affects This)
              </h3>
              <div className="space-y-2">
                {influences.map((influence, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm mb-1">{formatNodeName(influence.from)}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{influence.description}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-mono text-lg text-wabi-moss">
                        {(influence.strength * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">effect strength</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Outgoing Effects */}
          {effects.length > 0 && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Downstream Effects (What This Affects)
              </h3>
              <div className="space-y-2">
                {effects.map((effect, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm mb-1">{formatNodeName(effect.to)}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{effect.description}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-mono text-lg text-wabi-clay">
                        {(effect.strength * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">propagation</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Research Evidence */}
          <section className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-wabi-ink-light flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Research Evidence
                </h3>
                {research.url ? (
                  <a
                    href={research.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--text-secondary)] hover:text-wabi-clay flex items-center gap-2 transition-colors group"
                  >
                    <span>{research.citation}</span>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">{research.citation}</p>
                )}
              </div>
            </div>
          </section>

          {/* Leverage/Bottleneck Explanation */}
          {(isBottleneck || isLeveragePoint) && (
            <section className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                Why This Node Is Special
              </h3>
              {isBottleneck && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  This is a <span className="text-wabi-rust font-semibold">bottleneck</span> in your
                  learning system. While it's currently limiting your performance, improving it directly
                  may have limited impact. Consider addressing upstream factors first (like{' '}
                  {influences.length > 0 && formatNodeName(influences[0].from)}) to unlock this
                  bottleneck naturally.
                </p>
              )}
              {isLeveragePoint && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  This is a <span className="text-wabi-moss font-semibold">leverage point</span> in
                  your system. Small improvements here will cascade through the causal chain, creating
                  maximum impact on your overall performance. This is where your intervention efforts
                  will have the highest return on investment.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
