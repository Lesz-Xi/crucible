# App Context

## Product posture

- Build a scientific instrument, not a generic AI chat shell.
- Optimize for trust, traceability, operator focus, and multi-panel reasoning.
- Write in a tone that feels precise, institutional, and quietly confident.

## Core interface nouns

- Workbench
- Protocol
- Evidence
- Provenance
- Audit
- Intervention
- Notebook
- Instrument
- Model
- Domain

## Existing shell patterns

- `synthesis-engine/src/components/workbench/WorkbenchShell.tsx`
  - Desktop pattern: left navigation, main canvas, right evidence rail.
  - Mobile pattern: temporary evidence rail overlay.
- `synthesis-engine/src/components/dashboard/AppDashboardShell.tsx`
  - Houses the route switcher, thread history, folders, theme controls, and shell chrome.
- `synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`
  - Shows the protocol-card empty state, grounded messages, citations, and evidence-aware composer.
- `synthesis-engine/src/components/causal-chat/ChatSidebarV2.tsx`
  - Groups sessions by domain and frames the sidebar as a research notebook.
- `synthesis-engine/src/components/causal-chat/ScientificTableCard.tsx`
  - Good model for expandable evidence artifacts with warnings and status.
- `synthesis-engine/src/components/landing/FeatureRail.tsx`
  - Shows how landing pages can still feel product-specific and high density.

## Trust cues every serious surface should support

- Explicit status labels such as `ready`, `partial`, `failed`, or `syncing`
- Warning containers that do not collapse the main task
- Provenance, source counts, model labels, claim IDs, or timestamps when machine output is shown
- Distinct loading, empty, and degraded states
- Domain or mode labels when the system posture changes

## Density model

- Desktop: keep three information zones whenever the task benefits from parallel reading.
- Tablet: collapse the least critical zone, usually the evidence rail or secondary navigation.
- Mobile: keep one primary action lane; move secondary actions into sheets, drawers, docks, or segmented controls.
- High density means compressed hierarchy with clear scanning, not tiny text or clutter.

## Copy direction

- Replace startup-language CTAs with protocol, inquiry, validation, audit, and notebook language.
- Prefer concrete labels over abstract hype.
- Let metrics, IDs, states, and source metadata carry seriousness.

## Read next

- Read `visual-system.md` for token and material choices.
- Read `surface-recipes.md` for route-level composition.
- Read `component-atlas.md` when selecting an inspiration block from the audited folder.
