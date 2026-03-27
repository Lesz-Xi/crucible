"use client";

import Link from "next/link";
import { WuWeiMark } from "./WuWeiMark";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/actions";
import { AnimatePresence, motion } from "framer-motion";

// ── Navigation data ───────────────────────────────────────────────────────────

const navItems = [
  { href: "#why-us",     label: "About"     },
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
  const [isScrolled, setIsScrolled]                 = useState(false);
  const pagesRef                                    = useRef<HTMLDivElement>(null);
  const closePagesMenu = () => setPagesOpen(false);
  const openPagesMenu = () => setPagesOpen(true);

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
        closePagesMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 20);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const handlePrimaryAction = async () => {
    if (isLoadingAuthState) return;
    if (isSignedIn) {
      router.push("/chat");
    } else {
      router.push("/auth?next=%2Fchat");
    }
  };

  const linkClass =
    "landing-header-nav-link font-mono text-[0.65rem] uppercase tracking-[0.18em] border-b border-transparent pb-0.5 whitespace-nowrap";

  return (
    <header className="landing-navbar" data-scrolled={isScrolled ? "true" : "false"}>
      <Link
        href="/"
        className="landing-header-logo-anchor hidden lg:flex"
        aria-label="Wu-Weism home"
      >
        <WuWeiMark className="h-[34px] w-auto md:h-[40px]" />
      </Link>

      <div className="landing-header-shell mx-auto flex h-20 max-w-[1440px] items-center px-4 md:px-6 lg:px-8">
        <div className="landing-header-logo-rail flex shrink-0 items-center justify-center lg:hidden">
          <Link href="/" className="flex items-center">
            <WuWeiMark className="h-[34px] w-auto md:h-[40px]" />
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="hidden h-px shrink-0 lg:block"
          style={{ width: "var(--landing-header-logo-gap)" }}
        />

        <div className="landing-header-nav-center pointer-events-none hidden lg:flex items-center">
          <nav className="pointer-events-auto flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}

            <div
              ref={pagesRef}
              className="relative"
              onMouseEnter={openPagesMenu}
              onMouseLeave={closePagesMenu}
            >
              <button
                type="button"
                onClick={() => setPagesOpen((o) => !o)}
                onFocus={openPagesMenu}
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
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="landing-header-pages-menu overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2 shadow-[var(--shadow-deep)] backdrop-blur-xl"
                  >
                    {pagesItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        {...(item.external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        onClick={closePagesMenu}
                        className="landing-header-pages-link flex items-center px-4 py-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.external && (
                          <span className="landing-header-pages-external ml-auto pl-4">↗</span>
                        )}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        <div className="ml-auto flex items-center">
          <div className="landing-header-cta group">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isLoadingAuthState}
              className="landing-header-cta-button relative inline-flex min-w-[var(--landing-header-cta-min-width)] items-center justify-center gap-2 px-3 text-sm font-medium outline-none transition-transform duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="landing-header-cta-glow" aria-hidden="true" />
              <span className="landing-header-cta-glow-hover" aria-hidden="true" />
              <span className="landing-header-cta-stroke" aria-hidden="true" />
              <span className="landing-header-cta-stroke-hover" aria-hidden="true" />
              <span className="landing-header-cta-fill" aria-hidden="true" />

              <span className="landing-header-cta-copy">
                {isLoadingAuthState
                  ? "LOADING"
                  : isSignedIn
                  ? "OPEN INSTRUMENT"
                  : "GET STARTED"}
              </span>
              <span className="landing-header-cta-icon">
                {isLoadingAuthState ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
