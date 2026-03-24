# Surface Recipes

## Workbench route

Use for `/chat`, `/hybrid`, `/legal`, `/education`, `/lab`, and similar task-heavy surfaces.

1. Start from `WorkbenchShell` or the current feature shell.
2. Keep left navigation persistent on desktop.
3. Use the center pane for the primary reasoning task: messages, protocol canvas, forms, results, or diagrams.
4. Use the right rail for evidence, provenance, mode, warnings, model metadata, and action summaries.
5. Place input or next-step controls in a persistent bottom area, not scattered across the main pane.

Recommended inspirations:

- `advanced-ai-chat-input`
- `sidebar`
- `tabs`
- `copy-button`
- `animated-state-icons`
- `docks` for mobile or secondary utilities only

## Landing or overview section

Use for the home page, route summaries, or "choose a mode" decision screens.

1. Lead with a high-contrast serif headline.
2. Pair it with mono meta labels, route names, counts, or short descriptors.
3. Use dense feature cards with explicit capability language.
4. Keep image treatment abstract or structural, not stock-photo heavy.

Recommended inspirations:

- `animated-hero`
- `feature-section`
- `feature-hover-effects`
- `features-11`
- `display-cards`
- `animated-grid-pattern`

## Auth or invite surface

Use for sign-in, invite acceptance, gated notebooks, or mode entry.

1. Keep the composition single-purpose and vertically focused.
2. Use a dark ambient grid or dotted background at low intensity.
3. Keep one primary CTA, one fallback path, and minimal supporting copy.
4. Rephrase labels to fit the app's research posture.

Recommended inspirations:

- `sign-in-flow`
- `animated-grid-pattern`
- `toggle-theme`

## Lab tool panel

Use for structured scientific tools such as docking, sequence analysis, or report review.

1. Use a secondary left rail for instruments or tool modes.
2. Center the form or active tool controls.
3. Keep results, logs, evidence, or warnings adjacent rather than hidden.
4. Use micro-interactions to confirm tool state, not to decorate the form.

Recommended inspirations:

- `sidebar`
- `tabs`
- `copy-button`
- `animated-state-icons`

## Micro-interaction layer

Use only after the surface architecture is already correct.

- Use `copy-button` for IDs, URLs, claim references, and code samples.
- Use `animated-state-icons` for copy, verification, loading, archive, or publish transitions.
- Use `toggle-theme` as low-emphasis chrome, not a hero feature.
- Use `circle-menu` only for local contextual actions inside canvases or diagrams.

## Avoid these misuses

- Do not use `animated-hero` or `feature-section` as a replacement for a workbench.
- Do not use `circle-menu` or `docks` as primary desktop navigation.
- Do not import the `sign-in-flow` stack into normal feature routes.
