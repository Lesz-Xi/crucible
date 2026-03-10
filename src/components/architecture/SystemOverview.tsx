"use client";

import { ArrowRight, FileText, Lightbulb, ShieldCheck, Database, CheckCircle } from "lucide-react";

const pipeline = [
  {
    phase: "01",
    title: "Ingest",
    icon: FileText,
    description: "PDFs, research papers, domain data",
    color: "text-[var(--text-muted)]",
  },
  {
    phase: "02",
    title: "Generate",
    icon: Lightbulb,
    description: "Novel hypotheses from contradictions",
    color: "text-[var(--accent-rust)]",
  },
  {
    phase: "03",
    title: "Evaluate",
    icon: ShieldCheck,
    description: "Multi-agent causal critique",
    color: "text-[#7b8a78]",
  },
  {
    phase: "04",
    title: "Update",
    icon: Database,
    description: "Persistent memory + validation",
    color: "text-[var(--accent-blue)]",
  },
  {
    phase: "05",
    title: "Validate",
    icon: CheckCircle,
    description: "Pyodide sandbox execution",
    color: "text-green-600",
  },
];

export function SystemOverview() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="marketing-pill mb-4 w-fit px-4 py-2">
            <div className="marketing-dot" />
            <span className="hd-kicker">System flow</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            End-to-End Pipeline
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            From raw documents to validated scientific hypotheses. MASA orchestrates a
            multi-stage pipeline that ensures every output is grounded in causal reasoning
            and empirical evidence.
          </p>
        </div>

        {/* Pipeline Flow */}
        <div className="relative">
          <div className="grid gap-6 md:grid-cols-5">
            {pipeline.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.phase} className="relative">
                  <div className="marketing-card flex h-full flex-col items-center rounded-2xl p-6 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)]">
                      <Icon className={`h-6 w-6 ${step.color}`} strokeWidth={1.5} />
                    </div>
                    <span className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {step.phase}
                    </span>
                    <h3 className="mb-2 font-serif text-xl text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-6 text-[var(--text-secondary)]">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector */}
                  {index < pipeline.length - 1 && (
                    <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block">
                      <ArrowRight className="h-5 w-5 text-[var(--border-strong)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Differentiators */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="marketing-card rounded-2xl p-8">
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
              Closed Loop
            </h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              Unlike open-loop LLMs, MASA feeds evaluation results back into the generator,
              creating a self-improving system that learns from rejections.
            </p>
          </div>

          <div className="marketing-card rounded-2xl p-8">
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#7b8a78]">
              Causal First
            </h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              Pearl's three-layer framework (observation, intervention, counterfactual)
              validates ideas before expensive epistemic audits.
            </p>
          </div>

          <div className="marketing-card rounded-2xl p-8">
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-blue)]">
              Empirically Grounded
            </h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              Pyodide sandbox executes generated protocols with Monte Carlo simulations,
              p-values, and Bayes factors for validation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
