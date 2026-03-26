"use client";

import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Observe",
    body: "Surface relevant evidence from indexed corpora with confidence-weighted retrieval. Every source is scored, timestamped, and linked to the claim it supports.",
  },
  {
    num: "02",
    title: "Hypothesize",
    body: "Generate falsifiable causal mechanisms through contradiction-driven recombination. MASA synthesises across conflicting claims — not around them.",
  },
  {
    num: "03",
    title: "Intervene",
    body: "Execute Pearl do-calculus: simulate real-world interventions on the structural causal model. Ask not just what is correlated, but what would change if you acted.",
  },
  {
    num: "04",
    title: "Validate",
    body: "Gate every claim through physical-reality tests before committing to sovereign memory. Science, not plausible text generation.",
  },
];

export function CausalPipeline() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="pipeline"
      className="hd-section bg-[var(--bg-secondary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="hd-kicker mb-4 uppercase">Causal Pipeline</p>
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}
            >
              From Question{" "}
              <em className="italic text-[var(--accent-rust)]">to Proof.</em>
            </h2>
          </div>
          <p className="max-w-[26rem] text-[0.88rem] leading-[1.8] text-[var(--text-muted)] md:text-right">
            A closed-loop scientific process. Each stage is governed, traced,
            and auditable.
          </p>
        </div>

        {/* Full-width editorial rows */}
        <div className="border-t border-[var(--border-subtle)]">
          {steps.map((step, i) => {
            const Wrap = shouldReduce ? "div" : motion.div;
            const motionProps = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, x: -8 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: {
                    duration: 0.6,
                    delay: i * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  },
                };

            return (
              <Wrap
                key={step.num}
                {...(motionProps as object)}
                className="grid grid-cols-[72px_1fr] gap-8 border-b border-[var(--border-subtle)] py-10 md:grid-cols-[96px_1fr] md:gap-14"
              >
                {/* Large step number */}
                <span
                  className="select-none font-mono text-[2.6rem] font-light leading-none tracking-[-0.04em] text-[var(--text-tertiary)] md:text-[3.2rem]"
                >
                  {step.num}
                </span>

                {/* Title + body */}
                <div className="pt-1">
                  <h3
                    className="mb-3 text-[1.2rem] font-medium leading-[1.3] tracking-[-0.02em] text-[var(--text-primary)]"
                  >
                    {step.title}
                  </h3>
                  <p className="max-w-[44rem] text-[0.88rem] leading-[1.8] text-[var(--text-secondary)]">
                    {step.body}
                  </p>
                </div>
              </Wrap>
            );
          })}
        </div>
      </div>
    </section>
  );
}
