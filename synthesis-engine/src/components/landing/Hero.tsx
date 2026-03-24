"use client";

import { EpistemicCards } from "@/components/landing/EpistemicCards";
import { WebGLHero } from "@/components/landing/WebGLHero";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-6 pb-20 pt-44 transition-colors duration-500 md:min-h-[100svh] md:pb-24 md:pt-52 lg:pt-56">
      <WebGLHero />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-subtle)]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="max-w-[34rem] pt-6 lg:pt-0">
          <div className="mb-5 inline-flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Thinking Instrument</span>
          </div>

          <h1 className="font-serif text-[3.55rem] leading-[0.94] tracking-[-0.055em] text-[var(--text-primary)] md:text-[4.8rem] lg:text-[6.05rem]">
            Causal <span className="italic font-light text-[var(--accent-rust)]">Architect</span>
          </h1>

          <p className="mt-8 max-w-[30rem] text-[1rem] leading-8 text-[var(--text-secondary)] md:text-[1.04rem] md:leading-9">
            Traversing the rungs of Judea Pearl&apos;s Ladder. From observation to
            intervention, distilling truth from the flux through disciplined
            causal inquiry.
          </p>

          <div className="mt-10">
            <a
              href="/masa-white-paper.html"
              target="_blank"
              className="lg-control group inline-flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)] transition-all duration-300 hover:border-[var(--border-glow)] hover:bg-[var(--accent-rust-soft)] hover:text-[var(--accent-rust-strong)]"
            >
              <span>Read MASA White Paper</span>
              <span className="opacity-50 transition-opacity group-hover:opacity-100">→</span>
            </a>
          </div>

        </div>

        <div className="relative lg:self-center">
          <div className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <p className="hd-kicker">Epistemic ladder</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Structured reasoning modes
                </p>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                03 layers
              </p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_152px]">
              <EpistemicCards compact className="min-w-0" />

              <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-emphasis)] p-4 shadow-[inset_0_1px_0_rgba(255,244,230,0.03)]">
                <p className="hd-kicker">Output posture</p>
                <div className="mt-5 space-y-5">
                  {[
                    ["Truth-first", "Hard constraints"],
                    ["Do(x)", "Intervention ready"],
                    ["Audit", "Trace preserved"],
                  ].map(([label, note]) => (
                    <div key={label} className="border-t border-[var(--border-subtle)] pt-4 first:border-t-0 first:pt-0">
                      <p className="font-serif text-lg text-[var(--text-primary)]">{label}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
