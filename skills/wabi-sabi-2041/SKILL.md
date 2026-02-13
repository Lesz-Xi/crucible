---
name: wabi-sabi-2041
description: Design and build product experiences using Wabi Sabi principles fused with a 2041-forward aesthetic. Use when creating or refactoring app UI, component systems, interaction patterns, brand direction, or UX copy that should feel calm, imperfect, materially authentic, and future-ready without sterile sci-fi tropes.
---

# Wabi Sabi 2041

Build interfaces that balance quiet imperfection with advanced capability.

## Execute This Workflow

1. Define the product moment before touching layout.
2. Map user intent to one core emotional tone from `references/tones.md`.
3. Apply the visual system from `references/design-system-2041.md`.
4. Choose component patterns from `references/component-patterns.md`.
5. Validate output with the quality gate below.

## Enforce Hard Constraints

- Avoid glossy cyberpunk gradients and neon overload.
- Prefer mineral, paper, clay, oxide, and weathered metal cues.
- Keep one intentional asymmetry per screen.
- Use restrained motion: 120-280ms primary transitions.
- Preserve high legibility and WCAG-compliant contrast.
- Favor whitespace and pause over dense UI packing.
- Keep copy sparse, direct, and humane.

## Quality Gate

Ship only if all checks pass:

- The interface feels materially grounded, not generic SaaS.
- The design communicates future capability without visual noise.
- Typography hierarchy is clear on desktop and mobile.
- States exist for loading, empty, and error paths.
- Motion reinforces meaning, not decoration.

## Output Contract

When producing UI proposals or code, return:

1. A one-paragraph concept statement.
2. A compact token table (color, type, spacing, radius, motion).
3. Component-level guidance or implementation code.
4. A short rationale explaining how Wabi Sabi + 2041 is preserved.

