"use client";

import { useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

type StageDefinition = {
  id: string;
  title: string;
  descriptor: string;
  summary: string;
  signal: string;
};

const stages: readonly StageDefinition[] = [
  {
    id: "observe",
    title: "Observe",
    descriptor: "Observational intake",
    summary:
      "Retrieval lanes surface traceable evidence, score each source, and bind every claim to an auditable substrate.",
    signal: "RETRIEVAL",
  },
  {
    id: "hypothesize",
    title: "Hypothesize",
    descriptor: "Mechanism drafting",
    summary:
      "Contradiction pressure forces mechanism candidates to survive conflict before MASA treats them as causal structure.",
    signal: "SYNTHESIS",
  },
  {
    id: "intervene",
    title: "Intervene",
    descriptor: "Interventional runtime",
    summary:
      "Do-calculus lanes simulate action on the graph, separating plausible intervention effects from observational drift.",
    signal: "DO-CALCULUS",
  },
  {
    id: "validate",
    title: "Validate",
    descriptor: "Refutation gate",
    summary:
      "Every conclusion is stress-tested against provenance, falsifiability, and audit rules before memory commit.",
    signal: "COMMIT",
  },
] as const;

const governanceClaims = [
  "Evidence enters with source, time, and scoring intact.",
  "Contradiction is preserved until a mechanism survives it.",
  "Interventions are simulated on structure, not guessed from correlation.",
  "Only refuted-safe findings reach memory or action.",
] as const;

export function CausalPipeline() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextIndex =
      value < 0.36 ? 0 : value < 0.54 ? 1 : value < 0.72 ? 2 : 3;
    setActiveIndex(nextIndex);
  });

  const lampIntensity = useTransform(
    scrollYProgress,
    [0.08, 0.38, 0.58, 0.82],
    shouldReduceMotion ? [0.44, 0.64, 0.76, 0.76] : [0.18, 0.38, 1, 0.62],
  );
  const beamOpacity = useTransform(
    scrollYProgress,
    [0.08, 0.4, 0.62, 0.84],
    shouldReduceMotion ? [0.24, 0.32, 0.4, 0.4] : [0.06, 0.18, 0.44, 0.28],
  );
  const hazeOpacity = useTransform(
    scrollYProgress,
    [0.12, 0.46, 0.66, 0.88],
    shouldReduceMotion ? [0.16, 0.2, 0.24, 0.24] : [0.04, 0.12, 0.28, 0.18],
  );
  const panelGlow = useTransform(
    scrollYProgress,
    [0.14, 0.44, 0.66, 0.92],
    shouldReduceMotion ? [0.1, 0.14, 0.18, 0.18] : [0.03, 0.08, 0.22, 0.14],
  );
  const bulbShadow = useTransform(
    lampIntensity,
    [0, 1],
    [
      "0 0 0 rgba(224,180,118,0)",
      "0 0 20px rgba(224,180,118,0.38), 0 0 44px rgba(224,180,118,0.2)",
    ],
  );
  const panelShadow = useTransform(
    panelGlow,
    [0, 1],
    [
      "0 24px 48px rgba(0,0,0,0.28)",
      "0 26px 68px rgba(0,0,0,0.42), 0 0 48px rgba(224,180,118,0.08)",
    ],
  );

  const signalTimeline = useMemo(
    () => stages.map((_, index) => (activeIndex >= index ? "active" : "idle")),
    [activeIndex],
  );

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      className="theme-landing hd-section relative overflow-hidden bg-[var(--bg-primary)] py-32 md:py-40"
    >
      <div className="pipeline-lamp-anchor pointer-events-none absolute inset-x-0 top-0 z-0 h-full">
        <div className="pipeline-lamp-wire absolute left-1/2 top-0 h-28 -translate-x-1/2" />
        <motion.div
          className="pipeline-lamp-head absolute left-1/2 top-24 -translate-x-1/2"
          style={{ opacity: lampIntensity }}
        >
          <div className="pipeline-lamp-cap" />
          <motion.div
            className="pipeline-lamp-bulb"
            style={{ opacity: lampIntensity, boxShadow: bulbShadow }}
          />
        </motion.div>
        <motion.div
          className="pipeline-lamp-beam absolute left-1/2 top-[6.85rem] -translate-x-1/2"
          style={{ opacity: beamOpacity }}
        />
        <motion.div
          className="pipeline-lamp-haze absolute inset-x-[8%] top-20 h-[36rem] rounded-full"
          style={{ opacity: hazeOpacity }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[86rem] px-8 md:px-12 lg:px-16">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1.08fr)] lg:gap-20">
          <div className="max-w-[33rem] pt-16 md:pt-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Causal Pipeline
              </span>
            </div>
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.3rem, 4vw, 4.6rem)" }}
            >
              From Question <em>to Proof.</em>
            </h2>
            <p className="mt-6 max-w-[28rem] text-[1rem] leading-[1.9] text-[var(--text-secondary)]">
              A closed-loop scientific process. Each stage is governed, traced, and
              auditable before MASA commits a conclusion to action or memory.
            </p>

            <div className="mt-10 space-y-5">
              {governanceClaims.map((claim) => (
                <div key={claim} className="pipeline-claim-row">
                  <span className="pipeline-claim-signal" aria-hidden="true" />
                  <p className="text-[0.98rem] leading-[1.85] text-[var(--text-secondary)]">
                    {claim}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="pipeline-control-shell relative mx-auto w-full max-w-[42rem] rounded-[2rem] border p-5 md:p-7"
            style={{ boxShadow: panelShadow }}
          >
            <div className="pipeline-control-header flex items-center justify-between gap-6 border-b pb-5">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                  Monitored Sequence
                </p>
                <p className="mt-2 text-[1.05rem] font-medium tracking-[-0.02em] text-[var(--text-primary)]">
                  Question to Proof Runtime
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="pipeline-status-chip">AUDITABLE</span>
                <span className="pipeline-status-chip pipeline-status-chip-muted">
                  PCH LAYERED
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {stages.map((stage, index) => {
                const isActive = signalTimeline[index] === "active";
                return (
                  <motion.article
                    key={stage.id}
                    className={`pipeline-control-row rounded-[1.5rem] border p-4 md:p-5 ${isActive ? "is-active" : "is-idle"}`}
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            borderColor: isActive
                              ? "var(--pipeline-panel-active-border)"
                              : "var(--pipeline-panel-idle-border)",
                            backgroundColor: isActive
                              ? "var(--pipeline-panel-active-bg)"
                              : "var(--pipeline-panel-idle-bg)",
                          }
                    }
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className={`pipeline-row-indicator ${isActive ? "is-active" : ""}`}
                            aria-hidden="true"
                          />
                          <div>
                            <p className="text-[1.05rem] font-medium tracking-[-0.02em] text-[var(--text-primary)] md:text-[1.15rem]">
                              {stage.title}
                            </p>
                            <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                              {stage.descriptor}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pipeline-row-status min-w-[8rem]">
                        <span className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                          {isActive ? "Lit lane" : "Standby"}
                        </span>
                        <div className="pipeline-row-rail mt-2">
                          <motion.span
                            className="pipeline-row-rail-fill"
                            animate={{
                              width: isActive ? "100%" : "36%",
                              opacity: isActive ? 1 : 0.35,
                            }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-[1.8] text-[var(--text-secondary)]">
                      {stage.summary}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--pipeline-panel-signal-text)]">
                        {stage.signal}
                      </span>
                      <span
                        className={`pipeline-row-chip ${isActive ? "is-active" : ""}`}
                      >
                        {isActive ? "ACTIVE CHANNEL" : "QUEUED"}
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
