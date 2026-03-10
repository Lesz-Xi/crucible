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
    <section id="process" className="hd-section py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:px-8 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="marketing-pill mb-8 inline-flex w-fit items-center gap-3 px-4 py-2">
            <span className="marketing-dot" />
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

        <div className="marketing-section-surface relative space-y-5 rounded-[30px] p-6 md:p-8">
          <div className="absolute left-[2rem] top-10 bottom-10 w-px bg-[var(--border-subtle)]" />
          <div className="absolute left-[2rem] top-10 bottom-10 w-px bg-[linear-gradient(180deg,var(--accent-rust),rgba(136,166,138,0.7))]" />

          {steps.map((step) => (
            <div key={step.num} className="marketing-card relative rounded-[24px] pl-20 pr-5 py-5">
              <div className="absolute left-[1.48rem] top-6 z-10 h-4 w-4 rounded-full border border-[rgba(255,224,194,0.24)] bg-[var(--bg-primary)] shadow-[0_0_0_5px_rgba(17,17,17,0.85)]" />
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
