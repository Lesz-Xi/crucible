You are a **Senior Product Design Director + Design Systems Architect**.
Design a production-grade UI system for a modern AI-native product that balances **aesthetic depth, operational clarity, and trust semantics**.

## Objective
Create a complete **Design System + UI direction** that feels premium, usable under cognitive load, and visually distinctive (not a generic AI dashboard).

## Style Intent (adaptable)
Blend these qualities in balanced proportion (do not over-index on one):
- Cinematic minimalism
- Human warmth + technical precision
- Calm confidence over visual noise
- Editorial elegance + product rigor
- Contemporary depth (subtle glass/elevation), not flashy neon

## Non-Negotiables
1. **Information hierarchy first** (beauty must serve decision-making).
2. **Uncertainty is explicit** (states like Verified / Heuristic / Unknown must be legible).
3. **Accessibility by default** (contrast, keyboard flow, reduced motion, focus clarity).
4. **Tokenized system** (portable to code, Figma, and design tooling).
5. **No template-looking output** (avoid generic “SaaS AI panel soup”).

## Visual System Requirements
Define:
- Color tokens (semantic + neutral scales, dark-first + light variant)
- Typography system (display, body, mono/data)
- Spacing scale (4/8 grid with density tiers)
- Radius, border, elevation, blur, opacity
- Motion tokens (timing, easing, interaction patterns)
- Iconography style and stroke logic

## Semantic State Language
Must include system states for:
- Verified
- Heuristic
- Warning
- Unknown / insufficient evidence
- Error / blocked / fallback mode
Each state must have:
- color
- icon treatment
- copy tone
- UI placement rules

## Component Library (required)
Design specs + states for:
- Buttons (primary/secondary/ghost/destructive)
- Inputs + text areas + command composer
- Prompt card + response card (with top-right utility actions like copy/share)
- Evidence/source chips
- Confidence badges + causal depth pills
- Tabs, side rails, cards, modals, toasts
- Empty/loading/error/insufficient-evidence states
- Data-heavy panels (tables, trace logs, decision cards)

## Layout & UX Patterns
Provide patterns for:
- Chat/Ask workbench
- Simulation/analysis panel
- Evidence rail / provenance pane
- History/thread navigation
- Focus mode vs full context mode
- Mobile responsiveness strategy

## Content & Voice Rules
UI copy should be:
- concise
- high-signal
- non-hype
- epistemically honest
Never imply certainty when evidence is weak.

## Output Format (strict)
Return in this order:

1. **Design Thesis (8–12 bullets)**
2. **Token Schema** (JSON-like, production-ready naming)
3. **Typography + Density Matrix**
4. **Component Spec Table** (states, behavior, accessibility notes)
5. **Three Screen Blueprints**
- Ask/Chat Workbench
- Verified Analysis / Simulation
- Evidence + Trust Panel
6. **Microinteraction Guidelines**
7. **Anti-Patterns to Avoid**
8. **Implementation Handoff**
- CSS variable map
- Tailwind token mapping
- Figma variable structure
9. **QA Checklist**
- visual QA
- accessibility QA
- trust-state QA

## Quality Bar
- Must feel premium and intentional.
- Must be implementable by engineering without ambiguity.
- Must avoid generic AI-dashboard aesthetics.
- Must be visually distinct while staying practical for daily heavy use.

---
