import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function ArchitectureHero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="marketing-pill mx-auto mb-6 w-fit px-4 py-2">
            <div className="marketing-dot" />
            <span className="hd-kicker">Architecture deep dive</span>
          </div>

          <h1 className="font-serif text-5xl text-[var(--text-primary)] md:text-7xl">
            From Philosopher to Scientist
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            MASA implements a closed-loop system spanning hypothesis generation, multi-agent
            critique, and empirical validation. Unlike conventional LLM applications that generate
            plausible text, MASA moves toward falsifiable science.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/chat"
              className="marketing-button-primary px-6 py-3"
            >
              Try MASA
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/masa-white-paper.html"
              target="_blank"
              rel="noopener noreferrer"
              className="marketing-button-secondary px-6 py-3"
            >
              Read White Paper
            </a>
          </div>
        </div>

        {/* Problem Statement */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="marketing-card rounded-[2rem] p-8">
              <div className="mb-4 inline-flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  The Problem
                </span>
              </div>
              <h3 className="mb-4 font-serif text-2xl text-[var(--text-primary)]">
                Philosophers Without Empirical Grounding
              </h3>
              <ul className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--text-muted)]" />
                  <span>No persistent memory across sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--text-muted)]" />
                  <span>Cannot validate predictions against physical reality</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--text-muted)]" />
                  <span>Open-loop architecture prevents self-improvement</span>
                </li>
              </ul>
            </div>

            <div className="marketing-card rounded-[2rem] p-8">
              <div className="mb-4 inline-flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  The Solution
                </span>
              </div>
              <h3 className="mb-4 font-serif text-2xl text-[var(--text-primary)]">
                Three-Pillar Closed Loop
              </h3>
              <ul className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent-rust)]" />
                  <span>Generator: Novel hypotheses from contradictions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7b8a78]" />
                  <span>Evaluator: Multi-agent epistemic critique</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent-blue)]" />
                  <span>Update: Persistent memory + simulation validation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
