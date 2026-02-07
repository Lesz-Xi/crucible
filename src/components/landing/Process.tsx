export function Process() {
  const steps = [
    {
      num: "01",
      title: "Ingestion",
      desc: "Raw unstructured data (PDFs, text, logs) is absorbed into the substrate.",
    },
    {
      num: "02",
      title: "Deconstruction",
      desc: "Information is broken down into atomic concepts, discarding noise.",
    },
    {
      num: "03",
      title: "Synthesis",
      desc: "Atomic concepts are reassembled into novel configurations using causal logic.",
    },
    {
      num: "04",
      title: "Crystallization",
      desc: "The final output is calibrated for truth and novelty, then rendered.",
    },
  ];

  return (
    <section id="process" className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 border-t border-[var(--border-subtle)]/20">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-wabi-stone"></div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-wabi-ink-light">
              Protocol
            </span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] mb-8 leading-tight">
            The Synthesis <br /> <span className="italic">Pipeline</span>
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed max-w-md">
            We do not simply retrieve information. We transmute it.
            Our pipeline mimics the cognitive leap of a disciplined mind, moving
            from observation to insight.
          </p>
        </div>

        <div className="relative space-y-8">
           {/* Vertical Line */}
           <div className="absolute left-6 top-4 bottom-4 w-px bg-[var(--border-subtle)]/40 -z-10" />

           {steps.map((step, idx) => (
              <div key={idx} className="relative pl-16 group">
                 {/* Node */}
                 <div className="absolute left-[1.35rem] top-1 w-3 h-3 rounded-full bg-wabi-washi border-2 border-wabi-sand group-hover:border-wabi-clay transition-colors z-10" />
                 
                 <div className="space-y-2">
                    <span className="font-mono text-[10px] text-wabi-clay uppercase tracking-widest block mb-1">Step {step.num}</span>
                    <h3 className="font-serif text-base text-[var(--text-primary)]">{step.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">{step.desc}</p>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </section>
  );
}
