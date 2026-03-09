# MASA-on-Main Recovery Implementation Plan

## Mission
Port the MASA chat shell styling onto current `origin/main` without regressing the modern landing page or authenticated app routes.

## Baseline decision
- Functional baseline: current `origin/main`
- Visual references only:
  - `design-system/MASA_Prototype.html`
  - `masa_agent_prompt.md.resolved`
- Explicitly rejected baseline: `269ef40`

## Architecture choice
- Keep current route structure and feature entrypoints
- Keep current `ThemeProvider` and Next.js app structure
- Apply MASA shell styling by editing the current shell/components and token CSS
- Allow TSX changes where current markup diverges from the prototype

## Files in scope
- `src/app/generated-tokens.css`
- `src/app/globals.css`
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/workbench/WorkbenchShell.tsx`
- `src/components/causal-chat/ChatWorkbenchV2.tsx`
- `src/components/causal-chat/ChatComposerV2.tsx`
- `src/components/causal-chat/ProtocolCard.tsx`
- `src/components/causal-chat/ScientificEvidenceList.tsx`
- `src/components/workbench/CausalGauges.tsx`

## Additional hard-gate fixes required on this baseline
- Remove eager module-scope Supabase service construction that breaks `next build`
- Restore legal route deterministic fallback for mocked/empty `analyzeMultiple()` results
- Fix deterministic source scoring drift caused by millisecond `Date.now()` usage
- Fix strict TypeScript test typing in `chat-verified` route tests

## Acceptance criteria mapping
- `/` remains the existing multi-section landing page
- `/chat` uses MASA sidebar/main/rail styling on current main architecture
- `/hybrid`, `/legal`, `/education`, `/lab` remain reachable
- `pnpm -s build` passes
- `./node_modules/.bin/tsc --noEmit` passes
- `./node_modules/.bin/vitest run` passes
- Manual runtime verification remains required for `/chat` in preview/prod

## Risks and controls
- Risk: old prototype styles overriding current app semantics
  - Control: port only visual shell patterns, not old route/layout structure
- Risk: build breaks from env-dependent services in route import graphs
  - Control: remove module-scope singleton exports for server services
- Risk: source-of-truth drift repeats
  - Control: document prototype as visual reference only, not branch baseline

## HUMAN FOLLOW-UP REQUIRED
- Confirm deployment branch is the clean main-based recovery branch, not the old stacked branch chain
- Verify preview/prod `/chat` manually after deploy in both dark and light mode
- Confirm environment parity for Supabase and any external AI/search keys in the intended deployment target
