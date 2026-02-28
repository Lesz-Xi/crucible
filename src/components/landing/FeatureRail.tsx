"use client";

import { useState } from "react";
import { MessageSquare, Scale, GraduationCap } from "lucide-react";
import { LiquidSegmentedControl } from "@/components/ui/liquid-segmented-control";
import { LiquidSlider } from "@/components/ui/liquid-slider";
import { motion } from "framer-motion";

interface LandingFeature {
  label: "Chat" | "Legal" | "Learn";
  subtitle: string;
  description: string;
  icon: typeof MessageSquare;
  accentClass: string;
  toneClass: string;
  layoutClass: string;
  hoverTextClass: string;
}

const FEATURES: LandingFeature[] = [
  {
    label: "Chat",
    subtitle: "Quiet Precision",
    description: "Run causal dialogue with focused intervention logic.",
    icon: MessageSquare,
    accentClass: "text-[#008A8A]",
    toneClass: "from-[#008A8A]/10",
    layoutClass: "md:col-span-4 lg:col-span-3 lg:mt-10 lg:min-h-[208px]",
    hoverTextClass: "group-hover:text-[#008A8A]",
  },
  {
    label: "Legal",
    subtitle: "Ritual Flow",
    description: "Trace intent to action to harm with legal causation.",
    icon: Scale,
    accentClass: "text-[#E65C00]",
    toneClass: "from-[#E65C00]/10",
    layoutClass: "md:col-span-4 lg:col-span-6 lg:-mt-4 lg:min-h-[236px]",
    hoverTextClass: "group-hover:text-[#E65C00]",
  },
  {
    label: "Learn",
    subtitle: "Warm Intelligence",
    description: "Personalize learning paths through adaptive causal models.",
    icon: GraduationCap,
    accentClass: "text-[#4B0082]",
    toneClass: "from-[#4B0082]/10",
    layoutClass: "md:col-span-4 lg:col-span-3 lg:mt-10 lg:min-h-[208px]",
    hoverTextClass: "group-hover:text-[#4B0082]",
  },
];

export function FeatureRail() {
  const [segment, setSegment] = useState<"for-you" | "library">("for-you");
  const [intensity, setIntensity] = useState(58);

  return (
    <section
      aria-label="Primary product features"
      className="relative z-10 max-w-7xl mx-auto px-6 pt-6 md:pt-10 lg:pt-14 pb-24 md:pb-32"
    >
      <div className="max-w-6xl mx-auto mb-10 rounded shadow-sm bg-white border border-black/5 p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 font-sans font-medium text-[10px] uppercase tracking-widest text-mistral-dark/50">Liquid Segmented</p>
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
            <p className="mb-2 font-sans font-medium text-[10px] uppercase tracking-widest text-mistral-dark/50">Glass Intensity</p>
            <LiquidSlider value={intensity} onChange={setIntensity} min={0} max={100} />
          </div>
        </div>
      </div>

      <div className="relative mt-12 w-full overflow-hidden flex -mx-6 px-6 mask-fade-edges">
        <motion.div 
           className="flex gap-6 pr-6 w-max"
           animate={{ x: ["0%", "-50%"] }}
           transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        >
          {/* Duplicate features to create seamless infinite loop */}
          {[...FEATURES, ...FEATURES, ...FEATURES, ...FEATURES].map((feature, idx) => {
            const Icon = feature.icon;
            
            // Derive a card height class depending on original intended layout for intentional stagger
            const cardHeight = idx % 2 === 0 ? "min-h-[220px]" : "min-h-[250px] mt-8";

            return (
              <article
                key={`${feature.label}-${idx}`}
                className={[
                  "group relative rounded bg-white p-6 md:p-7 shrink-0 w-[300px] md:w-[380px] lg:w-[420px]",
                  "border border-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-mistral",
                  cardHeight
                ].join(" ")}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${feature.toneClass} to-transparent`} />
                <div className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-[var(--border-subtle)]/90" />
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${feature.accentClass}`} />
                    <span className="font-sans font-bold text-xs uppercase tracking-widest text-mistral-dark">
                      {feature.label}
                    </span>
                  </div>
                </div>
                <p className="mt-2 font-sans font-medium text-[10px] uppercase tracking-widest text-mistral-dark/50">
                  {feature.subtitle}
                </p>
                <div className="mt-5 h-px w-14 bg-gradient-to-r from-black/10 to-transparent" />
                <p className={`mt-4 text-sm font-sans leading-relaxed text-mistral-dark/80 transition-colors duration-300 ${feature.hoverTextClass}`}>
                  {feature.description}
                </p>
              </article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
