"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
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
    return () => { isMounted = false; };
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
    <section className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* ── Left column — text content ─────────────────────────────────── */}
      {/* bg is on the left column only — right column is transparent so the  */}
      {/* fixed particle canvas (z-20) shows through without obstruction.     */}
      <div className="relative z-10 bg-[var(--bg-primary)] flex flex-col justify-between px-10 pt-32 pb-16 md:px-16 lg:px-24">

        {/* Top content block */}
        <div>
          {/* Eyebrow — horizontal rule + mono caps, matches image.png */}
          <div className="flex items-center gap-3 mb-10">
            <span className="block h-px w-8 bg-[var(--accent-rust)] flex-shrink-0" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              WU-WEISM · CAUSAL SCIENCE
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hd-serif-display text-[var(--text-primary)]"
            style={{ fontSize: "clamp(3.2rem, 6.5vw, 6.5rem)" }}
          >
            Causal Science.{" "}
            <br />
            <em className="italic text-[var(--accent-rust)]">Automated.</em>
          </h1>

          {/* Body */}
          <p
            className="mt-7 max-w-[34rem] text-[1.02rem] leading-[1.8] text-[var(--text-secondary)]"
            style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}
          >
            From observation to counterfactual — Pearl&apos;s causal ladder,
            automated with institutional rigor.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-6">
            {/* Dark pill button */}
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

            {/* White paper link — inline with primary button */}
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

        {/* Bottom meta row — SECTOR / PLATFORM, matches image.png */}
        <dl className="mt-20 grid grid-cols-2 gap-x-6 font-mono text-[0.58rem] uppercase tracking-[0.16em]">
          <div>
            <dt className="text-[var(--text-tertiary)]">Sector</dt>
            <dd className="mt-1 text-[var(--text-muted)]">Causal AI</dd>
          </div>
          <div>
            <dt className="text-[var(--text-tertiary)]">Platform</dt>
            <dd className="mt-1 text-[var(--text-muted)]">wuweism.com</dd>
          </div>
        </dl>
      </div>

      {/* ── Right column — MASA architecture diagram ───────────────────── */}
      <div className="hidden lg:flex items-center justify-center relative" aria-hidden="true">
        <MasaArchitecture className="w-[580px] max-w-[95%] opacity-80" />
      </div>

      {/* Bottom edge rule */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-subtle)]" />
    </section>
  );
}
