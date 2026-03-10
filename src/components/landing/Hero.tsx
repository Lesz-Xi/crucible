"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { EpistemicCards } from "@/components/landing/EpistemicCards";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pb-20 pt-36 transition-colors duration-500 md:min-h-[100svh] md:pb-24 md:pt-44 lg:pt-48">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-[rgba(255,224,194,0.14)] blur-[72px]" />
        <div className="absolute right-[10%] top-[10%] h-56 w-56 rounded-full bg-[rgba(142,162,199,0.14)] blur-[96px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-subtle)]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="max-w-[38rem] pt-8 lg:pt-0">
          <div className="marketing-pill mb-6 w-fit px-4 py-2">
            <span className="marketing-dot" />
            <span className="hd-kicker text-[var(--accent-rust)]">Causal reasoning instrument</span>
          </div>

          <h1 className="font-serif text-[3.5rem] leading-[0.9] tracking-[-0.06em] text-[var(--text-primary)] md:text-[5rem] lg:text-[6.35rem]">
            Causal architect for
            <span className="block italic font-light text-[var(--accent-rust)]">
              disciplined scientific inquiry.
            </span>
          </h1>

          <p className="mt-8 max-w-[34rem] text-[1.04rem] leading-8 text-[var(--text-secondary)] md:text-[1.08rem] md:leading-9">
            MASA traverses Judea Pearl&apos;s ladder from observation to intervention
            to counterfactual reasoning, turning contradictory evidence into a
            traceable research instrument instead of another text generator.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/chat" className="marketing-button-primary px-6 py-4">
              <span>Enter the instrument</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/masa-white-paper.html"
              target="_blank"
              rel="noreferrer"
              className="marketing-button-secondary px-6 py-4"
            >
              <span>Read white paper</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Provenance-first", "Every claim traceable"],
              ["Intervention aware", "Built around do(x)"],
              ["High-density UI", "Signals before decoration"],
            ].map(([label, note]) => (
              <div key={label} className="marketing-card rounded-[22px] px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent-rust)]">
                  {label}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative lg:self-center">
          <div className="marketing-section-surface rounded-[32px] p-4 md:p-5">
            <div className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(24,24,24,0.94),rgba(16,16,16,0.98))] p-5 md:p-6">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <p className="hd-kicker">Epistemic ladder</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Structured research modes
                  </p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  03 layers / always-on
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_168px]">
                <EpistemicCards compact className="min-w-0" />

                <div className="marketing-card rounded-[24px] p-4">
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

              <div className="mt-6 grid gap-4 border-t border-[var(--border-subtle)] pt-4 md:grid-cols-3">
                {[
                  ["09", "active research rails"],
                  ["3x", "reasoning depth"],
                  ["24/7", "trace retention"],
                ].map(([value, label]) => (
                  <div key={label} className="marketing-card rounded-[20px] px-4 py-4">
                    <p className="font-serif text-3xl leading-none text-[var(--text-primary)]">{value}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
