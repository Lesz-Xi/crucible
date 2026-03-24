import { Wind, Droplets, Circle } from "lucide-react";

const features = [
  {
    icon: Wind,
    title: "Fukinsei",
    subtitle: "Asymmetry",
    description: "Detecting value in irregular data patterns that conventional models discard.",
    meta: "Signal irregularities // retained",
    accent: "bg-[var(--accent-moss)]",
    iconColor: "text-[var(--accent-moss)]",
  },
  {
    icon: Droplets,
    title: "Shibumi",
    subtitle: "Subtlety",
    description: "Generating insights that are quiet but profound, prioritizing depth over noise.",
    meta: "Compression bias // reduced",
    accent: "bg-[var(--accent-rust)]",
    iconColor: "text-[var(--accent-rust)]",
  },
  {
    icon: Circle,
    title: "Datsuzoku",
    subtitle: "Transcendence",
    description: "Breaking free from habituated thinking to discover genuinely novel connections.",
    meta: "Novel linkages // admissible",
    accent: "bg-[var(--accent-rust-strong)]",
    iconColor: "text-[var(--accent-rust-strong)]",
  },
];

export function Features() {
  return (
    <section id="features" className="hd-section bg-[var(--bg-primary)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker text-[var(--accent-rust)]">Core Capabilities</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Organic Intelligence
          </h2>
          <p className="leading-relaxed text-[var(--text-secondary)]">
            Beyond mere calculation. A synthesis engine designed to understand the
            nuance, context, and contradictions inherent in human knowledge.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-soft)] transition-all duration-[220ms] ease-out hover:-translate-y-0.5 hover:border-[var(--border-glow)] hover:bg-[var(--bg-card-soft)]"
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${feature.accent} opacity-70`} />
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <Icon className={`h-6 w-6 ${feature.iconColor}`} strokeWidth={1.8} />
                </div>

                <h3 className="mb-2 font-serif text-xl text-[var(--text-primary)]">
                  {feature.title} ({feature.subtitle})
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>

                <div className="mt-8 border-t border-[var(--border-subtle)] pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {feature.meta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
