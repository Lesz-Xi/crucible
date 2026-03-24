"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative w-12 h-7 bg-black/5 dark:bg-white/10 rounded-full flex items-center p-1 transition-colors duration-300 focus:outline-none hover:bg-black/10 dark:hover:bg-white/20"
      aria-label="Toggle Dark Mode"
    >
      {/* Background Track Icons (Static) */}
      <div className="absolute left-1.5 text-wabi-sumi/40 dark:text-wabi-washi/40">
        <Sun className="w-3.5 h-3.5" />
      </div>
      <div className="absolute right-1.5 text-wabi-sumi/40 dark:text-wabi-washi/40">
        <Moon className="w-3.5 h-3.5" />
      </div>

      {/* Sliding Pill */}
      <motion.div
        className="relative z-10 w-5 h-5 bg-white dark:bg-wabi-sumi rounded-full shadow-sm flex items-center justify-center pointer-events-none"
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        animate={{ x: resolvedTheme === "dark" ? 20 : 0 }}
      >
        <div className="text-wabi-sumi dark:text-wabi-washi">
          {resolvedTheme === "dark" ? (
             <Moon className="w-3 h-3 text-wabi-washi" strokeWidth={2.5} />
          ) : (
             <Sun className="w-3 h-3 text-wabi-sumi" strokeWidth={2.5} />
          )}
        </div>
      </motion.div>
    </button>
  );
}
