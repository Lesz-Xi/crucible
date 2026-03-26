"use client";

import { motion, useReducedMotion } from "framer-motion";

// Dark → Light mode conversion:
// Original asset uses #1a1614 bg, #c8965a amber, white text.
// Here we map to the landing parchment palette while keeping the
// same numbered-flow structure and monospaced step identifiers.
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
          <p className="hd-kicker mb-4 uppercase">Data Journey</p>
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

        {/* Step flow */}
        <div className="relative flex flex-col gap-0">
          {/* Vertical connector line */}
          <div className="absolute left-[1.35rem] top-6 bottom-6 w-px bg-gradient-to-b from-[var(--accent-rust)]/40 via-[var(--border-subtle)] to-transparent md:left-[1.6rem]" />

          {steps.map((step, i) => {
            const Wrap = shouldReduce ? "div" : motion.div;
            const motionProps = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, x: -10 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: {
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  },
                };

            return (
              <Wrap
                key={step.id}
                {...(motionProps as object)}
                className="relative flex items-start gap-6 py-8 pl-14 md:pl-16"
              >
                {/* Step node */}
                <div
                  className="absolute left-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]"
                  style={
                    i === 0
                      ? {
                          borderColor: "var(--accent-rust)",
                          background: "var(--accent-rust-soft)",
                        }
                      : {}
                  }
                >
                  <span
                    className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.1em]"
                    style={{
                      color: i === 0 ? "var(--accent-rust)" : "var(--text-muted)",
                    }}
                  >
                    {step.id}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2 border-b border-dashed border-[var(--border-subtle)] pb-8">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--accent-rust-strong)]">
                      {step.verb}
                    </span>
                  </div>
                  <h3
                    className="text-[1.05rem] font-light tracking-[-0.01em] text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="max-w-[40rem] text-[0.84rem] leading-[1.85] text-[var(--text-secondary)]">
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
