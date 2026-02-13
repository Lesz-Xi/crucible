Yes. Use a strict “route provenance” workflow.

1. **Route Registry**
- Keep a single file: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/route-registry.md`
- For each route, track: owner, status (`active|deprecated|experimental`), first commit, last verified date.

2. **Branch Protection Rule**
- Never work directly on long-lived branches.
- Every feature on `codex/<feature-name>`.
- Merge only via PR with checks.

3. **PR Checklist (mandatory)**
- “Added/removed routes?” if yes, update route registry.
- “Migration added?” if yes, add `USER ACTION REQUIRED`.
- “Breaking route rename?” if yes, add redirect/compat note.

4. **Pre-merge Route Diff Check**
- Run before merge:
```bash
git diff --name-status origin/main...HEAD | grep -E '^([ADMR]|R[0-9]+)\s+src/app/.+/page\.tsx$'
```
- If output non-empty, require explicit reviewer signoff.

5. **Nightly Route Snapshot**
- Save current route tree to artifact:
```bash
find src/app -name "page.tsx" | sort > artifacts/routes-$(date +%F).txt
```
- Diff against previous snapshot and alert on unexpected deletions.

6. **Unreachable Commit Guard**
- Weekly maintenance:
```bash
git fsck --full
git log --all --name-only --pretty=format: | grep '^src/app/.*/page\.tsx$' | sort -u
```
- Detect orphaned work before GC/prune.

7. **Tag Milestones**
- Tag stable architecture points:
```bash
git tag -a routes-stable-2026-02-07 -m "stable route map"
git push --tags
```
- Makes recovery deterministic.

8. **Local Safety Habit**
- Before branch switch/rebase:
```bash
git stash push -u -m "wip-route-safety"
```
- Prevents route files becoming dangling objects.

9. **CI Guardrail**
- Add CI job: fail if route removed without registry update.
- Simple rule: if `src/app/**/page.tsx` changed, require `docs/route-registry.md` changed.

10. **Monorepo Clarity**
- Keep one source of truth for app runtime (`synthesis-engine`).
- Mark other repos (`crucible`) as mirror/legacy in README to avoid ambiguity.

If you want, I can draft the exact `route-registry.md` template and CI rule (no code changes yet).