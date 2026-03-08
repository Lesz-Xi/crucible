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
    accent: "text-[#6f8271]",
  },
  {
    label: "Hybrid",
    route: "/hybrid",
    subtitle: "Synthesis Relay",
    description:
      "Move from retrieval to decomposition to causal synthesis in one controlled, intervention-grade workbench.",
    meta: ["timeline receipt", "source braid", "causal synthesis"],
    icon: Network,
    accent: "text-[#5d6e90]",
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
    accent: "text-[#3f6785]",
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
    accent: "text-[#7e8379]",
  },
];

export function FeatureRail() {
  return (
    <section
      aria-label="Primary product features"
      className="relative z-10 mx-auto max-w-7xl px-6 pb-32 pt-16 md:pb-40 md:pt-24 lg:pb-44 lg:pt-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.84)] shadow-[var(--shadow-soft)]">
          <div className="p-5 md:p-6 lg:p-7">
              <div className="rounded-[26px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(247,244,239,0.86))] p-5 md:p-6">
                <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 md:flex-row md:items-end md:justify-between">
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
                  <div className="grid grid-cols-3 gap-4 md:min-w-[340px]">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        lanes
                      </p>
                      <p className="mt-2 font-serif text-2xl text-[var(--text-primary)]">05</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        relic rooms
                      </p>
                      <p className="mt-2 font-serif text-2xl text-[var(--text-primary)]">03</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        state
                      </p>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent-rust)]">
                        synchronized
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                  {primaryApps.map((app, index) => {
                    const Icon = app.icon;

                    return (
                      <Link
                        key={app.label}
                        href={app.route}
                        className="group relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.9)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(166,133,100,0.34)] hover:shadow-[0_24px_60px_rgba(45,38,28,0.08)]"
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
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/72 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]"
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

                <div className="mt-5 rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.82)] p-5 md:p-6">
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
                          className="group rounded-[22px] border border-[var(--border-subtle)] bg-white/78 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(166,133,100,0.34)]"
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
              </div>
          </div>
        </div>
      </div>
    </section>
  );
}
