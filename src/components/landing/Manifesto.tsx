"use client";

import { motion, useReducedMotion } from "framer-motion";

const metrics = [
  { value: "Pearl SCM", label: "Causal Framework" },
  { value: "do-calculus", label: "Intervention Logic" },
  { value: "3-agent", label: "Critique Pipeline" },
  { value: "Falsifiable", label: "Commitment Gate" },
];

export function Manifesto() {
  const shouldReduce = useReducedMotion();

  const Wrap = shouldReduce ? "div" : motion.div;

  return (
    <section className="hd-section bg-[var(--bg-primary)] py-28 md:py-36">
      <div className="mx-auto max-w-5xl px-8 md:px-12 lg:px-16">
        {/* Rule */}
        <div className="mb-12 h-px bg-gradient-to-r from-[var(--accent-rust)]/40 via-[var(--border-subtle)] to-transparent" />

        {/* Kicker */}
        <p className="hd-kicker mb-8 uppercase">Manifesto</p>

        {/* Main quote */}
        <Wrap
          {...(shouldReduce
            ? {}
            : {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
              })}
        >
          <blockquote
            className="hd-serif-display max-w-4xl text-[var(--text-primary)]"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3.2rem)" }}
          >
            Institutional&#8209;grade rigor.{" "}
            <em className="italic text-[var(--accent-rust)]">
              Neural&#8209;speed synthesis.
            </em>
          </blockquote>
        </Wrap>

        {/* Body */}
        <Wrap
          {...(shouldReduce
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: {
                  duration: 0.85,
                  delay: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                },
              })}
          className="mt-8 max-w-[42rem]"
        >
          <p className="text-[1rem] leading-[1.85] text-[var(--text-secondary)]">
            Science has always moved forward through disciplined contradiction.
            MASA automates the infrastructure of causal discovery — so
            researchers spend their time at the frontier, not the pipeline.
            Every hypothesis is generated, critiqued, and validated against
            physical reality before it becomes a claim.
          </p>
        </Wrap>

        {/* Metrics row */}
        <Wrap
          {...(shouldReduce
            ? {}
            : {
                initial: { opacity: 0 },
                whileInView: { opacity: 1 },
                viewport: { once: true },
                transition: { duration: 0.7, delay: 0.3 },
              })}
          className="mt-16 hd-meta-row border-t border-[var(--border-subtle)] pt-10"
        >
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-1.5">
              <span
                className="text-[1.15rem] font-light tracking-[-0.02em] text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
              >
                {m.value}
              </span>
              <span className="hd-metric-label">{m.label}</span>
            </div>
          ))}
        </Wrap>
      </div>
    </section>
  );
}
