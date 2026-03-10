# Route Registry

**Last Updated:** 2026-03-10  
**Registry Version:** 1.1.0

## Purpose

This registry tracks all application routes in `synthesis-engine` to prevent architectural drift, orphaned commits, and undocumented route changes.

---

## Active Routes

### App Routes

| Route | Status | Owner | First Commit | Last Verified | Purpose |
|-------|--------|-------|--------------|---------------|---------|
| `/` | `active` | @Lesz-Xi | `7529022` | 2026-03-10 | Marketing landing page with the current multi-section MASA narrative and conversion flow |
| `/benchmarks` | `active` | @Lesz-Xi | `e9b3352` | 2026-03-10 | Benchmarking dashboard for governance and cost/run analysis workflows |
| `/chat` | `active` | @Lesz-Xi | `4714ae4` | 2026-03-10 | Primary MASA causal workbench and evidence-first chat interface |
| `/claims/[claimId]` | `active` | @Lesz-Xi | `890f7a1` | 2026-03-10 | Individual claim detail view with provenance and evidence context |
| `/education` | `active` | @Lesz-Xi | `4714ae4` | 2026-03-10 | Education planning and intervention optimization workspace |
| `/epistemic` | `active` | @Lesz-Xi | `564ffa1` | 2026-03-10 | Epistemic audit dashboard for evidence validation and scientific posture review |
| `/hybrid` | `active` | @Lesz-Xi | `779e783` | 2026-03-10 | Hybrid synthesis workspace for document-driven causal analysis |
| `/lab` | `active` | @Lesz-Xi | `a6318ca` | 2026-03-10 | Lab environment for docking, copilot tools, and structured report analysis |
| `/legal` | `active` | @Lesz-Xi | `4714ae4` | 2026-03-10 | Legal reasoning workspace for intervention-gated causation analysis |
| `/pdf-synthesis` | `active` | @Lesz-Xi | `779e783` | 2026-03-10 | Legacy PDF synthesis surface retained for compatibility and focused document analysis |

---

### API Routes

| Route | Status | Owner | First Commit | Last Verified | Purpose |
|-------|--------|-------|--------------|---------------|---------|
| `/api/legal-reasoning` | `active` | @Lesz-Xi | `4714ae4` | 2026-03-10 | Legal causation analysis route; verified on `4a4637d` for batched but-for fallback and degradation-safe intervention gating |

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
4. For API route changes (`src/app/**/route.ts`), update the relevant entry in **Active API Routes**

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
| 2026-03-10 | Backfilled current app route surface and verified `/api/legal-reasoning` fallback route change for PR #10 | `4a4637d` | @Lesz-Xi |
| 2026-02-07 | Registry created with 4 active routes | _pending_ | @gemini |
