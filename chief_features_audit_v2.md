# `/chat` Redesign Plan: Single-Card Scientific Workbench

## Summary
Rebuild the `/chat` empty state into a simpler MASA-style shell with:
- the current sidebar and history preserved, but visually refined
- the Evidence Rail kept persistent on desktop
- the main view reduced from three protocol cards to one primary `Chat` card
- the title area reduced to a single `Scientific Workbench` description block
- a new background system inspired by causal graphs: node fields, faint edge arcs, and depth gradients, without copying the reference app’s chip grid or action labels

This is a `/chat`-only IA and visual redesign. It keeps current app routing, evidence/provenance plumbing, composer behavior, and history loading.

## Key Changes

### 1. Main empty state becomes a single-purpose chat entry
Update the empty state in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`.

Required structure:
- Remove the three protocol cards from the empty state.
- Remove the eyebrow line (`Sovereign Synthesis Engine`).
- Keep only one title block:
  - heading: `Scientific Workbench`
  - one short description paragraph beneath it
- Add one single primary `Chat` card below the description, centered above the composer.

Decision-complete content:
- Heading: `Scientific Workbench`
- Description:
  - `Describe the system, the change, and the outcome you need to understand. Start a causal conversation grounded in evidence, intervention logic, and counterfactual reasoning.`
- Primary card label: `Chat`
- Primary card supporting copy:
  - `Open a research conversation to map mechanisms, test interventions, and audit claims against evidence.`
- Primary card CTA treatment:
  - whole card is clickable
  - footer arrow at the lower-right
  - clicking sets focus to composer and keeps route at `/chat`

Do not render visible secondary cards for `Hybrid` or `Relics` in the main view.

### 2. Introduce a causal-graph background system
Implement in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css` and keep markup minimal.

Visual direction:
- dark mode:
  - deep black-charcoal base
  - copper/stone accents
  - faint graph-node glows
  - soft edge trajectories
- light mode:
  - warm paper base
  - pale graphite edges
  - faint clay/olive node accents

Required background layers:
- shell-wide background on the chat main pane:
  - radial vignette centered slightly below the headline
  - 2–3 blurred “node” glows positioned asymmetrically
  - ultra-faint curved line network using layered CSS gradients
- card-local background:
  - subtle edge tint and shadow, not glass
- composer-local background:
  - slightly darker/lighter inset than page, clearly anchored

Constraints:
- no copied purple arc/halo from the reference screenshot
- no `Generate Code`, `Launch App`, or chip-grid concept
- no animated particles
- no strong neon glow
- no canvas/WebGL dependency

Creative default:
- use CSS pseudo-elements on the main chat canvas:
  - one pseudo-element for diffuse node glows
  - one pseudo-element for faint edge trajectories
- keep opacity low enough that text remains dominant

### 3. Sidebar keeps nav + history, but is simplified and tightened
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx` and final sidebar CSS in `globals.css`.

Locked decisions:
- Keep:
  - top nav entries
  - history list
  - footer actions
  - account row
- Keep right now:
  - `Chat`
  - `Hybrid`
  - `Relics`
- Keep `Hybrid` badge if already present
- Keep `New chat` and `New folder`, but style them as cleaner action controls aligned to the new single-card concept

Required sidebar treatment:
- reduce the visual weight of `Relics`
- keep history visible on `/chat`
- remove any empty “Folders” block if there are no folders
- keep the header simple and structural, not brand-heavy
- if the current control-strip header already exists on the target branch, preserve it
- otherwise use a compact utility header with:
  - sidebar toggle
  - back
  - forward

Action button spec:
- `New chat` and `New folder` become horizontally aligned rounded-rect controls
- no tall oval pills
- icon on left, serif two-line label removed
- compact single-line labels:
  - `New chat`
  - `New folder`

### 4. Composer becomes the only actionable bottom surface
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatComposerV2.tsx`.

Keep behavior:
- attachments
- operator mode cycling
- send/stop
- enter-to-send

Visible toolbar must simplify to:
- `Attach`
- `DAV Mode`
- `Scenarios`
- spacer
- `↵ to send`
- `Send`

Do not render extra eye/focus icon buttons in the empty-state composer.

Composer copy:
- placeholder:
  - `Describe the real-world situation, what changed, and what outcome you need to understand…`

Layout:
- composer stays bottom-anchored
- single chat card sits above it with enough separation that the empty state reads in two layers:
  - description + card
  - composer

### 5. Evidence Rail stays persistent, but visual density should support the simpler center view
Update `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchEvidenceRail.tsx` only as needed.

Keep:
- persistent rail on desktop
- current data contract and wiring
- causal density
- alignment posture
- provenance
- active domain
- scientific evidence

Visual adjustment for this redesign:
- keep the MASA ledger model
- slightly reduce visual emphasis so the single chat card remains the dominant CTA
- maintain subtitle as:
  - `Live causal posture`
- do not remove sections on empty state

### 6. Collapse competing chat-shell overrides into one final authority block
Current `globals.css` has accumulated shell generations. For this work, normalize the `/chat` shell with a single final authority block that explicitly governs:
- `.feature-chat`
- `.chat-workbench`
- `.chat-empty-shell`
- `.chat-empty-headline`
- `.protocol-grid` replacement
- `.chat-primary-card` (new)
- `.input-area`
- `.sidebar`
- `.rail`

Decision:
- the old three-card layout classes can remain for other surfaces if still referenced, but `/chat` empty state must no longer depend on them
- add a new dedicated class for the single card:
  - `.chat-primary-card`

## Public APIs / Interfaces / Types
No backend or route contract changes.

Minimal frontend interface changes:
- `ProtocolCard` should no longer be required by `/chat` empty state
- if still used elsewhere, keep the component intact
- add a new local empty-state card component or inline structure for the single `Chat` card
- `WorkbenchEvidenceRailConfig` stays unchanged
- `ChatComposerV2Props` stays unchanged

## Test Cases and Scenarios
- `/chat` empty state:
  - renders one title block
  - renders exactly one primary `Chat` card
  - does not render the three old protocol cards
- sidebar:
  - nav works
  - history loads
  - `New chat` still triggers new chat
  - `New folder` still works
- composer:
  - attachments still work
  - operator mode still cycles behind `DAV Mode`
  - enter-to-send still works
  - send/stop still work
- Evidence Rail:
  - still renders on desktop empty state
  - still updates after messages/runs
- visual checks:
  - dark and light modes
  - background graph motif does not reduce readability
  - center card remains the dominant CTA
- hard gates:
  - `npx tsc --noEmit`
  - `npx vitest run`
  - `npm run build`

## Assumptions and Defaults
- Scope is `/chat` only.
- Sidebar remains visible with nav + history.
- Evidence Rail remains persistent on desktop.
- The empty state is intentionally simplified to one primary path: `Chat`.
- `Hybrid` and `Relics` remain accessible only through the sidebar, not the main canvas.
- The creative background should evoke causal graphs through subtle nodes/edges, not imitate the reference app’s blue-glow product aesthetic.
- If any current branch still has unresolved deployment parity issues, this redesign should be implemented only on a clean `main`-based branch.
