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
const ORBIT_CENTER = 244;
const ORBIT_RADIUS = 176;

type PillarStatus = "live" | "active" | "gated";

interface PillarDefinition {
  id: string;
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
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(pillars[0].id);
  const [isOrbitFocused, setIsOrbitFocused] = useState(false);

  const activePillar =
    pillars.find((pillar) => pillar.id === activeId) ?? pillars[0];

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
          <p className="mt-6 max-w-[44rem] text-[0.98rem] leading-[1.95] text-[var(--text-muted)]">
            Every capability is purpose-built for causal governance. Together they
            form a closed-loop automated scientist: one orbital system, five
            operational disciplines, no ungoverned path to output.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(24rem,0.92fr)_minmax(22rem,0.72fr)] lg:items-center lg:gap-14">
          <div
            className="five-pillars-orbit-shell relative"
            onMouseEnter={() => setIsOrbitFocused(true)}
            onMouseLeave={() => setIsOrbitFocused(false)}
            onFocusCapture={() => setIsOrbitFocused(true)}
            onBlurCapture={() => setIsOrbitFocused(false)}
          >
            <div className="five-pillars-orbit-frame relative mx-auto aspect-square max-w-[34rem]">
              <svg
                viewBox="0 0 488 488"
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="five-pillars-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(224,180,118,0.11)" />
                    <stop offset="72%" stopColor="rgba(224,180,118,0.03)" />
                    <stop offset="100%" stopColor="rgba(224,180,118,0)" />
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
                  r="118"
                  fill="url(#five-pillars-glow)"
                />
              </svg>

              <motion.div
                className="five-pillars-orbit-rotor absolute inset-0"
                animate={
                  shouldReduceMotion || isOrbitFocused
                    ? { rotate: 0 }
                    : { rotate: 360 }
                }
                transition={
                  shouldReduceMotion || isOrbitFocused
                    ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                    : {
                        duration: 38,
                        ease: "linear",
                        repeat: Number.POSITIVE_INFINITY,
                      }
                }
              >
                {nodes.map((node, index) => {
                  const isActive = node.id === activePillar.id;
                  const Icon = node.icon;

                  return (
                    <motion.button
                      key={node.id}
                      type="button"
                      onMouseEnter={() => setActiveId(node.id)}
                      onFocus={() => setActiveId(node.id)}
                      onClick={() => setActiveId(node.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 bg-transparent"
                      style={{
                        left: `${(node.x / 488) * 100}%`,
                        top: `${(node.y / 488) * 100}%`,
                      }}
                      initial={
                        shouldReduceMotion ? undefined : { opacity: 0, scale: 0.92 }
                      }
                      whileInView={
                        shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
                      }
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <div
                        className={`five-pillars-node ${isActive ? "five-pillars-node-active" : "five-pillars-node-idle"}`}
                      >
                        <div className="five-pillars-node-icon flex h-14 w-14 items-center justify-center rounded-full border">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>

              <motion.div
                className="five-pillars-core absolute left-1/2 top-1/2 flex h-[9.5rem] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
                initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-center">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    MASA
                  </p>
                  <p className="mt-2 text-[1.8rem] font-medium tracking-[-0.04em] text-[var(--text-primary)]">
                    Engine
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.aside
            key={activePillar.id}
            className="five-pillars-dock rounded-[1.8rem] border p-6 md:p-7"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                  Active Pillar
                </p>
                <h3 className="mt-4 text-[1.9rem] font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                  {activePillar.label}
                </h3>
                <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {activePillar.sub}
                </p>
              </div>

              <span
                className={`five-pillars-status ${getStatusClass(activePillar.status)}`}
              >
                {getStatusLabel(activePillar.status)}
              </span>
            </div>

            <p className="mt-7 text-[1rem] leading-[1.85] text-[var(--text-secondary)]">
              {activePillar.detail}
            </p>

            <div className="mt-7 border-t border-[var(--five-pillars-rule)] pt-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Runtime Confidence
                </span>
                <span className="font-mono text-[0.8rem] tracking-[0.08em] text-[var(--text-primary)]">
                  {activePillar.energy}%
                </span>
              </div>
              <div className="five-pillars-ledger-meter h-2 overflow-hidden rounded-full">
                <motion.div
                  className="h-full rounded-full bg-[var(--five-pillars-meter-fill)]"
                  initial={shouldReduceMotion ? undefined : { width: 0 }}
                  animate={{ width: `${activePillar.energy}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            <div className="mt-7 border-t border-[var(--five-pillars-rule)] pt-6">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
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
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
