"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { CausalDAGPanel } from "@/components/landing/CausalDAGPanel";

export function SynthesisPrism() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.2 });

  return (
    <section ref={containerRef} className="hd-section py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center">
        {/* ── Left: Text + stat cards ── */}
        <div>
          <div className="hd-kicker mb-5 inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Process Layer
          </div>
          <h2 className="hd-serif-display text-[3.2rem] text-[var(--text-primary)] md:text-[4.4rem]">
            The Synthesis
            <br />
            <em>Prism</em>
          </h2>
          <p className="mt-6 max-w-md text-[1rem] leading-8 text-[var(--text-secondary)]">
            Raw ambiguity enters. Causal clarity exits. A refraction engine that
            splits complex data streams into distinct, verifiable truth vectors.
          </p>

          <div className="mt-8 space-y-4">
            <div className="hd-stat-card">
              <p className="hd-metric-label">Prism Integrity</p>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-serif text-3xl leading-none text-[var(--text-primary)]">
                  0.94
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Stable
                </span>
              </div>
              <div className="landing-metric-bar mt-4" />
            </div>

            <div className="hd-panel-note rounded-[22px] px-5 py-5">
              <p className="hd-metric-label text-[var(--accent-rust)] opacity-70">Observation Note</p>
              <p className="mt-3 max-w-xs font-serif text-xl italic leading-8 text-[var(--text-primary)]">
                Causality sharpens when noise is treated as evidence rather than discarded.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Causal DAG panel ── */}
        <div className="hd-panel hd-grid-frame relative min-h-[520px] overflow-hidden rounded-[36px] p-6 md:p-8">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <p className="hd-metric-label">Causal Graph</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Structural Model
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Active Inference
            </p>
          </div>

          {/* DAG canvas area */}
          <div className="absolute inset-x-6 bottom-6 top-[72px] overflow-hidden rounded-[24px] border border-[rgba(166,133,100,0.14)] bg-[#f4ede2]">
            <CausalDAGPanel isActive={isInView} />
          </div>

          {/* Bottom labels */}
          <div className="absolute bottom-8 left-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            SCM active
          </div>
          <div className="absolute bottom-8 right-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Trace preserved
          </div>
        </div>
      </div>
    </section>
  );
}
