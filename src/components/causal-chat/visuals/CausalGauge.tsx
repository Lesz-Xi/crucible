"use client";

/**
 * Causal Gauge - Visual Truth Meter
 * 
 * Displays real-time causal density measurement using Pearl's Ladder of Causality:
 * - L1 (Association): Observational correlations
 * - L2 (Intervention): Experimental manipulations  
 * - L3 (Counterfactual): Imagined states and necessity/sufficiency
 * 
 * Following Demis Workflow:
 * - L1 Impact: Minimal re-renders via React.memo
 * - L2 Risk: Gradient transitions prevent jarring UI changes
 * - L3 Calibration: Confidence displayed with 2 decimal precision
 * - L4 Critical Gap: None - pure presentational component
 */

import React from "react";
import { CausalDensityResult } from "@/lib/ai/causal-integrity-service";
import { cn } from "@/lib/utils";

export interface CausalGaugeProps {
  /** The causal density result to visualize */
  result: CausalDensityResult;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show detailed info */
  detailed?: boolean;
  /** Animation state */
  isAnimating?: boolean;
  /** Progress through stream (0-100) */
  progress?: number;
  className?: string;
}

const LEVEL_CONFIG = {
  1: {
    label: "Observation",
    description: "Pattern signal",
    accent: "border-wabi-stone/60 text-wabi-ink-light",
    track: "bg-wabi-stone/45",
    fill: "bg-wabi-sumi",
  },
  2: {
    label: "Intervention",
    description: "Mechanism isolation",
    accent: "border-wabi-clay/70 text-wabi-rust",
    track: "bg-wabi-clay/35",
    fill: "bg-wabi-rust",
  },
  3: {
    label: "Counterfactual",
    description: "Necessity map",
    accent: "border-wabi-moss/70 text-wabi-moss",
    track: "bg-wabi-moss/35",
    fill: "bg-wabi-moss",
  },
};

const SIZE_CONFIG = {
  sm: {
    container: "h-1.5 w-16",
    text: "text-[10px]",
    badge: "px-1.5 py-0.5 text-[10px]",
  },
  md: {
    container: "h-2 w-24",
    text: "text-xs",
    badge: "px-2 py-0.5 text-xs",
  },
  lg: {
    container: "h-3 w-32",
    text: "text-sm",
    badge: "px-2.5 py-1 text-sm",
  },
};

export const CausalGauge = React.memo(function CausalGauge({
  result,
  size = "md",
  detailed = false,
  isAnimating = false,
  progress,
  className,
}: CausalGaugeProps) {
  const config = LEVEL_CONFIG[result.score];
  const sizeConfig = SIZE_CONFIG[size];
  
  // Calculate fill percentage based on confidence
  const fillPercentage = Math.min(result.confidence * 100, 100);
  const progressFill = progress !== undefined ? progress : fillPercentage;

  return (
    <div 
      className={cn(
        "relative overflow-hidden transition-all duration-[220ms] ease-out",
        "border border-[var(--border-subtle)]/75 bg-[var(--bg-secondary)]/78 backdrop-blur-sm",
        "shadow-[0_14px_30px_-20px_rgba(44,40,36,0.22)]",
        detailed ? "px-6 py-5 md:px-7 md:py-6 min-w-[320px] md:min-w-[460px]" : "p-3",
        isAnimating ? "animate-fade-in" : "",
        className
      )}
    >
      {/* Quiet tactile grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay-subtle mix-blend-multiply dark:mix-blend-normal" />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border-subtle)]/80" />

      <div className="relative flex flex-col gap-4 md:gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]/55">
          <div className="flex flex-col gap-1">
             {detailed && (
               <span className="text-[9px] text-[var(--text-secondary)] font-mono tracking-[0.3em] uppercase">
                 Current State
               </span>
            )}
            <span className={cn(
              "font-serif text-[var(--text-primary)] leading-none tracking-tight",
              detailed ? "text-4xl md:text-[3rem]" : sizeConfig.text
            )}>
              {config.label}
            </span>
            {detailed && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-mono mt-1">
                {config.description}
              </span>
            )}
          </div>

          {/* Level tag */}
          <div 
            className={cn(
              "flex items-center justify-center transition-colors duration-[180ms]",
              "w-11 h-11 border text-base font-mono",
              config.accent
            )}
          >
            <span className="font-mono text-sm">L{result.score}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
           <div className="h-[3px] w-full bg-[var(--border-subtle)]/60 relative overflow-hidden">
                <div
                  className={cn(
                    "absolute top-0 left-0 h-full transition-all duration-[260ms] ease-out",
                    config.fill
                  )}
                  style={{ width: `${progressFill}%` }}
                />
           </div>
           
           <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-mono">
                Heuristic Confidence
              </span>
              <span className="font-serif italic text-2xl md:text-[32px] text-[var(--text-primary)]">
                {(result.confidence * 100).toFixed(0)}%
              </span>
           </div>
        </div>

        {/* Mechanism chips */}
        {detailed && result.detectedMechanisms.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1 pt-3 border-t border-[var(--border-subtle)]/45">
            {result.detectedMechanisms.slice(0, 3).map((mechanism, idx) => (
              <span
                key={idx}
                className={cn(
                  "font-mono text-[10px] px-2.5 py-1 rounded-[2px] tracking-[0.06em]",
                  "text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80"
                )}
              >
                {mechanism.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default CausalGauge;
