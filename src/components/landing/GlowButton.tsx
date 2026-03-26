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
 * PremiumGlowButton — dark pill with chrome-gradient border and an amber
 * radial spotlight that bleeds softly beyond the button boundary.
 *
 * Visual anatomy:
 *   • `bg-[#0e0c0b]`          — near-black, slightly warm fill
 *   • border + inset shadows  — chrome highlight on top edge, darkening on bottom
 *   • ambient glow div        — blurred radial amber gradient behind the pill
 *   • hover:brightness-110    — subtle intensification, no layout shift
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
        // layout
        "relative z-10 inline-flex items-center justify-center gap-2",
        // shape
        "rounded-full px-6 py-3",
        // fill — very dark, warm black
        "bg-[#0e0c0b]",
        // base border
        "border border-white/[0.15]",
        // chrome highlight: bright top edge, dark bottom, subtle side shimmer
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.4),inset_1px_0_rgba(255,255,255,0.06),inset_-1px_0_rgba(255,255,255,0.06)]",
        // type
        "font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-primary)]",
        // motion
        "transition-all duration-300 hover:border-white/[0.25] hover:brightness-110",
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
            "radial-gradient(ellipse at 50% 60%, rgba(200,150,90,0.45) 0%, transparent 70%)",
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
