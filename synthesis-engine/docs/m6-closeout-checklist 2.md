# M6 Closeout Checklist

This checklist defines when Milestone M6 is considered complete in operations, not only implemented in code.

## Scope
- Target workflow: `M6 Benchmark Health Check`
- Target branch: `main`
- Window rule: `7` consecutive successful completed runs
- Accepted events: `schedule`, `workflow_dispatch`

## Required Evidence
- [ ] `M6 Benchmark Health Check` is green in a meaningful mode.
- [ ] No `noOp=true` result in the latest closeout window.
- [ ] No `degradedMode=true` result in the latest closeout window.
- [ ] Scientific integrity checklist remains pass in promotion outputs.
- [ ] Deterministic trace provenance checks remain pass.
- [ ] Hypothesis lifecycle auditability remains pass.

## Automation
- Workflow: `.github/workflows/m6-closeout-tracker.yml`
- Output: GitHub Step Summary on each run
- Gate behavior: tracker fails until the consecutive-pass window is satisfied

## Operational Runbook
1. Trigger health check manually if needed:
   - `gh workflow run "M6 Benchmark Health Check" --repo Lesz-Xi/crucible`
2. Monitor latest runs:
   - `gh run list --workflow m6-health-check.yml --repo Lesz-Xi/crucible`
3. Trigger closeout tracker:
   - `gh workflow run "M6 Closeout Tracker" --repo Lesz-Xi/crucible`
4. Verify tracker summary:
   - `gh run view <run-id> --repo Lesz-Xi/crucible --log`

## Exit Decision
- M6 is operationally closed only when the tracker reports:
  - `closeout_ready=true`
  - consecutive successful runs >= required window

## Critical Gap Notes
- External dependency: GitHub Actions availability.
- Manual action: repository secrets must remain valid for benchmark run steps.
- If secrets rotate or expire, rerun M6 health check after updating secrets.
