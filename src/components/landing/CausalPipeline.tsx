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
    signal: "Retrieval",
    status: "Source-bound",
  },
  {
    id: "hypothesize",
    title: "Hypothesize",
    descriptor: "Mechanism drafting",
    summary:
      "Contradiction pressure forces mechanism candidates to survive conflict before MASA treats them as causal structure.",
    signal: "Synthesis",
    status: "Contradiction-tested",
  },
  {
    id: "intervene",
    title: "Intervene",
    descriptor: "Interventional runtime",
    summary:
      "Counterfactual interventions are simulated on the structural graph rather than guessed from correlation or intuition.",
    signal: "Do-calculus",
    status: "Action-simulated",
  },
  {
    id: "validate",
    title: "Validate",
    descriptor: "Refutation gate",
    summary:
      "Only refuted-safe findings clear provenance, falsifiability, and audit thresholds before they reach memory or action.",
    signal: "Commit",
    status: "Refuted-safe",
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
    offset: ["start 94%", "end 18%"],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextIndex =
      value < 0.23 ? 0 : value < 0.48 ? 1 : value < 0.72 ? 2 : 3;
    setActiveIndex(nextIndex);
  });

  const lampPower = useTransform(
    scrollYProgress,
    [0.02, 0.18, 0.46, 0.74, 1],
    shouldReduceMotion ? [0.48, 0.62, 0.72, 0.68, 0.56] : [0.02, 0.12, 1, 0.78, 0.18],
  );
  const beamOpacity = useTransform(
    scrollYProgress,
    [0.03, 0.2, 0.48, 0.82, 1],
    shouldReduceMotion ? [0.16, 0.24, 0.32, 0.26, 0.18] : [0.01, 0.08, 0.66, 0.4, 0.1],
  );
  const hazeOpacity = useTransform(
    scrollYProgress,
    [0.06, 0.24, 0.5, 0.84, 1],
    shouldReduceMotion ? [0.08, 0.11, 0.15, 0.12, 0.08] : [0.01, 0.05, 0.24, 0.12, 0.03],
  );
  const boardOpacity = useTransform(
    scrollYProgress,
    [0.08, 0.28, 0.52, 0.84],
    shouldReduceMotion ? [0.88, 0.92, 0.96, 0.92] : [0.76, 0.84, 1, 0.92],
  );
  const boardY = useTransform(
    scrollYProgress,
    [0.02, 0.44, 0.86],
    shouldReduceMotion ? [0, 0, 0] : [18, 0, -4],
  );

  const stageStates = useMemo(
    () =>
      stages.map((_, index) => ({
        isActive: activeIndex === index,
        isPast: activeIndex > index,
      })),
    [activeIndex],
  );

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      className="theme-landing relative overflow-hidden bg-[var(--bg-primary)] py-32 md:py-40"
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
          className="pipeline-lamp-beam absolute left-1/2 top-[9.25rem] -translate-x-1/2"
          style={{ opacity: beamOpacity }}
        />
        <motion.div
          className="pipeline-lamp-haze absolute inset-x-[10%] top-[8rem] h-[38rem] rounded-full"
          style={{ opacity: hazeOpacity }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[96rem] px-8 md:px-12 lg:px-16">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.22fr)] lg:items-start lg:gap-16">
          <div className="pipeline-editorial max-w-[36rem] pt-12 md:pt-16 lg:pt-24">
            <div className="mb-7 flex items-center gap-3">
              <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Causal Pipeline
              </span>
            </div>
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.75rem, 5.2vw, 5.8rem)" }}
            >
              From Question <em>to Proof.</em>
            </h2>
            <p className="mt-8 max-w-[32rem] text-[1.02rem] leading-[1.95] text-[var(--text-secondary)] md:text-[1.08rem]">
              A closed-loop scientific process. Each stage is governed, traced,
              and auditable before MASA commits a conclusion to action or memory.
            </p>

            <div className="mt-10 space-y-5">
              {governanceClaims.map((claim) => (
                <div key={claim} className="pipeline-claim-row">
                  <span className="pipeline-claim-signal" aria-hidden="true" />
                  <p className="text-[0.95rem] leading-[1.72] text-[var(--text-secondary)]">
                    {claim}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="pipeline-runtime-panel mx-auto w-full max-w-[52rem] rounded-[2rem] border p-6 md:p-8 lg:mt-8"
            style={{ opacity: boardOpacity, y: boardY }}
          >
            <div className="pipeline-runtime-head">
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  Monitored Sequence
                </p>
                <p className="mt-2 text-[1.08rem] font-medium tracking-[-0.02em] text-[var(--text-primary)]">
                  Question to Proof Runtime
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-1">
              {stages.map((stage, index) => {
                const state = stageStates[index];
                return (
                  <motion.article
                    key={stage.id}
                    className={`pipeline-lane ${state.isActive ? "is-active" : state.isPast ? "is-past" : ""}`}
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: state.isActive ? 1 : state.isPast ? 0.86 : 0.66,
                          }
                    }
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="pipeline-lane-main">
                      <div className="pipeline-lane-title">
                        <span
                          className={`pipeline-lane-dot ${state.isActive ? "is-active" : state.isPast ? "is-past" : ""}`}
                          aria-hidden="true"
                        />
                        <div>
                          <h3 className="text-[1rem] font-medium tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.06rem]">
                            {stage.title}
                          </h3>
                          <p className="mt-1.5 font-mono text-[0.56rem] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                            {stage.descriptor}
                          </p>
                        </div>
                      </div>

                      <p className="pipeline-lane-summary text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
                        {stage.summary}
                      </p>
                    </div>

                    <div className="pipeline-lane-signal">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-[var(--pipeline-panel-signal-text)]">
                          {stage.signal}
                        </span>
                        <span className={`pipeline-lane-chip ${state.isActive ? "is-active" : state.isPast ? "is-past" : ""}`}>
                          {state.isActive ? "Active" : state.isPast ? "Lit" : "Idle"}
                        </span>
                      </div>
                      <div className="pipeline-lane-rail">
                        <motion.span
                          className="pipeline-lane-rail-fill"
                          animate={{
                            width: state.isActive ? "100%" : state.isPast ? "56%" : "12%",
                            opacity: state.isActive ? 1 : state.isPast ? 0.7 : 0.18,
                          }}
                          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                        {stage.status}
                      </p>
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
