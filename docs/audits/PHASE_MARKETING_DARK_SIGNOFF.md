# PHASE MARKETING DARK SIGNOFF

## Phase
Public Marketing Dark Redesign

## Decision
Implementation complete and locally verified. Final rollout signoff is conditional on manual browser verification in the target deployment environment.

## Scope Verified
- Marketing theme scope wiring in middleware/layout
- `/` landing page shell
- `/how-it-works` architecture marketing shell
- Shared public marketing navigation
- Shared public CTA/button/card/input styling
- Dark visual treatment for major proof/diagram panels

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
- Marketing pages are now forced onto a dark scope without affecting non-marketing routes.

## Caveats
- `npm run build` emits pre-existing non-blocking warnings from unrelated code paths and lint surfaces.
- Manual browser validation for animation/readability/responsiveness was not executed inside this terminal session.

## HUMAN FOLLOW-UP REQUIRED
1. Open deployed preview/prod `/` and `/how-it-works` on desktop and mobile.
2. Verify navbar dropdowns, `/chat` CTA behavior, `#contact` navigation, white-paper links, and reduced-motion accessibility.
3. Confirm deployment/environment parity in the intended target before final approval.
