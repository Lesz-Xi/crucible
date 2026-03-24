import { Wind, Droplets, Circle, Sparkles } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Wind,
      iconClass: "text-wabi-moss",
      toneClass: "from-wabi-moss/18",
      title: "Fukinsei (Asymmetry)",
      description: "Detecting value in irregular data patterns that conventional models discard.",
    },
    {
      icon: Droplets,
      iconClass: "text-wabi-clay",
      toneClass: "from-wabi-clay/16",
      title: "Shibumi (Subtlety)",
      description: "Generating insights that are quiet but profound, prioritizing depth over noise.",
    },
    {
      icon: Circle,
      iconClass: "text-wabi-rust",
      toneClass: "from-wabi-rust/16",
      title: "Datsuzoku (Transcendence)",
      description: "Breaking free from habituated thinking to discover genuinely novel connections.",
    },
  ];

  return (
    <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
       <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 mb-4">
             <div className="w-1.5 h-1.5 rounded-full bg-wabi-moss"></div>
             <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Core Capabilities</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)]">
             Organic Intelligence
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
             Beyond mere calculation. A synthesis engine designed to understand the 
             nuance, context, and contradictions inherent in human knowledge.
          </p>
       </div>

       <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
             const Icon = feature.icon;
             return (
               <div
                 key={idx}
                 className="group lg-card relative p-8 rounded-[22px] border border-[var(--border-subtle)]/70 bg-[var(--bg-secondary)]/78 shadow-wabi transition-all duration-[220ms] ease-out hover:bg-[var(--bg-secondary)] hover:-translate-y-0.5"
               >
                 <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${feature.toneClass} to-transparent`} />
                 <div className="absolute top-6 right-6 opacity-15 group-hover:opacity-30 transition-opacity duration-[180ms]">
                    <Sparkles className="w-6 h-6 text-[var(--text-primary)]" />
                 </div>

                 <div className="lg-control w-14 h-14 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)]/45 flex items-center justify-center mb-6 shadow-sm transition-transform duration-[220ms] ease-out group-hover:scale-[1.04]">
                    <Icon className={`w-6 h-6 ${feature.iconClass}`} />
                 </div>

                 <h3 className="font-serif text-xl text-[var(--text-primary)] mb-3">{feature.title}</h3>
                 <p className="font-mono text-xs leading-relaxed text-[var(--text-secondary)]">{feature.description}</p>
               </div>
             );
          })}
       </div>
    </section>
  );
}
