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
    title: "Observe",
    body: "Surface relevant evidence from indexed corpora with confidence-weighted retrieval. Every source is scored, timestamped, and linked to the claim it supports.",
  },
  {
    num: "02",
    title: "Hypothesize",
    body: "Generate falsifiable causal mechanisms through contradiction-driven recombination. MASA synthesises across conflicting claims — not around them.",
  },
  {
    num: "03",
    title: "Intervene",
    body: "Execute Pearl do-calculus: simulate real-world interventions on the structural causal model. Ask not just what is correlated, but what would change if you acted.",
  },
  {
    num: "04",
    title: "Validate",
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
      className="relative flex gap-0 overflow-hidden rounded-sm border border-[var(--border-subtle)]"
      animate={
        shouldReduce
          ? {}
          : inView
          ? { backgroundColor: "var(--pipeline-stage-active-bg)", borderColor: "var(--pipeline-stage-active-border)" }
          : { backgroundColor: "var(--pipeline-stage-idle-bg)", borderColor: "var(--pipeline-stage-idle-border)" }
      }
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      initial={shouldReduce ? {} : { backgroundColor: "var(--pipeline-stage-idle-bg)" }}
    >

      {/* ── Left accent bar ────────────────────────────────────────────── */}
      <div className="relative w-px shrink-0 overflow-hidden bg-[var(--pipeline-stage-rail)]">
        <motion.div
          className="absolute inset-x-0 top-0 origin-top"
          style={{
            height: "100%",
            background: "var(--pipeline-stage-progress)",
            transformOrigin: "top",
          }}
          initial={shouldReduce ? {} : { scaleY: 0 }}
          animate={shouldReduce ? {} : inView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </div>

      {/* ── Step number ────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-start px-7 pt-8 pb-8 md:items-center md:px-10">
        <motion.span
          className="select-none font-mono leading-none tracking-[-0.05em]"
          style={{ fontSize: "clamp(2.8rem, 5vw, 4.2rem)" }}
          animate={
            shouldReduce
              ? {}
              : inView
              ? { color: "var(--pipeline-step-active-color)", scale: 1, opacity: 1 }
              : { color: "var(--pipeline-step-idle-color)", scale: 0.88, opacity: 0.45 }
          }
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {step.num}
        </motion.span>
      </div>

      {/* ── Vertical divider ───────────────────────────────────────────── */}
      <motion.div
        className="my-6 w-px shrink-0 self-stretch"
        animate={
          shouldReduce
            ? {}
            : inView
            ? { backgroundColor: "var(--pipeline-divider-active)" }
            : { backgroundColor: "var(--pipeline-divider-idle)" }
        }
        transition={{ duration: 0.55 }}
      />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <motion.div
        className="flex-1 min-w-0 px-7 py-8 md:px-10 md:py-9"
        initial={shouldReduce ? {} : { opacity: 0, y: 18 }}
        animate={
          shouldReduce ? {} : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
        }
        transition={{
          duration: 0.7,
          delay: 0.14 + index * 0.05,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <h3
          className="mb-3 font-light leading-[1.3] tracking-[-0.02em] text-[var(--text-primary)]"
          style={{
            fontFamily: "var(--font-lora, Georgia, serif)",
            fontSize: "clamp(1.05rem, 2vw, 1.3rem)",
          }}
        >
          {step.title}
        </h3>
        <p className="max-w-[40rem] text-[0.875rem] leading-[1.9] text-[var(--text-secondary)]">
          {step.body}
        </p>
      </motion.div>

      {/* ── Pipeline connector arrow (between stages, not on last) ──────── */}
      {index < total - 1 && (
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-[13px] left-[calc(2.5rem+50px)] z-10 text-[var(--accent-rust)]"
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
      <div className="mx-auto max-w-5xl px-8 md:px-12 lg:px-16">

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
        <div className="flex flex-col gap-3">
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
