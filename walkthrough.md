# MASA-on-Main Recovery Walkthrough

## What changed
1. Rebased the design work onto current `origin/main` in a clean worktree instead of the historical `269ef40` prototype branch.
2. Replaced the old shell drift with MASA-aligned geometry and surface styling in the current app shell.
3. Preserved landing-page and authenticated-route structure from modern `main`.
4. Removed two eager server-service singletons that caused build-time route evaluation to crash without runtime credentials.
5. Restored legal-route fallback behavior so tests and deterministic gate logic match expected output classes.
6. Fixed a determinism bug in source recency scoring by switching from millisecond drift to UTC day granularity.

## Exact files changed
- `src/app/generated-tokens.css`
- `src/app/globals.css`
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/workbench/WorkbenchShell.tsx`
- `src/components/causal-chat/ChatWorkbenchV2.tsx`
- `src/components/causal-chat/ChatComposerV2.tsx`
- `src/components/causal-chat/ProtocolCard.tsx`
- `src/components/causal-chat/ScientificEvidenceList.tsx`
- `src/components/workbench/CausalGauges.tsx`
- `src/lib/services/axiom-compression-service.ts`
- `src/lib/services/session-service.ts`
- `src/app/api/legal-reasoning/route.ts`
- `src/app/api/bridge/chat-verified/__tests__/route.test.ts`
- `src/lib/services/source-scoring-service.ts`

## Why these changes were necessary
- `269ef40` is an old prototype lineage that collapses the landing page and predates modern app routes.
- Current `main` is the only safe functional baseline.
- The current `main` baseline also contained unrelated hard-gate issues that blocked build/test verification. Those had to be fixed to reach production-complete status.

## Automated verification evidence
- `./node_modules/.bin/eslint ...touched files...` passed with no errors or warnings
- `./node_modules/.bin/next build` passed
- `./node_modules/.bin/tsc --noEmit` passed
- `./node_modules/.bin/vitest run` passed: `51 passed`, `337 passed | 1 skipped`

## Manual verification still required
- Open `/` and confirm the landing page remains the full multi-section marketing page
- Open `/chat` and verify the MASA sidebar/main/rail styling in dark mode
- Toggle theme and verify `/chat` light mode parity
- Confirm `/hybrid`, `/legal`, `/education`, and `/lab` remain reachable
- Verify the intended deployment target is using this clean main-based branch, not the old rollback branch or a stacked review branch

## HUMAN FOLLOW-UP REQUIRED
1. Merge/deploy the clean main-based recovery branch only
2. Verify preview/prod environment variables point to the intended Supabase project
3. Perform preview/prod runtime smoke test on `/`, `/chat`, `/hybrid`, `/legal`, `/education`, `/lab`
