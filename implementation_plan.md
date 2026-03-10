# Dark Marketing Redesign Implementation Plan

## Mission
Redesign the public marketing experience for `/` and `/how-it-works` into a unified dark-mode system that uses the semantic tokens from `landing-page-design-v2.md`, preserves the MASA/Wu-Weism editorial voice, and upgrades the UI toward a denser sci-lab presentation without changing route structure or backend behavior.

## Architecture choice
- Keep the current Next.js route structure and existing CTA destinations.
- Move marketing theming to a dedicated dark scope controlled by middleware + root layout.
- Centralize the redesign in `src/app/globals.css` via a shared dark marketing token/primitives layer.
- Rebuild the highest-impact landing and architecture sections to consume shared dark surfaces, button treatments, card treatments, and interactive states instead of hardcoded light backgrounds.
- Preserve authenticated/app-route theming outside the marketing scope.

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

## Acceptance criteria mapping
- `/` remains the multi-section landing page, but now renders with a dark-first marketing shell, modernized hero, upgraded cards, and higher-density interaction styling.
- `/how-it-works` remains the architecture route and now shares the same dark marketing scope and public-facing visual language.
- Existing CTA destinations remain intact: `/chat`, `#contact`, and `/masa-white-paper.html`.
- No backend API, schema, or persistence behavior changed.
- Marketing routes no longer depend on the old light-only theme lock path.

## Automated evidence
- `npx tsc --noEmit` passed.
- `npx vitest run` passed: `53` test files, `341` tests passed, `1` skipped.
- `npm run build` passed.

## Manual verification still required
- Browser-check `/` and `/how-it-works` on desktop and mobile for layout, contrast, and animation quality.
- Verify navbar dropdowns, auth CTA states, `#contact` navigation, and white-paper links.
- Confirm no light-theme flash appears on marketing routes.
- Validate reduced-motion behavior and keyboard/focus states for nav, cards, accordions, and form inputs.

## HUMAN FOLLOW-UP REQUIRED
- Open preview/prod and manually smoke-test `/` and `/how-it-works` after deployment.
- Confirm the deployed branch points to the intended Supabase/environment target, even though this redesign introduced no schema or env changes.
