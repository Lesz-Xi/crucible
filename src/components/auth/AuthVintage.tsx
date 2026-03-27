"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth/actions";

type Mode = "signin" | "signup";

interface Props {
  nextPath?: string;
  callbackError?: string | null;
  authConfigured?: boolean;
}

export function AuthVintage({
  nextPath = "/chat",
  callbackError,
  authConfigured = true,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(callbackError ?? null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogle = async () => {
    if (!authConfigured) return;
    setError(null);
    setIsLoading(true);
    const result = await signInWithGoogle(nextPath);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success Supabase redirects the browser — no further action needed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authConfigured) return;
    setError(null);
    setIsLoading(true);

    if (mode === "signin") {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.push(nextPath);
      }
    } else {
      const result = await signUpWithEmail(email, password, fullName || undefined);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result.needsConfirmation) {
        setNeedsConfirmation(true);
        setIsLoading(false);
      } else {
        router.push(nextPath);
      }
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNeedsConfirmation(false);
  };

  return (
    <div
      className="theme-landing min-h-screen w-full"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Top nav bar */}
      <header className="px-6 py-5 md:px-10 md:py-6">
        <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/wu-logo.png"
            alt="Wu-Weism mark"
            width={160}
            height={123}
            className="h-auto w-14 object-contain sm:w-16"
            unoptimized
            priority
          />
        </Link>
        <Link
          href={`/auth?next=${encodeURIComponent(nextPath)}`}
          className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          Google-first auth
        </Link>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ── LEFT: Branding ── */}
        <div
          className="flex flex-col justify-center px-10 py-24 lg:w-[46%] lg:py-0 lg:pl-16 lg:pr-12"
          style={{ background: "var(--bg-primary)" }}
        >
          <div className="max-w-[400px]">
            {/* Kicker */}
            <p className="hd-kicker mb-6">Causal Research Workbench</p>

            {/* Heading */}
            <h1 className="hd-serif-display mb-6 text-[2.6rem] leading-[1.05] text-[var(--text-primary)] md:text-[3rem]">
              Instrument‑grade<br />
              <em>scientific</em> workspace
            </h1>

            <p className="mb-10 font-body text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
              MASA gives researchers causal reasoning, provenance tracking, and
              bring‑your‑own‑key model access — all in one sovereign workspace.
            </p>

            {/* Trust signal cards */}
            <div className="space-y-3">
              {[
                {
                  icon: "🔒",
                  title: "Private by design",
                  body: "Your API keys and research data never leave your browser session.",
                },
                {
                  icon: "🔑",
                  title: "BYOK — bring your own key",
                  body: "Connect Anthropic, OpenAI, or Gemini with your own credentials.",
                },
                {
                  icon: "↩",
                  title: "Always a path back",
                  body: "Full provenance graph — every inference is traceable and auditable.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="hd-panel flex items-start gap-3 rounded-xl px-4 py-3"
                >
                  <span className="mt-0.5 text-base">{card.icon}</span>
                  <div>
                    <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[var(--text-primary)]">
                      {card.title}
                    </p>
                    <p className="mt-0.5 font-body text-[0.8rem] leading-snug text-[var(--text-muted)]">
                      {card.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Auth form ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:py-0">
          <div
            className="auth-panel-surface w-full max-w-[420px] rounded-2xl px-8 py-10"
          >
            {needsConfirmation ? (
              /* ── Confirmation state ── */
              <div className="text-center">
                <div
                  className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "var(--accent-rust-soft)", border: "1px solid var(--border-subtle)" }}
                >
                  <span className="text-2xl">✉️</span>
                </div>
                <h2 className="mb-2 font-serif text-[1.4rem] font-normal text-[var(--text-primary)]">
                  Check your email
                </h2>
                <p className="mb-6 font-body text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
                  We sent a confirmation link to <strong>{email}</strong>.
                  Click it to activate your account.
                </p>
                <button
                  type="button"
                  onClick={() => { setNeedsConfirmation(false); setMode("signin"); }}
                  className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--accent-rust)] hover:text-[var(--accent-rust-strong)]"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                {/* Tab toggle */}
                <div className="mb-8 flex gap-6 border-b border-[var(--border-subtle)] pb-4">
                  {(["signin", "signup"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      className="font-mono text-[0.68rem] uppercase tracking-[0.16em] transition-colors"
                      style={{
                        color: mode === m ? "var(--accent-rust)" : "var(--text-muted)",
                        borderBottom: mode === m ? "1px solid var(--accent-rust)" : "1px solid transparent",
                        paddingBottom: "2px",
                      }}
                    >
                      {m === "signin" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                {/* Error banner */}
                {error && (
                  <div
                    className="mb-5 rounded-lg px-4 py-3 font-body text-[0.8rem] text-[var(--text-primary)]"
                    style={{
                      background: "rgba(166,124,82,0.08)",
                      border: "1px solid rgba(166,124,82,0.24)",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Google button */}
                {authConfigured && (
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={isLoading}
                    className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-soft)",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      /* Google "G" SVG */
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                      </svg>
                    )}
                    <span className="font-body text-[0.875rem]">
                      Continue with Google
                    </span>
                  </button>
                )}

                {/* Divider */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    or
                  </span>
                  <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
                </div>

                {/* Email / password form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label className="hd-metric-label mb-1.5 block">
                        Full name <span className="text-[var(--text-tertiary)]">(optional)</span>
                      </label>
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ada Lovelace"
                        className="lg-input w-full rounded-lg px-3.5 py-2.5 font-body text-[0.875rem] outline-none transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="hd-metric-label mb-1.5 block">Email</label>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="lg-input w-full rounded-lg px-3.5 py-2.5 font-body text-[0.875rem] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="hd-metric-label mb-1.5 block">Password</label>
                    <input
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="lg-input w-full rounded-lg px-3.5 py-2.5 font-body text-[0.875rem] outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !authConfigured}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "var(--accent-rust)" }}
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </button>
                </form>

                {/* Mode switch footer */}
                <p className="mt-6 text-center font-body text-[0.8rem] text-[var(--text-muted)]">
                  {mode === "signin" ? (
                    <>
                      No account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className="text-[var(--accent-rust)] hover:text-[var(--accent-rust-strong)]"
                      >
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className="text-[var(--accent-rust)] hover:text-[var(--accent-rust-strong)]"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>

                {!authConfigured && (
                  <p className="mt-4 text-center font-body text-[0.75rem] text-[var(--text-tertiary)]">
                    Authentication is not configured in this environment.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
