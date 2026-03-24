"use client";

import { useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge,
  MarkerType,
  MiniMap,
  Node,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play } from 'lucide-react';

// Custom Node Styling (Tailwind classes for glassmorphism)
const NODE_STYLES = {
  S: "border-cyan-500 bg-cyan-950/40 text-cyan-100", // Sequence
  C: "border-purple-500 bg-purple-950/40 text-purple-100", // Conformation
  Y: "border-emerald-500 bg-emerald-950/40 text-emerald-100", // Function
  E: "border-amber-500 bg-amber-950/40 text-amber-100" // Environment
};

const INITIAL_NODES: Node[] = [
  { 
    id: 'S', 
    position: { x: 100, y: 100 }, 
    data: { label: 'Sequence (S)' },
    type: 'input',
    className: `${NODE_STYLES.S} border-2 rounded-xl p-3 min-w-[150px] shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]`
  },
  { 
    id: 'Y', 
    position: { x: 500, y: 100 }, 
    data: { label: 'Function (Y)' },
    type: 'output',
    className: `${NODE_STYLES.Y} border-2 rounded-xl p-3 min-w-[150px] shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]`
  }
];

interface HypothesisBuilderProps {
  onSimulate: (thesis: string, mechanism: string) => void;
}

function HypothesisBuilderContent({ onSimulate }: HypothesisBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { getNodes, getEdges } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
    }, eds)),
    [setEdges],
  );

  const addNode = (type: 'S' | 'C' | 'Y' | 'E') => {
    const id = `${type}-${Date.now()}`;
    const labels = { S: 'Sequence', C: 'Structure', Y: 'Function', E: 'Environment' };
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      data: { label: `${labels[type]} (${type})` },
      className: `${NODE_STYLES[type]} border-2 rounded-xl p-3 min-w-[150px] backdrop-blur-md`
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSimulate = () => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    if (currentEdges.length === 0) {
      alert("Connect nodes to define a mechanism.");
      return;
    }

    // Convert Graph to Textual Thesis & Mechanism
    const thesis = `Hypothesis: The interaction of ${currentNodes.length} bio-entities constitutes a causal system.`;
    
    const mechanism = currentEdges.map(edge => {
      const sourceNode = currentNodes.find(n => n.id === edge.source);
      const targetNode = currentNodes.find(n => n.id === edge.target);
      return `${sourceNode?.data.label} -> influences -> ${targetNode?.data.label}`;
    }).join('\n');

    onSimulate(thesis, mechanism);
  };

  return (
    <div className="w-full h-full relative group p-1">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={() => addNode('S')} className="lab-nav-pill cursor-pointer border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10">+ Seq</button>
        <button onClick={() => addNode('C')} className="lab-nav-pill cursor-pointer border-purple-500/30 text-purple-600 hover:bg-purple-500/10">+ Struct</button>
        <button onClick={() => addNode('E')} className="lab-nav-pill cursor-pointer border-amber-500/30 text-amber-600 hover:bg-amber-500/10">+ Env</button>
        <button onClick={() => addNode('Y')} className="lab-nav-pill cursor-pointer border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">+ Func</button>
      </div>

      <div className="absolute bottom-6 right-6 z-10">
        <button 
          onClick={handleSimulate}
          className="lab-button-primary cursor-pointer"
        >
          <Play className="w-4 h-4" />
          Simulate Hypothesis
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="lab-panel rounded-xl overflow-hidden"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="rgba(150, 150, 150, 0.2)" />
        <Controls className="!bg-white/80 !border-white/20 !fill-stone-600 !backdrop-blur" />
        <MiniMap 
            className="!bg-white/50 !border-white/20 !backdrop-blur" 
            nodeColor={(n) => {
                if (n.id.startsWith('S')) return '#06b6d4';
                if (n.id.startsWith('C')) return '#a855f7';
                if (n.id.startsWith('Y')) return '#10b981';
                return '#f59e0b';
            }}
        />
      </ReactFlow>
    </div>
  );
}

export default function HypothesisBuilder(props: HypothesisBuilderProps) {
  return (
    <ReactFlowProvider>
      <HypothesisBuilderContent {...props} />
    </ReactFlowProvider>
  );
}
