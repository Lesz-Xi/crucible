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
  total: number;
  shouldReduce: boolean;
}

function StagePanel({ step, index, total, shouldReduce }: StageProps) {
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
      <div className="grid gap-0 md:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="relative flex min-h-[10.5rem] flex-col justify-between border-b border-[var(--pipeline-divider-idle)] px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-7">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[var(--pipeline-stage-badge-border)] bg-[var(--pipeline-stage-badge-bg)]">
            <motion.div
              className="absolute inset-y-2 left-2 w-px bg-[var(--pipeline-stage-badge-line)]"
              initial={shouldReduce ? {} : { scaleY: 0 }}
              animate={shouldReduce ? {} : inView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top" }}
            />
            <motion.span
              className="absolute inset-x-0 bottom-2 text-center font-mono text-[0.8rem] tracking-[0.16em]"
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

          <div className="space-y-2">
            <p className="hd-kicker text-[var(--pipeline-stage-kicker)]">{step.eyebrow}</p>
            <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.24em] text-[var(--pipeline-stage-signal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--pipeline-stage-signal-dot)]" />
              <span>{step.signal}</span>
            </div>
          </div>
        </div>

        <motion.div
          className="relative min-w-0 px-6 py-6 md:px-8 md:py-7"
          initial={shouldReduce ? {} : { opacity: 0, y: 18 }}
          animate={shouldReduce ? {} : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{
            duration: 0.7,
            delay: 0.14 + index * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            className="mb-5 flex items-center justify-between gap-4"
            animate={
              shouldReduce
                ? {}
                : inView
                ? { opacity: 1, y: 0 }
                : { opacity: 0.7, y: 10 }
            }
            transition={{ duration: 0.5 }}
          >
            <h3
              className="font-light leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]"
              style={{
                fontFamily: "var(--font-lora, Georgia, serif)",
                fontSize: "clamp(1.45rem, 2vw, 2rem)",
              }}
            >
              {step.title}
            </h3>
            <div className="hidden items-center gap-3 md:flex">
              <div className="h-px w-16 bg-[var(--pipeline-stage-content-rule)]" />
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[var(--pipeline-stage-index)]">
                Stage {step.num}
              </span>
            </div>
          </motion.div>

          <p className="max-w-[46rem] text-[0.96rem] leading-[1.95] text-[var(--text-secondary)]">
            {step.body}
          </p>
        </motion.div>
      </div>

      {/* ── Pipeline connector arrow (between stages, not on last) ──────── */}
      {index < total - 1 && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[15px] left-10 text-[var(--accent-rust)] md:left-[7.2rem]"
          initial={shouldReduce ? {} : { opacity: 0, y: -4 }}
          animate={
            shouldReduce ? {} : inView ? { opacity: 0.55, y: 0 } : { opacity: 0, y: -4 }
          }
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1L7 10M7 10L3 6.5M7 10L11 6.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
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
      className="hd-section bg-[var(--bg-primary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div ref={headerRef} className="mb-14">
          <p className="hd-kicker mb-4 uppercase">Causal Pipeline</p>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}
            >
              From Question{" "}
              <em className="italic text-[var(--accent-rust)]">to Proof.</em>
            </h2>

            <p className="max-w-[24rem] text-[0.875rem] leading-[1.8] text-[var(--text-muted)] md:text-right md:pb-1">
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
        <div className="flex flex-col gap-4 md:gap-5">
          {steps.map((step, i) => (
            <StagePanel
              key={step.num}
              step={step}
              index={i}
              total={steps.length}
              shouldReduce={Boolean(shouldReduce)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
