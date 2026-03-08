"use client";

import { EpistemicCards } from "@/components/landing/EpistemicCards";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-5 pb-16 pt-36 transition-colors duration-500 md:min-h-[100svh] md:px-8 md:pb-20 md:pt-40 lg:pt-44">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-subtle)]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center">
        <div className="max-w-[34rem] pt-6 lg:pt-0">
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Thinking Instrument</span>
          </div>

          <h1 className="font-serif text-[3.3rem] leading-[0.92] tracking-[-0.06em] text-[var(--text-primary)] md:text-[4.4rem] lg:text-[5.55rem]">
            Causal <span className="italic font-light text-[var(--accent-rust)]">Architect</span>
          </h1>

          <p className="mt-6 max-w-[29rem] text-[0.98rem] leading-7 text-[var(--text-secondary)] md:text-[1rem] md:leading-8">
            Traversing the rungs of Judea Pearl&apos;s Ladder. From observation to
            intervention, distilling truth from the flux through disciplined
            causal inquiry.
          </p>

          <div className="mt-8">
            <a
              href="/masa-white-paper.html"
              target="_blank"
              className="lg-control inline-flex items-center gap-2 border border-[var(--border-strong)] bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)] transition-all duration-300 hover:border-[var(--accent-rust)] hover:text-[var(--accent-rust)]"
            >
              <span>Read MASA White Paper</span>
              <span className="opacity-50 transition-opacity group-hover:opacity-100">→</span>
            </a>
          </div>

        </div>

        <div className="relative lg:self-center">
          <div className="rounded-[28px] border border-[var(--border-subtle)] bg-white/88 p-4 md:p-5">
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

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_148px]">
              <EpistemicCards compact className="min-w-0" />

              <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[#fffdfa] p-4">
                <p className="hd-kicker">Output posture</p>
                <div className="mt-4 space-y-4">
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
