"use client";

import { motion } from "framer-motion";

// ─── Layout ────────────────────────────────────────────────────────────────────
const R = 26; // node circle radius
const VW = 540;
const VH = 390;
const NODE_FILL = "#1f1a16";
const NODE_SHADOW = "rgba(0,0,0,0.22)";

// Five SCM nodes — all in the Pearl SCM formalism
const NODES = [
  { id: "W",   x: 268, y: 52,  label: "W",     sub: "Confounder",   stroke: "#8b735f", textSize: 15, latent: true  },
  { id: "X",   x: 82,  y: 204, label: "X",     sub: "Treatment",    stroke: "#c48854", textSize: 15, latent: false },
  { id: "Z",   x: 268, y: 204, label: "Z",     sub: "Mediator",     stroke: "#c48854", textSize: 15, latent: false },
  { id: "Y",   x: 455, y: 178, label: "Y",     sub: "Outcome",      stroke: "#e0a36c", textSize: 15, latent: false },
  { id: "DOX", x: 68,  y: 330, label: "do(·)", sub: "Intervention", stroke: "#7d9c80", textSize: 10, latent: false },
];

const nm = Object.fromEntries(NODES.map((n) => [n.id, n]));

// Compute a straight path between two node centres, trimmed by radius
function straight(aId: string, bId: string) {
  const a = nm[aId], b = nm[bId];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const x1 = a.x + ux * (R + 3), y1 = a.y + uy * (R + 3);
  const x2 = b.x - ux * (R + 10), y2 = b.y - uy * (R + 10);
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

// Edge definitions — paths, colors, animation timing
const EDGES = [
  {
    id: "WX",
    path: `M ${nm.W.x - 10} ${nm.W.y + R + 3} C ${nm.W.x - 95} ${(nm.W.y + nm.X.y) / 2} ${nm.X.x + 50} ${nm.X.y - 70} ${nm.X.x + R + 3} ${nm.X.y - 10}`,
    stroke: "#8b735f",
    marker: "arrow-confound",
    dashed: false,
    pulse: "#b49579",
    entranceDelay: 0.2,
    pulseDelay: "0s",
    pulseDur: 2.6,
  },
  {
    id: "WY",
    path: `M ${nm.W.x + 13} ${nm.W.y + R + 3} C ${nm.W.x + 85} ${(nm.W.y + nm.Y.y) / 2 - 25} ${nm.Y.x - 55} ${nm.Y.y - 65} ${nm.Y.x} ${nm.Y.y - R - 3}`,
    stroke: "#8b735f",
    marker: "arrow-confound",
    dashed: false,
    pulse: "#b49579",
    entranceDelay: 0.32,
    pulseDelay: "1.3s",
    pulseDur: 2.6,
  },
  {
    id: "XZ",
    path: straight("X", "Z"),
    stroke: "#c48854",
    marker: "arrow-causal",
    dashed: false,
    pulse: "#e0a36c",
    entranceDelay: 0.5,
    pulseDelay: "0.4s",
    pulseDur: 1.7,
  },
  {
    id: "ZY",
    path: straight("Z", "Y"),
    stroke: "#c48854",
    marker: "arrow-causal",
    dashed: false,
    pulse: "#e0a36c",
    entranceDelay: 0.65,
    pulseDelay: "0.75s",
    pulseDur: 1.7,
  },
  {
    id: "XY",
    // Direct arc above — bypassing Z (direct effect)
    path: `M ${nm.X.x + 14} ${nm.X.y - R - 3} Q ${(nm.X.x + nm.Y.x) / 2} ${nm.X.y - 96} ${nm.Y.x - R - 3} ${nm.Y.y - 12}`,
    stroke: "#e0a36c",
    marker: "arrow-direct",
    dashed: false,
    pulse: "#e0a36c",
    entranceDelay: 0.78,
    pulseDelay: "1.6s",
    pulseDur: 2.1,
  },
  {
    id: "DOXX",
    path: `M ${nm.DOX.x + 14} ${nm.DOX.y - R - 3} L ${nm.X.x} ${nm.X.y + R + 3}`,
    stroke: "#7d9c80",
    marker: "arrow-intervene",
    dashed: true,
    pulse: "#9eb59f",
    entranceDelay: 0.95,
    pulseDelay: "2.6s",
    pulseDur: 1.5,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export function CausalDAGPanel({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-5">
      {/* Top-right label */}
      <div className="absolute right-5 top-4 text-right">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent-rust)] opacity-75">
          Pearl's SCM
        </p>
        <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Structural Causal Model
        </p>
      </div>

      {/* Main SVG */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="h-full w-full"
        style={{ maxHeight: 360, overflow: "visible" }}
        aria-label="Structural Causal Model diagram"
      >
        <defs>
          {/* Arrow markers for each edge type */}
          {(
            [
              ["arrow-causal",    "#c48854"],
              ["arrow-confound",  "#8b735f"],
              ["arrow-direct",    "#e0a36c"],
              ["arrow-intervene", "#7d9c80"],
            ] as [string, string][]
          ).map(([id, fill]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={fill} />
            </marker>
          ))}

          {/* Paths in defs for animateMotion mpath references */}
          {EDGES.map((e) => (
            <path key={`def-${e.id}`} id={`dag-path-${e.id}`} d={e.path} />
          ))}
        </defs>

        {/* ── Edges ── */}
        {EDGES.map((e) => (
          <motion.path
            key={e.id}
            d={e.path}
            fill="none"
            stroke={e.stroke}
            strokeWidth={1.6}
            strokeDasharray={e.dashed ? "5 3" : undefined}
            markerEnd={`url(#${e.marker})`}
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: e.entranceDelay, duration: 0.55, ease: "easeOut" }}
          />
        ))}

        {/* ── Pulse dots — travel along each edge ── */}
        {EDGES.map((e) => (
          <motion.circle
            key={`pulse-${e.id}`}
            r={3.8}
            fill={e.pulse}
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 0.9 } : { opacity: 0 }}
            transition={{ delay: e.entranceDelay + 0.3, duration: 0.4 }}
          >
            <animateMotion
              dur={`${e.pulseDur}s`}
              begin={e.pulseDelay}
              repeatCount="indefinite"
              calcMode="linear"
            >
              <mpath href={`#dag-path-${e.id}`} />
            </animateMotion>
          </motion.circle>
        ))}

        {/* ── Nodes ── */}
        {NODES.map((n, i) => (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            transition={{
              delay: 0.05 + i * 0.1,
              duration: 0.4,
              ease: [0.175, 0.885, 0.32, 1.275],
            }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            {/* Drop shadow */}
            <circle cx={n.x + 1} cy={n.y + 2} r={R} fill={NODE_SHADOW} />
            {/* Fill */}
            <circle
              cx={n.x} cy={n.y} r={R}
              fill={NODE_FILL}
              stroke={n.stroke}
              strokeWidth={1.6}
              strokeDasharray={n.latent ? "4 2.5" : undefined}
            />
            {/* Label */}
            <text
              x={n.x}
              y={n.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: n.textSize,
                fontFamily: "var(--font-crimson), 'Crimson Pro', Georgia, serif",
                fontWeight: 600,
                fill: n.stroke,
                letterSpacing: "0.01em",
              }}
            >
              {n.label}
            </text>
            {/* Sub-label */}
            <text
              x={n.x}
              y={n.y + R + 15}
              textAnchor="middle"
              style={{
                fontSize: 8,
                fontFamily: "var(--font-geist-mono), monospace",
                fill: "var(--text-muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {n.sub}
            </text>
          </motion.g>
        ))}

        {/* ── Edge labels ── */}
        {/* "direct" label — placed LEFT of arc midpoint, well clear of W's sub-label */}
        <motion.text
          x={nm.X.x + 52}
          y={nm.X.y - 68}
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          style={{
            fontSize: 8,
            fontFamily: "var(--font-geist-mono), monospace",
            fill: "#e0a36c",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Direct effect
        </motion.text>

        {/* "P(Y|do(x))" label near intervention edge */}
        <motion.text
          x={nm.DOX.x + 28}
          y={(nm.DOX.y + nm.X.y) / 2 + 2}
          textAnchor="start"
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 0.85 } : { opacity: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          style={{
            fontSize: 8,
            fontFamily: "var(--font-geist-mono), monospace",
            fill: "#7d9c80",
            letterSpacing: "0.1em",
          }}
        >
          P(Y|do(x))
        </motion.text>
      </svg>

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-5 flex items-center gap-5">
        {[
          { color: "#c48854", label: "Causal" },
          { color: "#8b735f", label: "Confound" },
          { color: "#7d9c80", label: "Intervene", dashed: true },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <svg width="18" height="8" style={{ overflow: "visible" }}>
              <line
                x1="0" y1="4" x2="18" y2="4"
                stroke={l.color}
                strokeWidth={1.5}
                strokeDasharray={l.dashed ? "4 2" : undefined}
              />
            </svg>
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
