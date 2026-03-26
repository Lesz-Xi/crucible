"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare, Layers, Scale } from "lucide-react";

const surfaces = [
  {
    icon: MessageSquare,
    name: "Causal Workbench",
    route: "/chat",
    tagline: "Dialogue governed by do-calculus.",
    body: "Structured causal conversation with intervention framing. Every exchange moves you up Pearl's ladder — from observation, through intervention, to counterfactual reasoning.",
    badge: "Pearl SCM",
  },
  {
    icon: Layers,
    name: "Hybrid Synthesis",
    route: "/hybrid",
    tagline: "Contradiction as the engine of discovery.",
    body: "Surface genuine novelty by reconciling conflicting claims across your literature corpus. Hong-inspired recombination builds bridges where consensus fails.",
    badge: "Novelty Proofing",
  },
  {
    icon: Scale,
    name: "Legal Causation",
    route: "/legal",
    tagline: "But-for logic. Proximate cause. Answered.",
    body: "Causation analysis that meets legal epistemological standards. Applies but-for and proximate cause frameworks to complex multi-factor causal chains.",
    badge: "But-For · Proximate",
  },
];

export function CapabilityGrid() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="surfaces"
      className="hd-section bg-[var(--bg-primary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="hd-kicker mb-4 uppercase">Research Surfaces</p>
          <h2
            className="hd-serif-display mx-auto max-w-2xl text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)" }}
          >
            Three purpose-built{" "}
            <em className="italic text-[var(--accent-rust)]">instruments.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[34rem] text-[0.9rem] leading-[1.8] text-[var(--text-muted)]">
            Each surface is purpose-built for a distinct mode of causal inquiry.
            All share the same underlying SCM engine and provenance trail.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {surfaces.map((s, i) => {
            const Icon = s.icon;
            const Wrap = shouldReduce ? "div" : motion.div;
            const motionProps = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: {
                    duration: 0.65,
                    delay: i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  },
                };

            return (
              <Wrap
                key={s.name}
                {...(motionProps as object)}
                className="hd-panel group flex cursor-pointer flex-col gap-6 rounded-2xl p-7 transition-all hover:border-[var(--border-glow)]"
              >
                {/* Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <Icon
                      size={15}
                      strokeWidth={1.5}
                      className="text-[var(--accent-rust)]"
                    />
                  </div>
                  {/* Badge */}
                  <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {s.badge}
                  </span>
                </div>

                {/* Name + tagline */}
                <div>
                  <h3
                    className="text-[1.1rem] font-light tracking-[-0.02em] text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
                  >
                    {s.name}
                  </h3>
                  <p className="mt-1 text-[0.82rem] font-medium text-[var(--accent-rust)]">
                    {s.tagline}
                  </p>
                </div>

                {/* Body */}
                <p className="flex-1 text-[0.83rem] leading-[1.85] text-[var(--text-secondary)]">
                  {s.body}
                </p>

                {/* CTA link */}
                <a
                  href={s.route}
                  className="inline-flex items-center gap-1.5 self-start border-b border-[var(--border-subtle)] pb-0.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors group-hover:border-[var(--accent-rust)] group-hover:text-[var(--accent-rust)]"
                >
                  Open surface →
                </a>
              </Wrap>
            );
          })}
        </div>
      </div>
    </section>
  );
}
