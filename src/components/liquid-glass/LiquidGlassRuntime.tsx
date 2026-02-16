"use client";

import { useEffect } from "react";

const CLICKABLE_SELECTOR = [
  "button",
  "a",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='switch']",
  "[role='checkbox']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='range']",
  "input[type='checkbox']",
  "input[type='radio']",
  "select",
  "textarea",
  "summary",
  ".lab-card-interactive",
  ".scientific-protocol-card",
  ".lab-button-primary",
  ".lab-button-secondary",
  ".sidebar-history-item",
  ".lab-nav-pill",
  ".lg-control",
  ".lg-card",
  ".lg-pill",
].join(",");

export function LiquidGlassRuntime() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = mediaQuery.matches;

    const markInteractive = () => {
      const nodes = document.querySelectorAll<HTMLElement>(CLICKABLE_SELECTOR);
      nodes.forEach((node) => {
        if (!node.classList.contains("lg-bubble-hover")) {
          node.classList.add("lg-bubble-hover");
        }
      });
    };

    markInteractive();
    const observer = new MutationObserver(markInteractive);
    observer.observe(document.body, { childList: true, subtree: true });

    const onPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
    };
    mediaQuery.addEventListener("change", onPreferenceChange);

    const onPointerMove = (event: PointerEvent) => {
      if (prefersReducedMotion) return;
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(".lg-bubble-hover");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mx = ((event.clientX - rect.left) / rect.width) * 100;
      const my = ((event.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty("--mx", `${Math.max(0, Math.min(100, mx))}%`);
      target.style.setProperty("--my", `${Math.max(0, Math.min(100, my))}%`);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", onPreferenceChange);
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return null;
}
