# MASA Component Patterns

Reference for building or extending components in `MASA_Prototype.html` and the
`synthesis-engine` Next.js app. All CSS variable names match `generated-tokens.css`.

---

## Global Resets & Defaults

```css
html, body {
  height: 100%; overflow: hidden;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text-1);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  line-height: 1.5;
}

/* 3px scrollbar */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 99px; }

/* Selective transitions — never on * */
.transitional {
  transition: background-color 0.2s var(--ease),
              border-color 0.2s var(--ease),
              color 0.15s var(--ease);
}
```

---

## Three-Zone Shell

```css
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr var(--rail-w);
  height: 100vh;
  overflow: hidden;
}
```

---

## Sidebar

```css
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  overflow: hidden;
}

/* Wordmark header — 42px tall */
.sidebar-header {
  display: flex; align-items: center; gap: 9px;
  padding: 0 14px; height: var(--topbar-h);
  border-bottom: 1px solid var(--border);
}

/* Wordmark icon — 24x24 amber chip */
.wordmark-icon {
  width: 24px; height: 24px;
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border-2);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
}

/* Wordmark text */
.wordmark-text {
  font-family: var(--font-serif);
  font-size: 14px; font-weight: 400;
  letter-spacing: 0.01em;
  color: var(--text-1);
}
```

### Nav Item with Amber Left-Bar Indicator

```css
.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: var(--radius-sm);
  font-size: 13px; color: var(--text-2);
  cursor: pointer; position: relative;
  transition: background 0.12s var(--ease), color 0.12s var(--ease);
}
.nav-item::before {
  content: '';
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 2px; height: 0;
  border-radius: 0 2px 2px 0;
  background: var(--accent);
  transition: height 0.2s var(--ease);
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-1); }
.nav-item.active {
  background: var(--bg-active); /* amber-tinted */
  color: var(--text-1);
}
.nav-item.active::before { height: 18px; }  /* reveal the left bar */
.nav-item.active svg { opacity: 1; color: var(--accent); }
```

### Eyebrow / Section Label (mono, all-caps)

```css
.sidebar-section-label {
  font-family: var(--font-mono);
  font-size: 9px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--text-4);
  padding: 14px 18px 5px;
}
```

### Nav Badge (amber chip)

```css
.nav-badge {
  font-family: var(--font-mono); font-size: 9px; font-weight: 500;
  padding: 1px 5px; border-radius: 3px;
  background: var(--accent-dim); color: var(--accent);
  border: 1px solid var(--accent-border-2);
  margin-left: auto;
}
```

---

## Protocol Cards (Workbench Hero)

Cards in a 3-column grid. Hover lifts; selected state shows amber outline + glow.

```css
.protocol-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%; max-width: 820px;
}

.protocol-card {
  background: var(--card-bg);       /* --bg-2 */
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 26px 22px 22px;
  cursor: pointer;
  position: relative; overflow: hidden;
  transition: border-color 0.22s var(--ease),
              transform 0.22s var(--ease),
              box-shadow 0.22s var(--ease);
}

/* Gradient shimmer (top-left to transparent) */
.protocol-card::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(130deg, rgba(255,255,255,0.025) 0%, transparent 50%);
  opacity: 0; pointer-events: none;
  transition: opacity 0.22s var(--ease);
}

/* Top amber line (shows on hover + selected) */
.protocol-card::after {
  content: '';
  position: absolute; top: 0; left: 16px; right: 16px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-border), transparent);
  opacity: 0; pointer-events: none;
  transition: opacity 0.22s var(--ease);
}

.protocol-card:hover {
  border-color: var(--border-2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.protocol-card:hover::before, .protocol-card:hover::after { opacity: 1; }

.protocol-card.selected {
  border-color: var(--accent-border);
  background: var(--accent-dim-2);
  box-shadow: var(--accent-glow);
}
.protocol-card.selected::after { opacity: 1; }

/* Card icon — 34x34 chip with icon */
.card-icon {
  width: 34px; height: 34px; border-radius: var(--radius);
  background: var(--bg-3); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px; color: var(--text-3);
}
.protocol-card.selected .card-icon {
  background: var(--accent-dim);
  border-color: var(--accent-border);
  color: var(--accent);
  box-shadow: 0 0 12px rgba(200,150,90,0.15);
}

/* Mono tag above title */
.card-tag {
  font-family: var(--font-mono); font-size: 8.5px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-4); margin-bottom: 7px;
}
.protocol-card.selected .card-tag { color: var(--accent); }
```

---

## Input Composer

```css
.input-composer {
  background: var(--input-bg);  /* --bg-3 */
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 16px 12px;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.input-composer:focus-within {
  border-color: var(--border-2);
  box-shadow: 0 0 0 3px var(--accent-dim), var(--shadow-sm);
}
```

### Input Chips (pill-shape, mono)

```css
.input-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 9px; border: 1px solid var(--border);
  border-radius: 999px; font-size: 11px;
  font-family: var(--font-mono); color: var(--text-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.input-chip:hover {
  background: var(--bg-hover); color: var(--text-1);
  border-color: var(--border-2);
}
```

---

## Ambient Main Glow

The main area has a warm radial glow bleeding down from the top center. This creates the
"candlelight" atmosphere without any overt decorative element.

```css
.main::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(
    ellipse 90% 55% at 50% -5%,
    rgba(200,150,90,0.055) 0%,
    transparent 70%
  );
}
/* Light mode version: rgba(160,105,58,0.04) */
```

---

## Workbench Hero Typography

```css
.workbench-eyebrow {
  font-family: var(--font-mono);
  font-size: 9px; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent); opacity: 0.85;
  margin-bottom: 18px;
}

.workbench-headline h1 {
  font-family: var(--font-serif);
  font-size: 42px; font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--text-1); line-height: 1.15;
}

.workbench-headline h1 em {
  font-style: italic;
  color: var(--text-2);  /* italic em is dimmer */
}

.workbench-headline p {
  font-size: 14px; color: var(--text-2);
  line-height: 1.65; max-width: 380px;
  margin: 0 auto;
}
```

---

## Evidence Rail — Full Patterns

The right rail (296px) runs the full height. It has its own header (42px topbar-h) and a
scrollable body with sections separated by `border-bottom: 1px solid var(--border)`.

```css
.rail {
  background: var(--rail-bg);     /* #0F0E0D dark */
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.rail-header {
  display: flex; align-items: center;
  height: var(--topbar-h); padding: 0 16px;
  border-bottom: 1px solid var(--border);
  gap: 10px; flex-shrink: 0;
}
.rail-section {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.rail-section-head {
  display: flex; align-items: center; gap: 7px;
  font-family: var(--font-mono);
  font-size: 9px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-3); margin-bottom: 14px;
}
.rail-section-head svg { width: 10px; height: 10px; }
```

### Live Indicator Dot (6px) — with `pulse-glow`

There are two animation variants. The rail header uses `pulse-glow` (box-shadow pulses).
Simple elements use `pulse` (opacity only).

```css
/* Rail header — green dot with glow pulse */
.rail-indicator.live {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px rgba(78,158,122,0.5);
  animation: pulse-glow 3s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(78,158,122,0.5); }
  50%       { opacity: 0.5; box-shadow: 0 0 4px rgba(78,158,122,0.2); }
}

/* Simple opacity pulse (for other indicators) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

### Status Dots (5px colored circles — inline in rail section heads)

```css
.status-dot {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
}
.status-dot.green { background: var(--green); }
.status-dot.amber { background: var(--accent); }
.status-dot.red   { background: var(--red); }
.status-dot.idle  { background: var(--text-4); }
```

### Causal Density Rungs (Horizontal Fill Bars + Interactive Rows)

These are three clickable rows (L1/L2/L3). The active row highlights amber; default fills
show at 60% opacity with `--border-2` color.

```css
.rung-bars { display: flex; flex-direction: column; gap: 10px; }

.rung-bar-row {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; padding: 2px 0;
}
.rung-bar-row:hover .rung-fill { opacity: 1; }

.rung-label {
  font-family: var(--font-mono);
  font-size: 9px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text-3); width: 22px; flex-shrink: 0;
  transition: color 0.15s;
}
.rung-bar-row.active .rung-label { color: var(--accent); }

.rung-track {
  flex: 1; height: 5px; border-radius: 99px;
  background: var(--bg-3);
  position: relative; overflow: hidden;
}
.rung-fill {
  position: absolute; left: 0; top: 0; height: 100%;
  border-radius: 99px;
  background: var(--border-2);
  opacity: 0.6;
  transition: width 0.5s var(--ease), opacity 0.2s, background 0.2s;
}
.rung-bar-row.active .rung-fill { background: var(--accent); opacity: 1; }

.rung-name {
  font-size: 10.5px; color: var(--text-3);
  width: 92px; flex-shrink: 0; transition: color 0.15s;
}
.rung-bar-row.active .rung-name { color: var(--text-2); }
```

**Causal Ladder Level Names** (MASA vocabulary):
- L1 → Association (correlational — statistical only)
- L2 → Intervention (do-calculus level)
- L3 → Counterfactual (Pearl Level 3)

### Rung Status Line (text block below rungs)

```css
.rung-status-line {
  font-size: 11px; color: var(--text-3);
  margin-top: 12px; line-height: 1.5;
  padding: 10px 12px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.rung-status-line strong { color: var(--text-2); font-weight: 500; }
```

### Confidence Meter (3px gradient fill bar — different from 5px rung bars)

This is the thin progress bar inside a rail section, not the rung bars above.

```css
.confidence-label {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 5px;
}
.confidence-label span {
  font-family: var(--font-mono);
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-3);
}
.confidence-label strong {
  font-family: var(--font-mono); font-size: 11px; color: var(--text-2);
}
.meter-track {
  height: 3px; background: var(--bg-3);
  border-radius: 99px; overflow: hidden;
}
.meter-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--green), rgba(78,158,122,0.6));
  transition: width 0.6s var(--ease);
}
.meter-fill.amber {
  background: linear-gradient(90deg, var(--accent), rgba(200,150,90,0.6));
}
```

### Rail Info Cards (Color-coded status cards)

Three variants — green/amber/red — using semantic dim + border tokens.

```css
.rail-info-card {
  border-radius: var(--radius); padding: 11px 13px;
  font-size: 11.5px; line-height: 1.6; border: 1px solid;
}
.rail-info-card.green {
  border-color: var(--green-border);
  background: var(--green-dim);
  color: var(--text-2);
}
.rail-info-card.amber {
  border-color: var(--accent-border);
  background: var(--accent-dim);
  color: var(--text-2);
}
.rail-info-card.red {
  border-color: var(--red-border);
  background: var(--red-dim);
  color: var(--text-2);
}
```

### Evidence File Rows

```css
.evidence-file {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 9px 4px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.1s;
  margin: 0 -4px;
}
.evidence-file:last-child { border-bottom: none; }
.evidence-file:hover { background: var(--bg-hover); }

.file-icon {
  width: 26px; height: 26px; border-radius: var(--radius-sm);
  background: var(--bg-3); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--text-3);
  transition: border-color 0.12s, color 0.12s;
}
.evidence-file:hover .file-icon { border-color: var(--border-2); color: var(--text-2); }
.file-icon svg { width: 11px; height: 11px; }

.file-name { font-size: 11.5px; font-weight: 500; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-meta {
  display: flex; align-items: center; gap: 8px; margin-top: 3px;
  font-family: var(--font-mono); font-size: 9.5px; color: var(--text-3);
}
```

### Unavailable State (mono empty state)

```css
.unavail {
  font-family: var(--font-mono); font-size: 11.5px;
  color: var(--text-3); line-height: 1.55;
}
.unavail strong {
  display: block; font-size: 10px; font-weight: 500;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-4); margin-bottom: 4px;
}
```

---

## Stat Cards (Hybrid Canvas — 4-column grid)

The canvas stats row sits at the top of the hybrid view main area, above the empty canvas.
Each card has an amber bottom-line indicator when it has a value.

```css
.canvas-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 10px; padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.stat-card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 13px 15px;
  position: relative; overflow: hidden;
}
/* Bottom accent line — 2px, only visible when has-value */
.stat-card::before {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--border); border-radius: 0 0 var(--radius) var(--radius);
}
.stat-card.has-value::before { background: var(--accent); opacity: 0.5; }

.stat-label {
  font-family: var(--font-mono);
  font-size: 8.5px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-3); margin-bottom: 7px; line-height: 1.4;
}
.stat-value {
  font-family: var(--font-mono);
  font-size: 28px; font-weight: 400;
  color: var(--text-1); line-height: 1;
}
.stat-value.amber { color: var(--accent); }  /* e.g. "Blocked Candidates" */
.stat-trend {
  margin-top: 4px;
  font-family: var(--font-mono); font-size: 9.5px; color: var(--text-4);
}
```

The four default stat card labels in the prototype are:
- Sources
- Validated Contradictions
- Novelty Pass
- Blocked Candidates *(rendered in amber)*

---

## Hybrid Left Panel Inputs

```css
/* Inline input + button row */
.hybrid-row { display: flex; gap: 5px; }
.hybrid-input {
  flex: 1; border: 1px solid var(--border); border-radius: var(--radius);
  padding: 8px 10px; font-size: 12.5px;
  color: var(--text-1); background: var(--input-bg);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hybrid-input:focus { border-color: var(--border-2); box-shadow: 0 0 0 3px var(--accent-dim); }

.add-btn {
  width: 32px; height: 32px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--bg-3); color: var(--text-2);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; transition: background 0.12s, border-color 0.12s;
}
.add-btn:hover { background: var(--bg-4); border-color: var(--border-2); }

.hybrid-textarea {
  width: 100%; border: 1px solid var(--border); border-radius: var(--radius);
  padding: 9px 11px; font-size: 12px;
  color: var(--text-1); background: var(--input-bg);
  resize: vertical; min-height: 72px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hybrid-textarea:focus { border-color: var(--border-2); box-shadow: 0 0 0 3px var(--accent-dim); }

/* Full-width CTA button — neutral style, amber glow on hover */
.start-btn {
  width: 100%; padding: 10px;
  background: var(--bg-3); border: 1px solid var(--border-2);
  border-radius: var(--radius); font-size: 13px; font-weight: 500;
  color: var(--text-1);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.start-btn:hover {
  background: var(--bg-4);
  border-color: var(--accent-border);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
```

---

## Topbar Tag (Mono badge in main topbar)

```css
.topbar-tag {
  font-family: var(--font-mono);
  font-size: 9.5px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--accent);
  border: 1px solid var(--accent-border);
  background: var(--accent-dim);
  padding: 3px 9px; border-radius: 4px;
}
```

---

## Pipeline Steps (Hybrid view topbar)

```css
.topbar-pipeline {
  font-family: var(--font-mono);
  font-size: 10.5px; color: var(--text-3);
  display: flex; align-items: center; gap: 7px;
}
.topbar-pipeline .step.done { color: var(--text-2); }
.topbar-pipeline .arrow { color: var(--text-4); font-size: 9px; }
```

---

## Upload Zone (dashed, Hybrid view)

```css
.upload-zone {
  border: 1px dashed var(--border-2);
  border-radius: var(--radius); padding: 16px;
  text-align: center; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  color: var(--text-2); font-size: 12px;
}
.upload-zone:hover {
  background: var(--bg-hover);
  border-color: var(--accent-border);
  color: var(--text-1);
}
```

---

## User Avatar (22px, amber ring)

```css
.user-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  font-family: var(--font-mono); font-size: 8.5px; font-weight: 500;
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  letter-spacing: 0.02em;
}
```

---

## Small Icon Button (26x26)

```css
.icon-btn {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-3);
  transition: background 0.12s var(--ease), color 0.12s var(--ease);
}
.icon-btn:hover { background: var(--bg-hover); color: var(--text-2); }
.icon-btn svg { width: 13px; height: 13px; }
```

---

## Micro-Animations

```css
/* Entrance animation — fade up from 8px below */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeUp 0.4s var(--ease) forwards; }

/* Stagger — apply to parent, children animate in sequence */
.stagger > * {
  opacity: 0;
  animation: fadeUp 0.45s var(--ease) forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0.06s; }
.stagger > *:nth-child(2) { animation-delay: 0.14s; }
.stagger > *:nth-child(3) { animation-delay: 0.22s; }
```

Usage: add `.fade-in` to any element for a single entrance. Add `.stagger` to a parent
container (like `.protocol-grid`) so children cascade in sequentially.

---

## Theme Toggle Button

```css
.theme-btn {
  display: flex; align-items: center; gap: 9px;
  padding: 6px 10px; border-radius: var(--radius-sm);
  font-size: 12px; color: var(--text-2);
  cursor: pointer; width: 100%;
  transition: background 0.12s, color 0.12s;
}
.theme-btn:hover { background: var(--bg-hover); color: var(--text-1); }
.theme-btn svg { width: 12px; height: 12px; opacity: 0.55; }
```

JS toggle: `document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')`
(prototype HTML), or `document.documentElement.classList.toggle('dark')` (synthesis-engine).

---

## Wordmark SVG Icon

The MASA wordmark icon is two curved stroke paths that suggest organic flow / waveforms.
Used inside `.wordmark-icon` (24×24 amber chip in sidebar header).

```html
<div class="wordmark-icon">
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M4 2.5C4 2.5 3 5 5 7c2 2 1 4.5 1 4.5" stroke-linecap="round"/>
    <path d="M7.5 2.5C7.5 2.5 6.5 5 8.5 7c2 2 1 4.5 1 4.5" stroke-linecap="round"/>
  </svg>
</div>
```

The two paths are offset duplicates — they read as a stylized "M" or twin signal waves.
Always render at 13×13 inside the 24×24 chip.

---

## Canvas Empty State

Used when no synthesis has been run yet. Serif heading + secondary body text, centered.

```css
.canvas-empty {
  text-align: center; max-width: 360px;
}
.canvas-empty h2 {
  font-family: var(--font-serif);
  font-size: 22px; font-weight: 400;
  color: var(--text-1); margin-bottom: 10px;
}
.canvas-empty p { font-size: 13px; color: var(--text-2); line-height: 1.65; }
```

Example content from prototype:
- Heading: "Dialectical Synthesis Canvas"
- Body: "Upload sources and run synthesis to render the contradiction matrix, novelty proof, and falsification protocol."

---

## Focus Ring Pattern (universal)

All interactive inputs and some buttons use the same amber glow focus ring:
```css
/* On :focus or :focus-within */
box-shadow: 0 0 0 3px var(--accent-dim);
border-color: var(--border-2);
```
Never use `outline` — always `box-shadow + border-color` pairing.