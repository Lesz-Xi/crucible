"use client";

import Link from "next/link";
import { WuWeiMark } from "./WuWeiMark";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCurrentUser, signInWithGoogle } from "@/lib/auth/actions";

const navItems = [
  { href: "#architecture", label: "Architecture" },
  { href: "#surfaces", label: "Surfaces" },
  { href: "/masa-white-paper.html", label: "White Paper", external: true },
];

export function Navbar() {
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
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto max-w-[1440px] px-6 pt-5 md:px-10 md:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-10">
            <Link href="/" className="flex shrink-0 items-center">
              <WuWeiMark className="h-[52px] w-auto md:h-[64px]" />
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] border-b border-transparent hover:border-[var(--accent-rust)] pb-0.5"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isLoadingAuthState}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-rust-soft)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingAuthState && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {isLoadingAuthState ? "Loading" : isSignedIn ? "Open Instrument" : "Try Wu-Weism"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
