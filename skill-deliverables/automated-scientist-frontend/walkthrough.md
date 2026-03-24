# Walkthrough

## What was built

A new reusable skill was added at `skills/automated-scientist-frontend`. It is designed to help Codex build or refactor high-density frontend surfaces for the Automated Scientist app without regressing into generic SaaS UI or literal component-library copy-paste.

## Why this structure

- `SKILL.md` carries the operating workflow and trigger language.
- `references/app-context.md` grounds every change in the existing product shell and trust model.
- `references/visual-system.md` captures the app's mineral, glass, serif-plus-mono visual identity.
- `references/surface-recipes.md` explains how to compose workbench, landing, auth, and lab surfaces.
- `references/component-atlas.md` maps the audited inspiration set to real product use.
- `references/prompt-audit.md` explains what to preserve and what to override from the raw prompts.
- `assets/exemplars/` stores the audited preview images for future visual reference.

## Key design decision

The skill does not tell Codex to "install and paste" the source components. It tells Codex to treat them as inspiration, then rebuild them inside the Automated Scientist shell, token system, terminology, and trust-first interaction model.

## Acceptance criteria mapping

- Trigger clarity: satisfied by the `description` in `SKILL.md`.
- Tailoring to app: satisfied by `app-context.md`, `visual-system.md`, and `surface-recipes.md`.
- Thorough audit capture: satisfied by `component-atlas.md`, `prompt-audit.md`, and the copied exemplar images.
- Reusability: satisfied by the self-contained skill folder and generated `agents/openai.yaml`.

## Automated evidence

- Official validator attempted: failed because `python3` lacks the `yaml` module required by `quick_validate.py`.
- Manual fallback validator passed for frontmatter presence, key set, name format, and description length.

## Manual verification steps

1. Open `skills/automated-scientist-frontend/SKILL.md`.
2. Open the five reference docs and confirm they are specific to the app.
3. Open exemplar images under `skills/automated-scientist-frontend/assets/exemplars/`.
4. Use the skill in a future request such as redesigning a chat composer or workbench rail.

## Remaining note

The only validation gap is environmental: the bundled validator cannot run until `PyYAML` is installed for `python3`.
