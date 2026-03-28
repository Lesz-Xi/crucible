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
const ORBIT_CENTER = 310;
const ORBIT_RADIUS = 230;
const ORBIT_MARKER_RADIUS = 210;
const CONTROL_RADIUS = 294;

interface PillarDefinition {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  angle: number;
}

const pillars: readonly PillarDefinition[] = [
  {
    id: "scm",
    label: "Causal SCM",
    detail:
      "Encodes the system as a causal model so every claim can be traced to explicit variables and mechanisms.",
    icon: GitBranch,
    angle: -Math.PI / 2,
  },
  {
    id: "contradiction",
    label: "Contradiction Engine",
    detail:
      "Forces competing explanations into conflict to expose weak assumptions and preserve only durable causal structure.",
    icon: BrainCircuit,
    angle: -Math.PI / 2 + TWO_PI * (1 / 5),
  },
  {
    id: "memory",
    label: "Sovereign Memory",
    detail:
      "Stores validated traces and rejected paths so the system learns without losing provenance.",
    icon: Database,
    angle: -Math.PI / 2 + TWO_PI * (2 / 5),
  },
  {
    id: "critique",
    label: "Multi-Agent Critique",
    detail:
      "Uses adversarial specialist review to stress-test reasoning before conclusions are accepted.",
    icon: FlaskConical,
    angle: -Math.PI / 2 + TWO_PI * (3 / 5),
  },
  {
    id: "gate",
    label: "Falsifiability Gate",
    detail:
      "Blocks claims that cannot specify what evidence would disconfirm them.",
    icon: ShieldCheck,
    angle: -Math.PI / 2 + TWO_PI * (4 / 5),
  },
] as const;

export function FivePillars() {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(pillars[0].id);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const activePillar =
    pillars.find((pillar) => pillar.id === activeId) ?? pillars[0];

  const nodes = useMemo(
    () =>
      pillars.map((pillar) => ({
        ...pillar,
        orbitX: ORBIT_CENTER + ORBIT_MARKER_RADIUS * Math.cos(pillar.angle),
        orbitY: ORBIT_CENTER + ORBIT_MARKER_RADIUS * Math.sin(pillar.angle),
        controlX: ORBIT_CENTER + CONTROL_RADIUS * Math.cos(pillar.angle),
        controlY: ORBIT_CENTER + CONTROL_RADIUS * Math.sin(pillar.angle),
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

        <div className="five-pillars-orbit-shell relative mx-auto max-w-[58rem]">
          <div className="five-pillars-orbit-frame relative mx-auto aspect-square max-w-[52rem]">
            <motion.svg
              viewBox="0 0 620 620"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
              animate={shouldReduceMotion ? undefined : { rotate: 360 }}
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 80,
                      ease: "linear",
                      repeat: Number.POSITIVE_INFINITY,
                    }
              }
              style={{ transformOrigin: "50% 50%" }}
            >
              <defs>
                <radialGradient id="five-pillars-center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(224,180,118,0.14)" />
                  <stop offset="68%" stopColor="rgba(224,180,118,0.035)" />
                  <stop offset="100%" stopColor="rgba(224,180,118,0)" />
                </radialGradient>
              </defs>

              <circle
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r={ORBIT_RADIUS}
                fill="none"
                stroke="var(--five-pillars-orbit-stroke)"
                strokeWidth="1.35"
              />

              <circle
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r={ORBIT_RADIUS - 20}
                fill="none"
                stroke="var(--five-pillars-orbit-stroke-soft)"
                strokeWidth="0.9"
                strokeDasharray="4 10"
              />

              {nodes.map((node) => (
                <line
                  key={`spoke-${node.id}`}
                  x1={ORBIT_CENTER}
                  y1={ORBIT_CENTER}
                  x2={node.orbitX}
                  y2={node.orbitY}
                  stroke="var(--five-pillars-spoke-stroke)"
                  strokeWidth="1"
                />
              ))}

              {nodes.map((node) => (
                <g key={`marker-${node.id}`}>
                  <circle
                    cx={node.orbitX}
                    cy={node.orbitY}
                    r="26"
                    fill="var(--five-pillars-marker-shell)"
                    stroke="var(--five-pillars-marker-border)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={node.orbitX}
                    cy={node.orbitY}
                    r="7"
                    fill="var(--five-pillars-marker-core)"
                  />
                </g>
              ))}

              <circle
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r="154"
                fill="url(#five-pillars-center-glow)"
              />
            </motion.svg>

            <div className="five-pillars-orbit-spin-layer absolute inset-[14%] rounded-full" />

            {nodes.map((node, index) => {
              const isSelected = node.id === activePillar.id;
              const isPreview = node.id === previewId;
              const Icon = node.icon;

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onMouseEnter={() => setPreviewId(node.id)}
                  onMouseLeave={() => setPreviewId(null)}
                  onFocus={() => setPreviewId(node.id)}
                  onBlur={() => setPreviewId(null)}
                  onClick={() => setActiveId(node.id)}
                  aria-pressed={isSelected}
                  aria-label={node.label}
                  className="five-pillars-control absolute -translate-x-1/2 -translate-y-1/2 bg-transparent"
                  style={{
                    left: `${(node.controlX / 620) * 100}%`,
                    top: `${(node.controlY / 620) * 100}%`,
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
                    className={`five-pillars-node ${isSelected ? "five-pillars-node-active" : isPreview ? "five-pillars-node-preview" : "five-pillars-node-idle"}`}
                  >
                    <div className="five-pillars-node-pill inline-flex items-center gap-3 rounded-full border px-4 py-3">
                      <span className="five-pillars-node-icon flex h-9 w-9 items-center justify-center rounded-full border">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                      </span>
                      <span className="five-pillars-node-label block whitespace-nowrap text-left text-[0.9rem] font-medium tracking-[-0.02em] text-[var(--text-secondary)]">
                        {node.label}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            <div className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePillar.id}
                  className="five-pillars-core flex min-h-[12.75rem] w-[min(82vw,21rem)] items-center justify-center rounded-[1.75rem] border px-6 py-6 text-center md:min-h-[13.5rem] md:w-[22rem] md:px-8"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.985 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex flex-col items-center">
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-[var(--text-tertiary)]">
                      Selected Pillar
                    </p>
                    <h3 className="mt-4 text-[1.85rem] font-medium tracking-[-0.04em] text-[var(--text-primary)] md:text-[2.05rem]">
                      {activePillar.label}
                    </h3>
                    <p className="mt-4 max-w-[15.5rem] text-[0.95rem] leading-[1.75] text-[var(--text-secondary)] md:max-w-[16rem]">
                      {activePillar.detail}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
