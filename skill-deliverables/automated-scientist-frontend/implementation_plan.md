# Automated Scientist Frontend Skill Implementation Plan

## Mission

Create a reusable frontend skill that converts the audited `High-Density-Frontend-Skills` prompt and image set into a product-specific design workflow for the Automated Scientist app.

## Architecture choice

- Create a standalone skill at `skills/automated-scientist-frontend`.
- Keep the skill lean: `SKILL.md`, `agents/openai.yaml`, `references/`, and `assets/`.
- Store delivery artifacts outside the skill folder to avoid polluting the skill itself with extra operational documents.

## Acceptance criteria

1. The skill triggers clearly for frontend work on the Automated Scientist app.
2. The skill teaches transformation into MASA design language rather than raw component copy-paste.
3. The audited image set is preserved as reusable exemplar assets.
4. The reference docs cover app context, visual system, surface recipes, component mapping, and prompt/dependency audit.
5. Validation evidence is recorded.

## Files changed

- `skills/automated-scientist-frontend/SKILL.md`
- `skills/automated-scientist-frontend/agents/openai.yaml`
- `skills/automated-scientist-frontend/references/app-context.md`
- `skills/automated-scientist-frontend/references/visual-system.md`
- `skills/automated-scientist-frontend/references/surface-recipes.md`
- `skills/automated-scientist-frontend/references/component-atlas.md`
- `skills/automated-scientist-frontend/references/prompt-audit.md`
- `skills/automated-scientist-frontend/assets/exemplars/*`
- `skill-deliverables/automated-scientist-frontend/walkthrough.md`
- `skill-deliverables/automated-scientist-frontend/docs/audits/PHASE_1_SIGNOFF.md`
- `skill-deliverables/automated-scientist-frontend/docs/audits/PHASE_4_VERIFICATION_SIGNOFF.md`
- `skill-deliverables/automated-scientist-frontend/docs/audits/PHASE_5_SIGNOFF.md`

## Automated evidence planned

- Run the bundled skill validator.
- If the validator is blocked by local environment issues, capture the failure and run an equivalent manual frontmatter/name validation.
- Record resulting evidence in the verification signoff.

## Manual verification steps

1. Read `SKILL.md` and confirm there are no scaffold TODOs.
2. Confirm all reference docs match the audited folder and the current app shell patterns.
3. Confirm exemplar images exist under `assets/exemplars/`.
4. Invoke the skill on a future frontend task to verify the workflow reads clearly.

## Unresolved gaps

- The bundled `quick_validate.py` depends on `PyYAML`, which is not installed in the current local `python3` environment.
