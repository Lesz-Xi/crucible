"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Scale, Sparkles, GraduationCap } from "lucide-react";
import { getCurrentUser, signInWithGoogle } from "@/lib/auth/actions";

export function Navbar() {
  const router = useRouter();
  const [isLoadingAuthState, setIsLoadingAuthState] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAuthState = async () => {
      try {
        const user = await getCurrentUser();
        if (isMounted) {
          setIsSignedIn(Boolean(user?.id));
        }
      } catch {
        if (isMounted) {
          setIsSignedIn(false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuthState(false);
        }
      }
    };

    void loadAuthState();
    return () => {
      isMounted = false;
    };
  }, []);

  const ctaLabel = useMemo(() => {
    if (isLoadingAuthState) return "Loading...";
    return isSignedIn ? "Open Wu-Wei" : "Try Wu-Wei";
  }, [isLoadingAuthState, isSignedIn]);

  const handleTryWuWei = async () => {
    setAuthError(null);

    if (isLoadingAuthState || isBusy) return;

    if (isSignedIn) {
      router.push("/chat");
      return;
    }

    setIsBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("[Navbar] Failed to start Google sign-in:", error);
        setAuthError(error);
      }
    } catch (error) {
      console.error("[Navbar] Failed to start Google sign-in:", error);
      setAuthError("Unable to start sign-in. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black p-2.5 shadow-sm">
            <Image
              src="/wu-wei-mark.png"
              alt="Wu-Wei mark"
              width={26}
              height={26}
              className="h-6 w-6 object-contain"
              priority
            />
          </span>
          <span className="font-serif text-[2rem] leading-none tracking-[0.12em] text-[var(--foreground)] transition-colors duration-500">
            Wu-Wei
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-12 font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
          <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <a href="#process" className="hover:text-[var(--text-primary)] transition-colors">
            Process
          </a>
          <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
          <span className="text-[var(--border-subtle)]">|</span>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/chat" 
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <MessageSquare className="w-3 h-3 text-wabi-moss group-hover:scale-110 transition-transform" />
               <span>Chat</span>
            </Link>
            <Link 
              href="/hybrid" 
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <Sparkles className="w-3 h-3 text-wabi-clay group-hover:scale-110 transition-transform" />
               <span>Hybrid</span>
            </Link>
            <Link
              href="/legal"
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <Scale className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
               <span>Legal</span>
            </Link>
            <Link
              href="/education"
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <GraduationCap className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform" />
               <span>Learn</span>
            </Link>
            <button
              type="button"
              onClick={handleTryWuWei}
              disabled={isLoadingAuthState || isBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-semibold text-[var(--bg-primary)] transition-all duration-200 hover:brightness-95 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-70 normal-case tracking-normal"
            >
              {(isLoadingAuthState || isBusy) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{ctaLabel}</span>
            </button>
          </div>
        </nav>
      </div>

      {authError && (
        <div className="max-w-7xl mx-auto mt-2 hidden md:block text-right">
          <p className="text-xs text-[var(--text-secondary)]">{authError}</p>
        </div>
      )}

      <nav className="md:hidden max-w-7xl mx-auto mt-4">
        <div className="rounded-[14px] border border-[var(--border-subtle)]/70 bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-3 py-2 flex items-center justify-between gap-2">
          <Link href="/chat" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <MessageSquare className="w-3 h-3 text-wabi-moss" />
            <span>Chat</span>
          </Link>
          <Link href="/hybrid" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Sparkles className="w-3 h-3 text-wabi-clay" />
            <span>Hybrid</span>
          </Link>
          <Link href="/legal" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Scale className="w-3 h-3 text-wabi-rust" />
            <span>Legal</span>
          </Link>
          <Link href="/education" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <GraduationCap className="w-3 h-3 text-wabi-clay" />
            <span>Learn</span>
          </Link>
          <button
            type="button"
            onClick={handleTryWuWei}
            disabled={isLoadingAuthState || isBusy}
            className="inline-flex items-center justify-center gap-1 rounded-md bg-[var(--text-primary)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--bg-primary)] transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {(isLoadingAuthState || isBusy) && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{isSignedIn ? "Open" : "Try"}</span>
          </button>
        </div>
        {authError && (
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">{authError}</p>
        )}
      </nav>
    </header>
  );
}
