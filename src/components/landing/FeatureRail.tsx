"use client";

import Link from "next/link";
import {
  GraduationCap,
  Menu,
  MessageSquare,
  Microscope,
  Network,
  Scale,
} from "lucide-react";

const primaryApps = [
  {
    label: "Chat",
    route: "/chat",
    subtitle: "Quiet Precision",
    description:
      "Run constrained causal dialogue with bounded context, evidence-first prompting, and intervention-aware memory.",
    meta: ["thread memory", "bounded context", "evidence scope"],
    icon: MessageSquare,
    accent: "text-[var(--accent-moss)]",
  },
  {
    label: "Hybrid",
    route: "/hybrid",
    subtitle: "Synthesis Relay",
    description:
      "Move from retrieval to decomposition to causal synthesis in one controlled, intervention-grade workbench.",
    meta: ["timeline receipt", "source braid", "causal synthesis"],
    icon: Network,
    accent: "text-[var(--accent-slate)]",
    featured: true,
  },
];

const relicApps = [
  {
    label: "Labs",
    route: "/lab",
    subtitle: "Relic Instrumentation",
    description:
      "Prototype report analysis, structure retrieval, docking, and scientific notebook workflows.",
    meta: ["report analysis", "structure fetch", "docking jobs"],
    icon: Microscope,
    accent: "text-[var(--accent-slate)]",
  },
  {
    label: "Legal",
    route: "/legal",
    subtitle: "Ritual Flow",
    description:
      "Trace intent, action, and harm with gate-aware liability analysis and explicit validation boundaries.",
    meta: ["evidence dock", "counterfactual review", "audit gates"],
    icon: Scale,
    accent: "text-[var(--accent-rust)]",
  },
  {
    label: "Educational",
    route: "/education",
    subtitle: "Warm Intelligence",
    description:
      "Personalize learning paths through adaptive causal models, intervention loops, and reflection cycles.",
    meta: ["adaptive plans", "apprenticeship", "reflection cycles"],
    icon: GraduationCap,
    accent: "text-[var(--accent-moss)]",
  },
];

export function FeatureRail() {
  return (
    <section
      id="surfaces"
      aria-label="Primary product features"
      className="relative z-10 bg-[var(--bg-secondary)] px-6 pb-32 pt-16 md:px-8 md:pb-40 md:pt-24 lg:px-10 lg:pb-44 lg:pt-28"
    >
      <div className="mx-auto max-w-[1280px] border-b border-[var(--border-subtle)] pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Unified application page
          </p>
          <h3 className="mt-3 font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--text-primary)] md:text-[2.5rem]">
            Every causal surface,
            <span className="italic font-light text-[var(--accent-rust)]">
              {" "}inside one instrument.
            </span>
          </h3>
        </div>
      </div>

      <div className="mt-6">
        <div className="mx-auto grid max-w-[1280px] gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
                  {primaryApps.map((app, index) => {
                    const Icon = app.icon;

                    return (
                      <Link
                        key={app.label}
                        href={app.route}
                        className="group relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-glow)] hover:bg-[var(--bg-tertiary)]"
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--accent-rust)]/75 via-[var(--border-strong)]/40 to-transparent" />

                        <div className="flex items-start justify-between gap-6">
                          <div>
                          <div className="inline-flex items-center gap-2.5">
                              <Icon className={`h-4 w-4 ${app.accent}`} />
                              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-primary)]">
                                {app.label}
                              </span>
                            </div>
                            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                              {app.subtitle}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {index === 1 ? "flagship surface" : "primary surface"}
                          </span>
                        </div>

                        <p className="mt-10 font-serif text-[1.12rem] leading-10 text-[var(--text-secondary)] md:text-[1.18rem]">
                          {app.description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
                          {app.meta.map((item) => (
                            <div
                              key={item}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust)]/75" />
                              {item}
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {app.route}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-[1280px] rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card-soft)] p-5 md:p-6">
                  <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-3">
                        <Menu className="h-4 w-4 text-[var(--text-primary)]" />
                        <span className="hd-kicker">Relics Menu</span>
                      </div>
                      <h4 className="mt-3 font-serif text-[1.8rem] tracking-[-0.03em] text-[var(--text-primary)]">
                        Specialized rooms nested inside the same surface.
                      </h4>
                    </div>
                    <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                      Labs handles experimentation, Legal traces causation and harm,
                      and Educational adapts learning loops without breaking the main shell.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    {relicApps.map((app) => {
                      const Icon = app.icon;
                      return (
                        <div
                          key={app.label}
                          className="group rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-glow)] hover:bg-[var(--bg-elevated)]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="inline-flex items-center gap-3">
                              <Icon className={`h-4 w-4 ${app.accent}`} />
                              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-primary)]">
                                {app.label}
                              </span>
                            </div>
                          </div>

                          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {app.subtitle}
                          </p>
                          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                            {app.description}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {app.meta.map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-[var(--border-subtle)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
      </div>
    </section>
  );
}
