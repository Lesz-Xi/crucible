"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface GraphNodeLike {
  id?: string;
  name?: string;
  label?: string;
}

interface GraphEdgeLike {
  from?: string;
  to?: string;
  source?: string;
  target?: string;
}

interface AlignmentDagGraph {
  nodes?: GraphNodeLike[];
  edges?: GraphEdgeLike[];
}

interface AlignmentDagViewProps {
  graph: AlignmentDagGraph | null;
  biasSensitivePaths: string[][];
  className?: string;
}

function nodeKey(node: GraphNodeLike): string {
  return String(node.name || node.id || node.label || "");
}

function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

export function AlignmentDagView({ graph, biasSensitivePaths, className }: AlignmentDagViewProps) {
  const { nodes, edges } = useMemo(() => {
    if (!graph?.nodes || !graph?.edges) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const highlightedNodes = new Set<string>();
    const highlightedEdges = new Set<string>();

    for (const path of biasSensitivePaths || []) {
      for (let i = 0; i < path.length; i += 1) {
        highlightedNodes.add(path[i]);
        if (i < path.length - 1) {
          highlightedEdges.add(edgeKey(path[i], path[i + 1]));
        }
      }
    }

    const flowNodes: Node[] = graph.nodes
      .map((rawNode, index) => {
        const key = nodeKey(rawNode);
        if (!key) return null;

        const col = index % 4;
        const row = Math.floor(index / 4);
        const isHighlighted = highlightedNodes.has(key);

        return {
          id: key,
          position: { x: col * 220, y: row * 140 },
          data: { label: key },
          style: {
            borderRadius: 12,
            border: isHighlighted ? "2px solid #c2410c" : "1px solid #a8a29e",
            background: isHighlighted ? "#fff7ed" : "#ffffff",
            color: "#292524",
            fontSize: 12,
            padding: 8,
            minWidth: 120,
            textAlign: "center",
          },
        } as Node;
      })
      .filter(Boolean) as Node[];

    const flowEdges: Edge[] = graph.edges
      .map((rawEdge, index) => {
        const from = String(rawEdge.from || rawEdge.source || "");
        const to = String(rawEdge.to || rawEdge.target || "");
        if (!from || !to) return null;

        const isHighlighted = highlightedEdges.has(edgeKey(from, to));
        return {
          id: `${from}-${to}-${index}`,
          source: from,
          target: to,
          animated: isHighlighted,
          style: {
            stroke: isHighlighted ? "#c2410c" : "#78716c",
            strokeWidth: isHighlighted ? 2.5 : 1.4,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? "#c2410c" : "#78716c",
          },
        } as Edge;
      })
      .filter(Boolean) as Edge[];

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph, biasSensitivePaths]);

  if (!graph) {
    return (
      <section className={`rounded-2xl border border-wabi-stone/20 bg-white/60 p-5 ${className || ""}`}>
        <h3 className="text-sm font-semibold text-wabi-sumi">Alignment DAG</h3>
        <p className="mt-2 text-sm text-wabi-stone">No causal graph available yet.</p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-wabi-stone/20 bg-white/70 p-5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-wabi-sumi">Alignment DAG</h3>
        <div className="text-xs text-wabi-stone">Bias-sensitive paths highlighted</div>
      </div>

      <div className="mt-4 h-[420px] rounded-xl border border-wabi-stone/20 bg-white">
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
          <Background gap={20} size={1} color="rgba(168,162,158,0.3)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  );
}

export default AlignmentDagView;
