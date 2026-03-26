"use client";

import Link from "next/link";
import { WuWeiMark } from "./WuWeiMark";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { getCurrentUser, signInWithGoogle } from "@/lib/auth/actions";
import { AnimatePresence, motion } from "framer-motion";

// ── Navigation data ───────────────────────────────────────────────────────────

const navItems = [
  { href: "#why-us",     label: "Why Us"    },
  { href: "#mission",    label: "Mission"   },
  { href: "#surfaces",   label: "Features"  },
  { href: "#laboratory", label: "Use Cases" },
  { href: "#faq",        label: "FAQ"       },
];

const pagesItems = [
  { href: "/masa-white-paper.html", label: "White Paper",  external: true  },
  { href: "#architecture",          label: "Architecture", external: false  },
  { href: "#sequence",              label: "The Mechanism",external: false  },
  { href: "#pipeline",              label: "Pipeline",     external: false  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Navbar() {
  const router = useRouter();
  const [isLoadingAuthState, setIsLoadingAuthState] = useState(true);
  const [isSignedIn, setIsSignedIn]                 = useState(false);
  const [pagesOpen, setPagesOpen]                   = useState(false);
  const pagesRef                                    = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pagesRef.current && !pagesRef.current.contains(e.target as Node)) {
        setPagesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handlePrimaryAction = async () => {
    if (isLoadingAuthState) return;
    if (isSignedIn) {
      router.push("/chat");
    } else {
      await signInWithGoogle("/chat");
    }
  };

  const linkClass =
    "font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] border-b border-transparent hover:border-[var(--accent-rust)] pb-0.5 whitespace-nowrap";

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto max-w-[1440px] h-20 flex items-center">

        {/* ── Logo: w-20 = 80px = one grid cell, always centered within it */}
        <div className="w-20 shrink-0 flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <WuWeiMark className="h-[34px] w-auto md:h-[40px]" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between gap-4 pr-6 md:pr-10">

          {/* ── Nav ───────────────────────────────────────────────────── */}
          <div className="flex items-center">
            <nav className="hidden items-center gap-6 lg:flex lg:gap-7">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}

              {/* Pages dropdown */}
              <div ref={pagesRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPagesOpen((o) => !o)}
                  className={`${linkClass} flex items-center gap-1 border-b-0 pb-0`}
                  aria-expanded={pagesOpen}
                >
                  Pages
                  <ChevronDown
                    className="h-3 w-3 transition-transform duration-200"
                    style={{ transform: pagesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                <AnimatePresence>
                  {pagesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,  scale: 1    }}
                      exit={{    opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-[180px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2 shadow-[var(--shadow-deep)] backdrop-blur-xl"
                    >
                      {pagesItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          {...(item.external
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                          onClick={() => setPagesOpen(false)}
                          className="flex items-center px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        >
                          {item.label}
                          {item.external && (
                            <span className="ml-auto pl-4 opacity-40">↗</span>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>

          {/* ── Right: CTA ────────────────────────────────────────────── */}
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

        </div>{/* flex-1 wrapper */}
      </div>{/* max-w container */}
    </header>
  );
}
