"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronDown, Loader2 } from "lucide-react";
import { getCurrentUser, signInWithGoogle } from "@/lib/auth/actions";

const navItems = [
  {
    href: "#features",
    label: "Features",
    links: [
      { href: "#features", label: "Organic Intelligence" },
      { href: "#process", label: "Synthesis Pipeline" },
    ],
  },
  {
    href: "#process",
    label: "Process",
    links: [
      { href: "#process", label: "Protocol" },
      { href: "#features", label: "Core capabilities" },
    ],
  },
  {
    href: "#models",
    label: "Models",
    links: [
      { href: "#models", label: "Model Configuration" },
      { href: "#api-setup", label: "API Provider Setup" },
    ],
  },
  {
    href: "#contact",
    label: "Inquiry",
    links: [
      { href: "#contact", label: "Get in touch" },
      { href: "/masa-white-paper.html", label: "White paper", external: true },
    ],
  },
];

export function Navbar() {
  const router = useRouter();
  const [isLoadingAuthState, setIsLoadingAuthState] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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

  const handlePrimaryAction = async () => {
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
        setAuthError(error);
      }
    } catch {
      setAuthError("Unable to start sign-in. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto max-w-[1440px] px-5 pt-5 md:px-8 md:pt-6">
        <div className="flex items-center justify-between gap-4 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(12,12,13,0.76)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <Image
                src="/wu-wei-mark-true-alpha.png"
                alt="Wu-Weism mark"
                width={200}
                height={154}
                className="-ml-2 h-auto w-[74px] object-contain md:w-[84px] lg:-ml-3 lg:w-[92px]"
                unoptimized
                priority
              />
              <div className="hidden border-l border-[rgba(255,255,255,0.08)] pl-4 lg:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-rust)]">
                  MASA
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Dark causal instrument
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu((current) => (current === item.label ? null : current))}
                >
                  <button
                    type="button"
                    onFocus={() => setOpenMenu(item.label)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-transparent px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-all duration-200 hover:border-[rgba(255,224,194,0.14)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]"
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] transition-all duration-200 group-hover:translate-y-0.5 group-hover:text-[var(--accent-rust)]" />
                  </button>

                  {openMenu === item.label && (
                    <div className="absolute left-0 top-full z-40 pt-3">
                      <div className="min-w-[260px] rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,19,0.96)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                        <p className="px-3 pb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Navigation cluster
                        </p>
                        <div className="space-y-1">
                          {item.links.map((link) => (
                            <Link
                              key={link.label}
                              href={link.href}
                              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                              className="group flex items-center justify-between rounded-[16px] border border-transparent px-3 py-3 text-sm text-[var(--text-primary)] transition-all duration-200 hover:border-[rgba(255,224,194,0.12)] hover:bg-[rgba(255,224,194,0.06)]"
                            >
                              <div>
                                <span>{link.label}</span>
                                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                  {link.external ? "external reference" : "in-page anchor"}
                                </p>
                              </div>
                              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent-rust)] opacity-70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="#contact"
              className="marketing-button-secondary group hidden px-5 py-3 md:inline-flex"
            >
              <span>Contact Sales</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--text-primary)]" />
            </Link>

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isLoadingAuthState || isBusy}
              className="marketing-button-primary min-w-[176px] px-5 py-3 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {(isLoadingAuthState || isBusy) && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {isLoadingAuthState ? "Loading" : isSignedIn ? "Open Instrument" : "Try MASA"}
              </span>
            </button>
          </div>
        </div>

        {authError && (
          <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {authError}
          </p>
        )}
      </div>
    </header>
  );
}
