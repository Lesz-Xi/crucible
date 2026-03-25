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
    proof: "Evidence intake: observational tables",
    status: "Verified",
    layer: "Layer 01",
    path: "Observational path",
    protocol: ["Observational intake", "Graph search", "Directional test", "Evidence seal"],
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
    proof: "Trace method: temporal lag audit",
    status: "Primary path",
    layer: "Layer 02",
    path: "Temporal path",
    protocol: ["Signal intake", "Lag test", "Intervention bridge", "Temporal seal"],
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
    proof: "Scenario log: intervention branches",
    status: "Stable",
    layer: "Layer 03",
    path: "Scenario path",
    protocol: ["Parent detach", "Scenario branch", "Outcome compare", "Admissibility note"],
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
    proof: "Constraint proof: admissibility gate",
    status: "Guard rail",
    layer: "Layer 03",
    path: "Constraint path",
    protocol: ["Axiom load", "Constraint gate", "Safety check", "Stable seal"],
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
  const activeModule = activeKey ? moduleMap[activeKey] : moduleMap["02"];

  return (
    <section className="hd-section bg-[var(--bg-secondary)] py-16 md:py-20">
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

          <div className="mt-6 hidden gap-6 md:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
            <div className="grid h-full gap-4 md:grid-cols-2 md:grid-rows-2">
              {modules.map((module) => (
                <button
                  key={module.key}
                  type="button"
                  onMouseEnter={() => setActiveKey(module.key)}
                  onFocus={() => setActiveKey(module.key)}
                  className={`group hd-panel-soft relative flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] p-4 text-left transition-all duration-200 md:p-5 ${
                    activeKey === module.key
                      ? "border-[var(--border-glow)] bg-[var(--bg-elevated)] shadow-[0_0_0_1px_rgba(1,105,204,0.16),0_8px_24px_rgba(0,0,0,0.08)]"
                      : ""
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 rounded-[24px] border transition-all duration-200 ${
                      activeKey === module.key
                        ? "border-[var(--border-glow)] shadow-[inset_0_0_0_1px_rgba(1,105,204,0.08),0_0_0_1px_rgba(1,105,204,0.10)]"
                        : "border-transparent"
                    }`}
                  />
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-3">
                    <div>
                      <p className="hd-metric-label">{module.type}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          {module.layer}
                        </span>
                        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border-glow)] bg-[var(--accent-rust-soft)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-rust-strong)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust-strong)]" />
                          <span className="min-w-0 break-words">{module.path}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {module.key}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${
                          activeKey === module.key
                            ? "border-[var(--border-glow)] bg-[var(--accent-rust-soft)] text-[var(--accent-rust-strong)]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {module.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-4 min-h-[3.85rem] max-w-[10ch] font-serif text-[1.6rem] leading-[1.02] tracking-tight text-[var(--text-primary)] md:text-[1.85rem]">
                    {module.label}
                  </h3>
                  <p className="mt-3 min-h-[8.75rem] max-w-[30ch] text-[0.95rem] leading-7 text-[var(--text-secondary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                    {module.description}
                  </p>
                  <div className="mt-auto border-t border-[var(--border-subtle)] pt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="min-h-[7.25rem] rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2.5">
                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Module readout
                        </p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          {module.specs}
                        </p>
                      </div>
                      <div className="min-h-[7.25rem] rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2.5">
                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Validation trace
                        </p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          {module.proof}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid h-full gap-4 lg:grid-rows-2">
              <div className="relative h-full min-h-0 overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(1,105,204,0.06),transparent_34%),radial-gradient(circle_at_78%_72%,rgba(1,105,204,0.03),transparent_32%)]" />
                <div className="pointer-events-none absolute inset-x-6 top-[72px] flex items-center justify-center pl-16">
                  <div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(248,249,251,0.92)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    Active module: {activeModule.label}
                  </div>
                </div>

                <svg
                  className="absolute inset-[112px_24px_74px]"
                  viewBox="0 0 560 360"
                  fill="none"
                  aria-hidden
                  onMouseLeave={() => setActiveKey(null)}
                >
                <path d="M30 84 H530" stroke="#e5e7eb" />
                <path d="M30 204 H530" stroke="#e5e7eb" />
                <path d="M180 24 V324" stroke="rgba(0,0,0,0.04)" />
                <path d="M340 24 V324" stroke="rgba(0,0,0,0.04)" />
                <rect x="44" y="32" width="74" height="18" rx="9" fill="rgba(248,249,251,0.96)" stroke="#e5e7eb" />
                <text x="58" y="44" fill="#9ca3af" fontSize="9" letterSpacing="2">LAYER 01</text>
                <rect x="44" y="145" width="74" height="18" rx="9" fill="rgba(248,249,251,0.96)" stroke="#e5e7eb" />
                <text x="58" y="157" fill="#9ca3af" fontSize="9" letterSpacing="2">LAYER 02</text>
                <rect x="44" y="265" width="74" height="18" rx="9" fill="rgba(248,249,251,0.96)" stroke="#e5e7eb" />
                <text x="58" y="277" fill="#9ca3af" fontSize="9" letterSpacing="2">LAYER 03</text>
                <rect x="394" y="98" width="124" height="20" rx="10" fill="rgba(248,249,251,0.96)" stroke="#e5e7eb" />
                <text x="414" y="111" fill="#6b7280" fontSize="9" letterSpacing="2">AUDIT TRACE</text>
                <rect x="382" y="265" width="144" height="20" rx="10" fill="rgba(248,249,251,0.96)" stroke="#e5e7eb" />
                <text x="402" y="278" fill="#6b7280" fontSize="9" letterSpacing="2">HARD CONSTRAINT</text>

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
                      stroke={isActive ? "#0169cc" : "rgba(1,105,204,0.3)"}
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
                        fill={isActive ? "#0169cc" : "#94a3b8"}
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
                        stroke="rgba(1,105,204,0.2)"
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
                        y={module.key === "01" ? module.point.y - 30 : module.point.y - 50}
                        width={module.graphLabel.length * 9.2 + 24}
                        height={22}
                        rx={11}
                        fill="rgba(248,249,251,0.96)"
                        stroke="#e5e7eb"
                      />
                      <text
                        x={module.point.x - module.graphLabel.length * 4.35}
                        y={module.key === "01" ? module.point.y - 15 : module.point.y - 35}
                        fill="#3d4048"
                        fontSize="10"
                        letterSpacing="2.4"
                      >
                        {module.graphLabel.toUpperCase()}
                      </text>
                      <text
                        x={module.point.x - module.note.length * 2.8}
                        y={module.point.y + 34}
                        fill="#9ca3af"
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

              <div className="relative h-full min-h-0 overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-[var(--shadow-soft)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(1,105,204,0.04),transparent_30%),radial-gradient(circle_at_78%_72%,rgba(1,105,204,0.02),transparent_28%)]" />
                <div className="absolute inset-x-6 top-6 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-3">
                  <div className="inline-flex items-center gap-3">
                    <span className="hd-metric-label">Protocol ledger</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-glow)] bg-[var(--accent-rust-soft)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-rust-strong)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust-strong)]" />
                      {activeModule.path}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {activeModule.status}
                  </span>
                </div>

                <div className="absolute inset-[116px_24px_74px]">
                  <div className="h-full p-5">
                    <div className="grid h-full gap-3 md:grid-cols-4">
                      {activeModule.protocol.map((step, index) => {
                        const isFinal = index === activeModule.protocol.length - 1;
                        const stepBackground =
                          "linear-gradient(135deg, rgba(1,105,204,0.07), rgba(1,105,204,0.02))";
                        const stepState =
                          index === 0
                            ? "Intake"
                            : index === 1
                              ? "Active"
                              : index === 2
                                ? "Bridge"
                                : "Seal";
                        return (
                          <div
                            key={step}
                            className="group relative flex h-full min-h-[0] flex-col rounded-[18px] border border-[var(--border-color,#e5e7eb)] px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-[var(--border-glow)] hover:shadow-[0_0_0_1px_rgba(1,105,204,0.12),0_6px_20px_rgba(0,0,0,0.07)]"
                            style={{ background: stepBackground }}
                          >
                            {!isFinal ? (
                              <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-[linear-gradient(90deg,rgba(1,105,204,0.5),rgba(1,105,204,0.08))] md:block" />
                            ) : null}
                            <div className="pointer-events-none absolute inset-0 rounded-[18px] border border-transparent transition-all duration-200 group-hover:border-[var(--border-glow)]" />
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                {stepState}
                              </span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                        <div className="mt-4 min-h-[2.75rem]">
                              <p className="inline-flex max-w-full items-start gap-2 break-words font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent-rust-strong)]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust-strong)] shadow-[0_0_8px_rgba(1,105,204,0.35)]" />
                                <span className="min-w-0 whitespace-normal break-words">
                                  {activeModule.path}
                                </span>
                              </p>
                            </div>
                            <p className="mt-5 min-h-[4.25rem] font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-primary)]">
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 md:hidden">
            {modules.map((module) => (
              <div key={module.key} className="hd-panel-soft rounded-[22px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="hd-metric-label">{module.type}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {module.layer}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-glow)] bg-[var(--accent-rust-soft)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-rust-strong)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust-strong)]" />
                        {module.path}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {module.key}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${
                        module.status === "Primary path"
                          ? "border-[var(--border-glow)] bg-[linear-gradient(90deg,rgba(1,105,204,0.08),rgba(1,105,204,0.04))] text-[var(--accent-rust-strong)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {module.status}
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-serif text-2xl tracking-tight text-[var(--text-primary)]">
                  {module.label}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                  {module.description}
                </p>
                <div className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {module.specs}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {module.proof}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
