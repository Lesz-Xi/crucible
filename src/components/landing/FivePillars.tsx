"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  FlaskConical,
  GitBranch,
  Link2,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

const TWO_PI = Math.PI * 2;
const STAGE_SIZE = 720;
const ORBIT_CENTER = STAGE_SIZE / 2;
const ORBIT_RADIUS = 220;

type PillarStatus = "active" | "monitoring" | "gated";

interface PillarDefinition {
  id: string;
  label: string;
  detail: string;
  meta: string;
  metricLabel: string;
  metricValue: number;
  status: PillarStatus;
  relatedIds: string[];
  icon: LucideIcon;
  angle: number;
}

const pillars: readonly PillarDefinition[] = [
  {
    id: "scm",
    label: "Causal SCM",
    detail:
      "Builds the structural model so every inference stays tied to explicit variables, edges, and mechanisms.",
    meta: "SCM Registry",
    metricLabel: "Trace Coverage",
    metricValue: 96,
    status: "active",
    relatedIds: ["contradiction", "gate"],
    icon: GitBranch,
    angle: -Math.PI / 2,
  },
  {
    id: "contradiction",
    label: "Contradiction Engine",
    detail:
      "Forces competing explanations into conflict until only the mechanisms that survive pressure remain in play.",
    meta: "Conflict Runtime",
    metricLabel: "Pressure Level",
    metricValue: 82,
    status: "monitoring",
    relatedIds: ["scm", "critique"],
    icon: BrainCircuit,
    angle: -Math.PI / 2 + TWO_PI * (1 / 5),
  },
  {
    id: "memory",
    label: "Sovereign Memory",
    detail:
      "Commits validated traces and rejected paths into auditable memory without severing provenance.",
    meta: "Persistence Layer",
    metricLabel: "Commit Fidelity",
    metricValue: 74,
    status: "monitoring",
    relatedIds: ["gate", "scm"],
    icon: Database,
    angle: -Math.PI / 2 + TWO_PI * (2 / 5),
  },
  {
    id: "critique",
    label: "Multi-Agent Critique",
    detail:
      "Runs adversarial specialist review so methods, assumptions, and causal claims get stress-tested before trust.",
    meta: "Review Stack",
    metricLabel: "Challenge Depth",
    metricValue: 68,
    status: "gated",
    relatedIds: ["contradiction", "memory"],
    icon: FlaskConical,
    angle: -Math.PI / 2 + TWO_PI * (3 / 5),
  },
  {
    id: "gate",
    label: "Falsifiability Gate",
    detail:
      "Blocks claims that cannot say what evidence would disconfirm them before they reach action or memory.",
    meta: "Refutation Lock",
    metricLabel: "Governance Readiness",
    metricValue: 88,
    status: "active",
    relatedIds: ["scm", "memory"],
    icon: ShieldCheck,
    angle: -Math.PI / 2 + TWO_PI * (4 / 5),
  },
] as const;

function getStatusLabel(status: PillarStatus) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "monitoring":
      return "LIVE";
    case "gated":
      return "GATED";
  }
}

function getStatusClass(status: PillarStatus) {
  switch (status) {
    case "active":
      return "five-pillars-status-active";
    case "monitoring":
      return "five-pillars-status-monitoring";
    case "gated":
      return "five-pillars-status-gated";
  }
}

function getTargetRotation(angle: number) {
  const target = (-Math.PI / 2 - angle) * (180 / Math.PI);
  return Number(target.toFixed(3));
}

function normalizeDeg(value: number) {
  return ((value % 360) + 360) % 360;
}

export function FivePillars() {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(pillars[0].id);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(!shouldReduceMotion);

  const activePillar =
    pillars.find((pillar) => pillar.id === activeId) ?? pillars[0];

  useEffect(() => {
    if (shouldReduceMotion || !autoRotate) {
      return;
    }

    const rotationTimer = window.setInterval(() => {
      setRotationAngle((prev) => normalizeDeg(prev + 0.22));
    }, 50);

    return () => {
      window.clearInterval(rotationTimer);
    };
  }, [autoRotate, shouldReduceMotion]);

  const positionedNodes = useMemo(
    () =>
      pillars.map((pillar) => {
        const radian = pillar.angle + (rotationAngle * Math.PI) / 180;
        const x = ORBIT_CENTER + ORBIT_RADIUS * Math.cos(radian);
        const y = ORBIT_CENTER + ORBIT_RADIUS * Math.sin(radian);
        const depth = (1 + Math.sin(radian)) / 2;

        return {
          ...pillar,
          x,
          y,
          depth,
        };
      }),
    [rotationAngle],
  );

  const relatedIds = useMemo(
    () => new Set(activePillar.relatedIds),
    [activePillar.relatedIds],
  );

  const activeNode =
    positionedNodes.find((node) => node.id === activePillar.id) ?? positionedNodes[0];

  const selectPillar = (pillarId: string) => {
    const targetPillar = pillars.find((pillar) => pillar.id === pillarId);
    if (!targetPillar) {
      return;
    }

    setActiveId(pillarId);
    setAutoRotate(false);
    setRotationAngle(getTargetRotation(targetPillar.angle));
  };

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

        <div className="five-pillars-orbit-shell relative mx-auto">
          <div className="five-pillars-orbit-stage relative mx-auto hidden md:block">
            <svg
              viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="five-pillars-orbit-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(224,180,118,0.12)" />
                  <stop offset="62%" stopColor="rgba(224,180,118,0.03)" />
                  <stop offset="100%" stopColor="rgba(224,180,118,0)" />
                </radialGradient>
              </defs>

              <circle
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r="120"
                fill="none"
                stroke="rgba(255, 247, 238, 0.035)"
                strokeWidth="1"
              />
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
                r={ORBIT_RADIUS - 24}
                fill="url(#five-pillars-orbit-glow)"
              />
              {relatedIds.size > 0 &&
                positionedNodes
                  .filter((node) => relatedIds.has(node.id))
                  .map((node) => (
                    <line
                      key={`related-${node.id}`}
                      x1={activeNode.x}
                      y1={activeNode.y}
                      x2={node.x}
                      y2={node.y}
                      stroke="rgba(224, 180, 118, 0.14)"
                      strokeWidth="1"
                    />
                  ))}

              {!autoRotate && (
                <line
                  x1={activeNode.x}
                  y1={activeNode.y + 34}
                  x2={ORBIT_CENTER}
                  y2={ORBIT_CENTER - 146}
                  stroke="rgba(255, 247, 238, 0.24)"
                  strokeWidth="1"
                />
              )}
            </svg>

            <motion.div
              className="five-pillars-orbit-spin-layer absolute inset-[18%] rounded-full"
              animate={
                shouldReduceMotion || !autoRotate ? undefined : { rotate: 360 }
              }
              transition={
                shouldReduceMotion || !autoRotate
                  ? undefined
                  : {
                      duration: 80,
                      ease: "linear",
                      repeat: Number.POSITIVE_INFINITY,
                    }
              }
            />

            {positionedNodes.map((node, index) => {
              const isActive = node.id === activePillar.id;
              const isRelated = relatedIds.has(node.id);
              const Icon = node.icon;

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onClick={() => selectPillar(node.id)}
                  aria-pressed={isActive}
                  aria-label={node.label}
                  className="five-pillars-node absolute left-1/2 top-1/2"
                  animate={{
                    x: node.x - ORBIT_CENTER,
                    y: node.y - ORBIT_CENTER,
                    scale: isActive ? 1.42 : isRelated ? 1.08 : 1,
                    opacity: isActive ? 1 : Math.max(0.5, 0.58 + node.depth * 0.42),
                    zIndex: isActive ? 20 : 10 + Math.round(node.depth * 8),
                  }}
                  transition={{
                    duration: autoRotate ? 0.14 : 0.68,
                    delay: autoRotate ? 0 : index * 0.02,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <span
                    className={`five-pillars-node-halo ${isActive ? "is-active" : isRelated ? "is-related" : ""}`}
                  />
                  <span
                    className={`five-pillars-node-disc ${isActive ? "is-active" : isRelated ? "is-related" : ""}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span
                    className={`five-pillars-node-label ${isActive ? "is-active" : isRelated ? "is-related" : ""}`}
                  >
                    {node.label}
                  </span>
                </motion.button>
              );
            })}

            <div className="absolute left-1/2 top-1/2 z-[12] -translate-x-1/2 -translate-y-[0.02rem]">
              <AnimatePresence mode="wait">
                <motion.article
                  key={activePillar.id}
                  className="five-pillars-card w-[30rem] rounded-[1.6rem] border"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="five-pillars-card-inner px-9 py-7">
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`five-pillars-status-chip ${getStatusClass(activePillar.status)}`}
                      >
                        {getStatusLabel(activePillar.status)}
                      </span>
                      <span className="five-pillars-card-meta">{activePillar.meta}</span>
                    </div>

                    <h3 className="mt-6 text-[2.1rem] font-medium tracking-[-0.045em] text-[var(--text-primary)]">
                      {activePillar.label}
                    </h3>

                    <p className="mt-4 max-w-[20rem] text-[1.02rem] leading-[1.75] text-[var(--text-secondary)]">
                      {activePillar.detail}
                    </p>

                    <div className="mt-6 border-t border-[var(--five-pillars-rule)] pt-5">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="five-pillars-metric-label">
                          <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {activePillar.metricLabel}
                        </span>
                        <span className="five-pillars-metric-value">
                          {activePillar.metricValue}%
                        </span>
                      </div>
                      <div className="five-pillars-meter-track">
                        <div
                          className="five-pillars-meter-fill"
                          style={{ width: `${activePillar.metricValue}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[var(--five-pillars-rule)] pt-5">
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                        <Link2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        <p className="five-pillars-connected-label">Connected Pillars</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {activePillar.relatedIds.map((relatedId) => {
                          const relatedPillar = pillars.find((pillar) => pillar.id === relatedId);

                          if (!relatedPillar) {
                            return null;
                          }

                          return (
                            <button
                              key={relatedId}
                              type="button"
                              onClick={() => selectPillar(relatedId)}
                              className="five-pillars-connected-chip"
                              aria-label={`Open ${relatedPillar.label}`}
                            >
                              <span>{relatedPillar.label}</span>
                              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>

          <div className="md:hidden">
            <div className="five-pillars-mobile-stage relative mx-auto">
              <svg
                viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <circle
                  cx={ORBIT_CENTER}
                  cy={ORBIT_CENTER}
                  r="120"
                  fill="none"
                  stroke="rgba(255, 247, 238, 0.035)"
                  strokeWidth="1"
                />
                <circle
                  cx={ORBIT_CENTER}
                  cy={ORBIT_CENTER}
                  r={ORBIT_RADIUS}
                  fill="none"
                  stroke="var(--five-pillars-orbit-stroke)"
                  strokeWidth="1.35"
                />
              </svg>

              <motion.div
                className="five-pillars-orbit-spin-layer absolute inset-[18%] rounded-full"
                animate={
                  shouldReduceMotion || !autoRotate ? undefined : { rotate: 360 }
                }
                transition={
                  shouldReduceMotion || !autoRotate
                    ? undefined
                    : {
                        duration: 80,
                        ease: "linear",
                        repeat: Number.POSITIVE_INFINITY,
                      }
                }
              />

              {positionedNodes.map((node) => {
                const isActive = node.id === activePillar.id;
                const isRelated = relatedIds.has(node.id);
                const Icon = node.icon;

                return (
                  <motion.button
                    key={`mobile-${node.id}`}
                    type="button"
                    onClick={() => selectPillar(node.id)}
                    aria-pressed={isActive}
                    aria-label={node.label}
                    className="five-pillars-node absolute left-1/2 top-1/2"
                    animate={{
                      x: node.x - ORBIT_CENTER,
                      y: node.y - ORBIT_CENTER,
                      scale: isActive ? 1.16 : isRelated ? 1.04 : 0.94,
                      opacity: isActive ? 1 : Math.max(0.54, 0.6 + node.depth * 0.28),
                    }}
                    transition={{
                      duration: autoRotate ? 0.14 : 0.58,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <span
                      className={`five-pillars-node-halo ${isActive ? "is-active" : isRelated ? "is-related" : ""}`}
                    />
                    <span
                      className={`five-pillars-node-disc ${isActive ? "is-active" : isRelated ? "is-related" : ""}`}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                  </motion.button>
                );
              })}

              <div className="absolute left-1/2 top-1/2 z-[12] -translate-x-1/2 -translate-y-[0.02rem]">
                <AnimatePresence mode="wait">
                  <motion.article
                    key={`mobile-${activePillar.id}`}
                    className="five-pillars-card five-pillars-card-mobile w-[16.25rem] rounded-[1.35rem] border"
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="five-pillars-card-inner px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`five-pillars-status-chip ${getStatusClass(activePillar.status)}`}
                        >
                          {getStatusLabel(activePillar.status)}
                        </span>
                        <span className="five-pillars-card-meta">{activePillar.meta}</span>
                      </div>
                      <h3 className="mt-4 text-[1.55rem] font-medium tracking-[-0.04em] text-[var(--text-primary)]">
                        {activePillar.label}
                      </h3>
                      <p className="mt-3 text-[0.9rem] leading-[1.65] text-[var(--text-secondary)]">
                        {activePillar.detail}
                      </p>
                    </div>
                  </motion.article>
                </AnimatePresence>
              </div>
            </div>

            <div className="five-pillars-mobile-dock mx-auto mt-6 max-w-[26rem]">
              <div className="grid gap-2.5">
                {pillars.map((pillar) => {
                  const isActive = pillar.id === activePillar.id;
                  const Icon = pillar.icon;

                  return (
                    <button
                      key={`dock-${pillar.id}`}
                      type="button"
                      onClick={() => selectPillar(pillar.id)}
                      aria-pressed={isActive}
                      aria-label={pillar.label}
                      className={`five-pillars-mobile-chip ${isActive ? "is-active" : ""}`}
                    >
                      <span className="five-pillars-mobile-chip-icon">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                      </span>
                      <span className="five-pillars-mobile-chip-copy">
                        <span className="five-pillars-mobile-chip-title">
                          {pillar.label}
                        </span>
                        <span className="five-pillars-mobile-chip-meta">
                          {pillar.meta}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
