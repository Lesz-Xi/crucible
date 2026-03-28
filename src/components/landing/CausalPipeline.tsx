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
  status: string;
};

const stages: readonly StageDefinition[] = [
  {
    id: "observe",
    title: "Observe",
    descriptor: "Observational intake",
    summary:
      "Retrieval lanes surface traceable evidence, score each source, and bind every claim to an auditable substrate.",
    signal: "RETRIEVAL",
    status: "SOURCE-BOUND",
  },
  {
    id: "hypothesize",
    title: "Hypothesize",
    descriptor: "Mechanism drafting",
    summary:
      "Contradiction pressure forces mechanism candidates to survive conflict before MASA treats them as causal structure.",
    signal: "SYNTHESIS",
    status: "CONTRADICTION-TESTED",
  },
  {
    id: "intervene",
    title: "Intervene",
    descriptor: "Interventional runtime",
    summary:
      "Counterfactual interventions are simulated on the structural graph rather than guessed from correlation or intuition.",
    signal: "DO-CALCULUS",
    status: "ACTION-SIMULATED",
  },
  {
    id: "validate",
    title: "Validate",
    descriptor: "Refutation gate",
    summary:
      "Only refuted-safe findings clear provenance, falsifiability, and audit thresholds before they reach memory or action.",
    signal: "COMMIT",
    status: "REFUTED-SAFE",
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
    offset: ["start 88%", "end 24%"],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextIndex =
      value < 0.22 ? 0 : value < 0.43 ? 1 : value < 0.66 ? 2 : 3;
    setActiveIndex(nextIndex);
  });

  const lampPower = useTransform(
    scrollYProgress,
    [0.02, 0.18, 0.46, 0.76, 0.96],
    shouldReduceMotion ? [0.58, 0.72, 0.82, 0.76, 0.62] : [0.04, 0.18, 1, 0.72, 0.18],
  );
  const beamOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.22, 0.48, 0.82, 1],
    shouldReduceMotion ? [0.22, 0.34, 0.42, 0.36, 0.26] : [0.02, 0.16, 0.76, 0.44, 0.12],
  );
  const hazeOpacity = useTransform(
    scrollYProgress,
    [0.08, 0.26, 0.52, 0.84, 1],
    shouldReduceMotion ? [0.08, 0.14, 0.18, 0.14, 0.1] : [0.01, 0.08, 0.26, 0.16, 0.04],
  );
  const boardGlowOpacity = useTransform(
    scrollYProgress,
    [0.12, 0.34, 0.58, 0.9],
    shouldReduceMotion ? [0.08, 0.14, 0.18, 0.14] : [0.02, 0.08, 0.26, 0.08],
  );
  const boardShadow = useTransform(
    boardGlowOpacity,
    [0, 1],
    [
      "0 22px 44px rgba(0,0,0,0.28)",
      "0 36px 110px rgba(0,0,0,0.56), 0 0 90px rgba(224,180,118,0.1)",
    ],
  );

  const stageStates = useMemo(
    () =>
      stages.map((_, index) => ({
        isActive: activeIndex === index,
        isLit: activeIndex >= index,
      })),
    [activeIndex],
  );

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      className="theme-landing hd-section relative overflow-hidden bg-[var(--bg-primary)] py-32 md:py-40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full">
        <div className="pipeline-lamp-wire absolute left-1/2 top-0 h-40 -translate-x-1/2" />
        <motion.div
          className="pipeline-lamp-head absolute left-1/2 top-36 -translate-x-1/2"
          style={{ opacity: lampPower }}
        >
          <div className="pipeline-lamp-cap" />
          <div className="pipeline-lamp-bulb" />
        </motion.div>
        <motion.div
          className="pipeline-lamp-beam absolute left-1/2 top-[9.35rem] -translate-x-1/2"
          style={{ opacity: beamOpacity }}
        />
        <motion.div
          className="pipeline-lamp-haze absolute inset-x-[6%] top-[7.8rem] h-[40rem] rounded-full"
          style={{ opacity: hazeOpacity }}
        />
        <motion.div
          className="pipeline-section-glow absolute inset-x-[18%] top-[14rem] h-[28rem] rounded-full"
          style={{ opacity: boardGlowOpacity }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[96rem] px-8 md:px-12 lg:px-16">
        <div className="pipeline-copy-cluster mx-auto max-w-[78rem] text-center">
          <div className="mb-7 flex items-center justify-center gap-3">
            <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Causal Pipeline
            </span>
          </div>
          <h2
            className="hd-serif-display text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2.9rem, 6vw, 6.2rem)" }}
          >
            From Question <em>to Proof.</em>
          </h2>
          <p className="mx-auto mt-8 max-w-[46rem] text-[1rem] leading-[1.9] text-[var(--text-secondary)] md:text-[1.06rem]">
            A closed-loop scientific process. Each stage is governed, traced, and
            auditable before MASA commits a conclusion to action or memory.
          </p>

          <div className="pipeline-claims-grid mx-auto mt-10 grid max-w-[72rem] gap-x-10 gap-y-5 text-left md:grid-cols-2 xl:grid-cols-4">
            {governanceClaims.map((claim) => (
              <div key={claim} className="pipeline-claim-row">
                <span className="pipeline-claim-signal" aria-hidden="true" />
                <p className="text-[0.92rem] leading-[1.68] text-[var(--text-secondary)]">
                  {claim}
                </p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          className="pipeline-runtime-shell relative mx-auto mt-16 max-w-[92rem] overflow-hidden rounded-[2rem] border px-5 py-5 md:mt-20 md:px-8 md:py-7"
          style={{ boxShadow: boardShadow }}
        >
          <div className="pipeline-runtime-header mb-5 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Monitored Sequence
              </p>
              <p className="mt-2 text-[1.06rem] font-medium tracking-[-0.02em] text-[var(--text-primary)]">
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

          <div className="space-y-3">
            {stages.map((stage, index) => {
              const state = stageStates[index];

              return (
                <motion.article
                  key={stage.id}
                  className={`pipeline-runtime-row pipeline-runtime-lane rounded-[1.15rem] border px-5 py-4 md:px-6 ${state.isActive ? "is-active" : state.isLit ? "is-lit" : "is-idle"}`}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          borderColor: state.isActive
                            ? "var(--pipeline-panel-active-border)"
                            : state.isLit
                              ? "rgba(224,180,118,0.13)"
                              : "var(--pipeline-panel-idle-border)",
                          backgroundColor: state.isActive
                            ? "var(--pipeline-panel-active-bg)"
                            : "var(--pipeline-panel-idle-bg)",
                        }
                  }
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(12rem,0.82fr)_minmax(24rem,2fr)_minmax(14rem,0.8fr)] xl:items-center xl:gap-8">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={`pipeline-row-indicator ${state.isActive ? "is-active" : state.isLit ? "is-lit" : ""}`}
                          aria-hidden="true"
                        />
                        <h3 className="text-[1.03rem] font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                          {stage.title}
                        </h3>
                      </div>
                      <p className="mt-2.5 font-mono text-[0.56rem] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                        {stage.descriptor}
                      </p>
                    </div>

                    <p className="min-w-0 text-[0.95rem] leading-[1.7] text-[var(--text-secondary)]">
                      {stage.summary}
                    </p>

                    <div className="min-w-0 xl:pl-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[var(--pipeline-panel-signal-text)]">
                          {stage.signal}
                        </span>
                        <span
                          className={`pipeline-row-chip ${state.isActive ? "is-active" : state.isLit ? "is-lit" : ""}`}
                        >
                          {state.isActive ? "ACTIVE" : state.isLit ? "LIT" : "IDLE"}
                        </span>
                      </div>
                      <div className="pipeline-row-rail mt-3">
                        <motion.span
                          className="pipeline-row-rail-fill"
                          animate={{
                            width: state.isActive ? "100%" : state.isLit ? "62%" : "14%",
                            opacity: state.isActive ? 1 : state.isLit ? 0.74 : 0.18,
                          }}
                          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <p className="mt-2.5 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                        {stage.status}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
