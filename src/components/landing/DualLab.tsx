"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Microscope, Building2 } from "lucide-react";
import { GlowButton } from "./GlowButton";

const cards = [
  {
    icon: Microscope,
    audience: "For Researchers",
    tagline: "Your hypotheses. Causally governed.",
    body: "Connect your own API keys. Index your corpora. Every claim is contradiction-tested, every inference is traced back through the causal graph before it becomes a conclusion.",
    bullets: [
      "Rejection-aware RAG with sovereign memory",
      "Hong-inspired hypothesis recombination",
      "Novelty proofing against indexed literature",
    ],
    cta: { label: "Open Causal Workbench", href: "/chat" },
  },
  {
    icon: Building2,
    audience: "For Institutions",
    tagline: "Scientific governance at scale.",
    body: "Multi-agent critique, causal provenance trails, and falsifiability gates baked into every synthesis cycle — so your research output meets institutional-grade epistemic standards.",
    bullets: [
      "Epistemologist · Skeptic · Architect agents",
      "End-to-end causal provenance audit",
      "Falsifiability gate before memory commit",
    ],
    cta: { label: "Read the White Paper", href: "/masa-white-paper.html" },
  },
];

function Card({ card, delay }: { card: (typeof cards)[0]; delay: number }) {
  const Icon = card.icon;
  const shouldReduce = useReducedMotion();

  const Wrapper = shouldReduce ? "div" : motion.div;
  const motionProps = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <Wrapper
      {...(motionProps as object)}
      className="flex flex-col gap-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-soft)] md:p-10"
    >
      {/* Icon chip */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <Icon size={18} strokeWidth={1.5} className="text-[var(--accent-rust)]" />
      </div>

      {/* Audience label */}
      <div>
        <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {card.audience}
        </p>
        <h3
          className="text-[1.6rem] font-light leading-[1.2] tracking-[-0.03em] text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
        >
          {card.tagline}
        </h3>
      </div>

      {/* Body */}
      <p className="text-[0.88rem] leading-[1.8] text-[var(--text-secondary)]">{card.body}</p>

      {/* Bullets */}
      <ul className="flex flex-col gap-2.5">
        {card.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]"
          >
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-rust)]/50" />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-auto">
        <GlowButton href={card.cta.href}>
          {card.cta.label} →
        </GlowButton>
      </div>
    </Wrapper>
  );
}

export function DualLab() {
  return (
    <section
      id="laboratory"
      className="hd-section bg-[var(--bg-primary)] py-28 md:py-36"
    >
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        {/* Section header */}
        <div className="mb-14">
          <p className="hd-kicker mb-4 uppercase">The Laboratory</p>
          <h2
            className="max-w-2xl text-[2.4rem] font-light leading-[1.1] tracking-[-0.04em] text-[var(--text-primary)] md:text-[3rem]"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
          >
            Two instruments.{" "}
            <em className="italic text-[var(--accent-rust)]">One discipline.</em>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {cards.map((card, i) => (
            <Card key={card.audience} card={card} delay={i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
}
