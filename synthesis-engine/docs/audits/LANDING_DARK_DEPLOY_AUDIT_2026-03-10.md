# Landing Dark Mode Deployment Audit (March 10, 2026)

## Scope
- Validate whether the dark landing redesign was actually implemented in code.
- Validate what `wuweism.com` is serving in production.
- Identify why production still shows the light theme.

## Executive result
- The redesign **is implemented** on `hotfix/sidebar-toggle-v2`.
- Production `wuweism.com` is still serving a `main` deployment with `marketing-light`.
- Root cause is deployment promotion/branch targeting, not missing implementation.

## Evidence

### 1) Branch contains the redesign commits
- Branch: `hotfix/sidebar-toggle-v2`
- Head commits:
  - `56f55a7 feat(chat): force dark workbench theme`
  - `0ebf70b feat(marketing): replace light-locked landing theme with dark redesign`
- Diff vs `origin/main` shows large landing/theme changes:
  - `src/app/globals.css` `+1011`
  - `src/components/landing/Hero.tsx` `+131/-...`
  - `src/middleware.ts` dark scope routing changes

### 2) Code on branch is dark-scope aware
- Middleware sets forced scopes:
  - [`src/middleware.ts`](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/middleware.ts):9-13 sets:
    - `/` and `/how-it-works` -> `marketing-dark`
    - `/chat` -> `chat-dark`
- Layout enforces dark theme from `x-theme-scope`:
  - [`src/app/layout.tsx`](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/layout.tsx):34-56
- Landing root uses dark shell class:
  - [`src/app/page.tsx`](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/page.tsx):18 has `marketing-shell`
- Hero copy/layout is the redesigned dark version:
  - [`src/components/landing/Hero.tsx`](/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/landing/Hero.tsx):24-39 has `Causal architect for` + `Enter the instrument`

### 3) Production HTML proves old light scope is still live
- Live fetch from `https://wuweism.com` shows:
  - `data-theme-scope="marketing-light"`
  - `forcedTheme":"light"` in hydration script payload
  - old light hero structure/copy path
- This matches your screenshot and confirms production is not on the new dark branch.

### 4) Vercel production alias still maps to main
- `vercel inspect wuweism.com --format=json` shows alias:
  - `crucible-git-main-zug4711s-projects.vercel.app`
- Production deployment id observed:
  - `dpl_CKniFBES7SAsAcw6PddTrmKpq57z`
- Therefore `wuweism.com` is currently serving `main`.

### 5) Preview deployments for the new branches exist
- `vercel inspect` confirms preview aliases are ready:
  - `crucible-git-hotfix-sidebar-toggle-v2-zug4711s-projects.vercel.app`
  - `crucible-git-codex-dark-marketing-redesign-zug4711s-projects.vercel.app`
- Local shell could not render those preview aliases directly due network interception redirect to `blocked.sbmd.cicc.gov.ph`, but Vercel metadata reports both as `Ready`.

### 6) PR status blocks one direct merge path
- Open PR #13 (`codex/dark-marketing-redesign` -> `main`) currently reports `mergeStateStatus: DIRTY`.
- No open PR from `hotfix/sidebar-toggle-v2` to `main` was found in current open PR list.

## Root cause
- **Primary:** Production alias promotion is still pointed at `main`.
- **Secondary:** The dark redesign branch has not been promoted/merged into the branch currently deployed to production.

## What to do next (human action)
1. Merge a clean branch containing `0ebf70b` + `56f55a7` into `main` (or promote that branch directly, if your release policy allows it).
2. Trigger a production deployment from the merged branch.
3. Re-verify live HTML for:
   - `data-theme-scope="marketing-dark"` on `/`
   - dark hero copy/classes from current branch code.

## Useful skills for this workflow
Identified via `skill-installer` curated listing:
- `vercel-deploy` (most relevant for branch-to-production promotion checks)
- `gh-fix-ci` (useful when PR mergeability/status blocks deployment)
- `playwright` and `screenshot` (post-deploy visual verification of landing/chat)

