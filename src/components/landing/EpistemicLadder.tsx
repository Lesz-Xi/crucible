import { EpistemicCards } from "./EpistemicCards";

export function EpistemicLadder() {
  return (
    <section className="hd-section bg-[var(--bg-secondary)] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-14 max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Reasoning Hierarchy</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] leading-[1.05]">
            Three rungs of{" "}
            <em className="italic font-light text-[var(--accent-rust)]">causal reasoning</em>
          </h2>
          <p className="mt-5 text-[1rem] leading-8 text-[var(--text-secondary)] max-w-sm">
            Most AI systems only operate at rung one — observation. MASA is built
            to execute all three.
          </p>
        </div>
        <EpistemicCards compact={false} />
      </div>
    </section>
  );
}
