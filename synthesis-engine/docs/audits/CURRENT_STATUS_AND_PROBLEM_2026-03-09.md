# Current Status And Problem Summary — 2026-03-09

## Summary
The current issue is not just "the design changes did not merge." Two separate problems exist:

1. Design provenance drift happened during implementation.
2. Deployment/runtime parity is still not proven.

The codebase did receive multiple UI changes, but some of those changes followed a reinterpretation of the intended MASA shell rather than a strict port of the prototype. A later reset was implemented to move the shell back toward the prototype contract. That reset is now on both the stacked branch and the clean `main`-based branch.

The remaining problem is operational: the production result the user is seeing still does not match the intended target, which means the live environment is either not deploying the expected branch/commit, is serving cached/stale assets, or is rendering additional route-specific chrome that is not part of the prototype target.

## Current Branch / PR State

### Local working branch
- Branch: `codex/style-dictionary-token-sync-20260309`
- Head: `51b727c3b2b4095ddd370a42d9a3df4df39f2143`

### Clean deploy branch
- Branch: `codex/chat-shell-main-20260309`
- Head: `637ee815a20fa05969c4c799266d249586c29e9c`

### Active PRs
- PR `#8`
  - Title: `feat(ui): merge chat shell redesign stack onto main`
  - Base: `main`
  - Head: `codex/chat-shell-main-20260309`
  - URL: <https://github.com/Lesz-Xi/crucible/pull/8>
- PR `#7`
  - Title: `feat(tokens): generate runtime css vars from design tokens`
  - Base: `codex/screenshot-first-chat-shell-20260309`
  - Head: `codex/style-dictionary-token-sync-20260309`
  - URL: <https://github.com/Lesz-Xi/crucible/pull/7>

## What Is Implemented Right Now

### 1. Token pipeline exists
Implemented in:
- [style-dictionary.config.js](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/style-dictionary.config.js)
- [generated-tokens.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/generated-tokens.css)
- [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css)
- [theme-provider.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/theme-provider.tsx)

Status:
- working locally
- deploy-safe fallback added when `design-system/tokens.json` is absent in isolated deploys

### 2. Build-time Supabase failure was fixed
Implemented in:
- [axiom-compression-service.ts](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/axiom-compression-service.ts)

Status:
- local build no longer crashes during import-time Supabase init

### 3. Chat shell was reset back toward the MASA prototype contract
Most recent reset implemented in:
- [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css)
- [AppDashboardShell.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx)
- [ChatWorkbenchV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx)

Most recent reset commit:
- `51b727c` on stacked branch
- `637ee81` on clean `main`-based branch

## What The Real Design Target Is
The actual visual source of truth is:
- [MASA_Prototype.html](/Users/lesz/Documents/Synthetic-Mind/design-system/MASA_Prototype.html)

Key facts from the prototype:
- shell widths:
  - `--sidebar-w: 224px`
  - `--rail-w: 296px`
  - `--topbar-h: 42px`
- serif single-line brand: `Bio-Lab Notebook`
- open chat workbench canvas, not a framed stage container
- flatter protocol cards
- flatter evidence rail treatment
- lighter, flatter composer treatment

## What Went Wrong During Implementation
### Problem 1: Source-of-truth drift
A reinterpretation layer was implemented instead of a strict prototype port.

Evidence in code:
- prior shell contract in [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css) used:
  - `--sidebar-w-desktop: 320px`
  - `--rail-w-desktop: 408px`
- [AppDashboardShell.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx) had been changed to a stacked mono brand (`BIO-LAB / NOTEBOOK`) with a `Menu` icon
- [ChatWorkbenchV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx) had introduced `.chat-stage-shell` / `.chat-stage`
- [WorkbenchEvidenceRail.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchEvidenceRail.tsx) had moved to modular illuminated wrappers (`.rail-module`)

That was a coherent redesign, but it was not the prototype.

### Problem 2: Layered CSS authority
The shell has gone through several design passes in the same file:
- screenshot-first shell pass
- cinematic MASA reinterpretation
- later prototype-faithful reset

Main file affected:
- [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css)

This means the app has multiple generations of shell styling in one file, and correctness depends on which override block wins.

### Problem 3: Branch parity drift
The working branch and the clean deploy branch diverged during the redesign.

Relevant branches:
- `codex/style-dictionary-token-sync-20260309`
- `codex/chat-shell-main-20260309`

This was corrected by replaying the prototype reset onto the clean deploy branch, but production parity is still not proven until the deployment target is confirmed.

## What Was Just Reset
The latest reset explicitly corrected these mismatches:

### Sidebar
Current intended implementation now points back to prototype behavior in:
- [AppDashboardShell.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx)

Reset changes:
- restored flask icon
- restored single-line serif wordmark
- removed stacked mono branding

### Chat empty state
Current intended implementation now points back to prototype behavior in:
- [ChatWorkbenchV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx)

Reset changes:
- removed the extra stage wrapper as the dominant composition device
- restored open-canvas empty state structure
- switched protocol icon choices to better match the prototype family

### Shell contract and surface styling
Current intended implementation now points back to prototype behavior in:
- [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css)

Reset changes:
- narrowed shell to prototype-like widths
- restored flatter shell treatment
- flattened cards, rail modules, and composer
- restored prototype-like header heights and corner radii

## Current Problem We Still Have
The user still reports that the live app looks wrong.

Given the code state, the remaining likely causes are:

### 1. Production is not rendering the expected branch/commit
Most likely deploy candidate should now be:
- PR `#8` / branch `codex/chat-shell-main-20260309`

If production is still building from an older branch or older `main`, the UI will stay wrong regardless of local fixes.

### 2. Production is serving stale built assets or cached CSS
Because the shell styling is heavily CSS-driven and [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css) has carried multiple late override blocks, stale assets could leave the browser or deployment serving an older surface contract.

### 3. Route-specific UI may still be injecting non-prototype chrome
The screenshot included a right-rail CTA (`Start controlled intervention`) that is not part of the MASA prototype shell.

That indicates some route-specific or feature-specific UI may still be rendering additional chrome beyond the shell files that were being compared to the prototype.

Files already checked:
- [ChatWorkbenchV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx)
- [WorkbenchEvidenceRail.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchEvidenceRail.tsx)

But the production page still needs a route-level runtime audit to confirm what additional UI is being mounted into the rail.

## Local Verification Evidence
These checks passed locally after the latest prototype reset:
- targeted `eslint` on changed shell/chat files
- `pnpm -s build`
- `pnpm -s tsc --noEmit`

This means the problem is no longer a local compile/build failure.

## Files That Matter Most
### Design source of truth
- [MASA_Prototype.html](/Users/lesz/Documents/Synthetic-Mind/design-system/MASA_Prototype.html)

### Shell and styling
- [globals.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css)
- [AppDashboardShell.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx)
- [WorkbenchShell.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchShell.tsx)
- [WorkbenchEvidenceRail.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchEvidenceRail.tsx)

### Chat surface
- [ChatWorkbenchV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx)
- [ChatComposerV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatComposerV2.tsx)

### Deployment-relevant support
- [style-dictionary.config.js](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/style-dictionary.config.js)
- [generated-tokens.css](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/generated-tokens.css)
- [theme-provider.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/theme-provider.tsx)
- [axiom-compression-service.ts](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/axiom-compression-service.ts)

## Bottom Line
The current status is:
- local code has been reset toward the actual MASA prototype
- both the stacked branch and the clean deploy branch carry that reset
- local build and typecheck pass

The current problem is:
- production still does not visually match the target, which means the remaining fault is now operational or runtime-specific, not just local implementation

## Next Recommended Action
1. Merge or deploy from PR `#8`
2. Confirm the exact production commit SHA serving `/chat`
3. Inspect the live `/chat` DOM/CSS bundle to confirm whether it is serving:
   - the new prototype-faithful `globals.css` block
   - the updated [AppDashboardShell.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx) brand/header
   - the updated [ChatWorkbenchV2.tsx](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx) empty-state structure
4. Audit the live right rail for route-level extras such as `Start controlled intervention`

## Human Follow-Up Required
- Verify what branch and commit the hosting platform is actually deploying
- Force a clean rebuild/redeploy if asset caching is involved
- Confirm whether any route-specific feature is injecting prototype-incompatible rail actions in production
