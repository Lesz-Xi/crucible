"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const surfaces = [
  {
    name: "Causal Workbench",
    route: "/chat",
    routeLabel: "/chat",
    body: "Structured causal dialogue with intervention framing. Every exchange moves you up Pearl's ladder — from observation, through intervention, to counterfactual reasoning.",
    badge: "Pearl SCM",
  },
  {
    name: "Hybrid Synthesis",
    route: "/hybrid",
    routeLabel: "/hybrid",
    body: "Surface genuine novelty by reconciling conflicting claims across your literature corpus. Hong-inspired recombination builds bridges where consensus fails.",
    badge: "Novelty Proofing",
  },
  {
    name: "Legal Causation",
    route: "/legal",
    routeLabel: "/legal",
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
        <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="hd-kicker mb-4 uppercase">Research Surfaces</p>
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)" }}
            >
              Three purpose-built{" "}
              <em className="italic text-[var(--accent-rust)]">instruments.</em>
            </h2>
          </div>
          <p className="max-w-[26rem] text-[0.88rem] leading-[1.8] text-[var(--text-muted)] md:text-right">
            Each surface is purpose-built for a distinct mode of causal inquiry.
            All share the same underlying SCM engine and provenance trail.
          </p>
        </div>

        {/* Editorial table rows */}
        <div className="border-t border-[var(--border-subtle)]">
          {surfaces.map((s, i) => {
            const Wrap = shouldReduce ? "div" : motion.div;
            const motionProps = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, y: 8 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: {
                    duration: 0.55,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  },
                };

            return (
              <Wrap
                key={s.name}
                {...(motionProps as object)}
                className="group grid grid-cols-1 gap-4 border-b border-[var(--border-subtle)] py-10 md:grid-cols-[240px_1fr_auto] md:items-start md:gap-10"
              >
                {/* Left — name + route badge */}
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-primary)]">
                    {s.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {s.routeLabel}
                    </span>
                    <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 font-mono text-[0.54rem] uppercase tracking-[0.12em] text-[var(--accent-rust)]">
                      {s.badge}
                    </span>
                  </div>
                </div>

                {/* Center — body */}
                <p className="text-[0.88rem] leading-[1.8] text-[var(--text-secondary)]">
                  {s.body}
                </p>

                {/* Right — arrow link */}
                <Link
                  href={s.route}
                  className="self-start border-b border-[var(--border-subtle)] pb-0.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-rust)] hover:text-[var(--accent-rust)] md:mt-0.5"
                >
                  Open →
                </Link>
              </Wrap>
            );
          })}
        </div>
      </div>
    </section>
  );
}
