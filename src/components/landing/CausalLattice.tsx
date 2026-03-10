"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const modules = [
  {
    key: "01",
    label: "Causal Discovery",
    type: "Inference Engine",
    description: "Infers directional cause-effect relationships from observational data using disciplined graph search.",
    specs: "Nodes: 14k // Depth: 12",
    layer: "Layer 01",
    graphLabel: "Discovery",
    note: "Observational inference",
    point: { x: 110, y: 92 },
  },
  {
    key: "02",
    label: "Temporal Dynamics",
    type: "Time Series",
    description: "Models time-lagged effects to distinguish instantaneous correlation from true causation.",
    specs: "Lag order: t-4 // Resolution: High",
    layer: "Layer 02",
    graphLabel: "Temporal",
    note: "Intervention bridge",
    point: { x: 278, y: 58 },
  },
  {
    key: "03",
    label: "Counterfactual Engine",
    type: "Simulation Core",
    description: "Simulates what-if scenarios by detaching parents and injecting explicit interventions.",
    specs: "Do-calculus: Active // Branches: ∞",
    layer: "Layer 03",
    graphLabel: "Counterfactual",
    note: "Scenario expansion",
    point: { x: 170, y: 246 },
  },
  {
    key: "04",
    label: "Axiom Validator",
    type: "Logic Gate",
    description: "Enforces hard physical and logical constraints so synthesis remains admissible.",
    specs: "Safety: Hard // Latency: <1ms",
    layer: "Layer 03",
    graphLabel: "Axiom",
    note: "Constraint gate",
    point: { x: 368, y: 268 },
  },
];

const connections = [
  ["01", "02"],
  ["01", "03"],
  ["02", "03"],
  ["02", "04"],
  ["03", "04"],
] as const;

export function CausalLattice() {
  const [activeKey, setActiveKey] = useState<string | null>("02");
  const moduleMap = useMemo(
    () => Object.fromEntries(modules.map((module) => [module.key, module])),
    []
  );

  return (
    <section className="hd-section py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="hd-kicker inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            System Architecture
          </p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            The high-dense causal blueprint.
          </h2>
          <p className="mt-5 text-[1rem] leading-8 text-[var(--text-secondary)]">
            A measured lattice of inference modules, rendered as a navigable blueprint
            rather than a decorative network diagram.
          </p>
        </div>

        <div className="hd-panel relative overflow-hidden rounded-[36px] p-6 md:p-8">
          <div className="hidden border-b border-[var(--border-subtle)] pb-4 md:flex md:items-center md:justify-between">
            <p className="hd-metric-label">Architectural lattice</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Verified blueprint
            </p>
          </div>

          <div className="mt-6 hidden gap-6 md:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
            <div className="grid gap-5 md:grid-cols-2">
              {modules.map((module) => (
                <button
                  key={module.key}
                  type="button"
                  onMouseEnter={() => setActiveKey(module.key)}
                  onFocus={() => setActiveKey(module.key)}
                  className={`hd-panel-soft rounded-[24px] p-5 text-left transition-all duration-200 md:p-6 ${
                    activeKey === module.key
                      ? "border-[rgba(185,127,84,0.34)] bg-white shadow-[0_10px_24px_rgba(185,127,84,0.08)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                    <div>
                      <p className="hd-metric-label">{module.type}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {module.layer}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {module.key}
                    </span>
                  </div>
                  <h3 className="mt-5 font-serif text-[2rem] leading-tight tracking-tight text-[var(--text-primary)]">
                    {module.label}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                    {module.description}
                  </p>
                  <div className="mt-6 border-t border-[var(--border-subtle)] pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {module.specs}
                  </div>
                </button>
              ))}
            </div>

            <div className="relative h-[560px] overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-[#f7f4ee]">
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-5">
                <p className="hd-metric-label">Architectural lattice</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Verified blueprint
                </p>
              </div>

              <div className="pointer-events-none absolute inset-[22px] rounded-[22px] border border-[rgba(102,93,82,0.08)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Causal blueprint
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  04 modules / stable
                </span>
              </div>

              <svg
                className="absolute inset-[60px_24px_56px]"
                viewBox="0 0 560 360"
                fill="none"
                aria-hidden
                onMouseLeave={() => setActiveKey(null)}
              >
                <rect x="30" y="24" width="500" height="300" rx="22" stroke="rgba(102,93,82,0.1)" />
                <path d="M30 84 H530" stroke="rgba(102,93,82,0.08)" />
                <path d="M30 204 H530" stroke="rgba(102,93,82,0.08)" />
                <path d="M180 24 V324" stroke="rgba(102,93,82,0.06)" />
                <path d="M340 24 V324" stroke="rgba(102,93,82,0.06)" />
                <text x="52" y="49" fill="rgba(97,89,79,0.56)" fontSize="9" letterSpacing="2">LAYER 01</text>
                <text x="52" y="169" fill="rgba(97,89,79,0.56)" fontSize="9" letterSpacing="2">LAYER 02</text>
                <text x="52" y="289" fill="rgba(97,89,79,0.56)" fontSize="9" letterSpacing="2">LAYER 03</text>
                <text x="422" y="116" fill="rgba(97,89,79,0.72)" fontSize="9" letterSpacing="2">AUDIT TRACE</text>
                <text x="420" y="282" fill="rgba(97,89,79,0.72)" fontSize="9" letterSpacing="2">HARD CONSTRAINT</text>

                {connections.map(([from, to], index) => {
                  const source = moduleMap[from];
                  const target = moduleMap[to];
                  const isActive = activeKey === from || activeKey === to;
                  const isDimmed = activeKey && !isActive;
                  const dashed = index !== 4;

                  return (
                    <motion.path
                      key={`${from}-${to}`}
                      d={`M ${source.point.x} ${source.point.y} L ${target.point.x} ${target.point.y}`}
                      stroke={isActive ? "#b97f54" : "rgba(185,127,84,0.46)"}
                      strokeWidth={isActive ? 1.9 : 1.35}
                      strokeDasharray={dashed ? "7 7" : "0"}
                      animate={dashed ? { strokeDashoffset: [0, -14] } : undefined}
                      transition={dashed ? { duration: 3 + index * 0.4, repeat: Infinity, ease: "linear" } : undefined}
                      opacity={isDimmed ? 0.18 : isActive ? 1 : 0.72}
                    />
                  );
                })}

                {modules.map((module) => {
                  const isActive = activeKey === module.key;
                  const isDimmed = activeKey && !isActive;

                  return (
                    <motion.g
                      key={module.key}
                      onMouseEnter={() => setActiveKey(module.key)}
                      style={{ cursor: "pointer" }}
                      animate={{ opacity: isDimmed ? 0.28 : 1 }}
                    >
                      <motion.circle
                        cx={module.point.x}
                        cy={module.point.y}
                        r={isActive ? 10 : 7.5}
                        fill={isActive ? "#b97f54" : "#cab5a1"}
                        animate={{
                          r: isActive ? [8.5, 10.5, 8.5] : [7.5, 8.2, 7.5],
                        }}
                        transition={{
                          duration: isActive ? 1.4 : 2.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.circle
                        cx={module.point.x}
                        cy={module.point.y}
                        r={isActive ? 18 : 13}
                        fill="transparent"
                        stroke="rgba(185,127,84,0.22)"
                        animate={{
                          r: isActive ? [12, 20, 12] : [10, 14, 10],
                          opacity: isActive ? [0.22, 0.46, 0.22] : [0.1, 0.18, 0.1],
                        }}
                        transition={{
                          duration: isActive ? 1.6 : 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <rect
                        x={module.point.x - module.graphLabel.length * 4.8 - 18}
                        y={module.point.y - 50}
                        width={module.graphLabel.length * 9.2 + 24}
                        height={22}
                        rx={11}
                        fill="rgba(255,255,255,0.82)"
                        stroke="rgba(102,93,82,0.08)"
                      />
                      <text
                        x={module.point.x - module.graphLabel.length * 4.35}
                        y={module.point.y - 35}
                        fill="rgba(97,89,79,0.88)"
                        fontSize="10"
                        letterSpacing="2.4"
                      >
                        {module.graphLabel.toUpperCase()}
                      </text>
                      <text
                        x={module.point.x - module.note.length * 2.8}
                        y={module.point.y + 34}
                        fill="rgba(97,89,79,0.62)"
                        fontSize="8"
                        letterSpacing="1.8"
                      >
                        {module.note.toUpperCase()}
                      </text>
                    </motion.g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="space-y-5 md:hidden">
            {modules.map((module) => (
              <div key={module.key} className="hd-panel-soft rounded-[22px] p-5">
                <div className="flex items-center justify-between">
                  <p className="hd-metric-label">{module.type}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {module.key}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-2xl tracking-tight text-[var(--text-primary)]">
                  {module.label}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                  {module.description}
                </p>
                <div className="mt-5 border-t border-[var(--border-subtle)] pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {module.specs}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
