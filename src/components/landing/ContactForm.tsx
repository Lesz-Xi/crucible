export function ContactForm() {
  return (
    <section id="contact" className="hd-section py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <div className="mb-10 text-center">
          <p className="marketing-pill inline-flex gap-3 px-4 py-2">
            <span className="marketing-dot" />
            Access Request
          </p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            Join the synthesis.
          </h2>
          <p className="mt-5 text-[1rem] leading-8 text-[var(--text-secondary)]">
            Request access to the beta program or schedule a demo.
          </p>
        </div>

        <form className="marketing-section-surface rounded-[34px] p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="hd-metric-label">Name</label>
              <input
                type="text"
                className="marketing-input lg-input mt-3 w-full rounded-[18px] px-4 py-3.5"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="hd-metric-label">Email</label>
              <input
                type="email"
                className="marketing-input lg-input mt-3 w-full rounded-[18px] px-4 py-3.5"
                placeholder="name@institute.org"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="hd-metric-label">Inquiry</label>
            <textarea
              rows={5}
              className="marketing-input lg-input mt-3 w-full rounded-[22px] px-4 py-3.5"
              placeholder="Describe the environment, team, or evidence workflow you want to support."
            />
          </div>

          <button className="marketing-button-primary mt-8 w-full px-5 py-4">
            Send Request
          </button>
        </form>
      </div>
    </section>
  );
}
