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

export function Process() {
  return (
    <section id="process" className="hd-section bg-white py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:px-8 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="hd-kicker mb-8 inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Protocol
          </div>
          <h2 className="hd-serif-display text-[3.6rem] text-[var(--text-primary)] md:text-[5rem]">
            The Synthesis
            <br />
            <em>Pipeline.</em>
          </h2>
          <p className="mt-8 max-w-md text-[1.08rem] leading-9 text-[var(--text-secondary)]">
            We do not simply retrieve information. We transmute it. Our pipeline
            mimics the cognitive leap of a disciplined mind, moving from
            observation to insight.
          </p>
        </div>

        <div className="relative space-y-14">
          <div className="absolute left-[1.7rem] top-5 bottom-5 w-px bg-[var(--border-subtle)]" />
          <div className="absolute left-[1.7rem] top-5 bottom-5 w-px bg-[var(--accent-rust)]" />

          {steps.map((step) => (
            <div key={step.num} className="relative pl-20">
              <div className="absolute left-[1.32rem] top-2 z-10 h-4 w-4 rounded-full border border-[var(--border-subtle)] bg-white" />
              <div>
                <p className="hd-kicker mb-3">Step {step.num}</p>
                <h3 className="font-sans text-[2.15rem] font-semibold tracking-tight text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-sm text-[1rem] leading-8 text-[var(--text-secondary)]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
