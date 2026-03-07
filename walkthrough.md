# App Feature Theme Redesign Walkthrough

## What Changed
The app layer now uses a single semantic theme system instead of mixing legacy white/gray/glass utilities with newer landing-inspired tokens.

### Light Mode
- Main background reads as fog paper: `#f7f6f2`
- Sidebar reads as warm elevated shell: `#f3f1eb`
- Primary work panels read as white paper cards

### Dark Mode
- Dark mode now uses an obsidian-paper palette rather than pure black or chrome-blue dark UI
- Cards are lifted charcoal-paper surfaces with warm ivory text

## Main Technical Changes
### Global CSS
Added a final override layer in:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/globals.css`

This layer defines:
- semantic lab tokens
- dark-mode obsidian-paper tokens
- compatibility aliases for older lab components
- shared sidebar/card/input/button overrides

### Route Shell Cleanup
Removed old glass shell body classes from:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/chat/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/hybrid/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/legal/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/education/page.tsx`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/app/lab/layout.tsx`

### Shared Surface Cleanup
Normalized:
- composer surface
- lab sidebar
- model settings popover
- legal analysis status/error cards
- lab status and role badges

## Functional Guarantees
This work does not change:
- API routes
- database schema
- auth flow
- chat send/stop flow
- relic menu behavior
- hybrid synthesis flow
- legal submission flow
- theme toggle behavior

## Manual Verification Steps
1. Open `/chat`
2. Confirm:
   - sidebar is warm paper (`#f3f1eb`)
   - main canvas is fog paper (`#f7f6f2`)
   - composer sits on a white panel
3. Open `/hybrid`
4. Confirm workbench cards and rails use the same paper hierarchy
5. Open `/lab`
6. Confirm left instrument rail uses sidebar tone and active state uses rust tint
7. Open `/legal`
8. Confirm intake and analysis surfaces match the shared workbench theme
9. Open `/education`
10. Confirm shell remains readable in both light and dark mode
11. Open `/epistemic`
12. Confirm it no longer feels like a separate product theme

## Test Evidence
- `npx tsc --noEmit`: pass
- `npm run build`: pass
- `npx vitest run`: partial failure in unrelated pre-existing suites

## Next Useful Cleanup
- Replace remaining legacy route-specific dark utility classes in older non-V2 or secondary panels if those paths are still product-relevant.

---

# Walkthrough — Grounding Relevance Hardening (2026-03-07)

## Objective
Eliminate retrieval relevance failures in causal-chat web grounding and prevent false confidence from off-topic sources.

## Implemented Scope
- Phase 1: query/entity hygiene
- Phase 2: post-retrieval topical relevance gate
- Phase 3 (hardening extension): confidence calibration + grounding provenance diagnostics

## Files Changed
- `src/lib/services/chat-fact-trigger.ts`
- `src/lib/services/chat-web-grounding.ts`
- `src/app/api/causal-chat/route.ts`
- `src/lib/services/__tests__/chat-fact-trigger.test.ts`
- `src/lib/services/__tests__/chat-web-grounding.test.ts`

## Behavior Changes
1. Imperative lead token (e.g., `Do`) is no longer treated as a subject entity.
2. Query expansion no longer emits `founder/creator` for all entities.
3. Grounding results now pass a topicality threshold gate.
4. Zero relevant sources emit `web_grounding_failed` with `low_topical_relevance`.
5. Confidence rationale now includes measurable support (`avg_topicality`, domains, sources).
6. New additive SSE event `web_grounding_provenance` reports:
   - generated queries
   - raw candidates
   - accepted count
   - filtered count + reason breakdown
   - threshold used

## Test Evidence
Command:
```bash
npx vitest run src/lib/services/__tests__/chat-fact-trigger.test.ts src/lib/services/__tests__/chat-web-grounding.test.ts
```
Result:
- 2 test files passed
- 6 tests passed

## Runtime Replay Checklist
1. In causal chat, submit:
   - `Do a web search about this statement: Alexander was raised by private tutors`
2. Verify SSE/event log includes `web_grounding_provenance`.
3. Verify `web_grounding_completed` sources are topically relevant to Alexander/tutors OR `web_grounding_failed` with `low_topical_relevance`.
4. Verify confidence is not high on off-topic sources.
5. Submit control query:
   - `Search for information about Hannibal Barca tactics`
6. Confirm same guardrails apply.

## Known Gap
- Global `npx tsc --noEmit` currently fails due to existing workspace type-definition pollution unrelated to this patch.
