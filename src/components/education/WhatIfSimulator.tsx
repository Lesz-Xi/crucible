/**
 * What-If Simulator Component
 * 
 * Interactive simulation tool that lets students:
 * - Adjust node values with sliders
 * - See real-time propagation of effects through causal graph
 * - Compare "Current" vs "Simulated" states
 * - Commit simulations as goals for intervention planning
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Target, TrendingUp, Info, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNodeName } from '@/lib/utils/text-formatting';

interface NodeState {
  id: string;
  currentValue: number;
  simulatedValue: number;
}

interface CausalEdge {
  from: string;
  to: string;
  strength: number;
}

interface WhatIfSimulatorProps {
  initialNodes: NodeState[];
  edges: CausalEdge[];
  onCommitGoal?: (nodes: NodeState[]) => void;
  className?: string;
  maxValue?: number;
  step?: number;
}

export function WhatIfSimulator({
  initialNodes,
  edges,
  onCommitGoal,
  className = '',
  maxValue = 10,
  step = 0.1
}: WhatIfSimulatorProps) {
  const [nodes, setNodes] = useState<NodeState[]>(initialNodes);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setShowComparison(false);
  }, [initialNodes]);

  useEffect(() => {
    const firstNode = nodes.find(node => node.id !== 'Performance');
    if (!focusedNodeId && firstNode) {
      setFocusedNodeId(firstNode.id);
    }
  }, [nodes, focusedNodeId]);

  // Reset simulation to current values
  const handleReset = () => {
    setNodes(
      initialNodes.map(node => ({
        ...node,
        simulatedValue: node.currentValue
      }))
    );
    setShowComparison(false);
  };

  // Update a node's simulated value and propagate effects
  const handleNodeChange = (nodeId: string, newValue: number) => {
    setIsSimulating(true);
    setShowComparison(true);

    // Recompute from baseline each time so "one-factor-at-a-time" remains deterministic.
    const baselineNodes = initialNodes.map((node) => ({
      ...node,
      simulatedValue: node.currentValue
    }));
    const propagatedNodes = propagateEffects(baselineNodes, nodeId, newValue, edges, maxValue);
    setNodes(propagatedNodes);

    setTimeout(() => setIsSimulating(false), 300);
  };

  // Calculate expected performance change
  const expectedPerformanceChange = () => {
    const performanceNode = nodes.find(n => n.id === 'Performance');
    if (!performanceNode) return 0;
    return performanceNode.simulatedValue - performanceNode.currentValue;
  };

  // Commit simulation as a goal
  const handleCommitAsGoal = () => {
    onCommitGoal?.(nodes);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-wabi-clay" />
            What-If Simulator
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Adjust one factor at a time and watch how the system responds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] transition-colors text-xs font-mono uppercase tracking-wider"
          >
            {focusMode ? 'All Factors' : 'Focus Mode'}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {focusMode ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {nodes
                .filter(node => node.id !== 'Performance')
                .map(node => (
                  <button
                    key={node.id}
                    onClick={() => setFocusedNodeId(node.id)}
                    className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest border transition-colors ${
                      focusedNodeId === node.id
                        ? 'border-wabi-clay/50 text-wabi-clay bg-wabi-clay/10'
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-primary)]'
                    }`}
                  >
                    {formatNodeName(node.id)}
                  </button>
                ))}
            </div>

            {focusedNodeId && (
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                {nodes
                  .filter(node => node.id === focusedNodeId)
                  .map(node => {
                    const change = node.simulatedValue - node.currentValue;
                    const hasChanged = Math.abs(change) > 0.1;

                    return (
                      <div key={node.id}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-mono text-sm">{formatNodeName(node.id)}</label>
                          <div className="flex items-center gap-3">
                            {showComparison && (
                              <span className="text-xs text-[var(--text-tertiary)]">
                                <span className="opacity-60">{node.currentValue.toFixed(1)}</span>
                                {' → '}
                                <span className={hasChanged ? 'text-wabi-clay font-semibold' : ''}>
                                  {node.simulatedValue.toFixed(1)}
                                </span>
                              </span>
                            )}
                            <span className="font-mono text-lg min-w-[3rem] text-right">
                              {node.simulatedValue.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max={maxValue}
                          step={step}
                          value={node.simulatedValue}
                          onChange={(e) => handleNodeChange(node.id, parseFloat(e.target.value))}
                          className={`w-full ${hasChanged ? 'accent-wabi-clay' : 'accent-[var(--text-tertiary)]'}`}
                        />

                        {hasChanged && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <TrendingUp
                              className={`w-3 h-3 ${
                                change > 0 ? 'text-wabi-moss' : 'text-wabi-rust rotate-180'
                              }`}
                            />
                            <span
                              className={change > 0 ? 'text-wabi-moss' : 'text-wabi-rust'}
                            >
                              {change > 0 ? '+' : ''}
                              {change.toFixed(1)} change
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const focusable = nodes.filter(node => node.id !== 'Performance');
                  const index = focusable.findIndex(node => node.id === focusedNodeId);
                  const prev = focusable[(index - 1 + focusable.length) % focusable.length];
                  if (prev) setFocusedNodeId(prev.id);
                }}
                className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs flex items-center gap-1 hover:bg-[var(--bg-secondary)]"
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </button>
              <button
                onClick={() => {
                  const focusable = nodes.filter(node => node.id !== 'Performance');
                  const index = focusable.findIndex(node => node.id === focusedNodeId);
                  const next = focusable[(index + 1) % focusable.length];
                  if (next) setFocusedNodeId(next.id);
                }}
                className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs flex items-center gap-1 hover:bg-[var(--bg-secondary)]"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          nodes
            .filter(node => node.id !== 'Performance') // Don't allow direct performance manipulation
            .map(node => {
              const change = node.simulatedValue - node.currentValue;
              const hasChanged = Math.abs(change) > 0.1;

              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-lg border transition-all ${
                    hasChanged
                      ? 'bg-wabi-clay/5 border-wabi-clay/30'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-sm">{formatNodeName(node.id)}</label>
                    <div className="flex items-center gap-3">
                      {showComparison && (
                        <span className="text-xs text-[var(--text-tertiary)]">
                          <span className="opacity-60">{node.currentValue.toFixed(1)}</span>
                          {' → '}
                          <span className={hasChanged ? 'text-wabi-clay font-semibold' : ''}>
                            {node.simulatedValue.toFixed(1)}
                          </span>
                        </span>
                      )}
                      <span className="font-mono text-lg min-w-[3rem] text-right">
                        {node.simulatedValue.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <input
                          type="range"
                          min="0"
                          max={maxValue}
                          step={step}
                    value={node.simulatedValue}
                    onChange={(e) => handleNodeChange(node.id, parseFloat(e.target.value))}
                    className={`w-full ${hasChanged ? 'accent-wabi-clay' : 'accent-[var(--text-tertiary)]'}`}
                  />

                  {hasChanged && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <TrendingUp
                        className={`w-3 h-3 ${
                          change > 0 ? 'text-wabi-moss' : 'text-wabi-rust rotate-180'
                        }`}
                      />
                      <span
                        className={change > 0 ? 'text-wabi-moss' : 'text-wabi-rust'}
                      >
                        {change > 0 ? '+' : ''}
                        {change.toFixed(1)} change
                      </span>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Performance Prediction */}
      {showComparison && (
        <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] relative overflow-hidden">
          <div className="absolute inset-0 edu-confetti opacity-60 pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-wabi-clay mb-1">
                Predicted shift
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Based on your causal graph structure
              </p>
            </div>
            <div className="text-right">
              <div
                className={`font-mono text-3xl ${
                  expectedPerformanceChange() > 0
                    ? 'text-wabi-moss'
                    : expectedPerformanceChange() < 0
                    ? 'text-wabi-rust'
                    : 'text-[var(--text-tertiary)]'
                }`}
              >
                {expectedPerformanceChange() > 0 ? '+' : ''}
                {expectedPerformanceChange().toFixed(1)}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">points</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Quiet affirmation: small shifts can ripple farther than they seem.
          </p>
        </div>
      )}

      {/* Commit Button */}
      {showComparison && onCommitGoal && (
        <button
          onClick={handleCommitAsGoal}
          className="w-full p-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 hover:opacity-90"
        >
          <Target className="w-4 h-4" />
          Save as This Week's Focus
        </button>
      )}

      {/* Info */}
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-start gap-2">
        <Info className="w-4 h-4 text-wabi-ink-light flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)]">
          <p>
            <span className="text-wabi-ink-light font-semibold">How it works:</span> Changes
            propagate downstream based on edge strengths. Stronger connections create larger
            shifts, so downstream sliders update automatically.
          </p>
        </div>
      </div>

      {/* Simulation Loading */}
      {isSimulating && (
        <div className="flex items-center justify-center gap-2 text-wabi-clay text-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="font-mono">Tracing changes...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Propagate effects through the causal graph
 * Uses simple linear propagation: effect = change * edge_strength
 */
function propagateEffects(
  nodes: NodeState[],
  changedNodeId: string,
  changedNodeValue: number,
  edges: CausalEdge[],
  maxValue: number
): NodeState[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const clampedValue = Math.max(0, Math.min(maxValue, changedNodeValue));
  const currentValues = new Map(nodes.map((node) => [node.id, node.currentValue]));
  const deltaByNode = new Map<string, number>();

  deltaByNode.set(changedNodeId, clampedValue - (currentValues.get(changedNodeId) ?? clampedValue));

  const topologicalOrder = buildTopologicalOrder([...nodeIds], edges);

  for (const nodeId of topologicalOrder) {
    const sourceDelta = deltaByNode.get(nodeId) ?? 0;
    if (Math.abs(sourceDelta) < 0.00001) continue;

    for (const edge of edges) {
      if (edge.from !== nodeId) continue;
      if (!nodeIds.has(edge.to)) continue;

      const strength = normalizeEdgeStrength(edge.strength);
      if (strength === 0) continue;

      const nextDelta = (deltaByNode.get(edge.to) ?? 0) + (sourceDelta * strength);
      deltaByNode.set(edge.to, nextDelta);
    }
  }

  return nodes.map((node) => {
    const nextValue = node.currentValue + (deltaByNode.get(node.id) ?? 0);
    return {
      ...node,
      simulatedValue: Math.max(0, Math.min(maxValue, nextValue))
    };
  });
}

function normalizeEdgeStrength(rawStrength: number): number {
  if (!Number.isFinite(rawStrength)) return 0;

  const sign = rawStrength < 0 ? -1 : 1;
  const absolute = Math.abs(rawStrength);

  let normalized = absolute;
  if (absolute > 1 && absolute <= 10) normalized = absolute / 10;
  if (absolute > 10) normalized = absolute / 100;

  return Math.max(-1, Math.min(1, normalized * sign));
}

function buildTopologicalOrder(nodeIds: string[], edges: CausalEdge[]): string[] {
  const inDegree = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!inDegree.has(edge.from) || !inDegree.has(edge.to)) continue;
    adjacency.get(edge.from)?.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const ordered: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const nextDegree = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, nextDegree);
      if (nextDegree === 0) queue.push(next);
    }
  }

  // Fallback for cyclic graphs: keep remaining nodes in stable order.
  if (ordered.length !== nodeIds.length) {
    for (const id of nodeIds) {
      if (!ordered.includes(id)) ordered.push(id);
    }
  }

  return ordered;
}
