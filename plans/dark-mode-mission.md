# Mission: Dark Mode Integration (Wabi-Sabi Aesthetics)

You are Gemini, MASA High-Dense Core Architect.

This document outlines the **First-Principles Transition** from a fixed light theme to a dynamic, Wabi-Sabi Dark Mode.

## 🌌 Core Philosophy (The "Why")

Transitioning from "Inflexible (Static)" to "Adaptive (Dynamic)" while preserving the **Wabi-Sabi Soul**.
Dark Mode is not just inverted colors; it is **"Sumi Ink" mode**—deep charcoal, warm gold accents, and textured shadows. It must feel like reading white ink on black handmade paper.

**(Old AI) Static UI**: Hardcoded Hex Checks (`#F5F2EB`), Fixed Themes.
**(Pearlian) Dynamic UI**: Semantic Variables (`--bg-surface`), Context-Aware Theme (`next-themes`).

---

## 🔴 Hassabis-Style Reasoning (Critical Gap Analysis)

| Layer | Question | Resolution |
|-------|----------|------------|
| **L1 - Impact** | "What changes?" | New `ThemeToggle` component, `next-themes` provider, global CSS variable strategies. |
| **L2 - Risk** | "Does this break?" | **Critical Risk**: Dark text on dark background because `text-wabi-sumi` is hardcoded. **Resolution**: Abstract to `--text-primary`. |
| **L3 - Calibration** | "UX Metrics?" | Flash of Unstyled Theme (FOUC). **Resolution**: `ThemeProvider` (next-themes) handles hydration. |
| **L4 - Critical Gaps** | "User Actions?" | **Action Required**: Install `next-themes`. |

---

## 🗺️ Roadmap (Phase-Gated)

### Phase 1: Foundation (Semantic Layer)
- [ ] **Install Dependency**: `npm install next-themes` (USER ACTION REQUIRED).
- [ ] **Config**: Enable `darkMode: 'class'` in `tailwind.config.ts`.
- [ ] **CSS Architecture**: Define Semantic Variables in `globals.css`.
    -   `--bg-primary`: Washi (Light) ↔ Sumi (Dark)
    -   `--text-primary`: Sumi (Light) ↔ Washi (Dark)
    -   `--border-subtle`: Sand (Light) ↔ Charcoal (Dark)

### Phase 2: Refactoring (The Purge)
- [ ] **Audit**: `grep` for hardcoded hexes (`#2C2824`, `#F5F2EB`, etc.).
- [ ] **Refactor**: Replace `text-wabi-sumi` with `text-primary` (or equivalent Tailwind class).
    -   Key Targets: `Hero.tsx`, `Navbar.tsx`, `CausalGauge.tsx`, `Pricing.tsx`, `ResearchModes.tsx`.
- [ ] **Textures**: Invert/adjust `noise-overlay` for dark mode visibility.

### Phase 3: Implementation (The Toggle)
- [ ] **Component**: Create `ThemeToggle` (Slide Switch with Sun/Moon icons).
- [ ] **Integration**: Add to `Navbar.tsx`.
- [ ] **Provider**: Wrap `layout.tsx` with `<ThemeProvider attribute="class">`.

### Phase 4: Verification (The Audit)
- [ ] **Visual Check**: Toggle theme. Verify text contrast.
- [ ] **Persistence**: Reload page. Does theme persist?
- [ ] **System Match**: Check user preference.

---

## 🚨 Critical Gaps Identified

1.  **Dependency Missing**: `next-themes` is not installed.
    *   **Action**: Proceed to create `tasks.md` but flag this as a user check or auto-run if safe.
2.  **Hardcoded Colors**: `Navbar` uses explicit `text-wabi-sumi`. If background becomes dark (`wabi-sumi`), text will vanish.
    *   **Action**: Must abstract variables BEFORE enabling the toggle.

---

## Plan Status
**Status**: PLANNING
**Next Step**: Author `specification/dark-mode-spec.md` and `tasks.md`.
