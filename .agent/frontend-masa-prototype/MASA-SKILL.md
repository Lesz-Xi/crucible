---
name: masa-prototype
description: >
  Full design system and architectural context for MASA (Methods of Automated Scientific Analysis),
  a causal research workbench built at wuweism.com. Use this skill any time Lesz asks to work on
  MASA_Prototype.html, the synthesis-engine Next.js app, the design tokens (tokens.json), the
  Style Dictionary pipeline, or any MASA UI component. Trigger on: "MASA", "prototype",
  "synthesis-engine", "design tokens", "MASA UI", "lab notebook", "workbench", "causal workbench",
  "warm cinematic", "bio-lab", or any mention of working on wuweism.com's frontend.
  This skill encodes the complete token vocabulary, three-zone shell layout, component CSS
  patterns, and the conceptual north star — so Claude can jump straight into building without
  re-establishing context from scratch.
---

# MASA Design System & Prototype Skill

## What is MASA?

MASA is the **Methods of Automated Scientific Analysis** platform — a causal research workbench
whose goal is to build an *Automated Scientist*: a system that reasons causally, surfaces
falsifiable hypotheses, and maintains scientific governance. It is not a chat app that looks
scientific; it actually implements Pearl-style causal reasoning, contradiction detection, and
novelty proofing.

The live app is `synthesis-engine` (Next.js 15, Tailwind `darkMode: "class"`), deployed at
**wuweism.com**. The canonical design reference is `MASA_Prototype.html` in the
`design-system/` folder.

---

## The Three Pillars of the Aesthetic

Every pixel should feel like **a warm cinematic dark lab notebook**:

1. **Cinematic darkness** — charcoal base (`#0E0D0C`), not pure black. Surfaces layer upward in
   subtle +3-4 brightness steps. The app feels like amber candlelight inside a deep observatory.

2. **Instrument Serif as the soul** — hero headings and the wordmark use `Instrument Serif` (italic
   weight is expressive). Body and UI chrome use `Inter`. Data, labels, badges, and eyebrow text
   use `JetBrains Mono`. These three families are non-negotiable.

3. **Amber as the single accent** — `#C8965A` in dark mode, `#A0693A` in light. The accent appears
   sparingly: active nav indicators, selected card outlines, input focus rings, badge text. A warm
   radial glow (`rgba(200,150,90,0.055)`) bleeds in from top-center of the main area. Everything
   else is structural.

---

## File Locations

| Asset | Path |
|---|---|
| Design tokens (source of truth) | `design-system/tokens.json` |
| HTML prototype | `design-system/MASA_Prototype.html` |
| Generated CSS vars | `synthesis-engine/src/app/generated-tokens.css` |
| Global styles | `synthesis-engine/src/app/globals.css` |
| Style Dictionary config | `synthesis-engine/style-dictionary.config.js` |
| Architecture doc | `MASA-Theoretical-Foundation/MASA_ARCHITECTURE_CURRENT_STATE_SUMMARY_2026-02-12.md` |

---

## Three-Zone Shell

The entire app is a `grid` with three fixed columns:

```css
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr var(--rail-w);
  height: 100vh;
  overflow: hidden;
}
```

| Zone | Width | Token | Purpose |
|---|---|---|---|
| Sidebar | 224px | `--sidebar-w` | Nav, history, user row |
| Main | `1fr` | — | Views: Chat, Hybrid, Legal |
| Evidence Rail | 296px | `--rail-w` | Live evidence, confidence, telemetry |

The topbar is 42px (`--topbar-h`) and appears at the top of each zone independently.

---

## Token System

Tokens live in `tokens.json` with three sets: `core`, `dark`, `light`.

- **`core`** — typography, spacing, radius, sizing (theme-agnostic)
- **`dark`** — all color values for dark theme
- **`light`** — all color values for light theme

The Style Dictionary pipeline (`node style-dictionary.config.js`) transforms these into
`generated-tokens.css` with three CSS blocks: `:root`, `.dark`, and `:root, .light`.
The synthesis-engine's `tailwind.config.ts` uses `darkMode: "class"` — the `.dark` class on
`<html>` triggers dark mode.

To rebuild tokens after editing `tokens.json`:
```bash
cd synthesis-engine && npm run tokens:build
# or runs automatically before every build via:
npm run prebuild
```

For the complete CSS variable quick-reference, read `references/design-tokens.md`.
For component CSS patterns, read `references/components.md`.
For architecture and synthesis-engine routing, read `references/architecture.md`.

---

## Key CSS Patterns to Always Honour

**Surface elevation ladder** (dark, ascending):
```
--bg        #0E0D0C   ← shell main background
--bg-2      #131210   ← card, input backgrounds
--bg-3      #1A1816   ← panel, field backgrounds
--bg-4      #211F1C   ← overlay, soft panels
--bg-5      #282523   ← deepest overlay
--sidebar-bg #0B0A09  ← slightly deeper than main bg
```

**Typography sizes and their roles**:
- 9px mono `letter-spacing: 0.14em` uppercase → eyebrow labels, section heads
- 12px sans → history items, secondary body
- 13px sans → primary body, nav items
- 42px serif `letter-spacing: -0.02em` → workbench hero h1
- (Hero token is 56px but actual prototype uses 42px for the main h1)

**Accent is amber only** — no purple, no blue for interactive states. Blue/green/red exist only
for semantic status (causal confidence levels, error, info).

**Transitions** follow these easings:
```css
--ease:        cubic-bezier(0.16, 1, 0.3, 1)      /* primary spring */
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1)     /* exit */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* bounce */
```

Do not apply transitions globally. Use `.transitional` on specific elements, or scope
`transition:` inline with the `--ease` variable.

---

## Core Component Checklist

When building or modifying any MASA component, verify these rules:

- [ ] Surfaces use the elevation ladder, not raw hex values
- [ ] Text hierarchy uses `--text-1` through `--text-4` (opacity-based off warm white)
- [ ] Active/selected states use `--bg-active` + `--accent-border` + optional `--accent-glow` box-shadow
- [ ] Hover states use `--bg-hover` (rgba 4% white in dark, 3% black in light)
- [ ] All mono labels/badges: `font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase`
- [ ] Border default: `1px solid var(--border)` (rgba 7% white in dark)
- [ ] Focus rings: `box-shadow: 0 0 0 3px var(--accent-dim)` (not a hard border)
- [ ] Scrollbars: 3px, transparent track, `--border-2` thumb

---

## Conceptual North Star (for any AI-facing copy or component naming)

MASA's three research interfaces:

| Route | Name | Purpose |
|---|---|---|
| `/chat` | Causal Workbench | Causal dialogue + intervention framing |
| `/hybrid` | Hybrid Synthesis | Contradiction-driven synthesis + novelty proofing |
| `/legal` | Legal Causation | Causation analysis under but-for / proximate logic |

When naming components, prefer **lab** vocabulary: *Protocol*, *Evidence*, *Confidence*,
*Axiom*, *Mechanism*, *Calibration*, *Telemetry*. Avoid generic SaaS language like
*Dashboard*, *Analytics*, *Insight* unless directly quoting existing code.

---

## Quick Fixes from Past Work

- **Dark mode selector**: synthesis-engine uses `.dark` on `<html>`, NOT `[data-theme="dark"]`.
  The Style Dictionary config outputs `.dark { ... }` and `:root, .light { ... }`.
- **Prototype uses `[data-theme="dark"]`** on `<html>` in the standalone HTML file — that's correct
  for the prototype only.
- **Git push from VM fails** — the Linux VM has no outbound internet. Always run `git push` from
  the Mac terminal.
- **Tokens Studio paste**: In the Figma Tokens Studio JSON editor, use `cmd+a` then `cmd+v` (Mac
  shortcuts, not `ctrl`). Click directly on the `{}` text first.