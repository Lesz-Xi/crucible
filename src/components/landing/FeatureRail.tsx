"use client";

import { useState } from "react";
import { MessageSquare, Scale, GraduationCap } from "lucide-react";
import { LiquidSegmentedControl } from "@/components/ui/liquid-segmented-control";
import { LiquidSlider } from "@/components/ui/liquid-slider";

const features = [
  {
    label: "Chat",
    subtitle: "Quiet Precision",
    description: "Run causal dialogue with focused intervention logic and controlled evidence scope.",
    icon: MessageSquare,
    accent: "text-[#7b8a78]",
  },
  {
    label: "Legal",
    subtitle: "Ritual Flow",
    description: "Trace intent to action to harm with legal causation and explicit validation boundaries.",
    icon: Scale,
    accent: "text-[var(--accent-rust)]",
  },
  {
    label: "Learn",
    subtitle: "Warm Intelligence",
    description: "Personalize learning paths through adaptive causal models and interpretable interventions.",
    icon: GraduationCap,
    accent: "text-[#8e877e]",
  },
];

export function FeatureRail() {
  const [segment, setSegment] = useState<"for-you" | "library">("for-you");
  const [intensity, setIntensity] = useState(58);

  return (
    <section
      aria-label="Primary product features"
      className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-6 md:pb-32 md:pt-10 lg:pt-14"
    >
      <div className="mx-auto mb-10 max-w-6xl rounded-[22px] hd-panel p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Liquid Segmented
            </p>
            <LiquidSegmentedControl
              value={segment}
              onChange={setSegment}
              options={[
                { value: "for-you", label: "For You" },
                { value: "library", label: "Library" },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Glass Intensity
            </p>
            <LiquidSlider value={intensity} onChange={setIntensity} min={0} max={100} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-end gap-x-5 gap-y-6 md:grid-cols-12 md:gap-y-10 lg:gap-x-7">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const layoutClass = [
            "md:col-span-4",
            index === 0 && "lg:col-span-3 lg:mt-10 lg:min-h-[208px]",
            index === 1 && "lg:col-span-6 lg:-mt-4 lg:min-h-[236px]",
            index === 2 && "lg:col-span-3 lg:mt-10 lg:min-h-[208px]",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article
              key={feature.label}
              className={[
                "group relative min-h-[188px] rounded-[18px] border border-[var(--border-subtle)]/90 bg-[var(--bg-card)]/88 p-6 shadow-[var(--shadow-soft)] transition-all duration-[220ms] ease-out hover:-translate-y-0.5 hover:bg-[var(--bg-secondary)]/94",
                layoutClass,
              ].join(" ")}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--border-strong)] to-transparent" />
              <div className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-[var(--accent-rust-soft)]" />
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${feature.accent}`} />
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]/95">
                    {feature.label}
                  </span>
                </div>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {feature.subtitle}
              </p>
              <div className="mt-5 h-px w-14 bg-gradient-to-r from-[var(--accent-rust)]/55 to-transparent" />
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
