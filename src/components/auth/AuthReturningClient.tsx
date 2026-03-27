'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowRight, Loader2, Orbit, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthReturningClientProps {
  nextPath: string;
}

export function AuthReturningClient({ nextPath }: AuthReturningClientProps) {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [nextPath, router]);

  return (
    <div className="theme-landing auth-grid-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="auth-grid-overlay" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1520px] flex-col px-5 pb-8 pt-6 sm:px-7 lg:px-10">
        <header className="flex items-start justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 sm:gap-4">
            <Image
              src="/wu-logo.png"
              alt="Wu-Weism mark"
              width={100}
              height={78}
              className="h-auto w-16 object-contain sm:w-20 lg:w-24"
              unoptimized
              priority
            />
            <div className="hidden sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Wu-Weism Access
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Identity restored</p>
            </div>
          </Link>

          <ThemeToggle variant="landing" className="auth-theme-toggle" />
        </header>

        <main className="flex flex-1 items-center py-10 md:py-14">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)] xl:gap-14">
            <section className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-rust-strong)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
                Callback transition
              </div>

              <h1 className="mt-8 max-w-4xl font-serif text-[3rem] leading-[0.94] tracking-tight text-[var(--text-primary)] md:text-[4.5rem] xl:text-[5rem]">
                Identity verified.
                <br />
                <em className="text-[var(--accent-rust)]">Re-entering the instrument.</em>
              </h1>

              <p className="mt-7 max-w-2xl text-[1rem] leading-8 text-[var(--text-secondary)] md:text-[1.08rem]">
                Google completed account selection. Wu-Weism is restoring your authenticated session, rehydrating the app-owned state, and sending you back to the requested workspace path.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="auth-panel-info rounded-[24px] px-5 py-5">
                  <ShieldCheck className="h-5 w-5 text-[var(--accent-rust)]" strokeWidth={1.7} />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Provider
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Google authentication accepted.
                  </p>
                </div>
                <div className="auth-panel-info rounded-[24px] px-5 py-5">
                  <Orbit className="h-5 w-5 text-[var(--accent-rust)]" strokeWidth={1.7} />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Session
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Cookies and workspace continuity restored on the app side.
                  </p>
                </div>
                <div className="auth-panel-info rounded-[24px] px-5 py-5">
                  <ArrowRight className="h-5 w-5 text-[var(--accent-rust)]" strokeWidth={1.7} />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Return path
                  </p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-primary)]">
                    {nextPath}
                  </p>
                </div>
              </div>
            </section>

            <section className="auth-grid-panel auth-panel-surface rounded-[34px] p-6 backdrop-blur-xl sm:p-7 md:p-9">
              <div className="auth-panel-banner rounded-[24px] px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Session handoff
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  The provider handoff is complete. This page exists only long enough to restore state and redirect cleanly.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.replace(nextPath)}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-[rgba(171,111,57,0.3)] bg-[linear-gradient(180deg,#b77739_0%,#a86a31_100%)] px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#171411] shadow-[inset_0_1px_0_rgba(255,244,230,0.34)] transition-transform hover:-translate-y-0.5 hover:brightness-[1.03] dark:border-[rgba(224,163,108,0.32)] dark:bg-[linear-gradient(180deg,var(--accent-rust-strong)_0%,var(--accent-rust)_100%)] dark:shadow-none"
                >
                  <ArrowRight className="h-4 w-4" />
                  Continue now
                </button>
                <div className="auth-panel-chip inline-flex items-center justify-center gap-3 rounded-full px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-rust)]" />
                  Redirecting automatically
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="auth-panel-info rounded-[22px] px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Destination
                  </p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-primary)]">
                    {nextPath}
                  </p>
                </div>
                <div className="auth-panel-info rounded-[22px] px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    State
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Operator session confirmed and queued for app entry.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
