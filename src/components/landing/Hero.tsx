"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/actions";
import { MasaArchitecture } from "@/components/landing/MasaArchitecture";

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
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrimaryAction = async () => {
    if (isLoadingAuthState) return;
    if (isSignedIn) {
      router.push("/chat");
    } else {
      router.push("/auth?next=%2Fchat");
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1560px] flex-col px-6 pb-8 pt-36 md:px-10 lg:px-14 lg:pt-40">
        <div className="landing-hero-top-grid gap-12">
          <div className="max-w-[62rem]">
            <div className="flex items-center gap-3">
              <span className="block h-px w-10 bg-[var(--accent-rust)]" />
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                WU-WEISM · CAUSAL OPERATIONS SYSTEM
              </span>
            </div>

            <h1 className="landing-hero-headline mt-8 max-w-[15ch] text-[var(--text-primary)]">
              The causal control system for research teams and agentic labs.
            </h1>
          </div>

          <div className="landing-hero-copy-column">
            <p className="landing-hero-support max-w-[34rem] text-[var(--text-secondary)]">
              Coordinate evidence, critique, intervention, and counterfactual execution inside a
              single governed operating surface. MASA turns causal research into a live system of
              routes, signals, and traceable decision states.
            </p>

            <div className="landing-hero-note mt-8 max-w-[28rem]">
              <span className="landing-hero-note-dot" aria-hidden="true" />
              <span>
                Real-time mimic routing for model state, provenance, and intervention readiness.
              </span>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isLoadingAuthState}
                className="landing-hero-primary-button flex items-center gap-x-2 gap-y-2 rounded-full border border-[var(--border-subtle)] px-6 py-3 text-sm font-medium transition-all duration-500 ease-out hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 group"
                style={{
                  background:
                    "linear-gradient(180deg, var(--landing-hero-cta-from), var(--landing-hero-cta-via), var(--landing-hero-cta-to))",
                  boxShadow: "var(--landing-hero-cta-shadow)",
                  color: "var(--text-primary)",
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
          </div>
        </div>

        <div className="mt-14 flex flex-1 items-end lg:mt-20">
          <div className="landing-mimic-board-wrap relative w-full">
            <div className="landing-mimic-board-glow" aria-hidden="true" />
            <MasaArchitecture className="landing-mimic-board relative z-10 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
