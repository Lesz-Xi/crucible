"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

// ── Animated wrapper ─────────────────────────────────────────────────────────

type AnimatedContainerProps = {
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

export function BeginInquiry() {
  return (
    <section
      aria-label="Start your causal inquiry"
      className="relative overflow-hidden bg-[var(--bg-primary)] py-24 md:py-32"
    >
      {/* Radial warmth glow — purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[400px] w-[640px] rounded-full bg-[var(--accent-rust)] opacity-[0.04] blur-[80px]" />
      </div>

      {/* Content */}
      <AnimatedContainer
        delay={0.1}
        className="relative z-10 mx-auto max-w-2xl px-4 text-center md:px-8"
      >
        {/* Kicker */}
        <div className="mb-6 inline-flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Causal Research
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl lg:text-[3.5rem]">
          Your next hypothesis is{" "}
          <span className="font-light italic text-[var(--accent-rust)]">
            one inquiry away.
          </span>
        </h2>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-lg font-body text-[0.95rem] leading-8 text-[var(--text-secondary)]">
          MASA synthesises evidence, applies Pearl&apos;s do-calculus, and commits only what
          survives the falsifiability gate. Science, not plausible text.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-rust)] px-7 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--bg-primary)] transition duration-200 hover:opacity-90"
          >
            Start researching →
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-glow)] px-7 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition duration-200 hover:border-[var(--accent-rust)] hover:text-[var(--text-primary)]"
          >
            Open the workbench
          </Link>
        </div>

        {/* Fine print */}
        <p className="mt-8 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          No account required to explore · Bring your own API key
        </p>
      </AnimatedContainer>
    </section>
  );
}
