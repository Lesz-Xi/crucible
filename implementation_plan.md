# Dark Marketing + Chat Redesign Implementation Plan

## Mission
Redesign the public marketing experience for `/` and `/how-it-works`, then carry the same dark-first system into `/chat`, using the semantic tokens from `landing-page-design-v2.md`, preserving the MASA/Wu-Weism editorial voice, and upgrading the UI toward a denser sci-lab presentation without changing route structure or backend behavior.

## Architecture choice
- Keep the current Next.js route structure and existing CTA destinations.
- Move marketing theming to a dedicated dark scope controlled by middleware + root layout.
- Centralize the redesign in `src/app/globals.css` via a shared dark marketing token/primitives layer.
- Rebuild the highest-impact landing and architecture sections to consume shared dark surfaces, button treatments, card treatments, and interactive states instead of hardcoded light backgrounds.
- Preserve authenticated/app-route theming outside the forced marketing/chat scopes.
- Add a dedicated forced-dark scope for `/chat` so production no longer depends on the user-selected theme state to render the MASA workbench correctly.

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

## Acceptance criteria mapping
- `/` remains the multi-section landing page, but now renders with a dark-first marketing shell, modernized hero, upgraded cards, and higher-density interaction styling.
- `/how-it-works` remains the architecture route and now shares the same dark marketing scope and public-facing visual language.
- `/chat` now renders inside a forced dark workbench scope with redesigned sidebar, protocol cards, composer, message surfaces, and evidence rail styling.
- Existing CTA destinations remain intact: `/chat`, `#contact`, and `/masa-white-paper.html`.
- No backend API, schema, or persistence behavior changed.
- Marketing and chat routes no longer depend on the old light-only/theme-selected path.

## Automated evidence
- `npm run build` passed and regenerated `.next/types`.
- `npx tsc --noEmit` passed.
- `npx vitest run` passed: `53` test files, `341` tests passed, `1` skipped.

## Manual verification still required
- Browser-check `/`, `/how-it-works`, and `/chat` on desktop and mobile for layout, contrast, and animation quality.
- Verify navbar dropdowns, auth CTA states, `#contact` navigation, and white-paper links.
- Confirm no light-theme flash appears on marketing or chat routes.
- Validate reduced-motion behavior and keyboard/focus states for nav, cards, accordions, and form inputs.
- Validate the `/chat` sidebar, model settings, protocol cards, composer, and evidence rail in both empty and active-session states.

## HUMAN FOLLOW-UP REQUIRED
- Open preview/prod and manually smoke-test `/`, `/how-it-works`, and `/chat` after deployment.
- Confirm the deployed branch points to the intended Supabase/environment target, even though this redesign introduced no schema or env changes.
- As of March 10, 2026, `wuweism.com` resolves to the Vercel `crucible` production deployment alias `crucible-git-main-zug4711s-projects.vercel.app`, which indicates production is still serving `main` until the hotfix branch is deployed.
