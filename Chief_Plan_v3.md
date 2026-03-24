# `/chat` Single-Card Workbench Redesign

## Summary
Redesign the `/chat` empty state into a single-purpose entry surface while preserving the current shell, history, evidence plumbing, and route behavior.

Locked decisions:
- Sidebar stays visible with nav + history.
- Evidence Rail stays persistent on desktop.
- Main empty state becomes one `Scientific Workbench` description block plus one primary `Chat` card.
- Clicking the `Chat` card focuses the composer textarea on the same page.
- `Scenarios` remains in the composer as a real, separate menu control.
- `New folder` keeps the current prompt-based behavior in this pass; only its styling changes.

This is a `/chat`-only IA and visual redesign. Landing, Hybrid, Legal, Education, Lab, and backend contracts stay unchanged.

## Implementation Changes

### 1. Main empty state: one title block + one `Chat` card
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`.

Replace the three protocol cards with:
- heading: `Scientific Workbench`
- body copy:
  - `Describe the system, the change, and the outcome you need to understand. Start a causal conversation grounded in evidence, intervention logic, and counterfactual reasoning.`
- one primary `Chat` card:
  - title: `Chat`
  - description:
    - `Open a research conversation to map mechanisms, test interventions, and audit claims against evidence.`
  - footer arrow in the lower-right
  - full-card click target

Do not render visible secondary cards for Hybrid or Relics in the center pane.

### 2. Explicit composer focus contract
The previous plan was incomplete here. Add an explicit focus API.

Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatComposerV2.tsx` to support one of these implementation-safe contracts:
- preferred: `textareaRef?: RefObject<HTMLTextAreaElement>`
- plus optional `autoFocus?: boolean` only if already useful elsewhere

Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx` to:
- own the composer textarea ref
- on `Chat` card click:
  - scroll the input area into view with smooth behavior
  - focus the textarea
  - do not change route
  - do not prefill text

This keeps the action deterministic and removes hidden DOM-query assumptions.

### 3. Composer simplifies, but `Scenarios` becomes a distinct menu
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatComposerV2.tsx`.

Visible toolbar order becomes:
- `Attach`
- `DAV Mode`
- `Scenarios`
- spacer
- `↵ to send`
- `Send`

Behavior:
- `DAV Mode` keeps the current operator-mode cycle behavior
- `Scenarios` must no longer call the same handler as `DAV Mode`
- `Scenarios` opens a lightweight menu/popover with static options for this pass:
  - `Causal Discovery`
  - `Intervention Planning`
  - `Counterfactual Audit`
- selecting one scenario:
  - updates `operatorMode` to the mapped mode
  - optionally seeds the prompt with the existing scenario starter text already used in the empty-state card handlers
- remove the extra eye/focus icon buttons from the visible composer on `/chat`

Keep:
- attachments
- send/stop
- enter-to-send
- current placeholder text

### 4. Sidebar stays, but its behavior is explicitly constrained
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx` and final sidebar styling in `globals.css`.

Keep:
- nav entries: `Chat`, `Hybrid`, `Relics`
- history list
- footer actions
- account row
- current folder model and prompt-based interaction

Lock behavior:
- `New chat` keeps current route/event flow
- `New folder` keeps current `prompt()` flow, auto-file creation, and optional new-chat kickoff
- no modal redesign in this pass
- if there are no folders, do not render an empty `Folders` section
- history remains visible on `/chat`

Visual changes:
- compact, refined action controls
- reduced visual emphasis on `Relics`
- sidebar/header spacing aligned to the new single-card center view

### 5. Evidence Rail stays persistent, but is visually subordinate
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchEvidenceRail.tsx` only as needed.

Keep:
- current `WorkbenchEvidenceRailConfig`
- section model and data plumbing
- desktop persistence
- mobile overlay behavior

Adjust:
- reduce contrast/emphasis slightly so the single `Chat` card is the dominant CTA
- keep subtitle:
  - `Live causal posture`
- preserve unavailable states, model provenance, density bars, and scientific evidence rows

### 6. Add a causal-graph background system for `/chat`
Implement in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css`.

Create a `/chat`-scoped background using CSS only:
- dark mode:
  - black-charcoal base
  - faint copper/stone node glows
  - subtle curved edge trajectories
- light mode:
  - warm paper base
  - pale graphite network traces
  - muted clay/olive node accents

Implementation rules:
- use pseudo-elements on the chat main pane, not global body
- one layer for soft node glows
- one layer for faint edge arcs / graph trajectories
- no purple halo
- no copied chip grid
- no canvas/WebGL
- no animation beyond subtle page-load fade if already present

### 7. CSS authority must be explicit, not source-order luck
The current stylesheet has multiple late overrides for the same shell selectors. This pass must quarantine old `/chat` shell styling rather than merely add another override.

In `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css`:
- add one final `/chat`-scoped authority block keyed off `.feature-chat`
- define and own:
  - `.feature-chat .chat-workbench`
  - `.feature-chat .chat-empty-shell`
  - `.feature-chat .chat-empty-headline`
  - `.feature-chat .chat-primary-card`
  - `.feature-chat .input-area`
  - `.feature-chat .sidebar`
  - `.feature-chat .rail`
- stop relying on `.protocol-grid` for `/chat` empty state
- quarantine prior `/chat` empty-state selectors by either:
  - narrowing them away from `.feature-chat`, or
  - replacing them with new `.feature-chat` selectors that fully define layout, spacing, and visuals

The implementer must remove or neutralize competing `/chat` empty-state/layout declarations in the existing late-stage blocks so the redesign is deterministic across branches.

### 8. Responsive behavior is part of the spec
The redesign must preserve the current shell behavior across breakpoints.

Desktop (`>=1280px`):
- persistent sidebar
- persistent evidence rail
- centered title + one card above bottom composer

Tablet (`1024px–1279px`):
- sidebar stays visible per current shell behavior
- evidence rail follows current overlay behavior
- single `Chat` card remains centered and scaled down
- composer stays bottom-anchored and full-width within the main pane

Mobile (`<1024px`):
- sidebar and rail continue to use the current overlay model from `WorkbenchShell`
- empty-state stack becomes:
  - title block
  - one full-width `Chat` card
  - composer
- background graph motif simplifies to one glow layer and one faint edge layer
- no overflow or clipped CTA/card edges

### 9. Accessibility and degraded states
The new design must define behavior for non-happy paths.

Required states:
- if evidence is unavailable, current rail empty states remain visible
- if model fallback notice or chat error exists, it must remain readable and not be obscured by the new background
- the `Chat` card must have:
  - keyboard focus state
  - `Enter`/`Space` activation
  - visible focus ring with AA contrast
- composer focus handoff must work for mouse and keyboard activation
- background contrast must not reduce readability of heading, card copy, or composer text

## Public APIs / Interfaces / Types
Add only the minimum new interface required for focus/menu behavior.

Required frontend changes:
- `ChatComposerV2Props`
  - add `textareaRef?: RefObject<HTMLTextAreaElement>`
  - add `scenarioOptions?: readonly { id: string; label: string; mode: 'explore' | 'intervene' | 'audit'; prompt?: string }[]`
  - add `onScenarioSelect?: (id: string) => void`
- Keep `WorkbenchEvidenceRailConfig` unchanged
- Keep route structure and backend APIs unchanged
- `ProtocolCard` can remain in the codebase for other surfaces, but `/chat` empty state no longer depends on it

## Test Cases and Scenarios
- `/chat` empty state renders:
  - one title block
  - one `Chat` card
  - no three-card protocol grid
- `Chat` card click:
  - stays on `/chat`
  - scrolls to composer
  - focuses textarea
- keyboard activation:
  - `Tab` to card
  - `Enter`/`Space` focuses composer
- composer:
  - `DAV Mode` still cycles operator mode
  - `Scenarios` opens distinct menu
  - selecting a scenario updates mode and prompt as defined
  - attachments/send/stop still work
- sidebar:
  - `New chat` still works
  - `New folder` still uses current prompt flow
  - history still loads
- evidence rail:
  - remains visible on desktop empty state
  - remains overlay on smaller breakpoints
- visual checks:
  - dark and light mode
  - desktop/tablet/mobile
  - causal-graph background stays subtle and readable
- hard gates:
  - `npx tsc --noEmit`
  - `npx vitest run`
  - `npm run build`

## Assumptions and Defaults
- `/chat` is the only surface changing in this pass.
- Sidebar remains expanded by default on desktop.
- Evidence Rail remains persistent on desktop.
- `Scenarios` is a lightweight local menu, not a new backend feature.
- Folder behavior stays functionally unchanged in this pass.
- The redesign should be implemented on a clean `main`-based branch to avoid repeating prior deployment drift.
- No SQL, env, or API contract changes are required for this redesign.
