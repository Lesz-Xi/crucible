"use client";

import { MasaArchitecture } from "@/components/landing/MasaArchitecture";

export function Hero() {
  return (
    <section className="landing-hero-shell relative overflow-hidden px-10 pt-32 pb-14 md:px-16 lg:px-24">
      <div className="landing-hero-copy relative z-10 mx-auto w-full max-w-[78rem]">
        <div className="max-w-[42rem]">
          <div className="mb-10 flex items-center gap-3">
            <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              WU-WEISM · CAUSAL SCIENCE
            </span>
          </div>

          <h1
            className="hd-serif-display text-[var(--text-primary)]"
            style={{ fontSize: "clamp(3.2rem, 6.5vw, 6.5rem)" }}
          >
            Causal Science.
            <br />
            <em className="italic text-[var(--accent-rust)]">Automated.</em>
          </h1>

          <p
            className="mt-7 max-w-[34rem] text-[1.02rem] leading-[1.8] text-[var(--text-secondary)]"
            style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}
          >
            From observation to counterfactual — Pearl&apos;s causal ladder,
            automated with institutional rigor.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/masa-white-paper.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-0.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-rust)] hover:text-[var(--text-primary)]"
            >
              Read white paper →
            </a>
          </div>
        </div>

        <dl className="hd-meta-row mt-20 max-w-[34rem] font-mono text-[0.58rem] uppercase tracking-[0.16em]">
          <div>
            <dt className="text-[var(--text-tertiary)]">Sector</dt>
            <dd className="mt-1 text-[var(--text-muted)]">Causal AI</dd>
          </div>
          <div>
            <dt className="text-[var(--text-tertiary)]">Platform</dt>
            <dd className="mt-1 text-[var(--text-muted)]">wuweism.com</dd>
          </div>
        </dl>
      </div>

      <div
        className="landing-hero-board relative z-10 mx-auto mt-16 flex w-full max-w-[96rem] items-end justify-center overflow-hidden"
        aria-hidden="true"
      >
        <MasaArchitecture className="w-[min(92vw,1000px)] md:w-[min(88vw,1080px)] lg:w-[min(84vw,1140px)] max-w-none translate-y-[1.35rem] scale-[0.94] lg:translate-y-[2.2rem] lg:scale-[0.97]" />
      </div>
    </section>
  );
}
