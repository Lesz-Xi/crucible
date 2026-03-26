"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { getCurrentUser, signInWithGoogle } from "@/lib/auth/actions";

export function Hero() {
  const router = useRouter();
  const [isLoadingAuthState, setIsLoadingAuthState] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAuthState = async () => {
      try {
        const user = await getCurrentUser();
        if (isMounted) setIsSignedIn(Boolean(user?.id));
      } catch {
        if (isMounted) setIsSignedIn(false);
      } finally {
        if (isMounted) setIsLoadingAuthState(false);
      }
    };
    void loadAuthState();
    return () => { isMounted = false; };
  }, []);

  const handlePrimaryAction = async () => {
    if (isLoadingAuthState) return;
    if (isSignedIn) {
      router.push("/chat");
    } else {
      await signInWithGoogle("/chat");
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col items-start justify-end overflow-hidden bg-[var(--bg-primary)] px-10 pb-24 pt-40 md:px-16 lg:px-24">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-24 left-1/2 h-[600px] w-[900px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(166,124,82,0.07) 0%, transparent 68%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-subtle)]" />
      </div>

      <div className="relative z-10 w-full max-w-[880px]">
        {/* Eyebrow */}
        <p className="hd-kicker mb-8 uppercase">
          MASA · Methods of Automated Scientific Analysis · Pearl do-calculus
        </p>

        {/* Headline */}
        <h1
          className="hd-serif-display text-[var(--text-primary)]"
          style={{ fontSize: "clamp(3.5rem, 7.5vw, 7rem)" }}
        >
          Causal Science.{" "}
          <em className="italic text-[var(--accent-rust)]">Automated.</em>
          <br />
          Disciplined.
        </h1>

        {/* Sub */}
        <p
          className="mt-8 max-w-[36rem] text-[1.05rem] leading-[1.75] text-[var(--text-secondary)]"
          style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}
        >
          The world&apos;s first Automated Scientist — traversing Pearl&apos;s
          ladder from observation to counterfactual with institutional rigor and
          neural-speed synthesis.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isLoadingAuthState}
            className="hover:from-[#c8965a]/15 hover:via-[#c8965a]/25 hover:to-[#c8965a]/15 hover:scale-105 duration-500 ease-out transition-all flex group text-sm font-medium bg-gradient-to-b from-black/10 via-black/20 to-black/10 rounded-full pt-3 pr-6 pb-3 pl-6 relative shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] gap-x-2 gap-y-2 items-center disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              boxShadow:
                "rgba(31, 41, 55, 0.25) 0px 18px 35px, rgba(209, 213, 219, 0.3) 0px 0px 0px 1px",
              color: "rgb(229, 231, 235)",
            }}
          >
            {isLoadingAuthState ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform duration-300 group-hover:translate-x-0.5" />
            )}
            <span>
              {isLoadingAuthState
                ? "Loading"
                : isSignedIn
                ? "Open Instrument"
                : "Begin Research"}
            </span>
          </button>

          <a
            href="/masa-white-paper.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-0.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-rust)] hover:text-[var(--text-primary)]"
          >
            Read white paper →
          </a>
        </div>

        {/* Bottom tagline */}
        <p className="mt-20 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          Observation &nbsp;·&nbsp; Intervention &nbsp;·&nbsp; Counterfactual
        </p>
      </div>
    </section>
  );
}
