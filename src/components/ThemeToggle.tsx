"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative flex h-7 w-12 items-center rounded-full border border-[var(--lab-border)] bg-[var(--lab-shell-sidebar)] p-1 transition-colors duration-300 focus:outline-none hover:bg-[var(--lab-hover-bg)]"
      aria-label="Toggle Dark Mode"
    >
      {/* Background Track Icons (Static) */}
      <div className="absolute left-1.5 text-[var(--lab-text-secondary)] opacity-60">
        <Sun className="w-3.5 h-3.5" />
      </div>
      <div className="absolute right-1.5 text-[var(--lab-text-secondary)] opacity-60">
        <Moon className="w-3.5 h-3.5" />
      </div>

      {/* Sliding Pill */}
      <motion.div
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lab-panel)] shadow-[var(--lab-shadow-soft)] pointer-events-none"
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        animate={{ x: resolvedTheme === "dark" ? 20 : 0 }}
      >
        <div className="text-[var(--lab-text-primary)]">
          {resolvedTheme === "dark" ? (
             <Moon className="w-3 h-3 text-[var(--lab-text-primary)]" strokeWidth={2.5} />
          ) : (
             <Sun className="w-3 h-3 text-[var(--lab-text-primary)]" strokeWidth={2.5} />
          )}
        </div>
      </motion.div>
    </button>
  );
}
