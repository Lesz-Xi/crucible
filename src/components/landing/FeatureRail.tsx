"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  MessageSquare,
  Microscope,
  Network,
  Scale,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { GlowButton } from "./GlowButton";

// ── Data ────────────────────────────────────────────────────────────────────

const allApps = [
  // Primary row — full width pair
  {
    label: "Chat",
    route: "/chat",
    subtitle: "Quiet Precision",
    description:
      "Run constrained causal dialogue with bounded context, evidence-first prompting, and intervention-aware memory.",
    meta: ["thread memory", "bounded context", "evidence scope"],
    icon: MessageSquare,
    accent: "text-[var(--accent-moss)]",
    colSpan: "lg:col-span-3",
  },
  {
    label: "Hybrid",
    route: "/hybrid",
    subtitle: "Synthesis Relay · Flagship",
    description:
      "Move from retrieval to decomposition to causal synthesis in one controlled, intervention-grade workbench.",
    meta: ["timeline receipt", "source braid", "causal synthesis"],
    icon: Network,
    accent: "text-[var(--accent-slate)]",
    colSpan: "lg:col-span-3",
  },
  // Relics row
  {
    label: "Labs",
    route: "/lab",
    subtitle: "Relic Instrumentation",
    description:
      "Prototype report analysis, structure retrieval, docking, and scientific notebook workflows.",
    meta: ["report analysis", "structure fetch", "docking jobs"],
    icon: Microscope,
    accent: "text-[var(--accent-slate)]",
    colSpan: "lg:col-span-2",
  },
  {
    label: "Legal",
    route: "/legal",
    subtitle: "Ritual Flow",
    description:
      "Trace intent, action, and harm with gate-aware liability analysis and explicit validation boundaries.",
    meta: ["evidence dock", "counterfactual review", "audit gates"],
    icon: Scale,
    accent: "text-[var(--accent-rust)]",
    colSpan: "lg:col-span-2",
  },
  {
    label: "Educational",
    route: "/education",
    subtitle: "Warm Intelligence",
    description:
      "Personalize learning paths through adaptive causal models, intervention loops, and reflection cycles.",
    meta: ["adaptive plans", "apprenticeship", "reflection cycles"],
    icon: GraduationCap,
    accent: "text-[var(--accent-moss)]",
    colSpan: "lg:col-span-2",
  },
];

// ── Corner Plus Icons ────────────────────────────────────────────────────────

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    strokeWidth="1"
    stroke="currentColor"
    className={`text-[var(--border-strong)] ${className ?? ""}`}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);

const CornerPlusIcons = () => (
  <>
    <PlusIcon className="absolute -top-2.5 -left-2.5" />
    <PlusIcon className="absolute -top-2.5 -right-2.5" />
    <PlusIcon className="absolute -bottom-2.5 -left-2.5" />
    <PlusIcon className="absolute -bottom-2.5 -right-2.5" />
  </>
);

// ── PlusCard ─────────────────────────────────────────────────────────────────

type AppEntry = (typeof allApps)[number];

function PlusCard({ app }: { app: AppEntry }) {
  const Icon = app.icon;
  return (
    <Link
      href={app.route}
      className={`relative flex flex-col rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 transition-colors duration-200 hover:border-[var(--border-glow)] hover:bg-[var(--bg-card)] ${app.colSpan}`}
      style={{ minHeight: "180px" }}
    >
      <CornerPlusIcons />

      {/* Icon + label row */}
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 shrink-0 ${app.accent}`} strokeWidth={1.5} aria-hidden />
        <span className="hd-kicker">{app.label}</span>
        <span className="ml-auto hd-metric-label text-right">{app.subtitle}</span>
      </div>

      {/* Description */}
      <p className="mt-5 font-body text-[0.83rem] leading-relaxed text-[var(--text-secondary)]">
        {app.description}
      </p>

      {/* Meta tags */}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {app.meta.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[var(--text-muted)]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Route */}
      <div className="mt-3 border-t border-dashed border-[var(--border-subtle)] pt-3">
        <span className="hd-kicker text-[var(--text-tertiary)]">{app.route}</span>
      </div>

      {/* Decorative glow CTA — card itself is the link, so this is aria-hidden */}
      <div className="mt-4 flex justify-start" aria-hidden="true">
        <GlowButton
          tabIndex={-1}
          className="pointer-events-none py-2 px-4 text-[9px]"
        >
          Open →
        </GlowButton>
      </div>
    </Link>
  );
}

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

// ── Section ───────────────────────────────────────────────────────────────────

export function FeatureRail() {
  return (
    <section
      id="surfaces"
      aria-label="Primary product features"
      className="relative z-10 bg-[var(--bg-secondary)] px-4 pb-24 pt-16 md:px-8 md:pb-32 md:pt-20"
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <AnimatedContainer delay={0.1}>
          <div className="border-b border-[var(--border-subtle)] pb-5">
            <p className="hd-metric-label mb-3">Unified application page</p>
            <h3 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--text-primary)] md:text-[2.5rem]">
              Every causal surface,
              <span className="font-light italic text-[var(--accent-rust)]">
                {" "}inside one instrument.
              </span>
            </h3>
          </div>
        </AnimatedContainer>

        {/* Bento grid — all 5 apps in a 6-col layout */}
        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6"
        >
          {allApps.map((app, i) => (
            <PlusCard key={i} app={app} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}
