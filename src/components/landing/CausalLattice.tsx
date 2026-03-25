"use client";

import React from "react";
import { Eye, GitBranch, Zap, ShieldCheck, Database } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// ── Pipeline data ──────────────────────────────────────────────────────────

const stages = [
  {
    number: "01",
    name: "Observe",
    status: "Observational",
    icon: Eye,
    description:
      "Ingest raw evidence — correlation tables, time-series logs, and prior literature. No causal claim is made yet.",
    metric: "Intake: 14k nodes",
  },
  {
    number: "02",
    name: "Discover",
    status: "Graph search",
    icon: GitBranch,
    description:
      "Run directional graph search across the evidence layer to surface candidate cause-effect structures.",
    metric: "Depth: 12 layers",
  },
  {
    number: "03",
    name: "Intervene",
    status: "Do-calculus",
    icon: Zap,
    description:
      "Apply Pearl's do-operator — detach parent nodes, inject explicit interventions, and branch counterfactual scenarios.",
    metric: "Branches: ∞",
  },
  {
    number: "04",
    name: "Validate",
    status: "Guard rail",
    icon: ShieldCheck,
    description:
      "Hard physical and logical axioms gate every candidate claim. Inadmissible inferences are blocked before commitment.",
    metric: "Latency: <1ms",
  },
  {
    number: "05",
    name: "Commit",
    status: "Sovereign",
    icon: Database,
    description:
      "Write validated claims to rejection-aware sovereign memory. Confidence scores update; falsified claims are flagged.",
    metric: "RAG: active",
  },
];

// ── Animated wrapper ───────────────────────────────────────────────────────

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

// ── Desktop connector ──────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="hidden shrink-0 items-center md:flex" style={{ width: "2.5rem" }}>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glow)] to-[var(--border-subtle)]" />
      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-rust)] opacity-50" />
    </div>
  );
}

// ── Mobile connector ───────────────────────────────────────────────────────

function MobileConnector() {
  return (
    <div className="flex flex-col items-center md:hidden" style={{ height: "1.5rem" }}>
      <div className="w-px flex-1 bg-gradient-to-b from-[var(--border-glow)] to-transparent" />
    </div>
  );
}

// ── Stage card ─────────────────────────────────────────────────────────────

function StageCard({ stage }: { stage: (typeof stages)[number] }) {
  const Icon = stage.icon;
  return (
    <div className="group flex flex-1 flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-glow)] hover:shadow-[0_4px_20px_rgba(46,36,26,0.12)]">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          {stage.number}
        </span>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--accent-rust-soft)] px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-[var(--accent-rust-strong)]">
          {stage.status}
        </span>
      </div>

      {/* Icon */}
      <div className="mt-4 mb-3">
        <Icon
          className="h-5 w-5 text-[var(--accent-rust)]"
          strokeWidth={1}
          aria-hidden
        />
      </div>

      {/* Name */}
      <h3 className="font-serif text-[1.15rem] text-[var(--text-primary)]">
        {stage.name}
      </h3>

      {/* Description */}
      <p className="mt-2 flex-1 font-body text-[0.78rem] leading-relaxed text-[var(--text-secondary)]">
        {stage.description}
      </p>

      {/* Metric */}
      <div className="mt-4 border-t border-dashed border-[var(--border-subtle)] pt-3">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {stage.metric}
        </span>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────

export function CausalLattice() {
  return (
    <section className="hd-section bg-[var(--bg-secondary)] py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8 space-y-10">

        {/* Header */}
        <AnimatedContainer className="max-w-2xl" delay={0.1}>
          <p className="hd-kicker inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            System Architecture
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            How MASA reasons.
          </h2>
          <p className="mt-5 font-body text-[0.95rem] leading-8 text-[var(--text-secondary)]">
            Every causal query traverses a fixed five-stage pipeline — no shortcuts, no
            speculation. Observation feeds discovery. Discovery enables intervention.
            Intervention forces validation.
          </p>
        </AnimatedContainer>

        {/* Pipeline — desktop horizontal, mobile vertical */}
        <AnimatedContainer delay={0.4}>
          {/* Desktop */}
          <div className="hidden items-stretch md:flex">
            {stages.map((stage, i) => (
              <React.Fragment key={stage.number}>
                <StageCard stage={stage} />
                {i < stages.length - 1 && <Connector />}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile */}
          <div className="flex flex-col md:hidden">
            {stages.map((stage, i) => (
              <React.Fragment key={stage.number}>
                <StageCard stage={stage} />
                {i < stages.length - 1 && <MobileConnector />}
              </React.Fragment>
            ))}
          </div>
        </AnimatedContainer>

        {/* Footer note */}
        <AnimatedContainer delay={0.6} className="border-t border-[var(--border-subtle)] pt-6">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Pearl do-calculus · Rejection-aware memory · Admissibility gate · <span className="text-[var(--accent-rust-strong)]">Instrument-grade</span>
          </p>
        </AnimatedContainer>

      </div>
    </section>
  );
}
