# Prompt Audit

## Repeated assumptions in the source prompt set

Every prompt assumes:

- React
- TypeScript
- Tailwind
- shadcn-style structure
- direct component copying into `components/ui`
- installation of whatever dependencies the snippet needs

Those assumptions are a starting point, not a mandate.

## What to keep

- The prompts are useful for identifying dependency bundles and interaction patterns.
- The images are useful for visual proportion, card softness, and grouping.
- The larger blocks show how multiple controls can live inside one coherent surface.

## What to override for this app

- Do not blindly use `components/ui` for route-specific logic.
  - Put feature-specific components in the relevant feature area when they carry domain logic.
- Do not preserve generic placeholder copy.
  - Rewrite it into scientific, evidentiary, or workbench language.
- Do not use stock-style visuals where product data can carry the design.
  - Prefer protocol cards, tables, evidence chips, citations, and tool metadata.
- Do not keep a dependency unless it materially improves the product.
  - Example: `three` and `@react-three/fiber` are acceptable for a special auth or showcase moment, but not for routine workbench panels.

## Complexity tiers from the audit

### Low complexity

- `copy-button`
- `tabs`
- `toggle-theme`

### Medium complexity

- `advanced-ai-chat-input`
- `animated-grid-pattern`
- `animated-hero`
- `animated-state-icons`
- `circle-menu`
- `display-cards`
- `docks`
- `feature-hover-effects`
- `feature-section`
- `features-11`

### High complexity

- `navbar-with-dropdowns`
- `sidebar`
- `sign-in-flow`

## Translation rule

When a source prompt says "copy-paste this component," reinterpret it as:

1. Identify the underlying interaction pattern.
2. Rebuild it inside the Automated Scientist shell and token system.
3. Add trust states, provenance cues, and domain-specific copy.
4. Simplify the dependency stack if the same effect can be achieved with existing app primitives.

## Stop conditions

Pause and rethink the approach if the result:

- looks like a generic SaaS dashboard,
- hides evidence or warnings behind visual polish,
- introduces a large new dependency for a small visual effect,
- or uses the inspiration's structure without the app's trust-first semantics.
