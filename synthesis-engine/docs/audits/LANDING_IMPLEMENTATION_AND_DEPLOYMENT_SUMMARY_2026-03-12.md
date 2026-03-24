# Landing Page Implementation And Deployment Summary

Generated: 2026-03-12  
Workspace: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`

## 1. Executive Summary

This document summarizes two connected threads of work:

1. The full landing-page redesign and refinement pass that transformed the public landing experience into a dark, MASA-aligned surface.
2. The root-cause analysis and final production fix for the recurring "commit/push succeeded but the app domain still shows the old landing" problem.

The landing work was not a single cosmetic edit. It included:

- a full dark-theme token system derived from the MASA workbench shell
- section-by-section visual and interaction redesign across the landing page
- multiple structural simplifications requested during iteration
- architecture-card and blueprint refactors
- interactive timeline behavior
- multiple card-system hierarchy and hover refinements

The deployment issue was not a Vercel outage. It was a release-consistency problem caused by:

- branch drift
- preview-vs-production confusion
- duplicated landing theme sources
- partial production promotions

The final production-safe fix is now on `origin/main` at commit:

- `0f1c72e` `fix(landing): isolate marketing theme source of truth`

## 2. Primary Landing Implementation Scope

Primary landing redesign commit:

- `ffb3507` `style(landing): unify dark workbench surfaces`

Files changed in that landing redesign commit:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/middleware.ts`
- `src/components/landing/ArtifactShowcase.tsx`
- `src/components/landing/CausalDAGPanel.tsx`
- `src/components/landing/CausalLattice.tsx`
- `src/components/landing/ContactForm.tsx`
- `src/components/landing/EpistemicCards.tsx`
- `src/components/landing/FAQ.tsx`
- `src/components/landing/FeatureRail.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Footer.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/Navbar.tsx`
- `src/components/landing/ObsidianVault.tsx`
- `src/components/landing/Process.tsx`
- `src/components/landing/ScientistModel.tsx`
- `src/components/landing/SynthesisPrism.tsx`
- `src/components/landing/ThreePillars.tsx`

## 3. Design Direction Implemented

### 3.1 Core Theme Shift

The landing page was converted from a pale, parchment-like public marketing surface into a restrained dark interface aligned with the main MASA workbench.

Key visual principles implemented:

- deep obsidian / charcoal substrate
- ember / bronze / burnt-amber accent logic
- high-density scientific-instrument visual tone
- serious, trust-first contrast hierarchy
- material layering through surface depth and border light, not loud gradients
- sparse accent usage with warm focus cues

### 3.2 Global Theme Wiring

Theme routing and shell behavior were aligned so the landing page can force the correct dark marketing state:

- `src/middleware.ts` marks `/` with `x-theme-scope=marketing-dark`
- `src/app/layout.tsx` reads that scope and forces dark theme behavior at the document level
- landing wrappers continue to use the `theme-landing` scope at the page surface level

## 4. Section-By-Section Landing Changes

### 4.1 Navbar

The navbar was re-skinned into a darker, more mineral public shell:

- dark translucent header treatment
- restrained CTA surfaces
- reduced bright marketing-site feel
- better alignment with the main workbench shell

### 4.2 Hero

The hero was converted into the dark MASA instrument identity:

- warm obsidian hero substrate
- dark diagram shell instead of parchment styling
- more serious CTA treatment
- stronger visual continuity with the workbench

### 4.3 Synthesis Prism / Process Layer

This section was refined repeatedly:

- dark scientific graph shell
- later removal of the redundant outer wrappers around the Causal Graph panel
- cleanup of labels `SCM ACTIVE` and `TRACE PRESERVED`
- preserved inner graph card while removing redundant frame nesting

### 4.4 Feature / Explainer Surfaces

Feature sections were all rethemed to the new dark material system:

- cards shifted to mineral dark surfaces
- icon wells and badges tuned to ember/moss/slate accents
- typography rebalanced to remain legible at higher density

### 4.5 Process Timeline

The process section evolved from static to interactive:

- scroll-reactive timeline behavior
- active step updates while scrolling up/down
- rail fill and step activation based on scroll position

Later adjustment:

- left-side active-phase cards were removed so the section remains cleaner and less duplicated

### 4.6 Three Pillars

The Three Pillars section was re-skinned into the landing dark system.

One later refinement:

- the `Update Mechanism` card was brought into parity with the other cards by ensuring it used the same dot-based list treatment

### 4.7 Scientist Model / Causal Topology

The visual card hierarchy around the topology panel was simplified:

- removed redundant outer wrappers
- retained only the inner visualization card layout
- reduced nested-card feeling

### 4.8 Causal Lattice / System Architecture

This section received the most extensive refinement.

Implemented changes included:

- compact module-card redesign
- architecture cards treated as instrument modules instead of mini feature pages
- tighter card density for 100% zoom readability
- hover border refinement across the architecture cards
- blueprint label cleanup and collision fixes
- removal of redundant in-panel labels where they conflicted with geometry
- stronger alignment between left-side modules, right-side blueprint, and lower protocol ledger

### 4.9 FeatureRail / Unified Application Page

This section was refined iteratively:

- `ObsidianVault` section removed from the page entirely
- nested wrappers around the Unified Application Page were progressively simplified
- metrics cluster `LANES / RELIC ROOMS / STATE` was removed
- width tuning was adjusted to make the section feel more centered and less padded

### 4.10 Artifact Showcase, FAQ, Contact

These were all brought into the same dark palette and card language:

- darker mineral card shells
- improved border and shadow consistency
- CTA surfaces aligned with the workbench accent logic

## 5. Structural Simplifications Requested During Iteration

Several user-directed simplifications were implemented as part of the landing pass:

- removed `ObsidianVault` from the landing page render tree
- removed extra wrappers around the Unified Application Page section
- removed duplicate path labels inside architecture cards
- removed inner blueprint framing that created excessive nesting
- removed duplicate footer-like labels inside the structural causal model card
- removed extra active-phase cards in the process timeline left column

## 6. Architecture Lattice And Protocol Ledger Work

### 6.1 Module Cards

The System Architecture cards were redesigned to behave like indexed control modules:

- denser layout
- smaller editorial footprint
- more explicit metadata hierarchy
- improved border hover treatment
- better top/bottom row alignment

### 6.2 Verified Blueprint

The blueprint was repeatedly cleaned up to reduce annotation collisions:

- `Verified Blueprint` label removed when it conflicted visually
- `Architectural Lattice`, `Causal Blueprint`, and `04 Modules / Stable` labels removed
- `Audit Trace` and `Hard Constraint` labels moved fully inside the drawing field
- node and layer chips repositioned so they no longer obscure the route

### 6.3 Protocol Ledger

The ledger evolved through several stages:

1. Initial concept as a lower procedural route strip.
2. Refactor into its own dedicated card system.
3. Docked lower in the blueprint area.
4. Split into a separate sibling container with clearer hierarchy.
5. Brought into alignment with the blueprint card rhythm.

Final direction:

- protocol ledger exists as its own separate lower surface
- each step is its own instrument card
- card states share a unified visual language
- path labels and dots are consistent across modules

## 7. Card-System Refinements

Repeated card refinements were implemented across the landing:

- stricter vertical alignment
- stronger hierarchy between top and bottom rows
- consistent footer/readout cell heights
- brighter, slimmer, more modern hover-border behavior
- removal of overflow issues such as `Observational Path` clipping

## 8. Deployment And Push Problem: What Was Actually Wrong

### 8.1 Symptom

The recurring symptom was:

- commit and push appear successful
- Vercel build appears successful
- app domain still shows the old landing theme

### 8.2 Not The Cause

This was not primarily:

- a broken custom domain
- random Vercel deployment failure
- simple browser cache alone

### 8.3 Actual Root Cause

The real problem was a combination of:

#### A. Branch / promotion drift

- preview deploys were being confused with production deploys
- the landing redesign lived on non-production branches before being fully and coherently applied to `main`
- local working branches and remote `main` were not guaranteed to match

#### B. Split landing theme ownership

Landing theme behavior was spread across:

- `src/middleware.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`

That made partial promotions dangerous.

#### C. Duplicate landing theme blocks in `globals.css`

Multiple `.theme-landing` regions existed inside `src/app/globals.css`:

- an early landing token block
- a large dark marketing landing block
- a later duplicate landing override block

That meant a deploy could simultaneously:

- force `marketing-dark` at the layout/middleware level
- but still serve older or conflicting landing CSS

#### D. Unused dedicated landing stylesheet

A dedicated file existed locally:

- `src/app/landing-theme.css`

but it was not imported into `src/app/layout.tsx`, so production did not actually use it.

## 9. Deployment Fix Timeline

### 9.1 Initial landing redesign branch

- Branch: `codex/landing-dark-workbench-pass`
- Commit: `ffb3507`

This contained the landing redesign, but production still depended on what actually reached `origin/main`.

### 9.2 Intermediate production attempts

Two earlier production fixes were pushed:

- `ac18f9b`
- `2712853`

Those moved production toward the dark system, but the theme architecture remained fragile because `globals.css` still contained duplicated landing logic.

### 9.3 Final production-safe hardening fix

Final production fix now on `origin/main`:

- `0f1c72e` `fix(landing): isolate marketing theme source of truth`

This commit:

- imports `src/app/landing-theme.css` in `src/app/layout.tsx`
- removes duplicated landing theme blocks from `src/app/globals.css`
- leaves the landing theme with one dedicated source of truth

## 10. Final Hardening Implementation

Files changed in the final production hardening commit:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/landing-theme.css`

Resulting architecture:

- route scope selects `marketing-dark`
- layout imports the dedicated landing theme file
- landing theme tokens and overrides live in one stylesheet
- `globals.css` no longer secretly redefines landing theme state

## 11. Verification Evidence

Local hardening verification:

- compile gate passed in a clean release worktree using the existing installed TypeScript toolchain

Production branch verification after push:

- `origin/main` includes `import "./landing-theme.css";` in `src/app/layout.tsx`
- `origin/main` no longer shows `.theme-landing` override blocks in `src/app/globals.css`

## 12. How To Avoid This Problem In The Future

### 12.1 Always release from a clean worktree

Recommended pattern:

1. create a clean worktree from `origin/main`
2. apply only the intended production patch
3. verify there
4. push that clean result to `main`

This prevents unrelated local branch drift from leaking into production.

### 12.2 Keep landing theme logic in one file

Do not reintroduce duplicated `.theme-landing` blocks into `globals.css`.

Landing theme should stay isolated in:

- `src/app/landing-theme.css`

### 12.3 Distinguish preview deploys from production deploys

A green PR preview is not the same thing as a production update on the app domain.

Only `origin/main` controls the production site.

### 12.4 Verify remote `main` directly before expecting the domain to change

Recommended checks:

```bash
git show origin/main:src/app/layout.tsx
git show origin/main:src/app/globals.css | rg 'theme-landing|marketing-light|marketing-dark'
git show origin/main:src/app/landing-theme.css
```

### 12.5 Keep production patches narrow

If the fix is specifically landing-related:

- do not promote unrelated `globals.css` or shell changes together
- use a minimal three-file patch when possible

## 13. Current Production State

As of this summary, production `main` contains the hardening patch:

- `0f1c72e`

That is the commit that should govern the app-domain rebuild for the corrected landing theme behavior.

## 14. Remaining Non-Landing Repo Notes

These are not the root cause of the landing theme issue, but remain true in the repo handoff:

- multiple audit files contain `HUMAN FOLLOW-UP REQUIRED`
- many migration files remain recorded as pending in the broader repo state

Those are separate operational follow-ups outside the landing deployment fix.

