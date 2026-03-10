# Dark Marketing + Chat Redesign Walkthrough

## What changed
1. Replaced the effective marketing light lock with a dedicated dark marketing scope wired through `src/middleware.ts` and `src/app/layout.tsx`.
2. Added a large shared dark marketing token/primitives layer in `src/app/globals.css` for section shells, cards, buttons, chips, inputs, and atmospheric background treatments.
3. Rebuilt the landing-page hero and navigation into darker, denser, more interactive surfaces while keeping CTA behavior and auth logic intact.
4. Restyled the core landing sections so the proof panels, cards, metrics, and CTA rows now sit on unified obsidian/glass surfaces instead of pale paper panels.
5. Brought `/how-it-works` onto the same marketing shell and upgraded its hero/system overview so the architecture route reads like the same product family rather than a separate microsite.
6. Added a forced `chat-dark` scope for `/chat` so the MASA workbench no longer inherits the warm light shell in production.
7. Restyled the `/chat` shell around darker obsidian/glass surfaces across the sidebar, protocol cards, composer, messages, and evidence rail, while preserving existing auth, chat, and rail behavior.
8. Updated visualization containers for the DAG/lattice/model panels so they remain legible and intentional inside the new dark system.

## Exact files changed
- `src/app/globals.css`
- `src/app/chat/page.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/how-it-works/page.tsx`
- `src/middleware.ts`
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/landing/Navbar.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/EpistemicCards.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Process.tsx`
- `src/components/landing/ThreePillars.tsx`
- `src/components/landing/SynthesisPrism.tsx`
- `src/components/landing/ScientistModel.tsx`
- `src/components/landing/CausalDAGPanel.tsx`
- `src/components/landing/CausalLattice.tsx`
- `src/components/landing/FeatureRail.tsx`
- `src/components/landing/ObsidianVault.tsx`
- `src/components/landing/ArtifactShowcase.tsx`
- `src/components/landing/FAQ.tsx`
- `src/components/landing/ContactForm.tsx`
- `src/components/architecture/ArchitectureHero.tsx`
- `src/components/architecture/SystemOverview.tsx`

## Automated verification evidence
- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npx vitest run`: pass (`53` files, `341` passed, `1` skipped)

## Caveats
- `npm run build` still reports pre-existing warnings from unrelated files, including the existing `pdfjs-loader` critical dependency warning and repo-wide ESLint warnings. They did not block the build and were not introduced by this redesign.
- `npx tsc --noEmit` depends on regenerated `.next/types` in this repo, so the reliable order remains `npm run build` followed by `npx tsc --noEmit`.
- Repo-level unrelated dirty files were present before this work; this redesign was limited to the marketing/theme files listed above.

## Manual verification still required
- Inspect `/`, `/how-it-works`, and `/chat` in a real browser on desktop and mobile.
- Check navbar dropdown behavior, auth CTA loading/signed-in states, anchor navigation, and contact form focus states.
- Check the `/chat` empty state, composer, message thread, evidence rail, sidebar collapse, and model settings in the forced dark scope.
- Verify there is no forced-light flash on marketing or chat routes.
- Perform preview/prod smoke checks after deployment.

## Deployment finding
- Vercel production for `wuweism.com` currently aliases to `crucible-git-main-zug4711s-projects.vercel.app`, so production is still serving `main`, not the branch used for this redesign work.
