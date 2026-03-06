# App Feature Theme Redesign Implementation Plan

## Objective
Apply a unified paper-first light/dark theme system across all app-feature surfaces without changing route contracts, APIs, or behavioral flows.

## Scope
- Chat
- Hybrid
- Labs
- Legal
- Educational
- Epistemic
- Shared workbench shell primitives

## Files Changed
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/chat/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/hybrid/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/legal/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/education/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/epistemic/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/lab/layout.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/lab/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/ThemeToggle.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatInput.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatLayout.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/causal-chat/ChatWorkbenchV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/AppDashboardShell.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/dashboard/SidebarModelSettings.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/legal/LegalAnalysisPanelV2.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/components/lab/LabSidebar.tsx`

## Token System
### Light Mode
- Main app canvas: `#f7f6f2`
- Sidebar shell: `#f3f1eb`
- Primary cards: `#ffffff`
- Soft inset panels: `#fbfaf7`
- Accent rust: `#b97f54`
- Accent moss: `#6f8271`
- Accent slate: `#6a7896`

### Dark Mode
- Background: `#11161b`
- Elevated shell: `#181d23`
- Panel: `#1d232a`
- Soft panel: `#232a31`
- Sidebar: `#161b21`
- Accent rust: `#c38f62`
- Accent moss: `#8f9b86`
- Accent slate: `#93a0bb`

## Implementation Strategy
1. Replace legacy translucent/glass route wrappers with semantic lab surfaces.
2. Centralize app-shell behavior in `globals.css` via `--lab-*` tokens and shared utility overrides.
3. Normalize sidebar, composer, panel, and popover surfaces to the new paper/obsidian-paper model.
4. Keep landing tokens separate from app tokens.
5. Preserve all functional controls and route behavior.

## Acceptance Criteria Mapping
- Sidebar uses `#f3f1eb` in light mode: implemented via `--lab-shell-sidebar` and `.glass-sidebar`.
- Main canvas uses `#f7f6f2`: implemented via `--lab-bg` and route wrappers.
- Main cards are white: implemented via `--lab-panel` and `.lab-card` / `.lab-panel`.
- Dark mode is aligned, not neon: implemented via obsidian-paper token set and shared overrides.
- No API or schema changes: preserved.
- Landing page keeps separate palette: preserved.

## Verification Targets
- `npx tsc --noEmit`
- `npm run build`
- Local runtime smoke for `/chat`, `/hybrid`, `/lab`, `/legal`, `/education`, `/epistemic`

## Known Non-Theme Issues
- `npx vitest run` currently fails in pre-existing suites unrelated to this theme work:
  - `src/lib/services/__tests__/benchmark-governance.test.ts`
  - `src/app/api/legal-reasoning/__tests__/route.test.ts`
