import { FileText, Activity, GitCommit, ArrowRight } from "lucide-react";

const artifacts = [
  {
    title: "The Causal Graph",
    description: "A directed acyclic graph representing confirmed dependencies and intervention points.",
    icon: Activity,
    meta: "Format: .json / .svg",
    accent: "text-[var(--accent-rust)]",
  },
  {
    title: "The LaTeX Manuscript",
    description: "Publication-ready academic prose with citation structure and calibrated uncertainty notes.",
    icon: FileText,
    meta: "Format: .tex / .pdf",
    accent: "text-[#7b8a78]",
  },
  {
    title: "The Epistemic Audit",
    description: "A step-by-step verification log for every logical inference admitted into the result.",
    icon: GitCommit,
    meta: "Format: .log / .md",
    accent: "text-[#8e877e]",
  },
];

export function ArtifactShowcase() {
  return (
    <section className="hd-section bg-[var(--bg-primary)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="hd-kicker inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Rendered Outputs
          </p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            Evidence of truth.
          </h2>
          <p className="mt-5 text-[1rem] leading-8 text-[var(--text-secondary)]">
            We do not sell features. We provide instruments that generate verified artifacts.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)]">
          <div className="grid gap-6 md:grid-cols-3">
            {artifacts.map((artifact) => {
              const Icon = artifact.icon;
              return (
                <article key={artifact.title} className="hd-panel rounded-[28px] p-7">
                  <div className="flex items-center justify-between">
                    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                      <Icon className={`h-5 w-5 ${artifact.accent}`} strokeWidth={1.7} />
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {artifact.meta}
                    </p>
                  </div>
                  <h3 className="mt-8 font-serif text-3xl tracking-tight text-[var(--text-primary)]">
                    {artifact.title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">
                    {artifact.description}
                  </p>
                  <button className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                    <span>View sample</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </article>
              );
            })}
          </div>

          <aside className="hd-panel-note rounded-[28px] p-6">
            <p className="hd-metric-label" style={{color: 'var(--accent-rust)', opacity: 0.7}}>Research note</p>
            <p className="mt-5 font-serif text-3xl italic leading-10 text-[var(--text-primary)]">
              Verified artifacts are the visible edge of a much deeper audit discipline.
            </p>
            <div className="mt-10 border-t border-[var(--border-subtle)] pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Archive / Evidence / Causality
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
