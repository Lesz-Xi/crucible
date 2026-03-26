"use client";

import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    id: "01",
    verb: "INGEST",
    title: "Index your corpus",
    body: "Research papers, PDFs, web sources — MASA extracts entities, relationships, and raw causal claims. Every document becomes a node in the knowledge graph.",
  },
  {
    id: "02",
    verb: "RETRIEVE",
    title: "Confidence-weighted evidence",
    body: "Rejection-aware RAG surfaces only the evidence that survives scrutiny. Each retrieved fragment carries a source score, a temporal decay factor, and a contradiction flag.",
  },
  {
    id: "03",
    verb: "SYNTHESIZE",
    title: "Contradict and recombine",
    body: "Contradiction detection drives hypothesis generation. MASA builds structural causal models from conflict, not consensus — then tests their logical coherence.",
  },
  {
    id: "04",
    verb: "VALIDATE",
    title: "Pearl do-calculus",
    body: "Counterfactual simulation. Intervention framing. Every candidate conclusion is interrogated through the causal graph before it leaves the synthesis engine.",
  },
  {
    id: "05",
    verb: "COMMIT",
    title: "Sovereign memory update",
    body: "Only claims that pass the falsifiability gate enter long-term memory. The full provenance trail — sources, reasoning steps, confidence deltas — is persisted alongside.",
  },
];

export function SequenceOfEvents() {
  const shouldReduce = useReducedMotion();

  return (
    <section className="hd-section bg-[var(--bg-primary)] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-16">
          <p className="hd-kicker mb-4 uppercase">The Mechanism</p>
          <h2
            className="hd-serif-display text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}
          >
            Sequence of Events.
          </h2>
          <p className="mt-5 max-w-[36rem] text-[0.9rem] leading-[1.8] text-[var(--text-muted)]">
            How a research question becomes a validated causal conclusion —
            every stage governed, every transition auditable.
          </p>
        </div>

        {/* Two-column timeline */}
        <div className="border-t border-[var(--border-subtle)]">
          {steps.map((step, i) => {
            const Wrap = shouldReduce ? "div" : motion.div;
            const motionProps = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, y: 10 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: {
                    duration: 0.55,
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  },
                };

            return (
              <Wrap
                key={step.id}
                {...(motionProps as object)}
                className="grid grid-cols-1 border-b border-[var(--border-subtle)] py-10 md:grid-cols-[200px_1fr] md:gap-12"
              >
                {/* Left — number + verb label with vertical line */}
                <div className="relative mb-4 flex items-start gap-4 md:mb-0 md:flex-col md:gap-3">
                  {/* Vertical line (desktop only) */}
                  <div className="absolute left-[5px] top-6 hidden h-full w-px bg-[var(--border-subtle)] md:block" />

                  {/* Dot on timeline */}
                  <div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--border-strong)] bg-[var(--bg-card)]" />

                  {/* Label */}
                  <div className="md:pl-6">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      {step.id}
                    </p>
                    <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent-rust)]">
                      {step.verb}
                    </p>
                  </div>
                </div>

                {/* Right — title + body */}
                <div>
                  <h3
                    className="mb-3 text-[1.15rem] font-light leading-[1.35] tracking-[-0.02em] text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="max-w-[44rem] text-[0.88rem] leading-[1.85] text-[var(--text-secondary)]">
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
