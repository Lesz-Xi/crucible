"use client";

import React from "react";
import {
  Lightbulb,
  ShieldCheck,
  Database,
  KeyRound,
  GitBranch,
  FlaskConical,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────

type Feature = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

// ── MASA Feature Data ──────────────────────────────────────────────────────

const features: Feature[] = [
  {
    icon: Lightbulb,
    title: "Generator",
    description:
      "Synthesizes hypotheses from contradictions across sources using Hong-inspired recombination to bridge conflicting claims with testable mechanisms.",
  },
  {
    icon: ShieldCheck,
    title: "Evaluator",
    description:
      "Multi-agent critique with calibrated confidence scoring — Epistemologist, Skeptic, and Architect agents validate epistemic rigor and falsifiability.",
  },
  {
    icon: Database,
    title: "Sovereign Memory",
    description:
      "Rejection-aware RAG with Pyodide sandbox validation and chemical entity verification. Learns from rejections, accumulates causal knowledge.",
  },
  {
    icon: KeyRound,
    title: "Bring Your Own Key",
    description:
      "Connect Anthropic, OpenAI, or Gemini with your own API credentials. Your keys and research data never leave your browser session.",
  },
  {
    icon: GitBranch,
    title: "Causal Provenance",
    description:
      "Every inference is traced end-to-end. Pearl do-calculus ladder from observation to intervention to counterfactual — auditable at every rung.",
  },
  {
    icon: FlaskConical,
    title: "Falsifiability Gate",
    description:
      "Predictions are validated against physical reality before claims are committed to memory. Science, not plausible text generation.",
  },
];

// ── GridPattern SVG helper ─────────────────────────────────────────────────

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<"svg"> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = React.useId();
  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([sx, sy], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={sx * width}
              y={sy * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length = 5): number[][] {
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1,
  ]);
}

// ── Feature Card ──────────────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  // Stable pattern per card (memo so it doesn't regenerate on re-render)
  const pattern = React.useMemo(() => genRandomPattern(), []);

  return (
    <div className="relative overflow-hidden p-8">
      {/* Animated grid background */}
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-rust-soft)] to-transparent opacity-100 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
          <GridPattern
            width={20}
            height={20}
            x="-12"
            y="4"
            squares={pattern}
            className="absolute inset-0 h-full w-full fill-[var(--wabi-stone)] stroke-[var(--border-subtle)] mix-blend-overlay"
          />
        </div>
      </div>

      {/* Icon */}
      <Icon
        className="relative z-10 h-6 w-6 text-[var(--accent-rust)]"
        strokeWidth={1}
        aria-hidden
      />

      {/* Title */}
      <h3 className="relative z-10 mt-10 font-serif text-[1.05rem] text-[var(--text-primary)]">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="relative z-10 mt-2 font-body text-[0.8rem] leading-relaxed text-[var(--text-secondary)]">
        {feature.description}
      </p>
    </div>
  );
}

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

// ── Section ────────────────────────────────────────────────────────────────

export function ThreePillars() {
  return (
    <section id="architecture" className="hd-section bg-[var(--bg-primary)] py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4 space-y-10">
        {/* Header */}
        <AnimatedContainer className="mx-auto max-w-3xl text-center" delay={0.1}>
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Architecture</span>
          </div>
          <h2 className="font-serif text-3xl text-[var(--text-primary)] md:text-4xl lg:text-5xl">
            Three Pillars of Causal Science
          </h2>
          <p className="mt-4 font-body text-[0.9rem] leading-relaxed text-[var(--text-secondary)] md:text-base">
            MASA implements a closed-loop system that moves beyond plausible text generation
            to falsifiable scientific reasoning. Every hypothesis is generated, critiqued,
            and validated against physical reality.
          </p>
        </AnimatedContainer>

        {/* 6-card dashed grid */}
        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed sm:grid-cols-2 md:grid-cols-3 border-[var(--border-subtle)] divide-[var(--border-subtle)]"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}
