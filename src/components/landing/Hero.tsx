"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
    <section className="relative flex min-h-[90vh] items-end overflow-hidden bg-[var(--bg-primary)] px-6 pb-24 pt-44 md:px-10 lg:px-16">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-subtle)]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-6">
          MASA · Causal Workbench · Pearl do-calculus
        </p>

        <h1
          className="font-serif text-[var(--text-primary)] leading-[0.92] tracking-[-0.04em]"
          style={{ fontSize: "clamp(3.2rem, 7vw, 6.5rem)" }}
        >
          Causal{" "}
          <em className="italic font-light text-[var(--accent-rust)]">Architect</em>
        </h1>

        <p className="mt-8 max-w-[30rem] text-[1.05rem] leading-8 text-[var(--text-secondary)]">
          Traversing Pearl&apos;s ladder from observation to counterfactual.
          Disciplined causal inquiry — not plausible text generation.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isLoadingAuthState}
            className="inline-flex items-center gap-2 bg-[var(--accent-rust)] px-6 py-3 text-sm font-semibold rounded-[10px] transition-opacity hover:opacity-[0.88] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ color: "#ffffff" }}
          >
            {isLoadingAuthState && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              {isLoadingAuthState ? "Loading" : isSignedIn ? "Open Instrument" : "Try Wu-Weism"}
            </span>
          </button>

          <a
            href="/masa-white-paper.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-0.5 transition-colors"
          >
            Read white paper →
          </a>
        </div>

        <p className="mt-16 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Observation · Intervention · Counterfactual
        </p>
      </div>
    </section>
  );
}
