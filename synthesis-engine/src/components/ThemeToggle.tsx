"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "shell" | "landing";
  className?: string;
}

export function ThemeToggle({ variant = "shell", className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const isLanding = variant === "landing";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none",
        isLanding
          ? "h-10 w-[72px] border border-[var(--border-subtle)] bg-[rgba(255,250,244,0.76)] text-[var(--text-primary)] shadow-[var(--shadow-soft)] backdrop-blur-xl hover:bg-[var(--bg-card-soft)] dark:bg-[rgba(23,20,17,0.84)]"
          : "h-7 w-12 border border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)] hover:bg-[var(--lab-hover-bg)]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div
        className={cn(
          "absolute left-1.5 opacity-60",
          isLanding ? "text-[var(--text-secondary)]" : "text-[var(--lab-text-secondary)]"
        )}
      >
        <Sun className={cn(isLanding ? "h-4 w-4" : "h-3.5 w-3.5")} />
      </div>
      <div
        className={cn(
          "absolute right-1.5 opacity-60",
          isLanding ? "text-[var(--text-secondary)]" : "text-[var(--lab-text-secondary)]"
        )}
      >
        <Moon className={cn(isLanding ? "h-4 w-4" : "h-3.5 w-3.5")} />
      </div>

      <motion.div
        className={cn(
          "pointer-events-none relative z-10 flex items-center justify-center rounded-full",
          isLanding
            ? "h-8 w-8 bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
            : "h-5 w-5 bg-[var(--lab-panel)] text-[var(--lab-text-primary)] shadow-[var(--lab-shadow-soft)]"
        )}
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        animate={{ x: isDark ? (isLanding ? 28 : 20) : 0 }}
      >
        <div>
          {isDark ? (
             <Moon className={cn(isLanding ? "h-4 w-4" : "h-3 w-3")} strokeWidth={2.5} />
          ) : (
             <Sun className={cn(isLanding ? "h-4 w-4" : "h-3 w-3")} strokeWidth={2.5} />
          )}
        </div>
      </motion.div>
    </button>
  );
}
