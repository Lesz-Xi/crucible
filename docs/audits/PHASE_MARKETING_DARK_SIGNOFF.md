# PHASE MARKETING + CHAT DARK SIGNOFF

## Phase
Public Marketing + Chat Dark Redesign

## Decision
Implementation complete and locally verified. Final rollout signoff is conditional on manual browser verification in the target deployment environment.

## Scope Verified
- Marketing theme scope wiring in middleware/layout
- `/` landing page shell
- `/how-it-works` architecture marketing shell
- `/chat` forced dark workbench shell
- Shared public marketing navigation
- Shared public CTA/button/card/input styling
- Dark visual treatment for major proof/diagram panels
- Dark visual treatment for the chat sidebar, protocol cards, composer, messages, and evidence rail

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

## Evidence
### Compile
- `npx tsc --noEmit`: pass

### Test
- `npx vitest run`: pass (`53` test files, `341` passed, `1` skipped)

### Production Build
- `npm run build`: pass

## Behavioral Integrity
- No backend route, schema, or persistence contracts changed.
- Marketing CTA destinations remain unchanged.
- Marketing pages and `/chat` are now forced onto dedicated dark scopes without changing backend behavior.

## Caveats
- `npm run build` emits pre-existing non-blocking warnings from unrelated code paths and lint surfaces.
- `npx tsc --noEmit` requires generated `.next/types`, so it must be run after a successful build in this repo state.
- Manual browser validation for animation/readability/responsiveness was not executed inside this terminal session.

## HUMAN FOLLOW-UP REQUIRED
1. Open deployed preview/prod `/`, `/how-it-works`, and `/chat` on desktop and mobile.
2. Verify navbar dropdowns, `/chat` CTA behavior, sidebar collapse, model settings, evidence rail, `#contact` navigation, white-paper links, and reduced-motion accessibility.
3. Confirm deployment/environment parity in the intended target before final approval.
4. As of March 10, 2026, `wuweism.com` still points at the Vercel `main` deployment alias `crucible-git-main-zug4711s-projects.vercel.app`; production will not change until the updated branch is deployed.
