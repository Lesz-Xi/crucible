import Link from "next/link";
import { Lightbulb, ShieldCheck, Database } from "lucide-react";

const pillars = [
  {
    icon: Lightbulb,
    number: "01",
    title: "Generator",
    subtitle: "Novel Idea Engine",
    description:
      "Synthesizes hypotheses from contradictions across sources. Uses Hong-inspired recombination to bridge conflicting claims with testable mechanisms.",
    features: ["Dialectical synthesis", "Contradiction-seeded ideation", "Multi-source integration"],
    accent: "text-[var(--accent-rust)]",
    accentBg: "bg-[var(--accent-rust-soft)]",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Evaluator",
    subtitle: "MASA Auditor",
    description:
      "Multi-agent critique system with calibrated confidence scoring. Three specialized personas validate epistemic rigor, falsifiability, and causal mechanisms.",
    features: ["Epistemologist agent", "Skeptic agent", "Architect agent"],
    accent: "text-[var(--accent-moss)]",
    accentBg: "bg-[rgba(125,156,128,0.14)]",
  },
  {
    icon: Database,
    number: "03",
    title: "Update Mechanism",
    subtitle: "Sovereign Memory + Ground Truth",
    description:
      "Vector-based persistent memory with simulation validation. Learns from rejections, validates predictions against reality, and accumulates causal knowledge.",
    features: ["Rejection-aware RAG", "Pyodide sandbox", "Chemical entity validation"],
    accent: "text-[var(--accent-slate)]",
    accentBg: "bg-[rgba(142,162,199,0.12)]",
  },
];

export function ThreePillars() {
  return (
    <section id="architecture" className="hd-section bg-[var(--bg-primary)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Architecture</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Three Pillars of Causal Science
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            MASA implements a closed-loop system that moves beyond plausible text generation
            to falsifiable scientific reasoning. Every hypothesis is generated, critiqued,
            and validated against physical reality.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <article
                key={pillar.title}
                className="group relative flex flex-col rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-[var(--border-glow)] hover:bg-[var(--bg-card-soft)] lg:p-10"
              >
                <div className="mb-8 flex items-start justify-between">
                  <div className={`rounded-[16px] border border-[var(--border-subtle)] p-3 ${pillar.accentBg}`}>
                    <Icon className={`h-6 w-6 ${pillar.accent}`} strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-xl uppercase tracking-[0.16em] text-[var(--text-muted)]/65">
                    {pillar.number}
                  </span>
                </div>

                <div className="mb-6 border-b border-[var(--border-subtle)] pb-5">
                  <h3 className="font-serif text-3xl leading-tight text-[var(--text-primary)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{pillar.subtitle}</p>
                </div>

                <p className="mb-8 text-sm leading-7 text-[var(--text-secondary)]">
                  {pillar.description}
                </p>

                <div className="mt-auto space-y-3 border-t border-[var(--border-subtle)] pt-6">
                  {pillar.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${pillar.accentBg}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${pillar.accent.replace("text-", "bg-")}`} />
                      </div>
                      <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]/75">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-[var(--accent-rust-strong)] transition-colors hover:text-[var(--text-primary)]"
          >
            See the full architecture →
          </Link>
        </div>
      </div>
    </section>
  );
}
