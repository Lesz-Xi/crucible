/**
 * Causal Graph Explorer Component
 * 
 * Interactive visualization of the causal graph with:
 * - Clickable nodes showing details
 * - Visual representation of causal strengths
 * - Highlighting of bottleneck and leverage points
 */

'use client';

import React, { useState } from 'react';
import { AlertTriangle, Target, Info } from 'lucide-react';
import { formatNodeName, getNodeDescription, getNodeResearch } from '@/lib/utils/text-formatting';
import { ResearchTooltip } from './ResearchTooltip';

interface CausalNode {
  id: string;
  value: number;
  parents?: string[];
}

interface CausalEdge {
  from: string;
  to: string;
  strength: number;
}

interface CausalGraphExplorerProps {
  nodes: CausalNode[];
  edges: CausalEdge[];
  bottleneck?: string;
  leveragePoint?: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export function CausalGraphExplorer({
  nodes,
  edges,
  bottleneck,
  leveragePoint,
  onNodeClick,
  className = ''
}: CausalGraphExplorerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    onNodeClick?.(nodeId);
  };

  // Get node styling based on type
  const getNodeStyle = (nodeId: string) => {
    if (nodeId === bottleneck) {
      return 'bg-wabi-rust/15 text-wabi-rust border-wabi-rust/50 ring-2 ring-wabi-rust/30';
    }
    if (nodeId === leveragePoint) {
      return 'bg-wabi-moss/15 text-wabi-moss border-wabi-moss/50 ring-2 ring-wabi-moss/30';
    }
    if (selectedNode === nodeId) {
      return 'bg-wabi-clay/15 text-wabi-clay border-wabi-clay/50 ring-2 ring-wabi-clay/30';
    }
    return 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-tertiary)]';
  };

  // Get edge styling based on strength
  const getEdgeStyle = (edge: CausalEdge) => {
    const strength = edge.strength;
    if (strength > 0.7) return 'stroke-wabi-moss/70 stroke-[3]';
    if (strength > 0.4) return 'stroke-[var(--text-tertiary)] stroke-[2]';
    return 'stroke-[var(--text-tertiary)]/40 stroke-[1]';
  };

  // Simple layout for demo - can be replaced with force-directed layout
  const nodePositions: Record<string, { x: number; y: number }> = {
    FamilySupport: { x: 100, y: 150 },
    SleepQuality: { x: 100, y: 250 },
    Motivation: { x: 250, y: 150 },
    StudyHabits: { x: 400, y: 150 },
    PracticeQuality: { x: 550, y: 150 },
    Performance: { x: 700, y: 150 }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Graph Container */}
      <div className="relative w-full h-96 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        {/* SVG for edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="currentColor"
                className="text-[var(--text-tertiary)]"
              />
            </marker>
          </defs>
          
          {/* Draw edges */}
          {edges.map((edge, i) => {
            const from = nodePositions[edge.from];
            const to = nodePositions[edge.to];
            if (!from || !to) return null;

            const edgeKey = `${edge.from}-${edge.to}`;
            const isHovered = hoveredEdge === edgeKey;

            return (
              <g key={i}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={`transition-all ${getEdgeStyle(edge)} ${
                    isHovered ? 'opacity-100' : 'opacity-50'
                  }`}
                  markerEnd="url(#arrowhead)"
                />
                {/* Strength label */}
                {isHovered && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 10}
                    className="text-xs fill-[var(--text-tertiary)]"
                    textAnchor="middle"
                  >
                    {(edge.strength * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const isBottleneck = node.id === bottleneck;
          const isLeveragePoint = node.id === leveragePoint;

          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.x, top: pos.y }}
            >
              <ResearchTooltip
                title={formatNodeName(node.id)}
                description={getNodeDescription(node.id)}
                research={getNodeResearch(node.id)}
              >
                <button
                  onClick={() => handleNodeClick(node.id)}
                  className={`relative px-4 py-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${getNodeStyle(
                    node.id
                  )}`}
                  onMouseEnter={() => {
                    // Highlight incoming and outgoing edges
                    const connectedEdges = edges
                      .filter(e => e.from === node.id || e.to === node.id)
                      .map(e => `${e.from}-${e.to}`);
                    if (connectedEdges.length > 0) {
                      setHoveredEdge(connectedEdges[0]);
                    }
                  }}
                  onMouseLeave={() => setHoveredEdge(null)}
                >
                  <div className="flex items-center gap-2">
                    {isBottleneck && <AlertTriangle className="w-4 h-4" />}
                    {isLeveragePoint && <Target className="w-4 h-4" />}
                    <span className="font-mono text-sm whitespace-nowrap">
                      {formatNodeName(node.id)}
                    </span>
                  </div>
                  
                  {/* Value indicator */}
                  <div className="mt-1 text-xs opacity-70">
                    {node.value.toFixed(1)}
                  </div>
                </button>
              </ResearchTooltip>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-wabi-rust/20 border-2 border-wabi-rust/50" />
          <span className="text-[var(--text-secondary)]">Bottleneck</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-wabi-moss/20 border-2 border-wabi-moss/50" />
          <span className="text-[var(--text-secondary)]">Leverage Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-wabi-moss/70" />
          <span className="text-[var(--text-secondary)]">Strong Effect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[var(--text-tertiary)]/40" />
          <span className="text-[var(--text-secondary)]">Weak Effect</span>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-serif text-lg">{formatNodeName(selectedNode)}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {getNodeDescription(selectedNode)}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              ×
            </button>
          </div>

          {/* Show incoming effects */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              Causal Influences
            </div>
            {edges
              .filter(e => e.to === selectedNode)
              .map((edge, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--text-secondary)]">
                    {formatNodeName(edge.from)} →
                  </span>
                  <span className="font-mono text-wabi-moss">
                    {(edge.strength * 100).toFixed(0)}% effect
                  </span>
                </div>
              ))}
            {edges.filter(e => e.to === selectedNode).length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)] italic">
                No direct incoming influences
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-start gap-2">
        <Info className="w-4 h-4 text-wabi-ink-light flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)]">
          Click nodes to see detailed causal influences. Hover over edges to see effect strengths.
        </p>
      </div>
    </div>
  );
}
