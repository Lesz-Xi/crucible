'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Loader2, Orbit, ShieldCheck } from 'lucide-react';
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/actions';
import type { AppAuthUser } from '@/types/auth';

interface AuthAirlockProps {
  nextPath: string;
  callbackError?: string | null;
  authConfigured: boolean;
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.33-.18-1.96H12v3.7h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.32 2.97-7.26Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.5c-.9.6-2.05.95-3.37.95-2.59 0-4.79-1.75-5.58-4.11H3.08v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.42 13.9A5.99 5.99 0 0 1 6.1 12c0-.66.11-1.3.32-1.9V7.52H3.08A10 10 0 0 0 2 12c0 1.61.38 3.14 1.08 4.48l3.34-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2A10 10 0 0 0 3.08 7.52L6.42 10.1c.79-2.36 2.99-4.13 5.58-4.13Z"
      />
    </svg>
  );
}

export function AuthAirlock({ nextPath, callbackError, authConfigured }: AuthAirlockProps) {
  const router = useRouter();
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(callbackError || null);
  const emailFallbackHref = `/auth/email?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } finally {
        if (!cancelled) setIsLoadingUser(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLaunch = async () => {
    if (isLoadingUser || isRedirecting) return;

    if (user) {
      router.push(nextPath);
      return;
    }

    if (!authConfigured) {
      setStatusMessage('Google sign-in is not configured for this deployment.');
      return;
    }

    setStatusMessage('Preparing secure handoff to Google.');
    setIsRedirecting(true);

    const { error } = await signInWithGoogle(nextPath);
    if (error) {
      setStatusMessage(error);
      setIsRedirecting(false);
    }
  };

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
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Grid-authored operator entry</p>
            </div>
          </Link>
          <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent-rust-strong)] shadow-[var(--shadow-soft)]">
            Light access
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 md:py-14">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:gap-14">
            <section className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-rust-strong)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
                Instrument-grade entry
              </div>

              <h1 className="mt-8 max-w-4xl font-serif text-[3rem] leading-[0.94] tracking-tight text-[var(--text-primary)] md:text-[4.5rem] xl:text-[5.4rem]">
                Enter the
                <br />
                Wu-Weism
                <br />
                <em className="text-[var(--accent-rust)]">command surface.</em>
              </h1>

              <p className="mt-7 max-w-2xl text-[1rem] leading-8 text-[var(--text-secondary)] md:text-[1.08rem]">
                Google remains the provider-owned account chooser, but the entry, return path, and operator context stay inside Wu-Weism. The auth step should feel like part of the instrument, not a detour out of it.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-5 shadow-[var(--shadow-soft)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--accent-rust)]" strokeWidth={1.7} />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Trust-first
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Identity before persistence, provenance, and cloud history sync.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-5 shadow-[var(--shadow-soft)]">
                  <KeyRound className="h-5 w-5 text-[var(--accent-rust)]" strokeWidth={1.7} />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    BYOK-ready
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Google gets you in. Provider keys are configured after sign-in inside the tool.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-5 shadow-[var(--shadow-soft)]">
                  <Orbit className="h-5 w-5 text-[var(--accent-rust)]" strokeWidth={1.7} />
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Return path
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    You will be returned to <span className="font-mono text-[var(--text-primary)]">{nextPath}</span> after authentication.
                  </p>
                </div>
              </div>
            </section>

            <section className="auth-grid-panel auth-panel-surface rounded-[34px] p-6 backdrop-blur-xl sm:p-7 md:p-9">
                <div className="auth-panel-banner flex items-start justify-between gap-4 rounded-[24px] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="auth-mark-chip flex h-12 w-12 items-center justify-center rounded-[18px]">
                      <Image
                        src="/wu-logo.png"
                        alt="Wu-Weism mark"
                        width={42}
                        height={32}
                        className="h-auto w-8 object-contain sm:w-9"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Auth airlock
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Wu-Weism frames the handoff. Google handles account selection.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full border border-[rgba(171,111,57,0.18)] bg-[rgba(184,125,72,0.1)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent-rust-strong)]">
                    Google only
                  </div>
                </div>
                <h2 className="mt-5 font-serif text-4xl tracking-tight text-[var(--text-primary)]">
                  {user ? 'Workspace recognized.' : 'Continue with Google.'}
                </h2>
                <p className="mt-4 text-[0.98rem] leading-7 text-[var(--text-secondary)]">
                  {user
                    ? `Signed in as ${user.fullName || user.email || 'authenticated operator'}. Continue into the instrument.`
                    : 'Choose Google to enter. Wu-Weism preserves the return path, restores the workspace after sign-in, and keeps the app-owned parts of the flow inside the instrument.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    'Provider-owned chooser',
                    'BYOK after sign-in',
                    'Private workspace return',
                  ].map((label) => (
                    <span
                      key={label}
                      className="auth-panel-chip rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {statusMessage ? (
                  <div className="mt-6 rounded-[22px] border border-[var(--border-glow)] bg-[var(--accent-rust-soft)] px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent-rust-strong)]">
                      Auth status
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{statusMessage}</p>
                  </div>
                ) : null}

                {!authConfigured ? (
                  <div className="mt-6 rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card-soft)] px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Configuration
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      Public Supabase environment variables are missing, so OAuth cannot start on this deployment.
                    </p>
                  </div>
                ) : null}

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={handleLaunch}
                    disabled={isLoadingUser || isRedirecting || !authConfigured}
                    className="auth-primary-action inline-flex w-full items-center justify-center gap-3 rounded-full px-5 py-4 font-mono text-[11px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingUser || isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : user ? <ArrowRight className="h-4 w-4" /> : <GoogleGlyph />}
                    <span>
                      {isLoadingUser
                        ? 'Inspecting session'
                        : isRedirecting
                          ? 'Redirecting to Google'
                          : user
                            ? 'Open instrument'
                            : 'Continue with Google'}
                    </span>
                  </button>

                  <Link
                    href={emailFallbackHref}
                    className="auth-secondary-action inline-flex w-full items-center justify-center rounded-full px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em]"
                  >
                    Use email instead
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-[0.72rem] text-[var(--text-muted)]">
                  <Link href="/" className="transition-colors hover:text-[var(--text-primary)]">
                    Return to landing
                  </Link>
                  <span className="font-mono uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    OAuth chooser stays provider-owned
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="auth-panel-info rounded-[22px] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Provider
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                      Google OAuth account selection
                    </p>
                  </div>
                  <div className="auth-panel-info rounded-[22px] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Return path
                    </p>
                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-primary)]">
                      {nextPath}
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
