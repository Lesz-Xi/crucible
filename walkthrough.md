# Dark Marketing Redesign Walkthrough

## What changed
1. Replaced the effective marketing light lock with a dedicated dark marketing scope wired through `src/middleware.ts` and `src/app/layout.tsx`.
2. Added a large shared dark marketing token/primitives layer in `src/app/globals.css` for section shells, cards, buttons, chips, inputs, and atmospheric background treatments.
3. Rebuilt the landing-page hero and navigation into darker, denser, more interactive surfaces while keeping CTA behavior and auth logic intact.
4. Restyled the core landing sections so the proof panels, cards, metrics, and CTA rows now sit on unified obsidian/glass surfaces instead of pale paper panels.
5. Brought `/how-it-works` onto the same marketing shell and upgraded its hero/system overview so the architecture route reads like the same product family rather than a separate microsite.
6. Updated visualization containers for the DAG/lattice/model panels so they remain legible and intentional inside the new dark system.

## Exact files changed
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/how-it-works/page.tsx`
- `src/middleware.ts`
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
- `npx tsc --noEmit`: pass
- `npx vitest run`: pass (`53` files, `341` passed, `1` skipped)
- `npm run build`: pass

## Caveats
- `npm run build` still reports pre-existing warnings from unrelated files, including the existing `pdfjs-loader` critical dependency warning and repo-wide ESLint warnings. They did not block the build and were not introduced by this redesign.
- Repo-level unrelated dirty files were present before this work; this redesign was limited to the marketing/theme files listed above.

## Manual verification still required
- Inspect `/` and `/how-it-works` in a real browser on desktop and mobile.
- Check navbar dropdown behavior, auth CTA loading/signed-in states, anchor navigation, and contact form focus states.
- Verify there is no forced-light flash on marketing routes.
- Perform preview/prod smoke checks after deployment.
