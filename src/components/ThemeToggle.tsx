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

  if (isLanding) {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "landing-theme-toggle relative inline-flex items-center justify-center rounded-[14px] border transition-all duration-300 focus:outline-none",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          className="landing-theme-toggle-icon"
        >
          {isDark ? (
            <Moon className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <Sun className="h-4 w-4" strokeWidth={2.2} />
          )}
        </motion.div>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none",
        "h-7 w-12 border border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)] hover:bg-[var(--lab-hover-bg)]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div
        className={cn(
          "absolute left-1.5 opacity-60 text-[var(--lab-text-secondary)]"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
      </div>
      <div
        className={cn(
          "absolute right-1.5 opacity-60 text-[var(--lab-text-secondary)]"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
      </div>

      <motion.div
        className={cn(
          "pointer-events-none relative z-10 flex items-center justify-center rounded-full",
          "h-5 w-5 bg-[var(--lab-panel)] text-[var(--lab-text-primary)] shadow-[var(--lab-shadow-soft)]"
        )}
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        animate={{ x: isDark ? 20 : 0 }}
      >
        <div>
          {isDark ? (
             <Moon className="h-3 w-3" strokeWidth={2.5} />
          ) : (
             <Sun className="h-3 w-3" strokeWidth={2.5} />
          )}
        </div>
      </motion.div>
    </button>
  );
}
