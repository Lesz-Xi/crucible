# Component Atlas

## Audit summary

The audited `High-Density-Frontend-Skills` folder mixes low-level primitives, large navigation shells, landing-page blocks, and one heavy authentication scene.

Most common dependencies across the prompt set:

- `lucide-react`: 9 references
- `framer-motion`: 8 references
- `class-variance-authority`: 6 references
- `@radix-ui/react-slot`: 5 references

## Shells and navigation

- `sidebar`
  - Asset: `assets/exemplars/sidebar.png`
  - Use as the reference for dense left-rail composition.
  - Translate it into the app's existing `AppDashboardShell` or `ChatSidebarV2` language rather than a generic app menu.

- `navbar-with-dropdowns`
  - Asset: `assets/exemplars/navbar-with-dropdowns.png`
  - Use on landing, docs, or route-discovery surfaces.
  - Rewrite dropdown content as modes, protocols, features, or governance resources.

- `docks`
  - Asset: `assets/exemplars/docks.png`
  - Good for mobile quick actions or secondary utilities.
  - Keep it out of primary desktop information architecture.

- `circle-menu`
  - Asset: `assets/exemplars/circle-menu.png`
  - Best for contextual canvas actions, not persistent app navigation.

## Composer and controls

- `advanced-ai-chat-input`
  - Asset: `assets/exemplars/advanced-ai-chat-input.png`
  - Directly maps to the app's composer family.
  - Extend it with operator mode, PDF attachments, provenance hints, and send-stop state.

- `tabs`
  - Asset: `assets/exemplars/tabs.png`
  - Useful for switching evidence views, result modes, or tool subpanels.

- `toggle-theme`
  - Asset: `assets/exemplars/toggle-theme.png`
  - Treat as shell chrome, not feature content.

- `copy-button`
  - Asset: `assets/exemplars/copy-button.png`
  - Use for claim IDs, API links, model IDs, notebook references, and shareable artifacts.

- `animated-state-icons`
  - Asset: `assets/exemplars/animated-state-icons.png`
  - Use for state transitions such as loading to verified, copied, archived, or synced.

## Cards and feature blocks

- `display-cards`
  - Asset: `assets/exemplars/display-cards.png`
  - Useful for stacked evidence snapshots, queue previews, or report artifacts.

- `feature-hover-effects`
  - Asset: `assets/exemplars/feature-hover-effects.png`
  - Useful on overview pages, not core workbench panes.

- `feature-section`
  - Asset: `assets/exemplars/feature-section.png`
  - Good for onboarding or route explanation sections with guided steps.

- `features-11`
  - Asset: `assets/exemplars/features-11.png`
  - Useful for editorial capability grids or mode explainers.

## Editorial and ambient references

- `animated-hero`
  - Asset: `assets/exemplars/animated-hero.png`
  - Use only on landing or high-level entry screens.
  - Replace generic startup copy with scientific-instrument positioning.

- `animated-grid-pattern`
  - Asset: `assets/exemplars/animated-grid-pattern.png`
  - Use as a low-opacity background layer behind empty states, auth, or landing sections.

## Specialty surface

- `sign-in-flow`
  - Asset: `assets/exemplars/sign-in-flow.png`
  - Heavy dependency path because it uses `three` and `@react-three/fiber`.
  - Only justify that stack when the auth moment truly needs environmental drama.

## Practical selection rule

- If the task changes app navigation or shell chrome, start with `sidebar`.
- If the task changes chat or submission UX, start with `advanced-ai-chat-input`.
- If the task changes a marketing or overview section, start with `animated-hero`, `feature-section`, `feature-hover-effects`, or `features-11`.
- If the task only needs polish, prefer `copy-button`, `tabs`, `toggle-theme`, or `animated-state-icons`.
