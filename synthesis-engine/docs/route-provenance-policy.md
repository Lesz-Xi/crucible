# Route Provenance Policy

**Version:** 1.0.0  
**Effective Date:** 2026-02-07  
**Scope:** `synthesis-engine` repository

---

## Purpose

Prevent route architecture drift, orphaned commits, and undocumented route changes through deterministic tracking and CI enforcement.

---

## 1. Route Registry

**Location:** `docs/route-registry.md`

**Rules:**
- Every route MUST be registered before deployment
- Route status MUST be one of: `active` | `deprecated` | `experimental`
- Route metadata MUST include: owner, first commit, last verified date, purpose

**Enforcement:**
- Pre-merge Route Diff Check (CI)
- Manual PR review

---

## 2. Branch Protection

**Rules:**
- Never work directly on `main` branch
- All route changes via feature branches: `codex/<feature-name>`
- All merges require PR with passing CI checks

**Enforcement:**
- GitHub branch protection rules
- CI status checks

---

## 3. PR Checklist

**For Route Changes (Add/Modify/Delete):**

- [ ] Route registered/updated in `docs/route-registry.md`
- [ ] Route purpose and ownership documented
- [ ] First commit SHA recorded (for new routes)
- [ ] Last verified date updated
- [ ] Migration path provided (for deprecated routes)
- [ ] CI route diff check passed

**Enforcement:**
- PR template (`.github/pull_request_template.md`)
- Human reviewer verification

---

## 4. Pre-merge Route Diff Check

**Trigger:** On pull request to `main`

**Actions:**
1. Detect route additions/deletions/modifications
2. Check if `docs/route-registry.md` was updated
3. Block merge if registry not updated

**Implementation:** `.github/workflows/route-diff-check.yml`

---

## 5. Nightly Route Snapshot

**Trigger:** Cron schedule (every night at 2 AM UTC)

**Actions:**
1. Scan `src/app/` for all routes
2. Generate route snapshot JSON
3. Compare with previous snapshot
4. Alert on undocumented changes
5. Store snapshot in `docs/route-snapshots/<date>.json`

**Implementation:** `.github/workflows/route-snapshot.yml`

---

## 6. Unreachable Commit Guard

**Trigger:** Cron schedule (weekly on Sundays)

**Actions:**
1. Run `git fsck --lost-found` to find dangling commits
2. Inspect dangling commits for route changes
3. Create GitHub issue if orphaned routes found
4. Alert maintainers

**Implementation:** `.github/workflows/unreachable-commit-guard.yml`

---

## 7. Tagging Milestones

**Rules:**
- Tag major route architecture changes with semantic versioning
- Format: `routes-v<major>.<minor>.<patch>`
- Include route snapshot in tag annotation

**Example:**
```bash
git tag -a routes-v1.0.0 -m "Initial route architecture: /, /hybrid, /epistemic, /pdf-synthesis"
```

**Enforcement:**
- Manual process, recommended after major route refactors

---

## 8. Local Safety Habits

**Recommended:**
- Run `git status` before switching branches
- Never use `git stash` for route changes (use feature branches)
- Always commit route work with descriptive messages
- Use `git log --all --oneline --graph` to visualize branch structure

**Optional Git Hooks:**
- `.git/hooks/pre-commit` - Warn if route file changed without registry update
- `.git/hooks/pre-push` - Prevent push if route registry outdated

---

## 9. CI Guardrails

**Required CI Checks:**
- Route Diff Check ✓
- Route Snapshot (nightly) ✓
- Unreachable Commit Guard (weekly) ✓

**Optional CI Checks:**
- Route performance benchmarks
- Route accessibility audits
- Route SEO validation

---

## 10. Monorepo Clarity

**Source of Truth:** `synthesis-engine` repository

**Other Repositories:**
- `crucible` - Mark as mirror/deployment target in README
- Any other repos - Clearly document their role vs. `synthesis-engine`

**Rule:** All new routes MUST be developed in `synthesis-engine` first, then ported to deployment targets if needed.

---

## Audit Trail

| Date | Policy Change | Commit | Author |
|------|---------------|--------|--------|
| 2026-02-07 | Policy created (v1.0.0) | _pending_ | @gemini |
