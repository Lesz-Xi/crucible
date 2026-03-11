export function ContactForm() {
  return (
    <section id="contact" className="hd-section bg-[var(--bg-primary)] py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <div className="mb-10 text-center">
          <p className="hd-kicker inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Access Request
          </p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            Join the synthesis.
          </h2>
          <p className="mt-5 text-[1rem] leading-8 text-[var(--text-secondary)]">
            Request access to the beta program or schedule a demo.
          </p>
        </div>

        <form className="hd-panel rounded-[34px] p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="hd-metric-label">Name</label>
              <input
                type="text"
                className="lg-input mt-3 w-full rounded-[18px] border border-[var(--border-subtle)] px-4 py-3.5"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="hd-metric-label">Email</label>
              <input
                type="email"
                className="lg-input mt-3 w-full rounded-[18px] border border-[var(--border-subtle)] px-4 py-3.5"
                placeholder="name@institute.org"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="hd-metric-label">Inquiry</label>
            <textarea
              rows={5}
              className="lg-input mt-3 w-full rounded-[22px] border border-[var(--border-subtle)] px-4 py-3.5"
              placeholder="Describe the environment, team, or evidence workflow you want to support."
            />
          </div>

          <button className="mt-8 w-full rounded-full border border-[rgba(224,163,108,0.32)] bg-[linear-gradient(180deg,var(--accent-rust-strong)_0%,var(--accent-rust)_100%)] px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#171411] transition-transform hover:-translate-y-0.5">
            Send Request
          </button>
        </form>
      </div>
    </section>
  );
}
