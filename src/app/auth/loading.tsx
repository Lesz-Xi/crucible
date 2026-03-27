import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthLoading() {
  return (
    <div className="theme-landing min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/wu-logo.png"
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
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Preparing the airlock</p>
            </div>
          </Link>

          <ThemeToggle variant="landing" />
        </header>

        <main className="flex flex-1 items-center justify-center py-10 md:py-14">
          <div className="auth-panel-surface w-full max-w-[720px] rounded-[34px] p-8 md:p-10">
            <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-rust-strong)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
              Authentication state
            </div>
            <h1 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
              Preparing the
              <br />
              <em className="text-[var(--accent-rust)]">Wu-Weism airlock.</em>
            </h1>
            <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-[var(--text-secondary)]">
              Loading the branded sign-in surface and checking the current session state before any provider handoff.
            </p>
            <div className="auth-panel-chip mt-8 flex items-center gap-3 rounded-[22px] px-4 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-rust)]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Status
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">
                  Warming up auth state and operator routing.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
