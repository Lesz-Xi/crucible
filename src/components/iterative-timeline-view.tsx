'use client';

import React from 'react';
import { 
  Circle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Sparkles,
  GitBranch
} from 'lucide-react';

/**
 * IterativeTimelineView
 * 
 * Phase 1 Frontend Shell (Mock Data)
 * Replaces linear timeline with dialectical refinement visualization:
 * - Refinement Cycles (iterations)
 * - Phase Transitions (concept extraction → contradiction → synthesis)
 * - Backtracking and refinement loops
 * 
 * Wabi-Sabi Integration:
 * - Organic flow lines connecting iterations
 * - Asymmetric cycle layouts
 * - Natural state transitions
 * 
 * Backend Dependency: Phase 2 SSE events 'refinement_cycle_start', 'refinement_cycle_complete'
 */

interface TimelinePhase {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'warning';
  timestamp?: string;
  details?: string;
}

interface RefinementCycle {
  iteration: number;
  phases: TimelinePhase[];
  plateauReached: boolean;
}

interface IterativeTimelineData {
  cycles: RefinementCycle[];
  currentCycle: number;
  maxCycles: number;
}

export const IterativeTimelineView: React.FC<{ data?: IterativeTimelineData }> = ({ data }) => {
  // Mock data for Phase 1 design validation
  const mockData: IterativeTimelineData = {
    currentCycle: 2,
    maxCycles: 5,
    cycles: [
      {
        iteration: 1,
        plateauReached: false,
        phases: [
          { key: 'extract', label: 'Concept Extraction', status: 'complete', timestamp: '14:32:01' },
          { key: 'contradict', label: 'Contradiction Detection', status: 'complete', timestamp: '14:32:15' },
          { key: 'synthesize', label: 'Initial Synthesis', status: 'complete', timestamp: '14:32:42' },
        ],
      },
      {
        iteration: 2,
        plateauReached: false,
        phases: [
          { key: 'extract', label: 'Concept Refinement', status: 'complete', timestamp: '14:33:05' },
          { key: 'contradict', label: 'Deep Contradiction Scan', status: 'active', timestamp: '14:33:18' },
          { key: 'synthesize', label: 'Synthesis Iteration 2', status: 'pending' },
        ],
      },
      {
        iteration: 3,
        plateauReached: false,
        phases: [
          { key: 'extract', label: 'Concept Hardening', status: 'pending' },
          { key: 'contradict', label: 'Final Contradiction Check', status: 'pending' },
          { key: 'synthesize', label: 'Convergent Synthesis', status: 'pending' },
        ],
      },
    ],
  };

  const displayData = data || mockData;

  // Helper to get status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'complete':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'wabi-emerald',
          bgClass: 'bg-wabi-emerald/20',
          borderClass: 'border-wabi-emerald',
        };
      case 'active':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          color: 'wabi-rust',
          bgClass: 'bg-wabi-rust/20',
          borderClass: 'border-wabi-rust',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'yellow-500',
          bgClass: 'bg-yellow-500/20',
          borderClass: 'border-yellow-500',
        };
      case 'pending':
      default:
        return {
          icon: <Circle className="w-4 h-4" />,
          color: 'wabi-charcoal/30 dark:wabi-sand/30',
          bgClass: 'bg-wabi-charcoal/5 dark:bg-wabi-sand/5',
          borderClass: 'border-wabi-sand/20',
        };
    }
  };

  return (
    <div className="bg-glass-card backdrop-blur-md border border-wabi-sand/20 rounded-lg p-6 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-wabi-rust/10 rounded-lg">
          <GitBranch className="w-5 h-5 text-wabi-rust" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-wabi-charcoal dark:text-wabi-sand">
            Dialectical Timeline
          </h3>
          <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
            Refinement Cycle {displayData.currentCycle} of {displayData.maxCycles}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-wabi-rust bg-wabi-rust/10 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Iterative</span>
        </div>
      </div>

      {/* Cycle Progress Indicator */}
      <div className="mb-6 p-4 bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-lg border border-wabi-sand/10">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 text-wabi-rust" />
          <span className="text-sm font-medium text-wabi-charcoal dark:text-wabi-sand">
            Synthesis Convergence
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: displayData.maxCycles }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                idx < displayData.currentCycle
                  ? 'bg-wabi-emerald'
                  : idx === displayData.currentCycle
                  ? 'bg-wabi-rust animate-pulse'
                  : 'bg-wabi-charcoal/10 dark:bg-wabi-sand/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {displayData.cycles.map((cycle, cycleIdx) => {
          const isCurrent = cycleIdx === displayData.currentCycle;
          const isComplete = cycleIdx < displayData.currentCycle;
          const isPending = cycleIdx > displayData.currentCycle;

          return (
            <div
              key={cycle.iteration}
              className={`relative transition-all duration-300 ${
                isCurrent ? 'opacity-100' : isPending ? 'opacity-40' : 'opacity-70'
              }`}
            >
              {/* Cycle Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isComplete
                      ? 'bg-wabi-emerald/20 border-wabi-emerald'
                      : isCurrent
                      ? 'bg-wabi-rust/20 border-wabi-rust'
                      : 'bg-wabi-charcoal/5 dark:bg-wabi-sand/5 border-wabi-sand/20'
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${
                      isComplete
                        ? 'text-wabi-emerald'
                        : isCurrent
                        ? 'text-wabi-rust'
                        : 'text-wabi-charcoal/40 dark:text-wabi-sand/40'
                    }`}
                  >
                    {cycle.iteration}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-wabi-charcoal dark:text-wabi-sand">
                    Cycle {cycle.iteration}
                    {cycle.plateauReached && (
                      <span className="ml-2 text-xs text-wabi-emerald">(Plateau Reached)</span>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-wabi-rust">Currently processing...</div>
                  )}
                </div>
              </div>

              {/* Phases */}
              <div className="ml-4 pl-6 border-l-2 border-wabi-sand/20 space-y-3 pb-2">
                {cycle.phases.map((phase, phaseIdx) => {
                  const config = getStatusConfig(phase.status);
                  return (
                    <div
                      key={phase.key}
                      className={`relative group transition-all duration-200 ${
                        phase.status === 'active' ? 'scale-105' : ''
                      }`}
                    >
                      {/* Connection Dot */}
                      <div
                        className={`absolute -left-[28px] top-2 w-3 h-3 rounded-full border-2 ${config.bgClass} ${config.borderClass}`}
                      />

                      {/* Phase Card */}
                      <div
                        className={`p-3 rounded-lg border transition-all ${config.bgClass} ${config.borderClass} ${
                          phase.status === 'active' ? 'ring-2 ring-wabi-rust/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`text-${config.color}`}>{config.icon}</div>
                            <div>
                              <div className="text-sm font-medium text-wabi-charcoal dark:text-wabi-sand">
                                {phase.label}
                              </div>
                              {phase.timestamp && (
                                <div className="flex items-center gap-1 text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{phase.timestamp}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {phase.details && (
                          <div className="mt-2 text-xs text-wabi-charcoal/70 dark:text-wabi-sand/70">
                            {phase.details}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cycle Separator (except last) */}
              {cycleIdx < displayData.cycles.length - 1 && (
                <div className="flex items-center gap-2 my-4 ml-4">
                  <RefreshCw className="w-4 h-4 text-wabi-sand/40" />
                  <div className="flex-1 h-px bg-gradient-to-r from-wabi-sand/40 via-wabi-sand/20 to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
