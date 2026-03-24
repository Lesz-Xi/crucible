# Visual System

## Primary visual direction

- Keep the app warm, mineral, and controlled.
- Use editorial contrast: expressive serif headlines, disciplined mono metadata, neutral sans controls.
- Use glass and translucency as a restraint device, not as spectacle.

## Palette

### Light mode

- Base paper: `--paper-050`, `--bg-primary`
- Secondary surfaces: `--bg-secondary`, `--bg-card`
- Primary text: `--stone-700`, `--text-primary`
- Secondary text: `--mist-400`, `--text-secondary`
- Accent warm: `--oxide-500`, `--accent-rust`
- Accent growth: `--moss-500`, `--lab-accent-moss`

### Dark mode

- Use warm charcoal and obsidian instead of pure black.
- Keep text near `zinc-50` contrast, but use muted mono labels for metadata.
- Let orange, moss, and off-white carry emphasis instead of electric blue.

## Typography

- Serif display: `Playfair Display`, `Newsreader`, or the existing serif stack for headlines and empty-state titles.
- Mono metadata: `Geist Mono` or equivalent for route labels, counts, timestamps, IDs, and status chips.
- Sans controls: `Geist Sans` or the existing sans stack for buttons, inputs, and navigation.

## Shapes and surfaces

- Large editorial cards: 24px to 32px radius.
- Workbench cards and panels: 12px to 20px radius.
- Pills and status chips: fully rounded or 9999px radius.
- Borders should stay subtle and mostly 1px.
- Prefer layered paper or glass panels over flat boxes.

## Motion

- Use 160ms to 320ms for most interface motion.
- Prefer opacity, translate, scale, and blur transitions.
- Reserve looping animation for ambient grids, soft pulses, and processing indicators.
- Keep motion secondary to state clarity.

## Visual lessons from the audited exemplar images

- Most samples are monochrome or near-monochrome with soft shadows and rounded containers.
- Ambient backgrounds rely on grids, dots, and faint structure rather than loud illustrations.
- Utility controls are minimal, icon-led, and often grouped into docks or pills.
- Cards feel airy in the raw references; compress them slightly for the app's higher information density.

## Do

- Combine quiet ambient backgrounds with dense, explicit metadata.
- Use iconography to improve scan speed.
- Let space exist around high-value cards or protocol selection moments.
- Reuse existing `lab-*`, `glass-sidebar`, and workbench classes when available.

## Do not

- Ship purple gradients, neon glows, or glossy "AI" branding.
- Add huge empty hero sections inside feature routes.
- Overdecorate evidence cards that need to remain legible at a glance.
- Introduce motion that competes with scientific content.
