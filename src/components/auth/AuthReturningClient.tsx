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
    <div className="theme-landing min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/wu-wei-mark-true-alpha.png"
              alt="Wu-Weism mark"
              width={100}
              height={78}
              className="h-auto w-[88px] object-contain"
              unoptimized
              priority
            />
            <div className="hidden md:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Wu-Weism Access
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Identity restored</p>
            </div>
          </Link>

          <ThemeToggle variant="landing" />
        </header>

        <main className="flex flex-1 items-center justify-center py-10 md:py-14">
          <div className="auth-panel-surface w-full max-w-[860px] rounded-[36px] p-8 md:p-10">
            <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-rust-strong)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
              Callback transition
            </div>

            <h1 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-[4.5rem]">
              Identity verified.
              <br />
              <em className="text-[var(--accent-rust)]">Re-entering the instrument.</em>
            </h1>

            <p className="mt-6 max-w-3xl text-[1.02rem] leading-8 text-[var(--text-secondary)]">
              Google has completed account selection. Wu-Weism is restoring your authenticated session and returning you to the workspace path below.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.replace(nextPath)}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-[rgba(171,111,57,0.3)] bg-[linear-gradient(180deg,#b77739_0%,#a86a31_100%)] px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#171411] shadow-[inset_0_1px_0_rgba(255,244,230,0.34)] transition-transform hover:-translate-y-0.5 hover:brightness-[1.03] dark:border-[rgba(224,163,108,0.32)] dark:bg-[linear-gradient(180deg,var(--accent-rust-strong)_0%,var(--accent-rust)_100%)] dark:shadow-none"
              >
                <ArrowRight className="h-4 w-4" />
                Continue now
              </button>
              <div className="auth-panel-chip inline-flex items-center gap-3 rounded-full px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-rust)]" />
                Redirecting automatically
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
