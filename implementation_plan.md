# MASA-on-Main Recovery Implementation Plan

## Mission
Port the MASA chat shell styling onto current `origin/main` without regressing the modern landing page or authenticated app routes.

## Baseline decision
- Functional baseline: current `origin/main`
- Visual references only:
  - `design-system/MASA_Prototype.html`
  - `masa_agent_prompt.md.resolved`
- Explicitly rejected baseline: `269ef40`

## Architecture choice
- Keep current route structure and feature entrypoints
- Keep current `ThemeProvider` and Next.js app structure
- Apply MASA shell styling by editing the current shell/components and token CSS
- Allow TSX changes where current markup diverges from the prototype

## Files in scope
- `src/app/generated-tokens.css`
- `src/app/globals.css`
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/workbench/WorkbenchShell.tsx`
- `src/components/causal-chat/ChatWorkbenchV2.tsx`
- `src/components/causal-chat/ChatComposerV2.tsx`
- `src/components/causal-chat/ProtocolCard.tsx`
- `src/components/causal-chat/ScientificEvidenceList.tsx`
- `src/components/workbench/CausalGauges.tsx`

## Additional hard-gate fixes required on this baseline
- Remove eager module-scope Supabase service construction that breaks `next build`
- Restore legal route deterministic fallback for mocked/empty `analyzeMultiple()` results
- Fix deterministic source scoring drift caused by millisecond `Date.now()` usage
- Fix strict TypeScript test typing in `chat-verified` route tests

## Acceptance criteria mapping
- `/` remains the existing multi-section landing page
- `/chat` uses MASA sidebar/main/rail styling on current main architecture
- `/hybrid`, `/legal`, `/education`, `/lab` remain reachable
- `pnpm -s build` passes
- `./node_modules/.bin/tsc --noEmit` passes
- `./node_modules/.bin/vitest run` passes
- Manual runtime verification remains required for `/chat` in preview/prod

## Risks and controls
- Risk: old prototype styles overriding current app semantics
  - Control: port only visual shell patterns, not old route/layout structure
- Risk: build breaks from env-dependent services in route import graphs
  - Control: remove module-scope singleton exports for server services
- Risk: source-of-truth drift repeats
  - Control: document prototype as visual reference only, not branch baseline

## HUMAN FOLLOW-UP REQUIRED
- Confirm deployment branch is the clean main-based recovery branch, not the old stacked branch chain
- Verify preview/prod `/chat` manually after deploy in both dark and light mode
- Confirm environment parity for Supabase and any external AI/search keys in the intended deployment target

## 2026-03-11 Sidebar Terminal-Scientist Rail

### Mission
Redesign the authenticated workbench sidebar into a dense operator rail that reads like a research console instead of a soft consumer chat menu.

### Architecture choice
- Keep the existing `AppDashboardShell` ownership of shell navigation, history, utilities, and mobile drawer behavior.
- Refactor markup in the shell instead of introducing a parallel sidebar component.
- Add a late CSS authority block in `src/app/globals.css` so the terminal-scientist rail wins over the older overlapping canonical sidebar overrides.

### Files in scope
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/app/globals.css`

### Acceptance criteria mapping
- Oversized circular creation buttons are removed in favor of compact operator command controls.
- Primary navigation reads as mode switching with stronger metadata and active states.
- Session history renders as a notebook ledger with title, recency, domain metadata, and stronger selection treatment.
- Footer utilities and account presentation are quieter and more disciplined.
- Mobile sidebar drawer architecture remains intact.

### Automated evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `338 passed | 1 skipped`
- `npm run build` passed

### Manual verification steps
1. Open `/chat` on desktop and confirm the left rail shows compact commands, mode rows, notebook grouping, and ledger-style history.
2. Select an existing chat session and confirm the active row uses the stronger selected state and metadata chips.
3. Toggle the sidebar collapsed state and confirm icon-only behavior remains usable.
4. Open the mobile shell drawer and confirm the denser rail remains legible and scrollable.
5. Toggle theme and verify the rail remains calm and high-contrast in both light and dark mode.

### Unresolved gaps
- Manual runtime verification is still required for the interactive visual states above.

## 2026-03-11 Sidebar Rail Refinement

### Mission
Refine the terminal-scientist sidebar rail so the header is cleaner, menu hierarchy is more consistent, `Systems` is fully readable, and `Model Settings` visually matches the rest of the rail.

### Architecture choice
- Keep `AppDashboardShell` as the single owner of sidebar structure and interaction.
- Preserve existing mode/system/session/footer ordering and behavior.
- Use sidebar-scoped class hooks in `SidebarModelSettings` so the popover inherits the same workbench theme tokens as the rail.

### Files in scope
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/dashboard/SidebarModelSettings.tsx`
- `src/app/globals.css`

### Acceptance criteria mapping
- Remove the secondary `Chat workbench` descriptor from the sidebar header.
- `Modes` and `Systems` share a more coherent row hierarchy and spacing rhythm.
- `Instruments` and related system rows no longer truncate awkwardly in the default rail width.
- `Model Settings` trigger and popover visually align with `Appearance` and `Documentation`.
- Sidebar behavior remains unchanged across desktop, collapsed, and mobile drawer states.

### Automated evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `338 passed | 1 skipped`
- `npm run build` passed

### Manual verification steps
1. Open `/chat` and confirm the header only shows `Automated Scientist` without the extra workbench descriptor.
2. Compare `Modes` and `Systems` rows and confirm they read as one consistent hierarchy with active-only emphasis.
3. Confirm `Instruments` is fully readable in the desktop rail without awkward truncation.
4. Open `Model Settings` in both light and dark mode and confirm the trigger and popover match the sidebar theme.
5. Confirm collapsed sidebar and mobile drawer behavior remain intact.

### Unresolved gaps
- Manual runtime verification is still required for the refined visual states above.

## 2026-03-11 Landing Dark Theme System Pass

### Mission
Recast the public landing page as a true extension of the MASA workbench by replacing the parchment/light marketing palette with the same obsidian substrate, ember-lit borders, warm mineral surfaces, and restrained off-white typography used by the main dark shell.

### Architecture choice
- Keep the existing landing page section order and section-specific component architecture intact.
- Centralize the redesign in landing-scoped tokens and shared utility classes inside `src/app/globals.css`.
- Patch only the rendered landing sections plus the dormant `Footer` component for parity; do not remount or reorder sections.
- Align route-level theme wiring to `marketing-dark` so the landing is dark by default at the HTML/body/theme-provider level.

### Files in scope
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/middleware.ts`
- `src/components/landing/Navbar.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/EpistemicCards.tsx`
- `src/components/landing/SynthesisPrism.tsx`
- `src/components/landing/CausalDAGPanel.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Process.tsx`
- `src/components/landing/ThreePillars.tsx`
- `src/components/landing/ScientistModel.tsx`
- `src/components/landing/CausalLattice.tsx`
- `src/components/landing/FeatureRail.tsx`
- `src/components/landing/ObsidianVault.tsx`
- `src/components/landing/ArtifactShowcase.tsx`
- `src/components/landing/FAQ.tsx`
- `src/components/landing/ContactForm.tsx`
- `src/components/landing/Footer.tsx`

### Acceptance criteria mapping
- Landing keeps the same section architecture and page flow.
- Landing token scope is dark-only and aligned with the canonical workbench material ladder.
- Navbar, hero, cards, pills, buttons, diagrams, footer, and contact form all use the same restrained obsidian/ember system.
- Warm accents stay sparse and intentional; no purple/neon/glossy SaaS gradients remain in the live landing sections.
- Public marketing route wiring now reflects a dark landing identity instead of `marketing-light`.

### Automated evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `52` test files, `338 passed | 1 skipped`
- `npm run build` failed after clearing the font-network hurdle: Next.js could not collect page data for `/api/benchmark-cost` and `/api/causal-chat/sessions/[id]`

### Manual verification steps
1. Open `/` on desktop and confirm the landing reads as the public face of the dark workbench rather than a separate marketing site.
2. Compare the landing against an authenticated dark workbench route and verify the substrate, border alpha, text ladder, and ember accent logic feel shared.
3. Check hero CTA, navbar dropdowns, feature cards, lattice/diagram panels, FAQ expansion, and contact form contrast.
4. Verify mobile/tablet section transitions remain readable and that no layout structure changed.

### Unresolved gaps
- Hard gate failure: `npm run build` is currently blocked by pre-existing page-data collection errors in unrelated routes.
- Manual browser verification is still required for landing parity and responsiveness.

## 2026-03-13 Focus-Mode Recovery + Dense Session Ledger Refinement

### Mission
Refine the MASA workbench shell so focus mode is recoverable from the desktop shell, the session ledger scrolls independently inside the sidebar, and the no-sidebar / focus-mode chat lane feels more intentional and centered.

### Architecture choice
- Keep `AppDashboardShell` as the single owner of sidebar chrome, history rendering, utilities, and desktop shell controls.
- Keep `WorkbenchShell` as the authority for focus/evidence-rail behavior, but pass raw focus state into the shell so sidebar and rail hiding are immediate.
- Preserve the existing composer-level focus toggle and evidence-rail controls in `ChatComposerV2`; treat them as secondary to the shell-level exit affordance.
- Solve density/scroll behavior in CSS with a nested ledger pane instead of forking sidebar markup into separate mobile/desktop variants.

### Files in scope
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/workbench/WorkbenchShell.tsx`
- `src/app/globals.css`

### Acceptance criteria mapping
- Focus mode exposes a persistent desktop top-left shell control that exits focus mode and restores navigation.
- Sidebar and evidence rail hide immediately on focus-mode entry; composer/input still hides only when focus-mode read conditions are met.
- `Session ledger` becomes the only independently scrollable pane inside the sidebar.
- Recent-history rows become denser and easier to scan, with improved hover/active/delete states.
- Collapsed-sidebar / no-sidebar main canvas reads more centered and deliberate on desktop.

### Automated evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `52` test files, `338 passed | 1 skipped`
- `npm run build` passed

### Manual verification steps
1. Enter focus mode from `/chat` and confirm the top-left shell icon exits focus mode while the sidebar and evidence rail remain hidden.
2. Confirm the composer still disappears only when focus-mode reading conditions are met.
3. Scroll the `Session ledger` and verify the rest of the sidebar stays fixed.
4. Hover, activate, and delete recent-history entries to confirm the denser ledger row behavior and action alignment.
5. Collapse the sidebar or enter focus mode and confirm the main chat lane stays centered and balanced on desktop.

### Unresolved gaps
- Manual runtime verification is still required for focus-mode behavior and sidebar ledger interaction on the deployed app.
- Existing repo-level `HUMAN FOLLOW-UP REQUIRED` audit items remain unchanged.
