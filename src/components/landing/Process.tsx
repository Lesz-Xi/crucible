"use client";

import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useRef, useState } from "react";

const steps = [
  {
    num: "01",
    title: "Ingestion",
    desc: "Raw unstructured data (PDFs, text, logs) is absorbed into the substrate.",
    note: "Substrate intake // raw corpus",
  },
  {
    num: "02",
    title: "Deconstruction",
    desc: "Information is broken down into atomic concepts, discarding noise.",
    note: "Atomic parse // noise discard",
  },
  {
    num: "03",
    title: "Synthesis",
    desc: "Atomic concepts are reassembled into novel configurations using causal logic.",
    note: "Causal recomposition // novelty route",
  },
  {
    num: "04",
    title: "Crystallization",
    desc: "The final output is calibrated for truth and novelty, then rendered.",
    note: "Calibration seal // final artifact",
  },
];

export function Process() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.82", "end 0.22"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.3,
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextIndex = Math.min(
      steps.length - 1,
      Math.max(0, Math.round(value * (steps.length - 1)))
    );
    setActiveIndex(nextIndex);
  });

  return (
    <section
      id="process"
      ref={sectionRef}
      className="hd-section bg-[var(--bg-secondary)] py-16 md:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <div className="hd-kicker mb-8 inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Protocol
          </div>
          <h2 className="hd-serif-display text-[3.6rem] text-[var(--text-primary)] md:text-[5rem]">
            The Synthesis
            <br />
            <em>Pipeline.</em>
          </h2>
          <p className="mt-8 max-w-md text-[1.08rem] leading-9 text-[var(--text-secondary)]">
            We do not simply retrieve information. We transmute it. Our pipeline
            mimics the cognitive leap of a disciplined mind, moving from
            observation to insight.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-[1.7rem] top-5 bottom-5 w-px bg-[var(--border-subtle)]" />
          <motion.div
            style={{ scaleY: progress, originY: 0 }}
            className="absolute left-[1.7rem] top-5 bottom-5 w-px bg-[linear-gradient(180deg,rgba(196,136,84,0.22),rgba(224,163,108,0.92),rgba(196,136,84,0.18))]"
          />

          <div className="space-y-8">
            {steps.map((step, index) => {
              const isActive = index === activeIndex;
              const isPassed = index < activeIndex;

              return (
                <motion.div
                  key={step.num}
                  animate={{
                    opacity: isActive ? 1 : isPassed ? 0.74 : 0.48,
                    x: isActive ? 0 : isPassed ? -2 : 8,
                    scale: isActive ? 1 : 0.985,
                  }}
                  transition={{ duration: 0.26, ease: "easeOut" }}
                  className="relative pl-20"
                >
                  <div className="absolute left-[1.12rem] top-6 z-10">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border shadow-[0_0_0_4px_rgba(15,13,11,0.76)] transition-all duration-300 ${
                        isActive
                          ? "border-[var(--border-glow)] bg-[var(--bg-elevated)]"
                          : isPassed
                            ? "border-[rgba(224,163,108,0.28)] bg-[rgba(36,31,26,0.9)]"
                            : "border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <span
                        className={`rounded-full transition-all duration-300 ${
                          isActive
                            ? "h-2.5 w-2.5 bg-[var(--accent-rust-strong)] shadow-[0_0_12px_rgba(224,163,108,0.55)]"
                            : isPassed
                              ? "h-2 w-2 bg-[rgba(224,163,108,0.82)]"
                              : "h-1.5 w-1.5 bg-[var(--accent-rust)]"
                        }`}
                      />
                    </div>
                  </div>

                  <motion.div
                    className={`rounded-[28px] border p-6 transition-all duration-300 md:p-8 ${
                      isActive
                        ? "border-[var(--border-glow)] bg-[linear-gradient(180deg,rgba(28,23,19,0.96),rgba(20,17,14,0.98))] shadow-[var(--shadow-soft)]"
                        : "border-[rgba(255,244,230,0.06)] bg-[rgba(20,17,14,0.42)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-6 border-b border-[rgba(255,244,230,0.05)] pb-4">
                      <div>
                        <p className="hd-kicker mb-3">Step {step.num}</p>
                        <h3 className="font-sans text-[2.15rem] font-semibold tracking-tight text-[var(--text-primary)]">
                          {step.title}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${
                          isActive
                            ? "border border-[var(--border-glow)] bg-[var(--accent-rust-soft)] text-[var(--accent-rust-strong)]"
                            : isPassed
                              ? "border border-[rgba(224,163,108,0.18)] bg-[rgba(196,136,84,0.06)] text-[rgba(224,163,108,0.78)]"
                              : "border border-[rgba(255,244,230,0.06)] bg-[rgba(255,244,230,0.02)] text-[var(--text-muted)]"
                        }`}
                      >
                        {isActive ? "In focus" : isPassed ? "Sealed" : "Pending"}
                      </span>
                    </div>
                    <p className="mt-5 max-w-lg text-[1rem] leading-8 text-[var(--text-secondary)]">
                      {step.desc}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[rgba(255,244,230,0.05)] pt-4">
                      <span className="rounded-full border border-[rgba(255,244,230,0.06)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {step.note}
                      </span>
                      <span
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? "w-20 bg-[linear-gradient(90deg,rgba(224,163,108,0.92),rgba(196,136,84,0.14))]"
                            : "w-10 bg-[rgba(255,244,230,0.08)]"
                        }`}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
