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

## 2026-03-11 Landing Dark Theme System Pass

### Decision
Implementation is complete, but this phase is not fully signable yet because one hard gate remains red: `npm run build` still fails on unrelated page-data collection errors after compilation succeeds.

### Scope Verified
- `/` landing page token scope and public theme forcing
- Navbar, hero, diagrams, feature cards, protocol/architecture sections, FAQ, contact form
- Shared landing CTA/input/panel utility styling
- Dormant `Footer` theme parity

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

### Evidence
#### Compile
- `npx tsc --noEmit`: pass

#### Test
- `npx vitest run`: pass (`52` test files, `338` passed, `1` skipped)

#### Production Build
- `npm run build`: failed after successful compilation/lint/type stages because Next.js could not collect page data for `/api/benchmark-cost` and `/api/causal-chat/sessions/[id]`
- Initial sandbox-only build also failed on Google Fonts fetch; rerunning with network access cleared that environmental blocker and exposed the remaining route-level build issue above

### Behavioral Integrity
- No landing layout structure or section order changed.
- No backend route, schema, or persistence contracts were intentionally modified for this theme pass.
- Landing dark-mode identity is now enforced from middleware/layout/theme-provider down through landing tokens and surfaces.

### Caveats
- Manual browser validation was not completed inside this terminal session.
- `npm run build` remains blocked by unrelated route collection failures, so this task stays implemented but not fully closed under the repository hard gates.

## HUMAN FOLLOW-UP REQUIRED
1. Fix the build-time page-data failures for `/api/benchmark-cost` and `/api/causal-chat/sessions/[id]`.
2. Open deployed preview/prod `/` on desktop and mobile and confirm dark landing parity with the authenticated workbench.
3. Verify the landing route is served with `data-theme-scope="marketing-dark"` before final approval.
