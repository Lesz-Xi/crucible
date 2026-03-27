"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

// ── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: "01",
    eyebrow: "Observational Layer",
    title: "Observe",
    signal: "Retrieval",
    body: "Surface relevant evidence from indexed corpora with confidence-weighted retrieval. Every source is scored, timestamped, and linked to the claim it supports.",
  },
  {
    num: "02",
    eyebrow: "Mechanism Drafting",
    title: "Hypothesize",
    signal: "Synthesis",
    body: "Generate falsifiable causal mechanisms through contradiction-driven recombination. MASA synthesises across conflicting claims — not around them.",
  },
  {
    num: "03",
    eyebrow: "Interventional Layer",
    title: "Intervene",
    signal: "Do-Calculus",
    body: "Execute Pearl do-calculus: simulate real-world interventions on the structural causal model. Ask not just what is correlated, but what would change if you acted.",
  },
  {
    num: "04",
    eyebrow: "Refutation Gate",
    title: "Validate",
    signal: "Commit",
    body: "Gate every claim through physical-reality tests before committing to sovereign memory. Science, not plausible text generation.",
  },
];

// ── Stage panel ───────────────────────────────────────────────────────────────

interface StageProps {
  step: (typeof steps)[number];
  index: number;
  shouldReduce: boolean;
}

function StagePanel({ step, index, shouldReduce }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden rounded-[1.4rem] border border-[var(--pipeline-stage-shell-border)] bg-[var(--pipeline-stage-shell-bg)] shadow-[var(--pipeline-stage-shell-shadow)]"
      animate={
        shouldReduce
          ? {}
          : inView
          ? {
              backgroundColor: "var(--pipeline-stage-active-bg)",
              borderColor: "var(--pipeline-stage-active-border)",
              boxShadow: "var(--pipeline-stage-active-shadow)",
            }
          : {
              backgroundColor: "var(--pipeline-stage-idle-bg)",
              borderColor: "var(--pipeline-stage-idle-border)",
              boxShadow: "var(--pipeline-stage-shell-shadow)",
            }
      }
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      initial={shouldReduce ? {} : { backgroundColor: "var(--pipeline-stage-idle-bg)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--pipeline-stage-topline)]" />
      <div className="grid gap-0 md:grid-cols-[11.5rem_minmax(0,1fr)]">
        <div className="relative flex min-h-[12rem] flex-col justify-between border-b border-[var(--pipeline-divider-idle)] px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-[1.15rem] border border-[var(--pipeline-stage-badge-border)] bg-[var(--pipeline-stage-badge-bg)] shadow-[0_12px_24px_rgba(0,0,0,0.22)]">
              <motion.div
                className="absolute inset-y-3 left-3 w-px bg-[var(--pipeline-stage-badge-line)]"
                initial={shouldReduce ? {} : { scaleY: 0 }}
                animate={shouldReduce ? {} : inView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "top" }}
              />
              <motion.span
                className="absolute inset-x-0 bottom-3 text-center font-mono text-[0.78rem] tracking-[0.16em]"
                animate={
                  shouldReduce
                    ? {}
                    : inView
                    ? { color: "var(--pipeline-step-active-color)", opacity: 1 }
                    : { color: "var(--pipeline-step-idle-color)", opacity: 0.7 }
                }
                transition={{ duration: 0.45 }}
              >
                {step.num}
              </motion.span>
            </div>

            <motion.div
              className="hidden h-px flex-1 self-center bg-[var(--pipeline-stage-content-rule)] md:block"
              animate={
                shouldReduce
                  ? {}
                  : inView
                  ? { opacity: 1, scaleX: 1 }
                  : { opacity: 0.35, scaleX: 0.78 }
              }
              transition={{ duration: 0.45 }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--pipeline-stage-kicker)]">
              {step.eyebrow}
            </p>
            <div className="flex items-center gap-2.5 text-[0.7rem] uppercase tracking-[0.22em] text-[var(--pipeline-stage-signal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--pipeline-stage-signal-dot)] shadow-[0_0_10px_rgba(200,150,90,0.32)]" />
              <span>{step.signal}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-px w-7 bg-[var(--pipeline-stage-content-rule)]" />
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--pipeline-stage-index)]">
                Stage {step.num}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          className="relative min-w-0 px-6 py-6 md:px-8 md:py-8"
          initial={shouldReduce ? {} : { opacity: 0, y: 18 }}
          animate={shouldReduce ? {} : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{
            duration: 0.7,
            delay: 0.14 + index * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            className="mb-6 flex items-start justify-between gap-6"
            animate={
              shouldReduce
                ? {}
                : inView
                ? { opacity: 1, y: 0 }
                : { opacity: 0.7, y: 10 }
            }
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-3">
              <h3
                className="font-light leading-[1.04] tracking-[-0.04em] text-[var(--text-primary)]"
                style={{
                  fontFamily: "var(--font-lora, Georgia, serif)",
                  fontSize: "clamp(1.8rem, 2.35vw, 2.8rem)",
                }}
              >
                {step.title}
              </h3>
              <div className="h-px w-20 bg-[var(--pipeline-stage-content-rule)]" />
            </div>

            <div className="hidden min-w-[7.25rem] items-center justify-end gap-3 md:flex">
              <div className="h-px w-12 bg-[var(--pipeline-stage-content-rule)]" />
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.26em] text-[var(--pipeline-stage-index)]">
                0{index + 1}
              </span>
            </div>
          </motion.div>

          <p className="max-w-[48rem] text-[1rem] leading-[1.95] text-[var(--text-secondary)] md:text-[1.02rem]">
            {step.body}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export function CausalPipeline() {
  const shouldReduce = useReducedMotion();

  // Header scan line — draws left → right as section enters viewport
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: headerProgress } = useScroll({
    target: headerRef,
    offset: ["start 85%", "start 30%"],
  });
  const lineScaleX = useTransform(headerProgress, [0, 1], [0, 1]);

  return (
    <section
      id="pipeline"
      className="hd-section bg-[var(--bg-primary)] py-28 md:py-36"
    >
      <div className="mx-auto max-w-[86rem] px-8 md:px-12 lg:px-16">

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div ref={headerRef} className="mb-16">
          <p className="hd-kicker mb-4 uppercase">Causal Pipeline</p>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.6rem, 5vw, 4.9rem)" }}
            >
              From Question{" "}
              <em className="italic text-[var(--accent-rust)]">to Proof.</em>
            </h2>

            <p className="max-w-[27rem] text-[0.92rem] leading-[1.9] text-[var(--text-muted)] md:text-right md:pb-2">
              A closed-loop scientific process. Each stage is governed,
              traced, and auditable.
            </p>
          </div>

          {/* Animated scan line */}
          <div className="mt-8 h-px w-full overflow-hidden bg-[var(--pipeline-header-rail)]">
            {!shouldReduce && (
              <motion.div
                className="h-full origin-left"
                style={{
                  scaleX: lineScaleX,
                  background: "var(--pipeline-header-progress)",
                }}
              />
            )}
          </div>
        </div>

        {/* ── Pipeline stages ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 md:gap-6">
          {steps.map((step, i) => (
            <StagePanel
              key={step.num}
              step={step}
              index={i}
              shouldReduce={Boolean(shouldReduce)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
