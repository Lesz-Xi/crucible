"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface GlowButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  /** "submit" lets the button trigger form submission */
  type?: "button" | "submit";
  className?: string;
  /** Stretches button + wrapper to 100% width */
  fullWidth?: boolean;
  /** Pass -1 to exclude from tab order (decorative use inside a link card) */
  tabIndex?: number;
}

/**
 * PremiumGlowButton — obsidian-native pill with a restrained amber underglow.
 */
export function GlowButton({
  children,
  href,
  onClick,
  type = "button",
  className,
  fullWidth = false,
  tabIndex,
}: GlowButtonProps) {
  const pill = (
    <button
      type={type}
      onClick={onClick}
      tabIndex={tabIndex}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3",
        "border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
        "font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-primary)]",
        "shadow-[0_16px_34px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,247,238,0.06)]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--accent-rust)] hover:bg-[color:rgba(29,24,21,0.98)] hover:text-[color:var(--accent-rust-strong)]",
        fullWidth ? "w-full" : "",
        className,
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("relative inline-flex justify-center", fullWidth && "w-full")}>
      {/* Ambient glow — amber radial spotlight, bleeds outside pill bounds */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -inset-y-4 rounded-full opacity-70 blur-[28px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(200,150,90,0.18) 0%, transparent 72%)",
        }}
      />

      {href ? (
        <Link href={href} className={fullWidth ? "w-full" : ""}>
          {pill}
        </Link>
      ) : (
        pill
      )}
    </div>
  );
}
