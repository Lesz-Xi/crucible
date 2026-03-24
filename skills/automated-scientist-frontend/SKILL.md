---
name: automated-scientist-frontend
description: Design and refactor high-density frontend surfaces for the Automated Scientist app. Use when building or redesigning workbench shells, chat/lab panels, landing sections, authentication flows, design-system decisions, or component integrations that should feel evidence-aware, trust-first, visually sophisticated, and aligned with MASA instead of generic SaaS or raw copy-pasted component-library defaults.
---

# Automated Scientist Frontend

## Overview

Build product surfaces that feel like a scientific instrument: dense, calm, auditable, and visually intentional.
Translate external inspiration components into the existing Automated Scientist shell, token system, and trust-first interaction model rather than pasting them in verbatim.

## Run This Workflow

1. Classify the surface as `workbench`, `landing`, `auth`, `lab tool`, or `micro-interaction`.
2. Read [`references/app-context.md`](./references/app-context.md) before making layout decisions.
3. Read the minimum extra references needed:
   - Read [`references/visual-system.md`](./references/visual-system.md) for tokens, typography, motion, and surface treatment.
   - Read [`references/surface-recipes.md`](./references/surface-recipes.md) for shell composition and component placement.
   - Read [`references/component-atlas.md`](./references/component-atlas.md) when choosing which audited inspiration block to adapt.
   - Read [`references/prompt-audit.md`](./references/prompt-audit.md) when dependency scope or direct copy-paste guidance is ambiguous.
4. Preserve the app's structural language:
   - Prefer `WorkbenchShell` or existing feature shells for feature routes.
   - Prefer feature-scoped components when logic is route-specific.
   - Use `components/ui` only for true primitives.
5. Translate the inspiration into MASA language:
   - Replace generic product copy with research, protocol, evidence, provenance, notebook, audit, or instrumentation language.
   - Attach explicit loading, empty, warning, partial, and failure states.
   - Expose trust cues such as provenance, source counts, timestamps, IDs, domain labels, model labels, or degradation notes when relevant.
6. Verify density and behavior:
   - Desktop should feel information-rich but navigable.
   - Tablet should collapse one secondary region.
   - Mobile should focus on one primary task and move secondary controls into drawers, sheets, or floating actions.

## Default Decisions

- Prefer three-zone desktop composition for serious feature routes: left navigation, central work area, right evidence or detail rail.
- Prefer serif display typography for macro hierarchy, mono for metadata, and sans for controls.
- Prefer warm mineral light mode and warm-charcoal dark mode over bright white or blue-black extremes.
- Prefer subtle glass, paper, and lab-panel depth cues over glossy gradients.
- Prefer `lucide-react`, Radix primitives, and restrained `framer-motion` transitions before introducing heavier dependencies.
- Keep ambient animation low-opacity and low-frequency. Reserve stronger motion for state change, not decoration.
- Treat external reference components as structure and interaction inspiration, not final copy or final visual language.

## Use The Audited References

- Open [`references/component-atlas.md`](./references/component-atlas.md) to map the audited `High-Density-Frontend-Skills` set to actual product surfaces.
- Open the matching image under `assets/exemplars/` when you need visual grounding from the audited folder.
- Use [`references/prompt-audit.md`](./references/prompt-audit.md) to decide whether a prompt's original dependency stack is justified or should be simplified for this app.

## Enforce These Constraints

- Do not ship generic startup-site UI inside a scientific workbench route.
- Do not let enrichment, animation, or decorative chrome obscure warnings, provenance, or system status.
- Do not introduce stock-illustration aesthetics where data, protocol cards, or evidence cards should carry the content.
- Do not overuse purple, neon, or cyberpunk contrast.
- Do not flatten the app into one undifferentiated component library. Preserve route personality within a shared shell language.

## Output Contract

When proposing or implementing a change, return:

1. A short concept statement tied to the target surface.
2. The chosen layout recipe and which audited inspirations you adapted.
3. The key visual decisions: color, type, spacing, radius, motion, and trust cues.
4. Implementation notes that explain how the result stays aligned with Automated Scientist instead of the raw inspiration sample.
