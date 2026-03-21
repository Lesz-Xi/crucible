"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/actions";
import { PixelArrowIcon, PixelChevronDownIcon } from "@/components/landing/PixelIcons";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    if (isLoadingAuthState) return;

    if (isSignedIn) {
      router.push("/chat");
      return;
    }

    router.push("/auth?next=%2Fchat");
  };

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto max-w-[1440px] px-6 pt-5 md:px-10 md:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/wu-wei-mark-true-alpha.png"
                alt="Wu-Weism mark"
                width={200}
                height={154}
                className="-ml-2 h-auto w-[80px] object-contain md:w-[90px] lg:-ml-4 lg:w-[100px]"
                unoptimized
                priority
              />
            </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative py-2"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu((current) => (current === item.label ? null : current))}
              >
                <button
                  type="button"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
                >
                  {item.label}
                  <PixelChevronDownIcon className="h-3 w-3 text-[var(--text-muted)] transition-all duration-200 group-hover:translate-y-0.5 group-hover:text-[var(--text-primary)]" />
                </button>

                {openMenu === item.label && (
                  <div className="absolute left-0 top-full pt-2 z-40">
                    <div className="min-w-[220px] rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-soft)] backdrop-blur-xl">
                      <div className="space-y-1">
                        {item.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            className="group flex items-center justify-between rounded-[12px] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--accent-rust-soft)]"
                          >
                            <span>{link.label}</span>
                            <PixelArrowIcon className="h-3.5 w-3.5 text-[var(--accent-rust)] opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
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

          <div className="flex items-center divide-x divide-[var(--border-subtle)] overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="px-3 py-2">
              <ThemeToggle variant="landing" />
            </div>

            <Link
              href="#contact"
              className="group hidden items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-rust-soft)] md:inline-flex"
            >
              <span>Join Synthesis</span>
              <PixelArrowIcon className="h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--text-primary)]" />
            </Link>

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
