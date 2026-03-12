# MASA-on-Main Recovery Walkthrough

## What changed
1. Rebased the design work onto current `origin/main` in a clean worktree instead of the historical `269ef40` prototype branch.
2. Replaced the old shell drift with MASA-aligned geometry and surface styling in the current app shell.
3. Preserved landing-page and authenticated-route structure from modern `main`.
4. Removed two eager server-service singletons that caused build-time route evaluation to crash without runtime credentials.
5. Restored legal-route fallback behavior so tests and deterministic gate logic match expected output classes.
6. Fixed a determinism bug in source recency scoring by switching from millisecond drift to UTC day granularity.

## Exact files changed
- `src/app/generated-tokens.css`
- `src/app/globals.css`
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/workbench/WorkbenchShell.tsx`
- `src/components/causal-chat/ChatWorkbenchV2.tsx`
- `src/components/causal-chat/ChatComposerV2.tsx`
- `src/components/causal-chat/ProtocolCard.tsx`
- `src/components/causal-chat/ScientificEvidenceList.tsx`
- `src/components/workbench/CausalGauges.tsx`
- `src/lib/services/axiom-compression-service.ts`
- `src/lib/services/session-service.ts`
- `src/app/api/legal-reasoning/route.ts`
- `src/app/api/bridge/chat-verified/__tests__/route.test.ts`
- `src/lib/services/source-scoring-service.ts`

## Why these changes were necessary
- `269ef40` is an old prototype lineage that collapses the landing page and predates modern app routes.
- Current `main` is the only safe functional baseline.
- The current `main` baseline also contained unrelated hard-gate issues that blocked build/test verification. Those had to be fixed to reach production-complete status.

## Automated verification evidence
- `./node_modules/.bin/eslint ...touched files...` passed with no errors or warnings
- `./node_modules/.bin/next build` passed
- `./node_modules/.bin/tsc --noEmit` passed
- `./node_modules/.bin/vitest run` passed: `51 passed`, `337 passed | 1 skipped`

## Manual verification still required
- Open `/` and confirm the landing page remains the full multi-section marketing page
- Open `/chat` and verify the MASA sidebar/main/rail styling in dark mode
- Toggle theme and verify `/chat` light mode parity
- Confirm `/hybrid`, `/legal`, `/education`, and `/lab` remain reachable
- Verify the intended deployment target is using this clean main-based branch, not the old rollback branch or a stacked review branch

## HUMAN FOLLOW-UP REQUIRED
1. Merge/deploy the clean main-based recovery branch only
2. Verify preview/prod environment variables point to the intended Supabase project
3. Perform preview/prod runtime smoke test on `/`, `/chat`, `/hybrid`, `/legal`, `/education`, `/lab`

## 2026-03-11 Sidebar Terminal-Scientist Rail

### What changed
1. Rebuilt the workbench sidebar structure in `AppDashboardShell` around clear operator sections: modes, compact commands, systems, notebooks, ledger, utilities, and account.
2. Replaced the oversized circular creation controls with compact inline command buttons.
3. Upgraded session history rows into ledger entries with explicit title, recency, domain tags, and stronger active/hover feedback.
4. Added a new late-stage CSS authority block so the redesigned rail is consistent and not partially overridden by older canonical sidebar styles.
5. Preserved the existing mobile drawer and collapsed-sidebar architecture instead of forking the shell.

### Exact files changed
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/app/globals.css`
- `implementation_plan.md`
- `walkthrough.md`
- `docs/audits/PHASE_SIDEBAR_TERMINAL_RAIL_SIGNOFF.md`

### Why these changes were necessary
- The previous rail mixed multiple competing style layers, which produced oversized action controls and weak hierarchy.
- History rows read like placeholder text instead of active research material.
- Utilities and account controls carried too much visual weight relative to primary workbench navigation.
- The redesign keeps MASA’s warm-mineral logic but shifts the shell toward a quieter, denser, more disciplined operator interface.

### Automated verification evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `52` test files, `338 passed | 1 skipped`
- `npm run build` passed

### Manual verification still required
- Open `/chat` and verify the new rail density and selected-thread treatment on desktop.
- Collapse and reopen the sidebar to confirm icon-only navigation remains clear.
- Open the mobile drawer to verify spacing and scroll behavior.
- Toggle theme and verify contrast parity in light and dark mode.

### HUMAN FOLLOW-UP REQUIRED
1. Run the desktop `/chat` smoke check for the sidebar states above.
2. Run the mobile `/chat` smoke check for drawer behavior and density.
3. Confirm the final deployed preview uses this updated shell styling before promoting.

## 2026-03-11 Sidebar Rail Refinement

### What changed
1. Removed the extra sidebar header descriptor so the brand block is cleaner and less top-heavy.
2. Reworked `Modes` and `Systems` row structure so both sections share the same copy rhythm and active-state hierarchy.
3. Expanded effective content room for the `Systems` row layout so `Instruments` and adjacent metadata stay readable.
4. Added sidebar-scoped `Model Settings` hooks and themed its trigger/popover to match the same warm-mineral rail treatment in light and dark mode.

### Exact files changed
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/dashboard/SidebarModelSettings.tsx`
- `src/app/globals.css`
- `implementation_plan.md`
- `walkthrough.md`
- `docs/audits/PHASE_SIDEBAR_TERMINAL_RAIL_SIGNOFF.md`

### Why these changes were necessary
- The first rail pass fixed the major structure, but the header still carried redundant copy and the section hierarchy still felt uneven.
- `Systems` looked visually weaker than `Modes`, and the `Instruments` row lost legibility because the detail/badge layout was too cramped.
- `Model Settings` still looked like a separate light-themed control rather than a first-class part of the workbench rail.

### Automated verification evidence
- `npx vitest run` passed: `52` test files, `338 passed | 1 skipped`
- `npm run build` passed
- `npx tsc --noEmit` passed after regenerating `.next/types` from the successful build

### Manual verification still required
- Open `/chat` and verify the cleaned header, improved menu-card hierarchy, readable `Systems` row, and themed `Model Settings` panel.
- Confirm the sidebar still behaves correctly when collapsed and inside the mobile drawer.
- Verify both light and dark themes visually in the running app.

### HUMAN FOLLOW-UP REQUIRED
1. Perform the runtime `/chat` verification in desktop light mode.
2. Perform the runtime `/chat` verification in desktop dark mode.
3. Perform the runtime `/chat` verification in the mobile drawer layout.

## 2026-03-11 Landing Dark Theme System Pass

### What changed
1. Replaced the landing page's light editorial token scope with a dark, workbench-derived palette based on warm obsidian surfaces, ember border glow, and off-white type.
2. Updated landing utility classes so shared panels, notes, stat cards, inputs, and CTA controls all inherit the same dark mineral material treatment.
3. Rethemed every rendered landing section without changing section order or layout structure.
4. Shifted the public theme wiring from `marketing-light` to `marketing-dark` so the landing is forced onto the dark identity at the route shell level.
5. Rethemed the dormant `Footer` component for parity without adding it back to the live home-page assembly.

### Exact files changed
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
- `implementation_plan.md`
- `walkthrough.md`
- `docs/audits/PHASE_MARKETING_DARK_SIGNOFF.md`

### Why these changes were necessary
- The live landing was still speaking in a pale marketing palette that no longer matched the authenticated MASA shell.
- Several high-visibility sections were hardcoded to white/parchment surfaces, which broke the illusion that the landing belonged to the same product family as the workbench.
- Route-level theme wiring still labeled the public experience as `marketing-light`, which fought the intended dark landing identity.

### Automated verification evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `52` test files, `338 passed | 1 skipped`
- `npm run build` reached full compilation and lint/type checks after enabling network access for `next/font`, then failed while collecting page data for unrelated routes: `/api/benchmark-cost` and `/api/causal-chat/sessions/[id]`

### Manual verification still required
- Open `/` on desktop and mobile and verify the landing sections now read as one dark workbench-adjacent system.
- Compare `/` against a dark authenticated workbench route to confirm palette and material parity.
- Check navbar dropdowns, CTA states, diagram legibility, FAQ expansion, and contact form contrast in-browser.

### HUMAN FOLLOW-UP REQUIRED
1. Resolve the existing `npm run build` page-data failures for `/api/benchmark-cost` and `/api/causal-chat/sessions/[id]`.
2. Run browser validation on `/` across desktop and mobile after the next successful preview/prod deploy.
3. Confirm the deployed route header/theme scope is `marketing-dark` for the landing experience.

## 2026-03-13 Focus-Mode Recovery + Dense Session Ledger Refinement

### What changed
1. Promoted the desktop shell control into the focus-mode recovery path so the top-left icon exits focus mode directly instead of leaving the user stranded in the reading surface.
2. Corrected the focus-mode shell contract in `WorkbenchShell` so sidebar and evidence rail hide on raw focus-state entry, while the composer still waits for focus-read readiness before disappearing.
3. Reworked the sidebar interior into fixed chrome plus a nested `Session ledger` scroll pane, so browsing recent history no longer drags the whole sidebar.
4. Redesigned recent-history rows into denser ledger entries with a leading dot marker, tighter title/meta spacing, cleaner hover and active states, and better aligned delete affordances.
5. Re-centered the no-sidebar/focus-mode chat lane so the main canvas feels intentional rather than sparse when navigation is hidden.

### Exact files changed
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/workbench/WorkbenchShell.tsx`
- `src/app/globals.css`
- `implementation_plan.md`
- `walkthrough.md`
- `docs/audits/PHASE_FOCUS_LEDGER_SIGNOFF_2026-03-13.md`

### Why these changes were necessary
- Focus mode previously passed `focusReadMode` into the outer shell, which delayed sidebar and evidence-rail hiding until the composer was also eligible to disappear. That made focus mode feel inconsistent and harder to recover from.
- The sidebar history shared the same scroll column as the rest of the rail, so long recent-session lists degraded the whole sidebar interaction.
- History rows were too roomy and card-like for the density expected from a research ledger, and the delete affordance collided visually with the row content.
- When the sidebar was collapsed or hidden, the main lane needed a stronger centered composition so the tiny shell control did not feel isolated.

### Automated verification evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `52` test files, `338 passed | 1 skipped`
- `npm run build` passed

### Manual verification still required
- Enter and exit focus mode on `/chat` and confirm the shell-level exit icon restores the normal layout.
- Scroll the `Session ledger` on desktop and confirm only the ledger pane scrolls.
- Open, hover, and delete recent sessions to confirm the denser row treatment remains readable and stable.
- Confirm the centered no-sidebar/focus-mode canvas looks balanced in the live app.

### HUMAN FOLLOW-UP REQUIRED
1. Run a live `/chat` focus-mode smoke test after deployment.
2. Verify the nested ledger scroll behavior on the deployed desktop shell.
3. Existing repo-level `HUMAN FOLLOW-UP REQUIRED` audit markers remain unchanged and still require follow-up.
