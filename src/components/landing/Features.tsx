import { Wind, Droplets, Circle } from "lucide-react";

const features = [
  {
    icon: Wind,
    title: "Fukinsei",
    subtitle: "Asymmetry",
    description: "Detecting value in irregular data patterns that conventional models discard.",
    meta: "Signal irregularities // retained",
    accent: "bg-[#7b8a78]",
    iconColor: "text-[#7b8a78]",
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
    accent: "bg-[#8e877e]",
    iconColor: "text-[#8e877e]",
  },
];

export function Features() {
  return (
    <section id="features" className="hd-section bg-white py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto mb-12 max-w-3xl space-y-3 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker text-[var(--accent-rust)]">Core Capabilities</span>
          </div>
          <h2 className="font-serif text-[2.6rem] text-[var(--text-primary)] md:text-[3.2rem]">
            Organic Intelligence
          </h2>
          <p className="mx-auto max-w-[38rem] text-[0.98rem] leading-7 text-[var(--text-secondary)]">
            Beyond mere calculation. A synthesis engine designed to understand the
            nuance, context, and contradictions inherent in human knowledge.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-[24px] border border-[var(--border-subtle)] bg-white p-6 transition-all duration-[220ms] ease-out"
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${feature.accent} opacity-70`} />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <Icon className={`h-6 w-6 ${feature.iconColor}`} strokeWidth={1.8} />
                </div>

                <h3 className="mb-2 font-serif text-[1.15rem] text-[var(--text-primary)]">
                  {feature.title} ({feature.subtitle})
                </h3>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  {feature.description}
                </p>

                <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
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
