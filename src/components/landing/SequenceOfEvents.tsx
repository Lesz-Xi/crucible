"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

// ── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    id: "01",
    verb: "INGEST",
    title: "Index your corpus",
    body: "Research papers, PDFs, web sources — MASA extracts entities, relationships, and raw causal claims. Every document becomes a node in the knowledge graph.",
  },
  {
    id: "02",
    verb: "RETRIEVE",
    title: "Confidence-weighted evidence",
    body: "Rejection-aware RAG surfaces only the evidence that survives scrutiny. Each retrieved fragment carries a source score, a temporal decay factor, and a contradiction flag.",
  },
  {
    id: "03",
    verb: "SYNTHESIZE",
    title: "Contradict and recombine",
    body: "Contradiction detection drives hypothesis generation. MASA builds structural causal models from conflict, not consensus — then tests their logical coherence.",
  },
  {
    id: "04",
    verb: "VALIDATE",
    title: "Pearl do-calculus",
    body: "Counterfactual simulation. Intervention framing. Every candidate conclusion is interrogated through the causal graph before it leaves the synthesis engine.",
  },
  {
    id: "05",
    verb: "COMMIT",
    title: "Sovereign memory update",
    body: "Only claims that pass the falsifiability gate enter long-term memory. The full provenance trail — sources, reasoning steps, confidence deltas — is persisted alongside.",
  },
];

// ── Individual step row ───────────────────────────────────────────────────────

interface StepProps {
  step: (typeof steps)[number];
  index: number;
  shouldReduce: boolean;
}

function StepRow({ step, index, shouldReduce }: StepProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, { margin: "-15% 0px" });
  const [isActivated, setIsActivated] = useState(false);
  const isContentVisible = inView;
  const { scrollY } = useScroll();

  useEffect(() => {
    const updateActivation = () => {
      if (!rowRef.current) return;
      const threshold = window.innerHeight * 0.4;
      const { top } = rowRef.current.getBoundingClientRect();
      setIsActivated(top <= threshold);
    };

    updateActivation();
    window.addEventListener("resize", updateActivation);
    return () => window.removeEventListener("resize", updateActivation);
  }, []);

  useMotionValueEvent(scrollY, "change", () => {
    if (!rowRef.current) return;
    const threshold = window.innerHeight * 0.4;
    const { top } = rowRef.current.getBoundingClientRect();
    setIsActivated(top <= threshold);
  });

  return (
    <div ref={rowRef} className="relative flex gap-8 md:gap-14 pb-16 last:pb-0">

      {/* ── Left: dot + label ─────────────────────────────────────────── */}
      <div className="relative z-10 flex shrink-0 flex-col items-center">

        {/* Dot — activates amber when step enters view */}
        <motion.div
          className="h-5 w-5 rounded-full border-[1.5px] flex items-center justify-center"
          animate={
            shouldReduce
              ? {}
              : isActivated
              ? {
                  borderColor: "rgba(200,150,90,0.9)",
                  backgroundColor: "rgba(200,150,90,0.08)",
                  boxShadow:
                    "0 0 0 4px rgba(200,150,90,0.08), 0 0 16px rgba(200,150,90,0.35)",
                  scale: 1,
                }
              : {
                  borderColor: "rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(28,25,23,0.9)",
                  boxShadow: "none",
                  scale: 0.85,
                }
          }
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Inner pip */}
          <motion.div
            className="h-1.5 w-1.5 rounded-full"
            animate={
              shouldReduce
                ? {}
                : isActivated
                ? { backgroundColor: "rgba(200,150,90,1)", opacity: 1 }
                : { backgroundColor: "rgba(255,255,255,0.2)", opacity: 0.4 }
            }
            transition={{ duration: 0.4, delay: 0.1 }}
          />
        </motion.div>

        {/* Step ID under dot */}
        <motion.span
          className="mt-2 font-mono text-[0.52rem] tracking-[0.22em] tabular-nums"
          animate={
            shouldReduce ? {} : isActivated
              ? { color: "rgba(200,150,90,0.7)", opacity: 1 }
              : { color: "rgba(255,255,255,0.15)", opacity: 0.5 }
          }
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {step.id}
        </motion.span>
      </div>

      {/* ── Right: verb + title + body ────────────────────────────────── */}
      <motion.div
        className="flex-1 min-w-0 pt-0.5"
        initial={shouldReduce ? {} : { opacity: 0, x: 28 }}
        animate={
          shouldReduce
            ? {}
            : isContentVisible
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: 28 }
        }
        transition={{
          duration: 0.7,
          delay: 0.12 + index * 0.04,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Verb */}
        <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--accent-rust)]">
          {step.verb}
        </p>

        {/* Title */}
        <h3
          className="mb-4 font-light leading-[1.3] tracking-[-0.02em] text-[var(--text-primary)]"
          style={{
            fontFamily: "var(--font-lora, Georgia, serif)",
            fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
          }}
        >
          {step.title}
        </h3>

        {/* Body */}
        <p className="max-w-[46rem] text-[0.88rem] leading-[1.9] text-[var(--text-secondary)]">
          {step.body}
        </p>

        {/* Divider */}
        {index < steps.length - 1 && (
          <div className="mt-12 h-px w-full max-w-[46rem] bg-[var(--border-subtle)] opacity-50" />
        )}
      </motion.div>

      {/* Ghost step number — editorial watermark */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-[-0.2em] select-none font-mono text-[6rem] font-bold leading-none tracking-tight text-[var(--text-primary)] opacity-[0.025] md:text-[8rem]"
        initial={shouldReduce ? {} : { opacity: 0 }}
        animate={
          shouldReduce ? {} : isActivated ? { opacity: 0.025 } : { opacity: 0 }
        }
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        {step.id}
      </motion.span>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export function SequenceOfEvents() {
  const shouldReduce = useReducedMotion();

  // Scroll-driven line progress — tracks the full section
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 30%"],
  });

  // scaleY 0→1 drives the amber progress line
  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="sequence"
      className="hd-section bg-[var(--bg-primary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-4xl px-8 md:px-12 lg:px-16">

        {/* ── Section header ─────────────────────────────────────────────── */}
        <motion.div
          className="mb-20"
          initial={shouldReduce ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="hd-kicker mb-4 uppercase">The Mechanism</p>
          <h2
            className="hd-serif-display text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}
          >
            Sequence of Events.
          </h2>
          <p className="mt-5 max-w-[36rem] text-[0.9rem] leading-[1.8] text-[var(--text-muted)]">
            How a research question becomes a validated causal conclusion —
            every stage governed, every transition auditable.
          </p>
        </motion.div>

        {/* ── Timeline ───────────────────────────────────────────────────── */}
        {/* pl-[2.5rem] aligns content with dot center = 10px dot + 8px gap + rest */}
        <div ref={timelineRef} className="relative pl-[2.5rem]">

          {/* Background track — always visible, shows full path */}
          <div
            aria-hidden="true"
            className="absolute left-[9px] top-0 h-full w-px"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />

          {/* Animated amber progress fill */}
          {!shouldReduce && (
            <motion.div
              aria-hidden="true"
              className="absolute left-[9px] top-0 w-px origin-top"
              style={{
                scaleY: lineScaleY,
                height: "100%",
                background:
                  "linear-gradient(to bottom, rgba(200,150,90,0.9) 0%, rgba(200,150,90,0.55) 60%, rgba(200,150,90,0.15) 100%)",
              }}
            />
          )}

          {/* Steps */}
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
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
