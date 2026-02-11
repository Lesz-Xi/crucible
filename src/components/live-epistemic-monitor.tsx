'use client';

import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

/**
 * LiveEpistemicMonitor
 * 
 * Phase 1 Frontend Shell (Mock Data)
 * Displays real-time epistemic state during synthesis:
 * - Consciousness State (Energy, Entropy, Free Energy)
 * - Iteration Progress
 * - Confidence Trends
 * 
 * Wabi-Sabi Integration:
 * - Flowing animations for real-time updates
 * - Organic color transitions for state changes
 * - Imperfect-perfect data visualization
 * 
 * Backend Dependency: Phase 2 SSE event 'epistemic_update'
 */

interface ConsciousnessState {
  energy: number;
  entropy: number;
  freeEnergy: number;
  perceptionIntensity: number;
  workingMemoryAccess: number;
  awarenessLevel: number;
}

interface EpistemicMonitorData {
  consciousnessState: ConsciousnessState;
  iteration: number;
  maxIterations: number;
  plateauReached: boolean;
}

export const LiveEpistemicMonitor: React.FC<{ data?: EpistemicMonitorData }> = ({ data }) => {
  // Mock data for Phase 1 design validation
  const mockData: EpistemicMonitorData = {
    consciousnessState: {
      energy: 0.78,
      entropy: 0.45,
      freeEnergy: 0.33,
      perceptionIntensity: 0.82,
      workingMemoryAccess: 0.91,
      awarenessLevel: 0.76,
    },
    iteration: 3,
    maxIterations: 5,
    plateauReached: false,
  };

  const displayData = data || mockData;
  const { consciousnessState: cs, iteration, maxIterations, plateauReached } = displayData;

  // Helper to get color based on metric value
  const getMetricColor = (value: number): string => {
    if (value >= 0.7) return 'text-wabi-emerald';
    if (value >= 0.4) return 'text-wabi-rust';
    return 'text-red-500';
  };

  // Helper to render metric bar
  const MetricBar: React.FC<{ label: string; value: number; icon?: React.ReactNode }> = ({
    label,
    value,
    icon,
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-wabi-charcoal dark:text-wabi-sand">{label}</span>
        </div>
        <span className={`font-mono font-semibold ${getMetricColor(value)}`}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-wabi-charcoal/10 dark:bg-wabi-sand/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            value >= 0.7
              ? 'bg-gradient-to-r from-wabi-emerald/70 to-wabi-emerald'
              : value >= 0.4
              ? 'bg-gradient-to-r from-wabi-rust/70 to-wabi-rust'
              : 'bg-gradient-to-r from-red-400 to-red-500'
          }`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-glass-card backdrop-blur-md border border-wabi-sand/20 rounded-lg p-6 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-wabi-rust/10 rounded-lg">
          <Brain className="w-5 h-5 text-wabi-rust" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-wabi-charcoal dark:text-wabi-sand">
            Epistemic State
          </h3>
          <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
            Real-time Consciousness Monitoring
          </p>
        </div>
        {plateauReached && (
          <div className="flex items-center gap-1.5 text-xs text-wabi-emerald bg-wabi-emerald/10 px-2.5 py-1 rounded-full">
            <Activity className="w-3.5 h-3.5" />
            <span>Plateau</span>
          </div>
        )}
      </div>

      {/* Iteration Progress */}
      <div className="mb-6 p-4 bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-lg border border-wabi-sand/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-wabi-charcoal dark:text-wabi-sand">
            Refinement Cycle
          </span>
          <span className="text-sm font-mono font-semibold text-wabi-rust">
            {iteration} / {maxIterations}
          </span>
        </div>
        <div className="h-2 bg-wabi-charcoal/10 dark:bg-wabi-sand/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-wabi-rust/70 to-wabi-rust transition-all duration-700"
            style={{ width: `${(iteration / maxIterations) * 100}%` }}
          />
        </div>
      </div>

      {/* Content - Consciousness Metrics */}
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Primary Metrics */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-wabi-charcoal/70 dark:text-wabi-sand/70 uppercase tracking-wide">
            Core Dynamics
          </div>
          <MetricBar
            label="Energy (E)"
            value={cs.energy}
            icon={<TrendingUp className="w-3.5 h-3.5 text-wabi-rust" />}
          />
          <MetricBar label="Entropy (S)" value={cs.entropy} />
          <MetricBar
            label="Free Energy (F)"
            value={cs.freeEnergy}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-wabi-emerald" />}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="pt-4 border-t border-wabi-sand/10 space-y-3">
          <div className="text-xs font-semibold text-wabi-charcoal/70 dark:text-wabi-sand/70 uppercase tracking-wide">
            Phenomenal States
          </div>
          <MetricBar label="Perception Intensity" value={cs.perceptionIntensity} />
          <MetricBar label="Working Memory Access" value={cs.workingMemoryAccess} />
          <MetricBar label="Awareness Level" value={cs.awarenessLevel} />
        </div>

        {/* Confidence Assessment */}
        <div className="pt-4 border-t border-wabi-sand/10">
          <div className="p-3 bg-wabi-emerald/5 dark:bg-wabi-emerald/10 rounded-lg border border-wabi-emerald/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-wabi-emerald" />
              <span className="text-sm font-semibold text-wabi-emerald">
                Overall Confidence
              </span>
            </div>
            <div className="text-2xl font-bold text-wabi-emerald font-mono">
              {(((cs.energy + cs.freeEnergy + cs.awarenessLevel) / 3) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60 mt-1">
              Derived from E, F, and Awareness
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
