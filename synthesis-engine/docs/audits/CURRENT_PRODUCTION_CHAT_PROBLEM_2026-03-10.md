# Current Production Chat Problem Analysis (2026-03-10)

## Summary
The latest MASA chat-shell implementation exists in code, but the live app at `https://www.wuweism.com/chat` is still rendering an older shell.

This is no longer a frontend implementation uncertainty. The current problem is deployment/state parity.

The live screenshot proves production is not serving the latest `main`-based hotfix branch that was prepared to carry the MASA prototype port.

## Current Branch Context
There are two relevant branch lines:

### 1. Feature branch with latest UI work
Local repo: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`
Branch: `codex/style-dictionary-token-sync-20260309`
Current HEAD: `a95e929`

Recent relevant commits:
- `74bb248` `feat(ui): align workbench sidebar to MASA reference`
- `9e2ed0d` `feat(ui): port chat shell to MASA prototype`
- `a95e929` `feat(ui): adopt control-strip sidebar header`

### 2. Clean main-based hotfix branch prepared for deployment
Worktree: `/private/tmp/synthesis-engine-main-hotfix-chat`
Branch: `codex/main-hotfix-masa-chat-20260310`
Current HEAD: `15eff3d`

Relevant commits:
- `2b209fb` `fix(ui): apply MASA chat shell and sidebar parity on main`
- `15eff3d` `fix(build): restore MASA shell support files on main hotfix`

This second branch is the one intended to be merged/deployed because it is based directly on `main`.

## What The Live Screenshot Proves
The current live screenshot still shows the older shell state. Specifically:

### Sidebar header is still old
Live screenshot shows:
- flask icon
- `Bio-Lab Notebook`
- search icon
- plus icon

That means production is still rendering the older `AppDashboardShell.tsx` header model, not the latest control-strip version from:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx`

If the latest sidebar header were deployed, the brand block would be removed and replaced with:
- sidebar toggle/open-close control
- back button
- forward button

### Empty-state title block is still old
Live screenshot shows:
- single-line `Scientific Workbench`
- generic subtitle: `Select a research protocol to begin your inquiry.`

That means production is still rendering the pre-prototype `ChatWorkbenchV2.tsx` content model.

The prototype-faithful version should show:
- eyebrow: `Sovereign Synthesis Engine`
- two-line title: `Scientific` + italic `Workbench`
- longer subtitle: `Select a research protocol to begin your inquiry into the causal structure of the world.`

### Protocol cards are still old
Live screenshot shows:
- literal domain icons (`microscope`, `flask`, `scales` style)
- no `Protocol 01 / 02 / 03` tags
- older card copy

That means production is still not using the prototype-faithful `ProtocolCard.tsx` + `ChatWorkbenchV2.tsx` pair.

The latest implementation should show:
- abstract symbolic icons
- `Protocol 01`, `Protocol 02`, `Protocol 03`
- updated copy and footer arrows matching the prototype

### Composer is still old
Live screenshot shows:
- extra icon-only controls still visible
- old toolbar arrangement
- old placeholder/copy shape

That means production is not using the updated `ChatComposerV2.tsx` from the feature branch / hotfix branch.

### Right rail is absent in the screenshot
The screenshot has no visible right Evidence Rail.
That means production is also not serving the newer shell/layout contract consistently.

The hotfix branch was specifically updated to include the missing shell support files that Vercel previously failed on.

## Root Cause
The implementation itself is not the current blocker.

The current blocker is one of these operational states:

1. `codex/main-hotfix-masa-chat-20260310` has not been merged into `main`
2. `main` has not been redeployed after merge
3. Vercel production is deploying the wrong branch/project
4. A stale deployment/cached build is still serving the old shell

The live screenshot is structurally incompatible with the latest prepared branch. This is why the issue should now be treated as deployment parity, not further UI coding.

## Additional Deployment Context
A Vercel build error did occur earlier on the clean `main` hotfix branch.
The error was:
- missing `@/lib/workbench/model-provenance-display`
- missing `./AppShellChromeContext`

That issue was fixed on the clean hotfix branch by adding:
- `/private/tmp/synthesis-engine-main-hotfix-chat/src/components/dashboard/AppShellChromeContext.tsx`
- `/private/tmp/synthesis-engine-main-hotfix-chat/src/lib/workbench/model-provenance-display.ts`
- `/private/tmp/synthesis-engine-main-hotfix-chat/src/types/workbench.ts`
- and the related shell consumers:
  - `/private/tmp/synthesis-engine-main-hotfix-chat/src/components/workbench/WorkbenchShell.tsx`
  - `/private/tmp/synthesis-engine-main-hotfix-chat/src/app/education/page.tsx`
  - `/private/tmp/synthesis-engine-main-hotfix-chat/src/app/lab/layout.tsx`
  - `/private/tmp/synthesis-engine-main-hotfix-chat/src/components/hybrid/HybridWorkbenchV2.tsx`
  - `/private/tmp/synthesis-engine-main-hotfix-chat/src/components/legal/LegalWorkbenchV2.tsx`

That hotfix branch was then verified locally with:
- `npx tsc --noEmit` passing
- `npx vitest run` passing
- `npm run build` passing

So the deployment path was repaired at the branch level.

## Files That Define The Expected Latest Chat Shell
These are the primary files whose latest versions are expected in production if the hotfix branch is actually deployed:

- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatComposerV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ProtocolCard.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchShell.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/workbench/WorkbenchEvidenceRail.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppShellChromeContext.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/workbench/model-provenance-display.ts`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/workbench.ts`

## Why More Frontend Editing Is Not The Right Next Move
The live screenshot is still showing the older shell contract.
That means another round of CSS/TSX edits will not solve the immediate production problem.

Until deployment parity is confirmed, further UI work will only create more branch drift.

## Most Likely Current State
Most likely, production is still serving one of these:
- an older `main` deployment before the hotfix branch was merged
- a preview deployment from another branch
- a different Vercel project/branch target than assumed

## Recommended Next Step
Treat this as a deployment verification incident.

### Required verification checklist
1. Confirm whether PR `#11` was actually merged into `main`
2. Confirm which commit Vercel production is currently building from
3. Confirm the Vercel project for `www.wuweism.com` is pointing at the correct repo and branch
4. Trigger a fresh production redeploy from the verified `main` commit
5. Recheck `https://www.wuweism.com/chat`

## What Success Should Look Like
If the correct branch is deployed, the live `/chat` page should visibly change in these ways:

- sidebar header no longer shows `Bio-Lab Notebook` + search + plus
- title block becomes the prototype version with eyebrow and two-line title
- protocol cards gain `Protocol 01/02/03` tags and updated copy
- composer toolbar loses the extra icon-only controls
- shell contract and evidence rail match the newer MASA prototype port

## Conclusion
The current problem is not that the implementation "did not apply" in code.
The current problem is that the live domain is still not serving the branch/commit containing the latest implementation.

This is now a deployment/source-of-truth problem, not a frontend coding problem.
