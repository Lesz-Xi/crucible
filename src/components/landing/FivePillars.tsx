"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  Database,
  FlaskConical,
  GitBranch,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const TWO_PI = Math.PI * 2;
const BOARD_WIDTH = 760;
const BOARD_HEIGHT = 560;
const ORBIT_CENTER_X = 360;
const ORBIT_CENTER_Y = 292;
const ORBIT_RADIUS = 178;
const ORBIT_MARKER_RADIUS = 160;

interface StationDefinition {
  x: number;
  y: number;
  align: "left" | "center" | "right";
  rail: string;
}

interface PillarDefinition {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  angle: number;
  station: StationDefinition;
}

const pillars: readonly PillarDefinition[] = [
  {
    id: "scm",
    label: "Causal SCM",
    detail:
      "Builds the structural model so every inference stays tied to explicit variables, edges, and mechanisms.",
    icon: GitBranch,
    angle: -Math.PI / 2,
    station: {
      x: 360,
      y: 44,
      align: "center",
      rail: "MODEL REGISTRY",
    },
  },
  {
    id: "contradiction",
    label: "Contradiction Engine",
    detail:
      "Forces competing explanations into conflict until only the mechanisms that survive pressure remain in play.",
    icon: BrainCircuit,
    angle: -Math.PI / 2 + TWO_PI * (1 / 5),
    station: {
      x: 664,
      y: 210,
      align: "left",
      rail: "CONFLICT LANE",
    },
  },
  {
    id: "memory",
    label: "Sovereign Memory",
    detail:
      "Commits validated traces and rejected paths into auditable memory without severing provenance.",
    icon: Database,
    angle: -Math.PI / 2 + TWO_PI * (2 / 5),
    station: {
      x: 554,
      y: 512,
      align: "left",
      rail: "TRACE ARCHIVE",
    },
  },
  {
    id: "critique",
    label: "Multi-Agent Critique",
    detail:
      "Runs adversarial specialist review so methods, assumptions, and causal claims get stress-tested before trust.",
    icon: FlaskConical,
    angle: -Math.PI / 2 + TWO_PI * (3 / 5),
    station: {
      x: 164,
      y: 512,
      align: "right",
      rail: "REVIEW CELL",
    },
  },
  {
    id: "gate",
    label: "Falsifiability Gate",
    detail:
      "Blocks claims that cannot say what evidence would disconfirm them before they reach action or memory.",
    icon: ShieldCheck,
    angle: -Math.PI / 2 + TWO_PI * (4 / 5),
    station: {
      x: 58,
      y: 210,
      align: "right",
      rail: "REFUTATION LOCK",
    },
  },
] as const;

const systemNotes = [
  "Governed runtime",
  "Traceable edges",
  "No unbounded output path",
] as const;

function getStationClass(align: StationDefinition["align"]) {
  switch (align) {
    case "left":
      return "five-pillars-station-left items-start text-left";
    case "right":
      return "five-pillars-station-right items-end text-right";
    case "center":
      return "five-pillars-station-center items-center text-center";
  }
}

export function FivePillars() {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(pillars[0].id);

  const activePillar =
    pillars.find((pillar) => pillar.id === activeId) ?? pillars[0];

  const nodes = useMemo(
    () =>
      pillars.map((pillar) => ({
        ...pillar,
        orbitX: ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.cos(pillar.angle),
        orbitY: ORBIT_CENTER_Y + ORBIT_MARKER_RADIUS * Math.sin(pillar.angle),
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

        <div className="five-pillars-board relative mx-auto max-w-[76rem] overflow-hidden rounded-[2rem] border px-4 py-4 md:px-6 md:py-6">
          <div className="five-pillars-board-glow absolute inset-[10%] rounded-[2rem]" />
          <div className="five-pillars-board-grid absolute inset-0" />

          <div className="five-pillars-board-header relative z-[2] mb-5 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Instrument Board
              </p>
              <p className="mt-2 text-[1rem] font-medium tracking-[-0.02em] text-[var(--text-primary)] md:text-[1.08rem]">
                Closed-loop causal governance runtime
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {systemNotes.map((note) => (
                <span key={note} className="five-pillars-note-chip">
                  {note}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div
              className="five-pillars-desktop-stage relative mx-auto"
              style={{
                width: `min(100%, ${BOARD_WIDTH}px)`,
                aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
              }}
            >
              <motion.svg
                viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
                animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        duration: 96,
                        ease: "linear",
                        repeat: Number.POSITIVE_INFINITY,
                      }
                }
                style={{ transformOrigin: `${ORBIT_CENTER_X}px ${ORBIT_CENTER_Y}px` }}
              >
                <defs>
                  <radialGradient id="five-pillars-orbit-halo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(224,180,118,0.18)" />
                    <stop offset="64%" stopColor="rgba(224,180,118,0.05)" />
                    <stop offset="100%" stopColor="rgba(224,180,118,0)" />
                  </radialGradient>
                </defs>

                <circle
                  cx={ORBIT_CENTER_X}
                  cy={ORBIT_CENTER_Y}
                  r="204"
                  fill="url(#five-pillars-orbit-halo)"
                />
                <circle
                  cx={ORBIT_CENTER_X}
                  cy={ORBIT_CENTER_Y}
                  r={ORBIT_RADIUS}
                  fill="none"
                  stroke="var(--five-pillars-orbit-stroke)"
                  strokeWidth="1.35"
                />
                <circle
                  cx={ORBIT_CENTER_X}
                  cy={ORBIT_CENTER_Y}
                  r={ORBIT_RADIUS - 18}
                  fill="none"
                  stroke="var(--five-pillars-orbit-stroke-soft)"
                  strokeWidth="0.9"
                  strokeDasharray="3 11"
                />

                {nodes.map((node) => (
                  <g key={`line-${node.id}`}>
                    <line
                      x1={ORBIT_CENTER_X}
                      y1={ORBIT_CENTER_Y}
                      x2={node.orbitX}
                      y2={node.orbitY}
                      stroke="var(--five-pillars-spoke-stroke)"
                      strokeWidth="1"
                    />
                    <line
                      x1={node.orbitX}
                      y1={node.orbitY}
                      x2={node.station.x}
                      y2={node.station.y}
                      stroke="var(--five-pillars-station-line)"
                      strokeWidth="1"
                    />
                    <circle
                      cx={node.orbitX}
                      cy={node.orbitY}
                      r="18"
                      fill="var(--five-pillars-marker-shell)"
                      stroke="var(--five-pillars-marker-border)"
                      strokeWidth="1"
                    />
                    <circle
                      cx={node.orbitX}
                      cy={node.orbitY}
                      r="6.5"
                      fill="var(--five-pillars-marker-core)"
                    />
                    <circle
                      cx={node.station.x}
                      cy={node.station.y}
                      r="4.5"
                      fill="var(--five-pillars-station-dot)"
                    />
                  </g>
                ))}
              </motion.svg>

              <div className="five-pillars-orbit-spin-layer absolute left-1/2 top-1/2 h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />

              <div className="five-pillars-governance-top absolute left-[3.5rem] top-[4rem]">
                <p className="five-pillars-micro-label">GOVERNANCE LAYER</p>
                <p className="mt-2 max-w-[8rem] text-[0.75rem] leading-[1.5] text-[var(--text-tertiary)]">
                  All rails converge through one governed inference core.
                </p>
              </div>

              <div className="five-pillars-governance-right absolute right-[2.25rem] top-[4.75rem] text-right">
                <p className="five-pillars-micro-label">TRACE DISCIPLINE</p>
                <p className="mt-2 max-w-[8.5rem] text-[0.75rem] leading-[1.5] text-[var(--text-tertiary)]">
                  Claims move through auditable stations, not free-form jumps.
                </p>
              </div>

              {nodes.map((node, index) => {
                const isSelected = node.id === activePillar.id;
                const Icon = node.icon;

                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    aria-pressed={isSelected}
                    aria-label={node.label}
                    className={`five-pillars-station absolute ${getStationClass(node.station.align)}`}
                    style={{
                      left: `${(node.station.x / BOARD_WIDTH) * 100}%`,
                      top: `${(node.station.y / BOARD_HEIGHT) * 100}%`,
                    }}
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }
                    }
                    whileInView={
                      shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
                    }
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.42,
                      delay: index * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <span className="five-pillars-station-rail">{node.station.rail}</span>
                    <span
                      className={`five-pillars-station-card ${isSelected ? "is-active" : ""}`}
                    >
                      <span className="five-pillars-station-icon">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                      </span>
                      <span className="five-pillars-station-copy">
                        <span className="five-pillars-station-title">{node.label}</span>
                      </span>
                    </span>
                  </motion.button>
                );
              })}

              <div
                className="absolute z-[2] -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(ORBIT_CENTER_X / BOARD_WIDTH) * 100}%`,
                  top: `${(ORBIT_CENTER_Y / BOARD_HEIGHT) * 100}%`,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePillar.id}
                    className="five-pillars-core flex min-h-[13.5rem] w-[22rem] items-center justify-center rounded-[1.6rem] border px-7 py-6 text-center"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex flex-col items-center">
                      <p className="five-pillars-micro-label">CAUSAL CONTROL CORE</p>
                      <h3 className="mt-4 text-[2.15rem] font-medium tracking-[-0.045em] text-[var(--text-primary)]">
                        {activePillar.label}
                      </h3>
                      <p className="mt-4 max-w-[16rem] text-[0.96rem] leading-[1.75] text-[var(--text-secondary)]">
                        {activePillar.detail}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <div className="five-pillars-mobile-stage relative mx-auto aspect-square max-w-[29rem]">
              <motion.svg
                viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_WIDTH}`}
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
                animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        duration: 96,
                        ease: "linear",
                        repeat: Number.POSITIVE_INFINITY,
                      }
                }
                style={{ transformOrigin: `${ORBIT_CENTER_X}px ${ORBIT_CENTER_X}px` }}
              >
                <defs>
                  <radialGradient id="five-pillars-orbit-mobile-halo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(224,180,118,0.2)" />
                    <stop offset="66%" stopColor="rgba(224,180,118,0.05)" />
                    <stop offset="100%" stopColor="rgba(224,180,118,0)" />
                  </radialGradient>
                </defs>

                <circle
                  cx={ORBIT_CENTER_X}
                  cy={ORBIT_CENTER_X}
                  r="214"
                  fill="url(#five-pillars-orbit-mobile-halo)"
                />
                <circle
                  cx={ORBIT_CENTER_X}
                  cy={ORBIT_CENTER_X}
                  r={ORBIT_RADIUS}
                  fill="none"
                  stroke="var(--five-pillars-orbit-stroke)"
                  strokeWidth="1.35"
                />
                <circle
                  cx={ORBIT_CENTER_X}
                  cy={ORBIT_CENTER_X}
                  r={ORBIT_RADIUS - 18}
                  fill="none"
                  stroke="var(--five-pillars-orbit-stroke-soft)"
                  strokeWidth="0.9"
                  strokeDasharray="3 11"
                />
                {nodes.map((node) => (
                  <g key={`mobile-${node.id}`}>
                    <line
                      x1={ORBIT_CENTER_X}
                      y1={ORBIT_CENTER_X}
                      x2={ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.cos(node.angle)}
                      y2={ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.sin(node.angle)}
                      stroke="var(--five-pillars-spoke-stroke)"
                      strokeWidth="1"
                    />
                    <circle
                      cx={ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.cos(node.angle)}
                      cy={ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.sin(node.angle)}
                      r="18"
                      fill="var(--five-pillars-marker-shell)"
                      stroke="var(--five-pillars-marker-border)"
                      strokeWidth="1"
                    />
                    <circle
                      cx={ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.cos(node.angle)}
                      cy={ORBIT_CENTER_X + ORBIT_MARKER_RADIUS * Math.sin(node.angle)}
                      r="6.5"
                      fill="var(--five-pillars-marker-core)"
                    />
                  </g>
                ))}
              </motion.svg>

              <div className="five-pillars-orbit-spin-layer absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />

              <div className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`mobile-${activePillar.id}`}
                    className="five-pillars-core flex min-h-[11rem] w-[15rem] items-center justify-center rounded-[1.35rem] border px-5 py-5 text-center"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex flex-col items-center">
                      <p className="five-pillars-micro-label">CAUSAL CORE</p>
                      <h3 className="mt-3 text-[1.7rem] font-medium tracking-[-0.045em] text-[var(--text-primary)]">
                        {activePillar.label}
                      </h3>
                      <p className="mt-3 max-w-[12rem] text-[0.88rem] leading-[1.65] text-[var(--text-secondary)]">
                        {activePillar.detail}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="five-pillars-mobile-dock mt-6 grid gap-2.5">
              {pillars.map((pillar) => {
                const isSelected = pillar.id === activePillar.id;
                const Icon = pillar.icon;

                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setActiveId(pillar.id)}
                    aria-pressed={isSelected}
                    aria-label={pillar.label}
                    className={`five-pillars-mobile-tab ${isSelected ? "is-active" : ""}`}
                  >
                    <span className="five-pillars-mobile-tab-icon">
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    <span className="five-pillars-mobile-tab-copy">
                      <span className="five-pillars-mobile-tab-title">
                        {pillar.label}
                      </span>
                      <span className="five-pillars-mobile-tab-rail">
                        {pillar.station.rail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
