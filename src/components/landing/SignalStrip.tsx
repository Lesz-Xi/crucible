"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// ── Stat data ────────────────────────────────────────────────────────────────

const stats = [
  {
    value: "14 k",
    label: "Evidence nodes",
    sublabel: "ingested per session",
  },
  {
    value: "12",
    label: "Causal layers",
    sublabel: "depth of graph search",
  },
  {
    value: "∞",
    label: "Counterfactual branches",
    sublabel: "per do-operator call",
  },
  {
    value: "< 1 ms",
    label: "Axiom gate latency",
    sublabel: "admissibility check",
  },
  {
    value: "99.4 %",
    label: "Commit precision",
    sublabel: "validated claim rate",
  },
];

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

// ── Stat block ───────────────────────────────────────────────────────────────

function StatBlock({ stat, isLast }: { stat: (typeof stats)[number]; isLast: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 px-6 py-2 text-center ${
        isLast ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <span className="font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
        {stat.value}
      </span>
      <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {stat.label}
      </span>
      <span className="font-body text-[0.7rem] text-[var(--text-tertiary)]">
        {stat.sublabel}
      </span>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

export function SignalStrip() {
  return (
    <section
      aria-label="MASA reasoning metrics"
      className="border-t border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-14 md:py-16"
    >
      <AnimatedContainer delay={0.2} className="mx-auto max-w-5xl px-4 md:px-8">
        {/* Desktop: single flex row with dividers */}
        <div className="hidden items-stretch divide-x divide-[var(--border-subtle)] md:flex">
          {stats.map((stat, i) => (
            <StatBlock key={i} stat={stat} isLast={i === stats.length - 1} />
          ))}
        </div>

        {/* Mobile: 2-column grid, last item spans full width */}
        <div className="grid grid-cols-2 gap-y-8 md:hidden">
          {stats.map((stat, i) => (
            <StatBlock key={i} stat={stat} isLast={i === stats.length - 1} />
          ))}
        </div>
      </AnimatedContainer>
    </section>
  );
}
