// CausalDAG — directed acyclic graph for the MASA hero section
// Server Component: no hooks, no browser APIs — pure SVG + CSS animation.
// Animation uses the pathLength="1" trick so stroke-dashoffset works on
// any line length without needing JS to measure the path at runtime.
//
// Layout (viewBox 480 × 370):
//
//              Z (Confounder)
//             ↙               ↘
//   X (Exposure) → M (Mediator) → Y (Outcome)
//    ╰──────────── do(X=x) ────────────────╯  ← dashed amber

export function CausalDAG() {
  return (
    <div className="flex items-center justify-center w-full h-full py-20 px-10">
      <svg
        viewBox="0 0 480 370"
        style={{ width: "100%", maxWidth: "440px", overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          {/* Arrowhead — stone (regular edges) */}
          <marker
            id="dag-arr"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="4.5"
            markerHeight="4.5"
            orient="auto"
          >
            <path d="M0 1.5 L7 4 L0 6.5z" fill="#c4bfba" />
          </marker>

          {/* Arrowhead — amber (total effect edge) */}
          <marker
            id="dag-arr-amber"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="4.5"
            markerHeight="4.5"
            orient="auto"
          >
            <path d="M0 1.5 L7 4 L0 6.5z" fill="#a67c52" />
          </marker>
        </defs>

        {/* ── Edges ─────────────────────────────────────────────── */}

        {/* Z → X */}
        <line
          pathLength="1"
          className="dag-edge"
          x1="224" y1="96" x2="97" y2="214"
          stroke="#d6d3d1" strokeWidth="1.5"
          markerEnd="url(#dag-arr)"
          style={{ animationDelay: "0.25s" }}
        />

        {/* Z → Y */}
        <line
          pathLength="1"
          className="dag-edge"
          x1="256" y1="96" x2="383" y2="214"
          stroke="#d6d3d1" strokeWidth="1.5"
          markerEnd="url(#dag-arr)"
          style={{ animationDelay: "0.35s" }}
        />

        {/* X → M */}
        <line
          pathLength="1"
          className="dag-edge"
          x1="103" y1="230" x2="217" y2="230"
          stroke="#d6d3d1" strokeWidth="1.5"
          markerEnd="url(#dag-arr)"
          style={{ animationDelay: "0.5s" }}
        />

        {/* M → Y */}
        <line
          pathLength="1"
          className="dag-edge"
          x1="263" y1="230" x2="377" y2="230"
          stroke="#d6d3d1" strokeWidth="1.5"
          markerEnd="url(#dag-arr)"
          style={{ animationDelay: "0.6s" }}
        />

        {/* X → Y  total causal effect — dashed amber, curved below */}
        <path
          className="dag-fade"
          d="M 80 253 Q 240 338 400 253"
          fill="none"
          stroke="#a67c52"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#dag-arr-amber)"
          style={{ animationDelay: "0.75s" }}
        />

        {/* ── Nodes ─────────────────────────────────────────────── */}

        {/* Z — Confounder (top center) */}
        <g className="dag-fade" style={{ animationDelay: "0.05s" }}>
          <circle cx="240" cy="80" r="22" fill="white" stroke="#e7e5e4" strokeWidth="1" />
          <text
            x="240" y="85"
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-lora), Georgia, serif"
            fontStyle="italic"
            fill="#292524"
          >Z</text>
          <text
            x="240" y="119"
            textAnchor="middle"
            className="dag-label"
            fill="#a8a29e"
          >CONFOUNDER</text>
        </g>

        {/* X — Exposure (left) */}
        <g className="dag-fade" style={{ animationDelay: "0.1s" }}>
          <circle cx="80" cy="230" r="22" fill="white" stroke="#e7e5e4" strokeWidth="1" />
          <text
            x="80" y="235"
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-lora), Georgia, serif"
            fontStyle="italic"
            fill="#292524"
          >X</text>
          <text
            x="80" y="269"
            textAnchor="middle"
            className="dag-label"
            fill="#a8a29e"
          >EXPOSURE</text>
        </g>

        {/* M — Mediator (center) */}
        <g className="dag-fade" style={{ animationDelay: "0.13s" }}>
          <circle cx="240" cy="230" r="22" fill="white" stroke="#e7e5e4" strokeWidth="1" />
          <text
            x="240" y="235"
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-lora), Georgia, serif"
            fontStyle="italic"
            fill="#292524"
          >M</text>
          <text
            x="240" y="269"
            textAnchor="middle"
            className="dag-label"
            fill="#a8a29e"
          >MEDIATOR</text>
        </g>

        {/* Y — Outcome (right, amber accent) */}
        <g className="dag-fade" style={{ animationDelay: "0.16s" }}>
          <circle cx="400" cy="230" r="22" fill="white" stroke="#a67c52" strokeWidth="1.5" />
          <text
            x="400" y="235"
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-lora), Georgia, serif"
            fontStyle="italic"
            fill="#a67c52"
          >Y</text>
          <text
            x="400" y="269"
            textAnchor="middle"
            className="dag-label"
            fill="#a67c52"
          >OUTCOME</text>
        </g>

        {/* do(X=x) — Pearl do-calculus label on amber path */}
        <text
          className="dag-fade dag-label"
          x="240" y="362"
          textAnchor="middle"
          fill="#a67c52"
          style={{ animationDelay: "0.9s" }}
        >do(X=x)</text>

      </svg>
    </div>
  );
}
