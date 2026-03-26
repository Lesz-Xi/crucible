"use client";

import { motion, useReducedMotion } from "framer-motion";
import { X, Check } from "lucide-react";

const before = [
  {
    label: "Hypothesis drift",
    detail: "Months of literature review with no causal structure — observations pile up, mechanisms remain opaque.",
  },
  {
    label: "Opaque methods",
    detail: "No provenance, no reproducibility. Conclusions emerge from intuition, not traceable inference chains.",
  },
  {
    label: "Bottleneck science",
    detail: "Weeks per synthesis cycle. Contradictions are avoided, not reconciled. Novelty is claimed, not proved.",
  },
];

const after = [
  {
    label: "Pearl SCM",
    detail: "Structural causal models built in real time. DAGs constructed from your corpus, not your assumptions.",
  },
  {
    label: "Causal provenance",
    detail: "Every inference traced end-to-end. The full reasoning chain is auditable at every rung of the ladder.",
  },
  {
    label: "Real-time synthesis",
    detail: "Minutes, not months. Contradictions are the engine of discovery — MASA reconciles them systematically.",
  },
];

export function TheShift() {
  const shouldReduce = useReducedMotion();

  return (
    <section className="hd-section bg-[var(--bg-primary)] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-16">
          <p className="hd-kicker mb-4 uppercase">The Shift</p>
          <h2
            className="hd-serif-display max-w-2xl text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)" }}
          >
            The world changed.{" "}
            <em className="italic text-[var(--accent-rust)]">
              The method didn&apos;t.
            </em>
          </h2>
          <p className="mt-5 max-w-[34rem] text-[0.9rem] leading-[1.8] text-[var(--text-muted)]">
            Until now. MASA replaces the informal scientific pipeline with a
            governed causal architecture — without sacrificing researcher
            autonomy.
          </p>
        </div>

        {/* Comparison columns */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Before */}
          {(() => {
            const Wrap = shouldReduce ? "div" : motion.div;
            const props = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, x: -16 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                };
            return (
              <Wrap
                {...(props as object)}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-7 md:p-9"
              >
                <p className="mb-7 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Today&apos;s Reality
                </p>
                <div className="flex flex-col gap-6">
                  {before.map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                        <X size={10} strokeWidth={2} className="text-[var(--text-tertiary)]" />
                      </div>
                      <div>
                        <p className="text-[0.9rem] font-medium text-[var(--text-primary)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[0.8rem] leading-[1.75] text-[var(--text-muted)]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Wrap>
            );
          })()}

          {/* After */}
          {(() => {
            const Wrap = shouldReduce ? "div" : motion.div;
            const props = shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, x: 16 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: {
                    duration: 0.7,
                    delay: 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  },
                };
            return (
              <Wrap
                {...(props as object)}
                className="rounded-2xl border border-[var(--accent-rust)]/25 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] p-7 shadow-[0_0_0_1px_rgba(166,124,82,0.08),0_4px_24px_rgba(46,36,26,0.08)] md:p-9"
              >
                <p className="mb-7 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--accent-rust)]">
                  The MASA Layer
                </p>
                <div className="flex flex-col gap-6">
                  {after.map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--accent-rust)]/30 bg-[var(--accent-rust-soft)]">
                        <Check
                          size={10}
                          strokeWidth={2.5}
                          className="text-[var(--accent-rust)]"
                        />
                      </div>
                      <div>
                        <p className="text-[0.9rem] font-medium text-[var(--text-primary)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[0.8rem] leading-[1.75] text-[var(--text-secondary)]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Wrap>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
