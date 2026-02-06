"use client";

import { useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position, 
  MarkerType,
  Node,
  Edge,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ConsciousnessState } from '@/types';

interface CausalGraphProps {
  history: { mode: string; score: number; timestamp: string }[];
  currentMode: string;
}

// Custom Node for Mode State
const ModeNode: React.FC<{ data: { label: string; score?: number; active?: boolean } }> = ({ data }) => {
  return (
    <div className={`px-4 py-2 rounded-xl border-2 transition-all min-w-[120px] text-center ${
      data.active 
        ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]' 
        : 'border-white/10 bg-[#0A0A0A]'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-neutral-600" />
      <div className={`text-xs font-mono font-bold uppercase mb-1 ${
        data.active ? 'text-orange-400' : 'text-neutral-500'
      }`}>
        {data.label}
      </div>
      {data.score !== undefined && (
        <div className={`text-lg font-bold ${
          data.score > 70 ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {data.score}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-600" />
    </div>
  );
};

const nodeTypes = {
  modeNode: ModeNode,
};

export function CausalGraph({ history, currentMode }: CausalGraphProps) {
  // Transform history into graph nodes/edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Limits to recent history for readability
    const recentHistory = history.slice(-5);
    
    recentHistory.forEach((entry, i) => {
      // Node for each history step
      nodes.push({
        id: `node-${i}`,
        type: 'modeNode',
        position: { x: i * 200, y: 100 + (Math.sin(i) * 50) }, // Simple layout
        data: { 
          label: entry.mode, 
          score: entry.score,
          active: false 
        }
      });
      
      // Connect sequential nodes
      if (i > 0) {
        edges.push({
          id: `edge-${i-1}-${i}`,
          source: `node-${i-1}`,
          target: `node-${i}`,
          animated: true,
          style: { stroke: '#525252' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#525252' },
          label: 't+1',
          labelStyle: { fill: '#737373', fontSize: 10 }
        });
      }
    });

    // Add Current State Node (The "Now")
    const lastIdx = recentHistory.length;
    nodes.push({
      id: 'node-current',
      type: 'modeNode',
      position: { x: lastIdx * 200, y: 100 },
      data: { 
        label: currentMode,
        active: true,
        score: undefined // Not scored yet
      }
    });

    if (lastIdx > 0) {
       edges.push({
          id: `edge-last-current`,
          source: `node-${lastIdx - 1}`,
          target: 'node-current',
          animated: true,
          style: { stroke: '#f97316', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
          label: 'CAUSAL FLOW',
          labelStyle: { fill: '#f97316', fontWeight: 700, fontSize: 10 }
       });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [history, currentMode]);

  return (
    <div className="w-full h-[300px] rounded-xl border border-white/10 bg-black/20 overflow-hidden relative">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#333" />
        <Controls className="!bg-[#111] !border-white/10 !fill-white" />
      </ReactFlow>
      
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Real-time Causal Graph (DAG)
        </h3>
        <p className="text-[10px] text-neutral-500">Pearl&apos;s Causal Hierarchy: Mode → Outcome</p>
      </div>
    </div>
  );
}
