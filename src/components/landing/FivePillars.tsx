"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  Database,
  FlaskConical,
  GitBranch,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const TWO_PI = Math.PI * 2;
const ORBIT_CENTER = 212;
const ORBIT_RADIUS = 156;

type PillarStatus = "live" | "active" | "gated";

interface PillarDefinition {
  id: string;
  num: string;
  label: string;
  sub: string;
  detail: string;
  energy: number;
  status: PillarStatus;
  connected: string[];
  icon: LucideIcon;
  angle: number;
}

const pillars: readonly PillarDefinition[] = [
  {
    id: "scm",
    num: "01",
    label: "Causal SCM",
    sub: "Structural causal models · DAG construction",
    detail:
      "Registers endogenous variables, edges, and mechanism forms into a versioned structural model before any causal query proceeds.",
    energy: 96,
    status: "active",
    connected: ["Contradiction Engine", "Falsifiability Gate"],
    icon: GitBranch,
    angle: -Math.PI / 2,
  },
  {
    id: "contradiction",
    num: "02",
    label: "Contradiction Engine",
    sub: "Hong recombination · novelty proofing",
    detail:
      "Pressurises conflict across claims to surface mechanisms that survive contradiction instead of smoothing it away.",
    energy: 82,
    status: "live",
    connected: ["Causal SCM", "Multi-Agent Critique"],
    icon: BrainCircuit,
    angle: -Math.PI / 2 + TWO_PI * (1 / 5),
  },
  {
    id: "memory",
    num: "03",
    label: "Sovereign Memory",
    sub: "Rejection-aware RAG · pyodide sandbox",
    detail:
      "Persists only evidence and mechanisms that remain auditable, reproducible, and bounded by explicit provenance.",
    energy: 68,
    status: "live",
    connected: ["Contradiction Engine", "Falsifiability Gate"],
    icon: Database,
    angle: -Math.PI / 2 + TWO_PI * (2 / 5),
  },
  {
    id: "critique",
    num: "04",
    label: "Multi-Agent Critique",
    sub: "Epistemologist · skeptic · architect",
    detail:
      "Runs adversarial review across methods, assumptions, and identification claims before an answer earns operational trust.",
    energy: 74,
    status: "gated",
    connected: ["Causal SCM", "Sovereign Memory"],
    icon: FlaskConical,
    angle: -Math.PI / 2 + TWO_PI * (3 / 5),
  },
  {
    id: "gate",
    num: "05",
    label: "Falsifiability Gate",
    sub: "Physical-reality validation · memory commit",
    detail:
      "Stops plausible but untestable claims from entering memory unless they specify what would disconfirm them.",
    energy: 88,
    status: "active",
    connected: ["Causal SCM", "Sovereign Memory"],
    icon: ShieldCheck,
    angle: -Math.PI / 2 + TWO_PI * (4 / 5),
  },
] as const;

function getStatusLabel(status: PillarStatus) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "live":
      return "LIVE";
    case "gated":
      return "GATED";
  }
}

function getStatusClass(status: PillarStatus) {
  switch (status) {
    case "active":
      return "five-pillars-status-active";
    case "live":
      return "five-pillars-status-live";
    case "gated":
      return "five-pillars-status-gated";
  }
}

export function FivePillars() {
  const shouldReduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(pillars[0].id);

  const activePillar = pillars.find((pillar) => pillar.id === activeId) ?? pillars[0];

  const nodes = useMemo(
    () =>
      pillars.map((pillar) => ({
        ...pillar,
        x: ORBIT_CENTER + ORBIT_RADIUS * Math.cos(pillar.angle),
        y: ORBIT_CENTER + ORBIT_RADIUS * Math.sin(pillar.angle),
      })),
    [],
  );

  return (
    <section
      id="architecture"
      className="hd-section overflow-hidden bg-[var(--bg-primary)] py-28 md:py-36"
    >
      <div className="mx-auto max-w-7xl px-8 md:px-12 lg:px-16">
        <div className="mb-16 max-w-3xl lg:mb-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Architecture
            </span>
          </div>
          <h2
            className="hd-serif-display text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2.2rem, 4vw, 4rem)" }}
          >
            Five Pillars.{" "}
            <em className="italic text-[var(--accent-rust)]">One Causal Engine.</em>
          </h2>
          <p className="mt-6 max-w-[40rem] text-[0.98rem] leading-[1.95] text-[var(--text-muted)]">
            Every capability is purpose-built for causal governance. Together they form
            a closed-loop automated scientist: one orbital system, five operational
            disciplines, no ungoverned path to output.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:items-center lg:gap-16">
          <div className="relative flex items-center justify-center lg:justify-start">
            <div className="relative w-full max-w-[34rem]">
              <div className="five-pillars-orbit-frame relative aspect-square">
                <svg
                  viewBox="0 0 424 424"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="fp-orbit-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                  </defs>

                  <circle
                    cx={ORBIT_CENTER}
                    cy={ORBIT_CENTER}
                    r={ORBIT_RADIUS}
                    fill="none"
                    stroke="var(--five-pillars-orbit-stroke)"
                    strokeWidth="1.2"
                  />

                  {nodes.map((node) => (
                    <line
                      key={`spoke-${node.id}`}
                      x1={ORBIT_CENTER}
                      y1={ORBIT_CENTER}
                      x2={node.x}
                      y2={node.y}
                      stroke="var(--five-pillars-spoke-stroke)"
                      strokeWidth="1"
                    />
                  ))}

                  <circle
                    cx={ORBIT_CENTER}
                    cy={ORBIT_CENTER}
                    r="116"
                    fill="url(#fp-orbit-glow)"
                    opacity="0.35"
                  />
                </svg>

                <motion.div
                  className="five-pillars-center-card absolute left-1/2 top-1/2 w-[min(100%,31rem)] max-w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.7rem] border"
                  initial={shouldReduce ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
                  whileInView={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`five-pillars-status ${getStatusClass(activePillar.status)}`}
                    >
                      {getStatusLabel(activePillar.status)}
                    </span>
                    <span className="font-mono text-[0.76rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      PILLAR {activePillar.num}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <div className="five-pillars-center-icon flex h-12 w-12 items-center justify-center rounded-full border">
                      <activePillar.icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-[2rem] font-medium leading-none tracking-[-0.03em] text-[var(--text-primary)]">
                        {activePillar.label}
                      </h3>
                      <p className="mt-2 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        {activePillar.sub}
                      </p>
                    </div>
                  </div>

                  <p className="mt-7 max-w-[28rem] text-[1rem] leading-[1.85] text-[var(--text-secondary)]">
                    {activePillar.detail}
                  </p>

                  <div className="mt-7 h-px w-full bg-[var(--five-pillars-rule)]" />

                  <div className="mt-7">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <span className="font-mono text-[0.76rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Energy Level
                      </span>
                      <span className="font-mono text-[0.82rem] tracking-[0.08em] text-[var(--text-primary)]">
                        {activePillar.energy}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--five-pillars-meter-track)]">
                      <motion.div
                        className="h-full rounded-full bg-[var(--five-pillars-meter-fill)]"
                        initial={shouldReduce ? undefined : { width: 0 }}
                        animate={{ width: `${activePillar.energy}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="font-mono text-[0.78rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Connected Nodes
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {activePillar.connected.map((item) => (
                        <span
                          key={item}
                          className="five-pillars-connected inline-flex items-center rounded-full border px-4 py-2 text-[0.88rem] text-[var(--text-secondary)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {nodes.map((node, index) => {
                  const isActive = node.id === activeId;
                  const Icon = node.icon;
                  return (
                    <motion.button
                      key={node.id}
                      type="button"
                      onMouseEnter={() => setActiveId(node.id)}
                      onFocus={() => setActiveId(node.id)}
                      onClick={() => setActiveId(node.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 bg-transparent text-left"
                      style={{ left: `${(node.x / 424) * 100}%`, top: `${(node.y / 424) * 100}%` }}
                      initial={shouldReduce ? undefined : { opacity: 0, scale: 0.92 }}
                      whileInView={shouldReduce ? undefined : { opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <div
                        className={`five-pillars-node ${isActive ? "five-pillars-node-active" : "five-pillars-node-idle"}`}
                      >
                        <div className="five-pillars-node-icon flex h-14 w-14 items-center justify-center rounded-full border">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-[0.66rem] font-mono uppercase tracking-[0.18em] text-[var(--accent-rust)]">
                            {node.num}
                          </p>
                          <p className="mt-1 text-[0.9rem] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
                            {node.label}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {pillars.map((pillar, index) => {
              const isActive = pillar.id === activeId;
              const Wrap = shouldReduce ? "div" : motion.div;
              const motionProps = shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, x: 22 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: {
                      duration: 0.48,
                      delay: index * 0.07,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  };

              return (
                <Wrap
                  key={pillar.id}
                  {...(motionProps as object)}
                  className={`five-pillars-ledger group rounded-[1.25rem] border p-5 transition-all duration-250 ${
                    isActive ? "five-pillars-ledger-active" : "five-pillars-ledger-idle"
                  }`}
                  onMouseEnter={() => setActiveId(pillar.id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent-rust)]">
                      {pillar.num}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="text-[1.12rem] font-medium tracking-[-0.02em] text-[var(--text-primary)]">
                            {pillar.label}
                          </p>
                          <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {pillar.sub}
                          </p>
                        </div>
                        <div className="five-pillars-ledger-meter mt-1 h-px w-12 shrink-0" />
                      </div>
                      <p className="mt-4 max-w-[34rem] text-[0.92rem] leading-[1.8] text-[var(--text-secondary)]">
                        {pillar.detail}
                      </p>
                    </div>
                  </div>
                </Wrap>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
