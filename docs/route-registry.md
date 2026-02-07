# Route Registry

**Last Updated:** 2026-02-07  
**Registry Version:** 1.0.0

## Purpose

This registry tracks all application routes in `synthesis-engine` to prevent architectural drift, orphaned commits, and undocumented route changes.

---

## Active Routes

| Route | Status | Owner | First Commit | Last Verified | Purpose |
|-------|--------|-------|--------------|---------------|---------|
| `/` | `active` | @gemini | `fd73053` | 2026-02-07 | Landing page with Wabi-Sabi design, showcases MASA features |
| `/hybrid` | `active` | @gemini | `9a6e082` | 2026-02-07 | Hybrid Synthesis UI with causal graphs, metacognition dashboard |
| `/epistemic` | `active` | @gemini | `564ffa1` | 2026-02-07 | Epistemic Audit dashboard for automated scientist validation |
| `/pdf-synthesis` | `active` | @gemini | `a04d4e6` | 2026-02-07 | PDF analysis and causal synthesis interface |

---

## Deprecated Routes

| Route | Deprecated Date | Reason | Migration Path |
|-------|-----------------|--------|----------------|
| _None_ | - | - | - |

---

## Experimental Routes

| Route | Status | Owner | First Commit | Expected Completion | Purpose |
|-------|--------|-------|--------------|---------------------|---------|
| _None_ | - | - | - | - | - |

---

## Route Metadata Schema

Each route must include:

- **Route**: URL path (e.g., `/hybrid`)
- **Status**: `active` | `deprecated` | `experimental`
- **Owner**: GitHub username or team (e.g., `@gemini`)
- **First Commit**: SHA of commit that introduced this route
- **Last Verified**: Date route was last verified to be working
- **Purpose**: Brief description of route functionality

---

## Change Protocol

### Adding a Route

1. Add route entry to **Experimental Routes** section
2. Create PR with route implementation
3. Include route in PR checklist
4. After merge, move to **Active Routes**

### Deprecating a Route

1. Move route from **Active Routes** to **Deprecated Routes**
2. Add deprecation date and reason
3. Provide migration path for users
4. Remove route code after 30-day deprecation period

### Modifying a Route

1. Update **Last Verified** date
2. If purpose changes significantly, update **Purpose** column
3. Link to PR that made the change

---

## CI Integration

This registry is enforced by:

- **Pre-merge Route Diff Check** (`.github/workflows/route-diff-check.yml`)
- **Nightly Route Snapshot** (`.github/workflows/route-snapshot.yml`)
- **Unreachable Commit Guard** (`.github/workflows/unreachable-commit-guard.yml`)

---

## Audit Trail

| Date | Change | Commit | Author |
|------|--------|--------|--------|
| 2026-02-07 | Registry created with 4 active routes | _pending_ | @gemini |
