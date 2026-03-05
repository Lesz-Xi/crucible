import Link from "next/link";
import { User, Users, Lock, Share2 } from "lucide-react";

const modes = [
  {
    href: "/chat",
    icon: User,
    accent: "text-[var(--accent-rust)]",
    accentBg: "bg-[var(--accent-rust-soft)]",
    mode: "Mode 01",
    meta: "Private graph construction",
    title: "Autonomous Synthesis",
    description:
      "For the researcher operating in deep isolation. A private, high-density environment to synthesize complex graphs without noise.",
    bullets: ["Encrypted session", "Unfiltered inference"],
    cta: "Enter Deep Work",
    primary: true,
  },
  {
    href: "/epistemic",
    icon: Users,
    accent: "text-[#7b8a78]",
    accentBg: "bg-[rgba(123,138,120,0.12)]",
    mode: "Mode 02",
    meta: "Shared audit environment",
    title: "Epistemic Verification",
    description:
      "For the institute requiring verified consensus. A shared epistemic layer where every causal inference is logged, audited, and peer-reviewed.",
    bullets: ["Epistemic validation", "Audit trail"],
    cta: "Start Joint Audit",
    primary: false,
  },
];

export function ResearchModes() {
  return (
    <section className="hd-section bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Operating Modes</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Choose the epistemic posture.
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            Two deployment attitudes, both grounded in the same causal substrate:
            solitary synthesis for deep work, or shared verification for
            institutional truth-making.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            const BulletIcon = index === 0 ? Lock : Share2;

            return (
              <div key={mode.title} className="group relative">
                <article className="relative flex h-full flex-col justify-between rounded-[2rem] border border-[var(--border-subtle)] bg-white p-10 lg:p-12">
                  <div>
                    <div className="mb-10 flex items-start justify-between">
                      <div className={`rounded-[16px] border border-[var(--border-subtle)] p-3 ${mode.accentBg}`}>
                        <Icon className={`h-6 w-6 ${mode.accent}`} strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-xl uppercase tracking-[0.16em] text-[var(--text-muted)]/65">
                        {index === 0 ? "01" : "02"}
                      </span>
                    </div>

                    <div className="mb-6 border-b border-[var(--border-subtle)] pb-5">
                      <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${mode.accent}`}>
                        {mode.mode}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">{mode.meta}</p>
                    </div>

                    <h3 className="mb-6 font-serif text-4xl leading-tight text-[var(--text-primary)]">
                      {mode.title.includes(" ") ? (
                        <>
                          {mode.title.split(" ")[0]}
                          <br />
                          {mode.title.split(" ").slice(1).join(" ")}
                        </>
                      ) : (
                        mode.title
                      )}
                    </h3>

                    <p className="mb-10 text-sm leading-8 text-[var(--text-secondary)]">
                      {mode.description}
                    </p>

                    <div className="mb-10 space-y-4 border-t border-[var(--border-subtle)] pt-6">
                      {mode.bullets.map((bullet, bulletIndex) => (
                        <div key={bullet} className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full ${mode.accentBg}`}>
                            {bulletIndex === 0 ? (
                              <BulletIcon className={`h-3 w-3 ${mode.accent}`} />
                            ) : (
                              <div className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-[var(--accent-rust)]" : "bg-[#7b8a78]"}`} />
                            )}
                          </div>
                          <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]/75">
                            {bullet}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href={mode.href} className="block w-full">
                    <button
                      className={`w-full border px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                        mode.primary
                          ? "border-[var(--accent-dark)] bg-[var(--accent-dark)] text-white hover:opacity-92"
                          : "border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      {mode.cta}
                    </button>
                  </Link>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
