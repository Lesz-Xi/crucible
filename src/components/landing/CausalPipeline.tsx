"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

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
    offset: ["start 90%", "end 18%"],
  });

  const lampPower = useTransform(
    scrollYProgress,
    [0.01, 0.16, 0.42, 0.76, 1],
    shouldReduceMotion ? [0.52, 0.66, 0.78, 0.72, 0.6] : [0.04, 0.14, 1, 0.82, 0.24],
  );
  const beamOpacity = useTransform(
    scrollYProgress,
    [0.02, 0.18, 0.44, 0.78, 1],
    shouldReduceMotion ? [0.12, 0.18, 0.24, 0.2, 0.14] : [0.01, 0.05, 0.34, 0.2, 0.06],
  );
  const hazeOpacity = useTransform(
    scrollYProgress,
    [0.04, 0.22, 0.46, 0.82, 1],
    shouldReduceMotion ? [0.08, 0.1, 0.14, 0.1, 0.08] : [0.01, 0.04, 0.18, 0.09, 0.03],
  );
  const boardOpacity = useTransform(
    scrollYProgress,
    [0.06, 0.24, 0.46, 0.82],
    shouldReduceMotion ? [0.9, 0.94, 0.98, 0.94] : [0.78, 0.88, 1, 0.94],
  );
  const panelLightOpacity = useTransform(
    lampPower,
    [0, 0.2, 0.65, 1],
    shouldReduceMotion ? [0.22, 0.28, 0.34, 0.38] : [0.04, 0.1, 0.3, 0.48],
  );
  const panelReflectionOpacity = useTransform(
    lampPower,
    [0, 0.22, 0.62, 1],
    shouldReduceMotion ? [0.18, 0.24, 0.28, 0.3] : [0.02, 0.06, 0.22, 0.34],
  );
  const featuredOpacity = useTransform(
    lampPower,
    [0, 0.25, 0.6, 1],
    shouldReduceMotion ? [0.08, 0.1, 0.12, 0.14] : [0.02, 0.04, 0.08, 0.14],
  );
  const boardY = useTransform(
    scrollYProgress,
    [0.02, 0.42, 0.86],
    shouldReduceMotion ? [0, 0, 0] : [18, 0, -4],
  );

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      className="theme-landing relative overflow-hidden bg-[var(--bg-primary)] py-32 md:py-40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        <div className="pipeline-lamp-wire absolute left-1/2 top-0 h-28 -translate-x-1/2" />
        <motion.div
          className="pipeline-lamp-head absolute left-1/2 top-[5.5rem] -translate-x-1/2"
          style={{ opacity: lampPower }}
        >
          <div className="pipeline-lamp-cap" />
          <div className="pipeline-lamp-bulb" />
        </motion.div>
        <motion.div
          className="pipeline-lamp-beam absolute left-1/2 top-[4.75rem] -translate-x-1/2"
          style={{ opacity: beamOpacity }}
        />
        <motion.div
          className="pipeline-lamp-haze absolute inset-x-[-4%] top-[3.5rem] h-[42rem] rounded-full"
          style={{ opacity: hazeOpacity }}
        />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-8 md:px-12 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.06fr)] lg:items-start lg:gap-10 xl:gap-12">
          <div className="pipeline-editorial max-w-[36rem] pt-12 md:pt-16 lg:pt-24">
            <div className="mb-7 flex items-center gap-3">
              <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Causal Pipeline
              </span>
            </div>
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.45rem, 4.6vw, 5.05rem)", lineHeight: 0.96 }}
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
                  <span className="pipeline-claim-rule" aria-hidden="true" />
                  <p className="text-[0.95rem] leading-[1.72] text-[var(--text-secondary)]">
                    {claim}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="pipeline-runtime-panel mx-auto w-full max-w-[46rem] rounded-[2rem] border p-5 md:p-6 lg:mt-8"
            style={{
              opacity: boardOpacity,
              y: boardY,
              ["--pipeline-panel-light-opacity" as string]: panelLightOpacity,
              ["--pipeline-panel-reflection-opacity" as string]: panelReflectionOpacity,
              ["--pipeline-feature-opacity" as string]: featuredOpacity,
            }}
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
                const isFeatured = index === 2;
                return (
                  <motion.article
                    key={stage.id}
                    className={`pipeline-lane ${isFeatured ? "is-featured" : ""}`}
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: isFeatured ? 1 : 0.9,
                          }
                    }
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="pipeline-lane-main">
                      <div className="pipeline-lane-title">
                        <span className="pipeline-lane-dot is-active" aria-hidden="true" />
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
                        <span className={`pipeline-lane-chip ${isFeatured ? "is-active" : ""}`}>
                          {isFeatured ? "Primary" : "Online"}
                        </span>
                      </div>
                      <div className="pipeline-lane-rail">
                        <motion.span
                          className="pipeline-lane-rail-fill"
                          animate={{
                            width: isFeatured ? "78%" : "62%",
                            opacity: isFeatured ? 0.9 : 0.56,
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
