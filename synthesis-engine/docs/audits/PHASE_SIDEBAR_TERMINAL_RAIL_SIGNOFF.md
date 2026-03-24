# PHASE SIDEBAR TERMINAL RAIL SIGNOFF

## Scope
- Redesign the authenticated workbench sidebar into a high-density terminal-scientist rail.
- Refine the rail hierarchy, header copy, `Systems` readability, and `Model Settings` theming.

## Files changed
- `src/components/dashboard/AppDashboardShell.tsx`
- `src/components/dashboard/SidebarModelSettings.tsx`
- `src/app/globals.css`
- `implementation_plan.md`
- `walkthrough.md`

## Acceptance criteria mapping
- Compact operator commands replace oversized circular creation controls.
- Primary navigation reads as mode switching with clearer hierarchy and metadata.
- Session history reads as a ledger with title, recency, and domain cues.
- Header no longer includes the extra workbench descriptor.
- `Systems` rows remain readable at default desktop width.
- `Model Settings` trigger and popover now match sidebar theming in light and dark mode.
- Footer utilities are quieter and the account block is more controlled.
- Existing shell architecture and mobile drawer behavior remain intact.

## Automated evidence
- `npx tsc --noEmit` passed
- `npx vitest run` passed: `338 passed | 1 skipped`
- `npm run build` passed

## Manual verification
1. Open `/chat` on desktop and verify the sidebar density, hover states, and active thread selection.
2. Verify the header only shows the `Automated Scientist` brand without the extra workbench descriptor.
3. Confirm the `Systems` section, especially `Instruments`, is fully readable at default width.
4. Open `Model Settings` and confirm the trigger and popover match the rail in light and dark mode.
5. Collapse the sidebar and confirm icon-only navigation remains usable.
6. Open the mobile navigation drawer and verify compact spacing and scroll behavior.

## HUMAN FOLLOW-UP REQUIRED
1. Perform the manual `/chat` desktop verification steps above.
2. Perform the manual `/chat` mobile verification steps above.
3. Validate the preview deployment before final promotion.

## Signoff status
- Automated gates: passed
- Manual runtime verification: pending human follow-up
- Overall status: in progress until manual runtime verification is completed
